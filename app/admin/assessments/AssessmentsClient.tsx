'use client';

import { useState, useTransition, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from '../../../components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../../../components/ui/select';
import { Plus, FileQuestion } from 'lucide-react';
import { createAssessmentAction, setAssessmentStatusAction } from './actions';

type AssessmentType = 'PLACEMENT' | 'PRACTICE' | 'MOCK_EXAM';
type AssessmentStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

interface Row {
  id: string;
  type: AssessmentType;
  title: string;
  status: AssessmentStatus;
  programName: string | null;
  questionCount: number;
  attemptCount: number;
}

const STATUS_STYLE: Record<AssessmentStatus, string> = {
  DRAFT: 'bg-slate-100 text-slate-600',
  PUBLISHED: 'bg-emerald-100 text-emerald-700',
  ARCHIVED: 'bg-amber-100 text-amber-800',
};

export default function AssessmentsClient({
  initialAssessments,
  programs,
}: {
  initialAssessments: Row[];
  programs: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [type, setType] = useState<AssessmentType>('PRACTICE');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [programId, setProgramId] = useState('');
  const [questionCount, setQuestionCount] = useState('');
  const [passPercentage, setPassPercentage] = useState('');

  const resetForm = () => {
    setType('PRACTICE');
    setTitle('');
    setDescription('');
    setProgramId('');
    setQuestionCount('');
    setPassPercentage('');
    setError(null);
  };

  const handleCreate = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createAssessmentAction({
        type,
        title,
        description: description || undefined,
        programId: type === 'PRACTICE' ? programId || undefined : undefined,
        questionCount: questionCount ? Number(questionCount) : undefined,
        passPercentage: passPercentage ? Number(passPercentage) : undefined,
      });
      if (result?.serverError || result?.validationErrors || !result?.data) {
        setError(result?.serverError ?? 'Please check the form and try again.');
        return;
      }
      setIsCreateOpen(false);
      resetForm();
      router.push(`/admin/assessments/${result.data.assessmentId}`);
    });
  };

  const setStatus = (id: string, status: AssessmentStatus) => {
    setError(null);
    startTransition(async () => {
      const result = await setAssessmentStatusAction({ assessmentId: id, status });
      if (result?.serverError) {
        setError(result.serverError);
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="space-y-4 md:space-y-6 px-2 sm:px-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Assessments</h1>
          <p className="text-sm text-slate-500 mt-1">Placement, practice and diagnostic tests</p>
        </div>
        <Dialog
          open={isCreateOpen}
          onOpenChange={(open) => {
            setIsCreateOpen(open);
            if (open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white hover:from-violet-600 hover:to-fuchsia-600">
              <Plus className="w-4 h-4 mr-2" />
              New Assessment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>New Assessment</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="aType">Type</Label>
                <Select value={type} onValueChange={(v) => setType(v as AssessmentType)}>
                  <SelectTrigger id="aType" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PLACEMENT">Placement / diagnostic</SelectItem>
                    <SelectItem value="PRACTICE">Practice</SelectItem>
                    <SelectItem value="MOCK_EXAM">Mock exam (not yet takeable)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="aTitle">Title</Label>
                <Input id="aTitle" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="aDesc">Description</Label>
                <Textarea id="aDesc" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              {type === 'PRACTICE' && (
                <div className="space-y-2">
                  <Label htmlFor="aProgram">Program</Label>
                  <Select value={programId} onValueChange={setProgramId}>
                    <SelectTrigger id="aProgram" className="w-full">
                      <SelectValue placeholder="Choose a program" />
                    </SelectTrigger>
                    <SelectContent>
                      {programs.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="aCount">Questions per attempt</Label>
                  <Input
                    id="aCount"
                    type="number"
                    min={1}
                    placeholder="all"
                    value={questionCount}
                    onChange={(e) => setQuestionCount(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="aPass">Pass %</Label>
                  <Input
                    id="aPass"
                    type="number"
                    min={0}
                    max={100}
                    placeholder="optional"
                    value={passPercentage}
                    onChange={(e) => setPassPercentage(e.target.value)}
                  />
                </div>
              </div>
              {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
              <DialogFooter>
                <Button type="submit" className="bg-violet-600 hover:bg-violet-700" disabled={isPending}>
                  {isPending ? 'Creating…' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {error && !isCreateOpen && (
        <p className="text-sm text-destructive" role="alert">{error}</p>
      )}

      {initialAssessments.length === 0 ? (
        <Card className="p-8 text-center text-slate-500">No assessments yet.</Card>
      ) : (
        <div className="space-y-3">
          {initialAssessments.map((a) => (
            <Card key={a.id} className="p-4">
              <div className="flex items-start gap-3 flex-wrap">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                  <FileQuestion className="w-5 h-5" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link href={`/admin/assessments/${a.id}`} className="font-semibold text-slate-900 hover:underline">
                      {a.title}
                    </Link>
                    <Badge variant="secondary" className="bg-slate-100 text-slate-700 text-xs">
                      {a.type}
                    </Badge>
                    <Badge className={`${STATUS_STYLE[a.status]} text-xs`}>{a.status}</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {a.programName ? `${a.programName} · ` : ''}
                    {a.questionCount} question{a.questionCount === 1 ? '' : 's'} · {a.attemptCount} attempt
                    {a.attemptCount === 1 ? '' : 's'}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/assessments/${a.id}`}>Edit</Link>
                  </Button>
                  {a.status !== 'PUBLISHED' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-emerald-300 text-emerald-600 hover:bg-emerald-50"
                      disabled={isPending}
                      onClick={() => setStatus(a.id, 'PUBLISHED')}
                    >
                      Publish
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isPending}
                      onClick={() => setStatus(a.id, 'DRAFT')}
                    >
                      Unpublish
                    </Button>
                  )}
                  {a.status !== 'ARCHIVED' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-amber-300 text-amber-700 hover:bg-amber-50"
                      disabled={isPending}
                      onClick={() => setStatus(a.id, 'ARCHIVED')}
                    >
                      Archive
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
