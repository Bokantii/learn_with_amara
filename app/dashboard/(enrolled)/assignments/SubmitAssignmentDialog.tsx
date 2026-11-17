"use client";

import { useRef, useState, useTransition, type DragEvent } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "../../../../components/ui/dialog";
import {
  UploadCloud, FileText, FileImage, FileAudio, File as FileIcon, X, CheckCircle2,
  Clock, Award, Loader2, AlertCircle,
} from "lucide-react";
import { submitAssignmentAction } from "./actions";

export interface SubmitTarget {
  id: string;
  title: string;
  programName: string;
  groupName: string | null;
  dueDate: string;
  points: number;
  type: string;
}

// Server actions accept up to 10 MB (next.config.ts serverActions.bodySizeLimit);
// keep headroom for the multipart envelope.
const MAX_BYTES = 9 * 1024 * 1024;
const ACCEPT = ".pdf,.doc,.docx,.odt,.rtf,.txt,.ppt,.pptx,image/*,audio/*";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileKind(file: File): { Icon: typeof FileIcon; box: string; icon: string; label: string } {
  const type = file.type;
  const name = file.name.toLowerCase();
  if (type.startsWith("image/")) return { Icon: FileImage, box: "bg-violet-100", icon: "text-violet-600", label: "Image" };
  if (type.startsWith("audio/")) return { Icon: FileAudio, box: "bg-amber-100", icon: "text-amber-600", label: "Audio" };
  if (type === "application/pdf" || name.endsWith(".pdf")) return { Icon: FileText, box: "bg-red-100", icon: "text-red-600", label: "PDF" };
  if (/\.(docx?|odt|rtf|txt|pptx?)$/.test(name)) return { Icon: FileText, box: "bg-sky-100", icon: "text-sky-600", label: "Document" };
  return { Icon: FileIcon, box: "bg-slate-100", icon: "text-slate-600", label: "File" };
}

