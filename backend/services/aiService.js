const OpenAI = require('openai');
const nutritionService = require('./nutritionService');

// ==========================================
// MOCK AI DATA & LOGIC (Robust Local Fallback)
// ==========================================

const MOCK_FOODS = [
  { name: 'chapati', synonyms: ['roti', 'phulka', 'chapatis'], calories: 104, protein: 3, carbs: 22, fat: 0.4, fiber: 2 },
  { name: 'dal', synonyms: ['dhal', 'lentils', 'lentil curry'], calories: 150, protein: 8, carbs: 24, fat: 2, fiber: 6 },
  { name: 'egg', synonyms: ['eggs', 'boiled egg', 'fried egg', 'scrambled egg'], calories: 78, protein: 6, carbs: 0.6, fat: 5, fiber: 0 },
  { name: 'chicken breast', synonyms: ['chicken', 'chicken tikka', 'cooked chicken'], calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0 },
  { name: 'white rice', synonyms: ['rice', 'chawal', 'steamed rice'], calories: 205, protein: 4.2, carbs: 44.5, fat: 0.4, fiber: 0.6 },
  { name: 'brown rice', synonyms: ['unpolished rice'], calories: 216, protein: 5, carbs: 44, fat: 1.8, fiber: 3.5 },
  { name: 'paneer', synonyms: ['cottage cheese'], calories: 265, protein: 18, carbs: 1.2, fat: 20, fiber: 0 },
  { name: 'milk', synonyms: ['cow milk', 'milk glass'], calories: 150, protein: 8, carbs: 12, fat: 8, fiber: 0 },
  { name: 'banana', synonyms: ['bananas'], calories: 105, protein: 1.3, carbs: 27, fat: 0.3, fiber: 3 },
  { name: 'apple', synonyms: ['apples'], calories: 95, protein: 0.5, carbs: 25, fat: 0.3, fiber: 4.4 },
  { name: 'salad', synonyms: ['green salad', 'vegetables', 'cucumber'], calories: 50, protein: 1, carbs: 10, fat: 0, fiber: 3 },
  { name: 'pizza', synonyms: ['pizzas', 'pizza slice'], calories: 285, protein: 12, carbs: 36, fat: 10, fiber: 2.5 },
  { name: 'burger', synonyms: ['burgers'], calories: 354, protein: 17, carbs: 29, fat: 17, fiber: 2 },
  { name: 'spinach', synonyms: ['palak'], calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, fiber: 2.2 },
  { name: 'tomato', synonyms: ['tomatoes'], calories: 22, protein: 1, carbs: 5, fat: 0.2, fiber: 1.5 },
  { name: 'onion', synonyms: ['onions'], calories: 44, protein: 1.1, carbs: 10, fat: 0.1, fiber: 1.9 },
  { name: 'oatmeal', synonyms: ['oats', 'porridge'], calories: 150, protein: 6, carbs: 27, fat: 4, fiber: 4 },
  { name: 'whey protein', synonyms: ['protein scoop', 'whey scoop'], calories: 120, protein: 24, carbs: 3, fat: 1.5, fiber: 0 }
];

