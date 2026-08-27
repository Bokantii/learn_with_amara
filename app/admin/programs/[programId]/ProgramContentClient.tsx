"use client";

import { useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "../../../../components/ui/card";
import { Button } from "../../../../components/ui/button";
import { Badge } from "../../../../components/ui/badge";
import { Input } from "../../../../components/ui/input";
import { Label } from "../../../../components/ui/label";
import { Textarea } from "../../../../components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "../../../../components/ui/dialog";
import {
  ArrowLeft, Plus, Pencil, Archive, ArchiveRestore, ChevronUp, ChevronDown,
  Eye, EyeOff, FolderOpen, Trash2, FileText,
} from "lucide-react";
import {
  createModuleAction, updateModuleAction, setModuleActiveAction, reorderModuleAction,
  createLessonAction, updateLessonAction, setLessonPublishedAction, reorderLessonAction,
  createLessonResourceAction, deleteLessonResourceAction,
} from "./actions";

interface ResourceRow {
  id: string;
  type: string;
  title: string;
  url: string;
}

interface LessonRow {
  id: string;
  title: string;
  description: string | null;
  order: number;
  durationMinutes: number | null;
  videoUrl: string | null;
  published: boolean;
  resources: ResourceRow[];
}

interface ModuleRow {
  id: string;
  title: string;
  description: string | null;
  order: number;
  active: boolean;
  lessons: LessonRow[];
}

export default function ProgramContentClient({
  program,
  initialModules,
}: {
  program: { id: string; name: string };
  initialModules: ModuleRow[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const modules = initialModules;

  const [isAddModuleOpen, setIsAddModuleOpen] = useState(false);
  const [editModule, setEditModule] = useState<ModuleRow | null>(null);
  const [addLessonToModuleId, setAddLessonToModuleId] = useState<string | null>(null);
  const [editLesson, setEditLesson] = useState<LessonRow | null>(null);
  const [manageResourcesLesson, setManageResourcesLesson] = useState<LessonRow | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [moduleTitle, setModuleTitle] = useState("");
  const [moduleDescription, setModuleDescription] = useState("");
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonDescription, setLessonDescription] = useState("");
  const [lessonDuration, setLessonDuration] = useState("");
  const [lessonVideoUrl, setLessonVideoUrl] = useState("");
  const [resourceType, setResourceType] = useState("link");
  const [resourceTitle, setResourceTitle] = useState("");
  const [resourceUrl, setResourceUrl] = useState("");

  const refresh = () => router.refresh();

  const handleCreateModule = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createModuleAction({
        programId: program.id,
        title: moduleTitle,
        description: moduleDescription,
      });
      if (result.serverError || result.validationErrors) {
        setError(result.serverError ?? "Please check the form and try again.");
        return;
      }
      setModuleTitle("");
      setModuleDescription("");
      setIsAddModuleOpen(false);
      refresh();
    });
  };

  const handleUpdateModule = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editModule) return;
    setError(null);
    startTransition(async () => {
      const result = await updateModuleAction({
        moduleId: editModule.id,
        title: moduleTitle,
        description: moduleDescription,
      });
      if (result.serverError || result.validationErrors) {
        setError(result.serverError ?? "Please check the form and try again.");
        return;
      }
      setEditModule(null);
      refresh();
    });
  };

  const handleToggleModuleActive = (mod: ModuleRow) => {
    startTransition(async () => {
      await setModuleActiveAction({ moduleId: mod.id, active: !mod.active });
      refresh();
    });
  };

  const handleReorderModule = (moduleId: string, direction: "up" | "down") => {
    startTransition(async () => {
      await reorderModuleAction({ moduleId, direction });
      refresh();
    });
  };

  const handleCreateLesson = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!addLessonToModuleId) return;
    setError(null);
    startTransition(async () => {
      const result = await createLessonAction({
        moduleId: addLessonToModuleId,
        title: lessonTitle,
        description: lessonDescription,
        durationMinutes: lessonDuration ? Number(lessonDuration) : undefined,
        videoUrl: lessonVideoUrl,
      });
      if (result.serverError || result.validationErrors) {
        setError(result.serverError ?? "Please check the form and try again.");
        return;
      }
      setLessonTitle("");
      setLessonDescription("");
      setLessonDuration("");
      setLessonVideoUrl("");
      setAddLessonToModuleId(null);
      refresh();
    });
  };

  const handleUpdateLesson = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editLesson) return;
    setError(null);
    startTransition(async () => {
      const result = await updateLessonAction({
        lessonId: editLesson.id,
        title: lessonTitle,
        description: lessonDescription,
        durationMinutes: lessonDuration ? Number(lessonDuration) : undefined,
        videoUrl: lessonVideoUrl,
      });
      if (result.serverError || result.validationErrors) {
        setError(result.serverError ?? "Please check the form and try again.");
        return;
      }
      setEditLesson(null);
      refresh();
    });
  };

  const handleTogglePublished = (lesson: LessonRow) => {
    startTransition(async () => {
      await setLessonPublishedAction({ lessonId: lesson.id, published: !lesson.published });
      refresh();
    });
  };

  const handleReorderLesson = (lessonId: string, direction: "up" | "down") => {
    startTransition(async () => {
      await reorderLessonAction({ lessonId, direction });
      refresh();
    });
  };

  const handleAddResource = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!manageResourcesLesson) return;
    setError(null);
    startTransition(async () => {
      const result = await createLessonResourceAction({
        lessonId: manageResourcesLesson.id,
        type: resourceType,
        title: resourceTitle,
        url: resourceUrl,
      });
      if (result.serverError || result.validationErrors) {
        setError(result.serverError ?? "Please check the form and try again.");
        return;
      }
      setResourceTitle("");
      setResourceUrl("");
      refresh();
    });
  };

  const handleDeleteResource = (resourceId: string) => {
    startTransition(async () => {
      await deleteLessonResourceAction({ resourceId });
      refresh();
    });
  };

  return (
    <div className="space-y-4 md:space-y-6 px-2 sm:px-0">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/programs">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Programs
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{program.name}</h1>
          <p className="text-sm text-slate-500 mt-1">Manage modules and lessons</p>
        </div>
        <Dialog open={isAddModuleOpen} onOpenChange={setIsAddModuleOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white hover:from-violet-600 hover:to-fuchsia-600"
              onClick={() => {
                setModuleTitle("");
                setModuleDescription("");
                setError(null);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Module
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Module</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateModule} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="moduleTitle">Title</Label>
                <Input id="moduleTitle" value={moduleTitle} onChange={(e) => setModuleTitle(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="moduleDescription">Description</Label>
                <Textarea id="moduleDescription" value={moduleDescription} onChange={(e) => setModuleDescription(e.target.value)} />
              </div>
              {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
              <DialogFooter>
                <Button type="submit" className="bg-violet-600 hover:bg-violet-700" disabled={isPending}>
                  {isPending ? "Adding..." : "Add Module"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {modules.length === 0 && (
        <Card className="p-8 text-center text-slate-500">No modules yet.</Card>
      )}

      <div className="space-y-4">
        {modules.map((mod, modIndex) => (
          <Card key={mod.id} className="p-4 md:p-6">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-start gap-2 min-w-0">
                <FolderOpen className="w-5 h-5 text-violet-500 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-slate-900">{mod.title}</h3>
                    <Badge
                      variant="secondary"
                      className={mod.active ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-50" : "bg-slate-100 text-slate-600 hover:bg-slate-100"}
                    >
                      {mod.active ? "active" : "archived"}
                    </Badge>
                  </div>
                  {mod.description && <p className="text-sm text-slate-500 mt-1">{mod.description}</p>}
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button variant="outline" size="sm" aria-label={`Move ${mod.title} up`} disabled={modIndex === 0 || isPending} onClick={() => handleReorderModule(mod.id, "up")}>
                  <ChevronUp className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" aria-label={`Move ${mod.title} down`} disabled={modIndex === modules.length - 1 || isPending} onClick={() => handleReorderModule(mod.id, "down")}>
                  <ChevronDown className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  aria-label={`Edit ${mod.title}`}
                  onClick={() => {
                    setModuleTitle(mod.title);
                    setModuleDescription(mod.description ?? "");
                    setError(null);
                    setEditModule(mod);
                  }}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  aria-label={mod.active ? `Archive ${mod.title}` : `Restore ${mod.title}`}
                  className={mod.active ? "border-amber-300 text-amber-600 hover:bg-amber-50" : "border-emerald-300 text-emerald-600 hover:bg-emerald-50"}
                  onClick={() => handleToggleModuleActive(mod)}
                  disabled={isPending}
                >
                  {mod.active ? <Archive className="w-4 h-4" /> : <ArchiveRestore className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2 pl-7">
              {mod.lessons.map((lesson, lessonIndex) => (
                <div key={lesson.id} className="flex items-center justify-between gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm text-slate-900">{lesson.title}</span>
                      <Badge
                        variant="secondary"
                        className={lesson.published ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-50" : "bg-slate-100 text-slate-600 hover:bg-slate-100"}
                      >
                        {lesson.published ? "published" : "draft"}
                      </Badge>
                      {lesson.durationMinutes && (
                        <span className="text-xs text-slate-500">{lesson.durationMinutes} min</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button variant="outline" size="sm" aria-label={`Move ${lesson.title} up`} disabled={lessonIndex === 0 || isPending} onClick={() => handleReorderLesson(lesson.id, "up")}>
                      <ChevronUp className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" aria-label={`Move ${lesson.title} down`} disabled={lessonIndex === mod.lessons.length - 1 || isPending} onClick={() => handleReorderLesson(lesson.id, "down")}>
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      aria-label={`Edit ${lesson.title}`}
                      onClick={() => {
                        setLessonTitle(lesson.title);
                        setLessonDescription(lesson.description ?? "");
                        setLessonDuration(lesson.durationMinutes ? String(lesson.durationMinutes) : "");
                        setLessonVideoUrl(lesson.videoUrl ?? "");
                        setError(null);
                        setEditLesson(lesson);
                      }}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      aria-label={`Manage resources for ${lesson.title}`}
                      onClick={() => setManageResourcesLesson(lesson)}
                    >
                      <FileText className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      aria-label={lesson.published ? `Unpublish ${lesson.title}` : `Publish ${lesson.title}`}
                      className={lesson.published ? "border-amber-300 text-amber-600 hover:bg-amber-50" : "border-emerald-300 text-emerald-600 hover:bg-emerald-50"}
                      onClick={() => handleTogglePublished(lesson)}
                      disabled={isPending}
                    >
                      {lesson.published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              ))}

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setLessonTitle("");
                  setLessonDescription("");
                  setLessonDuration("");
                  setLessonVideoUrl("");
                  setError(null);
                  setAddLessonToModuleId(mod.id);
                }}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Lesson
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Edit Module */}
      <Dialog open={!!editModule} onOpenChange={(open) => !open && setEditModule(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Module</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateModule} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editModuleTitle">Title</Label>
              <Input id="editModuleTitle" value={moduleTitle} onChange={(e) => setModuleTitle(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editModuleDescription">Description</Label>
              <Textarea id="editModuleDescription" value={moduleDescription} onChange={(e) => setModuleDescription(e.target.value)} />
            </div>
            {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setEditModule(null)}>Cancel</Button>
              <Button type="submit" className="bg-violet-600 hover:bg-violet-700" disabled={isPending}>
                {isPending ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Lesson */}
      <Dialog open={!!addLessonToModuleId} onOpenChange={(open) => !open && setAddLessonToModuleId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Lesson</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateLesson} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="lessonTitle">Title</Label>
              <Input id="lessonTitle" value={lessonTitle} onChange={(e) => setLessonTitle(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lessonDescription">Description</Label>
              <Textarea id="lessonDescription" value={lessonDescription} onChange={(e) => setLessonDescription(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lessonDuration">Duration (minutes)</Label>
              <Input id="lessonDuration" type="number" min={1} value={lessonDuration} onChange={(e) => setLessonDuration(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lessonVideoUrl">Video URL</Label>
              <Input id="lessonVideoUrl" type="url" placeholder="https://..." value={lessonVideoUrl} onChange={(e) => setLessonVideoUrl(e.target.value)} />
            </div>
            {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
            <DialogFooter>
              <Button type="submit" className="bg-violet-600 hover:bg-violet-700" disabled={isPending}>
                {isPending ? "Adding..." : "Add Lesson"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Lesson */}
      <Dialog open={!!editLesson} onOpenChange={(open) => !open && setEditLesson(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Lesson</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateLesson} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editLessonTitle">Title</Label>
              <Input id="editLessonTitle" value={lessonTitle} onChange={(e) => setLessonTitle(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editLessonDescription">Description</Label>
              <Textarea id="editLessonDescription" value={lessonDescription} onChange={(e) => setLessonDescription(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editLessonDuration">Duration (minutes)</Label>
              <Input id="editLessonDuration" type="number" min={1} value={lessonDuration} onChange={(e) => setLessonDuration(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editLessonVideoUrl">Video URL</Label>
              <Input id="editLessonVideoUrl" type="url" placeholder="https://..." value={lessonVideoUrl} onChange={(e) => setLessonVideoUrl(e.target.value)} />
            </div>
            {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setEditLesson(null)}>Cancel</Button>
              <Button type="submit" className="bg-violet-600 hover:bg-violet-700" disabled={isPending}>
                {isPending ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Manage Resources */}
      <Dialog open={!!manageResourcesLesson} onOpenChange={(open) => !open && setManageResourcesLesson(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resources — {manageResourcesLesson?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {manageResourcesLesson?.resources.length === 0 && (
              <p className="text-sm text-slate-500">No resources yet.</p>
            )}
            {manageResourcesLesson?.resources.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-2 text-sm">
                <div className="min-w-0">
                  <span className="font-medium text-slate-900">{r.title}</span>
                  <span className="text-slate-400 ml-2">({r.type})</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  aria-label={`Delete ${r.title}`}
                  className="border-red-300 text-red-600 hover:bg-red-50 flex-shrink-0"
                  onClick={() => handleDeleteResource(r.id)}
                  disabled={isPending}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}

            <form onSubmit={handleAddResource} className="space-y-3 pt-3 border-t border-slate-200">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="resourceType">Type</Label>
                  <Input id="resourceType" value={resourceType} onChange={(e) => setResourceType(e.target.value)} placeholder="link, pdf..." required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="resourceTitle">Title</Label>
                  <Input id="resourceTitle" value={resourceTitle} onChange={(e) => setResourceTitle(e.target.value)} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="resourceUrl">URL</Label>
                <Input id="resourceUrl" type="url" value={resourceUrl} onChange={(e) => setResourceUrl(e.target.value)} placeholder="https://..." required />
              </div>
              {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
              <Button type="submit" size="sm" disabled={isPending}>
                {isPending ? "Adding..." : "Add Resource"}
              </Button>
            </form>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setManageResourcesLesson(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
