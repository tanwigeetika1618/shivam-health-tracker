import { useState, useMemo } from 'react';
import { Moon, Sun, Clock, Plus, Bed, AlarmClock } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { DailyLog } from '../types';

interface SleepEntry {
  date: string;
  bedtime: string;
  wakeTime: string;
  duration: number;
  quality: 'great' | 'good' | 'okay' | 'poor';
  notes?: string;
}

interface SleepTrackerProps {
  sleepEntries: SleepEntry[];
  onAddSleep: (entry: SleepEntry) => void;
  todayLog: DailyLog;
}

function calculateDuration(bedtime: string, wakeTime: string): number {
  const [bedH, bedM] = bedtime.split(':').map(Number);
  const [wakeH, wakeM] = wakeTime.split(':').map(Number);
  let bedMinutes = bedH * 60 + bedM;
  let wakeMinutes = wakeH * 60 + wakeM;
  if (wakeMinutes <= bedMinutes) {
    wakeMinutes += 24 * 60;
  }
  return (wakeMinutes - bedMinutes) / 60;
}

function getQuality(duration: number): SleepEntry['quality'] {
  if (duration >= 7 && duration <= 9) return 'great';
  if (duration >= 6 && duration < 7) return 'good';
  if (duration >= 5 && duration < 6) return 'okay';
  return 'poor';
}

function getQualityEmoji(quality: string): string {
  const emojis: Record<string, string> = { great: '😴✨', good: '🙂', okay: '😐', poor: '😟' };
  return emojis[quality] || '😴';
}

function getQualityColor(quality: string): string {
  const colors: Record<string, string> = {
    great: 'from-blue-500 to-indigo-500',
    good: 'from-blue-500 to-sky-500',
    okay: 'from-amber-500 to-orange-500',
    poor: 'from-red-500 to-pink-500',
  };
  return colors[quality] || 'from-gray-400 to-gray-500';
}

