import { useState, useRef, useCallback } from 'react';
import { Mic, MicOff, Send, Sparkles, X, Check, Trash2, ChevronDown, ChevronUp, Pencil } from 'lucide-react';
import { parseFoodInput, parsedToLoggedFoods, parseExerciseInput, parsedToLoggedExercises } from '../utils/foodParser';
import type { FoodItem, LoggedFood, LoggedExercise } from '../types';

interface QuickLogProps {
  onAddFoods: (foods: LoggedFood[]) => void;
  onAddExercises: (exercises: LoggedExercise[]) => void;
  customFoods: FoodItem[];
}

type LogMode = 'food' | 'exercise';

interface SpeechRecognitionEvent {
  results: { [index: number]: { [index: number]: { transcript: string } }; length: number };
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
  }
}

export default function QuickLog({ onAddFoods, onAddExercises, customFoods }: QuickLogProps) {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [mode, setMode] = useState<LogMode>('food');
  const [showResults, setShowResults] = useState(false);
  const [parsedFoods, setParsedFoods] = useState<ReturnType<typeof parseFoodInput>>([]);
  const [parsedExercises, setParsedExercises] = useState<ReturnType<typeof parseExerciseInput>>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editQty, setEditQty] = useState('');
  const [showExamples, setShowExamples] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice input is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-IN';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i] && 'isFinal' in event.results[i] && (event.results[i] as unknown as { isFinal: boolean }).isFinal) {
          finalTranscript += transcript;
        }
      }

      if (finalTranscript) {
        setText(prev => (prev ? prev + ', ' : '') + finalTranscript.trim());
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  }, []);

  const handleParse = () => {
    if (!text.trim()) return;
    setConfirmed(false);

    if (mode === 'food') {
      const results = parseFoodInput(text, customFoods);
      setParsedFoods(results);
    } else {
      const results = parseExerciseInput(text);
      setParsedExercises(results);
    }
    setShowResults(true);
  };

  const handleConfirm = () => {
    if (mode === 'food' && parsedFoods.length > 0) {
      onAddFoods(parsedToLoggedFoods(parsedFoods));
    } else if (mode === 'exercise' && parsedExercises.length > 0) {
      onAddExercises(parsedToLoggedExercises(parsedExercises));
    }
    setConfirmed(true);
    setTimeout(() => {
      setText('');
      setShowResults(false);
      setParsedFoods([]);
      setParsedExercises([]);
      setConfirmed(false);
    }, 1500);
  };

  const removeParsedFood = (index: number) => {
    setParsedFoods(prev => prev.filter((_, i) => i !== index));
  };

  const removeParsedExercise = (index: number) => {
    setParsedExercises(prev => prev.filter((_, i) => i !== index));
  };

  const updateFoodQuantity = (index: number, newQty: number) => {
    setParsedFoods(prev => prev.map((item, i) =>
      i === index ? { ...item, quantity: newQty } : item
    ));
    setEditingIndex(null);
  };

  const totalCals = parsedFoods.reduce((sum, f) => sum + f.food.calories * f.quantity, 0);
  const totalProtein = parsedFoods.reduce((sum, f) => sum + f.food.protein * f.quantity, 0);
  const totalFiber = parsedFoods.reduce((sum, f) => sum + f.food.fiber * f.quantity, 0);
  const totalFat = parsedFoods.reduce((sum, f) => sum + f.food.fat * f.quantity, 0);
  const totalExCals = parsedExercises.reduce((sum, e) => sum + e.exercise.caloriesPerMinute * e.duration, 0);
  const totalExMins = parsedExercises.reduce((sum, e) => sum + e.duration, 0);

  const mealIcons: Record<string, string> = { breakfast: '🌅', lunch: '☀️', snack: '🍎', dinner: '🌙' };

  const foodExamples = [
    'breakfast: 2 boiled eggs, 1 banana, oats with milk and chia seeds',
    'had smoothie with strawberry banana milk. lunch: 2 roti dal sabzi curd',
    'snack: greek yogurt almonds green tea. dinner: khichdi with papad',
    'morning: poha with peanuts. evening: paneer bhurji 1 roti raita',
  ];

  const exerciseExamples = [
    'did high knees for 5 mins and 20 squats',
    '30 min yoga, 10 min stretching, 15 min walking',
    'banded squats 15 min, glute bridges 10 min, plank 3 min',
    'swimming 30 min and then stretching for 10 min',
  ];

  return (
    <div className="space-y-4 pb-24">
      {/* Hero Header */}
      <div className="hero-quicklog hero-shimmer rounded-3xl p-6 text-white shadow-lg shadow-violet-200">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
            <Sparkles size={18} />
          </div>
          <h1 className="text-xl font-black">Quick Log</h1>
        </div>
        <p className="text-sm opacity-90 mt-1 leading-relaxed">
          Just type or speak what you ate or did — I'll calculate everything for you! 🎯
        </p>
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-2 p-1 bg-white/60 rounded-2xl backdrop-blur-sm">
        <button
          onClick={() => { setMode('food'); setShowResults(false); }}
          className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
            mode === 'food'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-200'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          🍽️ Food
        </button>
        <button
          onClick={() => { setMode('exercise'); setShowResults(false); }}
          className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
            mode === 'exercise'
              ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-200'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          🏋️ Exercise
        </button>
      </div>

      {/* Input Area */}
      <div className="card overflow-hidden">
        <textarea
          value={text}
          onChange={e => { setText(e.target.value); setShowResults(false); setConfirmed(false); }}
          placeholder={mode === 'food'
            ? '🎤 "breakfast: 2 eggs, banana, oats with milk and chia seeds. lunch: dal roti sabzi..."'
            : '🎤 "did high knees for 5 mins and 20 squats, 30 min yoga..."'
          }
          className="w-full p-5 text-sm resize-none focus:outline-none min-h-[110px] bg-transparent placeholder:text-gray-600 text-gray-200"
          rows={4}
        />

        <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-t border-white/5">
          <div className="flex gap-2">
            <button
              onClick={isListening ? stopListening : startListening}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                isListening
                  ? 'bg-red-500 text-white shadow-lg shadow-red-200 scale-105'
                  : 'bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-md shadow-violet-200 hover:shadow-lg active:scale-95'
              }`}
            >
              {isListening ? <MicOff size={14} /> : <Mic size={14} />}
              {isListening ? 'Stop' : '🎤 Speak'}
            </button>
            {text && (
              <button
                onClick={() => { setText(''); setShowResults(false); setParsedFoods([]); setParsedExercises([]); }}
                className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs bg-gray-100 text-gray-500 active:scale-95 transition-transform"
              >
                <X size={14} /> Clear
              </button>
            )}
          </div>
          <button
            onClick={handleParse}
            disabled={!text.trim()}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-violet-600 to-purple-600 text-white disabled:opacity-30 shadow-md shadow-violet-200 active:scale-95 transition-all"
          >
            <Send size={14} /> Calculate
          </button>
        </div>
      </div>

      {/* Listening Animation */}
      {isListening && (
        <div className="card p-4 flex items-center gap-4 border-2 border-red-200 animate-fade-in">
          <div className="listening-wave">
            <span className="bg-red-500" />
            <span className="bg-red-400" />
            <span className="bg-red-500" />
            <span className="bg-red-400" />
            <span className="bg-red-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-red-600">Listening...</p>
            <p className="text-[10px] text-red-400">Speak naturally — English or Hinglish both work!</p>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {confirmed && (
        <div className="card p-4 bg-emerald-50 border-2 border-emerald-200 flex items-center gap-3 animate-fade-in">
          <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white">
            <Check size={20} />
          </div>
          <div>
            <p className="text-sm font-bold text-emerald-700">Logged successfully! ✨</p>
            <p className="text-xs text-emerald-500">Check your dashboard for updated totals</p>
          </div>
        </div>
      )}

      {/* Examples */}
      <button
        onClick={() => setShowExamples(!showExamples)}
        className="w-full flex items-center justify-between px-5 py-3 card text-sm text-gray-500 font-medium"
      >
        <span>💡 See examples of what to say</span>
        {showExamples ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {showExamples && (
        <div className="space-y-2 animate-fade-in">
          {(mode === 'food' ? foodExamples : exerciseExamples).map((ex, i) => (
            <button
              key={i}
              onClick={() => { setText(ex); setShowResults(false); }}
              className="block w-full text-left text-xs text-violet-700 card p-3.5 active:scale-[0.98] transition-transform"
            >
              <span className="text-violet-400 font-bold mr-1">Try:</span> "{ex}"
            </button>
          ))}
        </div>
      )}

      {/* ===== PARSED FOOD RESULTS ===== */}
      {showResults && mode === 'food' && !confirmed && (
        <div className="space-y-3 animate-fade-in">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-sm font-black text-gray-700">
              🔍 Found {parsedFoods.length} item{parsedFoods.length !== 1 ? 's' : ''}
            </h3>
          </div>

          {parsedFoods.length === 0 ? (
            <div className="card p-6 text-center">
              <p className="text-3xl mb-2">🤔</p>
              <p className="text-sm font-semibold text-gray-500">Couldn't match any foods</p>
              <p className="text-xs text-gray-400 mt-1">Try being more specific — like "2 boiled eggs, 1 banana"</p>
            </div>
          ) : (
            <>
              {parsedFoods.map((entry, i) => {
                const confidenceStyle = {
                  high: 'border-emerald-200 bg-gradient-to-r from-emerald-50/80 to-teal-50/80',
                  medium: 'border-amber-200 bg-gradient-to-r from-amber-50/80 to-yellow-50/80',
                  low: 'border-red-200 bg-gradient-to-r from-red-50/80 to-pink-50/80',
                };
                return (
                  <div key={i} className={`card p-4 border ${confidenceStyle[entry.confidence]}`}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-base">{mealIcons[entry.mealType]}</span>
                          <span className="text-sm font-bold text-gray-800">{entry.food.name}</span>
                          {entry.confidence !== 'high' && (
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                              entry.confidence === 'medium' ? 'bg-amber-200 text-amber-800' : 'bg-red-200 text-red-800'
                            }`}>
                              {entry.confidence === 'medium' ? 'likely match' : 'unsure'}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-3 mt-2 text-xs">
                          <span className="font-bold text-gray-700">
                            ×{entry.quantity} <span className="font-normal text-gray-400">{entry.food.servingUnit}</span>
                          </span>
                          <span className="font-bold text-violet-600">{Math.round(entry.food.calories * entry.quantity)} kcal</span>
                          <span className="text-gray-400">P:{(entry.food.protein * entry.quantity).toFixed(1)}g</span>
                          <span className="text-gray-400">F:{(entry.food.fiber * entry.quantity).toFixed(1)}g</span>
                        </div>
                      </div>
                      <div className="flex gap-1 ml-2">
                        <button
                          onClick={() => { setEditingIndex(editingIndex === i ? null : i); setEditQty(String(entry.quantity)); }}
                          className="p-2 rounded-xl bg-white/70 hover:bg-white active:scale-90 transition-all"
                        >
                          <Pencil size={13} className="text-gray-400" />
                        </button>
                        <button
                          onClick={() => removeParsedFood(i)}
                          className="p-2 rounded-xl bg-white/70 hover:bg-white active:scale-90 transition-all"
                        >
                          <Trash2 size={13} className="text-red-300" />
                        </button>
                      </div>
                    </div>
                    {editingIndex === i && (
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200/50">
                        <label className="text-xs text-gray-500 font-medium">Qty:</label>
                        <input
                          type="number"
                          value={editQty}
                          onChange={e => setEditQty(e.target.value)}
                          className="w-16 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-violet-300"
                          step="0.25"
                          autoFocus
                        />
                        <button
                          onClick={() => updateFoodQuantity(i, parseFloat(editQty) || 1)}
                          className="text-xs bg-violet-500 text-white px-3 py-1.5 rounded-lg font-bold active:scale-95 transition-transform"
                        >
                          ✓ Update
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Totals Summary */}
              <div className="card p-5 bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-200">
                <div className="grid grid-cols-4 gap-2 text-center mb-4">
                  <div>
                    <p className="text-xl font-black text-violet-700 stat-number">{Math.round(totalCals)}</p>
                    <p className="text-[9px] text-violet-400 font-bold uppercase tracking-wide">kcal</p>
                  </div>
                  <div>
                    <p className="text-xl font-black text-violet-700 stat-number">{Math.round(totalProtein)}g</p>
                    <p className="text-[9px] text-violet-400 font-bold uppercase tracking-wide">protein</p>
                  </div>
                  <div>
                    <p className="text-xl font-black text-violet-700 stat-number">{Math.round(totalFat)}g</p>
                    <p className="text-[9px] text-violet-400 font-bold uppercase tracking-wide">fat</p>
                  </div>
                  <div>
                    <p className="text-xl font-black text-violet-700 stat-number">{Math.round(totalFiber)}g</p>
                    <p className="text-[9px] text-violet-400 font-bold uppercase tracking-wide">fiber</p>
                  </div>
                </div>
                <button
                  onClick={handleConfirm}
                  className="w-full bg-gradient-to-r from-violet-600 to-purple-600 text-white py-3 rounded-2xl text-sm font-black flex items-center justify-center gap-2 active:scale-[0.97] transition-transform shadow-lg shadow-violet-300"
                >
                  <Check size={18} /> Log All {parsedFoods.length} Items
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ===== PARSED EXERCISE RESULTS ===== */}
      {showResults && mode === 'exercise' && !confirmed && (
        <div className="space-y-3 animate-fade-in">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-sm font-black text-gray-700">
              🏋️ Found {parsedExercises.length} exercise{parsedExercises.length !== 1 ? 's' : ''}
            </h3>
          </div>

          {parsedExercises.length === 0 ? (
            <div className="card p-6 text-center">
              <p className="text-3xl mb-2">🤔</p>
              <p className="text-sm font-semibold text-gray-500">Couldn't match any exercises</p>
              <p className="text-xs text-gray-400 mt-1">Try: "30 min yoga" or "high knees 5 mins and 20 squats"</p>
            </div>
          ) : (
            <>
              {parsedExercises.map((entry, i) => (
                <div key={i} className="card p-4 border border-orange-200 bg-gradient-to-r from-orange-50/80 to-amber-50/80">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-bold text-gray-800">🔥 {entry.exercise.name}</p>
                      <div className="flex gap-3 mt-1.5 text-xs flex-wrap">
                        <span className="font-semibold text-orange-600">⏱ {entry.duration} min</span>
                        {entry.reps && <span className="font-semibold text-orange-600">🔄 {entry.reps} reps</span>}
                        {entry.sets && <span className="font-semibold text-orange-600">📦 {entry.sets} sets</span>}
                        <span className="font-bold text-orange-700">
                          🔥 ~{Math.round(entry.exercise.caloriesPerMinute * entry.duration)} kcal
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1">{entry.exercise.muscleGroups.join(', ')}</p>
                    </div>
                    <button
                      onClick={() => removeParsedExercise(i)}
                      className="p-2 rounded-xl bg-white/70 active:scale-90 transition-all"
                    >
                      <Trash2 size={14} className="text-red-300" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Exercise Totals */}
              <div className="card p-5 bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200">
                <div className="grid grid-cols-2 gap-4 text-center mb-4">
                  <div>
                    <p className="text-2xl font-black text-orange-600 stat-number">{Math.round(totalExCals)}</p>
                    <p className="text-[9px] text-orange-400 font-bold uppercase tracking-wide">kcal burned</p>
                  </div>
                  <div>
                    <p className="text-2xl font-black text-orange-600 stat-number">{totalExMins}</p>
                    <p className="text-[9px] text-orange-400 font-bold uppercase tracking-wide">minutes</p>
                  </div>
                </div>
                <button
                  onClick={handleConfirm}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-2xl text-sm font-black flex items-center justify-center gap-2 active:scale-[0.97] transition-transform shadow-lg shadow-orange-300"
                >
                  <Check size={18} /> Log {parsedExercises.length} Exercises
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