const MOCK_RECIPES = [
  {
    name: 'Paneer Bhurji',
    ingredients: ['150g Paneer', '1 Onion', '1 Tomato', '1 tsp Oil', 'Spices'],
    instructions: [
      'Crumble the paneer and set aside.',
      'Heat oil in a pan, sauté finely chopped onions and tomatoes.',
      'Add spices (turmeric, chili powder, garam masala) and salt.',
      'Add crumbled paneer, cook for 5 minutes stirring constantly.',
      'Garnish with coriander and serve hot.'
    ],
    calories: 320, protein: 18, carbs: 12, fat: 22, fiber: 2.5,
    suitability: ['vegetarian', 'gluten-free'],
    requiredPantry: ['paneer', 'onion', 'tomato']
  },
  {
    name: 'Egg Fried Rice',
    ingredients: ['2 Eggs', '1 cup Cooked Rice', '1/2 Onion', '1 tbsp Soy Sauce', '1 tsp Oil'],
    instructions: [
      'Heat oil in a wok, scramble the eggs and set aside.',
      'In the same wok, sauté chopped onions until soft.',
      'Add cooked rice, scrambled eggs, and soy sauce.',
      'Stir fry on high heat for 3-4 minutes.',
      'Garnish with spring onions and enjoy.'
    ],
    calories: 450, protein: 18, carbs: 52, fat: 18, fiber: 1.5,
    suitability: ['gluten-free'], // if using GF soy sauce
    requiredPantry: ['egg', 'rice', 'onion']
  },
  {
    name: 'Spinach Tomato Salad',
    ingredients: ['2 cups Spinach', '1 Tomato', '1/2 Onion', '1 tbsp Olive Oil', 'Lemon juice'],
    instructions: [
      'Wash spinach leaves thoroughly.',
      'Chop tomato and onion into bite-sized pieces.',
      'Toss spinach, tomato, onion together in a bowl.',
      'Drizzle with olive oil, lemon juice, salt, and black pepper.'
    ],
    calories: 120, protein: 3, carbs: 10, fat: 8, fiber: 3.5,
    suitability: ['vegan', 'vegetarian', 'gluten-free'],
    requiredPantry: ['spinach', 'tomato', 'onion']
  },
  {
    name: 'Paneer Tikka Salad',
    ingredients: ['100g Paneer', '1 cup Spinach', '1 Onion', '1 Tomato', '2 tbsp Yogurt'],
    instructions: [
      'Cut paneer, onions, and tomatoes into cubes.',
      'Marinate in yogurt, red chili powder, and salt for 10 minutes.',
      'Roast the cubes on a pan until golden brown.',
      'Serve on a bed of fresh spinach leaves.'
    ],
    calories: 290, protein: 16, carbs: 12, fat: 18, fiber: 2.8,
    suitability: ['vegetarian', 'gluten-free'],
    requiredPantry: ['paneer', 'spinach', 'onion', 'tomato']
  },
  {
    name: 'High Protein Scrambled Eggs',
    ingredients: ['3 Eggs', '50ml Milk', '1/2 Onion', '1 Tomato', '1 tsp Butter'],
    instructions: [
      'Whisk eggs and milk in a bowl with a pinch of salt.',
      'Melt butter in a pan and sauté chopped onions and tomatoes.',
      'Pour in egg mixture, cook on low heat, scraping gently to form curds.',
      'Serve with a sprinkle of pepper.'
    ],
    calories: 280, protein: 20, carbs: 8, fat: 19, fiber: 1.2,
    suitability: ['vegetarian', 'gluten-free'],
    requiredPantry: ['egg', 'milk', 'onion', 'tomato']
  },
  {
    name: 'Oatmeal with Banana',
    ingredients: ['1 cup Oats', '1 cup Milk', '1 Banana', '1 tsp Honey'],
    instructions: [
      'Boil oats in milk until thick and creamy.',
      'Pour into a bowl, slice banana on top.',
      'Drizzle with honey and a dash of cinnamon.'
    ],
    calories: 380, protein: 12, carbs: 68, fat: 6, fiber: 7.5,
    suitability: ['vegetarian'],
    requiredPantry: ['oatmeal', 'milk', 'banana']
  },
  {
    name: 'Dal Rice (Lentil Bowl)',
    ingredients: ['1 cup Cooked Rice', '1 cup Dal (Lentil Soup)', '1/2 Onion', 'Spices'],
    instructions: [
      'Prepare warm dal with cumin and mustard seed tempering.',
      'Serve dal over fresh hot white or brown rice.',
      'Accompany with sliced onions and a squeeze of lemon.'
    ],
    calories: 360, protein: 12, carbs: 66, fat: 3, fiber: 6.8,
    suitability: ['vegan', 'vegetarian', 'gluten-free'],
    requiredPantry: ['dal', 'rice', 'onion']
  },
  {
    name: 'Chicken and Spinach Stir Fry',
    ingredients: ['150g Chicken Breast', '2 cups Spinach', '1 Onion', '1 tsp Oil', 'Garlic'],
    instructions: [
      'Cut chicken breast into thin strips.',
      'Heat oil in a pan, sauté minced garlic and sliced onions.',
      'Add chicken, stir fry until cooked through (6-8 minutes).',
      'Add spinach leaves, cook until wilted. Season with salt and pepper.'
    ],
    calories: 270, protein: 34, carbs: 8, fat: 9, fiber: 2.8,
    suitability: ['gluten-free'],
    requiredPantry: ['chicken', 'spinach', 'onion']
  }
];

