import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  Activity,
  Apple,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Calculator,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Dumbbell,
  Flame,
  Heart,
  LogIn,
  LogOut,
  MessageSquare,
  Moon,
  Phone,
  Plus,
  Salad,
  Scale,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  TrendingUp,
  User,
  Utensils,
  X,
  Zap,
} from "lucide-react";

/* ============================================================
   LIFT — Lifestyle Intervention and Fitness Taskforce
   Navy & white refined clinical aesthetic
   ============================================================ */

const NAVY = "#0A1F44";
const NAVY_DEEP = "#061528";       // darker for headlines, more depth
const NAVY_SOFT = "#3D5A8A";       // mid-navy for secondary text/UI
const CREAM = "#FAF1E4";           // warmer apricot cream
const ACCENT = "#FF6B5B";          // coral — energy, progress, key moments
const ACCENT_SOFT = "#FFE8E5";     // tinted coral for subtle backgrounds

/* ============================================================
   Supabase backend (real cross-device accounts + storage)
   ============================================================ */

const SUPABASE_URL = "https://lrprwiodhhldzqlulpsq.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxycHJ3aW9kaGhsZHpxbHVscHNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MTU4MzksImV4cCI6MjA5NDA5MTgzOX0.dgwwiX7TNlcESU-8OrnEW_qXE22XJBmfA3eZMQ9b5yY";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Load the signed-in user's data row (returns the stored JSON blob or null)
async function loadUserData(email) {
  if (!email) return null;
  try {
    const { data, error } = await supabase
      .from("user_data")
      .select("data")
      .eq("email", email)
      .maybeSingle();
    if (error) return null;
    return data?.data ?? null;
  } catch {
    return null;
  }
}

// Save (upsert) the signed-in user's data row
async function saveUserData(email, data) {
  if (!email) return;
  try {
    await supabase
      .from("user_data")
      .upsert({ email, data, updated_at: new Date().toISOString() }, { onConflict: "email" });
  } catch {}
}

/* ---------- Date / migration helpers ---------- */

function todayString() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function lastNDays(n) {
  const out = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    out.push(`${y}-${m}-${day}`);
  }
  return out;
}

function formatShortDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// Backfill old saved data so it works with the new shape.
function migrateUserData(d) {
  if (!d) return d;
  const today = todayString();
  return {
    ...d,
    meals: Array.isArray(d.meals)
      ? d.meals.map((m) => (m.date ? m : { ...m, date: today, timestamp: m.timestamp ?? Date.now() }))
      : [],
    weights: Array.isArray(d.weights) ? d.weights : [],
    sleepEntries: Array.isArray(d.sleepEntries) ? d.sleepEntries : [],
  };
}

/* ---------- Data ---------- */

const ACTIVITY_LEVELS = [
  { id: "sedentary", label: "Sedentary", desc: "Little or no exercise", mult: 1.2 },
  { id: "light", label: "Lightly active", desc: "1–3 days / week", mult: 1.375 },
  { id: "moderate", label: "Moderately active", desc: "3–5 days / week", mult: 1.55 },
  { id: "very", label: "Very active", desc: "6–7 days / week", mult: 1.725 },
  { id: "extra", label: "Extra active", desc: "Hard daily training or physical job", mult: 1.9 },
];

const GOALS = [
  { id: "lose", label: "Lose weight", adj: -500, desc: "Gradual fat loss" },
  { id: "maintain", label: "Maintain", adj: 0, desc: "Hold current weight" },
  { id: "muscle", label: "Gain muscle", adj: 300, desc: "Lean bulk" },
  { id: "health", label: "Improve health", adj: 0, desc: "General wellness" },
];

const DIET_PREFS = [
  "No restrictions",
  "Vegetarian",
  "Vegan",
  "Pescatarian",
  "Mediterranean",
  "Lower-carb",
  "Gluten-free",
  "Dairy-free",
  "Halal",
  "Kosher",
];

const EXPERIENCE = [
  { id: "new", label: "New to exercise" },
  { id: "some", label: "Some experience" },
  { id: "regular", label: "Regular exerciser" },
  { id: "advanced", label: "Advanced / athletic" },
];

const CONDITIONS = [
  "Type 1 Diabetes", "Type 2 Diabetes", "Pre-diabetes",
  "Hypertension", "High cholesterol", "Cardiovascular disease",
  "Post-stroke", "Dysphagia (swallow precautions)",
  "Hypothyroid", "PCOS", "IBS", "GERD", "Sleep apnea",
  "Osteoarthritis", "Pregnant or lactating",
];

const MEDICATIONS = [
  "Metformin", "Insulin", "GLP-1 (Ozempic / Wegovy / Mounjaro)",
  "Statin", "ACE inhibitor / ARB", "Beta-blocker", "Diuretic",
  "Levothyroxine", "SSRI / SNRI", "Birth control", "HRT",
  "Anticoagulant", "Other prescription", "Supplements only", "None",
];

const ALLERGENS = [
  "Peanuts", "Tree nuts", "Shellfish", "Fish",
  "Eggs", "Dairy", "Soy", "Wheat / gluten", "Sesame", "None",
];

const PERSONALITIES = [
  { id: "ext-comp", label: "Extroverted · Competitive", desc: "Group classes, races, leaderboards" },
  { id: "ext-soc", label: "Extroverted · Social", desc: "Run clubs, walking buddies, partner workouts" },
  { id: "ambi", label: "Ambivert · Routine-loving", desc: "Same time, same circuit, mostly solo" },
  { id: "intro-ref", label: "Introverted · Reflective", desc: "Solo home workouts, audiobooks, walks" },
  { id: "intro-pat", label: "Introverted · Patient", desc: "Slow build, low intensity, low pressure" },
];

const VOICES = [
  { id: "warm", label: "Warm coach", desc: "Encouraging, gentle" },
  { id: "drill", label: "Drill sergeant", desc: "Push me, no excuses" },
  { id: "clinician", label: "Clinician", desc: "Precise, evidence-led" },
  { id: "friend", label: "Friend", desc: "Casual, jokes ok" },
];

const MEAL_PLANS = [
  {
    id: "balanced",
    name: "The Balanced Plan",
    blurb: "Even macros, broad variety, easy weeknight cooking.",
    tags: ["Beginner-friendly", "Flexible"],
    sample: [
      { meal: "Breakfast", food: "Greek yogurt, berries, oats, walnuts", kcal: 420 },
      { meal: "Lunch", food: "Grilled chicken bowl with quinoa, roasted veg, tahini", kcal: 580 },
      { meal: "Snack", food: "Apple with almond butter", kcal: 220 },
      { meal: "Dinner", food: "Salmon, sweet potato, sautéed greens", kcal: 620 },
    ],
  },
  {
    id: "protein",
    name: "High-Protein Build",
    blurb: "Designed around muscle gain. Anchored in 30–40g protein per meal.",
    tags: ["Muscle gain", "Strength"],
    sample: [
      { meal: "Breakfast", food: "Egg-white scramble, turkey, whole-grain toast", kcal: 480 },
      { meal: "Lunch", food: "Lean steak, jasmine rice, broccoli", kcal: 680 },
      { meal: "Snack", food: "Protein shake + banana", kcal: 290 },
      { meal: "Dinner", food: "Chicken breast, roasted potatoes, asparagus", kcal: 650 },
    ],
  },
  {
    id: "med",
    name: "Mediterranean",
    blurb: "Olive oil, fish, legumes, whole grains. Heart-forward.",
    tags: ["Heart-healthy", "Anti-inflammatory"],
    sample: [
      { meal: "Breakfast", food: "Whole-grain toast, avocado, poached egg, tomato", kcal: 410 },
      { meal: "Lunch", food: "Lentil salad with feta, cucumber, olive oil, lemon", kcal: 540 },
      { meal: "Snack", food: "Hummus with carrots and pita", kcal: 230 },
      { meal: "Dinner", food: "Baked white fish, farro, charred peppers", kcal: 600 },
    ],
  },
  {
    id: "plant",
    name: "Plant-Forward",
    blurb: "Vegetarian-leaning, fiber-rich, dense in plants.",
    tags: ["Vegetarian", "Fiber-rich"],
    sample: [
      { meal: "Breakfast", food: "Tofu scramble, sourdough, sautéed mushrooms", kcal: 430 },
      { meal: "Lunch", food: "Chickpea grain bowl with kale and miso dressing", kcal: 560 },
      { meal: "Snack", food: "Edamame and a pear", kcal: 240 },
      { meal: "Dinner", food: "Lentil curry, brown rice, cucumber raita", kcal: 610 },
    ],
  },
  {
    id: "lowcarb",
    name: "Lower-Carb",
    blurb: "Reduced refined carbs, emphasis on protein and non-starchy veg.",
    tags: ["Weight management"],
    sample: [
      { meal: "Breakfast", food: "Veggie omelet with feta and avocado", kcal: 420 },
      { meal: "Lunch", food: "Grilled chicken Caesar (no croutons)", kcal: 510 },
      { meal: "Snack", food: "Cottage cheese with berries", kcal: 190 },
      { meal: "Dinner", food: "Steak, cauliflower mash, green beans", kcal: 590 },
    ],
  },
];

/* ---------- Food database (compact, common items) ---------- */
// Calories per single common serving as listed in the label.
const FOOD_DB = [
  // --- Fruits ---
  { name: "Apple, medium", kcal: 95, label: "1 apple" },
  { name: "Banana, medium", kcal: 105, label: "1 banana" },
  { name: "Orange, medium", kcal: 62, label: "1 orange" },
  { name: "Strawberries", kcal: 50, label: "1 cup" },
  { name: "Blueberries", kcal: 85, label: "1 cup" },
  { name: "Raspberries", kcal: 65, label: "1 cup" },
  { name: "Blackberries", kcal: 62, label: "1 cup" },
  { name: "Grapes", kcal: 100, label: "1 cup" },
  { name: "Watermelon", kcal: 46, label: "1 cup cubed" },
  { name: "Cantaloupe", kcal: 54, label: "1 cup cubed" },
  { name: "Pineapple", kcal: 82, label: "1 cup chunks" },
  { name: "Mango", kcal: 100, label: "1 cup sliced" },
  { name: "Peach, medium", kcal: 60, label: "1 peach" },
  { name: "Pear, medium", kcal: 100, label: "1 pear" },
  { name: "Plum", kcal: 30, label: "1 plum" },
  { name: "Kiwi", kcal: 42, label: "1 fruit" },
  { name: "Cherries", kcal: 87, label: "1 cup" },
  { name: "Pomegranate seeds", kcal: 145, label: "1 cup" },
  { name: "Avocado", kcal: 240, label: "1 whole" },
  { name: "Grapefruit, half", kcal: 52, label: "1/2 fruit" },
  { name: "Lemon", kcal: 17, label: "1 fruit" },
  { name: "Lime", kcal: 20, label: "1 fruit" },
  { name: "Dried apricots", kcal: 80, label: "1 oz" },
  { name: "Raisins", kcal: 130, label: "1/4 cup" },
  { name: "Dates, medjool", kcal: 67, label: "1 date" },

  // --- Vegetables ---
  { name: "Broccoli, steamed", kcal: 55, label: "1 cup" },
  { name: "Cauliflower, raw", kcal: 27, label: "1 cup" },
  { name: "Cauliflower rice", kcal: 25, label: "1 cup" },
  { name: "Spinach, raw", kcal: 7, label: "1 cup" },
  { name: "Spinach, cooked", kcal: 41, label: "1 cup" },
  { name: "Kale, raw", kcal: 33, label: "1 cup" },
  { name: "Mixed salad greens", kcal: 10, label: "1 cup" },
  { name: "Romaine lettuce", kcal: 8, label: "1 cup" },
  { name: "Arugula", kcal: 5, label: "1 cup" },
  { name: "Cabbage, raw", kcal: 22, label: "1 cup" },
  { name: "Brussels sprouts, roasted", kcal: 56, label: "1 cup" },
  { name: "Asparagus, cooked", kcal: 27, label: "1 cup" },
  { name: "Green beans, cooked", kcal: 44, label: "1 cup" },
  { name: "Bell pepper", kcal: 30, label: "1 medium" },
  { name: "Carrots, raw", kcal: 50, label: "1 cup" },
  { name: "Cucumber", kcal: 16, label: "1 cup" },
  { name: "Tomato", kcal: 22, label: "1 medium" },
  { name: "Cherry tomatoes", kcal: 27, label: "1 cup" },
  { name: "Onion", kcal: 45, label: "1 medium" },
  { name: "Garlic", kcal: 5, label: "1 clove" },
  { name: "Mushrooms", kcal: 21, label: "1 cup" },
  { name: "Zucchini", kcal: 33, label: "1 cup sliced" },
  { name: "Eggplant, roasted", kcal: 35, label: "1 cup" },
  { name: "Corn, sweet", kcal: 130, label: "1 cup" },
  { name: "Peas, green", kcal: 117, label: "1 cup" },
  { name: "Beets, cooked", kcal: 75, label: "1 cup" },
  { name: "Squash, butternut", kcal: 82, label: "1 cup" },
  { name: "Pumpkin puree", kcal: 50, label: "1/2 cup" },
  { name: "Sauerkraut", kcal: 27, label: "1 cup" },
  { name: "Kimchi", kcal: 23, label: "1 cup" },
  { name: "Pickles", kcal: 17, label: "1 spear" },
  { name: "Olives, kalamata", kcal: 35, label: "5 olives" },

  // --- Eggs & dairy ---
  { name: "Eggs, scrambled", kcal: 180, label: "2 large" },
  { name: "Egg whites", kcal: 50, label: "3 whites" },
  { name: "Hard-boiled egg", kcal: 78, label: "1 egg" },
  { name: "Egg, fried", kcal: 90, label: "1 egg" },
  { name: "Oatmeal, cooked", kcal: 150, label: "1 cup" },
  { name: "Greek yogurt, plain", kcal: 130, label: "1 cup" },
  { name: "Greek yogurt, vanilla", kcal: 180, label: "1 cup" },
  { name: "Yogurt, regular", kcal: 150, label: "1 cup" },
  { name: "Skyr", kcal: 110, label: "1 cup" },
  { name: "Cottage cheese", kcal: 180, label: "1 cup" },
  { name: "Whole milk", kcal: 150, label: "1 cup" },
  { name: "Skim milk", kcal: 90, label: "1 cup" },
  { name: "2% milk", kcal: 122, label: "1 cup" },
  { name: "Almond milk, unsweetened", kcal: 30, label: "1 cup" },
  { name: "Oat milk", kcal: 120, label: "1 cup" },
  { name: "Soy milk, unsweetened", kcal: 80, label: "1 cup" },
  { name: "Heavy cream", kcal: 100, label: "2 tbsp" },
  { name: "Half & half", kcal: 40, label: "2 tbsp" },
  { name: "Cheddar cheese", kcal: 115, label: "1 oz" },
  { name: "Mozzarella, part-skim", kcal: 85, label: "1 oz" },
  { name: "Mozzarella, fresh", kcal: 70, label: "1 oz" },
  { name: "Feta cheese", kcal: 75, label: "1 oz" },
  { name: "Parmesan, grated", kcal: 110, label: "1 oz" },
  { name: "Goat cheese", kcal: 75, label: "1 oz" },
  { name: "Cream cheese", kcal: 100, label: "2 tbsp" },
  { name: "Brie", kcal: 95, label: "1 oz" },
  { name: "Ricotta, part-skim", kcal: 170, label: "1/2 cup" },
  { name: "Butter", kcal: 100, label: "1 tbsp" },
  { name: "Ghee", kcal: 120, label: "1 tbsp" },

  // --- Animal proteins ---
  { name: "Chicken breast, grilled", kcal: 230, label: "4 oz" },
  { name: "Chicken thigh, grilled", kcal: 280, label: "4 oz" },
  { name: "Chicken wings", kcal: 100, label: "1 wing" },
  { name: "Rotisserie chicken", kcal: 240, label: "4 oz" },
  { name: "Turkey breast, sliced", kcal: 110, label: "3 oz" },
  { name: "Ground turkey, 93% lean", kcal: 200, label: "4 oz" },
  { name: "Salmon, baked", kcal: 250, label: "4 oz" },
  { name: "Salmon, smoked (lox)", kcal: 100, label: "2 oz" },
  { name: "Tuna, canned in water", kcal: 110, label: "1 can" },
  { name: "Tuna steak, grilled", kcal: 200, label: "4 oz" },
  { name: "Shrimp, cooked", kcal: 100, label: "4 oz" },
  { name: "Cod, baked", kcal: 120, label: "4 oz" },
  { name: "Tilapia, baked", kcal: 145, label: "4 oz" },
  { name: "Halibut, grilled", kcal: 160, label: "4 oz" },
  { name: "Sardines, canned in oil", kcal: 190, label: "1 can" },
  { name: "Anchovies", kcal: 8, label: "1 fillet" },
  { name: "Steak, sirloin", kcal: 290, label: "4 oz" },
  { name: "Steak, ribeye", kcal: 350, label: "4 oz" },
  { name: "Filet mignon", kcal: 280, label: "4 oz" },
  { name: "Ground beef, 90/10", kcal: 240, label: "4 oz" },
  { name: "Ground beef, 80/20", kcal: 290, label: "4 oz" },
  { name: "Pork tenderloin", kcal: 180, label: "4 oz" },
  { name: "Pork chop, grilled", kcal: 220, label: "4 oz" },
  { name: "Bacon", kcal: 90, label: "2 strips" },
  { name: "Turkey bacon", kcal: 60, label: "2 strips" },
  { name: "Sausage, breakfast", kcal: 170, label: "2 links" },
  { name: "Italian sausage", kcal: 230, label: "1 link" },
  { name: "Hot dog, beef", kcal: 150, label: "1 hot dog" },
  { name: "Deli ham", kcal: 60, label: "2 oz" },
  { name: "Pepperoni", kcal: 140, label: "1 oz" },
  { name: "Lamb chop", kcal: 280, label: "4 oz" },

  // --- Plant proteins / legumes ---
  { name: "Tofu, firm", kcal: 145, label: "4 oz" },
  { name: "Tofu, silken", kcal: 70, label: "4 oz" },
  { name: "Tempeh", kcal: 220, label: "4 oz" },
  { name: "Seitan", kcal: 140, label: "3 oz" },
  { name: "Edamame", kcal: 190, label: "1 cup" },
  { name: "Lentils, cooked", kcal: 230, label: "1 cup" },
  { name: "Black beans, cooked", kcal: 220, label: "1 cup" },
  { name: "Pinto beans, cooked", kcal: 245, label: "1 cup" },
  { name: "Kidney beans, cooked", kcal: 225, label: "1 cup" },
  { name: "Chickpeas, cooked", kcal: 270, label: "1 cup" },
  { name: "White beans, cooked", kcal: 250, label: "1 cup" },
  { name: "Refried beans", kcal: 220, label: "1 cup" },
  { name: "Hummus", kcal: 70, label: "2 tbsp" },
  { name: "Falafel", kcal: 60, label: "1 ball" },
  { name: "Veggie burger patty", kcal: 130, label: "1 patty" },

  // --- Grains & starches ---
  { name: "Brown rice, cooked", kcal: 220, label: "1 cup" },
  { name: "White rice, cooked", kcal: 205, label: "1 cup" },
  { name: "Jasmine rice, cooked", kcal: 240, label: "1 cup" },
  { name: "Basmati rice, cooked", kcal: 210, label: "1 cup" },
  { name: "Wild rice, cooked", kcal: 165, label: "1 cup" },
  { name: "Quinoa, cooked", kcal: 220, label: "1 cup" },
  { name: "Couscous, cooked", kcal: 175, label: "1 cup" },
  { name: "Farro, cooked", kcal: 200, label: "1 cup" },
  { name: "Barley, cooked", kcal: 195, label: "1 cup" },
  { name: "Pasta, cooked", kcal: 220, label: "1 cup" },
  { name: "Whole wheat pasta, cooked", kcal: 180, label: "1 cup" },
  { name: "Rice noodles, cooked", kcal: 190, label: "1 cup" },
  { name: "Soba noodles, cooked", kcal: 190, label: "1 cup" },
  { name: "Ramen noodles (instant)", kcal: 380, label: "1 packet" },
  { name: "Bread, whole wheat", kcal: 80, label: "1 slice" },
  { name: "Bread, white", kcal: 75, label: "1 slice" },
  { name: "Sourdough", kcal: 90, label: "1 slice" },
  { name: "Bagel, plain", kcal: 280, label: "1 bagel" },
  { name: "Bagel, everything", kcal: 290, label: "1 bagel" },
  { name: "English muffin", kcal: 130, label: "1 muffin" },
  { name: "Croissant", kcal: 230, label: "1 medium" },
  { name: "Tortilla, flour", kcal: 140, label: "1 medium" },
  { name: "Tortilla, corn", kcal: 60, label: "1 small" },
  { name: "Pita bread", kcal: 165, label: "1 pita" },
  { name: "Naan", kcal: 260, label: "1 piece" },
  { name: "Roti / chapati", kcal: 120, label: "1 piece" },
  { name: "Sweet potato, baked", kcal: 180, label: "1 medium" },
  { name: "Potato, baked", kcal: 160, label: "1 medium" },
  { name: "Mashed potatoes", kcal: 240, label: "1 cup" },
  { name: "French fries (medium)", kcal: 365, label: "1 serving" },
  { name: "Hash browns", kcal: 200, label: "1 cup" },
  { name: "Cereal, plain (e.g. Cheerios)", kcal: 110, label: "1 cup" },
  { name: "Granola", kcal: 200, label: "1/2 cup" },
  { name: "Pancake", kcal: 90, label: "1 (4-inch)" },
  { name: "Waffle", kcal: 220, label: "1 round" },
  { name: "French toast", kcal: 150, label: "1 slice" },

  // --- Nuts, seeds, fats ---
  { name: "Almonds", kcal: 165, label: "1 oz (~23 nuts)" },
  { name: "Walnuts", kcal: 185, label: "1 oz" },
  { name: "Cashews", kcal: 155, label: "1 oz" },
  { name: "Pistachios", kcal: 160, label: "1 oz" },
  { name: "Pecans", kcal: 195, label: "1 oz" },
  { name: "Macadamia nuts", kcal: 200, label: "1 oz" },
  { name: "Brazil nuts", kcal: 185, label: "1 oz" },
  { name: "Hazelnuts", kcal: 180, label: "1 oz" },
  { name: "Pine nuts", kcal: 190, label: "1 oz" },
  { name: "Peanuts", kcal: 165, label: "1 oz" },
  { name: "Mixed nuts, roasted", kcal: 175, label: "1 oz" },
  { name: "Sunflower seeds", kcal: 165, label: "1 oz" },
  { name: "Pumpkin seeds (pepitas)", kcal: 160, label: "1 oz" },
  { name: "Chia seeds", kcal: 60, label: "1 tbsp" },
  { name: "Flaxseeds, ground", kcal: 55, label: "1 tbsp" },
  { name: "Hemp seeds", kcal: 55, label: "1 tbsp" },
  { name: "Sesame seeds", kcal: 50, label: "1 tbsp" },
  { name: "Peanut butter", kcal: 190, label: "2 tbsp" },
  { name: "Almond butter", kcal: 200, label: "2 tbsp" },
  { name: "Cashew butter", kcal: 195, label: "2 tbsp" },
  { name: "Tahini", kcal: 90, label: "1 tbsp" },
  { name: "Olive oil", kcal: 120, label: "1 tbsp" },
  { name: "Coconut oil", kcal: 120, label: "1 tbsp" },
  { name: "Avocado oil", kcal: 124, label: "1 tbsp" },
  { name: "Sesame oil", kcal: 120, label: "1 tbsp" },
  { name: "Coconut, shredded", kcal: 70, label: "2 tbsp" },

  // --- Condiments & sauces ---
  { name: "Mayonnaise", kcal: 90, label: "1 tbsp" },
  { name: "Mustard", kcal: 5, label: "1 tsp" },
  { name: "Ketchup", kcal: 15, label: "1 tbsp" },
  { name: "BBQ sauce", kcal: 30, label: "1 tbsp" },
  { name: "Soy sauce", kcal: 8, label: "1 tbsp" },
  { name: "Sriracha", kcal: 5, label: "1 tsp" },
  { name: "Salsa", kcal: 10, label: "2 tbsp" },
  { name: "Guacamole", kcal: 50, label: "2 tbsp" },
  { name: "Pesto", kcal: 80, label: "1 tbsp" },
  { name: "Marinara sauce", kcal: 70, label: "1/2 cup" },
  { name: "Alfredo sauce", kcal: 220, label: "1/2 cup" },
  { name: "Ranch dressing", kcal: 130, label: "2 tbsp" },
  { name: "Caesar dressing", kcal: 160, label: "2 tbsp" },
  { name: "Vinaigrette", kcal: 80, label: "2 tbsp" },
  { name: "Honey", kcal: 60, label: "1 tbsp" },
  { name: "Maple syrup", kcal: 52, label: "1 tbsp" },
  { name: "Sugar, granulated", kcal: 16, label: "1 tsp" },
  { name: "Jam / jelly", kcal: 50, label: "1 tbsp" },
  { name: "Nutritional yeast", kcal: 20, label: "1 tbsp" },

  // --- Snacks ---
  { name: "Tortilla chips", kcal: 140, label: "1 oz (~10 chips)" },
  { name: "Potato chips", kcal: 150, label: "1 oz" },
  { name: "Pretzels", kcal: 110, label: "1 oz" },
  { name: "Popcorn, air-popped", kcal: 30, label: "1 cup" },
  { name: "Popcorn, microwave butter", kcal: 80, label: "1 cup" },
  { name: "Crackers, whole grain", kcal: 130, label: "1 oz (~5 crackers)" },
  { name: "Goldfish crackers", kcal: 140, label: "30 pieces" },
  { name: "Rice cake", kcal: 35, label: "1 cake" },
  { name: "Trail mix", kcal: 140, label: "1/4 cup" },
  { name: "Beef jerky", kcal: 80, label: "1 oz" },
  { name: "Granola bar", kcal: 130, label: "1 bar" },
  { name: "Protein bar (typical)", kcal: 220, label: "1 bar" },
  { name: "RxBar", kcal: 210, label: "1 bar" },
  { name: "Clif bar", kcal: 250, label: "1 bar" },
  { name: "KIND bar", kcal: 200, label: "1 bar" },
  { name: "Protein shake (whey)", kcal: 130, label: "1 scoop" },
  { name: "Protein shake (premier)", kcal: 160, label: "1 bottle" },

  // --- Beverages ---
  { name: "Coffee, black", kcal: 2, label: "1 cup" },
  { name: "Latte (whole milk)", kcal: 180, label: "12 oz" },
  { name: "Latte (skim)", kcal: 100, label: "12 oz" },
  { name: "Cappuccino", kcal: 80, label: "8 oz" },
  { name: "Cold brew, plain", kcal: 5, label: "12 oz" },
  { name: "Tea, plain", kcal: 0, label: "1 cup" },
  { name: "Iced tea, sweetened", kcal: 90, label: "12 oz" },
  { name: "Matcha latte", kcal: 120, label: "12 oz" },
  { name: "Orange juice", kcal: 110, label: "1 cup" },
  { name: "Apple juice", kcal: 115, label: "1 cup" },
  { name: "Soda (regular)", kcal: 140, label: "12 oz can" },
  { name: "Diet soda", kcal: 0, label: "12 oz can" },
  { name: "Sparkling water (LaCroix)", kcal: 0, label: "12 oz can" },
  { name: "Coconut water", kcal: 45, label: "1 cup" },
  { name: "Smoothie (fruit, no protein)", kcal: 250, label: "16 oz" },
  { name: "Smoothie with protein", kcal: 350, label: "16 oz" },
  { name: "Beer (regular)", kcal: 150, label: "12 oz" },
  { name: "Beer, light", kcal: 100, label: "12 oz" },
  { name: "Beer, IPA", kcal: 200, label: "12 oz" },
  { name: "Wine, red", kcal: 125, label: "5 oz" },
  { name: "Wine, white", kcal: 120, label: "5 oz" },
  { name: "Champagne / prosecco", kcal: 95, label: "5 oz" },
  { name: "Margarita", kcal: 220, label: "1 cocktail" },
  { name: "Vodka soda", kcal: 95, label: "1 cocktail" },
  { name: "Whiskey, neat", kcal: 95, label: "1.5 oz" },
  { name: "Gatorade", kcal: 80, label: "12 oz" },
  { name: "Kombucha", kcal: 60, label: "1 cup" },

  // --- Sweets & desserts ---
  { name: "Dark chocolate", kcal: 170, label: "1 oz" },
  { name: "Milk chocolate", kcal: 150, label: "1 oz" },
  { name: "Chocolate chip cookie", kcal: 120, label: "1 cookie" },
  { name: "Brownie", kcal: 240, label: "1 piece" },
  { name: "Ice cream, vanilla", kcal: 270, label: "1 cup" },
  { name: "Ice cream, Halo Top", kcal: 280, label: "1 pint" },
  { name: "Frozen yogurt", kcal: 180, label: "1 cup" },
  { name: "Donut, glazed", kcal: 240, label: "1 donut" },
  { name: "Muffin, blueberry", kcal: 380, label: "1 muffin" },
  { name: "Cake slice", kcal: 350, label: "1 slice" },
  { name: "Cheesecake slice", kcal: 410, label: "1 slice" },
  { name: "Apple pie slice", kcal: 320, label: "1 slice" },
  { name: "Gummy bears", kcal: 130, label: "1 oz" },

  // --- Prepared meals & restaurant items ---
  { name: "Pizza, cheese slice", kcal: 285, label: "1 slice" },
  { name: "Pizza, pepperoni slice", kcal: 310, label: "1 slice" },
  { name: "Cheeseburger (fast food)", kcal: 535, label: "1 burger" },
  { name: "Big Mac", kcal: 590, label: "1 burger" },
  { name: "Whopper", kcal: 660, label: "1 burger" },
  { name: "Chicken nuggets (10 pc)", kcal: 420, label: "10 nuggets" },
  { name: "Caesar salad with chicken", kcal: 470, label: "1 entrée" },
  { name: "Cobb salad", kcal: 540, label: "1 entrée" },
  { name: "Burrito bowl (chicken, rice, beans)", kcal: 650, label: "1 bowl" },
  { name: "Burrito (Chipotle, full)", kcal: 950, label: "1 burrito" },
  { name: "Taco, hard shell beef", kcal: 220, label: "1 taco" },
  { name: "Taco, soft chicken", kcal: 200, label: "1 taco" },
  { name: "Quesadilla, cheese", kcal: 500, label: "1 medium" },
  { name: "Sushi roll (8 pcs)", kcal: 350, label: "1 roll" },
  { name: "Spicy tuna roll", kcal: 290, label: "1 roll" },
  { name: "California roll", kcal: 255, label: "1 roll" },
  { name: "Sashimi", kcal: 40, label: "1 piece" },
  { name: "Pad Thai", kcal: 700, label: "1 entrée" },
  { name: "Pho (beef)", kcal: 450, label: "1 bowl" },
  { name: "Ramen (tonkotsu)", kcal: 700, label: "1 bowl" },
  { name: "General Tso's chicken", kcal: 880, label: "1 entrée" },
  { name: "Lo mein", kcal: 600, label: "1 entrée" },
  { name: "Fried rice", kcal: 350, label: "1 cup" },
  { name: "Spring roll", kcal: 100, label: "1 roll" },
  { name: "Egg roll", kcal: 200, label: "1 roll" },
  { name: "Curry, chicken (Indian)", kcal: 430, label: "1 cup" },
  { name: "Tikka masala with rice", kcal: 700, label: "1 entrée" },
  { name: "Biryani", kcal: 520, label: "1 cup" },
  { name: "Samosa", kcal: 130, label: "1 samosa" },
  { name: "Shawarma (chicken pita)", kcal: 480, label: "1 sandwich" },
  { name: "Gyro", kcal: 540, label: "1 gyro" },
  { name: "Sandwich, turkey & cheese", kcal: 380, label: "1 sandwich" },
  { name: "Sandwich, BLT", kcal: 430, label: "1 sandwich" },
  { name: "Sandwich, club", kcal: 590, label: "1 sandwich" },
  { name: "Sub, Italian (6-inch)", kcal: 480, label: "6-inch" },
  { name: "Wrap, chicken Caesar", kcal: 540, label: "1 wrap" },
  { name: "Hot dog with bun", kcal: 290, label: "1" },
  { name: "Mac and cheese", kcal: 320, label: "1 cup" },
  { name: "Lasagna", kcal: 400, label: "1 piece" },
  { name: "Spaghetti with marinara", kcal: 320, label: "1 cup" },
  { name: "Spaghetti with meatballs", kcal: 540, label: "1 entrée" },
  { name: "Chicken Parmesan", kcal: 700, label: "1 entrée" },
  { name: "Risotto", kcal: 400, label: "1 cup" },
  { name: "Soup, vegetable", kcal: 100, label: "1 cup" },
  { name: "Soup, chicken noodle", kcal: 150, label: "1 cup" },
  { name: "Soup, tomato", kcal: 160, label: "1 cup" },
  { name: "Soup, miso", kcal: 60, label: "1 cup" },
  { name: "Soup, lentil", kcal: 230, label: "1 cup" },
  { name: "Chili, beef", kcal: 280, label: "1 cup" },
  { name: "Chili, vegetarian", kcal: 230, label: "1 cup" },
  { name: "Beef stew", kcal: 220, label: "1 cup" },
  { name: "Bowl, poke (tuna)", kcal: 600, label: "1 bowl" },
  { name: "Bowl, açaí", kcal: 450, label: "16 oz" },
  { name: "Sweetgreen kale Caesar", kcal: 540, label: "1 entrée" },
  { name: "Sweetgreen harvest bowl", kcal: 700, label: "1 entrée" },

  // --- Breakfast / brunch items ---
  { name: "Avocado toast", kcal: 290, label: "1 slice" },
  { name: "Breakfast burrito", kcal: 520, label: "1 burrito" },
  { name: "Breakfast sandwich (egg, cheese)", kcal: 380, label: "1 sandwich" },
  { name: "Egg McMuffin", kcal: 310, label: "1 sandwich" },
  { name: "Overnight oats", kcal: 320, label: "1 cup" },
  { name: "Yogurt parfait", kcal: 280, label: "1 cup" },
  { name: "Smoothie bowl", kcal: 420, label: "16 oz" },
];

