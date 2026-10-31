import { foodDatabase } from '../data/foods';
import { exerciseDatabase } from '../data/exercises';
import type { FoodItem, LoggedFood, MealType, LoggedExercise } from '../types';

interface ParsedFoodEntry {
  food: FoodItem;
  quantity: number;
  mealType: MealType;
  matchedText: string;
  confidence: 'high' | 'medium' | 'low';
}

interface ParsedExerciseEntry {
  exercise: typeof exerciseDatabase[0];
  duration: number;
  matchedText: string;
  reps?: number;
  sets?: number;
}

const MEAL_KEYWORDS: Record<MealType, string[]> = {
  breakfast: ['breakfast', 'morning', 'subah', 'nashta', 'brekkie'],
  lunch: ['lunch', 'dopahar', 'afternoon'],
  snack: ['snack', 'evening snack', 'shaam', 'mid-morning', 'mid morning', 'tea time', 'chai time'],
  dinner: ['dinner', 'raat', 'night', 'khaana'],
};

const QUANTITY_PATTERNS = [
  /(\d+(?:\.\d+)?)\s*(?:cup|cups)/i,
  /(\d+(?:\.\d+)?)\s*(?:glass|glasses)/i,
  /(\d+(?:\.\d+)?)\s*(?:bowl|bowls)/i,
  /(\d+(?:\.\d+)?)\s*(?:tbsp|tablespoon|tablespoons)/i,
  /(\d+(?:\.\d+)?)\s*(?:tsp|teaspoon|teaspoons)/i,
  /(\d+(?:\.\d+)?)\s*(?:scoop|scoops)/i,
  /(\d+(?:\.\d+)?)\s*(?:piece|pieces|pcs)/i,
  /(\d+(?:\.\d+)?)\s*(?:slice|slices)/i,
  /(\d+(?:\.\d+)?)\s*(?:plate|plates)/i,
  /(\d+(?:\.\d+)?)\s*(?:serving|servings)/i,
  /(\d+(?:\.\d+)?)\s*(?:roti|rotis|chapati|chapatis)/i,
  /(\d+(?:\.\d+)?)\s*(?:paratha|parathas)/i,
  /(\d+(?:\.\d+)?)\s*(?:egg|eggs)/i,
  /(\d+(?:\.\d+)?)\s*g(?:ram|rams)?(?:\s|$|,)/i,
  /(\d+(?:\.\d+)?)\s*ml/i,
  /half\s+(?:a\s+)?/i,
  /(\d+(?:\.\d+)?)/,
];

