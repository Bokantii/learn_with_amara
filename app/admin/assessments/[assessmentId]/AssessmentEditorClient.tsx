'use client';

import { useState, useTransition, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Textarea } from '../../../../components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '../../../../components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../../../../components/ui/select';
import { ArrowLeft, ChevronUp, ChevronDown, Pencil, Plus, Trash2, Check } from 'lucide-react';
import {
  updateQuestionAction, createQuestionAction, setQuestionActiveAction, reorderQuestionAction,
  addOptionAction, updateOptionAction, deleteOptionAction,
} from '../actions';

type QType = 'SINGLE_CHOICE' | 'SHORT_TEXT' | 'ESSAY';
type Skill = 'GRAMMAR' | 'VOCABULARY' | 'READING' | 'LISTENING' | 'WRITING' | 'SPEAKING';
type Cefr = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

interface OptionRow { id: string; text: string; isCorrect: boolean; order: number }
interface QuestionRow {
  id: string;
  type: QType;
  skill: Skill;
  cefrLevel: Cefr | null;
  order: number;
  active: boolean;
  prompt: string;
  explanation: string | null;
  maxPoints: number | null;
  options: OptionRow[];
}
interface Assessment {
  id: string;
  type: string;
  title: string;
  description: string | null;
  status: string;
  programId: string | null;
  questionCount: number | null;
  passPercentage: number | null;
  questions: QuestionRow[];
}

