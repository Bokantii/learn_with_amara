import Link from "next/link";
import { BookOpen } from "lucide-react";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";

export default function OnboardingEmptyState() {
  return (
    <div className="flex items-center justify-center h-full">
      <Card className="max-w-md w-full p-8 text-center">
        <div className="w-14 h-14 mx-auto rounded-full bg-sky-100 flex items-center justify-center mb-4">
          <BookOpen className="w-7 h-7 text-sky-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">You&apos;re not enrolled in a program yet</h2>
        <p className="text-sm text-slate-500 mt-2">
          Once you enroll in a program, your lessons, live classes, assignments and progress
          will show up here.
        </p>
        <Button asChild className="mt-6 bg-primary hover:bg-primary/90">
          <Link href="/Courses">Browse Programs</Link>
        </Button>
      </Card>
    </div>
  );
}