// Helper to parse natural language using mock system
async function mockParseMeal(text) {
  const words = text.toLowerCase().split(/\s+/);
  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;
  let totalFiber = 0;
  const itemsMatched = [];

  const numberWordMap = { one: 1, two: 2, three: 3, four: 4, five: 5, a: 1, an: 1 };
  let pendingQuantity = 1;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const cleanWord = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '');

    const num = parseInt(cleanWord, 10);
    if (!isNaN(num)) {
      pendingQuantity = num;
      continue;
    } else if (numberWordMap[cleanWord] !== undefined) {
      pendingQuantity = numberWordMap[cleanWord];
      continue;
    }

    const matchedFood = MOCK_FOODS.find(f => {
      const exactMatch = f.name === cleanWord || f.synonyms.includes(cleanWord);
      if (exactMatch) return true;
      if (cleanWord.length > 2) {
        return f.name.includes(cleanWord) || f.synonyms.some(syn => syn.includes(cleanWord));
      }
      return false;
    });

    if (matchedFood) {
      const q = pendingQuantity;
      totalCalories += matchedFood.calories * q;
      totalProtein += matchedFood.protein * q;
      totalCarbs += matchedFood.carbs * q;
      totalFat += matchedFood.fat * q;
      totalFiber += matchedFood.fiber * q;
      itemsMatched.push({ name: matchedFood.name, grams: 100 * q, baseGrams: 100 });
      pendingQuantity = 1;
    }
  }

  if (itemsMatched.length === 0) {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = text.charCodeAt(i) + ((hash << 5) - hash);
    }
    const absHash = Math.abs(hash);
    totalCalories = (absHash % 300) + 150;
    totalProtein = (absHash % 15) + 5;
    totalCarbs = (absHash % 35) + 15;
    totalFat = (absHash % 10) + 3;
    totalFiber = (absHash % 5) + 1;
    itemsMatched.push({ name: text.trim(), grams: 150, baseGrams: 150 });
  }

  const baseIngredients = await Promise.all(itemsMatched.map(async item => {
    const lookup = await nutritionService.getIngredientNutrition(item.name) || { calories: 150, protein: 5, carbs: 20, fat: 3, fiber: 1 };
    const mult = item.grams / 100;
    return {
      name: item.name,
      baseGrams: item.baseGrams,
      grams: item.grams,
      calories: Math.round(lookup.calories * mult),
      protein: Math.round(lookup.protein * mult),
      carbs: Math.round(lookup.carbs * mult),
      fat: Math.round(lookup.fat * mult),
      fiber: Math.round(lookup.fiber * mult)
    };
  }));

  return {
    foodName: itemsMatched.map(item => item.name).join(', '),
    calories: Math.round(totalCalories),
    protein: Math.round(totalProtein),
    carbs: Math.round(totalCarbs),
    fat: Math.round(totalFat),
    fiber: Math.round(totalFiber),
    baseCalories: Math.round(totalCalories),
    baseProtein: Math.round(totalProtein),
    baseCarbs: Math.round(totalCarbs),
    baseFat: Math.round(totalFat),
    baseFiber: Math.round(totalFiber),
    servingSizeMultiplier: 1,
    customGrams: null,
    confidenceScore: 'medium',
    assumptions: '• Mock estimation from database synonyms.',
    ingredients: baseIngredients
  };
}

