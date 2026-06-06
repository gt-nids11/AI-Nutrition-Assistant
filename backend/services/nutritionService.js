const { INGREDIENT_DATABASE, RECIPE_TEMPLATES } = require('../config/nutritionDb');

// In-memory cache to store fetched API results to prevent rate limiting issues
const apiCache = new Map();

/**
 * Searches the local database for an ingredient (synchronous).
 */
function getIngredientNutritionLocal(name) {
  if (!name) return null;
  const cleanName = name.toLowerCase().trim();

  // 1. Direct match
  if (INGREDIENT_DATABASE[cleanName]) {
    return INGREDIENT_DATABASE[cleanName];
  }

  // 2. Substring/Fuzzy match on keys
  const keys = Object.keys(INGREDIENT_DATABASE);
  const matchedKey = keys.find(key => cleanName.includes(key) || key.includes(cleanName));
  if (matchedKey) {
    return INGREDIENT_DATABASE[matchedKey];
  }

  return null;
}

/**
 * Searches local database and queries external APIs (USDA and Open Food Facts) asynchronously.
 */
async function getIngredientNutrition(name) {
  if (!name) return null;
  const cleanName = name.toLowerCase().trim();

  // 1. Check in-memory query cache
  if (apiCache.has(cleanName)) {
    return apiCache.get(cleanName);
  }

  // 2. Check local database first for fast results
  const localMatch = getIngredientNutritionLocal(cleanName);
  if (localMatch) {
    apiCache.set(cleanName, localMatch);
    return localMatch;
  }

  // 3. Check if barcode (numeric string, 8 to 14 digits)
  const isBarcode = /^\d{8,14}$/.test(cleanName);
  if (isBarcode) {
    try {
      console.log(`[Nutrition Service] Querying Open Food Facts Barcode API for: ${cleanName}`);
      const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${cleanName}.json`, {
        headers: {
          'User-Agent': 'NutriMateAI - NodeBackend - Version 1.0'
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.status === 1 && data.product) {
          const nutriments = data.product.nutriments || {};
          const calories = nutriments['energy-kcal_100g'] !== undefined 
            ? Math.round(nutriments['energy-kcal_100g']) 
            : (nutriments['energy_100g'] ? Math.round(nutriments['energy_100g'] / 4.184) : 0);
          
          const result = {
            calories,
            protein: Math.round(nutriments['proteins_100g'] || 0),
            carbs: Math.round(nutriments['carbohydrates_100g'] || 0),
            fat: Math.round(nutriments['fat_100g'] || 0),
            fiber: Math.round(nutriments['fiber_100g'] || 0),
            source: 'Open Food Facts (Barcode)'
          };
          apiCache.set(cleanName, result);
          return result;
        }
      }
    } catch (err) {
      console.error(`[Nutrition Service] Error querying Open Food Facts Barcode API: ${err.message}`);
    }
  }

  // 4. Try Open Food Facts Search API (for branded foods / packaged goods)
  let offResult = null;
  try {
    console.log(`[Nutrition Service] Querying Open Food Facts Search API for: ${cleanName}`);
    const response = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(cleanName)}&search_simple=1&action=process&json=1&page_size=1`, {
      headers: {
        'User-Agent': 'NutriMateAI - NodeBackend - Version 1.0'
      }
    });
    if (response.ok) {
      const data = await response.json();
      if (data.products && data.products.length > 0) {
        const product = data.products[0];
        const nutriments = product.nutriments || {};
        if (nutriments['energy-kcal_100g'] !== undefined || nutriments['energy_100g'] !== undefined) {
          const calories = nutriments['energy-kcal_100g'] !== undefined 
            ? Math.round(nutriments['energy-kcal_100g']) 
            : Math.round(nutriments['energy_100g'] / 4.184);
          offResult = {
            calories,
            protein: Math.round(nutriments['proteins_100g'] || 0),
            carbs: Math.round(nutriments['carbohydrates_100g'] || 0),
            fat: Math.round(nutriments['fat_100g'] || 0),
            fiber: Math.round(nutriments['fiber_100g'] || 0),
            source: 'Open Food Facts'
          };
        }
      }
    }
  } catch (err) {
    console.error(`[Nutrition Service] Error querying Open Food Facts Search: ${err.message}`);
  }

  if (offResult) {
    apiCache.set(cleanName, offResult);
    return offResult;
  }

  // 5. Try USDA FoodData Central API (generic ingredients lookup)
  try {
    const apiKey = process.env.USDA_API_KEY || 'DEMO_KEY';
    console.log(`[Nutrition Service] Querying USDA FoodData Central API for: ${cleanName}`);
    const response = await fetch(`https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${apiKey}&query=${encodeURIComponent(cleanName)}&pageSize=1`);
    if (response.ok) {
      const data = await response.json();
      if (data.foods && data.foods.length > 0) {
        const food = data.foods[0];
        const nutrientsList = food.foodNutrients || [];
        
        const findNutrient = (ids, nameKeywords) => {
          const found = nutrientsList.find(n => 
            ids.includes(n.nutrientId) || 
            nameKeywords.some(kw => n.nutrientName && n.nutrientName.toLowerCase().includes(kw))
          );
          return found ? found.value : 0;
        };

        let calories = findNutrient([1008], ['energy (kcal)', 'energy, active', 'calories']);
        if (!calories) {
          const energyKj = findNutrient([2048], ['energy (kj)']);
          if (energyKj) calories = Math.round(energyKj / 4.184);
        }
        const protein = findNutrient([1003], ['protein']);
        const carbs = findNutrient([1005], ['carbohydrate, by difference', 'carbohydrate']);
        const fat = findNutrient([1004], ['total lipid (fat)', 'fat']);
        const fiber = findNutrient([1079], ['fiber, total dietary', 'fiber']);

        const result = {
          calories: Math.round(calories),
          protein: Math.round(protein),
          carbs: Math.round(carbs),
          fat: Math.round(fat),
          fiber: Math.round(fiber),
          source: 'USDA FoodData Central'
        };
        apiCache.set(cleanName, result);
        return result;
      }
    }
  } catch (err) {
    console.error(`[Nutrition Service] Error querying USDA FoodData Central Search: ${err.message}`);
  }

  // 6. Cache a null result for unfound ingredients to prevent repeat lookups
  apiCache.set(cleanName, null);
  return null;
}

