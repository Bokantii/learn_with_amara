"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch1";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Bell, Globe, Shield } from "lucide-react";

const notificationItems = [
  {
    id: "email",
    label: "Email Notifications",
    desc: "Receive email updates about your courses",
    defaultOn: true,
  },
  {
    id: "assignments",
    label: "Assignment Reminders",
    desc: "Get notified before assignment deadlines",
    defaultOn: true,
  },
  {
    id: "live",
    label: "Live Class Reminders",
    desc: "Reminders 30 minutes before live classes",
    defaultOn: true,
  },
  {
    id: "marketing",
    label: "Marketing Emails",
    desc: "Receive updates about new courses and features",
    defaultOn: false,
  },
  {
    id: "weekly",
    label: "Weekly Progress Report",
    desc: "Get a summary of your weekly progress",
    defaultOn: true,
  },
  {
    id: "push",
    label: "Push Notifications",
    desc: "Enable browser notifications",
    defaultOn: true,
  },
];

const selectClass =
  "w-full mt-2 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white";

export default function Settings() {
  return (
    <div className="space-y-4 md:space-y-6 px-2 sm:px-0">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          Settings
        </h1>
        <p className="text-slate-600 mt-2 text-sm sm:text-base">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        {/* Tab triggers — scroll horizontally on mobile */}
        <TabsList className="bg-white border border-slate-200 w-full overflow-x-auto flex h-auto">
          <TabsTrigger
            value="profile"
            className="flex items-center gap-1.5 text-xs sm:text-sm whitespace-nowrap"
          >
            <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="flex items-center gap-1.5 text-xs sm:text-sm whitespace-nowrap"
          >
            <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger
            value="language"
            className="flex items-center gap-1.5 text-xs sm:text-sm whitespace-nowrap"
          >
            <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            Language
          </TabsTrigger>
          <TabsTrigger
            value="security"
            className="flex items-center gap-1.5 text-xs sm:text-sm whitespace-nowrap"
          >
            <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            Security
          </TabsTrigger>
        </TabsList>

        {/* Profile */}
        <TabsContent value="profile" className="mt-4 md:mt-6">
          <Card className="p-4 md:p-6">
            <h3 className="font-bold text-base md:text-lg text-slate-900 mb-4 md:mb-6">
              Profile Information
            </h3>
            <div className="space-y-4 md:space-y-6">
              {/* Avatar */}
              <div className="flex items-center gap-4 md:gap-6">
                <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-sky-400 to-cyan-500 flex items-center justify-center flex-shrink-0">
                  <User className="w-8 h-8 md:w-12 md:h-12 text-white" />
                </div>
                <div>
                  <Button className="bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white text-sm h-9">
                    Change Photo
                  </Button>
                  <p className="text-xs text-slate-500 mt-2">
                    JPG, GIF or PNG. Max size 2MB
                  </p>
                </div>
              </div>

              {/* Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div>
                  <Label htmlFor="firstName" className="text-sm">
                    First Name
                  </Label>
                  <Input
                    id="firstName"
                    defaultValue="Sarah"
                    className="mt-2 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName" className="text-sm">
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    defaultValue="Chen"
                    className="mt-2 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-sm">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    defaultValue="sarah.chen@email.com"
                    className="mt-2 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="phone" className="text-sm">
                    Phone
                  </Label>
                  <Input
                    id="phone"
                    defaultValue="+1 (555) 123-4567"
                    className="mt-2 text-sm"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="bio" className="text-sm">
                    Bio
                  </Label>
                  <textarea
                    id="bio"
                    rows={4}
                    className="w-full mt-2 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
                    defaultValue="Language enthusiast preparing for TCF and TEF exams. Passionate about French culture and eager to achieve fluency."
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t border-slate-200">
                <Button
                  variant="outline"
                  className="border-slate-300 text-sm h-9"
                >
                  Cancel
                </Button>
                <Button className="bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white text-sm h-9">
                  Save Changes
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="mt-4 md:mt-6">
          <Card className="p-4 md:p-6">
            <h3 className="font-bold text-base md:text-lg text-slate-900 mb-4 md:mb-6">
              Notification Preferences
            </h3>
            <div className="space-y-0">
              {notificationItems.map((item, i) => (
                <div
                  key={item.id}
                  className={`flex items-center justify-between py-4 gap-4 ${
                    i < notificationItems.length - 1
                      ? "border-b border-slate-200"
                      : ""
                  }`}
                >
                  <div className="min-w-0">
                    <h4 className="font-medium text-sm md:text-base text-slate-900">
                      {item.label}
                    </h4>
                    <p className="text-xs md:text-sm text-slate-600 mt-0.5">
                      {item.desc}
                    </p>
                  </div>
                  <Switch
                    defaultChecked={item.defaultOn}
                    className="flex-shrink-0"
                  />
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Language */}
        <TabsContent value="language" className="mt-4 md:mt-6">
          <Card className="p-4 md:p-6">
            <h3 className="font-bold text-base md:text-lg text-slate-900 mb-4 md:mb-6">
              Language & Region
            </h3>
            <div className="space-y-4 md:space-y-6">
              <div>
                <Label htmlFor="interface-language" className="text-sm">
                  Interface Language
                </Label>
                <select
                  id="interface-language"
                  className={selectClass}
                  defaultValue="en"
                >
                  <option value="en">English</option>
                  <option value="fr">Français</option>
                  <option value="es">Español</option>
                  <option value="zh">中文</option>
                </select>
              </div>
              <div>
                <Label htmlFor="timezone" className="text-sm">
                  Timezone
                </Label>
                <select
                  id="timezone"
                  className={selectClass}
                  defaultValue="utc-5"
                >
                  <option value="utc-5">(UTC-05:00) Eastern Time</option>
                  <option value="utc-6">(UTC-06:00) Central Time</option>
                  <option value="utc-7">(UTC-07:00) Mountain Time</option>
                  <option value="utc-8">(UTC-08:00) Pacific Time</option>
                </select>
              </div>
              <div>
                <Label htmlFor="date-format" className="text-sm">
                  Date Format
                </Label>
                <select
                  id="date-format"
                  className={selectClass}
                  defaultValue="mdy"
                >
                  <option value="mdy">MM/DD/YYYY</option>
                  <option value="dmy">DD/MM/YYYY</option>
                  <option value="ymd">YYYY/MM/DD</option>
                </select>
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t border-slate-200">
                <Button
                  variant="outline"
                  className="border-slate-300 text-sm h-9"
                >
                  Cancel
                </Button>
                <Button className="bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white text-sm h-9">
                  Save Changes
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Security */}
        <TabsContent value="security" className="mt-4 md:mt-6">
          <div className="space-y-4 md:space-y-6">
            {/* Change Password */}
            <Card className="p-4 md:p-6">
              <h3 className="font-bold text-base md:text-lg text-slate-900 mb-4 md:mb-6">
                Change Password
              </h3>
              <div className="space-y-4 md:space-y-6">
                <div>
                  <Label htmlFor="current-password" className="text-sm">
                    Current Password
                  </Label>
                  <Input
                    id="current-password"
                    type="password"
                    className="mt-2 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="new-password" className="text-sm">
                    New Password
                  </Label>
                  <Input
                    id="new-password"
                    type="password"
                    className="mt-2 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="confirm-password" className="text-sm">
                    Confirm New Password
                  </Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    className="mt-2 text-sm"
                  />
                </div>
                <div className="flex justify-end">
                  <Button className="bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white text-sm h-9">
                    Update Password
                  </Button>
                </div>
              </div>
            </Card>

            {/* 2FA */}
            <Card className="p-4 md:p-6">
              <h3 className="font-bold text-base md:text-lg text-slate-900 mb-4 md:mb-6">
                Two-Factor Authentication
              </h3>
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <h4 className="font-medium text-sm md:text-base text-slate-900">
                    Enable 2FA
                  </h4>
                  <p className="text-xs md:text-sm text-slate-600 mt-1">
                    Add an extra layer of security to your account
                  </p>
                </div>
                <Switch className="flex-shrink-0" />
              </div>
            </Card>

            {/* Danger Zone */}
            <Card className="p-4 md:p-6 border-red-200 bg-red-50">
              <h3 className="font-bold text-base md:text-lg text-red-900 mb-4">
                Danger Zone
              </h3>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="font-medium text-sm md:text-base text-red-900">
                    Delete Account
                  </h4>
                  <p className="text-xs md:text-sm text-red-700 mt-1">
                    Permanently delete your account and all data
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-100 text-sm h-9 flex-shrink-0 sm:w-auto w-full"
                >
                  Delete Account
                </Button>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