export default function SubmitAssignmentDialog({
  target,
  onClose,
}: {
  target: SubmitTarget | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={!!target} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        {/* Keyed so each assignment starts with a fresh form. */}
        {target && <SubmitForm key={target.id} target={target} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

function SubmitForm({ target, onClose }: { target: SubmitTarget; onClose: () => void }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  const choose = (picked: File | undefined | null) => {
    setError(null);
    if (!picked) return;
    if (picked.size === 0) {
      setError("That file is empty. Please choose another one.");
      return;
    }
    if (picked.size > MAX_BYTES) {
      setError(`That file is ${formatBytes(picked.size)}. The maximum is ${formatBytes(MAX_BYTES)}.`);
      return;
    }
    setFile(picked);
  };

  const clearFile = () => {
    setFile(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const onDrag = (e: DragEvent<HTMLLabelElement>, active: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isPending) setDragActive(active);
  };

  const onDrop = (e: DragEvent<HTMLLabelElement>) => {
    onDrag(e, false);
    if (isPending) return;
    choose(e.dataTransfer.files?.[0]);
  };

  const submit = () => {
    if (!file) {
      setError("Please choose a file to upload.");
      return;
    }
    setError(null);
    const formData = new FormData();
    formData.set("assignmentId", target.id);
    formData.set("file", file);
    startTransition(async () => {
      const result = await submitAssignmentAction(formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setDone(true);
      router.refresh();
    });
  };

  if (done && file) {
    return (
      <div className="flex flex-col items-center py-6 text-center" role="status" aria-live="polite">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 className="h-9 w-9 text-emerald-600" aria-hidden="true" />
        </div>
        <DialogTitle className="text-xl">Assignment submitted</DialogTitle>
        <DialogDescription className="mt-2 max-w-sm">
          <span className="font-medium text-slate-700">{file.name}</span> was uploaded for{" "}
          <span className="font-medium text-slate-700">{target.title}</span>. Your instructor will
          review it, and your grade will appear under <span className="font-medium">Submitted</span>.
        </DialogDescription>
        <Button className="mt-6 bg-sky-600 hover:bg-sky-700" onClick={onClose}>
          Done
        </Button>
      </div>
    );
  }

  const kind = file ? fileKind(file) : null;

  return (
    <>
      <DialogHeader>
        <DialogTitle className="pr-6">{target.title}</DialogTitle>
        <DialogDescription asChild>
          <div className="flex flex-wrap items-center gap-2 pt-1 text-sm text-slate-600">
            <Badge className="bg-sky-100 text-sky-700 hover:bg-sky-100">{target.programName}</Badge>
            {target.groupName && (
              <Badge className="bg-violet-100 text-violet-700 hover:bg-violet-100">{target.groupName}</Badge>
            )}
            <span className="inline-flex items-center gap-1">
              <Clock className="h-4 w-4 text-sky-500" aria-hidden="true" />
              Due {target.dueDate}
            </span>
            <span className="inline-flex items-center gap-1">
              <Award className="h-4 w-4 text-amber-500" aria-hidden="true" />
              {target.points} points
            </span>
          </div>
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-3">
        <input
          ref={inputRef}
          id="submission-file"
          type="file"
          accept={ACCEPT}
          className="sr-only"
          disabled={isPending}
          onChange={(e) => choose(e.target.files?.[0])}
        />

        {!file ? (
          <label
            htmlFor="submission-file"
            onDragEnter={(e) => onDrag(e, true)}
            onDragOver={(e) => onDrag(e, true)}
            onDragLeave={(e) => onDrag(e, false)}
            onDrop={onDrop}
            className={`group flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors focus-within:ring-2 focus-within:ring-sky-500 focus-within:ring-offset-2 ${
              dragActive
                ? "border-sky-500 bg-sky-50"
                : "border-slate-300 bg-slate-50 hover:border-sky-400 hover:bg-sky-50/60"
            }`}
          >
            <div
              className={`mb-3 flex h-14 w-14 items-center justify-center rounded-full transition-transform ${
                dragActive ? "scale-110 bg-sky-500" : "bg-white shadow-sm group-hover:scale-105"
              }`}
            >
              <UploadCloud className={`h-7 w-7 ${dragActive ? "text-white" : "text-sky-500"}`} aria-hidden="true" />
            </div>
            <p className="font-medium text-slate-900">
              {dragActive ? "Drop your file here" : "Drag and drop your work here"}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              or <span className="font-medium text-sky-600 underline-offset-2 group-hover:underline">browse your files</span>
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1"><FileText className="h-3.5 w-3.5 text-red-500" aria-hidden="true" />PDF</span>
              <span className="inline-flex items-center gap-1"><FileText className="h-3.5 w-3.5 text-sky-500" aria-hidden="true" />Document</span>
              <span className="inline-flex items-center gap-1"><FileImage className="h-3.5 w-3.5 text-violet-500" aria-hidden="true" />Image</span>
              <span className="inline-flex items-center gap-1"><FileAudio className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />Audio</span>
              <span>· up to {formatBytes(MAX_BYTES)}</span>
            </div>
          </label>
        ) : (
          kind && (
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg ${kind.box}`}>
                  <kind.Icon className={`h-6 w-6 ${kind.icon}`} aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-900" title={file.name}>{file.name}</p>
                  <p className="text-sm text-slate-500">
                    {kind.label} · {formatBytes(file.size)}
                  </p>
                </div>
                {isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin text-sky-500" aria-hidden="true" />
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={clearFile}
                    aria-label={`Remove ${file.name}`}
                    className="text-slate-500 hover:text-slate-900"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="mt-3" aria-live="polite">
                {isPending ? (
                  <>
                    <div
                      className="h-2 w-full overflow-hidden rounded-full bg-slate-100"
                      role="progressbar"
                      aria-label={`Uploading ${file.name}`}
                    >
                      <div className="h-full w-2/5 rounded-full bg-gradient-to-r from-sky-500 to-cyan-400 animate-[upload-indeterminate_1.2s_ease-in-out_infinite] motion-reduce:w-full motion-reduce:animate-pulse" />
                    </div>
                    <p className="mt-2 text-xs text-slate-500">Uploading securely… please keep this window open.</p>
                  </>
                ) : (
                  <p className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Ready to submit
                  </p>
                )}
              </div>
            </div>
          )
        )}

        {error && (
          <p className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
            {error}
          </p>
        )}

        <p className="text-xs text-slate-500">
          You can submit once. Make sure this is your final version.
        </p>
      </div>

      <DialogFooter className="gap-2 sm:gap-0">
        <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
          Cancel
        </Button>
        <Button
          type="button"
          onClick={submit}
          disabled={!file || isPending}
          className="bg-gradient-to-r from-sky-500 to-cyan-500 text-white hover:from-sky-600 hover:to-cyan-600"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              Uploading…
            </>
          ) : (
            <>
              <UploadCloud className="mr-2 h-4 w-4" aria-hidden="true" />
              Submit Assignment
            </>
          )}
        </Button>
      </DialogFooter>
    </>
  );
}