// Helper to filter and match mock recipes
function mockGetRecipes(params) {
  const { pantryItems = [], goal = '', dietaryRestrictions = [] } = params;
  
  // Normalise dietary restrictions
  const restrictions = dietaryRestrictions.map(r => r.toLowerCase());
  const pantryNames = pantryItems.map(item => item.name.toLowerCase());

  // Score recipes
  const scoredRecipes = MOCK_RECIPES.map(recipe => {
    let score = 0;
    
    // Check dietary restriction compatibility (must match all user restrictions)
    let isCompatible = true;
    for (const res of restrictions) {
      if (res !== 'none' && !recipe.suitability.includes(res)) {
        isCompatible = false;
        break;
      }
    }
    
    if (!isCompatible) return null;

    // Check ingredients overlap
    let matchingIngredientsCount = 0;
    for (const req of recipe.requiredPantry) {
      if (pantryNames.some(p => p.includes(req) || req.includes(p))) {
        matchingIngredientsCount++;
      }
    }

    score += matchingIngredientsCount * 10;

    // Goal adjustments
    if (goal === 'weight_loss' && recipe.calories < 300) {
      score += 5;
    } else if ((goal === 'weight_gain' || goal === 'muscle_gain') && recipe.protein > 15) {
      score += 5;
    }

    return { ...recipe, matchCount: matchingIngredientsCount, score };
  })
  .filter(r => r !== null)
  .sort((a, b) => b.score - a.score);

  // Return at least 3 recipes (fill with default compatible if needed)
  return scoredRecipes.slice(0, 3).map(sr => ({
    name: sr.name,
    ingredients: sr.ingredients,
    instructions: sr.instructions,
    calories: sr.calories,
    protein: sr.protein,
    carbs: sr.carbs,
    fat: sr.fat,
    fiber: sr.fiber
  }));
}

// ==========================================
// CLIENT INSTANTIATORS
// ==========================================

function getGroqClient(customKeyConfig) {
  if (customKeyConfig && customKeyConfig.provider === 'groq' && customKeyConfig.key) {
    return new OpenAI({
      apiKey: customKeyConfig.key,
      baseURL: 'https://api.groq.com/openai/v1'
    });
  }
  if (process.env.GROQ_API_KEY) {
    return new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1'
    });
  }
  return null;
}

// ==========================================
// MAIN SERVICE EXPORTS
// ==========================================

/**
 * Natural language meal analysis
 */
exports.analyzeMealLog = async (mealText, customKeyConfig) => {
  // 1. Try Groq
  const groq = getGroqClient(customKeyConfig);
  if (groq) {
    try {
      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `You are an expert nutritionist. Analyze this food entry: "${mealText}".
            Extract the primary dish/food name. Also extract any quantity specified, like "serving size multiplier" or "custom grams".
            If the dish is a custom or composed dish (like a mixed plate, or something not simple like a single fruit), you must also estimate its typical ingredients and their weights in grams.
            Output ONLY a valid JSON object matching this schema:
            {
              "dishName": "name of the dish or food item",
              "quantityText": "description of quantity e.g. 1 cup, 200g, vague",
              "servingSizeMultiplier": number (default 1),
              "customGrams": number or null (if user explicitly specified weight in grams, e.g. 150),
              "confidenceScore": "high" | "medium" | "low" (high if exact weight/serving is specified, medium if standard portion, low if vague/some),
              "ingredients": [
                { "name": "ingredient name", "grams": number }
              ]
            }`
          },
          {
            role: 'user',
            content: `Food log: "${mealText}"`
          }
        ]
      });

      const parsed = JSON.parse(response.choices[0].message.content);
      
      const cleanDish = (parsed.dishName || '').toLowerCase().trim();
      const templateKeys = Object.keys(require('../config/nutritionDb').RECIPE_TEMPLATES);
      const isTemplateMatch = templateKeys.some(key => cleanDish.includes(key) || key.includes(cleanDish));
      const isSingleIngredient = await nutritionService.getIngredientNutrition(cleanDish);

      if (isTemplateMatch || isSingleIngredient) {
        return await nutritionService.estimateNutrition(
          parsed.dishName,
          parsed.quantityText || '',
          parsed.servingSizeMultiplier || 1,
          parsed.customGrams || null,
          parsed.confidenceScore || 'medium'
        );
      } else {
        return await nutritionService.estimateCustomIngredientList(
          parsed.dishName,
          parsed.ingredients || [],
          parsed.servingSizeMultiplier || 1,
          parsed.customGrams || null,
          parsed.confidenceScore || 'medium'
        );
      }
    } catch (e) {
      console.warn("Groq meal analysis failed, trying fallback...", e.message);
    }
  }

  // 2. Mock Fallback
  return await mockParseMeal(mealText);
};

/**
 * Recipe recommendations matching target criteria
 */
