import React from 'react';
import { 
  X, 
  Bell, 
  AlertTriangle, 
  Award, 
  Calendar, 
  CloudLightning, 
  Check, 
  Trash2,
  Sparkles,
  Info
} from 'lucide-react';
import { AppNotification } from '../types';

interface NotificationsDrawerProps {
  notifications: AppNotification[];
  isOpen: boolean;
  onClose: () => void;
  onMarkRead: (id?: string) => void;
}

export default function NotificationsDrawer({
  notifications,
  isOpen,
  onClose,
  onMarkRead
}: NotificationsDrawerProps) {

  if (!isOpen) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'budget': return <AlertTriangle className="w-4.5 h-4.5 text-red-500" />;
      case 'bill': return <Calendar className="w-4.5 h-4.5 text-purple-500" />;
      case 'goal': return <Award className="w-4.5 h-4.5 text-emerald-500" />;
      case 'sync': return <CloudLightning className="w-4.5 h-4.5 text-blue-500" />;
      default: return <Info className="w-4.5 h-4.5 text-slate-500" />;
    }
  };

  const getBgStyle = (type: string) => {
    switch (type) {
      case 'budget': return 'bg-red-500/10 border-red-500/20';
      case 'bill': return 'bg-purple-500/10 border-purple-500/20';
      case 'goal': return 'bg-emerald-500/10 border-emerald-500/20';
      case 'sync': return 'bg-blue-500/10 border-blue-500/20';
      default: return 'bg-slate-50 border-slate-100';
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm transition-opacity no-print"
        onClick={onClose}
      />

      {/* Slide drawer container */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col justify-between animate-fade-in no-print">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Bell className="w-5 h-5 text-blue-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Active Alerts</h3>
            {unreadCount > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                {unreadCount} fresh
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button 
                onClick={() => onMarkRead()}
                className="p-1 rounded-lg text-slate-400 hover:text-blue-500 text-xs font-semibold cursor-pointer"
                title="Mark all as read"
              >
                <Check className="w-4 h-4" />
              </button>
            )}
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* List of alerts */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length > 0 ? (
            notifications.map((notif) => (
              <div 
                key={notif.id}
                onClick={() => { if (!notif.isRead) onMarkRead(notif.id); }}
                className={`
                  p-3.5 rounded-2xl border flex items-start gap-3.5 transition-all cursor-pointer relative overflow-hidden
                  ${getBgStyle(notif.type)}
                  ${notif.isRead ? 'opacity-55 hover:opacity-80' : 'hover:shadow-sm'}
                `}
              >
                {/* Dynamic Left Icon */}
                <div className="mt-0.5 flex-shrink-0">
                  {getIcon(notif.type)}
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex justify-between items-start gap-1">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-snug">{notif.message}</p>
                    {!notif.isRead && (
                      <span className="w-2 h-2 rounded-full bg-blue-500 mt-1 animate-pulse flex-shrink-0"></span>
                    )}
                  </div>
                  <p className="text-[9px] text-slate-400 font-mono">{new Date(notif.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="py-24 text-center text-slate-400">
              <Check className="w-12 h-12 stroke-1 text-slate-200 mb-2 mx-auto" />
              <span className="text-xs">Your airspace is completely clear. No active alerts active.</span>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-400">
          <span>Monitored in real-time</span>
          <button 
            onClick={() => onMarkRead()}
            disabled={unreadCount === 0}
            className="text-blue-500 hover:text-blue-600 disabled:opacity-40 font-bold"
          >
            Mark All Cleared
          </button>
        </div>

      </div>
    </>
  );
}
