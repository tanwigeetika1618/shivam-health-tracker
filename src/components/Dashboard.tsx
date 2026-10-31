import { useMemo } from 'react';
import { Droplets, Flame, Beef, LeafyGreen, TrendingUp, Plus, Minus } from 'lucide-react';
import type { DailyLog, UserProfile } from '../types';
import { calculateDailyTotals, calculateExerciseCalories, getCalorieStatus, calculateBMI, getBMICategory, getMacroPercentages } from '../utils/calculations';

interface DashboardProps {
  dailyLog: DailyLog;
  profile: UserProfile;
  onUpdateWater: (delta: number) => void;
}

function CircularProgress({ value, max, size = 130 }: {
  value: number; max: number; size?: number;
}) {
  const percentage = Math.min((value / max) * 100, 100);
  const radius = (size - 14) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  const isOver = value > max;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={isOver ? '#ef4444' : '#3b82f6'} />
            <stop offset="100%" stopColor={isOver ? '#f87171' : '#60a5fa'} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(59,130,246,0.15)" strokeWidth="10" />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke="url(#progressGrad)" strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          className="progress-ring-circle"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-black stat-number text-white">{Math.round(value)}</span>
        <span className="text-[10px] text-gray-500 font-medium">/ {max} kcal</span>
      </div>
    </div>
  );
}

