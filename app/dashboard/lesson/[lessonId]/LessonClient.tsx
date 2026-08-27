"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Card } from "../../../../components/ui/card";
import { Button } from "../../../../components/ui/button";
import { Badge } from "../../../../components/ui/badge";
import { ArrowLeft, CheckCircle2, FileText, ExternalLink } from "lucide-react";
import { startLessonAction, completeLessonAction } from "./actions";

interface ResourceRow {
  id: string;
  type: string;
  title: string;
  url: string;
}

function toEmbedUrl(url: string): string | null {
  const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  if (youtubeMatch) return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
  if (url.includes("youtube.com/embed/")) return url;
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  return null;
}

export default function LessonClient({
  lessonId,
  courseId,
  videoUrl,
  resources,
  alreadyCompleted,
}: {
  lessonId: string;
  courseId: string;
  videoUrl: string | null;
  resources: ResourceRow[];
  alreadyCompleted: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [completed, setCompleted] = useState(alreadyCompleted);

  useEffect(() => {
    startLessonAction({ lessonId });
  }, [lessonId]);

  const handleComplete = () => {
    startTransition(async () => {
      const result = await completeLessonAction({ lessonId });
      if (!result.serverError) {
        setCompleted(true);
      }
    });
  };

  const embedUrl = videoUrl ? toEmbedUrl(videoUrl) : null;

  return (
    <div className="space-y-4 md:space-y-6 px-2 sm:px-0">
      <Button variant="outline" size="sm" asChild>
        <Link href={`/dashboard/course/${courseId}`}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Program
        </Link>
      </Button>

      {videoUrl && (
        <Card className="overflow-hidden">
          <div className="aspect-video bg-slate-900">
            {embedUrl ? (
              <iframe
                src={embedUrl}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video src={videoUrl} controls className="w-full h-full" />
            )}
          </div>
        </Card>
      )}

      {resources.length > 0 && (
        <Card className="p-4 md:p-6">
          <h3 className="font-bold text-base text-slate-900 mb-3">Resources</h3>
          <div className="space-y-2">
            {resources.map((r) => (
              <a
                key={r.id}
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200 hover:border-sky-300 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="text-sm font-medium text-slate-900 truncate">{r.title}</span>
                  <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-100 text-xs flex-shrink-0">
                    {r.type}
                  </Badge>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-400 flex-shrink-0" />
              </a>
            ))}
          </div>
        </Card>
      )}

      <div>
        {completed ? (
          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
            Completed
          </Badge>
        ) : (
          <Button
            onClick={handleComplete}
            disabled={isPending}
            className="bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            {isPending ? "Saving..." : "Mark as Complete"}
          </Button>
        )}
      </div>
    </div>
  );
}