/* ---------- Macro estimator ----------
   Infers macro splits from a food's name. Each category specifies the % of
   total kcal coming from protein, carbs, and fat. The function returns
   estimated grams of each. Estimates are reasonable defaults, not exact.
*/
const MACRO_PROFILES = [
  // Each entry: { matchers: keywords (lower-case), p, c, f } where p+c+f = 1.0 of kcal
  // Lean animal proteins
  { match: ["chicken breast", "turkey breast", "egg whites", "tuna", "shrimp", "cod", "tilapia", "halibut", "lean"], p: 0.65, c: 0.05, f: 0.30 },
  // Fattier animal proteins
  { match: ["chicken thigh", "salmon", "steak", "ribeye", "ground beef", "pork", "lamb", "sausage", "bacon", "hot dog", "wing", "rotisserie", "pepperoni", "ham"], p: 0.40, c: 0.05, f: 0.55 },
  // Fish (general)
  { match: ["fish", "sardine", "anchovy", "mackerel"], p: 0.55, c: 0.05, f: 0.40 },
  // Eggs
  { match: ["egg, fried", "hard-boiled egg", "eggs, scrambled", "egg "], p: 0.32, c: 0.04, f: 0.64 },
  // Plant proteins
  { match: ["tofu", "tempeh", "seitan", "edamame", "lentil", "bean", "chickpea", "hummus", "falafel", "veggie burger"], p: 0.35, c: 0.45, f: 0.20 },
  // Dairy: high protein
  { match: ["greek yogurt", "skyr", "cottage cheese", "ricotta", "protein shake", "protein bar", "rxbar"], p: 0.50, c: 0.30, f: 0.20 },
  // Dairy: balanced
  { match: ["milk", "yogurt"], p: 0.20, c: 0.45, f: 0.35 },
  // Cheese
  { match: ["cheese", "cheddar", "mozzarella", "feta", "parmesan", "brie", "goat cheese"], p: 0.25, c: 0.03, f: 0.72 },
  // Cream / heavy fats
  { match: ["heavy cream", "butter", "ghee", "cream cheese"], p: 0.02, c: 0.02, f: 0.96 },
  // Pure fats / oils
  { match: ["oil", "lard"], p: 0.0, c: 0.0, f: 1.0 },
  // Nut butters / nuts / seeds
  { match: ["peanut butter", "almond butter", "cashew butter", "tahini", "almonds", "walnut", "cashew", "pistachio", "pecan", "macadamia", "brazil", "hazelnut", "pine nut", "peanut", "mixed nuts", "sunflower", "pumpkin seed", "chia", "flaxseed", "hemp seed", "sesame seed", "trail mix"], p: 0.13, c: 0.15, f: 0.72 },
  // Avocado / coconut
  { match: ["avocado", "guacamole", "coconut, shredded"], p: 0.05, c: 0.20, f: 0.75 },
  // Leafy & non-starchy veg
  { match: ["spinach", "kale", "lettuce", "arugula", "cabbage", "broccoli", "cauliflower", "asparagus", "bell pepper", "cucumber", "tomato", "mushroom", "zucchini", "eggplant", "salad greens", "brussels", "green bean", "celery", "radish"], p: 0.25, c: 0.65, f: 0.10 },
  // Starchy veg / tubers
  { match: ["potato", "sweet potato", "corn", "pea", "beet", "squash", "pumpkin", "carrot", "hash brown", "fries"], p: 0.08, c: 0.82, f: 0.10 },
  // Fruits
  { match: ["apple", "banana", "orange", "berr", "grape", "watermelon", "cantaloupe", "pineapple", "mango", "peach", "pear", "plum", "kiwi", "cherr", "pomegranate", "grapefruit", "lemon", "lime", "apricot", "raisin", "date", "strawber", "blueber", "raspber", "blackber", "fruit"], p: 0.04, c: 0.94, f: 0.02 },
  // Grains, breads, rice, pasta
  { match: ["rice", "quinoa", "couscous", "farro", "barley", "pasta", "noodle", "ramen", "bread", "bagel", "english muffin", "croissant", "tortilla", "pita", "naan", "roti", "chapati", "cereal", "oatmeal", "oats", "granola", "pancake", "waffle", "french toast"], p: 0.13, c: 0.72, f: 0.15 },
  // Sweets / desserts
  { match: ["chocolate", "cookie", "brownie", "ice cream", "frozen yogurt", "donut", "muffin", "cake", "cheesecake", "pie", "gummy", "candy", "honey", "syrup", "sugar", "jam", "jelly"], p: 0.05, c: 0.65, f: 0.30 },
  // Sodas / juices / sweet drinks
  { match: ["soda", "juice", "iced tea", "gatorade", "kombucha", "coconut water", "smoothie"], p: 0.03, c: 0.95, f: 0.02 },
  // Black coffee / tea / sparkling water (no macros)
  { match: ["coffee, black", "tea, plain", "sparkling water", "diet soda", "cold brew"], p: 0.0, c: 1.0, f: 0.0 },
  // Coffee drinks with milk
  { match: ["latte", "cappuccino", "matcha"], p: 0.18, c: 0.50, f: 0.32 },
  // Beer
  { match: ["beer"], p: 0.05, c: 0.85, f: 0.10 },
  // Wine / spirits
  { match: ["wine", "champagne", "prosecco", "vodka", "whiskey", "margarita", "cocktail"], p: 0.0, c: 0.40, f: 0.0 }, // alcohol kcal — counted toward carbs slot for simplicity
  // Pizza
  { match: ["pizza"], p: 0.18, c: 0.42, f: 0.40 },
  // Burgers / sandwiches / wraps
  { match: ["burger", "whopper", "big mac", "sandwich", "sub, italian", "wrap", "shawarma", "gyro", "burrito", "quesadilla", "taco", "breakfast sandwich", "egg mcmuffin", "breakfast burrito"], p: 0.22, c: 0.40, f: 0.38 },
  // Sushi rolls / poke (rice + protein)
  { match: ["sushi", "tuna roll", "california roll", "poke", "sashimi"], p: 0.20, c: 0.55, f: 0.25 },
  // Asian noodle / rice dishes (general)
  { match: ["pad thai", "lo mein", "fried rice", "biryani", "general tso", "tikka", "curry", "ramen (ton", "pho"], p: 0.18, c: 0.50, f: 0.32 },
  // Soups
  { match: ["soup", "chili", "stew", "miso"], p: 0.20, c: 0.55, f: 0.25 },
  // Salads (mixed)
  { match: ["caesar salad", "cobb salad", "kale caesar", "harvest bowl", "burrito bowl", "açaí", "yogurt parfait", "smoothie bowl", "avocado toast", "salad"], p: 0.18, c: 0.45, f: 0.37 },
  // Pasta dishes
  { match: ["lasagna", "spaghetti", "mac and cheese", "risotto", "chicken parmesan", "alfredo", "marinara", "pesto"], p: 0.16, c: 0.50, f: 0.34 },
  // Condiments / sauces (small contributions)
  { match: ["mayonnaise", "ranch", "caesar dressing", "vinaigrette"], p: 0.02, c: 0.05, f: 0.93 },
  { match: ["ketchup", "bbq", "salsa", "soy sauce", "sriracha", "mustard"], p: 0.10, c: 0.85, f: 0.05 },
  // Snacks
  { match: ["chip", "pretzel", "cracker", "popcorn", "rice cake", "goldfish"], p: 0.10, c: 0.60, f: 0.30 },
  { match: ["bar", "jerky"], p: 0.30, c: 0.45, f: 0.25 },
  // Spring/egg rolls / samosa / dumpling
  { match: ["spring roll", "egg roll", "samosa", "chicken nugget"], p: 0.15, c: 0.40, f: 0.45 },
];

const DEFAULT_MACRO = { p: 0.20, c: 0.55, f: 0.25 }; // generic mixed meal

function estimateMacrosForFood(name, kcal) {
  if (!name || !kcal) return { proteinG: 0, carbG: 0, fatG: 0 };
  const n = name.toLowerCase();
  let profile = DEFAULT_MACRO;
  // First match wins — most specific should be earlier in the list
  for (const entry of MACRO_PROFILES) {
    if (entry.match.some((kw) => n.includes(kw))) {
      profile = entry;
      break;
    }
  }
  // Calories from each macro:
  const proteinKcal = kcal * profile.p;
  const carbKcal = kcal * profile.c;
  const fatKcal = kcal * profile.f;
  // Convert to grams (4 kcal/g for protein & carbs, 9 kcal/g for fat)
  return {
    proteinG: Math.round(proteinKcal / 4),
    carbG: Math.round(carbKcal / 4),
    fatG: Math.round(fatKcal / 9),
  };
}


/* ---------- Daily tips ---------- */
// Selected by goal/condition. Short, evidence-based, non-medical-advice.
const TIPS = [
  { id: "fiber-order", goal: "lose", text: "Try eating veg and protein before starches. Same meal, gentler glucose response — small but real effect for fat loss." },
  { id: "protein-spread", goal: "lose", text: "Spread protein across the day — 25–35 g per meal beats 70 g in one sitting for satiety." },
  { id: "muscle-protein", goal: "muscle", text: "Hit your protein target every day, even rest days. Recovery uses protein 24–48 hours after a session, not just same-day." },
  { id: "muscle-sleep", goal: "muscle", text: "Sleep is where muscle is built. Under 7 hours blunts strength gains within a week." },
  { id: "maintain-walk", goal: "maintain", text: "10-minute walk after meals lowers post-meal glucose. Easiest health win there is." },
  { id: "health-fiber", goal: "health", text: "Fiber target is 25–35 g/day. Most people hit half that. Add one cup of vegetables to one meal — done." },
  { id: "general-water", goal: null, text: "Drink a glass of water before each meal. Hunger and thirst share signals — easy way to right-size portions." },
  { id: "general-protein", goal: null, text: "Protein at every meal makes the rest of macros forgiving. It's the lever with the highest return." },
  { id: "general-walk", goal: null, text: "Walking is underrated. 30 minutes a day, even broken into 10-minute chunks, moves the needle on every health marker." },
  { id: "general-sleep", goal: null, text: "If you can only fix one thing, fix sleep. It blunts both fat loss and muscle gain when it's short." },
  { id: "diabetes", condition: "Type 2 Diabetes", text: "Pair carbs with protein or fat — never eat carbs alone. Slows glucose absorption and reduces insulin spikes." },
  { id: "diabetes2", condition: "Type 1 Diabetes", text: "Avoid prolonged fasting windows. Stable carb intake across the day is friendlier to your insulin schedule." },
  { id: "stroke", condition: "Post-stroke", text: "Smaller, more frequent meals are usually easier than three large ones during recovery." },
  { id: "dysphagia", condition: "Dysphagia (swallow precautions)", text: "If a food doesn't pass the spoon-tilt test, it's not the right texture. Stick to your IDDSI level." },
  { id: "hypertension", condition: "Hypertension", text: "Sodium adds up fast in restaurant meals — often 1,500+ mg per dish. Cooking at home is the easiest way to keep it in range." },
];

function pickTip(profile) {
  if (!profile) return TIPS.find((t) => t.id === "general-protein");
  // Condition-specific tips first
  if (profile.conditions?.length) {
    for (const c of profile.conditions) {
      const found = TIPS.find((t) => t.condition === c);
      if (found) return found;
    }
  }
  // Goal-matched
  const goalTips = TIPS.filter((t) => t.goal === profile.goal);
  if (goalTips.length) {
    return goalTips[Math.floor(Date.now() / 86400000) % goalTips.length];
  }
  // General fallback rotated by day
  const general = TIPS.filter((t) => t.goal === null);
  return general[Math.floor(Date.now() / 86400000) % general.length];
}

/* ---------- Calculations (Mifflin–St Jeor) ---------- */

function calcBMR({ sex, weightKg, heightCm, age }) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === "male" ? base + 5 : base - 161;
}

function calcTDEE(bmr, activityId) {
  const m = ACTIVITY_LEVELS.find((a) => a.id === activityId)?.mult ?? 1.2;
  return bmr * m;
}

function calcTarget(tdee, profile) {
  // Backward-compatible: accepts either a goalId string or full profile object.
  const goalId = typeof profile === "string" ? profile : profile?.goal;
  const g = GOALS.find((x) => x.id === goalId);
  let dailyDelta = g?.adj ?? 0;

  // If we have weight + timeline, override the default delta with a personalized one.
  if (typeof profile === "object" && profile && (goalId === "lose" || goalId === "muscle")) {
    const goalWeightKg = Number(profile.goalWeightKg);
    const timelineWeeks = Number(profile.timelineWeeks);
    const currentWeightKg = Number(profile.weightKg);
    if (goalWeightKg && timelineWeeks && currentWeightKg) {
      const deltaKg = goalWeightKg - currentWeightKg;
      // 7700 kcal per kg of body weight change
      const totalDeltaKcal = deltaKg * 7700;
      const days = timelineWeeks * 7;
      let perDay = totalDeltaKcal / days;
      // Safety caps: max 1000 kcal/day deficit, max 500 kcal/day surplus
      perDay = Math.max(-1000, Math.min(500, perDay));
      // Direction sanity: if user said "lose" but goal weight is higher (or vice versa), fall back
      if ((goalId === "lose" && perDay < 0) || (goalId === "muscle" && perDay > 0)) {
        dailyDelta = perDay;
      }
    }
  }

  const base = Math.max(1200, Math.round(tdee + dailyDelta));
  return base;
}

// Returns active-day and off-day targets given a base average target and a structure.
// "Off" days are at maintenance (TDEE); deficit/surplus is concentrated on active days.
function calcStructuredTargets(baseTarget, tdee, structure) {
  const offDays = Number(structure?.offDays ?? 0);
  const activeDays = 7 - offDays;
  if (offDays <= 0 || activeDays <= 0) {
    return { activeTarget: baseTarget, offTarget: baseTarget, offDays: 0 };
  }
  const weeklyTotal = baseTarget * 7;
  const offTotal = Math.round(tdee) * offDays;
  const activePerDay = Math.max(1200, Math.round((weeklyTotal - offTotal) / activeDays));
  return { activeTarget: activePerDay, offTarget: Math.round(tdee), offDays };
}

function calcMacros(target, weightKg, goalId) {
  // Protein: muscle goal → 2.0 g/kg, lose → 1.8, else 1.6
  const proteinPerKg = goalId === "muscle" ? 2.0 : goalId === "lose" ? 1.8 : 1.6;
  const proteinG = Math.round(weightKg * proteinPerKg);
  const proteinKcal = proteinG * 4;
  // Fat ~28% of total
  const fatKcal = target * 0.28;
  const fatG = Math.round(fatKcal / 9);
  // Carbs = remainder
  const carbKcal = Math.max(0, target - proteinKcal - fatKcal);
  const carbG = Math.round(carbKcal / 4);
  return { proteinG, fatG, carbG };
}

function calcBMI(weightKg, heightCm) {
  const m = heightCm / 100;
  return weightKg / (m * m);
}

function bmiBand(bmi) {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal range";
  if (bmi < 30) return "Overweight";
  return "Obese";
}

/* ---------- Shared UI ---------- */

function Brand({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2.5 group"
      aria-label="LIFT home"
    >
      <div className="w-9 h-9 rounded-sm flex items-center justify-center" style={{ background: NAVY }}>
        <span className="text-white font-semibold text-lg leading-none">L</span>
      </div>
      <div className="text-left leading-tight">
        <div className="font-serif text-lg tracking-tight" style={{ color: NAVY }}>LIFT</div>
        <div className="micro text-slate-500">Lifestyle Intervention &amp; Fitness Taskforce</div>
      </div>
    </button>
  );
}

function Header({ onHome, view, currentUser, onOpenAuth, onSignOut, go }) {
  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
        <Brand onClick={onHome} />
        <div className="flex items-center gap-5">
          {view !== "home" && (
            <button
              onClick={onHome}
              className="text-sm text-slate-600 hover:text-slate-900 flex items-center gap-1.5 transition"
            >
              <ArrowLeft className="w-4 h-4" /> Home
            </button>
          )}
          <button
            onClick={() => go("hotline")}
            className={`text-sm transition hover:text-slate-900 ${
              view === "hotline" ? "text-slate-900 font-medium" : "text-slate-600"
            }`}
          >
            LIFT Hotline
          </button>
          <button
            onClick={() => go("coaches")}
            className={`text-sm transition hover:text-slate-900 ${
              view === "coaches" ? "text-slate-900 font-medium" : "text-slate-600"
            }`}
          >
            Project coaches
          </button>
          <button
            onClick={() => go("about")}
            className={`text-sm transition hover:text-slate-900 ${
              view === "about" ? "text-slate-900 font-medium" : "text-slate-600"
            }`}
          >
            About us
          </button>
          <button
            onClick={() => go("contact")}
            className={`text-sm transition hover:text-slate-900 ${
              view === "contact" ? "text-slate-900 font-medium" : "text-slate-600"
            }`}
          >
            Contact
          </button>
          {currentUser ? (
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-slate-500">
                <User className="w-3.5 h-3.5" />
                {currentUser}
              </span>
              <button
                onClick={onSignOut}
                className="text-sm text-slate-600 hover:text-slate-900 flex items-center gap-1.5 transition"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => onOpenAuth("signin")}
              className="px-4 py-1.5 rounded-sm text-sm border border-slate-300 hover:border-slate-900 transition flex items-center gap-1.5"
              style={{ color: NAVY }}
            >
              <LogIn className="w-3.5 h-3.5" />
              Sign in
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-slate-200 mt-20 bg-white">
      <div className="max-w-6xl mx-auto px-6 py-10 text-xs text-slate-500 leading-relaxed">
        <p className="mb-2 font-medium text-slate-700">Medical disclaimer</p>
        <p className="max-w-3xl">
          LIFT provides general wellness information based on standard formulas (Mifflin–St Jeor) and
          population-level guidelines. It is not medical advice and is not a substitute for evaluation by a licensed
          clinician. Talk to your doctor before starting any new diet or exercise plan, especially if you have a
          medical condition, are pregnant, take medications, or have a history of an eating disorder.
        </p>
      </div>
    </footer>
  );
}

function Section({ eyebrow, title, children }) {
  return (
    <div>
      {eyebrow && (
        <div className="eyebrow text-slate-500 mb-2">{eyebrow}</div>
      )}
      {title && (
        <h2 className="font-serif text-3xl md:text-4xl tracking-tight mb-6" style={{ color: NAVY }}>
          {title}
        </h2>
      )}
      {children}
    </div>
  );
}

/* ============================================================
   HOME
   ============================================================ */