function MacroBar({ label, value, target, color, icon }: {
  label: string; value: number; target: number; color: string; icon: string;
}) {
  const percentage = Math.min((value / target) * 100, 100);
  return (
    <div className="flex items-center gap-3">
      <span className="text-lg w-7 text-center">{icon}</span>
      <div className="flex-1">
        <div className="flex justify-between mb-1">
          <span className="text-xs font-semibold text-gray-400">{label}</span>
          <span className="text-xs font-bold stat-number" style={{ color }}>
            {Math.round(value)}<span className="text-gray-600 font-normal">/{target}g</span>
          </span>
        </div>
        <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${percentage}%`,
              background: `linear-gradient(90deg, ${color}, ${color}cc)`,
              boxShadow: percentage > 10 ? `0 0 12px ${color}50` : 'none',
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard({ dailyLog, profile, onUpdateWater }: DashboardProps) {
  const totals = useMemo(() => calculateDailyTotals(dailyLog.foods), [dailyLog.foods]);
  const exerciseCals = useMemo(() => calculateExerciseCalories(dailyLog.exercises), [dailyLog.exercises]);
  const netCalories = totals.calories - exerciseCals;
  const calorieStatus = getCalorieStatus(totals.calories, profile.targetCalories);
  const bmi = calculateBMI(profile.currentWeightKg, profile.heightCm);
  const bmiCategory = getBMICategory(bmi);
  const macroPercent = getMacroPercentages(totals.protein, totals.carbs, totals.fat);

  const today = new Date();
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });
  const dateStr = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const greeting = today.getHours() < 12 ? 'Good morning' : today.getHours() < 17 ? 'Good afternoon' : 'Good evening';

  const waterGlasses = Math.floor(dailyLog.water / 250);
  const maxGlasses = Math.ceil(profile.targetWater / 250);

  return (
    <div className="space-y-4 pb-24">
      {/* Full-Page Profile Hero */}
      <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-blue-900/30" style={{ minHeight: '280px' }}>
        <img
          src={import.meta.env.BASE_URL + 'shivam-avatar.jpg'}
          alt="Shivam"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1a] via-[#0a0f1a]/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/30 to-indigo-900/20" />

        <div className="relative z-10 p-6 pt-40">
          <p className="text-xs font-medium text-blue-300/80 tracking-wide uppercase">{dayName} · {dateStr}</p>
          <h1 className="text-2xl font-black text-white mt-1">{greeting}, {profile.name}! 💪</h1>
          <p className="text-sm text-blue-200/80 mt-1 leading-relaxed">
            {dailyLog.foods.length === 0
              ? "Time to fuel those gains! Let's eat big today!"
              : calorieStatus.message}
          </p>
        </div>
      </div>

      {/* Calorie Ring Card */}
      <div className="card p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-bold text-gray-500 tracking-widest uppercase">Today's Calories</h2>
          <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-semibold">
            {Math.round((totals.calories / profile.targetCalories) * 100)}%
          </span>
        </div>
        <div className="flex items-center justify-around">
          <div className="text-center">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto mb-2">
              <Flame className="text-blue-400" size={22} />
            </div>
            <p className="text-2xl font-black text-blue-400 stat-number">{Math.round(totals.calories)}</p>
            <p className="text-[10px] text-gray-500 font-medium">Eaten</p>
          </div>
          <CircularProgress value={totals.calories} max={profile.targetCalories} />
          <div className="text-center">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center mx-auto mb-2">
              <TrendingUp className="text-orange-400" size={22} />
            </div>
            <p className="text-2xl font-black text-orange-400 stat-number">{exerciseCals}</p>
            <p className="text-[10px] text-gray-500 font-medium">Burned</p>
          </div>
        </div>
        <div className="mt-4 flex justify-center gap-6 text-center">
          <div>
            <p className="text-xs text-gray-500">Net</p>
            <p className="text-sm font-bold text-gray-300 stat-number">{Math.round(netCalories)}</p>
          </div>
          <div className="w-px bg-white/10" />
          <div>
            <p className="text-xs text-gray-500">Remaining</p>
            <p className="text-sm font-bold text-blue-400 stat-number">{Math.max(0, Math.round(profile.targetCalories - totals.calories))}</p>
          </div>
        </div>
      </div>

      {/* Macros */}
      <div className="card p-5 space-y-4 animate-fade-in-delay">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-gray-500 tracking-widest uppercase">Macros</h2>
          <div className="flex gap-1.5">
            <span className="text-[10px] bg-blue-500/15 text-blue-400 px-2 py-0.5 rounded-full font-bold">P {macroPercent.protein}%</span>
            <span className="text-[10px] bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded-full font-bold">C {macroPercent.carbs}%</span>
            <span className="text-[10px] bg-rose-500/15 text-rose-400 px-2 py-0.5 rounded-full font-bold">F {macroPercent.fat}%</span>
          </div>
        </div>
        <MacroBar label="Protein" value={totals.protein} target={profile.targetProtein} color="#60a5fa" icon="🥩" />
        <MacroBar label="Carbs" value={totals.carbs} target={profile.targetCarbs} color="#fbbf24" icon="🌾" />
        <MacroBar label="Fat" value={totals.fat} target={profile.targetFat} color="#fb7185" icon="🥑" />
        <MacroBar label="Fiber" value={totals.fiber} target={profile.targetFiber} color="#34d399" icon="🥬" />
      </div>

      {/* Water Tracker */}
      <div className="card p-5 animate-fade-in">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold text-gray-500 tracking-widest uppercase">Water Intake</h2>
          <span className="text-xs font-bold text-blue-400 stat-number">
            {dailyLog.water} / {profile.targetWater} ml
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Droplets className="text-blue-400" size={26} />
            <div>
              <p className="text-3xl font-black text-blue-400 stat-number">{waterGlasses}</p>
              <p className="text-[10px] text-gray-500">glasses</p>
            </div>
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap gap-1">
              {Array.from({ length: maxGlasses }, (_, i) => (
                <div
                  key={i}
                  className={`w-5 h-7 rounded-md transition-all duration-300 ${
                    i < waterGlasses
                      ? 'bg-gradient-to-t from-blue-600 to-blue-400 shadow-sm shadow-blue-500/30'
                      : 'bg-white/5 border border-white/10'
                  }`}
                />
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <button
              onClick={() => onUpdateWater(250)}
              className="w-9 h-9 rounded-xl bg-blue-500 text-white flex items-center justify-center active:scale-95 transition-transform shadow-lg shadow-blue-500/30"
            >
              <Plus size={18} />
            </button>
            <button
              onClick={() => onUpdateWater(-250)}
              className="w-9 h-9 rounded-xl bg-white/10 text-gray-400 flex items-center justify-center active:scale-95 transition-transform"
            >
              <Minus size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4 text-center">
          <div className="w-10 h-10 rounded-2xl bg-orange-500/10 flex items-center justify-center mx-auto mb-2">
            <Flame className="text-orange-400" size={20} />
          </div>
          <p className="text-2xl font-black text-white stat-number">{dailyLog.foods.length}</p>
          <p className="text-[10px] text-gray-500 font-medium mt-0.5">Meals Logged</p>
        </div>
        <div className="card p-4 text-center">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto mb-2">
            <Beef className="text-blue-400" size={20} />
          </div>
          <p className="text-2xl font-black text-white stat-number">{dailyLog.exercises.length}</p>
          <p className="text-[10px] text-gray-500 font-medium mt-0.5">Exercises Done</p>
        </div>
        <div className="card p-4 text-center">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-2">
            <TrendingUp className="text-emerald-400" size={20} />
          </div>
          <p className="text-xl font-black text-white stat-number">{bmi}</p>
          <p className="text-[10px] text-gray-500 font-medium mt-0.5">BMI · {bmiCategory}</p>
        </div>
        <div className="card p-4 text-center">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 flex items-center justify-center mx-auto mb-2">
            <LeafyGreen className="text-cyan-400" size={20} />
          </div>
          <p className="text-xl font-black text-white stat-number">{profile.currentWeightKg}<span className="text-gray-600 text-sm">→</span>{profile.targetWeightKg}</p>
          <p className="text-[10px] text-gray-500 font-medium mt-0.5">Muscle Gain Goal (kg)</p>
        </div>
      </div>

      {/* Today's Meals Summary */}
      {dailyLog.foods.length > 0 && (
        <div className="card p-5 animate-fade-in">
          <h2 className="text-xs font-bold text-gray-500 tracking-widest uppercase mb-4">Today's Meals</h2>
          {(['breakfast', 'lunch', 'snack', 'dinner'] as const).map(mealType => {
            const mealFoods = dailyLog.foods.filter(f => f.mealType === mealType);
            if (mealFoods.length === 0) return null;
            const mealCals = mealFoods.reduce((sum, f) => sum + f.calories, 0);
            const mealProtein = mealFoods.reduce((sum, f) => sum + f.protein, 0);
            const mealIcons = { breakfast: '🌅', lunch: '☀️', snack: '🍎', dinner: '🌙' };
            const mealColors = {
              breakfast: 'from-amber-500/10 to-orange-500/10 border-amber-500/20',
              lunch: 'from-yellow-500/10 to-lime-500/10 border-lime-500/20',
              snack: 'from-cyan-500/10 to-blue-500/10 border-cyan-500/20',
              dinner: 'from-indigo-500/10 to-blue-500/10 border-indigo-500/20',
            };
            return (
              <div key={mealType} className={`mb-3 last:mb-0 p-3 rounded-2xl bg-gradient-to-r border ${mealColors[mealType]}`}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-sm font-bold capitalize text-gray-200">
                    {mealIcons[mealType]} {mealType}
                  </span>
                  <div className="text-right">
                    <span className="text-sm font-black text-gray-200">{Math.round(mealCals)}</span>
                    <span className="text-[10px] text-gray-500 ml-0.5">kcal</span>
                    <span className="text-[10px] text-blue-400 ml-2">{Math.round(mealProtein)}g P</span>
                  </div>
                </div>
                {mealFoods.map(food => (
                  <p key={food.id} className="text-xs text-gray-500 ml-6 leading-relaxed">
                    {food.name} · {Math.round(food.calories)} kcal
                  </p>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* Today's Exercises */}
      {dailyLog.exercises.length > 0 && (
        <div className="card p-5 animate-fade-in">
          <h2 className="text-xs font-bold text-gray-500 tracking-widest uppercase mb-4">Today's Exercises</h2>
          {dailyLog.exercises.map(ex => (
            <div key={ex.id} className="mb-2 last:mb-0 p-3 rounded-2xl bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/20">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-200">🏋️ {ex.name}</span>
                <div className="text-right">
                  <span className="text-sm font-black text-orange-400">{ex.caloriesBurned}</span>
                  <span className="text-[10px] text-gray-500 ml-0.5">kcal</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 ml-6">
                {ex.duration} min{ex.sets ? ` · ${ex.sets} sets` : ''}{ex.reps ? ` × ${ex.reps} reps` : ''}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
