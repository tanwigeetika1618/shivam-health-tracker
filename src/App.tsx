import { useState, useCallback } from 'react';
import { LayoutDashboard, Sparkles, Calendar, TrendingUp, List, Moon, Bell, ChefHat } from 'lucide-react';
import Dashboard from './components/Dashboard';
import QuickLog from './components/QuickLog';
import FoodLogger from './components/FoodLogger';
import ExerciseTracker from './components/ExerciseTracker';
import Schedule from './components/Schedule';
import Progress from './components/Progress';
import SleepTracker from './components/SleepTracker';
import Reminders, { DEFAULT_REMINDERS } from './components/Reminders';
import MealPlan from './components/MealPlan';
import { useLocalStorage, getTodayKey } from './hooks/useLocalStorage';
import { DEFAULT_PROFILE } from './utils/calculations';
import type { DailyLog, LoggedFood, LoggedExercise, UserProfile, FoodItem, WeightEntry } from './types';
import type { SleepEntry } from './components/SleepTracker';
import type { Reminder } from './components/Reminders';

type Tab = 'dashboard' | 'quicklog' | 'browse' | 'schedule' | 'progress' | 'sleep' | 'reminders' | 'mealplan';

const emptyDailyLog: DailyLog = {
  date: getTodayKey(),
  foods: [],
  exercises: [],
  water: 0,
};

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [profile, setProfile] = useLocalStorage<UserProfile>('shivam-profile', DEFAULT_PROFILE);
  const [dailyLogs, setDailyLogs] = useLocalStorage<Record<string, DailyLog>>('shivam-daily-logs', {});
  const [weightEntries, setWeightEntries] = useLocalStorage<WeightEntry[]>('shivam-weight-entries', []);
  const [customFoods, setCustomFoods] = useLocalStorage<FoodItem[]>('shivam-custom-foods', []);
  const [sleepEntries, setSleepEntries] = useLocalStorage<SleepEntry[]>('shivam-sleep-entries', []);
  const [reminders, setReminders] = useLocalStorage<Reminder[]>('shivam-reminders', DEFAULT_REMINDERS);
  const [browseMode, setBrowseMode] = useState<'food' | 'exercise'>('food');

  const todayKey = getTodayKey();
  const todayLog = dailyLogs[todayKey] || { ...emptyDailyLog, date: todayKey };

  const updateTodayLog = useCallback((updater: (log: DailyLog) => DailyLog) => {
    setDailyLogs(prev => ({
      ...prev,
      [todayKey]: updater(prev[todayKey] || { ...emptyDailyLog, date: todayKey }),
    }));
  }, [todayKey, setDailyLogs]);

  const handleAddFood = useCallback((food: LoggedFood) => {
    updateTodayLog(log => ({ ...log, foods: [...log.foods, food] }));
  }, [updateTodayLog]);

  const handleAddFoods = useCallback((foods: LoggedFood[]) => {
    updateTodayLog(log => ({ ...log, foods: [...log.foods, ...foods] }));
  }, [updateTodayLog]);

  const handleAddExercise = useCallback((exercise: LoggedExercise) => {
    updateTodayLog(log => ({ ...log, exercises: [...log.exercises, exercise] }));
  }, [updateTodayLog]);

  const handleAddExercises = useCallback((exercises: LoggedExercise[]) => {
    updateTodayLog(log => ({ ...log, exercises: [...log.exercises, ...exercises] }));
  }, [updateTodayLog]);

  const handleUpdateWater = useCallback((delta: number) => {
    updateTodayLog(log => ({
      ...log,
      water: Math.max(0, (log.water || 0) + delta),
    }));
  }, [updateTodayLog]);

  const handleAddWeight = useCallback((entry: WeightEntry) => {
    setWeightEntries(prev => {
      const filtered = prev.filter(e => e.date !== entry.date);
      return [...filtered, entry].sort((a, b) => a.date.localeCompare(b.date));
    });
  }, [setWeightEntries]);

  const handleUpdateProfile = useCallback((updates: Partial<UserProfile>) => {
    setProfile(prev => ({ ...prev, ...updates }));
  }, [setProfile]);

  const handleAddCustomFood = useCallback((food: FoodItem) => {
    setCustomFoods(prev => [...prev, food]);
  }, [setCustomFoods]);

  const handleAddSleep = useCallback((entry: SleepEntry) => {
    setSleepEntries(prev => {
      const filtered = prev.filter(e => e.date !== entry.date);
      return [...filtered, entry].sort((a, b) => a.date.localeCompare(b.date));
    });
  }, [setSleepEntries]);

  const mainTabs: { id: Tab; icon: React.ReactNode; label: string }[] = [
    { id: 'dashboard', icon: <LayoutDashboard size={20} />, label: 'Home' },
    { id: 'quicklog', icon: <Sparkles size={20} />, label: 'Log' },
    { id: 'sleep', icon: <Moon size={20} />, label: 'Sleep' },
    { id: 'reminders', icon: <Bell size={20} />, label: 'Alerts' },
  ];

  const secondaryTabs: { id: Tab; icon: React.ReactNode; label: string }[] = [
    { id: 'mealplan', icon: <ChefHat size={18} />, label: 'Meals' },
    { id: 'browse', icon: <List size={18} />, label: 'Browse' },
    { id: 'schedule', icon: <Calendar size={18} />, label: 'Schedule' },
    { id: 'progress', icon: <TrendingUp size={18} />, label: 'Progress' },
  ];

  return (
    <div className="min-h-screen" style={{ background: '#0a0f1a' }}>
      <div className="fixed top-0 left-0 right-0 z-10 bottom-nav">
        <div className="max-w-lg mx-auto flex items-center px-2 py-1.5 gap-1">
          {secondaryTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'text-gray-600 hover:text-gray-400'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-lg mx-auto px-4 pt-12">
        {activeTab === 'dashboard' && (
          <Dashboard
            dailyLog={todayLog}
            profile={profile}
            onUpdateWater={handleUpdateWater}
          />
        )}
        {activeTab === 'quicklog' && (
          <QuickLog
            onAddFoods={handleAddFoods}
            onAddExercises={handleAddExercises}
            customFoods={customFoods}
          />
        )}
        {activeTab === 'sleep' && (
          <SleepTracker
            sleepEntries={sleepEntries}
            onAddSleep={handleAddSleep}
            todayLog={todayLog}
          />
        )}
        {activeTab === 'reminders' && (
          <Reminders
            reminders={reminders}
            onUpdateReminders={setReminders}
          />
        )}
        {activeTab === 'mealplan' && <MealPlan />}
        {activeTab === 'browse' && (
          <div className="space-y-3 pb-24">
            <div className="flex gap-2 p-1 bg-white/60 rounded-2xl backdrop-blur-sm">
              <button
                onClick={() => setBrowseMode('food')}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                  browseMode === 'food' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-200' : 'text-gray-500'
                }`}
              >
                🍽️ Food Database
              </button>
              <button
                onClick={() => setBrowseMode('exercise')}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                  browseMode === 'exercise' ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-200' : 'text-gray-500'
                }`}
              >
                🏋️ Exercises
              </button>
            </div>
            {browseMode === 'food' ? (
              <FoodLogger
                onAddFood={handleAddFood}
                onAddCustomFood={handleAddCustomFood}
                customFoods={customFoods}
              />
            ) : (
              <ExerciseTracker onAddExercise={handleAddExercise} />
            )}
          </div>
        )}
        {activeTab === 'schedule' && <Schedule />}
        {activeTab === 'progress' && (
          <Progress
            weightEntries={weightEntries}
            profile={profile}
            dailyLogs={dailyLogs}
            onAddWeight={handleAddWeight}
            onUpdateProfile={handleUpdateProfile}
          />
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bottom-nav safe-area-bottom">
        <div className="max-w-lg mx-auto flex">
          {mainTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex flex-col items-center py-2 pt-3 transition-all relative ${
                activeTab === tab.id
                  ? 'text-blue-500 nav-item-active'
                  : 'text-gray-400'
              }`}
            >
              {tab.icon}
              <span className="text-[10px] mt-0.5 font-bold">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
