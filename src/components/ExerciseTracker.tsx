import { useState, useMemo } from 'react';
import { Search, ExternalLink, ChevronDown, ChevronUp, Video } from 'lucide-react';
import type { Exercise, LoggedExercise } from '../types';
import { exerciseDatabase, exerciseCategoryLabels, youtubePlaylistRecommendations } from '../data/exercises';

interface ExerciseTrackerProps {
  onAddExercise: (exercise: LoggedExercise) => void;
}

export default function ExerciseTracker({ onAddExercise }: ExerciseTrackerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [duration, setDuration] = useState('15');
  const [sets, setSets] = useState('3');
  const [reps, setReps] = useState('12');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [showPlaylists, setShowPlaylists] = useState(false);

  const filteredExercises = useMemo(() => {
    if (!searchQuery.trim()) return exerciseDatabase;
    const query = searchQuery.toLowerCase();
    return exerciseDatabase.filter(e =>
      e.name.toLowerCase().includes(query) ||
      e.category.toLowerCase().includes(query) ||
      e.muscleGroups.some(g => g.toLowerCase().includes(query))
    );
  }, [searchQuery]);

  const groupedExercises = useMemo(() => {
    const groups: Record<string, Exercise[]> = {};
    filteredExercises.forEach(ex => {
      if (!groups[ex.category]) groups[ex.category] = [];
      groups[ex.category].push(ex);
    });
    return groups;
  }, [filteredExercises]);

  const handleAddExercise = () => {
    if (!selectedExercise) return;
    const dur = parseInt(duration) || 15;
    const logged: LoggedExercise = {
      id: Date.now().toString(),
      exerciseId: selectedExercise.id,
      name: selectedExercise.name,
      duration: dur,
      caloriesBurned: Math.round(selectedExercise.caloriesPerMinute * dur),
      sets: parseInt(sets) || undefined,
      reps: parseInt(reps) || undefined,
      timestamp: new Date().toISOString(),
    };
    onAddExercise(logged);
    setSelectedExercise(null);
    setDuration('15');
  };

  return (
    <div className="space-y-4 pb-24">
      <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-5 text-white">
        <h1 className="text-2xl font-bold">Exercise 🏋️</h1>
        <p className="text-sm opacity-90 mt-1">Log workouts & discover exercises</p>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowPlaylists(!showPlaylists)}
          className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium flex items-center justify-center gap-1 ${
            showPlaylists ? 'bg-red-100 text-red-700' : 'bg-white shadow-sm text-gray-600'
          }`}
        >
          <Video size={16} /> Workout Playlists
        </button>
      </div>

      {/* YouTube Playlists */}
      {showPlaylists && (
        <div className="bg-red-50 rounded-2xl p-4 border border-red-200 space-y-2">
          <h3 className="font-semibold text-red-800">📺 Recommended Workout Playlists</h3>
          {youtubePlaylistRecommendations.map((pl, i) => (
            <a
              key={i}
              href={`https://www.youtube.com/results?search_query=${encodeURIComponent(pl.searchQuery)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-white rounded-xl p-3 active:bg-gray-50"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-sm">{pl.name}</p>
                  <p className="text-xs text-gray-500">{pl.channel} · {pl.duration}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">{pl.frequency}</span>
                  <ExternalLink size={14} className="text-gray-400 mt-1 ml-auto" />
                </div>
              </div>
            </a>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search exercises... (e.g., squat, yoga, cardio)"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
      </div>

      {/* Selected Exercise */}
      {selectedExercise && (
        <div className="bg-orange-50 rounded-2xl p-4 border border-orange-200">
          <h3 className="font-semibold text-orange-800">{selectedExercise.name}</h3>
          <p className="text-xs text-orange-600">
            {selectedExercise.muscleGroups.join(', ')}
            {selectedExercise.equipment && ` · ${selectedExercise.equipment}`}
          </p>
          <div className="grid grid-cols-3 gap-2 mt-3">
            <div>
              <label className="text-xs text-gray-500">Minutes</label>
              <input
                type="number"
                value={duration}
                onChange={e => setDuration(e.target.value)}
                className="w-full border rounded-lg px-2 py-1.5 text-sm mt-1"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Sets</label>
              <input
                type="number"
                value={sets}
                onChange={e => setSets(e.target.value)}
                className="w-full border rounded-lg px-2 py-1.5 text-sm mt-1"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Reps</label>
              <input
                type="number"
                value={reps}
                onChange={e => setReps(e.target.value)}
                className="w-full border rounded-lg px-2 py-1.5 text-sm mt-1"
              />
            </div>
          </div>
          <p className="text-sm text-orange-700 mt-2">
            Estimated burn: <strong>{Math.round(selectedExercise.caloriesPerMinute * (parseInt(duration) || 15))} kcal</strong>
          </p>
          <div className="flex gap-2 mt-3">
            {selectedExercise.youtubeSearch && (
              <a
                href={`https://www.youtube.com/results?search_query=${encodeURIComponent(selectedExercise.youtubeSearch)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-red-500 text-white py-2 rounded-xl text-sm font-medium text-center flex items-center justify-center gap-1"
              >
                <Video size={16} /> How to do it
              </a>
            )}
            <button
              onClick={handleAddExercise}
              className="flex-1 bg-orange-600 text-white py-2 rounded-xl text-sm font-medium active:bg-orange-700"
            >
              Log Exercise ✓
            </button>
          </div>
        </div>
      )}

      {/* Exercise List */}
      <div className="space-y-2">
        {Object.entries(groupedExercises).map(([category, exercises]) => (
          <div key={category} className="bg-white rounded-xl shadow-sm overflow-hidden">
            <button
              onClick={() => setExpandedCategory(expandedCategory === category ? null : category)}
              className="w-full px-4 py-3 flex justify-between items-center"
            >
              <span className="font-medium text-sm">
                {exerciseCategoryLabels[category] || category} ({exercises.length})
              </span>
              {expandedCategory === category ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            {expandedCategory === category && (
              <div className="border-t">
                {exercises.map(exercise => (
                  <button
                    key={exercise.id}
                    onClick={() => { setSelectedExercise(exercise); setDuration('15'); }}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 active:bg-gray-100 border-b last:border-0"
                  >
                    <p className="text-sm font-medium">{exercise.name}</p>
                    <p className="text-xs text-gray-500">
                      {exercise.muscleGroups.join(', ')} · ~{exercise.caloriesPerMinute} kcal/min
                    </p>
                    {exercise.equipment && (
                      <p className="text-xs text-orange-500 mt-0.5">🏋️ {exercise.equipment}</p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