exports.generateRecipeRecommendations = async (params, customKeyConfig) => {
  const { pantryItems, goal, dietaryRestrictions, favoriteCuisines, remainingCalories } = params;

  // 1. Try Groq
  const groq = getGroqClient(customKeyConfig);
  if (groq) {
    try {
      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: 'You are an expert chef assistant. Return ONLY a JSON object with key "recipes" containing an array of 3 recipe objects. Each recipe must list name, ingredients (array of strings), instructions (array of strings), calories, protein, carbs, fat, fiber.'
          },
          {
            role: 'user',
            content: `Pantry ingredients: ${JSON.stringify(pantryItems.map(p => ({ name: p.name, qty: p.quantity, unit: p.unit })))}. Goal: ${goal}. Restrictions: ${JSON.stringify(dietaryRestrictions)}. Favorite cuisines: ${JSON.stringify(favoriteCuisines)}. Remaining calories: ${remainingCalories}. Recommend 3 recipes.`
          }
        ]
      });
      const data = JSON.parse(response.choices[0].message.content);
      return data.recipes || data;
    } catch (e) {
      console.warn("Groq recipe recommendation failed, trying fallback...", e.message);
    }
  }

  // 2. Mock Fallback
  return mockGetRecipes({ pantryItems, goal, dietaryRestrictions });
};

/**
 * Conversational Chatbot
 */
exports.generateChatResponse = async (chatHistory, userContext, customKeyConfig) => {
  const systemPrompt = `You are "NutriMate AI", an intelligent kitchen assistant and personal dietitian.
  Here is the User Context:
  - Name: ${userContext.name}
  - Health Goal: ${userContext.goal}
  - Calorie Target: ${userContext.calorieTarget} kcal/day
  - Consumed Today: ${userContext.consumedCalories} kcal (Remaining: ${userContext.calorieTarget - userContext.consumedCalories} kcal)
  - Remaining Macros: Protein: ${userContext.remainingProtein}g, Carbs: ${userContext.remainingCarbs}g, Fat: ${userContext.remainingFat}g
  - Dietary Restrictions: ${JSON.stringify(userContext.dietaryRestrictions)}
  - Pantry/Fridge Ingredients: ${JSON.stringify(userContext.pantryItems.map(p => `${p.name} (${p.quantity} ${p.unit})`))}
  - Ingredients expiring in next 3 days: ${JSON.stringify(userContext.expiringItems.map(p => p.name))}
  - Preferred cuisines: ${JSON.stringify(userContext.favoriteCuisines)}
  
  Guidelines:
  1. Be friendly, encouraging, and supportive.
  2. Help users prepare meals using their available pantry items, especially ingredients near expiration.
  3. Keep calorie targets and dietary restrictions strictly in mind.
  4. Formulate structured, neat replies using clean formatting. Keep recipes details clean.`;

  // 1. Try Groq
  const groq = getGroqClient(customKeyConfig);
  if (groq) {
    try {
      const messages = [
        { role: 'system', content: systemPrompt },
        ...chatHistory.map(msg => ({ role: msg.role, content: msg.content }))
      ];
      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages
      });
      return response.choices[0].message.content;
    } catch (e) {
      console.warn("Groq chat failed, trying fallback...", e.message);
    }
  }

  // 3. Mock Fallback Chat Engine
  const lastMsg = chatHistory[chatHistory.length - 1]?.content?.toLowerCase() || "";
  
  // Expiring items prompt check
  let responseText = `Hi ${userContext.name}! I am NutriMate AI, your kitchen copilot. `;
  
  if (userContext.expiringItems.length > 0) {
    responseText += `Note: Your **${userContext.expiringItems[0].name}** is expiring soon! I highly recommend using it. `;
  }

  if (lastMsg.includes('hello') || lastMsg.includes('hi')) {
    responseText += `How can I help you today? You have **${Math.max(0, userContext.calorieTarget - userContext.consumedCalories)} kcal** remaining in your daily budget. Feel free to list what ingredients you want to cook with, or ask me for a high-protein recipe!`;
  } else if (lastMsg.includes('pantry') || lastMsg.includes('fridge') || lastMsg.includes('ingredient')) {
    if (userContext.pantryItems.length > 0) {
      responseText += `Your pantry currently has: ${userContext.pantryItems.map(p => p.name).join(', ')}. What would you like to make with these? You could ask "give me a recipe using ${userContext.pantryItems[0].name}".`;
    } else {
      responseText += `Your pantry is empty! Head to the Pantry page to stock up some ingredients, and I will recommend recipes matching what you have.`;
    }
  } else if (lastMsg.includes('recipe') || lastMsg.includes('cook') || lastMsg.includes('eat') || lastMsg.includes('dinner') || lastMsg.includes('lunch') || lastMsg.includes('breakfast')) {
    // Generate recipes mock
    const recipes = mockGetRecipes({
      pantryItems: userContext.pantryItems,
      goal: userContext.goal,
      dietaryRestrictions: userContext.dietaryRestrictions
    });
    
    if (recipes.length > 0) {
      const selected = recipes[0];
      responseText += `Based on your remaining budget and active profile, here is a recommended dish:
      
### **${selected.name}**
* **Prep Ingredients**: ${selected.ingredients.join(', ')}
* **Macros**: Calories: ${selected.calories} kcal | Protein: ${selected.protein}g | Carbs: ${selected.carbs}g | Fat: ${selected.fat}g
      
**Instructions**:
${selected.instructions.map((step, idx) => `${idx + 1}. ${step}`).join('\n')}`;
    } else {
      responseText += `I couldn't find a direct recipe matching your criteria. Let's try cooking some oatmeal or eggs! How about scrambled eggs with onions and tomatoes? It provides around 280 kcal and 20g of protein.`;
    }
  } else {
    responseText += `I've noted that. Based on your target goal of **${userContext.goal.replace('_', ' ')}**, I recommend balancing your meals with high fiber veggies and adequate protein. Let me know if you would like me to suggest a recipe from your pantry, generate a weekly plan, or analyze what you ate!`;
  }

  return responseText;
};

