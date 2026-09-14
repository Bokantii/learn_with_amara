import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "../../../components/ui/card";
import { PublicShell } from "../../../components/PublicShell";
import { resolveInviteToken } from "../../../lib/account/lifecycle";
import logo from "./../../../assets/logo.png";
import InviteForm from "./InviteForm";

export default async function InviteAcceptPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invite = await resolveInviteToken(token);

  return (
    <PublicShell>
      <div className="min-h-[80vh] flex items-center justify-center py-12 lg:py-20">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-md mx-auto">
            <Card className="border-2">
              <CardHeader className="p-8 space-y-2 text-center">
                <div className="flex justify-center mb-4">
                  <Image src={logo} className="w-18 h-18 object-contain" alt="ICLP Logo" />
                </div>
                <h2 className="text-3xl">Activate your account</h2>
                <p className="text-muted-foreground">
                  {invite
                    ? `Welcome, ${invite.name}. Choose a password for ${invite.email}.`
                    : "Set a password of at least 8 characters."}
                </p>
              </CardHeader>
              <CardContent className="p-8 pt-0 space-y-6">
                {invite ? (
                  <InviteForm token={token} />
                ) : (
                  <div className="space-y-4 text-center">
                    <p className="text-sm text-slate-600">
                      This invite link is invalid or has expired. Ask your administrator to send a
                      new one.
                    </p>
                    <Link className="text-primary hover:underline text-sm" href="/SignIn">
                      Back to sign in
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PublicShell>
  );
}