function Home({ go, hasResults, currentUser, onOpenAuth, profile, results, dailyKcal, dailyMacros, weights }) {
  const features = [
    {
      id: "survey",
      icon: ClipboardList,
      title: "Health survey",
      desc: "A short questionnaire that produces your personalized calorie and macro targets.",
      cta: "Start survey",
      primary: true,
    },
    {
      id: "results",
      icon: Heart,
      title: "Your recommendations",
      desc: "View your daily targets, macros, and lifestyle suggestions.",
      cta: hasResults ? "View results" : "Survey first",
      disabled: !hasResults,
    },
    {
      id: "bmi",
      icon: Calculator,
      title: "BMI calculator",
      desc: "Quick body mass index reference, no survey required.",
      cta: "Open calculator",
    },
    {
      id: "meals",
      icon: BookOpen,
      title: "Meal plans",
      desc: "Browse sample plans across balanced, high-protein, Mediterranean, plant-forward, and lower-carb styles.",
      cta: "Browse plans",
    },
    {
      id: "logger",
      icon: Utensils,
      title: "Meal logger",
      desc: "Log meals as you eat them and track today's calories against your goal.",
      cta: "Open logger",
    },
    {
      id: "progress",
      icon: TrendingUp,
      title: "Progress",
      desc: "Track your weight over time and review your meal log day by day. Requires sign-in.",
      cta: currentUser ? "View progress" : "Sign in to track",
    },
  ];

  // Signed-in dashboard
  const showDashboard = currentUser && results && profile;

  if (showDashboard) {
    const tip = pickTip(profile);
    const remaining = Math.max(0, results.target - dailyKcal);
    const pctUsed = Math.min(100, (dailyKcal / results.target) * 100);
    const sortedWeights = [...(weights ?? [])].sort((a, b) => a.date.localeCompare(b.date));
    const latestWeight = sortedWeights[sortedWeights.length - 1];
    let weightAgeDays = null;
    if (latestWeight) {
      const t = new Date(latestWeight.date).getTime();
      weightAgeDays = Math.floor((Date.now() - t) / 86400000);
    }
    const stale = weightAgeDays === null || weightAgeDays >= 7;

    return (
      <main>
        <section style={{ background: CREAM }}>
          <div className="max-w-6xl mx-auto px-6 pt-12 pb-10">
            <div className="eyebrow mb-3" style={{ color: NAVY_SOFT }}>Today</div>
            <h1
              className="font-serif text-4xl md:text-6xl tracking-tight"
              style={{ color: NAVY_DEEP, letterSpacing: "-0.025em", lineHeight: 1.0 }}
            >
              Welcome back{profile?.firstName ? <>, <span className="font-serif-italic" style={{ color: ACCENT }}>{profile.firstName}</span></> : ""}.
            </h1>

            <div className="mt-10 grid md:grid-cols-3 gap-4">
              <div className="md:col-span-2 bg-white p-7 lift-card rounded-sm">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="eyebrow mb-2" style={{ color: NAVY_SOFT }}>Today's intake</div>
                    <div className="lift-rise" style={{ color: NAVY_DEEP }}>
                      <div className="font-serif tracking-tight" style={{ fontSize: "5rem", lineHeight: 0.95, letterSpacing: "-0.03em" }}>
                        {dailyKcal.toLocaleString()}
                      </div>
                      <div className="font-mono text-sm mt-2" style={{ color: NAVY_SOFT }}>
                        of {results.target.toLocaleString()} kcal · {remaining.toLocaleString()} remaining
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => go("logger")}
                      className="text-sm px-4 py-2 rounded-sm flex items-center gap-1.5 text-white hover:opacity-90 transition"
                      style={{ background: NAVY_DEEP }}
                    >
                      <Plus className="w-3.5 h-3.5" /> Log meal
                    </button>
                  </div>
                </div>
                <div className="h-2 bg-slate-100 mt-6 relative overflow-hidden rounded-full">
                  <div
                    key={`prog-${pctUsed}`}
                    className="absolute left-0 top-0 h-full lift-progress-fill rounded-full"
                    style={{
                      width: `${pctUsed}%`,
                      background: pctUsed >= 100 ? ACCENT : `linear-gradient(90deg, ${NAVY} 0%, ${ACCENT} 100%)`,
                    }}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100">
                  {[
                    { label: "Protein", current: dailyMacros?.proteinG ?? 0, target: results.macros.proteinG },
                    { label: "Carbs", current: dailyMacros?.carbG ?? 0, target: results.macros.carbG },
                    { label: "Fat", current: dailyMacros?.fatG ?? 0, target: results.macros.fatG },
                  ].map((m) => {
                    const pct = m.target ? Math.min(100, (m.current / m.target) * 100) : 0;
                    return (
                      <div key={m.label}>
                        <div className="micro mb-1.5" style={{ color: NAVY_SOFT }}>{m.label}</div>
                        <div className="font-serif" style={{ color: NAVY_DEEP, fontSize: "1.5rem", letterSpacing: "-0.02em" }}>
                          {m.current}
                          <span className="font-mono text-xs ml-1" style={{ color: NAVY_SOFT }}>/{m.target}g</span>
                        </div>
                        <div className="h-1 bg-slate-100 mt-1.5 relative overflow-hidden rounded-full">
                          <div
                            className="absolute left-0 top-0 h-full rounded-full transition-all"
                            style={{ width: `${pct}%`, background: ACCENT }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={() => go("progress")}
                className="text-left bg-white p-6 hover:border-slate-400 transition lift-card rounded-sm"
                style={{ border: stale ? `2px solid ${ACCENT}` : "1px solid #E2E8F0" }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="eyebrow flex items-center gap-1.5" style={{ color: NAVY_SOFT }}>
                    <Scale className="w-3.5 h-3.5" /> Weight
                  </div>
                  {stale && (
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: ACCENT, color: "#fff" }}
                    >
                      Check in
                    </span>
                  )}
                </div>
                {latestWeight ? (
                  <>
                    <div className="font-serif tracking-tight" style={{ color: NAVY_DEEP, fontSize: "3rem", letterSpacing: "-0.02em", lineHeight: 1 }}>
                      {latestWeight.kg.toFixed(1)}
                      <span className="font-mono text-base ml-1" style={{ color: NAVY_SOFT }}>kg</span>
                    </div>
                    <div className="font-mono text-xs mt-2" style={{ color: NAVY_SOFT }}>
                      {weightAgeDays === 0 ? "logged today" : weightAgeDays === 1 ? "1 day ago" : `${weightAgeDays} days ago`}
                    </div>
                  </>
                ) : (
                  <div className="text-sm" style={{ color: NAVY_SOFT }}>
                    No weight logged yet. <span style={{ color: ACCENT }}>Log your first →</span>
                  </div>
                )}
              </button>
            </div>

            <div className="mt-4 bg-white p-5 lift-card rounded-sm flex items-start gap-3" style={{ borderLeft: `3px solid ${ACCENT}` }}>
              <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center" style={{ background: ACCENT_SOFT }}>
                <Zap className="w-4 h-4" style={{ color: ACCENT }} />
              </div>
              <div>
                <div className="micro mb-1" style={{ color: NAVY_SOFT }}>Today's tip</div>
                <div className="text-sm leading-relaxed" style={{ color: NAVY_DEEP }}>{tip.text}</div>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { id: "ask", icon: Sparkles, label: "Ask LIFT" },
              { id: "logger", icon: Utensils, label: "Meal logger" },
              { id: "progress", icon: TrendingUp, label: "Progress" },
              { id: "results", icon: Heart, label: "My plan" },
              { id: "meals", icon: BookOpen, label: "Meal plans" },
              { id: "bmi", icon: Calculator, label: "BMI" },
              { id: "sleep", icon: Moon, label: "Sleep tracker" },
              { id: "survey", icon: ClipboardList, label: "Update survey" },
            ].map((q) => {
              const Icon = q.icon;
              return (
                <button
                  key={q.id}
                  onClick={() => go(q.id)}
                  className="bg-white border border-slate-200 p-4 text-left hover:border-slate-400 transition flex items-center gap-3"
                >
                  <Icon className="w-4 h-4 flex-shrink-0" style={{ color: NAVY }} />
                  <span className="text-sm" style={{ color: NAVY }}>{q.label}</span>
                </button>
              );
            })}
          </div>
        </section>
      </main>
    );
  }

  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10" style={{ background: CREAM }} />
        <div className="max-w-6xl mx-auto px-6 pt-16 pb-20 md:pt-24 md:pb-28">
          <div className="eyebrow text-slate-500 mb-5">
            Lifestyle Intervention &amp; Fitness Taskforce
          </div>
          <h1
            className="font-serif text-5xl md:text-7xl tracking-tight max-w-3xl"
            style={{ color: NAVY_DEEP, lineHeight: 0.95 }}
          >
            Your <span className="font-serif-italic" style={{ color: ACCENT }}>personalized</span>,
            <br />
            <span style={{ color: NAVY_DEEP }}>AI health coach.</span>
          </h1>
          <p className="mt-7 max-w-xl text-slate-600 leading-relaxed">
            Tell us about you. Get a calorie target, a macro split, a meal plan, and a place to log
            what you actually eat. No fads, no theatrics — just the math, done well.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <button
              onClick={() => go("survey")}
              className="px-6 py-3.5 rounded-sm text-white text-sm font-medium tracking-wide flex items-center gap-2 hover:opacity-90 transition lift-card"
              style={{ background: NAVY_DEEP }}
            >
              Complete Intake Survey <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => go("calculators")}
              className="px-6 py-3.5 rounded-sm text-sm font-medium tracking-wide border transition hover:border-slate-900"
              style={{ color: NAVY_DEEP, borderColor: "#CBD5E1" }}
            >
              View Our Health Tools
            </button>
          </div>
          <div className="mt-4">
            <button
              onClick={() => go("ask")}
              className="px-5 py-2.5 rounded-full text-sm tracking-wide flex items-center gap-2 transition hover:opacity-90"
              style={{ color: NAVY_DEEP, background: ACCENT_SOFT, border: `1px solid ${ACCENT}` }}
            >
              <Sparkles className="w-4 h-4" style={{ color: ACCENT }} />
              Ask LIFT — your AI coach
            </button>
          </div>
          <div className="mt-5 text-xs text-slate-500">
            {currentUser ? (
              <>
                Signed in as <span style={{ color: NAVY }}>{currentUser}</span>. Your survey results and meal log are
                being saved.
              </>
            ) : (
              <>
                <button
                  onClick={() => onOpenAuth("signup")}
                  className="underline hover:no-underline"
                  style={{ color: NAVY }}
                >
                  Create a free account
                </button>{" "}
                to save your progress across visits — or{" "}
                <button
                  onClick={() => onOpenAuth("signin")}
                  className="underline hover:no-underline"
                  style={{ color: NAVY }}
                >
                  sign in
                </button>
                .
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <Section eyebrow="What's inside" title="Features">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-slate-200 border border-slate-200">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <button
                  key={f.id}
                  onClick={() => !f.disabled && go(f.id)}
                  disabled={f.disabled}
                  className={`text-left p-7 bg-white transition group ${
                    f.disabled ? "opacity-40 cursor-not-allowed" : "hover:bg-slate-50"
                  }`}
                >
                  <div
                    className="w-11 h-11 rounded-sm flex items-center justify-center mb-5 border"
                    style={{ borderColor: NAVY, color: NAVY }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-serif text-2xl tracking-tight mb-2" style={{ color: NAVY }}>
                    {f.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed mb-5">{f.desc}</p>
                  <span
                    className="micro flex items-center gap-1.5"
                    style={{ color: NAVY }}
                  >
                    {f.cta}
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
                  </span>
                </button>
              );
            })}
          </div>
        </Section>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-6 pb-16">
        <Section eyebrow="How it works">
          <div className="grid md:grid-cols-3 gap-10 mt-2">
            {[
              { n: "01", t: "Tell us about you", d: "Age, sex, height, weight, activity, goal, dietary preferences, and any limitations." },
              { n: "02", t: "Get your numbers", d: "Daily calorie target, protein/carb/fat split, plus a starting meal style and exercise direction." },
              { n: "03", t: "Track and adjust", d: "Log what you eat against your target. Browse meal plans for ideas when you're stuck." },
            ].map((s) => (
              <div key={s.n} className="border-t border-slate-300 pt-5">
                <div className="font-serif text-3xl mb-3" style={{ color: NAVY }}>{s.n}</div>
                <div className="font-medium mb-2" style={{ color: NAVY }}>{s.t}</div>
                <div className="text-sm text-slate-600 leading-relaxed">{s.d}</div>
              </div>
            ))}
          </div>
        </Section>
      </section>
    </main>
  );
}

/* ============================================================
   QUICK START — minimal 1-screen survey
   ============================================================ */

function QuickStart({ onComplete, onFull }) {
  const [units, setUnits] = useState("metric");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [heightFt, setHeightFt] = useState("");
  const [heightIn, setHeightIn] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [weightLb, setWeightLb] = useState("");
  const [activity, setActivity] = useState("moderate");
  const [goal, setGoal] = useState("");

  const ageOk = age && Number(age) >= 14 && Number(age) <= 100;
  const heightCmEff = units === "metric" ? Number(heightCm) : (Number(heightFt) * 12 + Number(heightIn || 0)) * 2.54;
  const weightKgEff = units === "metric" ? Number(weightKg) : Number(weightLb) * 0.453592;
  const sizeOk = heightCmEff > 100 && heightCmEff < 250 && weightKgEff > 30 && weightKgEff < 300;
  const ready = ageOk && !!sex && sizeOk && !!goal;

  function go() {
    const profile = {
      age: Number(age),
      sex,
      heightCm: heightCmEff,
      weightKg: weightKgEff,
      units,
      activity,
      goal,
      goalWeightKg: null,
      timelineWeeks: null,
      offDays: 0,
      diet: [],
      experience: "",
      conditions: [],
      medications: [],
      allergies: [],
      personality: "",
      voice: "",
      limitations: "",
    };
    const bmr = calcBMR(profile);
    const tdee = calcTDEE(bmr, profile.activity);
    const target = calcTarget(tdee, profile);
    const macros = calcMacros(target, profile.weightKg, profile.goal);
    const bmi = calcBMI(profile.weightKg, profile.heightCm);
    onComplete({
      profile,
      results: {
        bmr: Math.round(bmr),
        tdee: Math.round(tdee),
        target,
        activeTarget: target,
        offTarget: target,
        offDays: 0,
        macros,
        bmi,
      },
    });
  }

  return (
    <main className="max-w-xl mx-auto px-6 py-12">
      <div className="eyebrow text-slate-500 mb-3">Quick start · 30 seconds</div>
      <h1 className="font-serif text-4xl tracking-tight mb-3" style={{ color: NAVY }}>
        Get a calorie target now.
      </h1>
      <p className="text-slate-600 text-sm mb-8 leading-relaxed">
        The minimum needed to give you a number. You can fill in medical context, allergies, and coaching style after.{" "}
        <button onClick={onFull} className="underline hover:no-underline" style={{ color: NAVY }}>
          Take the full 10-step survey →
        </button>
      </p>

      <div className="space-y-6">
        <Field label="Age">
          <input
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="e.g. 32"
            min={14}
            max={100}
            className="w-full md:w-48 border border-slate-300 px-3 py-2.5 rounded-sm focus:outline-none focus:border-slate-900"
          />
        </Field>

        <Field label="Sex assigned at birth">
          <div className="flex gap-3 flex-wrap">
            {["female", "male"].map((s) => (
              <ChipBtn key={s} active={sex === s} onClick={() => setSex(s)}>
                {s === "female" ? "Female" : "Male"}
              </ChipBtn>
            ))}
          </div>
        </Field>

        <Field label="Units">
          <div className="flex gap-3">
            {["metric", "imperial"].map((u) => (
              <ChipBtn key={u} active={units === u} onClick={() => setUnits(u)}>
                {u === "metric" ? "Metric (cm, kg)" : "Imperial (ft/in, lb)"}
              </ChipBtn>
            ))}
          </div>
        </Field>

        {units === "metric" ? (
          <>
            <Field label="Height (cm)">
              <input
                type="number"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                placeholder="e.g. 170"
                className="w-full md:w-48 border border-slate-300 px-3 py-2.5 rounded-sm focus:outline-none focus:border-slate-900"
              />
            </Field>
            <Field label="Weight (kg)">
              <input
                type="number"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                placeholder="e.g. 68"
                className="w-full md:w-48 border border-slate-300 px-3 py-2.5 rounded-sm focus:outline-none focus:border-slate-900"
              />
            </Field>
          </>
        ) : (
          <>
            <Field label="Height">
              <div className="flex gap-3">
                <input type="number" value={heightFt} onChange={(e) => setHeightFt(e.target.value)} placeholder="ft" className="w-24 border border-slate-300 px-3 py-2.5 rounded-sm focus:outline-none focus:border-slate-900" />
                <input type="number" value={heightIn} onChange={(e) => setHeightIn(e.target.value)} placeholder="in" className="w-24 border border-slate-300 px-3 py-2.5 rounded-sm focus:outline-none focus:border-slate-900" />
              </div>
            </Field>
            <Field label="Weight (lb)">
              <input
                type="number"
                value={weightLb}
                onChange={(e) => setWeightLb(e.target.value)}
                placeholder="e.g. 150"
                className="w-full md:w-48 border border-slate-300 px-3 py-2.5 rounded-sm focus:outline-none focus:border-slate-900"
              />
            </Field>
          </>
        )}

        <Field label="Activity level">
          <div className="flex gap-2 flex-wrap">
            {ACTIVITY_LEVELS.map((a) => (
              <ChipBtn key={a.id} active={activity === a.id} onClick={() => setActivity(a.id)}>
                {a.label}
              </ChipBtn>
            ))}
          </div>
        </Field>

        <Field label="Goal">
          <div className="flex gap-2 flex-wrap">
            {GOALS.map((g) => (
              <ChipBtn key={g.id} active={goal === g.id} onClick={() => setGoal(g.id)}>
                {g.label}
              </ChipBtn>
            ))}
          </div>
        </Field>
      </div>

      <button
        onClick={go}
        disabled={!ready}
        className="mt-10 w-full md:w-auto px-7 py-3 rounded-sm text-white text-sm tracking-wide flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-30 disabled:cursor-not-allowed"
        style={{ background: NAVY }}
      >
        See my plan <ArrowRight className="w-4 h-4" />
      </button>
    </main>
  );
}

/* ============================================================
   SURVEY
   ============================================================ */

const STEPS = ["About you", "Body metrics", "Activity", "Your goal", "Goal weight & timeline", "Diet & calorie structure", "Health context", "Allergies & meds", "Style & coaching"];

function Survey({ onComplete, initial }) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState(
    initial ?? {
      age: "",
      sex: "",
      heightCm: "",
      weightKg: "",
      units: "metric",
      heightFt: "",
      heightIn: "",
      weightLb: "",
      activity: "",
      goal: "",
      goalWeightKg: "",
      goalWeightLb: "",
      timelineWeeks: 12,
      offDays: 0,
      diet: [],
      experience: "",
      conditions: [],
      medications: [],
      allergies: [],
      personality: "",
      voice: "",
      limitations: "",
      acknowledged: false,
    }
  );

  function update(patch) {
    setData((d) => ({ ...d, ...patch }));
  }

  function normalizedMetrics() {
    let heightCm = parseFloat(data.heightCm);
    let weightKg = parseFloat(data.weightKg);
    if (data.units === "imperial") {
      const ft = parseFloat(data.heightFt) || 0;
      const inch = parseFloat(data.heightIn) || 0;
      heightCm = (ft * 12 + inch) * 2.54;
      weightKg = (parseFloat(data.weightLb) || 0) * 0.453592;
    }
    return { heightCm, weightKg };
  }

  function canAdvance() {
    if (step === 0) return data.age && data.sex && Number(data.age) >= 14 && Number(data.age) <= 100;
    if (step === 1) {
      const { heightCm, weightKg } = normalizedMetrics();
      return heightCm > 100 && heightCm < 250 && weightKg > 30 && weightKg < 300;
    }
    if (step === 2) return !!data.activity;
    if (step === 3) return !!data.goal;
    if (step === 4) {
      // Goal weight & timeline — only required for lose/muscle goals
      if (data.goal === "lose" || data.goal === "muscle") {
        const gw = data.units === "imperial" ? Number(data.goalWeightLb) : Number(data.goalWeightKg);
        return gw > 0 && Number(data.timelineWeeks) >= 4 && Number(data.timelineWeeks) <= 52;
      }
      return true; // skippable for maintain / health
    }
    if (step === 5) return data.diet.length > 0; // diet & calorie structure (offDays defaults to 0)
    if (step === 6) return true;
    if (step === 7) return true;
    if (step === 8) return !!data.personality && !!data.voice && data.acknowledged;
    return false;
  }

  function submit() {
    const { heightCm, weightKg } = normalizedMetrics();
    let goalWeightKg = null;
    if (data.units === "imperial") {
      const lb = parseFloat(data.goalWeightLb);
      if (lb > 0) goalWeightKg = lb * 0.453592;
    } else {
      const kg = parseFloat(data.goalWeightKg);
      if (kg > 0) goalWeightKg = kg;
    }
    const profile = {
      age: Number(data.age),
      sex: data.sex,
      heightCm,
      weightKg,
      units: data.units,
      activity: data.activity,
      goal: data.goal,
      goalWeightKg,
      timelineWeeks: data.timelineWeeks ? Number(data.timelineWeeks) : null,
      offDays: Number(data.offDays ?? 0),
      diet: data.diet,
      experience: data.experience,
      conditions: data.conditions,
      medications: data.medications,
      allergies: data.allergies,
      personality: data.personality,
      voice: data.voice,
      limitations: data.limitations,
    };
    const bmr = calcBMR(profile);
    const tdee = calcTDEE(bmr, profile.activity);
    const target = calcTarget(tdee, profile);
    const structured = calcStructuredTargets(target, tdee, { offDays: profile.offDays });
    const macros = calcMacros(target, profile.weightKg, profile.goal);
    const bmi = calcBMI(profile.weightKg, profile.heightCm);
    onComplete({
      profile,
      results: {
        bmr: Math.round(bmr),
        tdee: Math.round(tdee),
        target,
        activeTarget: structured.activeTarget,
        offTarget: structured.offTarget,
        offDays: structured.offDays,
        macros,
        bmi,
      },
    });
  }

  return (
    <main className="max-w-3xl mx-auto px-6 py-12">
      {/* Progress */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-3 eyebrow text-slate-500">
          <span>Step {step + 1} of {STEPS.length}</span>
          <span>{STEPS[step]}</span>
        </div>
        <div className="h-px bg-slate-200 relative">
          <div
            className="absolute left-0 top-0 h-px transition-all"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%`, background: NAVY }}
          />
        </div>
      </div>

      <h1 className="font-serif text-4xl tracking-tight mb-2" style={{ color: NAVY }}>{STEPS[step]}</h1>
      <p className="text-slate-600 mb-8 text-sm">
        {step === 0 && "We use age and sex in the standard Mifflin–St Jeor equation."}
        {step === 1 && "Height and weight, in your preferred units."}
        {step === 2 && "How active are you across a typical week?"}
        {step === 3 && "Pick the goal that fits where you are right now."}
        {step === 4 && "Where do you want to land, and by when? We'll size the daily calorie shift to fit."}
        {step === 5 && "Religious, cultural, medical, and texture-modified diets — every meal we suggest will respect these. Plus how you want to structure your days."}
        {step === 6 && "These help the model gate certain recommendations. This isn't a diagnosis — bring your clinician in for medical decisions."}
        {step === 7 && "Allergies are hard-blocked from your meal plan. Medications can change calorie targets, hydration, or workout timing."}
        {step === 8 && "How you like to move and how you want LIFT to talk to you. Plus a final acknowledgment."}
      </p>

      {/* Step content */}
      <div className="space-y-6">
        {step === 0 && (
          <>
            <Field label="Age">
              <input
                type="number"
                value={data.age}
                onChange={(e) => update({ age: e.target.value })}
                placeholder="e.g. 32"
                min={14}
                max={100}
                className="w-full md:w-48 border border-slate-300 px-3 py-2.5 rounded-sm focus:outline-none focus:border-slate-900"
              />
            </Field>
            <Field label="Sex assigned at birth">
              <div className="flex gap-3 flex-wrap">
                {["female", "male"].map((s) => (
                  <ChipBtn key={s} active={data.sex === s} onClick={() => update({ sex: s })}>
                    {s === "female" ? "Female" : "Male"}
                  </ChipBtn>
                ))}
              </div>
              <div className="text-xs text-slate-500 mt-2">
                Used because the BMR formula requires it. We recognize this is a simplification.
              </div>
            </Field>
          </>
        )}

        {step === 1 && (
          <>
            <Field label="Units">
              <div className="flex gap-3">
                {["metric", "imperial"].map((u) => (
                  <ChipBtn key={u} active={data.units === u} onClick={() => update({ units: u })}>
                    {u === "metric" ? "Metric (cm, kg)" : "Imperial (ft/in, lb)"}
                  </ChipBtn>
                ))}
              </div>
            </Field>

            {data.units === "metric" ? (
              <>
                <Field label="Height (cm)">
                  <input
                    type="number"
                    value={data.heightCm}
                    onChange={(e) => update({ heightCm: e.target.value })}
                    placeholder="e.g. 170"
                    className="w-full md:w-48 border border-slate-300 px-3 py-2.5 rounded-sm focus:outline-none focus:border-slate-900"
                  />
                </Field>
                <Field label="Weight (kg)">
                  <input
                    type="number"
                    value={data.weightKg}
                    onChange={(e) => update({ weightKg: e.target.value })}
                    placeholder="e.g. 68"
                    className="w-full md:w-48 border border-slate-300 px-3 py-2.5 rounded-sm focus:outline-none focus:border-slate-900"
                  />
                </Field>
              </>
            ) : (
              <>
                <Field label="Height">
                  <div className="flex gap-3">
                    <input
                      type="number"
                      value={data.heightFt}
                      onChange={(e) => update({ heightFt: e.target.value })}
                      placeholder="ft"
                      className="w-24 border border-slate-300 px-3 py-2.5 rounded-sm focus:outline-none focus:border-slate-900"
                    />
                    <input
                      type="number"
                      value={data.heightIn}
                      onChange={(e) => update({ heightIn: e.target.value })}
                      placeholder="in"
                      className="w-24 border border-slate-300 px-3 py-2.5 rounded-sm focus:outline-none focus:border-slate-900"
                    />
                  </div>
                </Field>
                <Field label="Weight (lb)">
                  <input
                    type="number"
                    value={data.weightLb}
                    onChange={(e) => update({ weightLb: e.target.value })}
                    placeholder="e.g. 150"
                    className="w-full md:w-48 border border-slate-300 px-3 py-2.5 rounded-sm focus:outline-none focus:border-slate-900"
                  />
                </Field>
              </>
            )}
          </>
        )}

        {step === 2 && (
          <div className="space-y-2">
            {ACTIVITY_LEVELS.map((a) => (
              <RadioRow
                key={a.id}
                active={data.activity === a.id}
                onClick={() => update({ activity: a.id })}
                title={a.label}
                desc={a.desc}
              />
            ))}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-2">
            {GOALS.map((g) => (
              <RadioRow
                key={g.id}
                active={data.goal === g.id}
                onClick={() => update({ goal: g.id })}
                title={g.label}
                desc={g.desc}
              />
            ))}
          </div>
        )}

        {step === 4 && (
          <>
            {data.goal === "lose" || data.goal === "muscle" ? (
              <>
                <Field label={`Goal weight (${data.units === "imperial" ? "lb" : "kg"})`}>
                  {data.units === "imperial" ? (
                    <input
                      type="number"
                      value={data.goalWeightLb}
                      onChange={(e) => update({ goalWeightLb: e.target.value })}
                      placeholder="e.g. 145"
                      className="w-full md:w-48 border border-slate-300 px-3 py-2.5 rounded-sm focus:outline-none focus:border-slate-900"
                    />
                  ) : (
                    <input
                      type="number"
                      value={data.goalWeightKg}
                      onChange={(e) => update({ goalWeightKg: e.target.value })}
                      placeholder="e.g. 65"
                      className="w-full md:w-48 border border-slate-300 px-3 py-2.5 rounded-sm focus:outline-none focus:border-slate-900"
                    />
                  )}
                  <div className="text-xs text-slate-500 mt-2">
                    Current weight: {data.units === "imperial" ? `${data.weightLb} lb` : `${data.weightKg} kg`}.
                  </div>
                </Field>
                <Field label="When do you want to reach it?">
                  <div className="flex flex-wrap gap-2">
                    {[
                      { wks: 4, label: "1 month" },
                      { wks: 8, label: "2 months" },
                      { wks: 12, label: "3 months" },
                      { wks: 24, label: "6 months" },
                      { wks: 36, label: "9 months" },
                      { wks: 52, label: "1 year" },
                    ].map((t) => (
                      <ChipBtn
                        key={t.wks}
                        active={Number(data.timelineWeeks) === t.wks}
                        onClick={() => update({ timelineWeeks: t.wks })}
                      >
                        {t.label}
                      </ChipBtn>
                    ))}
                  </div>
                  <PreviewDeficit data={data} />
                </Field>
              </>
            ) : (
              <div className="text-sm text-slate-600 bg-slate-50 border border-slate-200 p-5 rounded-sm">
                You picked <strong style={{ color: NAVY }}>{GOALS.find((g) => g.id === data.goal)?.label}</strong>{" "}
                — no goal weight or timeline needed. Tap continue.
              </div>
            )}
          </>
        )}

        {step === 5 && (
          <>
            <Field label="Dietary preferences (pick all that apply)">
              <div className="flex flex-wrap gap-2">
                {DIET_PREFS.map((d) => (
                  <ChipBtn
                    key={d}
                    active={data.diet.includes(d)}
                    onClick={() =>
                      update({
                        diet: data.diet.includes(d)
                          ? data.diet.filter((x) => x !== d)
                          : [...data.diet, d],
                      })
                    }
                  >
                    {d}
                  </ChipBtn>
                ))}
              </div>
            </Field>
            <Field label="How many days per week do you want at maintenance (no deficit)?">
              <div className="flex flex-wrap gap-2">
                {[
                  { n: 0, label: "None — same target every day" },
                  { n: 1, label: "1 day off" },
                  { n: 2, label: "2 days off" },
                  { n: 3, label: "3 days off" },
                ].map((o) => (
                  <ChipBtn
                    key={o.n}
                    active={Number(data.offDays) === o.n}
                    onClick={() => update({ offDays: o.n })}
                  >
                    {o.label}
                  </ChipBtn>
                ))}
              </div>
              <div className="text-xs text-slate-500 mt-3 leading-relaxed">
                Off days are at maintenance — useful for weekends, social meals, or harder training days.
                The deficit (or surplus) on the remaining days gets larger to keep your weekly average on track.
              </div>
              <StructurePreview data={data} />
            </Field>
          </>
        )}

        {step === 6 && (
          <>
            <Field label="Anything we should plan around? (optional)">
              <div className="flex flex-wrap gap-2">
                {CONDITIONS.map((c) => (
                  <ChipBtn
                    key={c}
                    active={data.conditions.includes(c)}
                    onClick={() =>
                      update({
                        conditions: data.conditions.includes(c)
                          ? data.conditions.filter((x) => x !== c)
                          : [...data.conditions, c],
                      })
                    }
                  >
                    {c}
                  </ChipBtn>
                ))}
              </div>
            </Field>
            <Field label="Anything else we should know? (optional)">
              <textarea
                value={data.limitations}
                onChange={(e) => update({ limitations: e.target.value })}
                placeholder="e.g. recent surgery, knee injury, pregnant, eating disorder history…"
                rows={3}
                className="w-full border border-slate-300 px-3 py-2.5 rounded-sm focus:outline-none focus:border-slate-900 text-sm"
              />
            </Field>
          </>
        )}

        {step === 7 && (
          <>
            <Field label="Allergies — these are hard-blocked (optional)">
              <div className="flex flex-wrap gap-2">
                {ALLERGENS.map((a) => (
                  <ChipBtn
                    key={a}
                    active={data.allergies.includes(a)}
                    onClick={() =>
                      update({
                        allergies: data.allergies.includes(a)
                          ? data.allergies.filter((x) => x !== a)
                          : [...data.allergies, a],
                      })
                    }
                  >
                    {a}
                  </ChipBtn>
                ))}
              </div>
            </Field>
            <Field label="Medications you take regularly (optional)">
              <div className="flex flex-wrap gap-2">
                {MEDICATIONS.map((m) => (
                  <ChipBtn
                    key={m}
                    active={data.medications.includes(m)}
                    onClick={() =>
                      update({
                        medications: data.medications.includes(m)
                          ? data.medications.filter((x) => x !== m)
                          : [...data.medications, m],
                      })
                    }
                  >
                    {m}
                  </ChipBtn>
                ))}
              </div>
            </Field>
          </>
        )}

        {step === 8 && (
          <>
            <Field label="How do you like to move?">
              <div className="space-y-2">
                {PERSONALITIES.map((p) => (
                  <RadioRow
                    key={p.id}
                    active={data.personality === p.id}
                    onClick={() => update({ personality: p.id })}
                    title={p.label}
                    desc={p.desc}
                  />
                ))}
              </div>
            </Field>
            <Field label="How should LIFT talk to you?">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {VOICES.map((v) => (
                  <RadioRow
                    key={v.id}
                    active={data.voice === v.id}
                    onClick={() => update({ voice: v.id })}
                    title={v.label}
                    desc={v.desc}
                  />
                ))}
              </div>
            </Field>
            <label className="flex gap-3 items-start cursor-pointer pt-2">
              <input
                type="checkbox"
                checked={data.acknowledged}
                onChange={(e) => update({ acknowledged: e.target.checked })}
                className="mt-1 w-4 h-4 accent-slate-900"
              />
              <span className="text-sm text-slate-600 leading-relaxed">
                I understand LIFT provides general guidance based on standard formulas, not medical advice, and that
                I should consult a clinician before making significant changes — especially if I have a medical
                condition or history of disordered eating.
              </span>
            </label>
          </>
        )}
      </div>

      {/* Nav */}
      <div className="flex items-center justify-between mt-12 pt-6 border-t border-slate-200">
        <button
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="text-sm text-slate-600 hover:text-slate-900 flex items-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        {step < STEPS.length - 1 ? (
          <button
            onClick={() => setStep((s) => s + 1)}
            disabled={!canAdvance()}
            className="px-6 py-2.5 rounded-sm text-white text-sm tracking-wide flex items-center gap-2 hover:opacity-90 transition disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ background: NAVY }}
          >
            Continue <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={submit}
            disabled={!canAdvance()}
            className="px-6 py-2.5 rounded-sm text-white text-sm tracking-wide flex items-center gap-2 hover:opacity-90 transition disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ background: NAVY }}
          >
            See my plan <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </main>
  );
}

function PreviewDeficit({ data }) {
  // Show the user the implied daily deficit/surplus and a safety note
  const isImperial = data.units === "imperial";
  const currentKg = isImperial ? parseFloat(data.weightLb) * 0.453592 : parseFloat(data.weightKg);
  const goalKg = isImperial ? parseFloat(data.goalWeightLb) * 0.453592 : parseFloat(data.goalWeightKg);
  const weeks = Number(data.timelineWeeks);
  if (!currentKg || !goalKg || !weeks) return null;
  const deltaKg = goalKg - currentKg;
  if (Math.abs(deltaKg) < 0.1) {
    return (
      <div className="mt-4 text-xs text-slate-600 bg-slate-50 border border-slate-200 p-3 rounded-sm">
        Goal weight matches current weight — try the maintain goal instead.
      </div>
    );
  }
  const totalKcal = deltaKg * 7700;
  const perDay = totalKcal / (weeks * 7);
  const direction = perDay < 0 ? "deficit" : "surplus";
  const perWeekKg = deltaKg / weeks;
  const tooFast = Math.abs(perWeekKg) > 1; // >1 kg/wk is generally aggressive
  const capped = Math.abs(perDay) > (perDay < 0 ? 1000 : 500);
  const directionMatches =
    (data.goal === "lose" && perDay < 0) || (data.goal === "muscle" && perDay > 0);

  return (
    <div className="mt-4 text-xs leading-relaxed bg-slate-50 border border-slate-200 p-3 rounded-sm">
      {!directionMatches ? (
        <span className="text-red-700">
          Your goal weight goes the opposite direction from "{GOALS.find((g) => g.id === data.goal)?.label}".
          Pick a different goal or adjust the goal weight.
        </span>
      ) : (
        <>
          <span style={{ color: NAVY }}>
            That's about <strong>{Math.abs(perDay).toFixed(0)} kcal/day {direction}</strong>
            {" "}({Math.abs(perWeekKg).toFixed(2)} kg/week).
          </span>
          {(tooFast || capped) && (
            <div className="mt-1 text-amber-700">
              That pace is on the aggressive side — we'll cap the daily change at safe limits
              ({direction === "deficit" ? "1,000" : "500"} kcal/day) and the timeline may end up longer in practice.
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StructurePreview({ data }) {
  const offDays = Number(data.offDays ?? 0);
  if (offDays === 0) {
    return (
      <div className="mt-4 text-xs text-slate-600 bg-slate-50 border border-slate-200 p-3 rounded-sm">
        Same calorie target every day. Simplest to follow.
      </div>
    );
  }
  return (
    <div className="mt-4 text-xs leading-relaxed bg-slate-50 border border-slate-200 p-3 rounded-sm" style={{ color: NAVY }}>
      <strong>{7 - offDays} active days</strong> at a personalized target, plus{" "}
      <strong>{offDays} day{offDays === 1 ? "" : "s"}</strong> at maintenance per week. We'll show both numbers
      on your results page.
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <div className="micro text-slate-500 mb-2">{label}</div>
      {children}
    </div>
  );
}

function ChipBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm rounded-sm border transition ${
        active
          ? "text-white border-slate-900"
          : "border-slate-300 text-slate-700 hover:border-slate-900"
      }`}
      style={active ? { background: NAVY, borderColor: NAVY } : {}}
    >
      {children}
    </button>
  );
}