const FOOD_ALIASES: Record<string, string[]> = {
  'peanut-butter': ['peanut butter', 'pb'],
  'almonds': ['almonds', 'almond', 'badam'],
  'walnuts': ['walnuts', 'walnut', 'akhrot'],
  'cashews': ['cashews', 'cashew', 'kaju'],
  'pumpkin-seeds': ['pumpkin seeds', 'pumpkin'],
  'sunflower-seeds': ['sunflower seeds', 'sunflower'],
  'mixed-nuts': ['mixed nuts', 'nuts', 'dry fruits'],
  'makhana': ['makhana', 'fox nuts', 'foxnuts', 'lotus seeds'],
  'banana': ['banana', 'kela'],
  'apple': ['apple', 'seb'],
  'papaya': ['papaya', 'papita'],
  'pomegranate': ['pomegranate', 'anar'],
  'mango': ['mango', 'aam'],
  'milk-full': ['milk', 'full cream milk', 'whole milk', 'doodh'],
  'curd-dahi': ['curd', 'dahi', 'yogurt', 'raita'],
  'paneer-full': ['paneer', 'cottage cheese'],
  'buttermilk': ['buttermilk', 'chaas', 'chaach'],
  'lassi-sweet': ['lassi', 'sweet lassi'],
  'cheese-slice': ['cheese', 'cheese slice'],
  'ghee': ['ghee', 'desi ghee', 'clarified butter'],
  'oats': ['oats', 'oatmeal', 'porridge'],
  'roti-wheat': ['roti', 'chapati', 'rotis', 'chapatti', 'phulka'],
  'white-rice': ['rice', 'chawal', 'white rice'],
  'brown-rice': ['brown rice'],
  'bread-wheat': ['bread', 'toast', 'wheat bread'],
  'poha': ['poha', 'flattened rice'],
  'paratha': ['paratha', 'aloo paratha', 'parathas'],
  'egg-boiled': ['boiled egg', 'boiled eggs', 'anda'],
  'egg-scrambled-butter': ['scrambled eggs', 'scrambled egg', 'egg scramble'],
  'egg-omelette': ['omelette', 'omelet'],
  'egg-bhurji': ['bhurji', 'egg bhurji', 'anda bhurji'],
  'chickpeas-cooked': ['chickpea', 'chickpeas', 'chole', 'chana', 'chhole'],
  'moong-dal': ['moong dal', 'moong', 'green gram'],
  'toor-dal': ['toor dal', 'arhar dal', 'yellow dal', 'dal'],
  'rajma': ['rajma', 'kidney beans'],
  'soybean-chunks': ['soya chunks', 'soya', 'soy chunks', 'meal maker', 'nutrela'],
  'sprouts-moong': ['sprouts', 'moong sprouts'],
  'spinach': ['spinach', 'palak'],
  'broccoli': ['broccoli'],
  'sweet-potato': ['sweet potato', 'shakarkandi'],
  'potato': ['potato', 'aloo'],
  'mixed-veggies': ['mixed veggies', 'vegetables', 'sabzi', 'veggies'],
  'chicken-breast': ['chicken breast', 'grilled chicken'],
  'chicken-thigh': ['chicken thigh'],
  'chicken-curry': ['chicken curry', 'chicken', 'murgh'],
  'black-coffee-ghee': ['bullet coffee', 'coffee ghee', 'black coffee ghee'],
  'chai': ['chai', 'tea', 'milk tea'],
  'green-tea': ['green tea'],
  'coconut-water': ['coconut water', 'nariyal pani'],
  'whey-protein': ['protein shake', 'whey', 'protein powder', 'protein scoop'],
  'peanut-butter-shake': ['pb shake', 'peanut butter shake', 'calorie shake', 'mass gainer shake'],
  'dal-rice-ghee': ['dal rice', 'dal chawal', 'dal rice ghee'],
  'paneer-roti': ['paneer roti', 'paneer bhurji roti'],
  'egg-toast-butter': ['egg toast', 'eggs toast'],
  'chole-rice': ['chole rice', 'chole chawal'],
  'khichdi-ghee': ['khichdi', 'khichri'],
  'roti-jaggery-ghee': ['roti jaggery', 'jaggery roti', 'gur roti'],
  'overnight-oats-bulk': ['overnight oats'],
  'jaggery': ['jaggery', 'gur', 'gud'],
  'honey': ['honey', 'shahad'],
  'butter': ['butter', 'makhan'],
};

