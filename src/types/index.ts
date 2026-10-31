export interface FoodItem {
  id: string;
  name: string;
  category: FoodCategory;
  servingSize: number;
  servingUnit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  iron?: number;
  vitaminD?: number;
  vitaminB12?: number;
  calcium?: number;
}

export type FoodCategory =
  | 'seeds_nuts'
  | 'fruits'
  | 'dairy'
  | 'grains'
  | 'protein_foods'
  | 'vegetables'
  | 'legumes'
  | 'beverages'
  | 'supplements'
  | 'prepared'
  | 'meat'
  | 'other';

export interface LoggedFood {
  id: string;
  foodId: string;
  name: string;
  quantity: number;
  servingUnit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  mealType: MealType;
  timestamp: string;
}

export type MealType = 'breakfast' | 'lunch' | 'snack' | 'dinner';

export interface Exercise {
  id: string;
  name: string;
  category: ExerciseCategory;
  caloriesPerMinute: number;
  muscleGroups: string[];
  equipment?: string;
  youtubeSearch?: string;
}

export type ExerciseCategory =
  | 'resistance_band'
  | 'bodyweight'
  | 'weight_training'
  | 'cardio'
  | 'yoga'
  | 'stretching'
  | 'swimming'
  | 'walking';

export interface LoggedExercise {
  id: string;
  exerciseId: string;
  name: string;
  duration: number;
  caloriesBurned: number;
  sets?: number;
  reps?: number;
  timestamp: string;
}

export interface DailyLog {
  date: string;
  foods: LoggedFood[];
  exercises: LoggedExercise[];
  water: number;
  weight?: number;
  bodyFat?: number;
  muscleMass?: number;
  notes?: string;
}

export interface UserProfile {
  name: string;
  age: number;
  gender: 'female' | 'male';
  heightCm: number;
  currentWeightKg: number;
  targetWeightKg: number;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active';
  targetCalories: number;
  targetProtein: number;
  targetFiber: number;
  targetFat: number;
  targetCarbs: number;
  targetWater: number;
  targetMonths: number;
}

export interface WeeklySchedule {
  [day: string]: DaySchedule;
}

export interface DaySchedule {
  dayType: 'wfh' | 'office' | 'weekend';
  blocks: ScheduleBlock[];
}

export interface ScheduleBlock {
  time: string;
  activity: string;
  category: 'work' | 'exercise' | 'meal' | 'study' | 'leisure' | 'sleep' | 'personal';
  notes?: string;
}

export interface WeightEntry {
  date: string;
  weight: number;
  bodyFat?: number;
  muscleMass?: number;
  bodyWater?: number;
}