const SKILLS: Skill[] = ['GRAMMAR', 'VOCABULARY', 'READING', 'LISTENING', 'WRITING', 'SPEAKING'];
const CEFRS: Cefr[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export default function AssessmentEditorClient({
  assessment,
}: {
  programs: { id: string; name: string }[];
  assessment: Assessment;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [editQuestion, setEditQuestion] = useState<QuestionRow | null>(null);

  const run = (fn: () => Promise<{ serverError?: string; validationErrors?: unknown } | undefined>) => {
    setError(null);
    startTransition(async () => {
      const result = await fn();
      if (result?.serverError || result?.validationErrors) {
        setError(result?.serverError ?? 'Something went wrong.');
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="space-y-4 md:space-y-6 px-2 sm:px-0">
      <Button variant="outline" size="sm" asChild>
        <Link href="/admin/assessments">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Assessments
        </Link>
      </Button>

      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-2xl font-bold text-slate-900">{assessment.title}</h1>
          <Badge variant="secondary" className="bg-slate-100 text-slate-700 text-xs">{assessment.type}</Badge>
          <Badge className="bg-slate-100 text-slate-600 text-xs">{assessment.status}</Badge>
        </div>
        {assessment.description && (
          <p className="text-sm text-slate-500 mt-1">{assessment.description}</p>
        )}
        <p className="text-xs text-slate-400 mt-1">
          Draws {assessment.questionCount ?? 'all'} question(s) per attempt.
        </p>
      </div>

      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}

      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-slate-900">Questions ({assessment.questions.length})</h2>
        <Button
          className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white hover:from-violet-600 hover:to-fuchsia-600"
          onClick={() => { setError(null); setAddOpen(true); }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Question
        </Button>
      </div>

      {assessment.questions.length === 0 ? (
        <Card className="p-8 text-center text-slate-500">No questions yet.</Card>
      ) : (
        <div className="space-y-3">
          {assessment.questions.map((q, i) => (
            <Card key={q.id} className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex flex-col gap-1">
                  <Button
                    variant="outline" size="sm" aria-label={`Move question ${i + 1} up`}
                    disabled={i === 0 || isPending}
                    onClick={() => run(() => reorderQuestionAction({ questionId: q.id, direction: 'up' }))}
                  >
                    <ChevronUp className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline" size="sm" aria-label={`Move question ${i + 1} down`}
                    disabled={i === assessment.questions.length - 1 || isPending}
                    onClick={() => run(() => reorderQuestionAction({ questionId: q.id, direction: 'down' }))}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <Badge variant="secondary" className="bg-slate-100 text-slate-700">{q.type}</Badge>
                    <Badge variant="secondary" className="bg-slate-100 text-slate-700">{q.skill}</Badge>
                    {q.cefrLevel && <Badge variant="secondary" className="bg-sky-100 text-sky-700">{q.cefrLevel}</Badge>}
                    {!q.active && <Badge className="bg-amber-100 text-amber-800">inactive</Badge>}
                  </div>
                  <p className="text-sm text-slate-800 mt-2 whitespace-pre-line">{q.prompt}</p>

                  {q.type === 'SINGLE_CHOICE' && (
                    <OptionEditor questionId={q.id} options={q.options} isPending={isPending} run={run} />
                  )}
                  {q.type !== 'SINGLE_CHOICE' && (
                    <p className="text-xs text-slate-400 mt-2">Free text · max {q.maxPoints ?? 1} points · graded manually</p>
                  )}
                </div>
                <div className="flex flex-col gap-1 flex-shrink-0">
                  <Button variant="outline" size="sm" aria-label={`Edit question ${i + 1}`} onClick={() => { setError(null); setEditQuestion(q); }}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline" size="sm"
                    onClick={() => run(() => setQuestionActiveAction({ questionId: q.id, active: !q.active }))}
                    disabled={isPending}
                  >
                    {q.active ? 'Hide' : 'Show'}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <QuestionDialog
        key={editQuestion?.id ?? 'new'}
        open={addOpen || !!editQuestion}
        question={editQuestion}
        assessmentId={assessment.id}
        isPending={isPending}
        onClose={() => { setAddOpen(false); setEditQuestion(null); }}
        onDone={() => { setAddOpen(false); setEditQuestion(null); router.refresh(); }}
        setError={setError}
      />
    </div>
  );
}

function OptionEditor({
  questionId,
  options,
  isPending,
  run,
}: {
  questionId: string;
  options: OptionRow[];
  isPending: boolean;
  run: (fn: () => Promise<{ serverError?: string; validationErrors?: unknown } | undefined>) => void;
}) {
  const [newText, setNewText] = useState('');
  return (
    <div className="mt-3 space-y-1.5">
      {options.map((o) => (
        <div key={o.id} className="flex items-center gap-2 text-sm">
          <Button
            variant="outline"
            size="sm"
            aria-label={o.isCorrect ? 'Correct answer' : 'Mark as correct'}
            className={o.isCorrect ? 'border-emerald-400 text-emerald-600' : ''}
            disabled={isPending}
            onClick={() => run(() => updateOptionAction({ optionId: o.id, text: o.text, isCorrect: !o.isCorrect }))}
          >
            <Check className="w-3.5 h-3.5" />
          </Button>
          <span className={o.isCorrect ? 'font-medium text-emerald-700' : 'text-slate-700'}>{o.text}</span>
          <Button
            variant="ghost" size="sm" aria-label="Delete option" className="ml-auto text-red-500"
            disabled={isPending}
            onClick={() => run(() => deleteOptionAction({ optionId: o.id }))}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      ))}
      <form
        className="flex items-center gap-2 pt-1"
        onSubmit={(e) => {
          e.preventDefault();
          if (!newText.trim()) return;
          const text = newText;
          setNewText('');
          run(() => addOptionAction({ questionId, text, isCorrect: false }));
        }}
      >
        <Input value={newText} onChange={(e) => setNewText(e.target.value)} placeholder="Add an option…" className="h-8" />
        <Button type="submit" size="sm" variant="outline" disabled={isPending}>Add</Button>
      </form>
    </div>
  );
}

function QuestionDialog({
  open,
  question,
  assessmentId,
  isPending,
  onClose,
  onDone,
  setError,
}: {
  open: boolean;
  question: QuestionRow | null;
  assessmentId: string;
  isPending: boolean;
  onClose: () => void;
  onDone: () => void;
  setError: (v: string | null) => void;
}) {
  const [type, setType] = useState<QType>(question?.type ?? 'SINGLE_CHOICE');
  const [skill, setSkill] = useState<Skill>(question?.skill ?? 'GRAMMAR');
  const [cefrLevel, setCefrLevel] = useState<Cefr | 'none'>(question?.cefrLevel ?? 'none');
  const [prompt, setPrompt] = useState(question?.prompt ?? '');
  const [explanation, setExplanation] = useState(question?.explanation ?? '');
  const [maxPoints, setMaxPoints] = useState(String(question?.maxPoints ?? 5));

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const common = {
      type,
      skill,
      cefrLevel: cefrLevel === 'none' ? undefined : cefrLevel,
      prompt,
      explanation: explanation || undefined,
      maxPoints: type === 'SINGLE_CHOICE' ? undefined : Number(maxPoints) || 1,
    };
    (async () => {
      const result = question
        ? await updateQuestionAction({ questionId: question.id, ...common })
        : await createQuestionAction({ assessmentId, ...common });
      if (result?.serverError || result?.validationErrors) {
        setError(result?.serverError ?? 'Please check the form.');
        return;
      }
      onDone();
    })();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{question ? 'Edit question' : 'Add question'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="qType">Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as QType)}>
                <SelectTrigger id="qType"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="SINGLE_CHOICE">Single choice</SelectItem>
                  <SelectItem value="SHORT_TEXT">Short text</SelectItem>
                  <SelectItem value="ESSAY">Essay</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="qSkill">Skill</Label>
              <Select value={skill} onValueChange={(v) => setSkill(v as Skill)}>
                <SelectTrigger id="qSkill"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SKILLS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="qCefr">CEFR</Label>
              <Select value={cefrLevel} onValueChange={(v) => setCefrLevel(v as Cefr | 'none')}>
                <SelectTrigger id="qCefr"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  {CEFRS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="qPrompt">Prompt</Label>
            <Textarea id="qPrompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={3} required />
          </div>
          {type === 'SINGLE_CHOICE' ? (
            <div className="space-y-2">
              <Label htmlFor="qExpl">Explanation (shown on the result review)</Label>
              <Textarea id="qExpl" value={explanation} onChange={(e) => setExplanation(e.target.value)} rows={2} />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="qMax">Max points</Label>
              <Input id="qMax" type="number" min={1} value={maxPoints} onChange={(e) => setMaxPoints(e.target.value)} />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="bg-violet-600 hover:bg-violet-700" disabled={isPending}>
              {question ? 'Save' : 'Add'}
            </Button>
          </DialogFooter>
        </form>
        {type === 'SINGLE_CHOICE' && !question && (
          <p className="text-xs text-slate-500">Add the answer options after creating the question.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