function normalizeText(text: string): string {
  return text.toLowerCase()
    .replace(/['']/g, "'")
    .replace(/[""]/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function detectMealType(text: string): MealType {
  const lower = text.toLowerCase();
  for (const [meal, keywords] of Object.entries(MEAL_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) {
      return meal as MealType;
    }
  }
  const hour = new Date().getHours();
  if (hour < 12) return 'breakfast';
  if (hour < 16) return 'lunch';
  if (hour < 19) return 'snack';
  return 'dinner';
}

function extractQuantity(text: string, _foodName: string): number {
  const nearbyText = text.toLowerCase();
  if (/\bhalf\b/i.test(nearbyText)) return 0.5;
  if (/\bquarter\b/i.test(nearbyText)) return 0.25;
  if (/\bdouble\b|two\b|2\b/i.test(nearbyText)) return 2;
  if (/\btriple\b|three\b|3\b/i.test(nearbyText)) return 3;
  if (/\bfour\b|4\b/i.test(nearbyText)) return 4;

  for (const pattern of QUANTITY_PATTERNS) {
    const match = nearbyText.match(pattern);
    if (match && match[1]) {
      return parseFloat(match[1]);
    }
  }
  return 1;
}

function findFoodMatch(segment: string, allFoods: FoodItem[]): { food: FoodItem; confidence: 'high' | 'medium' | 'low' } | null {
  const normalized = normalizeText(segment);

  for (const [foodId, aliases] of Object.entries(FOOD_ALIASES)) {
    for (const alias of aliases) {
      if (normalized.includes(alias)) {
        const food = allFoods.find(f => f.id === foodId);
        if (food) {
          const exactMatch = aliases.some(a => normalized.includes(a) && a.length > 3);
          return { food, confidence: exactMatch ? 'high' : 'medium' };
        }
      }
    }
  }

  for (const food of allFoods) {
    const foodNameLower = food.name.toLowerCase();
    const foodWords = foodNameLower.split(/[\s/()]+/).filter(w => w.length > 2);
    const matchedWords = foodWords.filter(w => normalized.includes(w));
    if (matchedWords.length >= 2 || (matchedWords.length === 1 && matchedWords[0].length > 4)) {
      return { food, confidence: matchedWords.length >= 2 ? 'medium' : 'low' };
    }
  }

  return null;
}

export function parseFoodInput(text: string, customFoods: FoodItem[] = []): ParsedFoodEntry[] {
  const allFoods = [...foodDatabase, ...customFoods];
  const results: ParsedFoodEntry[] = [];
  const usedFoodIds = new Set<string>();

  const sections = text.split(/(?:breakfast|lunch|snack|dinner|morning|afternoon|evening|night)[:\s-]*/i);
  const mealMarkers = text.match(/(?:breakfast|lunch|snack|dinner|morning|afternoon|evening|night)/gi) || [];

  if (sections.length <= 1) {
    const mealType = detectMealType(text);
    const segments = text.split(/[,;\n]+|(?:\band\b)|(?:\bwith\b)|(?:\bplus\b)|(?:\balso\b)/i);

    for (const segment of segments) {
      const trimmed = segment.trim();
      if (!trimmed || trimmed.length < 2) continue;

      const match = findFoodMatch(trimmed, allFoods);
      if (match && !usedFoodIds.has(match.food.id)) {
        const quantity = extractQuantity(trimmed, match.food.name);
        usedFoodIds.add(match.food.id);
        results.push({
          food: match.food,
          quantity,
          mealType,
          matchedText: trimmed,
          confidence: match.confidence,
        });
      }
    }
  } else {
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      if (!section.trim()) continue;

      let mealType: MealType;
      if (i > 0 && mealMarkers[i - 1]) {
        mealType = detectMealType(mealMarkers[i - 1]);
      } else {
        mealType = detectMealType(section);
      }

      const segments = section.split(/[,;\n]+|(?:\band\b)|(?:\bwith\b)|(?:\bplus\b)|(?:\balso\b)/i);

      for (const segment of segments) {
        const trimmed = segment.trim();
        if (!trimmed || trimmed.length < 2) continue;

        const match = findFoodMatch(trimmed, allFoods);
        if (match && !usedFoodIds.has(match.food.id)) {
          const quantity = extractQuantity(trimmed, match.food.name);
          usedFoodIds.add(match.food.id);
          results.push({
            food: match.food,
            quantity,
            mealType,
            matchedText: trimmed,
            confidence: match.confidence,
          });
        }
      }
    }
  }

  return results;
}

export function parsedToLoggedFoods(parsed: ParsedFoodEntry[]): LoggedFood[] {
  return parsed.map(entry => ({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    foodId: entry.food.id,
    name: entry.food.name,
    quantity: entry.quantity,
    servingUnit: entry.food.servingUnit,
    calories: entry.food.calories * entry.quantity,
    protein: entry.food.protein * entry.quantity,
    carbs: entry.food.carbs * entry.quantity,
    fat: entry.food.fat * entry.quantity,
    fiber: entry.food.fiber * entry.quantity,
    mealType: entry.mealType,
    timestamp: new Date().toISOString(),
  }));
}

export function parseExerciseInput(text: string): ParsedExerciseEntry[] {
  const results: ParsedExerciseEntry[] = [];
  const usedIds = new Set<string>();
  const normalized = normalizeText(text);

  const EXERCISE_ALIASES: Record<string, string[]> = {
    'walking-brisk': ['walk', 'walked', 'walking', 'brisk walk'],
    'yoga-flow': ['yoga', 'yoga session'],
    'surya-namaskar': ['surya namaskar', 'sun salutation'],
    'stretching': ['stretch', 'stretching', 'stretched'],
    'pushup': ['pushup', 'push up', 'push-up', 'pushups', 'push ups'],
    'plank': ['plank', 'planks', 'plank hold'],
    'lunges': ['lunge', 'lunges'],
    'squats-bodyweight': ['squat', 'squats', 'bodyweight squat'],
    'crunches': ['crunch', 'crunches', 'abs'],
    'leg-raises': ['leg raise', 'leg raises'],
    'jumping-jacks': ['jumping jack', 'jumping jacks', 'star jumps'],
    'high-knees': ['high knees', 'high knee'],
    'mountain-climbers': ['mountain climber', 'mountain climbers'],
    'burpees': ['burpee', 'burpees'],
    'skipping': ['skipping', 'jump rope', 'jumping rope'],
    'dancing': ['dance', 'danced', 'dancing', 'zumba'],
    'swimming': ['swim', 'swimming', 'swam', 'pool'],
    'cycling': ['cycling', 'cycle', 'bike'],
    'dips': ['dips', 'tricep dips', 'chair dips'],
    'pull-ups': ['pull up', 'pull ups', 'pullup', 'pullups', 'chin up', 'chin ups'],
    'pike-pushup': ['pike push up', 'pike pushup', 'shoulder press'],
    'superman': ['superman', 'back extension'],
    'wall-sit': ['wall sit'],
    'rb-squat': ['banded squat', 'band squat', 'resistance band squat'],
    'rb-row': ['row', 'rowing', 'seated row'],
    'rb-chest-press': ['chest press'],
    'rb-bicep-curl': ['bicep curl', 'bicep curls', 'arm curl'],
    'rb-overhead-press': ['overhead press'],
    'rb-deadlift': ['deadlift', 'dead lift'],
    'hip-flexor-stretch': ['hip flexor', 'hip stretch'],
    'neck-shoulder-stretch': ['neck stretch', 'shoulder stretch'],
  };

  const segments = normalized.split(/[,;\n]+|(?:\band\b)|(?:\bthen\b)|(?:\bplus\b)|(?:\balso\b)|(?:\bdid\b)|(?:\bi did\b)/i);

  for (const segment of segments) {
    const trimmed = segment.trim();
    if (!trimmed || trimmed.length < 2) continue;

    for (const [exId, aliases] of Object.entries(EXERCISE_ALIASES)) {
      if (usedIds.has(exId)) continue;
      const matched = aliases.some(a => trimmed.includes(a));
      if (matched) {
        const exercise = exerciseDatabase.find(e => e.id === exId);
        if (exercise) {
          const durMatch = trimmed.match(/(\d+)\s*(?:min|mins|minutes|minute)/i);
          const repsMatchBefore = trimmed.match(/(\d+)\s+(?:reps?\s+)?(?:of\s+)?/i);
          const repsMatchAfter = trimmed.match(/(?:for\s+)?(\d+)\s*(?:reps?|times|repetitions)/i);
          const secMatch = trimmed.match(/(\d+)\s*(?:sec|secs|seconds|second)/i);

          let duration: number;
          let reps: number | undefined;
          let sets: number | undefined;

          if (durMatch) {
            duration = parseInt(durMatch[1]);
          } else if (secMatch) {
            duration = Math.ceil(parseInt(secMatch[1]) / 60);
          } else if (repsMatchAfter) {
            reps = parseInt(repsMatchAfter[1]);
            duration = Math.max(2, Math.ceil(reps / 10));
          } else if (repsMatchBefore && !trimmed.match(/(\d+)\s*(?:min|sec|hour)/i)) {
            const num = parseInt(repsMatchBefore[1]);
            if (num <= 200) {
              reps = num;
              duration = Math.max(2, Math.ceil(reps / 10));
            } else {
              duration = 15;
            }
          } else {
            duration = 10;
          }

          const setsMatch = trimmed.match(/(\d+)\s*(?:set|sets)/i);
          if (setsMatch) {
            sets = parseInt(setsMatch[1]);
            if (!durMatch && reps) {
              duration = Math.max(2, Math.ceil((reps * sets) / 8));
            }
          }

          usedIds.add(exId);
          results.push({ exercise, duration, matchedText: trimmed, reps, sets });
        }
      }
    }
  }

  return results;
}

export function parsedToLoggedExercises(parsed: ParsedExerciseEntry[]): LoggedExercise[] {
  return parsed.map(entry => ({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    exerciseId: entry.exercise.id,
    name: entry.exercise.name,
    duration: entry.duration,
    caloriesBurned: Math.round(entry.exercise.caloriesPerMinute * entry.duration),
    sets: entry.sets,
    reps: entry.reps,
    timestamp: new Date().toISOString(),
  }));
}