export default function SleepTracker({ sleepEntries, onAddSleep }: SleepTrackerProps) {
  const [showForm, setShowForm] = useState(false);
  const [bedtime, setBedtime] = useState('00:00');
  const [wakeTime, setWakeTime] = useState('09:00');
  const [notes, setNotes] = useState('');

  const previewDuration = calculateDuration(bedtime, wakeTime);
  const previewQuality = getQuality(previewDuration);
  const lastEntry = sleepEntries.length > 0 ? sleepEntries[sleepEntries.length - 1] : null;

  const weekAvg = useMemo(() => {
    const last7 = sleepEntries.slice(-7);
    if (last7.length === 0) return 0;
    return last7.reduce((sum, e) => sum + e.duration, 0) / last7.length;
  }, [sleepEntries]);

  const chartData = useMemo(() => {
    return sleepEntries.slice(-14).map(entry => ({
      date: new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      hours: Math.round(entry.duration * 10) / 10,
      target: 8,
    }));
  }, [sleepEntries]);

  const streak = useMemo(() => {
    let count = 0;
    for (let i = sleepEntries.length - 1; i >= 0; i--) {
      if (sleepEntries[i].duration >= 7) count++;
      else break;
    }
    return count;
  }, [sleepEntries]);

  const handleLog = () => {
    const duration = calculateDuration(bedtime, wakeTime);
    const entry: SleepEntry = {
      date: new Date().toISOString().split('T')[0],
      bedtime,
      wakeTime,
      duration,
      quality: getQuality(duration),
      notes: notes || undefined,
    };
    onAddSleep(entry);
    setShowForm(false);
    setNotes('');
  };

  return (
    <div className="space-y-4 pb-24">
      <div className="hero-shimmer rounded-3xl p-6 text-white shadow-lg shadow-blue-900/30" style={{
        background: 'linear-gradient(135deg, #1e3a5f 0%, #1d4ed8 30%, #3b82f6 60%, #60a5fa 100%)',
      }}>
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
            <Moon size={18} />
          </div>
          <h1 className="text-xl font-black">Sleep Tracker 🌙</h1>
        </div>
        <p className="text-sm opacity-90 mt-1">
          Target: 12 AM → 9 AM · 8-9 hours for muscle recovery
        </p>
      </div>

      {lastEntry ? (
        <div className={`card p-5 border animate-fade-in ${
          lastEntry.quality === 'great' ? 'border-blue-500/30' :
          lastEntry.quality === 'good' ? 'border-sky-500/30' :
          lastEntry.quality === 'okay' ? 'border-amber-500/30' : 'border-red-500/30'
        }`}>
          <h2 className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-3">Last Night</h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-4xl">{getQualityEmoji(lastEntry.quality)}</div>
              <div>
                <p className="text-3xl font-black stat-number text-white">{lastEntry.duration.toFixed(1)}<span className="text-sm font-bold text-gray-400 ml-1">hrs</span></p>
                <p className="text-xs text-gray-500 mt-0.5 capitalize">Quality: <span className="font-bold">{lastEntry.quality}</span></p>
              </div>
            </div>
            <div className="text-right space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Bed size={12} /> <span className="font-semibold">{lastEntry.bedtime}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <AlarmClock size={12} /> <span className="font-semibold">{lastEntry.wakeTime}</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="card p-6 text-center animate-fade-in">
          <p className="text-3xl mb-2">🌙</p>
          <p className="text-sm font-semibold text-gray-400">No sleep logged yet</p>
          <p className="text-xs text-gray-500 mt-1">Log last night's sleep to get started!</p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <div className="card p-3 text-center">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center mx-auto mb-1.5">
            <Clock size={16} className="text-blue-400" />
          </div>
          <p className="text-lg font-black stat-number text-white">{weekAvg ? weekAvg.toFixed(1) : '--'}</p>
          <p className="text-[9px] text-gray-500 font-bold uppercase">Avg hrs/night</p>
        </div>
        <div className="card p-3 text-center">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center mx-auto mb-1.5">
            <Moon size={16} className="text-indigo-400" />
          </div>
          <p className="text-lg font-black stat-number text-white">{sleepEntries.length}</p>
          <p className="text-[9px] text-gray-500 font-bold uppercase">Nights Logged</p>
        </div>
        <div className="card p-3 text-center">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-1.5">
            <Sun size={16} className="text-emerald-400" />
          </div>
          <p className="text-lg font-black stat-number text-white">{streak}</p>
          <p className="text-[9px] text-gray-500 font-bold uppercase">7h+ Streak</p>
        </div>
      </div>

      <button
        onClick={() => setShowForm(!showForm)}
        className="w-full card p-4 flex items-center gap-3 active:scale-[0.98] transition-transform"
      >
        <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-md shadow-blue-500/30">
          <Plus size={20} className="text-white" />
        </div>
        <div className="text-left">
          <p className="text-sm font-bold text-gray-200">Log Last Night's Sleep</p>
          <p className="text-xs text-gray-500">When did you sleep and wake up?</p>
        </div>
      </button>

      {showForm && (
        <div className="card p-5 space-y-4 animate-fade-in">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1.5 mb-2">
                <Moon size={12} /> Bedtime
              </label>
              <input type="time" value={bedtime} onChange={e => setBedtime(e.target.value)}
                className="w-full border border-white/10 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/50 bg-white/5" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1.5 mb-2">
                <Sun size={12} /> Wake Up
              </label>
              <input type="time" value={wakeTime} onChange={e => setWakeTime(e.target.value)}
                className="w-full border border-white/10 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/50 bg-white/5" />
            </div>
          </div>

          <div className={`p-4 rounded-2xl bg-gradient-to-r ${getQualityColor(previewQuality)} text-white text-center`}>
            <p className="text-3xl font-black">{previewDuration.toFixed(1)} hrs</p>
            <p className="text-sm opacity-90 mt-1">{getQualityEmoji(previewQuality)} {previewQuality === 'great' ? 'Perfect for recovery!' : previewQuality === 'good' ? 'Decent sleep!' : previewQuality === 'okay' ? 'Could use more rest' : 'Muscles need sleep to grow bro!'}</p>
          </div>

          <textarea value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Any notes? (e.g., slept late gaming, woke up feeling strong...)"
            className="w-full border border-white/10 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 bg-white/5" rows={2} />

          <button onClick={handleLog}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-2xl text-sm font-black flex items-center justify-center gap-2 active:scale-[0.97] transition-transform shadow-lg shadow-blue-500/30">
            <Moon size={16} /> Log Sleep
          </button>
        </div>
      )}

      {chartData.length > 1 && (
        <div className="card p-5 animate-fade-in">
          <h2 className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-4">Sleep Trend</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b7280' }} />
              <YAxis domain={[0, 12]} tick={{ fontSize: 10, fill: '#6b7280' }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 12 }} />
              <Line type="monotone" dataKey="hours" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 4 }} />
              <Line type="monotone" dataKey="target" stroke="#374151" strokeDasharray="5 5" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="card p-5 border border-blue-500/15">
        <h3 className="font-black text-blue-400 text-sm mb-3">💤 Sleep Tips for Muscle Growth</h3>
        <div className="space-y-2">
          {[
            { icon: '💪', tip: 'Sleep is when muscles repair & grow — 8+ hours is essential for gains' },
            { icon: '🌡️', tip: 'Cool room (18-22°C) + lukewarm shower before bed = deeper sleep' },
            { icon: '📱', tip: 'Digital sunset at 10:30 PM — Night Shield on all screens' },
            { icon: '🥛', tip: 'Warm milk before bed → casein protein for overnight muscle recovery' },
            { icon: '☀️', tip: 'Morning sunlight resets your circadian clock — open curtains immediately' },
            { icon: '🍽️', tip: 'Don\'t sleep hungry — light protein snack if dinner was early' },
          ].map((item, i) => (
            <div key={i} className="flex gap-2.5 items-start">
              <span className="text-sm mt-0.5">{item.icon}</span>
              <p className="text-xs text-gray-400 leading-relaxed">{item.tip}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export type { SleepEntry };
