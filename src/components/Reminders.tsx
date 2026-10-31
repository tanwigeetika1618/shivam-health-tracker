import { useState, useEffect, useCallback, useRef } from 'react';
import { Bell, BellOff, Check, Clock, Settings } from 'lucide-react';

interface Reminder {
  id: string;
  time: string;
  label: string;
  emoji: string;
  category: string;
  enabled: boolean;
}

interface RemindersProps {
  reminders: Reminder[];
  onUpdateReminders: (reminders: Reminder[]) => void;
}

const DEFAULT_REMINDERS: Reminder[] = [
  { id: 'wake', time: '09:00', label: 'Time to wake up! Hydrate immediately 💧', emoji: '☀️', category: 'personal', enabled: true },
  { id: 'shake', time: '09:30', label: 'PB Shake time! 680 cals to start the day 🥤', emoji: '🥤', category: 'meal', enabled: true },
  { id: 'breakfast', time: '10:30', label: 'Big Breakfast! 4 eggs + toast 🍳', emoji: '🌅', category: 'meal', enabled: true },
  { id: 'work-start', time: '12:00', label: 'Work time — log in for engineering shift', emoji: '💻', category: 'work', enabled: true },
  { id: 'lunch', time: '14:30', label: 'Lunch! Dal + Rice + Ghee — eat big 🍛', emoji: '☀️', category: 'meal', enabled: true },
  { id: 'desk-stretch', time: '16:00', label: 'Desk stretch break! Move your body 🤸', emoji: '🙆', category: 'exercise', enabled: true },
  { id: 'water-check', time: '17:00', label: 'Hydration check! Have you had enough water? 💧', emoji: '💧', category: 'personal', enabled: true },
  { id: 'eye-break', time: '18:30', label: 'Eye break! 20-20-20 rule 👁️', emoji: '👁️', category: 'personal', enabled: true },
  { id: 'pre-workout', time: '19:00', label: 'Pre-workout fuel — rotis + jaggery + ghee ⚡', emoji: '⚡', category: 'meal', enabled: true },
  { id: 'workout', time: '19:30', label: 'Workout time! 1 hour — no excuses 💪', emoji: '🏋️', category: 'exercise', enabled: true },
  { id: 'dinner', time: '21:00', label: 'Post-workout dinner! Protein + carbs 🍽️', emoji: '🌙', category: 'meal', enabled: true },
  { id: 'log-reminder', time: '21:30', label: 'Log your day! Meals, exercise, water 📊', emoji: '📝', category: 'personal', enabled: true },
  { id: 'night-snack', time: '22:00', label: 'Night snack — milk + nuts for overnight recovery 🥛', emoji: '🥛', category: 'meal', enabled: true },
  { id: 'digital-sunset', time: '22:30', label: 'Digital Sunset — Night Shield on all screens 📵', emoji: '🌅', category: 'personal', enabled: true },
  { id: 'shower', time: '23:30', label: 'Lukewarm shower — cool down for sleep 🚿', emoji: '🚿', category: 'personal', enabled: true },
  { id: 'sleep', time: '00:00', label: 'Bedtime! 8-9 hours for muscle recovery 🌙', emoji: '😴', category: 'sleep', enabled: true },
];

function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

export { DEFAULT_REMINDERS };
export type { Reminder };

