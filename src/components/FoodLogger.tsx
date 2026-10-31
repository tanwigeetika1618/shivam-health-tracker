import { useState, useMemo } from 'react';
import { Search, Plus, X, ChevronDown, ChevronUp } from 'lucide-react';
import type { FoodItem, LoggedFood, MealType } from '../types';
import { foodDatabase, categoryLabels } from '../data/foods';

interface FoodLoggerProps {
  onAddFood: (food: LoggedFood) => void;
  onAddCustomFood: (food: FoodItem) => void;
  customFoods: FoodItem[];
}

export default function FoodLogger({ onAddFood, onAddCustomFood, customFoods }: FoodLoggerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMeal, setSelectedMeal] = useState<MealType>('breakfast');
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [servings, setServings] = useState('1');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customFood, setCustomFood] = useState({
    name: '', calories: '', protein: '', carbs: '', fat: '', fiber: '',
    servingSize: '', servingUnit: 'g',
  });

  const allFoods = useMemo(() => [...foodDatabase, ...customFoods], [customFoods]);

  const filteredFoods = useMemo(() => {
    if (!searchQuery.trim()) return allFoods;
    const query = searchQuery.toLowerCase();
    return allFoods.filter(f =>
      f.name.toLowerCase().includes(query) ||
      f.category.toLowerCase().includes(query)
    );
  }, [searchQuery, allFoods]);

  const groupedFoods = useMemo(() => {
    const groups: Record<string, FoodItem[]> = {};
    filteredFoods.forEach(food => {
      if (!groups[food.category]) groups[food.category] = [];
      groups[food.category].push(food);
    });
    return groups;
  }, [filteredFoods]);

  const getMealIcon = (meal: MealType) => {
    const icons = { breakfast: '🌅', lunch: '☀️', snack: '🍎', dinner: '🌙' };
    return icons[meal];
  };

  const handleAddFood = () => {
    if (!selectedFood) return;
    const qty = parseFloat(servings) || 1;
    const loggedFood: LoggedFood = {
      id: Date.now().toString(),
      foodId: selectedFood.id,
      name: selectedFood.name,
      quantity: qty,
      servingUnit: selectedFood.servingUnit,
      calories: selectedFood.calories * qty,
      protein: selectedFood.protein * qty,
      carbs: selectedFood.carbs * qty,
      fat: selectedFood.fat * qty,
      fiber: selectedFood.fiber * qty,
      mealType: selectedMeal,
      timestamp: new Date().toISOString(),
    };
    onAddFood(loggedFood);
    setSelectedFood(null);
    setServings('1');
    setSearchQuery('');
  };

  const handleAddCustomFood = () => {
    const newFood: FoodItem = {
      id: `custom-${Date.now()}`,
      name: customFood.name,
      category: 'other',
      servingSize: parseFloat(customFood.servingSize) || 100,
      servingUnit: customFood.servingUnit,
      calories: parseFloat(customFood.calories) || 0,
      protein: parseFloat(customFood.protein) || 0,
      carbs: parseFloat(customFood.carbs) || 0,
      fat: parseFloat(customFood.fat) || 0,
      fiber: parseFloat(customFood.fiber) || 0,
    };
    onAddCustomFood(newFood);
    setShowCustomForm(false);
    setCustomFood({ name: '', calories: '', protein: '', carbs: '', fat: '', fiber: '', servingSize: '', servingUnit: 'g' });
  };

  return (
    <div className="space-y-4 pb-24">
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white">
        <h1 className="text-2xl font-bold">Log Food 🍽️</h1>
        <p className="text-sm opacity-90 mt-1">Search or browse to add what you ate</p>
      </div>

      {/* Meal Type Selector */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {(['breakfast', 'lunch', 'snack', 'dinner'] as MealType[]).map(meal => (
          <button
            key={meal}
            onClick={() => setSelectedMeal(meal)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              selectedMeal === meal
                ? 'bg-violet-600 text-white shadow-md'
                : 'bg-white text-gray-600 shadow-sm'
            }`}
          >
            {getMealIcon(meal)} {meal.charAt(0).toUpperCase() + meal.slice(1)}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search foods... (e.g., oats, egg, dal)"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X size={18} className="text-gray-400" />
          </button>
        )}
      </div>

      {/* Selected Food Detail */}
      {selectedFood && (
        <div className="bg-violet-50 rounded-2xl p-4 border border-violet-200">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-violet-800">{selectedFood.name}</h3>
              <p className="text-xs text-violet-600">
                Per serving ({selectedFood.servingSize}{selectedFood.servingUnit})
              </p>
            </div>
            <button onClick={() => setSelectedFood(null)}>
              <X size={20} className="text-violet-400" />
            </button>
          </div>
          <div className="grid grid-cols-4 gap-2 mt-3 text-center">
            <div className="bg-white rounded-lg p-2">
              <p className="text-xs text-gray-500">Calories</p>
              <p className="font-bold text-sm">{Math.round(selectedFood.calories * (parseFloat(servings) || 1))}</p>
            </div>
            <div className="bg-white rounded-lg p-2">
              <p className="text-xs text-gray-500">Protein</p>
              <p className="font-bold text-sm text-violet-600">{(selectedFood.protein * (parseFloat(servings) || 1)).toFixed(1)}g</p>
            </div>
            <div className="bg-white rounded-lg p-2">
              <p className="text-xs text-gray-500">Carbs</p>
              <p className="font-bold text-sm text-amber-600">{(selectedFood.carbs * (parseFloat(servings) || 1)).toFixed(1)}g</p>
            </div>
            <div className="bg-white rounded-lg p-2">
              <p className="text-xs text-gray-500">Fat</p>
              <p className="font-bold text-sm text-red-500">{(selectedFood.fat * (parseFloat(servings) || 1)).toFixed(1)}g</p>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-3">
            <label className="text-sm font-medium text-gray-600">Servings:</label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setServings(String(Math.max(0.25, (parseFloat(servings) || 1) - 0.25)))}
                className="w-8 h-8 rounded-full bg-white border flex items-center justify-center"
              >-</button>
              <input
                type="number"
                value={servings}
                onChange={e => setServings(e.target.value)}
                className="w-16 text-center border rounded-lg py-1 text-sm"
                step="0.25"
                min="0.25"
              />
              <button
                onClick={() => setServings(String((parseFloat(servings) || 1) + 0.25))}
                className="w-8 h-8 rounded-full bg-white border flex items-center justify-center"
              >+</button>
            </div>
            <button
              onClick={handleAddFood}
              className="ml-auto bg-violet-600 text-white px-5 py-2 rounded-xl text-sm font-medium active:bg-violet-700"
            >
              Add ✓
            </button>
          </div>
        </div>
      )}

      {/* Food List by Category */}
      <div className="space-y-2">
        {Object.entries(groupedFoods).map(([category, foods]) => (
          <div key={category} className="bg-white rounded-xl shadow-sm overflow-hidden">
            <button
              onClick={() => setExpandedCategory(expandedCategory === category ? null : category)}
              className="w-full px-4 py-3 flex justify-between items-center"
            >
              <span className="font-medium text-sm">
                {categoryLabels[category] || category} ({foods.length})
              </span>
              {expandedCategory === category ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            {expandedCategory === category && (
              <div className="border-t">
                {foods.map(food => (
                  <button
                    key={food.id}
                    onClick={() => { setSelectedFood(food); setServings('1'); }}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 active:bg-gray-100 border-b last:border-0 flex justify-between items-center"
                  >
                    <div>
                      <p className="text-sm font-medium">{food.name}</p>
                      <p className="text-xs text-gray-500">
                        {food.servingSize}{food.servingUnit} · P:{food.protein}g · F:{food.fiber}g
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-violet-600">{food.calories}</p>
                      <p className="text-xs text-gray-400">kcal</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Custom Food */}
      <button
        onClick={() => setShowCustomForm(!showCustomForm)}
        className="w-full bg-white rounded-xl shadow-sm p-4 flex items-center gap-3 active:bg-gray-50"
      >
        <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center">
          <Plus size={20} className="text-violet-600" />
        </div>
        <div className="text-left">
          <p className="text-sm font-medium">Add Custom Food</p>
          <p className="text-xs text-gray-500">Can't find it? Enter nutrition manually</p>
        </div>
      </button>

      {showCustomForm && (
        <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
          <input
            placeholder="Food name"
            value={customFood.name}
            onChange={e => setCustomFood({ ...customFood, name: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              placeholder="Serving size"
              type="number"
              value={customFood.servingSize}
              onChange={e => setCustomFood({ ...customFood, servingSize: e.target.value })}
              className="border rounded-lg px-3 py-2 text-sm"
            />
            <select
              value={customFood.servingUnit}
              onChange={e => setCustomFood({ ...customFood, servingUnit: e.target.value })}
              className="border rounded-lg px-3 py-2 text-sm"
            >
              <option value="g">grams (g)</option>
              <option value="ml">ml</option>
              <option value="piece">piece</option>
              <option value="cup">cup</option>
              <option value="tbsp">tbsp</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              placeholder="Calories (kcal)"
              type="number"
              value={customFood.calories}
              onChange={e => setCustomFood({ ...customFood, calories: e.target.value })}
              className="border rounded-lg px-3 py-2 text-sm"
            />
            <input
              placeholder="Protein (g)"
              type="number"
              value={customFood.protein}
              onChange={e => setCustomFood({ ...customFood, protein: e.target.value })}
              className="border rounded-lg px-3 py-2 text-sm"
            />
            <input
              placeholder="Carbs (g)"
              type="number"
              value={customFood.carbs}
              onChange={e => setCustomFood({ ...customFood, carbs: e.target.value })}
              className="border rounded-lg px-3 py-2 text-sm"
            />
            <input
              placeholder="Fat (g)"
              type="number"
              value={customFood.fat}
              onChange={e => setCustomFood({ ...customFood, fat: e.target.value })}
              className="border rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <input
            placeholder="Fiber (g)"
            type="number"
            value={customFood.fiber}
            onChange={e => setCustomFood({ ...customFood, fiber: e.target.value })}
            className="border rounded-lg px-3 py-2 text-sm"
          />
          <button
            onClick={handleAddCustomFood}
            disabled={!customFood.name || !customFood.calories}
            className="w-full bg-violet-600 text-white py-2 rounded-xl text-sm font-medium disabled:opacity-50"
          >
            Save Custom Food
          </button>
        </div>
      )}
    </div>
  );
}
