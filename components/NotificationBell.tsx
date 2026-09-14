'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { markNotificationReadAction } from '../lib/notifications/actions';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  createdAt: Date;
  readAt: Date | null;
  /** Per-type destination; falls back to `linkHref` when null. */
  href?: string | null;
}

interface NotificationBellProps {
  unreadCount: number;
  notifications: NotificationItem[];
  linkHref: string;
  dotClassName?: string;
}

function formatRelativeTime(date: Date): string {
  const diffMin = Math.round((Date.now() - new Date(date).getTime()) / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.round(diffHr / 24)}d ago`;
}

export function NotificationBell({
  unreadCount,
  notifications,
  linkHref,
  dotClassName = 'bg-cyan-500',
}: NotificationBellProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const handleSelect = (notification: NotificationItem) => {
    setOpen(false);
    if (!notification.readAt) {
      startTransition(async () => {
        // A failed mark-read must not reject the transition; navigation proceeds
        // regardless and the unread state simply stays until the next attempt.
        await markNotificationReadAction({ notificationId: notification.id }).catch(() => {});
        router.refresh();
      });
    }
    router.push(notification.href ?? linkHref);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        >
          <Bell className="w-5 h-5 text-slate-600" />
          {unreadCount > 0 && (
            <span
              className={`absolute top-1 right-1 w-2 h-2 rounded-full ${dotClassName}`}
              aria-hidden="true"
            />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="px-4 py-3 border-b border-slate-200">
          <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
        </div>
        {notifications.length === 0 ? (
          <p className="px-4 py-6 text-sm text-slate-500 text-center">No notifications yet.</p>
        ) : (
          <ul className="max-h-96 overflow-y-auto divide-y divide-slate-100">
            {notifications.map((notification) => (
              <li key={notification.id}>
                <button
                  type="button"
                  onClick={() => handleSelect(notification)}
                  disabled={isPending}
                  className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors ${
                    !notification.readAt ? 'bg-sky-50/60' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-slate-900">{notification.title}</p>
                    {!notification.readAt && (
                      <>
                        <span className="sr-only">Unread</span>
                        <span
                          className="w-2 h-2 mt-1.5 rounded-full bg-sky-500 shrink-0"
                          aria-hidden="true"
                        />
                      </>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{notification.message}</p>
                  <p className="text-xs text-slate-400 mt-1">{formatRelativeTime(notification.createdAt)}</p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