export default function Reminders({ reminders, onUpdateReminders }: RemindersProps) {
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [showSettings, setShowSettings] = useState(false);
  const [nextReminder, setNextReminder] = useState<Reminder | null>(null);
  const [lastNotified, setLastNotified] = useState<Set<string>>(new Set());
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    setPermission(getNotificationPermission());
  }, []);

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      alert('Notifications are not supported in this browser.');
      return;
    }
    const result = await Notification.requestPermission();
    setPermission(result);
  };

  const toggleReminder = (id: string) => {
    onUpdateReminders(reminders.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  const updateTime = (id: string, newTime: string) => {
    onUpdateReminders(reminders.map(r => r.id === id ? { ...r, time: newTime } : r));
  };

  const toggleAll = (enabled: boolean) => {
    onUpdateReminders(reminders.map(r => ({ ...r, enabled })));
  };

  const sendNotification = useCallback((reminder: Reminder) => {
    if (permission !== 'granted') return;
    try {
      new Notification(`${reminder.emoji} ${reminder.label}`, {
        icon: '/shivam-health-tracker/shivam-avatar.jpg',
        badge: '/shivam-health-tracker/shivam-avatar.jpg',
        tag: reminder.id,
      });
    } catch {
      // Notification failed silently
    }
  }, [permission]);

  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const todayKey = now.toISOString().split('T')[0];

      const activeReminders = reminders.filter(r => r.enabled);
      const upcoming = activeReminders
        .filter(r => r.time > currentTime)
        .sort((a, b) => a.time.localeCompare(b.time));
      setNextReminder(upcoming[0] || null);

      for (const reminder of activeReminders) {
        const notifKey = `${todayKey}-${reminder.id}`;
        if (reminder.time === currentTime && !lastNotified.has(notifKey)) {
          sendNotification(reminder);
          setLastNotified(prev => new Set([...prev, notifKey]));
        }
      }
    };

    checkReminders();
    intervalRef.current = window.setInterval(checkReminders, 30000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [reminders, permission, lastNotified, sendNotification]);

  const categoryColors: Record<string, string> = {
    personal: 'border-gray-500/20',
    exercise: 'border-orange-500/20',
    meal: 'border-emerald-500/20',
    work: 'border-blue-500/20',
    sleep: 'border-indigo-500/20',
  };

  const enabledCount = reminders.filter(r => r.enabled).length;

  return (
    <div className="space-y-4 pb-24">
      <div className="hero-shimmer rounded-3xl p-6 text-white shadow-lg shadow-amber-900/30" style={{
        background: 'linear-gradient(135deg, #92400e 0%, #d97706 30%, #f59e0b 60%, #fbbf24 100%)',
      }}>
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
            <Bell size={18} />
          </div>
          <h1 className="text-xl font-black">Reminders 🔔</h1>
        </div>
        <p className="text-sm opacity-90 mt-1">
          Stay on track with meals, workouts & sleep schedule
        </p>
      </div>

      {permission !== 'granted' && (
        <div className="card p-4 border-2 border-amber-500/30 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
              <BellOff size={20} className="text-amber-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-amber-300">Enable Notifications</p>
              <p className="text-xs text-amber-400/70">
                {permission === 'unsupported'
                  ? 'Your browser doesn\'t support notifications'
                  : 'Allow notifications to get reminders throughout the day'}
              </p>
            </div>
            {permission !== 'unsupported' && (
              <button onClick={requestPermission}
                className="px-4 py-2 bg-amber-500 text-white rounded-xl text-xs font-bold active:scale-95 transition-transform shadow-md">
                Enable
              </button>
            )}
          </div>
        </div>
      )}

      {permission === 'granted' && (
        <div className="card p-4 border-2 border-emerald-500/30 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
              <Check size={20} className="text-emerald-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-emerald-300">Notifications Active ✓</p>
              <p className="text-xs text-emerald-400/70">{enabledCount} reminders enabled · keep this tab open</p>
            </div>
          </div>
        </div>
      )}

      {nextReminder && (
        <div className="card p-4 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20 animate-fade-in">
          <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">Next Reminder</p>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{nextReminder.emoji}</span>
            <div>
              <p className="text-sm font-bold text-gray-200">{nextReminder.label}</p>
              <p className="text-xs text-blue-400 font-semibold flex items-center gap-1">
                <Clock size={11} /> {nextReminder.time}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button onClick={() => toggleAll(true)}
          className="flex-1 card py-2.5 text-center text-xs font-bold text-emerald-400 active:scale-95 transition-transform">
          ✓ Enable All
        </button>
        <button onClick={() => toggleAll(false)}
          className="flex-1 card py-2.5 text-center text-xs font-bold text-gray-500 active:scale-95 transition-transform">
          ✗ Disable All
        </button>
        <button onClick={() => setShowSettings(!showSettings)}
          className={`card px-4 py-2.5 text-xs font-bold active:scale-95 transition-transform ${showSettings ? 'text-blue-400' : 'text-gray-500'}`}>
          <Settings size={16} />
        </button>
      </div>

      <div className="space-y-2">
        {reminders.map(reminder => (
          <div key={reminder.id}
            className={`card p-3.5 border transition-all ${
              reminder.enabled ? categoryColors[reminder.category] : 'opacity-50'
            }`}>
            <div className="flex items-center gap-3">
              <button onClick={() => toggleReminder(reminder.id)}
                className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                  reminder.enabled ? 'bg-blue-500 border-blue-500' : 'border-gray-600'
                }`}>
                {reminder.enabled && <Check size={14} className="text-white" />}
              </button>
              <span className="text-lg flex-shrink-0">{reminder.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold truncate ${reminder.enabled ? 'text-gray-200' : 'text-gray-600'}`}>
                  {reminder.label}
                </p>
                <p className="text-[10px] text-gray-500 font-semibold">{reminder.time}</p>
              </div>
              {showSettings && (
                <input type="time" value={reminder.time} onChange={e => updateTime(reminder.id, e.target.value)}
                  className="border border-white/10 rounded-lg px-2 py-1 text-xs font-bold w-24 bg-white/5 focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