/**
 * 7-Day Weekly Meal Planner
 */
exports.generateWeeklyMealPlan = async (params, customKeyConfig) => {
  const { goal, dietaryRestrictions, favoriteCuisines, pantryItems } = params;

  // 1. Try Groq
  const groq = getGroqClient(customKeyConfig);
  if (groq) {
    try {
      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `You are an expert meal planner. Output ONLY a valid JSON object containing a "plan" key with an array of 7 day items. Each day item has "day" (e.g. Monday) and "meals" object containing breakfast, lunch, dinner, and snack details (name, calories, protein, carbs, fat, recipe description).
            The structure must match this schema:
            {
              "plan": [
                {
                  "day": "Monday",
                  "meals": {
                    "breakfast": { "name": "Meal Name", "calories": number, "protein": number, "carbs": number, "fat": number, "recipe": "brief desc" },
                    "lunch": { "name": "Meal Name", "calories": number, "protein": number, "carbs": number, "fat": number, "recipe": "brief desc" },
                    "dinner": { "name": "Meal Name", "calories": number, "protein": number, "carbs": number, "fat": number, "recipe": "brief desc" },
                    "snack": { "name": "Meal Name", "calories": number, "protein": number, "carbs": number, "fat": number, "recipe": "brief desc" }
                  }
                }
              ]
            }`
          },
          {
            role: 'user',
            content: `Plan weekly menu for goal: ${goal}, restrictions: ${JSON.stringify(dietaryRestrictions)}, cuisines: ${JSON.stringify(favoriteCuisines)}, pantry: ${JSON.stringify(pantryItems.map(p => p.name))}.`
          }
        ]
      });
      const data = JSON.parse(response.choices[0].message.content);
      return data.plan || data.days || data;
    } catch (e) {
      console.warn("Groq weekly planner failed, trying fallback...", e.message);
    }
  }

  // 3. Mock Fallback Planner
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const plan = days.map((day, index) => {
    // Generate slightly varied calorie/macro sets based on goal
    let calMultiplier = 1;
    if (goal === 'weight_loss') calMultiplier = 0.8;
    else if (goal === 'weight_gain' || goal === 'muscle_gain') calMultiplier = 1.25;

    // Pick recipes based on day index
    const bRecipe = MOCK_RECIPES[index % MOCK_RECIPES.length];
    const lRecipe = MOCK_RECIPES[(index + 1) % MOCK_RECIPES.length];
    const dRecipe = MOCK_RECIPES[(index + 2) % MOCK_RECIPES.length];

    return {
      day,
      meals: {
        breakfast: {
          name: bRecipe.name === 'Chicken and Spinach Stir Fry' ? 'Scrambled Eggs on Toast' : bRecipe.name,
          calories: Math.round(280 * calMultiplier),
          protein: Math.round(15 * calMultiplier),
          carbs: Math.round(30 * calMultiplier),
          fat: Math.round(10 * calMultiplier),
          recipe: 'Whisk and scramble eggs in pan with sliced veggies.'
        },
        lunch: {
          name: lRecipe.name,
          calories: Math.round(lRecipe.calories * calMultiplier),
          protein: Math.round(lRecipe.protein * calMultiplier),
          carbs: Math.round(lRecipe.carbs * calMultiplier),
          fat: Math.round(lRecipe.fat * calMultiplier),
          recipe: lRecipe.instructions.slice(0, 2).join(' ')
        },
        dinner: {
          name: dRecipe.name,
          calories: Math.round(dRecipe.calories * calMultiplier),
          protein: Math.round(dRecipe.protein * calMultiplier),
          carbs: Math.round(dRecipe.carbs * calMultiplier),
          fat: Math.round(dRecipe.fat * calMultiplier),
          recipe: dRecipe.instructions.slice(0, 2).join(' ')
        },
        snack: {
          name: 'Fruit and Nut Bowl',
          calories: Math.round(150 * calMultiplier),
          protein: Math.round(5 * calMultiplier),
          carbs: Math.round(20 * calMultiplier),
          fat: Math.round(6 * calMultiplier),
          recipe: 'A serving of banana, apple slices, and almonds.'
        }
      }
    };
  });

  return plan;
};

