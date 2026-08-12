// NotificationBell component
import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import type { Notification } from '../types';
import { formatDistanceToNow } from 'date-fns';

const typeIcon: Record<string, string> = {
  assigned: '📋',
  completed: '✅',
  overdue: '⚠️',
};

const typeColor: Record<string, string> = {
  assigned: 'text-sky-600 dark:text-sky-400',
  completed: 'text-emerald-600 dark:text-emerald-400',
  overdue: 'text-rose-600 dark:text-rose-400',
};

const NotificationBell: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const fetchNotifications = async () => {
    try {
      const data = await api.getNotifications();
      setNotifications(data);
    } catch {
      // Silently fail
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkRead = async (id: string) => {
    await api.markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const handleMarkAllRead = async () => {
    await api.markAllNotificationsRead();
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => { setOpen(o => !o); if (!open) fetchNotifications(); }}
        className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 dark:text-slate-300 dark:hover:text-white dark:hover:bg-blue-900/40 transition-all"
        title="Notifications"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none ring-2 ring-white dark:ring-[#0b1329]">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border-slate-200 shadow-2xl shadow-blue-950/20 dark:bg-[#121c38] dark:border-blue-900/50 border rounded-2xl z-50 overflow-hidden animate-fade-in">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-blue-900/30 bg-slate-50/50 dark:bg-blue-950/30">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 px-2 py-0.5 text-[10px] font-bold bg-blue-500/15 text-blue-600 dark:text-sky-300 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-sky-400 dark:hover:text-sky-300 transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-blue-900/30">
            {notifications.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-2xl mb-1">🔔</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">No notifications yet</p>
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  onClick={() => !n.is_read && handleMarkRead(n.id)}
                  className={`flex items-start gap-3 px-4 py-3 transition-all cursor-pointer ${
                    n.is_read
                      ? 'opacity-60 hover:bg-slate-50 dark:hover:opacity-80'
                      : 'bg-blue-50/60 hover:bg-blue-50 dark:bg-blue-900/30 dark:hover:bg-blue-900/50'
                  }`}
                >
                  <div className="mt-1 flex-shrink-0">
                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-sky-400 block" />
                    )}
                    {n.is_read && (
                      <span className="w-2 h-2 block" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2">
                      <span className="text-sm">{typeIcon[n.type]}</span>
                      <p className={`text-xs leading-relaxed ${n.is_read ? 'text-slate-500 dark:text-slate-400' : 'text-slate-900 dark:text-slate-100 font-semibold'}`}>
                        {n.message}
                      </p>
                    </div>
                    <p className={`text-[10px] mt-1 font-medium ${typeColor[n.type]}`}>
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="px-4 py-2 border-t border-slate-100 dark:border-blue-900/30 bg-slate-50/50 dark:bg-blue-950/30">
              <p className="text-[10px] text-slate-500 dark:text-slate-400 text-center font-medium">
                Showing last {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
