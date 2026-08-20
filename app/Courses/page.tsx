'use client';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Clock, Users, Award, BookOpen, Target } from 'lucide-react';

const tracks = [
  {
    icon: BookOpen,
    name: 'Beginner to TCF/TEF',
    description: 'Starting from scratch? Build real French fluency step by step, then transition straight into exam prep.',
    levels: 'A0 - C1',
    students: '15K+',
    duration: '9-12 months',
    exams: 'TEF, TCF',
    color: 'bg-blue-50 border-blue-200',
  },
  {
    icon: Target,
    name: 'TCF/TEF Exam Prep Only',
    description: 'Already speak French? Skip straight to focused exam prep — mock exams, scoring strategy, and timed practice.',
    levels: 'B2 - C2 (exam-ready)',
    students: '8K+',
    duration: '6-8 weeks',
    exams: 'TEF, TCF',
    color: 'bg-amber-50 border-amber-200',
  },
];

export default function Courses() {
  return (
    <div className="py-12 lg:py-20">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12 lg:mb-16">
          <h1 className="text-4xl lg:text-5xl mb-4">
            Choose Your French Track
          </h1>
          <p className="text-lg text-muted-foreground">
            We focus on one thing: French, for the TCF and TEF exams. Pick the track that
            matches where you're starting from.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {tracks.map((track, index) => (
            <Card
              key={index}
              className={`border-2 hover:shadow-xl transition-all duration-300 ${track.color}`}
            >
              <CardHeader className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-14 h-14 rounded-xl bg-white flex items-center justify-center">
                    <track.icon className="w-7 h-7 text-primary" />
                  </div>
                  <Badge variant="secondary">{track.levels}</Badge>
                </div>
                <h3 className="text-2xl">{track.name}</h3>
                <p className="text-muted-foreground">{track.description}</p>
              </CardHeader>
              <CardContent className="p-6 pt-0 space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>{track.students} students</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>{track.duration} average</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Award className="w-4 h-4" />
                    <span>Exam prep: {track.exams}</span>
                  </div>
                </div>
                <Button className="w-full bg-primary hover:bg-primary/90">
                  Start Learning
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