function RadioRow({ active, onClick, title, desc }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left border p-4 rounded-sm transition flex items-start gap-4 ${
        active ? "border-slate-900 bg-slate-50" : "border-slate-200 hover:border-slate-400"
      }`}
    >
      <div
        className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
          active ? "border-slate-900" : "border-slate-300"
        }`}
      >
        {active && <div className="w-2 h-2 rounded-full" style={{ background: NAVY }} />}
      </div>
      <div className="flex-1">
        <div className="font-medium" style={{ color: NAVY }}>{title}</div>
        <div className="text-sm text-slate-500">{desc}</div>
      </div>
    </button>
  );
}

/* ============================================================
   RESULTS
   ============================================================ */

function Results({ profile, results, go, dailyKcal }) {
  const goalLabel = GOALS.find((g) => g.id === profile.goal)?.label;
  const activityLabel = ACTIVITY_LEVELS.find((a) => a.id === profile.activity)?.label;
  const expLabel = EXPERIENCE.find((e) => e.id === profile.experience)?.label;

  // Exercise direction based on goal + experience
  const exercisePlan = buildExercisePlan(profile);
  const habits = buildHabits(profile);
  const dietArr = Array.isArray(profile.diet) ? profile.diet : [profile.diet].filter(Boolean);
  const recommendedPlanId =
    profile.goal === "muscle"
      ? "protein"
      : dietArr.includes("Vegetarian") || dietArr.includes("Vegan")
      ? "plant"
      : dietArr.includes("Lower-carb")
      ? "lowcarb"
      : dietArr.includes("Mediterranean")
      ? "med"
      : "balanced";
  const recPlan = MEAL_PLANS.find((p) => p.id === recommendedPlanId);

  const remaining = Math.max(0, results.target - dailyKcal);
  const pctUsed = Math.min(100, (dailyKcal / results.target) * 100);

  return (
    <main className="max-w-5xl mx-auto px-6 py-12">
      <div className="eyebrow mb-3" style={{ color: NAVY_SOFT }}>Your plan</div>
      <h1 className="font-serif text-4xl md:text-6xl tracking-tight mb-3" style={{ color: NAVY_DEEP, letterSpacing: "-0.025em", lineHeight: 1.0 }}>
        Here's where <span className="font-serif-italic" style={{ color: ACCENT }}>to start</span>.
      </h1>
      <p className="mb-5 max-w-2xl" style={{ color: NAVY_SOFT }}>
        Based on your inputs, with the standard Mifflin–St Jeor equation and population-level macro guidance.
        Adjust over time as you see how your body responds.
      </p>
      <div className="flex flex-wrap gap-2 mb-10">
        <span
          className="text-xs px-2.5 py-1 rounded-full border flex items-center gap-1.5"
          style={{ borderColor: "#CBD5E1", color: NAVY_DEEP, background: "#fff" }}
        >
          <ShieldCheck className="w-3 h-3" /> Mifflin–St Jeor methodology
        </span>
        <span
          className="text-xs px-2.5 py-1 rounded-full border flex items-center gap-1.5"
          style={{ borderColor: "#CBD5E1", color: NAVY_DEEP, background: "#fff" }}
        >
          <ShieldCheck className="w-3 h-3" /> Created with clinical guidance
        </span>
        <span
          className="text-xs px-2.5 py-1 rounded-full border flex items-center gap-1.5"
          style={{ borderColor: "#CBD5E1", color: NAVY_DEEP, background: "#fff" }}
        >
          Not medical advice
        </span>
      </div>

      {/* Top number panel */}
      <div className="grid md:grid-cols-3 gap-px bg-slate-200 border border-slate-200">
        <Stat
          label={results.offDays > 0 ? "Weekly average target" : "Daily calorie target"}
          value={results.target.toLocaleString()}
          suffix="kcal"
          big
        />
        <Stat label="BMR" value={results.bmr.toLocaleString()} suffix="kcal" />
        <Stat label="Maintenance (TDEE)" value={results.tdee.toLocaleString()} suffix="kcal" />
      </div>

      {/* Structured targets (only if user picked off days) */}
      {results.offDays > 0 && (
        <div className="grid md:grid-cols-2 gap-px bg-slate-200 border border-slate-200 border-t-0 mb-12">
          <Stat
            label={`Active days (${7 - results.offDays}/wk)`}
            value={results.activeTarget.toLocaleString()}
            suffix="kcal"
          />
          <Stat
            label={`Off days (${results.offDays}/wk · maintenance)`}
            value={results.offTarget.toLocaleString()}
            suffix="kcal"
          />
        </div>
      )}
      {results.offDays === 0 && <div className="mb-12" />}

      {/* Goal weight summary */}
      {profile.goalWeightKg && profile.timelineWeeks && (
        <div className="mb-12 border-l-2 p-5 bg-slate-50" style={{ borderColor: NAVY }}>
          <div className="eyebrow text-slate-500 mb-2">Goal</div>
          <div className="text-sm leading-relaxed" style={{ color: NAVY }}>
            Reach{" "}
            <strong>
              {profile.weightKg && profile.units === "imperial"
                ? `${Math.round(profile.goalWeightKg / 0.453592)} lb`
                : `${profile.goalWeightKg.toFixed(1)} kg`}
            </strong>{" "}
            in <strong>{profile.timelineWeeks} weeks</strong> ({Math.round(profile.timelineWeeks / 4.33)} mo).
          </div>
        </div>
      )}

      {/* Macros */}
      <Section eyebrow="Macronutrients" title="Daily macro split">
        <div className="grid md:grid-cols-3 gap-6 mb-3">
          <MacroCard label="Protein" g={results.macros.proteinG} kcalPerG={4} accent />
          <MacroCard label="Carbohydrates" g={results.macros.carbG} kcalPerG={4} />
          <MacroCard label="Fat" g={results.macros.fatG} kcalPerG={9} />
        </div>
        <p className="text-xs text-slate-500 max-w-2xl">
          Protein is set per kg of body weight; fat is roughly 28% of total kcal; carbs make up the remainder.
          Hit protein consistently, then let carbs and fat flex day to day.
        </p>
      </Section>

      {/* Today's progress (links logger and results) */}
      <div className="mt-14 border border-slate-200 p-6 md:p-8">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div>
            <div className="eyebrow text-slate-500 mb-2">Today's intake</div>
            <div className="font-serif text-3xl tracking-tight" style={{ color: NAVY }}>
              {dailyKcal.toLocaleString()} <span className="text-slate-400 text-2xl">/ {results.target.toLocaleString()} kcal</span>
            </div>
            <div className="text-sm text-slate-600 mt-1">{remaining.toLocaleString()} kcal remaining</div>
          </div>
          <button
            onClick={() => go("logger")}
            className="text-sm border border-slate-300 px-4 py-2 rounded-sm hover:border-slate-900 transition flex items-center gap-1.5"
            style={{ color: NAVY }}
          >
            <Plus className="w-4 h-4" /> Log a meal
          </button>
        </div>
        <div className="h-1.5 bg-slate-100 mt-5 relative overflow-hidden">
          <div className="absolute left-0 top-0 h-full transition-all" style={{ width: `${pctUsed}%`, background: NAVY }} />
        </div>
      </div>

      {/* BMI strip */}
      <div className="mt-10 grid md:grid-cols-2 gap-6">
        <div className="border border-slate-200 p-6">
          <div className="eyebrow text-slate-500 mb-2">BMI</div>
          <div className="font-serif text-3xl" style={{ color: NAVY }}>{results.bmi.toFixed(1)}</div>
          <div className="text-sm text-slate-600 mt-1">{bmiBand(results.bmi)}</div>
          <div className="text-xs text-slate-500 mt-3 leading-relaxed">
            BMI is a rough screening tool, not a diagnosis. It doesn't distinguish muscle from fat and isn't ideal
            for athletes, the elderly, or many ethnic groups.
          </div>
        </div>
        <div className="border border-slate-200 p-6">
          <div className="eyebrow text-slate-500 mb-2">Profile summary</div>
          <ul className="text-sm space-y-1.5" style={{ color: NAVY }}>
            <li>{profile.age} y · {profile.sex === "male" ? "M" : "F"} · {Math.round(profile.heightCm)} cm · {Math.round(profile.weightKg)} kg</li>
            <li>Goal: <span className="text-slate-600">{goalLabel}</span></li>
            <li>Activity: <span className="text-slate-600">{activityLabel}</span></li>
            {expLabel && <li>Experience: <span className="text-slate-600">{expLabel}</span></li>}
            <li>Diet: <span className="text-slate-600">{dietArr.length ? dietArr.join(", ") : "No restrictions"}</span></li>
          </ul>
        </div>
      </div>

      {/* Plan accounts for — surfaces the personalization the model is using */}
      {(profile.conditions?.length > 0 || profile.allergies?.length > 0 || profile.personality) && (
        <div className="mt-8 border-l-2 p-5" style={{ borderColor: "#3F7050", background: "#EEF4EE" }}>
          <div className="eyebrow mb-2" style={{ color: "#3F7050" }}>Plan accounts for</div>
          <div className="text-sm leading-relaxed" style={{ color: "#234034" }}>
            {[
              ...(profile.conditions ?? []),
              ...(profile.allergies ?? []).filter((a) => a !== "None").map((a) => `${a} (avoided)`),
              profile.personality && PERSONALITIES.find((p) => p.id === profile.personality)?.label,
            ]
              .filter(Boolean)
              .join(" · ")}
          </div>
        </div>
      )}

      {/* Daily tip */}
      <div className="mt-6 bg-white border border-slate-200 p-5 flex items-start gap-3">
        <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center" style={{ background: NAVY }}>
          <Zap className="w-4 h-4 text-white" />
        </div>
        <div>
          <div className="micro text-slate-500 mb-1">Today's tip</div>
          <div className="text-sm leading-relaxed" style={{ color: NAVY }}>{pickTip(profile).text}</div>
        </div>
      </div>

      {/* Ask LIFT prompt */}
      <button
        onClick={() => go("ask")}
        className="mt-3 w-full bg-white border border-slate-200 p-5 flex items-center justify-between hover:border-slate-400 transition text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center" style={{ background: NAVY }}>
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="micro text-slate-500 mb-0.5">Ask LIFT</div>
            <div className="text-sm" style={{ color: NAVY }}>"What should I eat next?"</div>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-400" />
      </button>

      {/* Limitations callout */}
      {profile.limitations?.trim() && (
        <div className="mt-8 border-l-2 p-5 bg-slate-50" style={{ borderColor: NAVY }}>
          <div className="eyebrow text-slate-500 mb-2">You noted</div>
          <div className="text-sm leading-relaxed" style={{ color: NAVY }}>{profile.limitations}</div>
          <div className="text-xs text-slate-600 mt-3">
            Run any plan past your clinician before starting. Conditions like diabetes, swallowing precautions,
            cardiovascular disease, eating disorders, and pregnancy all require tailored guidance.
          </div>
        </div>
      )}

      {/* Recommended meal plan */}
      <div className="mt-14">
        <Section eyebrow="Suggested meal plan" title={recPlan.name}>
          <p className="text-slate-600 mb-6 max-w-2xl">{recPlan.blurb}</p>
          <div className="grid md:grid-cols-2 gap-px bg-slate-200 border border-slate-200">
            {recPlan.sample.map((m, i) => (
              <div key={i} className="bg-white p-5 flex justify-between gap-4">
                <div>
                  <div className="micro text-slate-500 mb-1">{m.meal}</div>
                  <div className="text-sm" style={{ color: NAVY }}>{m.food}</div>
                </div>
                <div className="text-sm font-medium whitespace-nowrap" style={{ color: NAVY }}>{m.kcal} kcal</div>
              </div>
            ))}
          </div>
          <button
            onClick={() => go("meals")}
            className="mt-5 text-sm flex items-center gap-1.5 hover:underline"
            style={{ color: NAVY }}
          >
            Browse all meal plans <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </Section>
      </div>

      {/* Exercise direction */}
      <div className="mt-14">
        <Section eyebrow="Exercise direction" title={exercisePlan.title}>
          <p className="text-slate-600 mb-6 max-w-2xl">{exercisePlan.intro}</p>
          <ul className="space-y-3">
            {exercisePlan.weekly.map((w, i) => (
              <li key={i} className="flex gap-4 items-start">
                <span className="font-serif text-lg w-10 flex-shrink-0" style={{ color: NAVY }}>{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <div className="font-medium" style={{ color: NAVY }}>{w.day}</div>
                  <div className="text-sm text-slate-600">{w.workout}</div>
                </div>
              </li>
            ))}
          </ul>
        </Section>
      </div>

      {/* Habits */}
      <div className="mt-14">
        <Section eyebrow="Habit suggestions" title="Small things that compound">
          <ul className="grid md:grid-cols-2 gap-3">
            {habits.map((h, i) => (
              <li key={i} className="flex items-start gap-3 text-sm border border-slate-200 p-4">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: NAVY }} />
                <span className="text-slate-700">{h}</span>
              </li>
            ))}
          </ul>
        </Section>
      </div>

      {/* Retake */}
      <div className="mt-14 pt-8 border-t border-slate-200 flex flex-wrap gap-3">
        <button
          onClick={() => go("survey")}
          className="text-sm border border-slate-300 px-4 py-2 rounded-sm hover:border-slate-900 transition"
          style={{ color: NAVY }}
        >
          Retake survey
        </button>
        <button
          onClick={() => go("logger")}
          className="text-sm border border-slate-300 px-4 py-2 rounded-sm hover:border-slate-900 transition"
          style={{ color: NAVY }}
        >
          Open meal logger
        </button>
      </div>
    </main>
  );
}

function Stat({ label, value, suffix, big }) {
  return (
    <div className="bg-white p-7">
      <div className="eyebrow mb-3" style={{ color: NAVY_SOFT }}>{label}</div>
      <div
        className="font-serif tracking-tight lift-rise"
        style={{
          color: NAVY_DEEP,
          fontSize: big ? "5rem" : "2.5rem",
          letterSpacing: "-0.03em",
          lineHeight: 1,
        }}
      >
        {value}
        <span className="font-mono text-sm ml-2" style={{ color: NAVY_SOFT }}>{suffix}</span>
      </div>
    </div>
  );
}

function MacroCard({ label, g, kcalPerG, accent }) {
  return (
    <div
      className="border p-6 rounded-sm"
      style={accent
        ? { borderColor: NAVY_DEEP, background: NAVY_DEEP }
        : { borderColor: "#E5E7EB" }}
    >
      <div className="eyebrow mb-3" style={{ color: accent ? "rgba(255,255,255,0.6)" : NAVY_SOFT }}>
        {label}
      </div>
      <div
        className="font-serif tracking-tight"
        style={{ color: accent ? "#fff" : NAVY_DEEP, fontSize: "3rem", letterSpacing: "-0.025em", lineHeight: 1 }}
      >
        {g}
        <span className="font-mono text-sm ml-2" style={{ color: accent ? "rgba(255,255,255,0.6)" : NAVY_SOFT }}>g</span>
      </div>
      <div className="text-xs mt-3 font-mono" style={{ color: accent ? ACCENT : NAVY_SOFT }}>
        ≈ {(g * kcalPerG).toLocaleString()} kcal
      </div>
    </div>
  );
}

function buildExercisePlan(profile) {
  const isNew = profile.experience === "new";
  const isAdv = profile.experience === "advanced";
  if (profile.goal === "muscle") {
    return {
      title: "Resistance-led, 4 sessions / week",
      intro: "Train each muscle group ~twice weekly with progressive overload. Add 1–2 short cardio days for heart health.",
      weekly: [
        { day: "Mon", workout: "Upper body strength · 45–60 min" },
        { day: "Tue", workout: "Lower body strength · 45–60 min" },
        { day: "Wed", workout: "Easy cardio (walk/cycle) · 30 min" },
        { day: "Thu", workout: "Upper body strength · 45–60 min" },
        { day: "Fri", workout: "Lower body strength · 45–60 min" },
        { day: "Sat", workout: "Mobility or active recovery" },
        { day: "Sun", workout: "Rest" },
      ],
    };
  }
  if (profile.goal === "lose") {
    return {
      title: "Mostly cardio, with strength to preserve muscle",
      intro: isNew
        ? "Start with steady walking and 2 short strength sessions. Build from there."
        : "Mix moderate cardio with 2–3 strength sessions to keep muscle while you cut.",
      weekly: [
        { day: "Mon", workout: isNew ? "Brisk walk · 30 min" : "Cardio (run/cycle) · 35–45 min" },
        { day: "Tue", workout: "Full-body strength · 30–45 min" },
        { day: "Wed", workout: "Walk · 30 min" },
        { day: "Thu", workout: "Cardio · 35–45 min" },
        { day: "Fri", workout: "Full-body strength · 30–45 min" },
        { day: "Sat", workout: isAdv ? "Long cardio · 60 min" : "Walk + mobility" },
        { day: "Sun", workout: "Rest" },
      ],
    };
  }
  // maintain or health
  return {
    title: "Balanced — strength and cardio",
    intro: "Aim for ~150 min of moderate cardio per week plus 2 strength sessions, per general public-health guidance.",
    weekly: [
      { day: "Mon", workout: "Full-body strength · 30–45 min" },
      { day: "Tue", workout: "Cardio · 30 min" },
      { day: "Wed", workout: "Walk or yoga · 30 min" },
      { day: "Thu", workout: "Full-body strength · 30–45 min" },
      { day: "Fri", workout: "Cardio · 30 min" },
      { day: "Sat", workout: "Activity you enjoy (hike, sport, swim)" },
      { day: "Sun", workout: "Rest" },
    ],
  };
}

function buildHabits(profile) {
  const base = [
    "Drink water before meals — easy way to manage appetite.",
    "Get protein at every meal so it's spread across the day.",
    "Sleep 7–9 hours; under-sleep blunts both fat loss and muscle gain.",
    "Walk after meals when you can — even 10 minutes helps with glucose.",
    "Plan one rest day a week. Recovery is part of the plan, not a break from it.",
  ];
  if (profile.goal === "lose") base.push("Weigh yourself once a week, same time of day, not daily.");
  if (profile.goal === "muscle") base.push("Don't fear the scale moving up — some of it is muscle.");
  return base;
}

/* ============================================================
   BMI CALCULATOR
   ============================================================ */

function BMICalculator() {
  const [units, setUnits] = useState("metric");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [heightFt, setHeightFt] = useState("");
  const [heightIn, setHeightIn] = useState("");
  const [weightLb, setWeightLb] = useState("");

  let bmi = null;
  if (units === "metric" && heightCm && weightKg) {
    bmi = calcBMI(parseFloat(weightKg), parseFloat(heightCm));
  } else if (units === "imperial" && (heightFt || heightIn) && weightLb) {
    const cm = ((parseFloat(heightFt) || 0) * 12 + (parseFloat(heightIn) || 0)) * 2.54;
    const kg = (parseFloat(weightLb) || 0) * 0.453592;
    if (cm > 0 && kg > 0) bmi = calcBMI(kg, cm);
  }

  return (
    <main className="max-w-2xl mx-auto px-6 py-12">
      <div className="eyebrow text-slate-500 mb-3">Tool</div>
      <h1 className="font-serif text-4xl tracking-tight mb-2" style={{ color: NAVY }}>BMI calculator</h1>
      <p className="text-slate-600 mb-8 text-sm max-w-md">
        A general screening number. It doesn't tell the whole story — muscle mass, age, and body composition matter.
      </p>

      <div className="space-y-6">
        <Field label="Units">
          <div className="flex gap-3">
            {["metric", "imperial"].map((u) => (
              <ChipBtn key={u} active={units === u} onClick={() => setUnits(u)}>
                {u === "metric" ? "Metric" : "Imperial"}
              </ChipBtn>
            ))}
          </div>
        </Field>

        {units === "metric" ? (
          <div className="grid grid-cols-2 gap-4">
            <Field label="Height (cm)">
              <input
                type="number"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                placeholder="e.g. 170"
                className="w-full border border-slate-300 px-3 py-2.5 rounded-sm focus:outline-none focus:border-slate-900"
              />
            </Field>
            <Field label="Weight (kg)">
              <input
                type="number"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                placeholder="e.g. 68"
                className="w-full border border-slate-300 px-3 py-2.5 rounded-sm focus:outline-none focus:border-slate-900"
              />
            </Field>
          </div>
        ) : (
          <>
            <Field label="Height">
              <div className="flex gap-3">
                <input
                  type="number"
                  value={heightFt}
                  onChange={(e) => setHeightFt(e.target.value)}
                  placeholder="ft"
                  className="w-24 border border-slate-300 px-3 py-2.5 rounded-sm focus:outline-none focus:border-slate-900"
                />
                <input
                  type="number"
                  value={heightIn}
                  onChange={(e) => setHeightIn(e.target.value)}
                  placeholder="in"
                  className="w-24 border border-slate-300 px-3 py-2.5 rounded-sm focus:outline-none focus:border-slate-900"
                />
              </div>
            </Field>
            <Field label="Weight (lb)">
              <input
                type="number"
                value={weightLb}
                onChange={(e) => setWeightLb(e.target.value)}
                placeholder="e.g. 150"
                className="w-full md:w-48 border border-slate-300 px-3 py-2.5 rounded-sm focus:outline-none focus:border-slate-900"
              />
            </Field>
          </>
        )}
      </div>

      {bmi && (
        <div className="mt-10 border border-slate-200 p-7">
          <div className="eyebrow text-slate-500 mb-3">Your BMI</div>
          <div className="font-serif text-6xl tracking-tight" style={{ color: NAVY }}>{bmi.toFixed(1)}</div>
          <div className="text-sm text-slate-600 mt-2">{bmiBand(bmi)}</div>
          <div className="mt-6">
            <BmiBar bmi={bmi} />
          </div>
          <p className="text-xs text-slate-500 mt-5 leading-relaxed">
            Reference ranges (WHO): &lt;18.5 underweight · 18.5–24.9 normal · 25–29.9 overweight · ≥30 obese.
            BMI doesn't account for muscle mass and isn't equally appropriate across all populations.
          </p>
        </div>
      )}
    </main>
  );
}

