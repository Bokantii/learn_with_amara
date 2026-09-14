"use client";

import { useEffect, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Card } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "../../../components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "../../../components/ui/dialog";
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogFooter,
  AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel,
} from "../../../components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../../../components/ui/select";
import { UserPlus, Archive, ArchiveRestore, Send, Trash2 } from "lucide-react";
import { AccountStatusBadge, type AccountStatus } from "../../../components/AccountStatusBadge";
import { InviteLinkPanel } from "../../../components/InviteLinkPanel";
import {
  inviteStaffAction, setStaffDeactivatedAction, resendStaffInviteAction, revokeStaffInviteAction,
} from "./actions";

type StaffRole = "ADMIN" | "INSTRUCTOR";

interface StaffRow {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  status: AccountStatus;
  joinedDate: string;
}

const ROLE_LABEL: Record<StaffRole, string> = {
  ADMIN: "Admin",
  INSTRUCTOR: "Instructor",
};

export default function StaffClient({
  initialStaff,
  currentAdminId,
}: {
  initialStaff: StaffRow[];
  currentAdminId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [staff, setStaff] = useState(initialStaff);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteLinks, setInviteLinks] = useState<Record<string, string>>({});

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<StaffRole>("INSTRUCTOR");

  useEffect(() => {
    setStaff(initialStaff);
  }, [initialStaff]);

  const handleInvite = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await inviteStaffAction({ name, email, role });
      if (result.serverError || result.validationErrors) {
        setError(result.serverError ?? "Please check the form and try again.");
        return;
      }
      const data = result.data;
      if (data && !data.inviteEmailSent && data.inviteUrl) {
        setInviteLinks((prev) => ({ ...prev, [data.userId]: data.inviteUrl! }));
      }
      setName("");
      setEmail("");
      setRole("INSTRUCTOR");
      setIsInviteOpen(false);
      router.refresh();
    });
  };

  const handleSetDeactivated = (member: StaffRow, deactivated: boolean) => {
    setError(null);
    startTransition(async () => {
      const result = await setStaffDeactivatedAction({ userId: member.id, deactivated });
      if (result.serverError) {
        setError(result.serverError);
        return;
      }
      router.refresh();
    });
  };

  const handleResendInvite = (member: StaffRow) => {
    setError(null);
    startTransition(async () => {
      const result = await resendStaffInviteAction({ userId: member.id });
      if (result.serverError) {
        setError(result.serverError);
        return;
      }
      const data = result.data;
      if (data && !data.inviteEmailSent && data.inviteUrl) {
        setInviteLinks((prev) => ({ ...prev, [member.id]: data.inviteUrl! }));
      }
      router.refresh();
    });
  };

  const handleRevokeInvite = (member: StaffRow) => {
    setError(null);
    startTransition(async () => {
      const result = await revokeStaffInviteAction({ userId: member.id });
      if (result.serverError) {
        setError(result.serverError);
        return;
      }
      setInviteLinks((prev) => {
        const next = { ...prev };
        delete next[member.id];
        return next;
      });
      router.refresh();
    });
  };

  return (
    <div className="space-y-4 md:space-y-6 px-2 sm:px-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Staff</h1>
          <p className="text-sm text-slate-500 mt-1">
            Provision and deactivate admin &amp; instructor accounts
          </p>
        </div>
        <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white hover:from-violet-600 hover:to-fuchsia-600">
              <UserPlus className="w-4 h-4 mr-2" />
              Invite Staff
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Staff</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleInvite} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="staffName">Name</Label>
                <Input id="staffName" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="staffEmail">Email</Label>
                <Input
                  id="staffEmail"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="staffRole">Role</Label>
                <Select value={role} onValueChange={(v) => setRole(v as StaffRole)}>
                  <SelectTrigger id="staffRole" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INSTRUCTOR">Instructor</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-slate-500">
                They get an email invite to set their password. The account is inactive until they
                accept it.
              </p>
              {error && (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              )}
              <DialogFooter>
                <Button type="submit" className="bg-violet-600 hover:bg-violet-700" disabled={isPending}>
                  {isPending ? "Sending..." : "Send Invite"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <InviteLinkPanel
        links={Object.fromEntries(
          Object.entries(inviteLinks).map(([id, url]) => [
            staff.find((s) => s.id === id)?.email ?? id,
            url,
          ])
        )}
      />

      {error && !isInviteOpen && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff.map((member) => (
                <TableRow
                  key={member.id}
                  className={member.status === "DEACTIVATED" ? "opacity-60" : undefined}
                >
                  <TableCell className="font-medium text-slate-900">
                    {member.name}
                    {member.id === currentAdminId && (
                      <span className="ml-2 text-xs text-slate-400">(you)</span>
                    )}
                  </TableCell>
                  <TableCell className="text-slate-500">{member.email}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-violet-50 text-violet-700 hover:bg-violet-50">
                      {ROLE_LABEL[member.role]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <AccountStatusBadge status={member.status} />
                  </TableCell>
                  <TableCell className="text-slate-500">{member.joinedDate}</TableCell>
                  <TableCell className="text-right space-x-2 whitespace-nowrap">
                    {member.status === "INVITED" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResendInvite(member)}
                          disabled={isPending}
                        >
                          <Send className="w-4 h-4 mr-1" />
                          Resend invite
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-red-300 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Revoke invite
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Revoke the invite for {member.name}?</AlertDialogTitle>
                              <AlertDialogDescription>
                                The unactivated {ROLE_LABEL[member.role].toLowerCase()} account for{" "}
                                {member.email} and its activation link will be removed.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleRevokeInvite(member)}>
                                Revoke invite
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
                    {member.status === "DEACTIVATED" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                        onClick={() => handleSetDeactivated(member, false)}
                        disabled={isPending}
                      >
                        <ArchiveRestore className="w-4 h-4 mr-1" />
                        Reactivate
                      </Button>
                    )}
                    {member.status === "ACTIVE" &&
                      (member.id === currentAdminId ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-red-300 text-red-600 hover:bg-red-50"
                        disabled
                        title="You can't deactivate your own account"
                      >
                        <Archive className="w-4 h-4 mr-1" />
                        Deactivate
                      </Button>
                    ) : (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-red-300 text-red-600 hover:bg-red-50"
                          >
                            <Archive className="w-4 h-4 mr-1" />
                            Deactivate
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Deactivate {member.name}?</AlertDialogTitle>
                            <AlertDialogDescription>
                              {member.name} will immediately lose {ROLE_LABEL[member.role]} access and
                              can no longer sign in. Their account and any records are kept, and you
                              can reactivate it later.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleSetDeactivated(member, true)}>
                              Deactivate
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      ))}
                  </TableCell>
                </TableRow>
              ))}
              {staff.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-slate-500 py-8">
                    No staff accounts yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

    </div>
  );
}
