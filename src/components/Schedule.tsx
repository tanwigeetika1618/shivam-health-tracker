import { useState } from 'react';
import { Briefcase, Dumbbell, UtensilsCrossed, BookOpen, Gamepad2, Moon, User } from 'lucide-react';
import { defaultSchedule } from '../data/schedule';

const categoryColors: Record<string, string> = {
  work: 'bg-blue-50 border-blue-200 text-blue-700',
  exercise: 'bg-orange-50 border-orange-200 text-orange-700',
  meal: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  study: 'bg-purple-50 border-purple-200 text-purple-700',
  leisure: 'bg-pink-50 border-pink-200 text-pink-700',
  sleep: 'bg-indigo-50 border-indigo-200 text-indigo-700',
  personal: 'bg-gray-50 border-gray-200 text-gray-700',
};

const categoryIcons: Record<string, React.ReactNode> = {
  work: <Briefcase size={14} />,
  exercise: <Dumbbell size={14} />,
  meal: <UtensilsCrossed size={14} />,
  study: <BookOpen size={14} />,
  leisure: <Gamepad2 size={14} />,
  sleep: <Moon size={14} />,
  personal: <User size={14} />,
};

const dayLabels: Record<string, string> = {
  wfh: '🏠 Work from Home',
  office: '🏢 Office Day',
  weekend: '🌴 Weekend',
};

export default function Schedule() {
  const days = Object.keys(defaultSchedule);
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const todayIndex = days.indexOf(today);
  const [selectedDay, setSelectedDay] = useState(todayIndex >= 0 ? today : days[0]);

  const schedule = defaultSchedule[selectedDay];
  if (!schedule) return null;

  const exerciseBlocks = schedule.blocks.filter(b => b.category === 'exercise');
  const mealBlocks = schedule.blocks.filter(b => b.category === 'meal');

  return (
    <div className="space-y-4 pb-24">
      <div className="hero-schedule hero-shimmer rounded-3xl p-6 text-white shadow-lg shadow-indigo-200">
        <h1 className="text-2xl font-black">Weekly Schedule 📅</h1>
        <p className="text-sm opacity-90 mt-1">Your personalized daily routine</p>
      </div>

      {/* Day Selector */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {days.map(day => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`px-3 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedDay === day
                ? 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-200'
                : day === today
                  ? 'bg-indigo-100 text-indigo-700 shadow-sm'
                  : 'card text-gray-500'
            }`}
          >
            {day.slice(0, 3)}
            {day === today && selectedDay !== day && ' •'}
          </button>
        ))}
      </div>

      {/* Day Type Badge */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">{selectedDay}</span>
        <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
          {dayLabels[schedule.dayType]}
        </span>
      </div>

      {/* Quick Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card bg-orange-50/60 p-3">
          <p className="text-xs text-orange-600 font-medium">Exercise Sessions</p>
          <p className="text-lg font-bold text-orange-700">{exerciseBlocks.length}</p>
          <div className="mt-1 space-y-0.5">
            {exerciseBlocks.map((block, i) => (
              <p key={i} className="text-xs text-orange-600">{block.time} — {block.activity}</p>
            ))}
          </div>
        </div>
        <div className="card bg-emerald-50/60 p-3">
          <p className="text-xs text-emerald-600 font-medium">Meals Planned</p>
          <p className="text-lg font-bold text-emerald-700">{mealBlocks.length}</p>
          <div className="mt-1 space-y-0.5">
            {mealBlocks.slice(0, 4).map((block, i) => (
              <p key={i} className="text-xs text-emerald-600">{block.time} — {block.activity}</p>
            ))}
            {mealBlocks.length > 4 && (
              <p className="text-xs text-emerald-500">+{mealBlocks.length - 4} more</p>
            )}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="card p-4">
        <h2 className="text-sm font-semibold text-gray-500 mb-4">DAILY TIMELINE</h2>
        <div className="space-y-0">
          {schedule.blocks.map((block, i) => (
            <div key={i} className="flex gap-3">
              {/* Time column */}
              <div className="w-12 text-right">
                <span className="text-xs font-mono text-gray-400">{block.time}</span>
              </div>

              {/* Dot + line */}
              <div className="flex flex-col items-center">
                <div className={`w-3 h-3 rounded-full border-2 ${
                  block.category === 'exercise' ? 'bg-orange-400 border-orange-400' :
                  block.category === 'meal' ? 'bg-emerald-400 border-emerald-400' :
                  block.category === 'work' ? 'bg-blue-400 border-blue-400' :
                  block.category === 'study' ? 'bg-purple-400 border-purple-400' :
                  block.category === 'sleep' ? 'bg-indigo-400 border-indigo-400' :
                  block.category === 'leisure' ? 'bg-pink-400 border-pink-400' :
                  'bg-gray-300 border-gray-300'
                }`} />
                {i < schedule.blocks.length - 1 && (
                  <div className="w-0.5 h-full min-h-[20px] bg-gray-200" />
                )}
              </div>

              {/* Content */}
              <div className={`flex-1 mb-3 p-3 rounded-xl border ${categoryColors[block.category]}`}>
                <div className="flex items-center gap-1.5">
                  {categoryIcons[block.category]}
                  <span className="text-sm font-medium">{block.activity}</span>
                </div>
                {block.notes && (
                  <p className="text-xs mt-1 opacity-75 whitespace-pre-line">{block.notes}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tips */}
      <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200">
        <h3 className="font-semibold text-amber-800 text-sm">💡 Schedule Tips</h3>
        <ul className="text-xs text-amber-700 mt-2 space-y-1">
          <li>• This schedule is a guide — adjust times to match your energy levels</li>
          <li>• Move your exercise session if meetings conflict</li>
          <li>• On office day (Wed), batch-cook the night before for packed lunch</li>
          <li>• Saturday is your meal-prep day — cook dal, chop veggies for the week</li>
          <li>• Study sessions: use the Pomodoro technique (25 min study + 5 min break)</li>
        </ul>
      </div>
    </div>
  );
}