function BmiBar({ bmi }) {
  // Map BMI 14–40 to 0–100%
  const pos = Math.max(0, Math.min(100, ((bmi - 14) / 26) * 100));
  return (
    <div>
      <div className="relative h-2 flex">
        <div className="bg-slate-300" style={{ width: "17.3%" }} />
        <div className="bg-slate-500" style={{ width: "24.6%" }} />
        <div className="bg-slate-700" style={{ width: "19.2%" }} />
        <div style={{ width: "38.9%", background: NAVY }} />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 rounded-full shadow"
          style={{ left: `calc(${pos}% - 6px)`, borderColor: NAVY }}
        />
      </div>
      <div className="flex justify-between micro text-slate-500 mt-2">
        <span>Under</span>
        <span>Normal</span>
        <span>Over</span>
        <span>Obese</span>
      </div>
    </div>
  );
}

/* ============================================================
   MEAL PLANS
   ============================================================ */

/* ============================================================
   CALCULATORS HUB — three tools in one page
   ============================================================ */

const WORKOUT_LIBRARY = {
  "shoulder-arm": {
    label: "Shoulder & arm",
    intro: "30–40 minutes. Aim for ~48 hours rest before training the same muscle group again.",
    sourceLabel: "Routines per ACE / NSCA general guidance",
    sourceUrl: "https://www.acefitness.org/resources/everyone/exercise-library/",
    exercises: [
      { name: "Overhead press (DB or barbell)", sets: 4, reps: "6–8", rest: "90s" },
      { name: "Lateral raises", sets: 3, reps: "10–12", rest: "60s" },
      { name: "Bicep curls", sets: 3, reps: "8–10", rest: "60s" },
      { name: "Tricep dips (bench or parallel bars)", sets: 3, reps: "8–10", rest: "60s" },
      { name: "Face pulls (band or cable)", sets: 3, reps: "12–15", rest: "60s" },
      { name: "Hammer curls", sets: 3, reps: "10", rest: "45s" },
    ],
  },
  "leg": {
    label: "Leg",
    intro: "45–60 minutes. Heavy lower-body sessions need a full day's recovery.",
    sourceLabel: "Routines per ACE / NSCA general guidance",
    sourceUrl: "https://www.acefitness.org/resources/everyone/exercise-library/",
    exercises: [
      { name: "Back squat (or goblet squat)", sets: 4, reps: "5–8", rest: "2 min" },
      { name: "Romanian deadlift", sets: 3, reps: "8–10", rest: "90s" },
      { name: "Walking lunges", sets: 3, reps: "10/leg", rest: "60s" },
      { name: "Leg press or step-ups", sets: 3, reps: "10–12", rest: "90s" },
      { name: "Calf raises", sets: 4, reps: "12–15", rest: "45s" },
      { name: "Glute bridge / hip thrust", sets: 3, reps: "10", rest: "60s" },
    ],
  },
  "chest-back": {
    label: "Chest & back",
    intro: "40–50 minutes. Classic push/pull pairing — keeps the workout balanced.",
    sourceLabel: "Routines per ACE / NSCA general guidance",
    sourceUrl: "https://www.acefitness.org/resources/everyone/exercise-library/",
    exercises: [
      { name: "Bench press (DB or barbell)", sets: 4, reps: "6–8", rest: "90s" },
      { name: "Bent-over row (DB or barbell)", sets: 4, reps: "6–8", rest: "90s" },
      { name: "Incline DB press", sets: 3, reps: "8–10", rest: "60s" },
      { name: "Lat pulldown or pull-ups", sets: 3, reps: "8–10", rest: "60s" },
      { name: "Cable fly or push-ups", sets: 3, reps: "10–12", rest: "45s" },
      { name: "Seated cable row", sets: 3, reps: "10–12", rest: "60s" },
    ],
  },
  "core": {
    label: "Core",
    intro: "20–25 minutes. Can be added to the end of any other session.",
    sourceLabel: "Routines per ACE / NSCA general guidance",
    sourceUrl: "https://www.acefitness.org/resources/everyone/exercise-library/",
    exercises: [
      { name: "Plank", sets: 3, reps: "30–60s hold", rest: "30s" },
      { name: "Dead bug", sets: 3, reps: "10/side", rest: "30s" },
      { name: "Bird dog", sets: 3, reps: "10/side", rest: "30s" },
      { name: "Russian twist (with weight)", sets: 3, reps: "20 total", rest: "30s" },
      { name: "Hanging knee raises (or lying leg raises)", sets: 3, reps: "10", rest: "45s" },
      { name: "Side plank", sets: 2, reps: "30s/side", rest: "30s" },
    ],
  },
  "light-cardio": {
    label: "Light cardio",
    intro: "30–45 minutes. Conversational pace — you should be able to talk in full sentences.",
    sourceLabel: "Per CDC physical activity guidelines",
    sourceUrl: "https://www.cdc.gov/physical-activity-basics/guidelines/adults.html",
    exercises: [
      { name: "Brisk walking (outdoor or treadmill)", sets: 1, reps: "30–45 min", rest: "—" },
      { name: "Easy cycling (stationary or outdoor)", sets: 1, reps: "30–45 min", rest: "—" },
      { name: "Swimming, easy laps", sets: 1, reps: "20–30 min", rest: "—" },
      { name: "Elliptical, low resistance", sets: 1, reps: "25–35 min", rest: "—" },
      { name: "Recreational hiking", sets: 1, reps: "45–60 min", rest: "—" },
    ],
  },
  "hiit": {
    label: "HIIT (high intensity)",
    intro: "20–25 minutes including warm-up. Limit to 2x/week — recovery matters more than you'd think.",
    sourceLabel: "Per ACSM guidance on HIIT for healthy adults",
    sourceUrl: "https://www.acsm.org/education-resources/trending-topics-resources/physical-activity-guidelines",
    exercises: [
      { name: "Warm-up (light jog or jump rope)", sets: 1, reps: "5 min", rest: "—" },
      { name: "Sprint or burpees, all-out", sets: 8, reps: "30s on", rest: "60s walk" },
      { name: "Cool-down walk", sets: 1, reps: "5 min", rest: "—" },
    ],
  },
  "full-body": {
    label: "Full-body (beginner)",
    intro: "30–40 minutes. Good 3x/week starting point. Compound movements only.",
    sourceLabel: "Routines per ACE / NSCA general guidance",
    sourceUrl: "https://www.acefitness.org/resources/everyone/exercise-library/",
    exercises: [
      { name: "Goblet squat", sets: 3, reps: "10", rest: "60s" },
      { name: "Push-ups (incline if needed)", sets: 3, reps: "8–12", rest: "60s" },
      { name: "DB row (one arm at a time)", sets: 3, reps: "10/side", rest: "60s" },
      { name: "Glute bridge", sets: 3, reps: "12", rest: "45s" },
      { name: "Plank", sets: 3, reps: "30s hold", rest: "30s" },
    ],
  },
};

