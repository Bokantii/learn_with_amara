'use client';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Clock, Users, Award } from 'lucide-react';

const courses = [
  {
    language: 'French',
    flag: '🇫🇷',
    levels: 'A0 - C2',
    students: '15K+',
    duration: '12 weeks',
    exams: 'TEF, TCF',
    color: 'bg-blue-50 border-blue-200',
  },
  {
    language: 'Spanish',
    flag: '🇪🇸',
    levels: 'A0 - C2',
    students: '12K+',
    duration: '10 weeks',
    exams: 'DELE',
    color: 'bg-red-50 border-red-200',
  },
  {
    language: 'German',
    flag: '🇩🇪',
    levels: 'A0 - C2',
    students: '8K+',
    duration: '14 weeks',
    exams: 'Goethe',
    color: 'bg-yellow-50 border-yellow-200',
  },
  {
    language: 'Chinese',
    flag: '🇨🇳',
    levels: 'A0 - C2',
    students: '10K+',
    duration: '16 weeks',
    exams: 'HSK',
    color: 'bg-red-50 border-red-200',
  },
  {
    language: 'Italian',
    flag: '🇮🇹',
    levels: 'A0 - C2',
    students: '6K+',
    duration: '10 weeks',
    exams: 'CELI',
    color: 'bg-green-50 border-green-200',
  },
  {
    language: 'Korean',
    flag: '🇰🇷',
    levels: 'A0 - C2',
    students: '7K+',
    duration: '14 weeks',
    exams: 'TOPIK',
    color: 'bg-indigo-50 border-indigo-200',
  },
  {
    language: 'Japanese',
    flag: '🇯🇵',
    levels: 'A0 - C2',
    students: '9K+',
    duration: '16 weeks',
    exams: 'JLPT',
    color: 'bg-pink-50 border-pink-200',
  },
  {
    language: 'Turkish',
    flag: '🇹🇷',
    levels: 'A0 - C2',
    students: '5K+',
    duration: '12 weeks',
    exams: 'TYS',
    color: 'bg-purple-50 border-purple-200',
  },
];

export default function Courses() {
  return (
    <div className="py-12 lg:py-20">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12 lg:mb-16">
          <h1 className="text-4xl lg:text-5xl mb-4">
            Our Language Courses
          </h1>
          <p className="text-lg text-muted-foreground">
            Choose from 8 languages with comprehensive courses from beginner to advanced levels, 
            including specialized exam preparation.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {courses.map((course, index) => (
            <Card
              key={index}
              className={`border-2 hover:shadow-xl transition-all duration-300 ${course.color}`}
            >
              <CardHeader className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-5xl">{course.flag}</span>
                  <Badge variant="secondary">{course.levels}</Badge>
                </div>
                <h3 className="text-2xl">{course.language}</h3>
              </CardHeader>
              <CardContent className="p-6 pt-0 space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>{course.students} students</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>{course.duration} average</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Award className="w-4 h-4" />
                    <span>Exam prep: {course.exams}</span>
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