/**
 * Estimates the nutritional breakdown of a dish or custom ingredient list.
 */
async function estimateNutrition(dishName, quantityText = '', userMultiplier = 1, userCustomGrams = null, userConfidenceScore = null) {
  const cleanDish = (dishName || '').toLowerCase().trim();
  let matchedTemplate = null;

  // Find matching template
  const templateKeys = Object.keys(RECIPE_TEMPLATES);
  const matchedKey = templateKeys.find(key => cleanDish.includes(key) || key.includes(cleanDish));
  if (matchedKey) {
    matchedTemplate = RECIPE_TEMPLATES[matchedKey];
  }

  // Determine initial confidence score
  let confidence = userConfidenceScore || 'medium';
  const hasGramsWord = quantityText.includes('g') || quantityText.includes('gram');
  const hasVagueWord = /some|bit|few|little|any/i.test(quantityText);
  if (userCustomGrams || hasGramsWord) {
    confidence = 'high';
  } else if (hasVagueWord) {
    confidence = 'low';
  }

  if (matchedTemplate) {
    const ingredients = [];
    let baseCalories = 0;
    let baseProtein = 0;
    let baseCarbs = 0;
    let baseFat = 0;
    let baseFiber = 0;
    let totalBaseWeight = 0;

    // Sum base values
    for (const ing of matchedTemplate.ingredients) {
      const macrosPer100 = await getIngredientNutrition(ing.name) || { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
      const ingBaseCalories = (ing.grams / 100) * macrosPer100.calories;
      const ingBaseProtein = (ing.grams / 100) * macrosPer100.protein;
      const ingBaseCarbs = (ing.grams / 100) * macrosPer100.carbs;
      const ingBaseFat = (ing.grams / 100) * macrosPer100.fat;
      const ingBaseFiber = (ing.grams / 100) * macrosPer100.fiber;

      baseCalories += ingBaseCalories;
      baseProtein += ingBaseProtein;
      baseCarbs += ingBaseCarbs;
      baseFat += ingBaseFat;
      baseFiber += ingBaseFiber;
      totalBaseWeight += ing.grams;

      ingredients.push({
        name: ing.name,
        baseGrams: ing.grams,
        grams: ing.grams,
        calories: Math.round(ingBaseCalories),
        protein: Math.round(ingBaseProtein),
        carbs: Math.round(ingBaseCarbs),
        fat: Math.round(ingBaseFat),
        fiber: Math.round(ingBaseFiber)
      });
    }

    // Determine multiplier
    let multiplier = userMultiplier || 1;
    let customGrams = userCustomGrams || null;

    if (customGrams) {
      multiplier = customGrams / totalBaseWeight;
    } else if (multiplier !== 1) {
      customGrams = Math.round(totalBaseWeight * multiplier);
    }

    // Scale final values
    const scaledMeals = ingredients.map(ing => {
      const ingBaseG = ing.baseGrams;
      return {
        ...ing,
        grams: Math.round(ingBaseG * multiplier),
        calories: Math.round(ing.calories * multiplier),
        protein: Math.round(ing.protein * multiplier),
        carbs: Math.round(ing.carbs * multiplier),
        fat: Math.round(ing.fat * multiplier),
        fiber: Math.round(ing.fiber * multiplier)
      };
    });

    return {
      foodName: matchedTemplate.dishName,
      calories: Math.round(baseCalories * multiplier),
      protein: Math.round(baseProtein * multiplier),
      carbs: Math.round(baseCarbs * multiplier),
      fat: Math.round(baseFat * multiplier),
      fiber: Math.round(baseFiber * multiplier),
      baseCalories: Math.round(baseCalories),
      baseProtein: Math.round(baseProtein),
      baseCarbs: Math.round(baseCarbs),
      baseFat: Math.round(baseFat),
      baseFiber: Math.round(baseFiber),
      servingSizeMultiplier: multiplier,
      customGrams,
      confidenceScore: confidence,
      assumptions: matchedTemplate.assumptions,
      ingredients: scaledMeals
    };
  }

  // Attempt direct single ingredient lookup
  const singleIngredient = await getIngredientNutrition(cleanDish);
  if (singleIngredient) {
    let customGrams = userCustomGrams || null;
    let multiplier = userMultiplier || 1;
    const defaultWeight = 100; // sensible default 100g

    if (customGrams) {
      multiplier = customGrams / defaultWeight;
    } else {
      customGrams = Math.round(defaultWeight * multiplier);
    }

    const baseCalories = (defaultWeight / 100) * singleIngredient.calories;
    const baseProtein = (defaultWeight / 100) * singleIngredient.protein;
    const baseCarbs = (defaultWeight / 100) * singleIngredient.carbs;
    const baseFat = (defaultWeight / 100) * singleIngredient.fat;
    const baseFiber = (defaultWeight / 100) * singleIngredient.fiber;

    const ingredients = [{
      name: cleanDish,
      baseGrams: defaultWeight,
      grams: customGrams,
      calories: Math.round(baseCalories * multiplier),
      protein: Math.round(baseProtein * multiplier),
      carbs: Math.round(baseCarbs * multiplier),
      fat: Math.round(baseFat * multiplier),
      fiber: Math.round(baseFiber * multiplier)
    }];

    const sourceText = singleIngredient.source ? ` (Source: ${singleIngredient.source})` : '';

    return {
      foodName: dishName,
      calories: Math.round(baseCalories * multiplier),
      protein: Math.round(baseProtein * multiplier),
      carbs: Math.round(baseCarbs * multiplier),
      fat: Math.round(baseFat * multiplier),
      fiber: Math.round(baseFiber * multiplier),
      baseCalories: Math.round(baseCalories),
      baseProtein: Math.round(baseProtein),
      baseCarbs: Math.round(baseCarbs),
      baseFat: Math.round(baseFat),
      baseFiber: Math.round(baseFiber),
      servingSizeMultiplier: multiplier,
      customGrams,
      confidenceScore: confidence,
      assumptions: `• ${defaultWeight}g standard serving assumed.${sourceText}`,
      ingredients
    };
  }

  // Fallback default response if no database templates or ingredients match
  const fallbackCalories = 250 * userMultiplier;
  const fallbackProtein = 10 * userMultiplier;
  const fallbackCarbs = 30 * userMultiplier;
  const fallbackFat = 8 * userMultiplier;
  const fallbackFiber = 2 * userMultiplier;

  return {
    foodName: dishName || 'Logged Meal',
    calories: Math.round(fallbackCalories),
    protein: Math.round(fallbackProtein),
    carbs: Math.round(fallbackCarbs),
    fat: Math.round(fallbackFat),
    fiber: Math.round(fallbackFiber),
    baseCalories: 250,
    baseProtein: 10,
    baseCarbs: 30,
    baseFat: 8,
    baseFiber: 2,
    servingSizeMultiplier: userMultiplier,
    customGrams: userCustomGrams,
    confidenceScore: confidence,
    assumptions: '• Standard restaurant portion estimated by AI.',
    ingredients: [{
      name: dishName || 'Logged Meal',
      baseGrams: 150,
      grams: userCustomGrams || 150,
      calories: Math.round(fallbackCalories),
      protein: Math.round(fallbackProtein),
      carbs: Math.round(fallbackCarbs),
      fat: Math.round(fallbackFat),
      fiber: Math.round(fallbackFiber)
    }]
  };
}

/**
 * Helper to compute calculations for a custom ingredient list provided dynamically by the AI.
 */
async function estimateCustomIngredientList(dishName, parsedIngredients, userMultiplier = 1, userCustomGrams = null, userConfidenceScore = 'medium') {
  const ingredients = [];
  let baseCalories = 0;
  let baseProtein = 0;
  let baseCarbs = 0;
  let baseFat = 0;
  let baseFiber = 0;
  let totalBaseWeight = 0;

  for (const ing of parsedIngredients) {
    const macrosPer100 = await getIngredientNutrition(ing.name) || ing.fallbackMacrosPer100 || { calories: 100, protein: 5, carbs: 15, fat: 2, fiber: 1 };
    const ingBaseCalories = (ing.grams / 100) * macrosPer100.calories;
    const ingBaseProtein = (ing.grams / 100) * macrosPer100.protein;
    const ingBaseCarbs = (ing.grams / 100) * macrosPer100.carbs;
    const ingBaseFat = (ing.grams / 100) * macrosPer100.fat;
    const ingBaseFiber = (ing.grams / 100) * macrosPer100.fiber;

    baseCalories += ingBaseCalories;
    baseProtein += ingBaseProtein;
    baseCarbs += ingBaseCarbs;
    baseFat += ingBaseFat;
    baseFiber += ingBaseFiber;
    totalBaseWeight += ing.grams;

    ingredients.push({
      name: ing.name,
      baseGrams: ing.grams,
      grams: ing.grams,
      calories: Math.round(ingBaseCalories),
      protein: Math.round(ingBaseProtein),
      carbs: Math.round(ingBaseCarbs),
      fat: Math.round(ingBaseFat),
      fiber: Math.round(ingBaseFiber)
    });
  }

  let multiplier = userMultiplier || 1;
  let customGrams = userCustomGrams || null;

  if (customGrams) {
    multiplier = customGrams / totalBaseWeight;
  } else if (multiplier !== 1) {
    customGrams = Math.round(totalBaseWeight * multiplier);
  }

  const scaledMeals = ingredients.map(ing => {
    const ingBaseG = ing.baseGrams;
    return {
      ...ing,
      grams: Math.round(ingBaseG * multiplier),
      calories: Math.round(ing.calories * multiplier),
      protein: Math.round(ing.protein * multiplier),
      carbs: Math.round(ing.carbs * multiplier),
      fat: Math.round(ing.fat * multiplier),
      fiber: Math.round(ing.fiber * multiplier)
    };
  });

  const assumptionsText = parsedIngredients.map(ing => `• ${ing.grams}g ${ing.name}`).join('\n');

  return {
    foodName: dishName,
    calories: Math.round(baseCalories * multiplier),
    protein: Math.round(baseProtein * multiplier),
    carbs: Math.round(baseCarbs * multiplier),
    fat: Math.round(baseFat * multiplier),
    fiber: Math.round(baseFiber * multiplier),
    baseCalories: Math.round(baseCalories),
    baseProtein: Math.round(baseProtein),
    baseCarbs: Math.round(baseCarbs),
    baseFat: Math.round(baseFat),
    baseFiber: Math.round(baseFiber),
    servingSizeMultiplier: multiplier,
    customGrams,
    confidenceScore: userConfidenceScore,
    assumptions: assumptionsText,
    ingredients: scaledMeals
  };
}

module.exports = {
  getIngredientNutrition,
  estimateNutrition,
  estimateCustomIngredientList
};