/**
 * Suggest shopping items based on pantry and nutritional goals
 */
exports.generateGroceryRecommendations = async (pantryItems, goal, customKeyConfig) => {
  // 1. Try Groq
  const groq = getGroqClient(customKeyConfig);
  if (groq) {
    try {
      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: 'You are an intelligent shopping assistant. Return ONLY a JSON object matching this schema: { "missingIngredients": ["item 1", "item 2"], "proteinRichFoods": ["item 1", "item 2"], "fruitsAndVegetables": ["item 1", "item 2"], "weeklyShoppingList": ["item 1", "item 2"] }.'
          },
          {
            role: 'user',
            content: `Given user has these pantry items: ${JSON.stringify(pantryItems.map(p => p.name))} and health goal: ${goal}. Analyze what is missing for a balanced nutrition profile and recommend a shopping list.`
          }
        ]
      });
      return JSON.parse(response.choices[0].message.content);
    } catch (e) {
      console.warn("Groq grocery suggestions failed, trying fallback...", e.message);
    }
  }

  // 3. Mock Fallback Grocery Checklist
  const pantryNames = pantryItems.map(p => p.name.toLowerCase());
  const missing = [];
  const protein = [];
  const fruitsVeggies = [];

  // Suggest based on goal and typical gaps
  if (!pantryNames.some(p => p.includes('egg'))) {
    missing.push('Eggs');
    protein.push('Eggs');
  }
  if (!pantryNames.some(p => p.includes('milk') || p.includes('curd') || p.includes('yogurt'))) {
    missing.push('Milk or Greek Yogurt');
    protein.push('Greek Yogurt');
  }
  if (!pantryNames.some(p => p.includes('paneer') || p.includes('chicken') || p.includes('tofu'))) {
    missing.push('Paneer / Chicken Breast');
    protein.push('Paneer / Chicken Breast');
  }
  if (!pantryNames.some(p => p.includes('spinach') || p.includes('broccoli') || p.includes('leafy'))) {
    fruitsVeggies.push('Fresh Spinach');
    fruitsVeggies.push('Broccoli');
  }
  if (!pantryNames.some(p => p.includes('apple') || p.includes('banana') || p.includes('fruit'))) {
    fruitsVeggies.push('Apples');
    fruitsVeggies.push('Bananas');
  }

  // Add defaults if user pantry already has everything
  if (missing.length === 0) missing.push('Quinoa', 'Almond Milk');
  if (protein.length === 0) protein.push('Whey Protein', 'Lentils', 'Chia Seeds');
  if (fruitsVeggies.length === 0) fruitsVeggies.push('Avocados', 'Blueberries', 'Bell Peppers');

  const weeklyShoppingList = [...new Set([...missing, ...protein, ...fruitsVeggies])];

  return {
    missingIngredients: missing,
    proteinRichFoods: protein,
    fruitsAndVegetables: fruitsVeggies,
    weeklyShoppingList
  };
};