function ExerciseRecommendations() {
  const [selected, setSelected] = useState(null);
  const w = selected ? WORKOUT_LIBRARY[selected] : null;
  const goals = Object.entries(WORKOUT_LIBRARY);

  return (
    <div>
      <div className="eyebrow text-slate-500 mb-3">Exercise programs</div>
      <h2 className="font-serif text-3xl tracking-tight mb-2" style={{ color: NAVY }}>
        Pick a focus, get a workout.
      </h2>
      <p className="text-sm text-slate-600 mb-7 max-w-md">
        Each routine is a starting template you can adjust. If you flagged injuries or are in PT, run
        these past your clinician first.
      </p>

      <div className="flex flex-wrap gap-2 mb-8">
        {goals.map(([id, g]) => (
          <ChipBtn key={id} active={selected === id} onClick={() => setSelected(id)}>
            {g.label}
          </ChipBtn>
        ))}
      </div>

      {w ? (
        <div className="border border-slate-200">
          <div className="p-6 bg-slate-50 border-b border-slate-200">
            <h3 className="font-serif text-2xl tracking-tight mb-1" style={{ color: NAVY }}>
              {w.label} workout
            </h3>
            <p className="text-sm text-slate-600">{w.intro}</p>
          </div>
          <ul>
            {w.exercises.map((e, i) => (
              <li
                key={i}
                className="flex items-start justify-between gap-4 px-5 py-4 border-b border-slate-100 last:border-b-0"
              >
                <div className="flex items-baseline gap-3 flex-1 min-w-0">
                  <span className="font-mono text-xs text-slate-400 w-6 flex-shrink-0 pt-0.5">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm" style={{ color: NAVY }}>{e.name}</div>
                    <a
                      href={`https://www.youtube.com/results?search_query=${encodeURIComponent(e.name + " proper form")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-slate-400 hover:text-slate-600 transition mt-0.5 inline-block"
                    >
                      watch demo →
                    </a>
                  </div>
                </div>
                <div className="text-xs text-slate-500 whitespace-nowrap flex gap-3 pt-0.5">
                  <span>{e.sets} × {e.reps}</span>
                  <span className="hidden sm:inline">rest {e.rest}</span>
                </div>
              </li>
            ))}
          </ul>
          <div className="p-4 bg-slate-50 text-xs text-slate-500 border-t border-slate-200">
            {w.sourceLabel}.{" "}
            <a
              href={w.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:no-underline"
              style={{ color: NAVY }}
            >
              Learn more →
            </a>
          </div>
        </div>
      ) : (
        <div className="border border-dashed border-slate-300 py-12 text-center text-sm text-slate-500">
          <Dumbbell className="w-6 h-6 mx-auto mb-3 text-slate-400" />
          Select a focus area above to see a workout.
        </div>
      )}
    </div>
  );
}

function Calculators({ onComplete }) {
  const [tab, setTab] = useState("calorie");

  const tabs = [
    { id: "calorie", label: "Calorie target", icon: Flame },
    { id: "bmi", label: "BMI", icon: Calculator },
    { id: "exercise", label: "Exercise programs", icon: Dumbbell },
  ];

  return (
    <main className="max-w-4xl mx-auto px-6 py-12">
      <div className="eyebrow text-slate-500 mb-3">Health calculators</div>
      <h1 className="font-serif text-4xl md:text-5xl tracking-tight mb-3" style={{ color: NAVY }}>
        Quick tools.
      </h1>
      <p className="text-slate-600 mb-10 max-w-2xl text-sm leading-relaxed">
        Standalone calculators — no full intake survey required. For the personalized plan that
        accounts for medical conditions, dietary preferences, and coaching style, take the{" "}
        <a className="underline">complete intake survey</a> from the home page.
      </p>

      {/* Tab bar */}
      <div className="flex border-b border-slate-200 mb-10 -mx-1">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="px-4 py-3 text-sm flex items-center gap-2 transition"
              style={{
                color: active ? NAVY : "#64748B",
                borderBottom: active ? `2px solid ${NAVY}` : "2px solid transparent",
                fontWeight: active ? 500 : 400,
                marginBottom: -1,
              }}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "calorie" && <CalorieCalculator onComplete={onComplete} />}
      {tab === "bmi" && <BMIInline />}
      {tab === "exercise" && <ExerciseRecommendations />}
    </main>
  );
}

/* ---- Calorie calculator (lightweight version of QuickStart, no big page chrome) ---- */
function CalorieCalculator({ onComplete }) {
  const [units, setUnits] = useState("metric");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [heightFt, setHeightFt] = useState("");
  const [heightIn, setHeightIn] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [weightLb, setWeightLb] = useState("");
  const [activity, setActivity] = useState("moderate");
  const [goal, setGoal] = useState("");
  const [computed, setComputed] = useState(null);

  const ageOk = age && Number(age) >= 14 && Number(age) <= 100;
  const heightCmEff = units === "metric" ? Number(heightCm) : (Number(heightFt) * 12 + Number(heightIn || 0)) * 2.54;
  const weightKgEff = units === "metric" ? Number(weightKg) : Number(weightLb) * 0.453592;
  const sizeOk = heightCmEff > 100 && heightCmEff < 250 && weightKgEff > 30 && weightKgEff < 300;
  const ready = ageOk && !!sex && sizeOk && !!goal;

  function compute() {
    const profile = {
      age: Number(age),
      sex,
      heightCm: heightCmEff,
      weightKg: weightKgEff,
      activity,
      goal,
    };
    const bmr = calcBMR(profile);
    const tdee = calcTDEE(bmr, profile.activity);
    const target = calcTarget(tdee, profile);
    const macros = calcMacros(target, weightKgEff, goal);
    const bmi = calcBMI(weightKgEff, heightCmEff);
    setComputed({ bmr: Math.round(bmr), tdee: Math.round(tdee), target, macros, bmi });
  }

  function saveAsPlan() {
    if (!computed) return;
    const profile = {
      age: Number(age),
      sex,
      heightCm: heightCmEff,
      weightKg: weightKgEff,
      units,
      activity,
      goal,
      goalWeightKg: null,
      timelineWeeks: null,
      offDays: 0,
      diet: [],
      experience: "",
      conditions: [],
      medications: [],
      allergies: [],
      personality: "",
      voice: "",
      limitations: "",
    };
    onComplete({
      profile,
      results: {
        ...computed,
        activeTarget: computed.target,
        offTarget: computed.target,
        offDays: 0,
      },
    });
  }

  return (
    <div>
      <div className="eyebrow text-slate-500 mb-3">Calorie target</div>
      <h2 className="font-serif text-3xl tracking-tight mb-2" style={{ color: NAVY }}>
        Get a daily target.
      </h2>
      <p className="text-sm text-slate-600 mb-7 max-w-md">
        Mifflin–St Jeor equation. Five questions, one number.
      </p>

      <div className="space-y-5">
        <Field label="Age">
          <input
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="e.g. 32"
            className="w-full md:w-48 border border-slate-300 px-3 py-2.5 rounded-sm focus:outline-none focus:border-slate-900"
          />
        </Field>
        <Field label="Sex assigned at birth">
          <div className="flex gap-3 flex-wrap">
            {["female", "male"].map((s) => (
              <ChipBtn key={s} active={sex === s} onClick={() => setSex(s)}>
                {s === "female" ? "Female" : "Male"}
              </ChipBtn>
            ))}
          </div>
        </Field>
        <Field label="Units">
          <div className="flex gap-3">
            {["metric", "imperial"].map((u) => (
              <ChipBtn key={u} active={units === u} onClick={() => setUnits(u)}>
                {u === "metric" ? "Metric (cm, kg)" : "Imperial (ft/in, lb)"}
              </ChipBtn>
            ))}
          </div>
        </Field>
        {units === "metric" ? (
          <>
            <Field label="Height (cm)">
              <input type="number" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} placeholder="e.g. 170" className="w-full md:w-48 border border-slate-300 px-3 py-2.5 rounded-sm focus:outline-none focus:border-slate-900" />
            </Field>
            <Field label="Weight (kg)">
              <input type="number" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} placeholder="e.g. 68" className="w-full md:w-48 border border-slate-300 px-3 py-2.5 rounded-sm focus:outline-none focus:border-slate-900" />
            </Field>
          </>
        ) : (
          <>
            <Field label="Height">
              <div className="flex gap-3">
                <input type="number" value={heightFt} onChange={(e) => setHeightFt(e.target.value)} placeholder="ft" className="w-24 border border-slate-300 px-3 py-2.5 rounded-sm focus:outline-none focus:border-slate-900" />
                <input type="number" value={heightIn} onChange={(e) => setHeightIn(e.target.value)} placeholder="in" className="w-24 border border-slate-300 px-3 py-2.5 rounded-sm focus:outline-none focus:border-slate-900" />
              </div>
            </Field>
            <Field label="Weight (lb)">
              <input type="number" value={weightLb} onChange={(e) => setWeightLb(e.target.value)} placeholder="e.g. 150" className="w-full md:w-48 border border-slate-300 px-3 py-2.5 rounded-sm focus:outline-none focus:border-slate-900" />
            </Field>
          </>
        )}
        <Field label="Activity level">
          <div className="flex gap-2 flex-wrap">
            {ACTIVITY_LEVELS.map((a) => (
              <ChipBtn key={a.id} active={activity === a.id} onClick={() => setActivity(a.id)}>
                {a.label}
              </ChipBtn>
            ))}
          </div>
        </Field>
        <Field label="Goal">
          <div className="flex gap-2 flex-wrap">
            {GOALS.map((g) => (
              <ChipBtn key={g.id} active={goal === g.id} onClick={() => setGoal(g.id)}>
                {g.label}
              </ChipBtn>
            ))}
          </div>
        </Field>
      </div>

      <button
        onClick={compute}
        disabled={!ready}
        className="mt-7 px-6 py-3 rounded-sm text-white text-sm tracking-wide hover:opacity-90 transition disabled:opacity-30 disabled:cursor-not-allowed"
        style={{ background: NAVY }}
      >
        Calculate
      </button>

      {computed && (
        <div className="mt-8 border border-slate-200 p-7">
          <div className="eyebrow text-slate-500 mb-3">Your daily target</div>
          <div className="font-serif tracking-tight" style={{ color: NAVY, fontSize: "3rem", letterSpacing: "-0.02em" }}>
            {computed.target.toLocaleString()}
            <span className="text-base font-normal text-slate-400 ml-2">kcal</span>
          </div>
          <div className="text-sm text-slate-600 mt-2">
            BMR {computed.bmr.toLocaleString()} · Maintenance {computed.tdee.toLocaleString()} · BMI {computed.bmi.toFixed(1)}
          </div>
          <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-slate-200">
            <div>
              <div className="micro text-slate-500 mb-1">Protein</div>
              <div className="font-serif text-2xl" style={{ color: NAVY }}>{computed.macros.proteinG}g</div>
            </div>
            <div>
              <div className="micro text-slate-500 mb-1">Carbs</div>
              <div className="font-serif text-2xl" style={{ color: NAVY }}>{computed.macros.carbG}g</div>
            </div>
            <div>
              <div className="micro text-slate-500 mb-1">Fat</div>
              <div className="font-serif text-2xl" style={{ color: NAVY }}>{computed.macros.fatG}g</div>
            </div>
          </div>
          <button
            onClick={saveAsPlan}
            className="mt-6 text-sm border border-slate-300 px-4 py-2 rounded-sm hover:border-slate-900 transition"
            style={{ color: NAVY }}
          >
            Use this as my plan →
          </button>
        </div>
      )}
    </div>
  );
}

/* ---- Inline BMI (lightweight) ---- */
function BMIInline() {
  const [units, setUnits] = useState("metric");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [heightFt, setHeightFt] = useState("");
  const [heightIn, setHeightIn] = useState("");
  const [weightLb, setWeightLb] = useState("");

  let bmi = null;
  if (units === "metric" && heightCm && weightKg) {
    bmi = calcBMI(parseFloat(weightKg), parseFloat(heightCm));
  } else if (units === "imperial" && (heightFt || heightIn) && weightLb) {
    const cm = ((parseFloat(heightFt) || 0) * 12 + (parseFloat(heightIn) || 0)) * 2.54;
    const kg = (parseFloat(weightLb) || 0) * 0.453592;
    if (cm > 0 && kg > 0) bmi = calcBMI(kg, cm);
  }

  return (
    <div>
      <div className="eyebrow text-slate-500 mb-3">BMI</div>
      <h2 className="font-serif text-3xl tracking-tight mb-2" style={{ color: NAVY }}>
        Body mass index.
      </h2>
      <p className="text-sm text-slate-600 mb-7 max-w-md">
        General screening number. Doesn't tell the whole story — muscle mass, age, and body composition matter.
      </p>

      <div className="space-y-5">
        <Field label="Units">
          <div className="flex gap-3">
            {["metric", "imperial"].map((u) => (
              <ChipBtn key={u} active={units === u} onClick={() => setUnits(u)}>
                {u === "metric" ? "Metric" : "Imperial"}
              </ChipBtn>
            ))}
          </div>
        </Field>
        {units === "metric" ? (
          <div className="grid grid-cols-2 gap-4">
            <Field label="Height (cm)">
              <input type="number" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} placeholder="e.g. 170" className="w-full border border-slate-300 px-3 py-2.5 rounded-sm focus:outline-none focus:border-slate-900" />
            </Field>
            <Field label="Weight (kg)">
              <input type="number" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} placeholder="e.g. 68" className="w-full border border-slate-300 px-3 py-2.5 rounded-sm focus:outline-none focus:border-slate-900" />
            </Field>
          </div>
        ) : (
          <>
            <Field label="Height">
              <div className="flex gap-3">
                <input type="number" value={heightFt} onChange={(e) => setHeightFt(e.target.value)} placeholder="ft" className="w-24 border border-slate-300 px-3 py-2.5 rounded-sm focus:outline-none focus:border-slate-900" />
                <input type="number" value={heightIn} onChange={(e) => setHeightIn(e.target.value)} placeholder="in" className="w-24 border border-slate-300 px-3 py-2.5 rounded-sm focus:outline-none focus:border-slate-900" />
              </div>
            </Field>
            <Field label="Weight (lb)">
              <input type="number" value={weightLb} onChange={(e) => setWeightLb(e.target.value)} placeholder="e.g. 150" className="w-full md:w-48 border border-slate-300 px-3 py-2.5 rounded-sm focus:outline-none focus:border-slate-900" />
            </Field>
          </>
        )}
      </div>

      {bmi && (
        <div className="mt-8 border border-slate-200 p-7">
          <div className="eyebrow text-slate-500 mb-3">Your BMI</div>
          <div className="font-serif text-6xl tracking-tight" style={{ color: NAVY }}>{bmi.toFixed(1)}</div>
          <div className="text-sm text-slate-600 mt-2">{bmiBand(bmi)}</div>
          <p className="text-xs text-slate-500 mt-5 leading-relaxed">
            WHO ranges: &lt;18.5 underweight · 18.5–24.9 normal · 25–29.9 overweight · ≥30 obese.
            BMI doesn't account for muscle mass and isn't equally appropriate across all populations.
          </p>
        </div>
      )}
    </div>
  );
}

function MealPlans({ go }) {
  const [open, setOpen] = useState(null);

  return (
    <main className="max-w-5xl mx-auto px-6 py-12">
      <div className="eyebrow text-slate-500 mb-3">Meal plans</div>
      <h1 className="font-serif text-4xl tracking-tight mb-2" style={{ color: NAVY }}>Sample plans</h1>
      <p className="text-slate-600 mb-10 max-w-2xl text-sm">
        Five styles to choose from. Calorie totals are illustrative — your survey results give you the daily target;
        portion these toward that number.
      </p>

      <div className="grid md:grid-cols-2 gap-px bg-slate-200 border border-slate-200">
        {MEAL_PLANS.map((p) => {
          const total = p.sample.reduce((a, b) => a + b.kcal, 0);
          return (
            <button
              key={p.id}
              onClick={() => setOpen(p)}
              className="bg-white text-left p-7 hover:bg-slate-50 transition"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <h3 className="font-serif text-2xl tracking-tight" style={{ color: NAVY }}>{p.name}</h3>
                <Salad className="w-5 h-5 flex-shrink-0" style={{ color: NAVY }} />
              </div>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">{p.blurb}</p>
              <div className="flex flex-wrap gap-2 mb-5">
                {p.tags.map((t) => (
                  <span key={t} className="pill-tag text-slate-500 border border-slate-300 px-2 py-0.5">
                    {t}
                  </span>
                ))}
              </div>
              <div className="text-xs text-slate-500">
                Sample day · ~{total.toLocaleString()} kcal
              </div>
            </button>
          );
        })}
      </div>

      {open && <MealPlanModal plan={open} onClose={() => setOpen(null)} />}
    </main>
  );
}

function MealPlanModal({ plan, onClose }) {
  useEffect(() => {
    const onEsc = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [onClose]);

  const total = plan.sample.reduce((a, b) => a + b.kcal, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40" onClick={onClose}>
      <div
        className="bg-white max-w-xl w-full overflow-auto p-8 relative"
        style={{ maxHeight: "90vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="eyebrow text-slate-500 mb-2">Meal plan</div>
        <h2 className="font-serif text-3xl tracking-tight mb-2" style={{ color: NAVY }}>{plan.name}</h2>
        <p className="text-sm text-slate-600 mb-6">{plan.blurb}</p>
        <ul className="space-y-3 border-t border-slate-200 pt-5">
          {plan.sample.map((m, i) => (
            <li key={i} className="flex justify-between gap-4 pb-3 border-b border-slate-100 last:border-b-0">
              <div>
                <div className="micro text-slate-500 mb-0.5">{m.meal}</div>
                <div className="text-sm" style={{ color: NAVY }}>{m.food}</div>
              </div>
              <div className="text-sm font-medium whitespace-nowrap" style={{ color: NAVY }}>{m.kcal} kcal</div>
            </li>
          ))}
        </ul>
        <div className="flex justify-between mt-5 pt-4 border-t border-slate-200">
          <span className="micro text-slate-500">Sample-day total</span>
          <span className="text-sm font-medium" style={{ color: NAVY }}>{total.toLocaleString()} kcal</span>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   MEAL LOGGER
   ============================================================ */

function MealLogger({ results, meals, addMeal, removeMeal, clearTodayMeals, currentUser, onGoProgress }) {
  const [name, setName] = useState("");
  const [kcal, setKcal] = useState("");
  const [servings, setServings] = useState(1);
  const [baseKcal, setBaseKcal] = useState(null); // kcal of one serving when picked from DB
  const [baseLabel, setBaseLabel] = useState(""); // e.g., "per 100g", for display
  const [baseMacros, setBaseMacros] = useState(null); // {protein, carbs, fat} per serving from USDA
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);

  const SERVING_OPTIONS = [0.25, 0.5, 1, 2, 3, 4, 5];

  // Debounced USDA search; falls back to local FOOD_DB if the API fails
  useEffect(() => {
    const q = name.trim();
    if (q.length < 2 || baseKcal != null) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/food-search?q=${encodeURIComponent(q)}`);
        if (!res.ok) throw new Error("search failed");
        const data = await res.json();
        if (cancelled) return;
        const foods = (data.foods || []).map((f) => ({
          name: f.name,
          kcal: f.kcal,
          label: f.label || "per 100g",
          macros: { protein: f.protein || 0, carbs: f.carbs || 0, fat: f.fat || 0 },
        }));
        // Fall back to local list if USDA returned nothing
        setSuggestions(foods.length ? foods.slice(0, 8) : localMatches(q));
      } catch {
        if (!cancelled) setSuggestions(localMatches(q));
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [name, baseKcal]);

  function localMatches(q) {
    return FOOD_DB.filter((f) => f.name.toLowerCase().includes(q.toLowerCase()))
      .slice(0, 8)
      .map((f) => ({ name: f.name, kcal: f.kcal, label: f.label, macros: null }));
  }

  const today = todayString();
  const todayMeals = meals.filter((m) => (m.date || today) === today);
  const total = todayMeals.reduce((a, b) => a + b.kcal, 0);
  const target = results?.target ?? null;
  const remaining = target ? target - total : null;
  const pct = target ? Math.min(100, (total / target) * 100) : 0;

  // When user changes servings, recompute kcal if we have a base
  function changeServings(newServings) {
    setServings(newServings);
    if (baseKcal != null) {
      setKcal(String(Math.round(baseKcal * newServings)));
    }
  }

  // When user picks from the autocomplete, store the base and apply current servings
  function pickFood(f) {
    setName(f.name);
    setBaseKcal(f.kcal);
    setBaseLabel(f.label);
    setBaseMacros(f.macros); // null for local foods, real macros for USDA
    setKcal(String(Math.round(f.kcal * servings)));
    setShowSuggestions(false);
    setSuggestions([]);
  }

  // When user types freely (not from DB), discard base tracking so kcal is theirs
  function changeName(v) {
    setName(v);
    setShowSuggestions(true);
    if (baseKcal != null) {
      // typing manually after a selection — clear the base so the kcal field is editable freely
      setBaseKcal(null);
      setBaseLabel("");
      setBaseMacros(null);
    }
  }

  function add() {
    if (!name.trim() || !kcal || Number(kcal) <= 0) return;
    // If a base food was used and servings != 1, suffix the meal name
    let displayName = name.trim();
    if (baseKcal != null && servings !== 1) {
      displayName = `${displayName} (${servings}× ${baseLabel})`;
    }
    const finalKcal = Math.round(Number(kcal));
    // Use real USDA macros if available (scaled by servings); otherwise estimate from name
    let macros;
    if (baseMacros) {
      macros = {
        proteinG: Math.round(baseMacros.protein * servings),
        carbG: Math.round(baseMacros.carbs * servings),
        fatG: Math.round(baseMacros.fat * servings),
      };
    } else {
      macros = estimateMacrosForFood(name.trim(), finalKcal);
    }
    addMeal({
      id: Date.now(),
      name: displayName,
      kcal: finalKcal,
      proteinG: macros.proteinG,
      carbG: macros.carbG,
      fatG: macros.fatG,
      date: today,
      timestamp: Date.now(),
    });
    setName("");
    setKcal("");
    setServings(1);
    setBaseKcal(null);
    setBaseLabel("");
    setBaseMacros(null);
  }

  return (
    <main className="max-w-3xl mx-auto px-6 py-12">
      <div className="eyebrow text-slate-500 mb-3">Today</div>
      <h1 className="font-serif text-4xl tracking-tight mb-2" style={{ color: NAVY }}>Meal logger</h1>
      <p className="text-slate-600 mb-10 text-sm max-w-md">
        Log meals as you eat them.{" "}
        {currentUser
          ? "Your history is saved to your account — view it on the Progress page."
          : "Sign in to save your history across days."}
      </p>

      {/* Progress */}
      <div className="border border-slate-200 p-6 mb-8">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <div className="eyebrow text-slate-500 mb-2">Today's total</div>
            <div className="font-serif text-4xl tracking-tight" style={{ color: NAVY }}>
              {total.toLocaleString()}
              <span className="text-slate-400 text-2xl ml-1">{target ? `/ ${target.toLocaleString()} kcal` : "kcal"}</span>
            </div>
          </div>
          {target ? (
            <div className="text-sm" style={{ color: NAVY }}>
              {remaining >= 0 ? `${remaining.toLocaleString()} kcal remaining` : `${Math.abs(remaining).toLocaleString()} kcal over`}
            </div>
          ) : (
            <div className="text-xs text-slate-500 max-w-xs text-right">
              No calorie target yet — take the survey to set one.
            </div>
          )}
        </div>
        {target && (
          <div className="h-1.5 bg-slate-100 mt-4 relative overflow-hidden">
            <div className="absolute left-0 top-0 h-full transition-all" style={{ width: `${pct}%`, background: NAVY }} />
          </div>
        )}
      </div>

      {/* Add meal */}
      <div className="border border-slate-200 p-6 mb-8 relative">
        <div className="eyebrow text-slate-500 mb-4">Add a meal</div>
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 relative" style={{ minWidth: 200 }}>
            <input
              type="text"
              value={name}
              onChange={(e) => changeName(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              placeholder="Search foods or type your own…"
              className="w-full border border-slate-300 px-3 py-2.5 rounded-sm focus:outline-none focus:border-slate-900"
              onKeyDown={(e) => e.key === "Enter" && add()}
            />
            {showSuggestions && name.trim().length > 1 && baseKcal == null && (suggestions.length > 0 || searching) && (
              <ul className="absolute z-10 left-0 right-0 mt-1 bg-white border border-slate-300 max-h-64 overflow-auto shadow-md">
                {searching && suggestions.length === 0 && (
                  <li className="px-3 py-2.5 text-sm text-slate-400">Searching…</li>
                )}
                {suggestions.map((s, idx) => (
                  <li key={`${s.name}-${idx}`}>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => pickFood(s)}
                      className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between gap-3 border-b border-slate-100 last:border-b-0"
                    >
                      <div className="min-w-0">
                        <div className="text-sm truncate" style={{ color: NAVY }}>{s.name}</div>
                        <div className="text-xs text-slate-500">{s.label}</div>
                      </div>
                      <div className="text-sm font-medium whitespace-nowrap" style={{ color: NAVY }}>
                        {s.kcal} kcal
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <select
            value={servings}
            onChange={(e) => changeServings(Number(e.target.value))}
            className="border border-slate-300 px-3 py-2.5 rounded-sm focus:outline-none focus:border-slate-900 bg-white"
            title="Servings"
          >
            {SERVING_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {baseLabel === "per 100g" ? `${s * 100}g` : `${s}× ${baseLabel || "serving"}`}
              </option>
            ))}
          </select>
          <input
            type="number"
            value={kcal}
            onChange={(e) => {
              setKcal(e.target.value);
              // user manually changed kcal — break the base link
              setBaseKcal(null);
            }}
            placeholder="kcal"
            className="w-28 border border-slate-300 px-3 py-2.5 rounded-sm focus:outline-none focus:border-slate-900"
            onKeyDown={(e) => e.key === "Enter" && add()}
          />
          <button
            onClick={add}
            className="px-5 py-2.5 rounded-sm text-white text-sm tracking-wide flex items-center gap-2 hover:opacity-90 transition"
            style={{ background: NAVY }}
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
        {baseKcal != null && (
          <div className="text-xs text-slate-500 mt-2">
            {baseLabel === "per 100g" ? `${servings * 100}g` : `${servings}× ${baseLabel}`} · <span style={{ color: NAVY }}>{Math.round(baseKcal * servings)} kcal</span>
            {baseMacros && (
              <span> · P {Math.round(baseMacros.protein * servings)}g · C {Math.round(baseMacros.carbs * servings)}g · F {Math.round(baseMacros.fat * servings)}g</span>
            )}
          </div>
        )}
        {name.trim().length > 1 && baseKcal == null && !searching && suggestions.length === 0 && (
          <div className="text-xs text-slate-500 mt-2">No matches — type your own calories above.</div>
        )}
      </div>

      {/* List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="eyebrow text-slate-500">Logged today · {todayMeals.length}</div>
          <div className="flex items-center gap-4">
            {currentUser && onGoProgress && (
              <button onClick={onGoProgress} className="text-xs hover:underline transition" style={{ color: NAVY }}>
                View history
              </button>
            )}
            {todayMeals.length > 0 && (
              <button onClick={clearTodayMeals} className="text-xs text-slate-500 hover:text-slate-900 transition">
                Clear today
              </button>
            )}
          </div>
        </div>
        {todayMeals.length === 0 ? (
          <div className="border border-dashed border-slate-300 py-12 text-center text-sm text-slate-500">
            <Apple className="w-6 h-6 mx-auto mb-3 text-slate-400" />
            No meals logged yet today.
          </div>
        ) : (
          <ul className="border border-slate-200">
            {todayMeals.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between gap-4 px-5 py-4 border-b border-slate-100 last:border-b-0"
              >
                <div className="text-sm" style={{ color: NAVY }}>{m.name}</div>
                <div className="flex items-center gap-4">
                  <div className="text-sm font-medium" style={{ color: NAVY }}>{m.kcal} kcal</div>
                  <button
                    onClick={() => removeMeal(m.id)}
                    className="text-slate-400 hover:text-slate-900 transition"
                    aria-label="Remove meal"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}

/* ============================================================
   PROGRESS PAGE
   ============================================================ */

function Progress({ profile, results, meals, weights, addWeight, removeWeight, currentUser, onOpenAuth, go }) {
  const isImperial = profile?.units === "imperial";
  const [unit, setUnit] = useState(isImperial ? "lb" : "kg");

  // Sign-in gate
  if (!currentUser) {
    return (
      <main className="max-w-2xl mx-auto px-6 py-16">
        <div className="eyebrow text-slate-500 mb-3">Progress</div>
        <h1 className="font-serif text-4xl tracking-tight mb-4" style={{ color: NAVY }}>
          Sign in to see your progress.
        </h1>
        <p className="text-slate-600 leading-relaxed mb-8 max-w-md">
          Progress tracking saves your weight history and meal log to your account. Create a free
          account or sign in to use it.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => onOpenAuth("signup")}
            className="px-6 py-3 rounded-sm text-white text-sm tracking-wide hover:opacity-90 transition"
            style={{ background: NAVY }}
          >
            Create account
          </button>
          <button
            onClick={() => onOpenAuth("signin")}
            className="px-6 py-3 rounded-sm text-sm tracking-wide border border-slate-300 hover:border-slate-900 transition"
            style={{ color: NAVY }}
          >
            Sign in
          </button>
        </div>
      </main>
    );
  }

  // Weight stats
  const sortedWeights = [...weights].sort((a, b) => a.date.localeCompare(b.date));
  const latest = sortedWeights[sortedWeights.length - 1];
  const earliest = sortedWeights[0];
  const trend =
    latest && earliest && latest.id !== earliest.id ? latest.kg - earliest.kg : null;

  // Meals last 14 days
  const days = lastNDays(14);
  const mealsByDate = meals.reduce((acc, m) => {
    const d = m.date || todayString();
    (acc[d] = acc[d] || []).push(m);
    return acc;
  }, {});
  const target = results?.target ?? null;

  return (
    <main className="max-w-4xl mx-auto px-6 py-12">
      <div className="eyebrow text-slate-500 mb-3">Progress</div>
      <h1 className="font-serif text-4xl md:text-5xl tracking-tight mb-2" style={{ color: NAVY }}>
        How you're tracking.
      </h1>
      <p className="text-slate-600 mb-10 max-w-2xl">
        Your weight log and meal history, saved to your account ({currentUser}).
      </p>

      {/* Weight section */}
      <Section eyebrow="Weight" title="Weight over time">
        <div className="grid md:grid-cols-3 gap-px bg-slate-200 border border-slate-200 mb-6">
          <Stat
            label="Latest"
            value={latest ? formatWeight(latest.kg, unit) : "—"}
            suffix={latest ? unit : ""}
          />
          <Stat
            label="Entries"
            value={String(sortedWeights.length)}
            suffix=""
          />
          <Stat
            label="Change"
            value={trend === null ? "—" : `${trend > 0 ? "+" : ""}${formatWeight(trend, unit)}`}
            suffix={trend === null ? "" : unit}
          />
        </div>

        {sortedWeights.length >= 2 ? (
          <div className="border border-slate-200 p-4 md:p-6 mb-6">
            <WeightChart weights={sortedWeights} unit={unit} />
          </div>
        ) : (
          <div className="border border-dashed border-slate-300 py-10 px-6 text-center text-sm text-slate-500 mb-6">
            <Scale className="w-6 h-6 mx-auto mb-3 text-slate-400" />
            {sortedWeights.length === 0
              ? "No weight entries yet. Log one below to start the chart."
              : "Log one more entry to see a trend line."}
          </div>
        )}

        <WeightLogForm
          unit={unit}
          onUnitChange={setUnit}
          onAdd={addWeight}
        />

        {sortedWeights.length > 0 && (
          <div className="mt-6">
            <div className="eyebrow text-slate-500 mb-3">Recent entries</div>
            <ul className="border border-slate-200 max-h-72 overflow-auto">
              {[...sortedWeights]
                .reverse()
                .slice(0, 20)
                .map((w) => (
                  <li
                    key={w.id}
                    className="flex items-center justify-between gap-4 px-5 py-3 border-b border-slate-100 last:border-b-0"
                  >
                    <div className="text-sm" style={{ color: NAVY }}>
                      {formatShortDate(w.date)}
                      <span className="text-slate-400 text-xs ml-2">{w.date}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-sm font-medium" style={{ color: NAVY }}>
                        {formatWeight(w.kg, unit)} {unit}
                      </div>
                      <button
                        onClick={() => removeWeight(w.id)}
                        className="text-slate-400 hover:text-slate-900 transition"
                        aria-label="Remove entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </li>
                ))}
            </ul>
          </div>
        )}
      </Section>

      {/* Meal history */}
      <div className="mt-16">
        <Section eyebrow="Nutrition" title="Daily calories — last 14 days">
          <CalorieChart days={days} mealsByDate={mealsByDate} target={target} />
          <div className="mt-8 space-y-3">
            {[...days].reverse().map((d) => {
              const dayMeals = mealsByDate[d] || [];
              const total = dayMeals.reduce((a, b) => a + b.kcal, 0);
              return <DayRow key={d} date={d} meals={dayMeals} total={total} target={target} />;
            })}
          </div>
        </Section>
      </div>

      <div className="mt-14 pt-8 border-t border-slate-200 flex flex-wrap gap-3">
        <button
          onClick={() => go("logger")}
          className="text-sm border border-slate-300 px-4 py-2 rounded-sm hover:border-slate-900 transition"
          style={{ color: NAVY }}
        >
          Log a meal
        </button>
        {results && (
          <button
            onClick={() => go("results")}
            className="text-sm border border-slate-300 px-4 py-2 rounded-sm hover:border-slate-900 transition"
            style={{ color: NAVY }}
          >
            View plan
          </button>
        )}
      </div>
    </main>
  );
}

function formatWeight(kg, unit) {
  if (kg == null) return "—";
  const v = unit === "lb" ? kg / 0.453592 : kg;
  return v.toFixed(1);
}

function WeightLogForm({ unit, onUnitChange, onAdd }) {
  const [val, setVal] = useState("");
  const [date, setDate] = useState(todayString());
  const [err, setErr] = useState("");

  function submit() {
    setErr("");
    const n = parseFloat(val);
    if (!n || n <= 0) {
      setErr("Enter a valid weight.");
      return;
    }
    if (!date) {
      setErr("Pick a date.");
      return;
    }
    const kg = unit === "lb" ? n * 0.453592 : n;
    if (kg < 20 || kg > 400) {
      setErr("That weight looks out of range.");
      return;
    }
    onAdd({ id: Date.now(), kg, date, timestamp: Date.now() });
    setVal("");
    setDate(todayString());
  }

  return (
    <div className="border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="eyebrow text-slate-500">Log a weight</div>
        <div className="flex gap-1.5 items-center text-xs">
          <button
            onClick={() => onUnitChange("kg")}
            className={`px-2 py-1 rounded-sm transition ${unit === "kg" ? "text-white" : "text-slate-500 hover:text-slate-900"}`}
            style={unit === "kg" ? { background: NAVY } : {}}
          >
            kg
          </button>
          <button
            onClick={() => onUnitChange("lb")}
            className={`px-2 py-1 rounded-sm transition ${unit === "lb" ? "text-white" : "text-slate-500 hover:text-slate-900"}`}
            style={unit === "lb" ? { background: NAVY } : {}}
          >
            lb
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <input
          type="number"
          step="0.1"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder={unit === "lb" ? "e.g. 165" : "e.g. 75"}
          className="flex-1 border border-slate-300 px-3 py-2.5 rounded-sm focus:outline-none focus:border-slate-900"
          style={{ minWidth: 140 }}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          max={todayString()}
          className="border border-slate-300 px-3 py-2.5 rounded-sm focus:outline-none focus:border-slate-900"
        />
        <button
          onClick={submit}
          className="px-5 py-2.5 rounded-sm text-white text-sm tracking-wide flex items-center gap-2 hover:opacity-90 transition"
          style={{ background: NAVY }}
        >
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>
      {err && <div className="mt-3 text-xs text-red-700">{err}</div>}
    </div>
  );
}

function WeightChart({ weights, unit }) {
  // Pure SVG line chart
  const W = 720;
  const H = 200;
  const padL = 44;
  const padR = 16;
  const padT = 16;
  const padB = 28;

  const data = weights.map((w) => ({
    ...w,
    val: unit === "lb" ? w.kg / 0.453592 : w.kg,
    t: new Date(w.date).getTime(),
  }));
  const minT = data[0].t;
  const maxT = data[data.length - 1].t;
  const tSpan = Math.max(1, maxT - minT);
  const minV = Math.min(...data.map((d) => d.val));
  const maxV = Math.max(...data.map((d) => d.val));
  const range = Math.max(0.5, maxV - minV);
  const padV = range * 0.15;
  const yMin = minV - padV;
  const yMax = maxV + padV;

  function x(t) {
    return padL + ((t - minT) / tSpan) * (W - padL - padR);
  }
  function y(v) {
    return padT + (1 - (v - yMin) / (yMax - yMin)) * (H - padT - padB);
  }

  const points = data.map((d) => `${x(d.t).toFixed(1)},${y(d.val).toFixed(1)}`).join(" ");

  // Gridlines (3 horizontal)
  const yTicks = [yMax, (yMax + yMin) / 2, yMin];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ overflow: "visible" }}>
      {/* Gridlines */}
      {yTicks.map((v, i) => (
        <g key={i}>
          <line
            x1={padL}
            x2={W - padR}
            y1={y(v)}
            y2={y(v)}
            stroke="#E5E7EB"
            strokeWidth="1"
          />
          <text
            x={padL - 8}
            y={y(v) + 3}
            fontSize="10"
            fill="#94A3B8"
            textAnchor="end"
            fontFamily="ui-monospace, monospace"
          >
            {v.toFixed(1)}
          </text>
        </g>
      ))}

      {/* Line */}
      <polyline
        fill="none"
        stroke={NAVY}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />

      {/* Dots */}
      {data.map((d, i) => (
        <g key={d.id}>
          <circle cx={x(d.t)} cy={y(d.val)} r="3.5" fill="#fff" stroke={NAVY} strokeWidth="2" />
          {(i === 0 || i === data.length - 1) && (
            <text
              x={x(d.t)}
              y={y(d.val) - 10}
              fontSize="10"
              fill={NAVY}
              textAnchor="middle"
              fontFamily="ui-monospace, monospace"
            >
              {d.val.toFixed(1)}
            </text>
          )}
        </g>
      ))}

      {/* X-axis labels: first and last */}
      <text
        x={x(data[0].t)}
        y={H - 8}
        fontSize="10"
        fill="#94A3B8"
        textAnchor="start"
        fontFamily="ui-monospace, monospace"
      >
        {formatShortDate(data[0].date)}
      </text>
      <text
        x={x(data[data.length - 1].t)}
        y={H - 8}
        fontSize="10"
        fill="#94A3B8"
        textAnchor="end"
        fontFamily="ui-monospace, monospace"
      >
        {formatShortDate(data[data.length - 1].date)}
      </text>
    </svg>
  );
}

function CalorieChart({ days, mealsByDate, target }) {
  const W = 720;
  const H = 180;
  const padL = 16;
  const padR = 16;
  const padT = 16;
  const padB = 32;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const barW = innerW / days.length - 4;

  const totals = days.map((d) => (mealsByDate[d] || []).reduce((a, b) => a + b.kcal, 0));
  const maxV = Math.max(target ?? 0, ...totals, 100) * 1.1;

  function y(v) {
    return padT + (1 - v / maxV) * innerH;
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      {/* Target line */}
      {target && (
        <g>
          <line
            x1={padL}
            x2={W - padR}
            y1={y(target)}
            y2={y(target)}
            stroke={NAVY}
            strokeDasharray="3 3"
            strokeWidth="1"
            opacity="0.5"
          />
          <text
            x={W - padR}
            y={y(target) - 4}
            fontSize="10"
            fill={NAVY}
            textAnchor="end"
            fontFamily="ui-monospace, monospace"
          >
            target {target}
          </text>
        </g>
      )}

      {/* Bars */}
      {days.map((d, i) => {
        const v = totals[i];
        const bx = padL + (innerW / days.length) * i + 2;
        const bh = (v / maxV) * innerH;
        const by = padT + innerH - bh;
        const over = target ? v > target : false;
        return (
          <g key={d}>
            <rect
              x={bx}
              y={by}
              width={barW}
              height={bh}
              fill={v === 0 ? "#E5E7EB" : over ? "#9C3A36" : NAVY}
              rx="1"
            />
            {(i === 0 || i === days.length - 1 || i === Math.floor(days.length / 2)) && (
              <text
                x={bx + barW / 2}
                y={H - 12}
                fontSize="9.5"
                fill="#94A3B8"
                textAnchor="middle"
                fontFamily="ui-monospace, monospace"
              >
                {formatShortDate(d)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function DayRow({ date, meals, total, target }) {
  const [open, setOpen] = useState(false);
  const isToday = date === todayString();
  const pct = target ? Math.min(100, (total / target) * 100) : 0;
  const over = target && total > target;
  const empty = meals.length === 0;

  return (
    <div className="border border-slate-200">
      <button
        onClick={() => !empty && setOpen((v) => !v)}
        disabled={empty}
        className={`w-full flex items-center justify-between gap-4 px-5 py-3.5 text-left ${
          !empty ? "hover:bg-slate-50" : "cursor-default"
        } transition`}
      >
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="text-sm flex-shrink-0" style={{ color: NAVY }}>
            <span className="font-medium">{formatShortDate(date)}</span>
            {isToday && <span className="ml-2 text-xs text-slate-500">today</span>}
          </div>
          <div className="flex-1 h-1 bg-slate-100 relative overflow-hidden hidden md:block">
            <div
              className="absolute left-0 top-0 h-full transition-all"
              style={{ width: `${pct}%`, background: over ? "#9C3A36" : NAVY }}
            />
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-sm font-medium" style={{ color: empty ? "#94A3B8" : NAVY }}>
            {empty ? "no log" : `${total.toLocaleString()} kcal`}
          </div>
          <div className="text-xs text-slate-400 w-12 text-right hidden sm:block">
            {meals.length === 0 ? "" : `${meals.length} meal${meals.length === 1 ? "" : "s"}`}
          </div>
        </div>
      </button>
      {open && !empty && (
        <ul className="border-t border-slate-200">
          {meals.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between gap-4 px-5 py-2.5 text-sm border-b border-slate-100 last:border-b-0"
            >
              <span style={{ color: NAVY }}>{m.name}</span>
              <span className="text-slate-500">{m.kcal} kcal</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ============================================================
   ABOUT / CONTACT — placeholder pages, content TBD
   ============================================================ */

function PlaceholderPage({ eyebrow, title, note }) {
  return (
    <main className="max-w-3xl mx-auto px-6 py-20">
      <div className="eyebrow text-slate-500 mb-3">{eyebrow}</div>
      <h1 className="font-serif text-4xl md:text-5xl tracking-tight mb-6" style={{ color: NAVY }}>
        {title}
      </h1>
      <div className="border border-dashed border-slate-300 p-8 text-sm text-slate-500 leading-relaxed">
        {note}
      </div>
    </main>
  );
}

function LiftHotline() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setError("");
    if (!name.trim() || !email.trim()) {
      setError("Please enter your name and email so we can reach you.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          access_key: WEB3FORMS_ACCESS_KEY,
          subject: "New LIFT Hotline request",
          from_name: "LIFT Hotline",
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || "(not provided)",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) {
        throw new Error(data.message || `Status ${res.status}`);
      }
      setSent(true);
    } catch (e) {
      setError(`Couldn't send your request (${e.message}). Please email us at holisticcareorg@gmail.com.`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="max-w-2xl mx-auto px-6 py-20">
      <div className="eyebrow mb-3 flex items-center gap-2" style={{ color: ACCENT }}>
        <Phone className="w-3.5 h-3.5" /> LIFT Hotline
      </div>
      <h1 className="font-serif text-4xl md:text-5xl tracking-tight mb-4" style={{ color: NAVY_DEEP }}>
        Talk to a real <span className="font-serif-italic" style={{ color: ACCENT }}>person</span>.
      </h1>
      <p className="text-slate-600 leading-relaxed mb-10 max-w-md">
        Leave your contact information and a member of the Holistic Care team will reach out to you
        directly. No bots — a real person who can help.
      </p>

      {sent ? (
        <div className="border border-slate-200 p-8 rounded-sm text-center lift-card">
          <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: ACCENT_SOFT }}>
            <Phone className="w-5 h-5" style={{ color: ACCENT }} />
          </div>
          <div className="font-serif text-3xl tracking-tight mb-3" style={{ color: NAVY_DEEP }}>
            Request received.
          </div>
          <p className="text-slate-600 leading-relaxed">
            Someone from the Holistic Care team will reach out to you as soon as possible.
          </p>
        </div>
      ) : (
        <div className="border border-slate-200 p-8 rounded-sm">
          <div className="space-y-5">
            <div>
              <div className="text-sm font-medium mb-2" style={{ color: NAVY_DEEP }}>Name</div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className="w-full border border-slate-300 px-4 py-3 rounded-sm focus:outline-none focus:border-slate-900"
              />
            </div>
            <div>
              <div className="text-sm font-medium mb-2" style={{ color: NAVY_DEEP }}>Email</div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full border border-slate-300 px-4 py-3 rounded-sm focus:outline-none focus:border-slate-900"
              />
            </div>
            <div>
              <div className="text-sm font-medium mb-2" style={{ color: NAVY_DEEP }}>
                Phone <span className="text-slate-400 font-normal">(optional)</span>
              </div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 555-5555"
                className="w-full border border-slate-300 px-4 py-3 rounded-sm focus:outline-none focus:border-slate-900"
              />
            </div>
            {error && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-sm">
                {error}
              </div>
            )}
            <button
              onClick={submit}
              disabled={busy}
              className="w-full py-3.5 rounded-sm text-white text-sm font-medium hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: ACCENT }}
            >
              <Phone className="w-4 h-4" />
              {busy ? "Sending…" : "Request live support"}
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-5 leading-relaxed">
            Your information is sent securely to the Holistic Care team and used only to contact you.
          </p>
        </div>
      )}
    </main>
  );
}

function ProjectCoaches() {
  const KEYS = {
    neuro: "Balance!",
    food: "You can do this!",
  };
  const projects = [
    { id: "neuro", label: "Neurodiversity Project" },
    { id: "food", label: "Food Desert Project" },
  ];

  const [project, setProject] = useState(null);
  const [key, setKey] = useState("");
  const [keyError, setKeyError] = useState("");
  const [keyAccepted, setKeyAccepted] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState("");

  function selectProject(id) {
    setProject(id);
    setKey("");
    setKeyError("");
    setKeyAccepted(false);
    setName("");
    setEmail("");
    setSubmitted(false);
    setSubmitError("");
  }

  function checkKey() {
    if (key.trim() === KEYS[project]) {
      setKeyAccepted(true);
      setKeyError("");
    } else {
      setKeyError("That key doesn't match. Please check with your LIFT coordinator.");
    }
  }

  async function submit() {
    if (!name.trim() || !email.trim()) {
      setSubmitError("Please enter both your name and email.");
      return;
    }
    setBusy(true);
    setSubmitError("");
    try {
      await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          access_key: WEB3FORMS_ACCESS_KEY,
          subject: "New LIFT student submission",
          from_name: "LIFT Project Coaches",
          project: projects.find((p) => p.id === project)?.label,
          name: name.trim(),
          email: email.trim(),
        }),
      });
    } catch {}
    setSubmitted(true);
    setBusy(false);
  }

  return (
    <main className="max-w-2xl mx-auto px-6 py-20">
      <div className="eyebrow text-slate-500 mb-3">Project coaches</div>
      <h1 className="font-serif text-4xl md:text-5xl tracking-tight mb-8" style={{ color: NAVY_DEEP }}>
        Which project were you or your student a part of?
      </h1>

      {/* Project tabs */}
      <div className="flex gap-3 flex-wrap mb-10">
        {projects.map((p) => (
          <button
            key={p.id}
            onClick={() => selectProject(p.id)}
            className="px-6 py-3 rounded-sm text-sm font-medium transition"
            style={{
              background: project === p.id ? NAVY_DEEP : "#fff",
              color: project === p.id ? "#fff" : NAVY_DEEP,
              border: `1px solid ${project === p.id ? NAVY_DEEP : "#CBD5E1"}`,
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Key entry */}
      {project && !submitted && (
        <div className="border border-slate-200 p-8 rounded-sm">
          <div className="eyebrow text-slate-500 mb-4">
            {projects.find((p) => p.id === project)?.label}
          </div>

          {/* Key field — locked once accepted */}
          <div className="mb-6">
            <div className="text-sm font-medium mb-2" style={{ color: NAVY_DEEP }}>
              Enter your student key here:
            </div>
            <div className="flex gap-3">
              <input
                type="text"
                value={key}
                onChange={(e) => { setKey(e.target.value); setKeyError(""); }}
                onKeyDown={(e) => e.key === "Enter" && !keyAccepted && checkKey()}
                placeholder="Student key"
                disabled={keyAccepted}
                className="flex-1 border border-slate-300 px-4 py-3 rounded-sm focus:outline-none focus:border-slate-900 disabled:bg-slate-50 disabled:text-slate-400"
              />
              {!keyAccepted && (
                <button
                  onClick={checkKey}
                  disabled={!key.trim()}
                  className="px-5 py-3 rounded-sm text-white text-sm font-medium hover:opacity-90 transition disabled:opacity-30"
                  style={{ background: NAVY_DEEP }}
                >
                  Confirm
                </button>
              )}
              {keyAccepted && (
                <div className="flex items-center px-3 text-sm font-medium" style={{ color: "#3F7050" }}>
                  ✓ Accepted
                </div>
              )}
            </div>
            {keyError && (
              <div className="text-xs text-red-600 mt-2">{keyError}</div>
            )}
          </div>

          {/* Name + email — shown after key accepted */}
          {keyAccepted && (
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium mb-2" style={{ color: NAVY_DEEP }}>Name</div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full border border-slate-300 px-4 py-3 rounded-sm focus:outline-none focus:border-slate-900"
                />
              </div>
              <div>
                <div className="text-sm font-medium mb-2" style={{ color: NAVY_DEEP }}>Email</div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full border border-slate-300 px-4 py-3 rounded-sm focus:outline-none focus:border-slate-900"
                />
              </div>
              {submitError && (
                <div className="text-xs text-red-600">{submitError}</div>
              )}
              <button
                onClick={submit}
                disabled={busy}
                className="w-full py-3 rounded-sm text-white text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
                style={{ background: NAVY_DEEP }}
              >
                {busy ? "Submitting…" : "Submit"}
              </button>
            </div>
          )}

          <p className="text-xs text-slate-500 mt-6 leading-relaxed">
            For any questions, please contact your LIFT coordinators or email us at{" "}
            <a href="mailto:holisticcareorg@gmail.com" className="underline hover:no-underline" style={{ color: NAVY_DEEP }}>
              holisticcareorg@gmail.com
            </a>.
          </p>
        </div>
      )}

      {/* Thank you */}
      {submitted && (
        <div className="border border-slate-200 p-8 rounded-sm text-center">
          <div className="font-serif text-3xl tracking-tight mb-3" style={{ color: NAVY_DEEP }}>
            Thank you!
          </div>
          <p className="text-slate-600">
            The Holistic Care team will reach out to you shortly!
          </p>
        </div>
      )}
    </main>
  );
}

function About({ go }) {
  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden" style={{ background: NAVY_DEEP }}>
        {/* Background SVG pattern */}
        <svg
          className="absolute inset-0 w-full h-full"
          style={{ opacity: 0.06 }}
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <pattern id="about-grid" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
              <circle cx="30" cy="30" r="1.5" fill="#ffffff" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#about-grid)" />
        </svg>

        {/* Decorative arc */}
        <svg
          className="absolute bottom-0 right-0"
          style={{ opacity: 0.08 }}
          width="480"
          height="480"
          viewBox="0 0 480 480"
        >
          <circle cx="480" cy="480" r="320" fill="none" stroke="#ffffff" strokeWidth="60" />
          <circle cx="480" cy="480" r="180" fill="none" stroke={ACCENT} strokeWidth="30" />
        </svg>

        <div className="relative max-w-5xl mx-auto px-6 pt-20 pb-24">
          <div className="eyebrow mb-5" style={{ color: "rgba(255,255,255,0.5)" }}>
            About us
          </div>
          <h1
            className="font-serif tracking-tight max-w-3xl mb-6"
            style={{ color: "#fff", fontSize: "clamp(2.6rem, 6vw, 4rem)", lineHeight: 1.05, letterSpacing: "-0.025em" }}
          >
            Confronting the chronic disease crisis, one{" "}
            <span className="font-serif-italic" style={{ color: ACCENT }}>adolescent</span>{" "}
            at a time.
          </h1>
          <p className="max-w-xl leading-relaxed" style={{ color: "rgba(255,255,255,0.65)", fontSize: "1.05rem" }}>
            A UCLA student-led initiative bringing free, AI-powered health coaching to the young people who need it most.
          </p>
        </div>
      </section>

      {/* Three pillars */}
      <section style={{ background: CREAM }}>
        <div className="max-w-5xl mx-auto px-6 py-14 grid md:grid-cols-3 gap-px">
          {[
            {
              icon: (
                <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke={ACCENT} strokeWidth="1.8">
                  <path d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                </svg>
              ),
              label: "UCLA student-led",
              desc: "Founded and run by students at the University of California, Los Angeles.",
            },
            {
              icon: (
                <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke={ACCENT} strokeWidth="1.8">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ),
              label: "Evidence-based",
              desc: "Grounded in UCLA Library research and clinical best practices.",
            },
            {
              icon: (
                <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke={ACCENT} strokeWidth="1.8">
                  <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ),
              label: "Free & accessible",
              desc: "Personalized guidance extended to the adolescents who need it most, at no cost.",
            },
          ].map((p, i) => (
            <div key={i} className="bg-white px-8 py-10">
              <div className="mb-4">{p.icon}</div>
              <div className="font-serif text-xl tracking-tight mb-2" style={{ color: NAVY_DEEP }}>
                {p.label}
              </div>
              <div className="text-sm leading-relaxed" style={{ color: NAVY_SOFT }}>
                {p.desc}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Mission copy */}
      <section className="max-w-3xl mx-auto px-6 py-20">
        <div className="eyebrow mb-8" style={{ color: NAVY_SOFT }}>Our story</div>

        <div className="space-y-8">
          <p className="leading-relaxed text-lg" style={{ color: NAVY_DEEP }}>
            Holistic Care is a UCLA student-led organization founded to confront the growing tide of
            lifestyle-related diseases — obesity, type 2 diabetes, and cardiovascular illness — that
            are increasingly shaping the futures of American youth. We believe these conditions are
            best addressed not in the clinic, but in adolescence, when habits are still being formed.
          </p>

          <div className="border-l-4 pl-7 py-1" style={{ borderColor: ACCENT }}>
            <p className="leading-relaxed text-lg" style={{ color: NAVY_DEEP }}>
              From this conviction grew the{" "}
              <span className="font-semibold" style={{ color: ACCENT }}>
                Lifestyle Intervention and Fitness Taskforce (LIFT)
              </span>
              : our flagship initiative, built on UCLA Library research and grounded in the communities
              we serve. The purpose of LIFT is to provide a free, accessible AI-based diet and health
              coach designed to combat the growing obesity and chronic disease crisis — extending
              personalized guidance to the adolescents who need it most.
            </p>
          </div>

          <p className="leading-relaxed text-lg" style={{ color: NAVY_DEEP }}>
            Our mission is to empower young people to take ownership of their health through
            personalized, evidence-based education — and to prove that proactive, sustained guidance
            can change the trajectory of a generation's wellbeing.
          </p>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 my-14">
          <div className="flex-1 h-px" style={{ background: "#E5E7EB" }} />
          <div className="w-2 h-2 rounded-full" style={{ background: ACCENT }} />
          <div className="flex-1 h-px" style={{ background: "#E5E7EB" }} />
        </div>

        {/* Bottom CTA */}
        <div className="text-center">
          <p className="text-sm leading-relaxed mb-5" style={{ color: NAVY_SOFT }}>
            Want to get involved or learn more about our work?
          </p>
          <button
            onClick={() => go("contact")}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-sm text-white text-sm font-medium hover:opacity-90 transition"
            style={{ background: NAVY_DEEP }}
          >
            Get in touch
          </button>
        </div>
      </section>
    </main>
  );
}

/* ============================================================
   CONTACT — Web3Forms (configured)
   ============================================================
   Submissions are delivered to CONTACT_EMAIL via Web3Forms.
   Free tier: 250 submissions/month.
*/
const WEB3FORMS_ACCESS_KEY = "673da618-ad0c-4625-bcca-9dde6c79b582";
const CONTACT_EMAIL = "holisticcareorg@gmail.com"; // mailto fallback target

function Contact() {
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError("");
    if (!message.trim()) {
      setError("Please write a message before sending.");
      return;
    }

    // Primary path: Web3Forms — delivers to CONTACT_EMAIL automatically
    if (WEB3FORMS_ACCESS_KEY) {
      setBusy(true);
      try {
        const res = await fetch("https://api.web3forms.com/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            access_key: WEB3FORMS_ACCESS_KEY,
            subject: "New LIFT contact-form message",
            from_name: "LIFT contact form",
            email: email || "(not provided)",
            message,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data.success === false) {
          throw new Error(data.message || `Status ${res.status}`);
        }
        setSent(true);
      } catch (e) {
        setError(`Couldn't send (${e.message}). Try the email link below.`);
      } finally {
        setBusy(false);
      }
      return;
    }

    // Fallback: open user's email client (only used if access key is missing)
    const subject = encodeURIComponent("Question for LIFT");
    const body = encodeURIComponent(
      `${message}\n\n— Sent via LIFT contact form\nFrom: ${email || "(no email provided)"}`
    );
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
    setSent(true);
  }

  // Mailto link users can click directly as an alternative
  const mailtoHref = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Question for LIFT")}${
    message.trim() ? `&body=${encodeURIComponent(message + (email ? `\n\nFrom: ${email}` : ""))}` : ""
  }`;

  return (
    <main className="max-w-2xl mx-auto px-6 py-20">
      <div className="eyebrow text-slate-500 mb-3">Contact</div>
      <h1 className="font-serif text-4xl md:text-5xl tracking-tight mb-6" style={{ color: NAVY }}>
        Any questions? Let us know:
      </h1>

      {sent ? (
        <div className="border border-slate-200 p-6 bg-slate-50">
          <div className="eyebrow text-slate-500 mb-2">Message {WEB3FORMS_ACCESS_KEY ? "received" : "ready to send"}</div>
          <p className="text-sm text-slate-700 leading-relaxed mb-4">
            {WEB3FORMS_ACCESS_KEY
              ? "Thanks — we'll get back to you as soon as we can."
              : "Your email app should have opened with the message pre-filled. Hit send to deliver it."}
          </p>
          <button
            onClick={() => {
              setSent(false);
              setMessage("");
              setEmail("");
            }}
            className="text-sm border border-slate-300 px-4 py-2 rounded-sm hover:border-slate-900 transition"
            style={{ color: NAVY }}
          >
            Send another
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          <div>
            <div className="micro text-slate-500 mb-1.5">Your email (optional)</div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full border border-slate-300 px-3 py-2.5 rounded-sm focus:outline-none focus:border-slate-900"
            />
          </div>
          <div>
            <div className="micro text-slate-500 mb-1.5">Message</div>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="What's on your mind?"
              rows={6}
              className="w-full border border-slate-300 px-3 py-2.5 rounded-sm focus:outline-none focus:border-slate-900 text-sm leading-relaxed"
            />
          </div>
          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-sm">
              {error}
            </div>
          )}
          <div className="flex flex-wrap gap-3 items-center">
            <button
              onClick={submit}
              disabled={busy}
              className="px-6 py-3 rounded-sm text-white text-sm tracking-wide hover:opacity-90 transition disabled:opacity-50"
              style={{ background: NAVY }}
            >
              {busy ? "Sending…" : "Send message"}
            </button>
            <a
              href={mailtoHref}
              className="text-sm hover:underline"
              style={{ color: NAVY }}
            >
              or email us directly →
            </a>
          </div>
          {!WEB3FORMS_ACCESS_KEY && (
            <div className="text-xs text-slate-500 leading-relaxed pt-2">
              Clicking Send will open your email app pre-filled.
            </div>
          )}
        </div>
      )}
    </main>
  );
}

/* ============================================================
   ASK LIFT — rule-based AI assistant (v1, no LLM call)
   ============================================================ */

function generateAskResponse(query, profile, results, dailyKcal) {
  const q = query.toLowerCase();
  const target = results?.target ?? null;
  const remaining = target ? Math.max(0, target - dailyKcal) : null;
  const macros = results?.macros;
  const goalLabel = GOALS.find((g) => g.id === profile?.goal)?.label;

  // Pattern matchers — order matters (most specific first)
  if (/(what|should).+(eat|have).*(now|today|next|right now|breakfast|lunch|dinner|snack)/i.test(q) || /^what (do|should) i eat/i.test(q)) {
    if (!target) return "I'll need your calorie target first — take the quick start or full survey.";
    const meal = /breakfast/i.test(q) ? "breakfast" : /lunch/i.test(q) ? "lunch" : /dinner/i.test(q) ? "dinner" : /snack/i.test(q) ? "snack" : "meal";
    const proteinPerMeal = macros ? Math.round(macros.proteinG / 3) : 30;
    const kcalForMeal = remaining !== null ? Math.round(Math.min(remaining, target * 0.4)) : 500;
    let recs = [];
    if (profile?.dietPatterns?.includes?.("Vegan") || profile?.diet?.includes?.("Vegan")) {
      recs = ["Tofu stir-fry with brown rice and broccoli", "Lentil curry with quinoa", "Chickpea grain bowl with tahini"];
    } else if (profile?.dietPatterns?.includes?.("Vegetarian") || profile?.diet?.includes?.("Vegetarian")) {
      recs = ["Greek yogurt with berries and nuts", "Veggie omelet with avocado toast", "Paneer tikka with brown rice"];
    } else if (profile?.dietPatterns?.includes?.("Halal") || profile?.diet?.includes?.("Halal")) {
      recs = ["Grilled chicken with rice and salad", "Beef and vegetable stew", "Salmon with roasted vegetables"];
    } else {
      recs = ["Grilled chicken with quinoa and roasted vegetables", "Salmon, sweet potato, and sautéed greens", "Lean steak with brown rice and broccoli"];
    }
    return `For ${meal}, aim for around ${kcalForMeal} kcal and ~${proteinPerMeal} g protein. A few ideas that fit your profile:\n\n• ${recs.join("\n• ")}\n\n${remaining !== null ? `You have ${remaining.toLocaleString()} kcal left today.` : ""}`;
  }

  if (/(ate|had|just had|eating|just ate)/i.test(q)) {
    // Try to match a food in the database
    const matchedFood = FOOD_DB.find((f) => q.includes(f.name.split(",")[0].toLowerCase()));
    if (matchedFood && remaining !== null) {
      const after = remaining - matchedFood.kcal;
      return `${matchedFood.name} is about ${matchedFood.kcal} kcal (${matchedFood.label}). After that you'd have roughly ${Math.max(0, after).toLocaleString()} kcal left today.\n\nAdd it from the meal logger to keep your day accurate.`;
    }
    return "Tell me what you ate and I can estimate calories. Or log it in the meal logger — the search will look it up for you.";
  }

  if (/(how much|how many).+(protein|carb|fat)/i.test(q)) {
    if (!macros) return "Take the survey to see your macro targets.";
    return `Your daily targets: ${macros.proteinG} g protein, ${macros.carbG} g carbs, ${macros.fatG} g fat.\n\nProtein is the one to anchor — hit it consistently, then let carbs and fat flex day to day.`;
  }

  if (/(remaining|left|how much).+(today|day|cal)/i.test(q) || /how (many|much) (calories|kcal)/i.test(q)) {
    if (!target) return "Take the survey first to set a calorie target.";
    return `You've logged ${dailyKcal.toLocaleString()} kcal so far. ${remaining.toLocaleString()} kcal remaining of your ${target.toLocaleString()} target.`;
  }

  if (/(workout|exercise|train|gym|run)/i.test(q)) {
    if (profile?.goal === "muscle") {
      return "For muscle gain: 4 strength sessions a week, hitting each muscle group ~twice. Add 1–2 short cardio days for heart health. Progressive overload is the lever — slightly more reps or weight each week.";
    }
    if (profile?.goal === "lose") {
      return "For fat loss: mix moderate cardio (3–4 days) with 2 strength sessions to keep muscle while you cut. Walking after meals is undervalued — adds up to a real calorie burn weekly.";
    }
    return "General target: ~150 min of moderate cardio per week plus 2 strength sessions. Pick activities you'll actually do — adherence beats optimization.";
  }

  if (/(weight|lose weight|gain weight|fat loss)/i.test(q)) {
    if (!target) return "Take the survey first — I'll size your calorie target around your weight goal.";
    return `Your daily target is ${target.toLocaleString()} kcal, set for ${goalLabel?.toLowerCase()}. Weigh yourself once a week, same time of day, not daily — daily fluctuations are mostly water.`;
  }

  if (/(snack|hungry)/i.test(q)) {
    return "Good go-tos: Greek yogurt with berries (~150 kcal), apple with peanut butter (~190 kcal), hard-boiled egg (~80 kcal), or a small handful of almonds (~165 kcal).";
  }

  if (/(water|drink|hydrat)/i.test(q)) {
    return "Roughly 2–3 liters/day is a fine baseline for most adults. Drink a glass before each meal — it helps right-size portions naturally.";
  }

  // Fallback
  return "I can help with: 'What should I eat for lunch?', 'I just had a banana', 'How much protein do I need?', 'How many calories left today?', or general questions about your plan. Try asking again with one of those.";
}

/* ============================================================
   SLEEP TRACKER
   ============================================================ */

// Compute hours between bedtime and waketime, accounting for cross-midnight nights
function computeSleepHours(bedtime, wakeTime) {
  if (!bedtime || !wakeTime) return 0;
  const [bh, bm] = bedtime.split(":").map(Number);
  const [wh, wm] = wakeTime.split(":").map(Number);
  let bedMin = bh * 60 + bm;
  let wakeMin = wh * 60 + wm;
  if (wakeMin <= bedMin) wakeMin += 24 * 60; // crossed midnight
  return Math.round(((wakeMin - bedMin) / 60) * 10) / 10;
}

// Standard deviation of bedtimes in minutes-from-midnight (lower = more consistent)
function bedtimeConsistency(entries) {
  if (entries.length < 2) return null;
  const minutes = entries.map((e) => {
    const [h, m] = e.bedtime.split(":").map(Number);
    // Anchor "evening" hours (18-23) to negative so they sit near 0–6 AM nights
    let mins = h * 60 + m;
    if (h >= 18) mins -= 24 * 60;
    return mins;
  });
  const mean = minutes.reduce((a, b) => a + b, 0) / minutes.length;
  const variance = minutes.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / minutes.length;
  return Math.round(Math.sqrt(variance));
}

// Personalized recommendations based on survey + recent sleep data
function buildSleepRecommendations(profile, entries) {
  const recs = [];
  const hours7 = entries.slice(-7);
  const avg = hours7.length ? hours7.reduce((a, b) => a + b.hours, 0) / hours7.length : null;
  const stdDev = bedtimeConsistency(hours7);

  // Duration shortfall
  if (avg !== null && avg < 7) {
    recs.push({
      tag: "Short sleep",
      tone: "warn",
      text: `You're averaging ${avg.toFixed(1)} hours over the last week. Adults under 7 hours regularly show measurable cognitive and metabolic impacts. Aim to push bedtime 15 minutes earlier each night until you hit 7+.`,
    });
  } else if (avg !== null && avg >= 9 && avg < 11) {
    recs.push({
      tag: "Long sleep",
      tone: "info",
      text: `You're averaging ${avg.toFixed(1)} hours. That's fine if you feel rested, but consistent 9+ hours can sometimes indicate underlying issues — worth mentioning to your clinician if you also feel fatigued.`,
    });
  }

  // Consistency
  if (stdDev !== null && stdDev > 60) {
    recs.push({
      tag: "Variable bedtime",
      tone: "warn",
      text: `Your bedtime varies by more than an hour night-to-night. Studies show consistency predicts mood and metabolic health independently of total hours. Try to land within a 30-minute window every night, including weekends.`,
    });
  }

  // Caffeine timing
  if (profile?.caffeineCups === "3-4 cups/day" || profile?.caffeineCups === "5+ cups/day") {
    recs.push({
      tag: "Caffeine",
      tone: "info",
      text: "You logged 3+ cups of caffeine per day. Caffeine has a 5–6 hour half-life — even a 3 PM coffee leaves a quarter-dose still active at midnight. Cut your last cup to before 2 PM for better sleep onset.",
    });
  }

  // Stress
  if (profile?.stressLevel >= 7) {
    recs.push({
      tag: "High stress",
      tone: "warn",
      text: `You rated stress ${profile.stressLevel}/10. High stress fragments sleep architecture even when you 'sleep through.' Consider a 5-minute wind-down: phone away, lights down, slow breathing for 2 minutes before bed.`,
    });
  }

  // Conditions
  if (profile?.conditions?.includes("Sleep apnea")) {
    recs.push({
      tag: "Sleep apnea",
      tone: "warn",
      text: "You flagged sleep apnea. CPAP adherence is the highest-leverage thing — even small gaps in usage degrade sleep quality measurably. If you're not using a CPAP, raise this with your clinician.",
    });
  }
  if (profile?.conditions?.includes("Anxiety") || profile?.conditions?.includes("Depression")) {
    recs.push({
      tag: "Mood",
      tone: "info",
      text: "Anxiety and depression both disrupt sleep continuity. CBT-I (cognitive behavioral therapy for insomnia) is the first-line non-medication treatment and is highly effective — ask your clinician about apps or in-person referrals.",
    });
  }

  // Medications
  if (profile?.medications?.includes("Stimulant (ADHD)")) {
    recs.push({
      tag: "Stimulants",
      tone: "info",
      text: "ADHD stimulants can suppress sleep onset for hours after the last dose. If your last dose is after lunch, ask your clinician about timing — sometimes a smaller, shorter-acting afternoon dose protects sleep.",
    });
  }
  if (profile?.medications?.includes("SSRI / SNRI")) {
    recs.push({
      tag: "SSRI / SNRI",
      tone: "info",
      text: "These can suppress REM sleep, which may not feel like a problem but can affect mood regulation over time. Morning dosing usually disturbs sleep less than evening — confirm with your prescriber.",
    });
  }
  if (profile?.medications?.includes("Beta-blocker")) {
    recs.push({
      tag: "Beta-blockers",
      tone: "info",
      text: "Beta-blockers can suppress melatonin and worsen sleep quality in some people. If you've noticed sleep changes since starting, it's worth raising with your prescriber.",
    });
  }

  // Alcohol
  if (profile?.alcoholUse === "Daily") {
    recs.push({
      tag: "Alcohol",
      tone: "warn",
      text: "Daily alcohol use, even moderate, fragments the second half of the night and reduces REM. Even one alcohol-free week typically produces noticeable sleep improvement.",
    });
  } else if (profile?.alcoholUse === "Weekly") {
    recs.push({
      tag: "Alcohol",
      tone: "info",
      text: "On nights you drink, expect lighter, more fragmented sleep. Stop drinking ~3 hours before bed to give your liver time to clear it before sleep onset.",
    });
  }

  // Goal interaction
  if (profile?.goal === "lose" && avg !== null && avg < 7) {
    recs.push({
      tag: "Sleep + fat loss",
      tone: "warn",
      text: "Short sleep is one of the strongest predictors of failed weight-loss attempts. Hunger hormones (ghrelin, leptin) shift after just one night of sleep loss. Fixing sleep often unsticks a stalled cut.",
    });
  }
  if (profile?.goal === "muscle" && avg !== null && avg < 7) {
    recs.push({
      tag: "Sleep + muscle",
      tone: "warn",
      text: "Most growth-hormone release happens in deep sleep. Under 7 hours measurably blunts strength gains within a week. Sleep is the cheapest performance enhancer there is.",
    });
  }

  // Universal baseline if nothing flagged
  if (recs.length === 0) {
    recs.push({
      tag: "Hygiene basics",
      tone: "info",
      text: "Consistent bedtime, cool room (65–68°F), no screens 30 minutes before bed, no caffeine after 2 PM. The fundamentals matter more than any product.",
    });
  }

  return recs;
}

function SleepTracker({ profile, sleepEntries, addSleepEntry, removeSleepEntry, currentUser, onOpenAuth }) {
  const [bedtime, setBedtime] = useState("23:00");
  const [wakeTime, setWakeTime] = useState("07:00");
  const [date, setDate] = useState(todayString());
  const [quality, setQuality] = useState(3);
  const [err, setErr] = useState("");

  // Sign-in gate — sleep history is only useful if it persists
  if (!currentUser) {
    return (
      <main className="max-w-2xl mx-auto px-6 py-16">
        <div className="eyebrow text-slate-500 mb-3">Sleep tracker</div>
        <h1 className="font-serif text-4xl tracking-tight mb-4" style={{ color: NAVY }}>
          Sign in to track your sleep.
        </h1>
        <p className="text-slate-600 leading-relaxed mb-8 max-w-md">
          Sleep tracking saves your nightly entries to your account so the trends and recommendations
          actually mean something. Create a free account or sign in to use it.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => onOpenAuth("signup")}
            className="px-6 py-3 rounded-sm text-white text-sm tracking-wide hover:opacity-90 transition"
            style={{ background: NAVY }}
          >
            Create account
          </button>
          <button
            onClick={() => onOpenAuth("signin")}
            className="px-6 py-3 rounded-sm text-sm tracking-wide border border-slate-300 hover:border-slate-900 transition"
            style={{ color: NAVY }}
          >
            Sign in
          </button>
        </div>
      </main>
    );
  }

  const sortedEntries = [...sleepEntries].sort((a, b) => a.date.localeCompare(b.date));
  const last7 = sortedEntries.slice(-7);

  // Stats
  const avgHours = last7.length ? last7.reduce((a, b) => a + b.hours, 0) / last7.length : null;
  const totalHoursLast7 = last7.reduce((a, b) => a + b.hours, 0);
  // Sleep debt: assume 8 hr/night need; debt = 7×8 - actual (clamped to ≥0)
  const sleepDebt = last7.length === 7 ? Math.max(0, 56 - totalHoursLast7) : null;
  const stdDev = bedtimeConsistency(last7);
  // Score 0–100: weighted blend of duration adequacy + consistency
  let healthScore = null;
  if (last7.length >= 3 && avgHours !== null) {
    const durScore = Math.min(100, Math.max(0, ((avgHours - 5) / 3) * 100)); // 5h = 0, 8h = 100
    const consistencyScore = stdDev === null ? 70 : Math.max(0, 100 - stdDev * 1.2); // 0 std = 100, 60min std = 28
    const qualityAvg = last7.reduce((a, b) => a + (b.quality || 3), 0) / last7.length;
    const qualityScore = (qualityAvg / 5) * 100;
    healthScore = Math.round(durScore * 0.45 + consistencyScore * 0.30 + qualityScore * 0.25);
  }

  function add() {
    setErr("");
    const hours = computeSleepHours(bedtime, wakeTime);
    if (!hours || hours < 1 || hours > 14) {
      setErr("Pick valid bedtime and wake time.");
      return;
    }
    if (sortedEntries.find((e) => e.date === date)) {
      if (!confirm("An entry already exists for that date. Replace it?")) return;
      // Replace by removing old then adding new — simpler than a true update
      const old = sortedEntries.find((e) => e.date === date);
      removeSleepEntry(old.id);
    }
    addSleepEntry({
      id: Date.now(),
      date,
      bedtime,
      wakeTime,
      hours,
      quality,
      timestamp: Date.now(),
    });
    setErr("");
  }

  const recs = buildSleepRecommendations(profile, sortedEntries);

  return (
    <main className="max-w-4xl mx-auto px-6 py-12">
      <div className="eyebrow text-slate-500 mb-3 flex items-center gap-2">
        <Moon className="w-3.5 h-3.5" /> Sleep tracker
      </div>
      <h1 className="font-serif text-4xl md:text-5xl tracking-tight mb-2" style={{ color: NAVY_DEEP }}>
        How you're <span className="font-serif-italic" style={{ color: ACCENT }}>resting</span>.
      </h1>
      <p className="mb-10 max-w-2xl text-slate-600">
        Log when you went to bed and woke up. Recommendations adapt to your survey answers — caffeine, stress, conditions, and medications all change what matters most.
      </p>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-px bg-slate-200 border border-slate-200 mb-10">
        <Stat
          label="Last night"
          value={sortedEntries.length ? sortedEntries[sortedEntries.length - 1].hours.toFixed(1) : "—"}
          suffix={sortedEntries.length ? "hr" : ""}
        />
        <Stat
          label="7-day avg"
          value={avgHours !== null ? avgHours.toFixed(1) : "—"}
          suffix={avgHours !== null ? "hr" : ""}
        />
        <Stat
          label="Sleep debt"
          value={sleepDebt !== null ? sleepDebt.toFixed(1) : "—"}
          suffix={sleepDebt !== null ? "hr" : ""}
        />
        <Stat
          label="Sleep score"
          value={healthScore !== null ? healthScore : "—"}
          suffix={healthScore !== null ? "/100" : ""}
        />
      </div>

      {/* Visualization: last 14 nights bar chart */}
      <div className="mb-10 border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="eyebrow text-slate-500">Last 14 nights</div>
          {stdDev !== null && (
            <div className="text-xs font-mono" style={{ color: NAVY_SOFT }}>
              Bedtime variance: ±{stdDev}m
            </div>
          )}
        </div>
        <SleepChart entries={sortedEntries.slice(-14)} />
      </div>

      {/* Log a night */}
      <div className="border border-slate-200 p-6 mb-10">
        <div className="eyebrow text-slate-500 mb-4">Log a night</div>
        <div className="grid md:grid-cols-4 gap-3">
          <div>
            <div className="micro text-slate-500 mb-1.5">Date</div>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={todayString()}
              className="w-full border border-slate-300 px-3 py-2.5 rounded-sm focus:outline-none focus:border-slate-900"
            />
          </div>
          <div>
            <div className="micro text-slate-500 mb-1.5">Bedtime</div>
            <input
              type="time"
              value={bedtime}
              onChange={(e) => setBedtime(e.target.value)}
              className="w-full border border-slate-300 px-3 py-2.5 rounded-sm focus:outline-none focus:border-slate-900"
            />
          </div>
          <div>
            <div className="micro text-slate-500 mb-1.5">Wake time</div>
            <input
              type="time"
              value={wakeTime}
              onChange={(e) => setWakeTime(e.target.value)}
              className="w-full border border-slate-300 px-3 py-2.5 rounded-sm focus:outline-none focus:border-slate-900"
            />
          </div>
          <div>
            <div className="micro text-slate-500 mb-1.5">Quality</div>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setQuality(n)}
                  className="w-8 h-8 rounded-sm text-sm transition"
                  style={{
                    background: quality >= n ? ACCENT : "#fff",
                    color: quality >= n ? "#fff" : NAVY_SOFT,
                    border: `1px solid ${quality >= n ? ACCENT : "#CBD5E1"}`,
                  }}
                  aria-label={`Quality ${n}`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="text-xs text-slate-500 mt-3">
          {bedtime && wakeTime && (
            <>That's <span style={{ color: NAVY }}>{computeSleepHours(bedtime, wakeTime).toFixed(1)} hours</span> of sleep.</>
          )}
        </div>
        {err && <div className="text-xs text-red-700 mt-2">{err}</div>}
        <button
          onClick={add}
          className="mt-4 px-5 py-2.5 rounded-sm text-white text-sm tracking-wide flex items-center gap-2 hover:opacity-90 transition"
          style={{ background: NAVY_DEEP }}
        >
          <Plus className="w-4 h-4" /> Log this night
        </button>
      </div>

      {/* Personalized recommendations */}
      <div className="mb-10">
        <div className="eyebrow text-slate-500 mb-3">Recommendations for you</div>
        <div className="space-y-3">
          {recs.map((r, i) => (
            <div
              key={i}
              className="border-l-2 p-5 rounded-sm"
              style={{
                borderColor: r.tone === "warn" ? ACCENT : NAVY,
                background: r.tone === "warn" ? ACCENT_SOFT : "#F8FAFC",
              }}
            >
              <div className="flex items-baseline gap-3 mb-1.5">
                <span
                  className="micro"
                  style={{ color: r.tone === "warn" ? ACCENT : NAVY }}
                >
                  {r.tag}
                </span>
              </div>
              <div className="text-sm leading-relaxed" style={{ color: NAVY_DEEP }}>{r.text}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent entries list */}
      {sortedEntries.length > 0 && (
        <div>
          <div className="eyebrow text-slate-500 mb-3">Recent entries</div>
          <ul className="border border-slate-200 max-h-72 overflow-auto">
            {[...sortedEntries].reverse().slice(0, 30).map((e) => (
              <li
                key={e.id}
                className="flex items-center justify-between gap-4 px-5 py-3 border-b border-slate-100 last:border-b-0"
              >
                <div className="flex items-baseline gap-4 flex-1 min-w-0">
                  <span className="text-sm font-medium" style={{ color: NAVY }}>
                    {formatShortDate(e.date)}
                  </span>
                  <span className="text-xs font-mono text-slate-500">
                    {e.bedtime} → {e.wakeTime}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium" style={{ color: NAVY }}>
                    {e.hours.toFixed(1)}h
                  </span>
                  <span className="text-xs" style={{ color: NAVY_SOFT }}>
                    {"●".repeat(e.quality)}{"○".repeat(5 - e.quality)}
                  </span>
                  <button
                    onClick={() => removeSleepEntry(e.id)}
                    className="text-slate-400 hover:text-slate-900 transition"
                    aria-label="Remove entry"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}

// Bar chart of sleep hours, 14 nights, dotted "8h goal" line
function SleepChart({ entries }) {
  const W = 720;
  const H = 200;
  const padL = 30;
  const padR = 16;
  const padT = 16;
  const padB = 36;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const slots = 14;
  // Build slot list — most recent 14 dates
  const days = lastNDays(slots);
  const byDate = entries.reduce((acc, e) => ({ ...acc, [e.date]: e }), {});
  const maxH = 12; // y-axis cap
  const barW = innerW / slots - 4;

  function y(h) {
    return padT + (1 - h / maxH) * innerH;
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      {/* 8-hour reference line */}
      <line
        x1={padL}
        x2={W - padR}
        y1={y(8)}
        y2={y(8)}
        stroke={NAVY}
        strokeDasharray="3 3"
        strokeWidth="1"
        opacity="0.4"
      />
      <text
        x={padL - 4}
        y={y(8) + 3}
        fontSize="10"
        fill={NAVY_SOFT}
        textAnchor="end"
        fontFamily="ui-monospace, monospace"
      >
        8h
      </text>
      {/* Bars */}
      {days.map((d, i) => {
        const e = byDate[d];
        const bx = padL + (innerW / slots) * i + 2;
        if (!e) {
          // Empty slot
          return (
            <g key={d}>
              <rect x={bx} y={padT + innerH - 2} width={barW} height={2} fill="#E5E7EB" rx="1" />
            </g>
          );
        }
        const h = e.hours;
        const bh = (Math.min(h, maxH) / maxH) * innerH;
        const by = padT + innerH - bh;
        const isShort = h < 7;
        const isLong = h >= 9;
        return (
          <g key={d}>
            <rect
              x={bx}
              y={by}
              width={barW}
              height={bh}
              fill={isShort ? ACCENT : isLong ? NAVY_SOFT : NAVY}
              rx="2"
            />
            <text
              x={bx + barW / 2}
              y={by - 4}
              fontSize="9"
              fill={NAVY_SOFT}
              textAnchor="middle"
              fontFamily="ui-monospace, monospace"
            >
              {h.toFixed(1)}
            </text>
            {(i === 0 || i === slots - 1 || i === Math.floor(slots / 2)) && (
              <text
                x={bx + barW / 2}
                y={H - 16}
                fontSize="9"
                fill={NAVY_SOFT}
                textAnchor="middle"
                fontFamily="ui-monospace, monospace"
              >
                {formatShortDate(d)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function buildLiftSystemPrompt(profile, results, dailyKcal) {
  const lines = [
    "You are LIFT, a friendly, evidence-based AI health coach inside a diet and exercise web app.",
    "You give nutrition and exercise guidance grounded in standard population guidelines (Mifflin–St Jeor for calorie targets, ACSM/CDC for activity).",
    "Style: warm, direct, practical. 2–4 short paragraphs max. No medical advice — for anything medical, refer the user to their clinician. Never give specific dosing for medications. If the user mentions self-harm, eating disorder behaviors, or a medical emergency, respond with empathy and direct them to professional help (988 Suicide & Crisis Lifeline in the US, or local emergency services).",
    "When the user asks how to handle cravings or temptations, give 3–4 concrete tactics: a substitute that satisfies the craving with fewer calories, a behavioral strategy (wait 15 min, drink water, go for a walk), and a 'if you do eat it, here's how to fit it into your day' permission line. Don't shame the user. Cravings are normal.",
    "When the user asks 'what should I eat,' give 2–3 specific options with rough calorie estimates, respecting their dietary preferences and allergies.",
    "Keep responses tight. Avoid bulleted lists unless the user asks for steps; prefer flowing prose.",
  ];
  if (profile) {
    lines.push("\n--- USER PROFILE ---");
    if (profile.age) lines.push(`Age: ${profile.age}`);
    if (profile.sex) lines.push(`Sex: ${profile.sex}`);
    if (profile.weightKg) lines.push(`Weight: ${Math.round(profile.weightKg)} kg`);
    if (profile.heightCm) lines.push(`Height: ${Math.round(profile.heightCm)} cm`);
    if (profile.goal) lines.push(`Goal: ${profile.goal}`);
    if (profile.activity) lines.push(`Activity level: ${profile.activity}`);
    if (Array.isArray(profile.diet) && profile.diet.length) lines.push(`Dietary preferences: ${profile.diet.join(", ")}`);
    if (Array.isArray(profile.conditions) && profile.conditions.length) lines.push(`Health conditions flagged: ${profile.conditions.join(", ")}`);
    if (Array.isArray(profile.allergies) && profile.allergies.length) lines.push(`Allergies (hard-block): ${profile.allergies.join(", ")}`);
    if (Array.isArray(profile.medications) && profile.medications.length) lines.push(`Medications: ${profile.medications.join(", ")}`);
    if (profile.personality) lines.push(`Movement style: ${profile.personality}`);
    if (profile.voice) lines.push(`Coaching voice preference: ${profile.voice}`);
    if (profile.limitations?.trim()) lines.push(`User-noted limitations: ${profile.limitations}`);
  }
  if (results) {
    lines.push("\n--- TODAY'S NUMBERS ---");
    lines.push(`Daily calorie target: ${results.target} kcal`);
    lines.push(`Maintenance (TDEE): ${results.tdee} kcal`);
    if (results.macros) lines.push(`Macro targets: ${results.macros.proteinG}g protein, ${results.macros.carbG}g carbs, ${results.macros.fatG}g fat`);
    lines.push(`Calories logged today: ${dailyKcal} kcal`);
    lines.push(`Calories remaining today: ${Math.max(0, results.target - dailyKcal)} kcal`);
  } else {
    lines.push("\nNote: User hasn't completed the intake survey yet, so you don't have their numbers. Encourage them to take the intake survey for more personalized guidance, but still answer the question well using general guidelines.");
  }
  return lines.join("\n");
}

async function callLiftLLM(userMessages, profile, results, dailyKcal) {
  // userMessages should be a clean alternating user/assistant array, with the last entry being a user turn.
  const system = buildLiftSystemPrompt(profile, results, dailyKcal);
  const res = await fetch("/api/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system,
      messages: userMessages,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${body.slice(0, 200)}`);
  }
  const data = await res.json();
  const text = (data.text || "").trim();
  if (!text) throw new Error("Empty response from API");
  return text;
}

function AskLift({ profile, results, dailyKcal, go }) {
  const [messages, setMessages] = useState([
    {
      role: "lift",
      text: profile
        ? `Hi${profile.firstName ? `, ${profile.firstName}` : ""}. I'm LIFT — your AI coach. Ask me anything about nutrition, cravings, workouts, or how to adjust your plan today. I'll use your survey profile to give specific answers.`
        : "Hi. I'm LIFT — your AI coach. Ask me anything about diet or exercise. I'll be most useful if you finish the intake survey first, but I can still help in the meantime.",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function ask(q) {
    if (!q.trim() || busy) return;
    setError("");
    // Build the API conversation: skip the canned greeting, then convert remaining lift→assistant.
    // Then append the new user turn.
    const apiHistory = messages
      .slice(1) // drop the initial canned greeting (it's not a real assistant turn)
      .map((m) => ({ role: m.role === "user" ? "user" : "assistant", content: m.text }));
    apiHistory.push({ role: "user", content: q });

    // Update the visible UI immediately
    setMessages((m) => [...m, { role: "user", text: q }]);
    setInput("");
    setBusy(true);

    try {
      const reply = await callLiftLLM(apiHistory, profile, results, dailyKcal);
      setMessages((m) => [...m, { role: "lift", text: reply }]);
    } catch (e) {
      const fallback = generateAskResponse(q, profile, results, dailyKcal);
      setMessages((m) => [...m, { role: "lift", text: fallback }]);
      setError(`AI service unreachable (${e.message || "unknown error"}). Used a rule-based answer.`);
    } finally {
      setBusy(false);
    }
  }

  function send() {
    ask(input);
  }

  const suggested = [
    "Ways to curb my sweet tooth after dinner",
    "What's a good high-protein lunch under 500 calories?",
    "How do I start working out if I haven't exercised in years?",
    "Is intermittent fasting a good idea for me?",
  ];

  return (
    <main className="max-w-2xl mx-auto px-6 py-12">
      <div className="eyebrow text-slate-500 mb-3 flex items-center gap-2">
        <Sparkles className="w-3.5 h-3.5" /> Ask LIFT
      </div>
      <h1 className="font-serif text-4xl tracking-tight mb-2" style={{ color: NAVY }}>
        Your AI health coach.
      </h1>
      <p className="text-slate-600 mb-8 text-sm leading-relaxed max-w-md">
        Ask anything about food, cravings, workouts, or your plan. Answers use your survey profile and
        today's intake when available.
      </p>

      {!results && (
        <div className="mb-6 border-l-2 p-4 bg-slate-50 text-sm" style={{ borderColor: NAVY, color: NAVY }}>
          For the most personalized answers, take the{" "}
          <button onClick={() => go("survey")} className="underline hover:no-underline">
            intake survey
          </button>{" "}
          first — but you can ask anything anyway.
        </div>
      )}

      {/* Conversation */}
      <div className="border border-slate-200 p-5 mb-4 space-y-4 min-h-64">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
            {m.role === "lift" && (
              <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center" style={{ background: NAVY }}>
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
            )}
            <div
              className="text-sm leading-relaxed whitespace-pre-line max-w-md"
              style={{
                color: m.role === "lift" ? NAVY : "#fff",
                background: m.role === "user" ? NAVY : "transparent",
                padding: m.role === "user" ? "8px 12px" : 0,
                borderRadius: m.role === "user" ? 4 : 0,
              }}
            >
              {m.text}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center" style={{ background: NAVY }}>
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="text-sm text-slate-500 italic">Thinking…</div>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-sm">
          {error}
        </div>
      )}

      {/* Suggested prompts */}
      {messages.length <= 1 && !busy && (
        <div className="mb-4 flex flex-wrap gap-2">
          {suggested.map((s) => (
            <button
              key={s}
              onClick={() => ask(s)}
              className="text-xs border border-slate-300 px-3 py-1.5 rounded-full hover:border-slate-900 transition text-left"
              style={{ color: NAVY }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Ask anything…"
          disabled={busy}
          className="flex-1 border border-slate-300 px-4 py-3 rounded-sm focus:outline-none focus:border-slate-900 disabled:bg-slate-50"
        />
        <button
          onClick={send}
          disabled={!input.trim() || busy}
          className="px-5 py-3 rounded-sm text-white flex items-center gap-2 hover:opacity-90 transition disabled:opacity-30"
          style={{ background: NAVY }}
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-6 text-xs text-slate-500 leading-relaxed">
        Powered by Claude. Not medical advice — talk to your clinician for medical decisions, especially
        around medications and conditions you flagged in the survey.
      </div>
    </main>
  );
}

/* ============================================================
   AUTH MODAL
   ============================================================ */

function AuthModal({ initialMode, onClose, onAuth }) {
  const [mode, setMode] = useState(initialMode || "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onEsc = (e) => e.key === "Escape" && !busy && onClose();
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [onClose, busy]);

  async function submit() {
    setError("");
    setSuccess("");
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setError("Email and password are required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError("That doesn't look like a valid email.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (mode === "signup" && password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error: signErr } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
        });
        if (signErr) {
          setError(signErr.message || "Couldn't create account.");
          return;
        }
        // Email confirmation is disabled, so a session should return immediately.
        // If for any reason it doesn't, sign in directly.
        let userData = null;
        if (!data.session) {
          const { error: siErr } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password,
          });
          if (siErr) {
            setError("Account created. Please sign in.");
            setMode("signin");
            return;
          }
        }
        userData = await loadUserData(cleanEmail);
        setSuccess("Account created! Signing you in…");
        setTimeout(() => onAuth(cleanEmail, userData, true), 700);
      } else {
        const { error: signErr } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
        if (signErr) {
          setError("Email or password is incorrect.");
          return;
        }
        const userData = await loadUserData(cleanEmail);
        setSuccess("Signed in! Loading your dashboard…");
        setTimeout(() => onAuth(cleanEmail, userData, false), 700);
      }
    } catch (e) {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function onKey(e) {
    if (e.key === "Enter") submit();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40"
      onClick={() => !busy && onClose()}
    >
      <div
        className="bg-white max-w-md w-full p-7 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          disabled={busy}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 disabled:opacity-30"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="eyebrow text-slate-500 mb-2">Account</div>
        <h2 className="font-serif text-3xl tracking-tight mb-2" style={{ color: NAVY }}>
          {mode === "signup" ? "Create account" : "Sign in"}
        </h2>
        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          {mode === "signup"
            ? "Saves your survey results and meal log so they're there next time you visit."
            : "Pick up where you left off — survey results and logged meals will load."}
        </p>

        <div className="space-y-4">
          <div>
            <div className="micro text-slate-500 mb-1.5">Email</div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={onKey}
              placeholder="you@example.com"
              autoComplete="email"
              className="w-full border border-slate-300 px-3 py-2.5 rounded-sm focus:outline-none focus:border-slate-900"
            />
          </div>
          <div>
            <div className="micro text-slate-500 mb-1.5">Password</div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={onKey}
              placeholder="At least 6 characters"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              className="w-full border border-slate-300 px-3 py-2.5 rounded-sm focus:outline-none focus:border-slate-900"
            />
          </div>
          {mode === "signup" && (
            <div>
              <div className="micro text-slate-500 mb-1.5">Confirm password</div>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                onKeyDown={onKey}
                placeholder="Repeat password"
                autoComplete="new-password"
                className="w-full border border-slate-300 px-3 py-2.5 rounded-sm focus:outline-none focus:border-slate-900"
              />
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-4 text-sm px-3 py-2 rounded-sm" style={{ color: "#15803D", background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
            {success}
          </div>
        )}

        <button
          onClick={submit}
          disabled={busy}
          className="w-full mt-6 px-5 py-3 rounded-sm text-white text-sm tracking-wide hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-50"
          style={{ background: NAVY }}
        >
          {busy ? "Working…" : mode === "signup" ? "Create account" : "Sign in"}
        </button>

        <div className="mt-5 text-center text-sm text-slate-600">
          {mode === "signup" ? (
            <>
              Already have an account?{" "}
              <button onClick={() => { setMode("signin"); setError(""); setSuccess(""); }} className="underline hover:no-underline" style={{ color: NAVY }}>
                Sign in
              </button>
            </>
          ) : (
            <>
              No account yet?{" "}
              <button onClick={() => { setMode("signup"); setError(""); setSuccess(""); }} className="underline hover:no-underline" style={{ color: NAVY }}>
                Create one
              </button>
            </>
          )}
        </div>

        <div className="mt-6 pt-5 border-t border-slate-200 text-xs text-slate-500 leading-relaxed">
          Prototype demo — please don't reuse a real password. Data is stored in this app's
          sandboxed storage and persists across visits.
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   ROOT
   ============================================================ */

export default function App() {
  const [view, setView] = useState("home");
  const [profile, setProfile] = useState(null);
  const [results, setResults] = useState(null);
  const [meals, setMeals] = useState([]);
  const [weights, setWeights] = useState([]);
  const [sleepEntries, setSleepEntries] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [authMode, setAuthMode] = useState(null); // null | 'signin' | 'signup'
  const [authReady, setAuthReady] = useState(false);

  const today = todayString();
  const todaysMeals = meals.filter((m) => (m.date || today) === today);
  const dailyKcal = todaysMeals.reduce((a, b) => a + b.kcal, 0);
  const dailyMacros = todaysMeals.reduce(
    (acc, m) => ({
      proteinG: acc.proteinG + (m.proteinG || 0),
      carbG: acc.carbG + (m.carbG || 0),
      fatG: acc.fatG + (m.fatG || 0),
    }),
    { proteinG: 0, carbG: 0, fatG: 0 }
  );

  // On mount: restore active Supabase session if there is one
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;
      if (session?.user?.email) {
        const email = session.user.email;
        const userData = migrateUserData(await loadUserData(email));
        if (cancelled) return;
        setCurrentUser(email);
        if (userData) {
          if (userData.profile) setProfile(userData.profile);
          if (userData.results) setResults(userData.results);
          if (Array.isArray(userData.meals)) setMeals(userData.meals);
          if (Array.isArray(userData.weights)) setWeights(userData.weights);
          if (Array.isArray(userData.sleepEntries)) setSleepEntries(userData.sleepEntries);
        }
      }
      setAuthReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist whenever signed-in user's data changes (after initial load)
  useEffect(() => {
    if (!authReady || !currentUser) return;
    saveUserData(currentUser, { profile, results, meals, weights, sleepEntries });
  }, [authReady, currentUser, profile, results, meals, weights, sleepEntries]);

  function go(v) {
    if (v === "results" && !results) v = "survey";
    setView(v);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "instant" });
  }

  function onSurveyComplete({ profile, results }) {
    setProfile(profile);
    setResults(results);
    go("results");
  }

  function onAuth(email, userData, isNewAccount) {
    setCurrentUser(email);
    const md = migrateUserData(userData);
    if (md && !isNewAccount) {
      setProfile(md.profile ?? null);
      setResults(md.results ?? null);
      setMeals(Array.isArray(md.meals) ? md.meals : []);
      setWeights(Array.isArray(md.weights) ? md.weights : []);
      setSleepEntries(Array.isArray(md.sleepEntries) ? md.sleepEntries : []);
    } else {
      saveUserData(email, { profile, results, meals, weights, sleepEntries });
    }
    setAuthMode(null);
  }

  async function onSignOut() {
    await supabase.auth.signOut();
    setCurrentUser(null);
  }

  function clearTodayMeals() {
    setMeals((arr) => arr.filter((m) => (m.date || today) !== today));
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#FFFFFF", color: NAVY }}>
      {/* Fonts and custom utilities */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght,SOFT,WONK@9..144,300..700,0..100,0..1&family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500&display=swap');
        body, html, #root {
          font-family: 'Geist', ui-sans-serif, system-ui, -apple-system, sans-serif;
          -webkit-font-smoothing: antialiased;
        }
        /* Display serif for hero headlines and large numbers */
        .font-serif {
          font-family: 'Fraunces', Georgia, serif;
          font-weight: 500;
          font-variation-settings: "opsz" 144, "SOFT" 30;
          letter-spacing: -0.02em;
        }
        .font-serif-italic {
          font-family: 'Fraunces', Georgia, serif;
          font-weight: 400;
          font-style: italic;
          font-variation-settings: "opsz" 144, "SOFT" 100;
        }
        .font-mono { font-family: 'Geist Mono', ui-monospace, SFMono-Regular, Menlo, monospace; }
        .eyebrow { font-family: 'Geist Mono', ui-monospace, monospace; font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase; }
        .micro { font-family: 'Geist Mono', ui-monospace, monospace; font-size: 10.5px; letter-spacing: 0.05em; text-transform: uppercase; }
        .pill-tag { font-family: 'Geist Mono', ui-monospace, monospace; font-size: 10px; letter-spacing: 0.05em; text-transform: uppercase; }
        input, textarea, button { font-family: inherit; }

        /* Soft drop shadow for elevated cards */
        .lift-card { box-shadow: 0 1px 3px rgba(15, 31, 68, 0.06), 0 8px 24px -8px rgba(15, 31, 68, 0.06); }

        /* Progress fill animation */
        @keyframes lift-fill {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
        .lift-progress-fill {
          transform-origin: left center;
          animation: lift-fill 0.9s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        /* Number count-up effect (pure CSS via fade+rise) */
        @keyframes lift-rise {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .lift-rise { animation: lift-rise 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards; }

        /* Floating button entrance */
        @keyframes lift-pop {
          from { opacity: 0; transform: scale(0.8) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .lift-pop { animation: lift-pop 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
      `}</style>

      <Header
        onHome={() => go("home")}
        view={view}
        currentUser={currentUser}
        onOpenAuth={(mode) => setAuthMode(mode)}
        onSignOut={onSignOut}
        go={go}
      />

      <div className="flex-1">
        {view === "home" && (
          <Home
            go={go}
            hasResults={!!results}
            currentUser={currentUser}
            onOpenAuth={(m) => setAuthMode(m)}
            profile={profile}
            results={results}
            dailyKcal={dailyKcal}
            dailyMacros={dailyMacros}
            weights={weights}
          />
        )}
        {view === "quickstart" && (
          <QuickStart onComplete={onSurveyComplete} onFull={() => go("survey")} />
        )}
        {view === "survey" && <Survey onComplete={onSurveyComplete} initial={null} />}
        {view === "results" && results && profile && (
          <Results profile={profile} results={results} go={go} dailyKcal={dailyKcal} />
        )}
        {view === "bmi" && <BMICalculator />}
        {view === "sleep" && (
          <SleepTracker
            profile={profile}
            sleepEntries={sleepEntries}
            addSleepEntry={(e) => setSleepEntries((arr) => [...arr, e])}
            removeSleepEntry={(id) => setSleepEntries((arr) => arr.filter((x) => x.id !== id))}
            currentUser={currentUser}
            onOpenAuth={(m) => setAuthMode(m)}
          />
        )}
        {view === "calculators" && <Calculators onComplete={onSurveyComplete} />}
        {view === "meals" && <MealPlans go={go} />}
        {view === "hotline" && <LiftHotline />}
        {view === "coaches" && <ProjectCoaches />}
        {view === "about" && <About go={go} />}
        {view === "contact" && <Contact />}
        {view === "ask" && <AskLift profile={profile} results={results} dailyKcal={dailyKcal} go={go} />}
        {view === "logger" && (
          <MealLogger
            results={results}
            meals={meals}
            addMeal={(m) => setMeals((arr) => [...arr, m])}
            removeMeal={(id) => setMeals((arr) => arr.filter((x) => x.id !== id))}
            clearTodayMeals={clearTodayMeals}
            currentUser={currentUser}
            onGoProgress={() => go("progress")}
          />
        )}
        {view === "progress" && (
          <Progress
            profile={profile}
            results={results}
            meals={meals}
            weights={weights}
            addWeight={(w) => setWeights((arr) => [...arr, w])}
            removeWeight={(id) => setWeights((arr) => arr.filter((x) => x.id !== id))}
            currentUser={currentUser}
            onOpenAuth={(m) => setAuthMode(m)}
            go={go}
          />
        )}
      </div>

      <Footer />

      {/* Floating Ask LIFT button — always one tap away */}
      {view !== "ask" && view !== "survey" && (
        <button
          onClick={() => go("ask")}
          className="fixed bottom-6 right-6 z-30 lift-pop flex items-center gap-2 pl-4 pr-5 py-3 rounded-full text-white text-sm font-medium hover:opacity-90 transition"
          style={{
            background: NAVY_DEEP,
            boxShadow: "0 4px 16px rgba(15, 31, 68, 0.25), 0 1px 3px rgba(15, 31, 68, 0.1)",
          }}
          aria-label="Ask LIFT"
        >
          <span
            className="w-7 h-7 rounded-full flex items-center justify-center -ml-1"
            style={{ background: ACCENT }}
          >
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </span>
          Ask LIFT
        </button>
      )}

      {authMode && (
        <AuthModal
          initialMode={authMode}
          onClose={() => setAuthMode(null)}
          onAuth={onAuth}
        />
      )}
    </div>
  );
}
