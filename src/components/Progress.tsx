import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { Plus, Target, TrendingDown, Calendar, Scale } from 'lucide-react';
import type { WeightEntry, UserProfile, DailyLog } from '../types';
import { calculateBMI, getBMICategory, calculateWeightProgress, getWeeklyWeightGain } from '../utils/calculations';

interface ProgressProps {
  weightEntries: WeightEntry[];
  profile: UserProfile;
  dailyLogs: Record<string, DailyLog>;
  onAddWeight: (entry: WeightEntry) => void;
  onUpdateProfile: (updates: Partial<UserProfile>) => void;
}

export default function Progress({ weightEntries, profile, dailyLogs, onAddWeight, onUpdateProfile }: ProgressProps) {
  const [showWeightForm, setShowWeightForm] = useState(false);
  const [newWeight, setNewWeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [muscleMass, setMuscleMass] = useState('');
  const [bodyWater, setBodyWater] = useState('');
  const [showProfileEdit, setShowProfileEdit] = useState(false);

  const latestWeight = weightEntries.length > 0
    ? weightEntries[weightEntries.length - 1].weight
    : profile.currentWeightKg;

  const bmi = calculateBMI(latestWeight, profile.heightCm);
  const progress = calculateWeightProgress(latestWeight, profile.currentWeightKg, profile.targetWeightKg);
  const weeklyTarget = getWeeklyWeightGain(profile.currentWeightKg, profile.targetWeightKg, profile.targetMonths);

  const chartData = useMemo(() => {
    return weightEntries.map(entry => ({
      date: new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      weight: entry.weight,
      bodyFat: entry.bodyFat,
      muscleMass: entry.muscleMass,
      target: profile.targetWeightKg,
    }));
  }, [weightEntries, profile.targetWeightKg]);

  const weeklyCalorieData = useMemo(() => {
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const key = date.toISOString().split('T')[0];
      const log = dailyLogs[key];
      const calories = log?.foods.reduce((sum, f) => sum + f.calories, 0) || 0;
      const protein = log?.foods.reduce((sum, f) => sum + f.protein, 0) || 0;
      last7Days.push({
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        calories: Math.round(calories),
        protein: Math.round(protein),
        target: profile.targetCalories,
      });
    }
    return last7Days;
  }, [dailyLogs, profile.targetCalories]);

  const handleAddWeight = () => {
    const weight = parseFloat(newWeight);
    if (!weight) return;
    const entry: WeightEntry = {
      date: new Date().toISOString().split('T')[0],
      weight,
      bodyFat: parseFloat(bodyFat) || undefined,
      muscleMass: parseFloat(muscleMass) || undefined,
      bodyWater: parseFloat(bodyWater) || undefined,
    };
    onAddWeight(entry);
    onUpdateProfile({ currentWeightKg: weight });
    setNewWeight('');
    setBodyFat('');
    setMuscleMass('');
    setBodyWater('');
    setShowWeightForm(false);
  };

  return (
    <div className="space-y-4 pb-24">
      <div className="bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl p-5 text-white">
        <h1 className="text-2xl font-bold">Progress 📊</h1>
        <p className="text-sm opacity-90 mt-1">Track your transformation journey</p>
      </div>

      {/* Current Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl p-3 shadow-sm text-center">
          <Scale className="text-teal-500 mx-auto mb-1" size={20} />
          <p className="text-xl font-bold">{latestWeight}</p>
          <p className="text-xs text-gray-500">Current (kg)</p>
        </div>
        <div className="bg-white rounded-2xl p-3 shadow-sm text-center">
          <Target className="text-violet-500 mx-auto mb-1" size={20} />
          <p className="text-xl font-bold">{profile.targetWeightKg}</p>
          <p className="text-xs text-gray-500">Target (kg)</p>
        </div>
        <div className="bg-white rounded-2xl p-3 shadow-sm text-center">
          <TrendingDown className="text-emerald-500 mx-auto mb-1" size={20} />
          <p className="text-xl font-bold">{bmi}</p>
          <p className="text-xs text-gray-500">BMI ({getBMICategory(bmi)})</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-600">Muscle Gain Progress</span>
          <span className="text-sm font-bold text-teal-600">{progress}%</span>
        </div>
        <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-teal-400 to-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs text-gray-400">{profile.currentWeightKg} kg (start)</span>
          <span className="text-xs text-gray-400">{profile.targetWeightKg} kg (goal)</span>
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          Target: +{weeklyTarget} kg/week · {profile.targetWeightKg - latestWeight > 0 ? `${(profile.targetWeightKg - latestWeight).toFixed(1)} kg to go` : 'Goal reached! 🎉'}
        </p>
      </div>

      {/* Log Weight */}
      <button
        onClick={() => setShowWeightForm(!showWeightForm)}
        className="w-full bg-white rounded-xl shadow-sm p-4 flex items-center gap-3 active:bg-gray-50"
      >
        <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
          <Plus size={20} className="text-teal-600" />
        </div>
        <div className="text-left">
          <p className="text-sm font-medium">Log Today's Weight</p>
          <p className="text-xs text-gray-500">Use your smart weighing scale readings</p>
        </div>
      </button>

      {showWeightForm && (
        <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
          <h3 className="font-medium text-sm text-gray-700">📱 Enter your smart scale readings</h3>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-500">Weight (kg)*</label>
              <input
                type="number"
                step="0.1"
                value={newWeight}
                onChange={e => setNewWeight(e.target.value)}
                placeholder="e.g., 64.5"
                className="w-full border rounded-lg px-3 py-2 text-sm mt-1"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Body Fat %</label>
              <input
                type="number"
                step="0.1"
                value={bodyFat}
                onChange={e => setBodyFat(e.target.value)}
                placeholder="e.g., 32.5"
                className="w-full border rounded-lg px-3 py-2 text-sm mt-1"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Muscle Mass %</label>
              <input
                type="number"
                step="0.1"
                value={muscleMass}
                onChange={e => setMuscleMass(e.target.value)}
                placeholder="e.g., 25.0"
                className="w-full border rounded-lg px-3 py-2 text-sm mt-1"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Body Water %</label>
              <input
                type="number"
                step="0.1"
                value={bodyWater}
                onChange={e => setBodyWater(e.target.value)}
                placeholder="e.g., 50.0"
                className="w-full border rounded-lg px-3 py-2 text-sm mt-1"
              />
            </div>
          </div>
          <p className="text-xs text-gray-400">
            💡 Tip: Weigh yourself first thing in the morning, after using the washroom, before eating/drinking. Stand barefoot on the scale for body composition readings.
          </p>
          <button
            onClick={handleAddWeight}
            disabled={!newWeight}
            className="w-full bg-teal-600 text-white py-2 rounded-xl text-sm font-medium disabled:opacity-50"
          >
            Save Weight Entry
          </button>
        </div>
      )}

      {/* Weight Chart */}
      {chartData.length > 1 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-500 mb-3">WEIGHT TREND</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis domain={['dataMin - 2', 'dataMax + 2']} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="weight" stroke="#14b8a6" strokeWidth={2} dot={{ fill: '#14b8a6' }} />
              <Line type="monotone" dataKey="target" stroke="#e5e7eb" strokeDasharray="5 5" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Body Composition Chart */}
      {chartData.some(d => d.bodyFat) && (
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-500 mb-3">BODY COMPOSITION</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="bodyFat" name="Body Fat %" stroke="#ef4444" strokeWidth={2} />
              <Line type="monotone" dataKey="muscleMass" name="Muscle %" stroke="#8b5cf6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Weekly Calorie Chart */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-500 mb-3">LAST 7 DAYS — CALORIES</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={weeklyCalorieData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="day" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Bar dataKey="calories" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            <Line type="monotone" dataKey="target" stroke="#e5e7eb" strokeDasharray="5 5" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Profile Settings */}
      <button
        onClick={() => setShowProfileEdit(!showProfileEdit)}
        className="w-full bg-white rounded-xl shadow-sm p-4 flex items-center gap-3 active:bg-gray-50"
      >
        <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center">
          <Calendar size={20} className="text-violet-600" />
        </div>
        <div className="text-left">
          <p className="text-sm font-medium">Edit Goals & Profile</p>
          <p className="text-xs text-gray-500">Update targets, weight goal, timeline</p>
        </div>
      </button>

      {showProfileEdit && (
        <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-500">Target Weight (kg)</label>
              <input
                type="number"
                value={profile.targetWeightKg}
                onChange={e => onUpdateProfile({ targetWeightKg: parseFloat(e.target.value) || 50 })}
                className="w-full border rounded-lg px-3 py-2 text-sm mt-1"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Timeline (months)</label>
              <input
                type="number"
                value={profile.targetMonths}
                onChange={e => onUpdateProfile({ targetMonths: parseInt(e.target.value) || 6 })}
                className="w-full border rounded-lg px-3 py-2 text-sm mt-1"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Daily Calories Target</label>
              <input
                type="number"
                value={profile.targetCalories}
                onChange={e => onUpdateProfile({ targetCalories: parseInt(e.target.value) || 1250 })}
                className="w-full border rounded-lg px-3 py-2 text-sm mt-1"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Protein Target (g)</label>
              <input
                type="number"
                value={profile.targetProtein}
                onChange={e => onUpdateProfile({ targetProtein: parseInt(e.target.value) || 75 })}
                className="w-full border rounded-lg px-3 py-2 text-sm mt-1"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Fiber Target (g)</label>
              <input
                type="number"
                value={profile.targetFiber}
                onChange={e => onUpdateProfile({ targetFiber: parseInt(e.target.value) || 28 })}
                className="w-full border rounded-lg px-3 py-2 text-sm mt-1"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Water Target (ml)</label>
              <input
                type="number"
                value={profile.targetWater}
                onChange={e => onUpdateProfile({ targetWater: parseInt(e.target.value) || 2500 })}
                className="w-full border rounded-lg px-3 py-2 text-sm mt-1"
              />
            </div>
          </div>
        </div>
      )}

      {/* Smart Scale Guide */}
      <div className="bg-teal-50 rounded-2xl p-4 border border-teal-200">
        <h3 className="font-semibold text-teal-800 text-sm">📱 Using Your Smart Weighing Scale</h3>
        <ol className="text-xs text-teal-700 mt-2 space-y-1 list-decimal list-inside">
          <li>Download the companion app (check the brand — usually the manual has a QR code)</li>
          <li>Connect via Bluetooth from the app</li>
          <li>Step on barefoot — wet feet conduct better for body composition</li>
          <li>Stand still for 5-10 seconds until readings stabilize</li>
          <li>The app will show: Weight, Body Fat %, Muscle Mass %, Body Water %, BMI, etc.</li>
          <li>Log the readings here in the tracker daily (morning, empty stomach)</li>
        </ol>
        <p className="text-xs text-teal-600 mt-2 italic">
          Note: Body fat % from smart scales isn't perfectly accurate, but tracking the <strong>trend</strong> over weeks is very useful!
        </p>
      </div>
    </div>
  );
}
