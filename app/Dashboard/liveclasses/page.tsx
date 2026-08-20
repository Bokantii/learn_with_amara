"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Video, Calendar, Clock, User, ExternalLink } from "lucide-react";

const upcomingClasses = [
  {
    id: 1,
    title: "TCF Preparation - Speaking Module",
    instructor: "Prof. Marie Dubois",
    date: "Today, March 13",
    time: "4:00 PM - 5:30 PM",
    duration: "90 min",
    participants: 12,
    zoomLink: "https://zoom.us/j/123456789",
    status: "upcoming",
  },
  {
    id: 2,
    title: "French Grammar Masterclass",
    instructor: "Dr. Jean Laurent",
    date: "Tomorrow, March 14",
    time: "2:00 PM - 3:30 PM",
    duration: "90 min",
    participants: 15,
    zoomLink: "https://zoom.us/j/987654321",
    status: "upcoming",
  },
  {
    id: 3,
    title: "TEF Writing Workshop",
    instructor: "Prof. Sophie Martin",
    date: "March 15, 2026",
    time: "10:00 AM - 11:30 AM",
    duration: "90 min",
    participants: 10,
    zoomLink: "https://zoom.us/j/456789123",
    status: "upcoming",
  },
];

const pastClasses = [
  {
    id: 4,
    title: "TCF Listening Practice Session",
    instructor: "Prof. Marie Dubois",
    date: "March 11, 2026",
    time: "3:00 PM - 4:30 PM",
    duration: "90 min",
    recordingAvailable: true,
  },
  {
    id: 5,
    title: "French Pronunciation Workshop",
    instructor: "Dr. Pierre Rousseau",
    date: "March 9, 2026",
    time: "5:00 PM - 6:00 PM",
    duration: "60 min",
    recordingAvailable: true,
  },
  {
    id: 6,
    title: "TEF Reading Strategies",
    instructor: "Prof. Sophie Martin",
    date: "March 7, 2026",
    time: "2:00 PM - 3:30 PM",
    duration: "90 min",
    recordingAvailable: false,
  },
];

export default function LiveClasses() {
  return (
    <div className="space-y-4 md:space-y-6 px-2 sm:px-0">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Live Classes</h1>
        <p className="text-slate-600 mt-2 text-sm sm:text-base">
          Join live sessions with expert instructors via Zoom
        </p>
      </div>

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="bg-white border border-slate-200">
          <TabsTrigger value="upcoming" className="text-sm">Upcoming</TabsTrigger>
          <TabsTrigger value="past" className="text-sm">Past Classes</TabsTrigger>
        </TabsList>

        {/* Upcoming */}
        <TabsContent value="upcoming" className="mt-4 md:mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {upcomingClasses.map((classItem) => (
              <Card
                key={classItem.id}
                className="p-4 md:p-6 hover:shadow-lg transition-shadow border-sky-200"
              >
                <div className="flex items-start gap-3 md:gap-4 mb-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-gradient-to-br from-sky-400 to-cyan-500 flex items-center justify-center flex-shrink-0">
                    <Video className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm md:text-lg text-slate-900 leading-snug">
                      {classItem.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs md:text-sm text-slate-600 mt-1">
                      <User className="w-3 h-3 md:w-4 md:h-4 text-sky-500 flex-shrink-0" />
                      <span className="truncate">{classItem.instructor}</span>
                    </div>
                  </div>
                  <Badge className="bg-sky-100 text-sky-700 hover:bg-sky-100 text-xs flex-shrink-0">
                    Upcoming
                  </Badge>
                </div>

                <div className="space-y-1.5 md:space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-xs md:text-sm text-slate-600">
                    <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4 text-sky-500 flex-shrink-0" />
                    <span>{classItem.date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs md:text-sm text-slate-600">
                    <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 text-sky-500 flex-shrink-0" />
                    <span>{classItem.time} • {classItem.duration}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs md:text-sm text-slate-600">
                    <User className="w-3.5 h-3.5 md:w-4 md:h-4 text-sky-500 flex-shrink-0" />
                    <span>{classItem.participants} participants enrolled</span>
                  </div>
                </div>

                <Button
                  className="w-full bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white text-sm h-9 md:h-10"
                  asChild
                >
                  <a href={classItem.zoomLink} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Join on Zoom
                  </a>
                </Button>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Past Classes */}
        <TabsContent value="past" className="mt-4 md:mt-6">
          <div className="space-y-3 md:space-y-4">
            {pastClasses.map((classItem) => (
              <Card key={classItem.id} className="p-4 md:p-6">
                <div className="flex items-start md:items-center justify-between gap-3">
                  <div className="flex items-start gap-3 md:gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                      <Video className="w-5 h-5 md:w-6 md:h-6 text-slate-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm md:text-base text-slate-900 leading-snug">
                        {classItem.title}
                      </h3>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-1.5 text-xs md:text-sm text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate">{classItem.instructor}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>{classItem.date}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>{classItem.duration}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    {classItem.recordingAvailable ? (
                      <Button
                        variant="outline"
                        className="border-sky-300 text-sky-600 hover:bg-sky-50 text-xs md:text-sm h-8 md:h-9 px-3"
                      >
                        Watch Recording
                      </Button>
                    ) : (
                      <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-100 text-xs">
                        No Recording
                      </Badge>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}