const INGREDIENT_DATABASE = {
  "cooked pasta": { calories: 131, protein: 5, carbs: 25, fat: 1.1, fiber: 1.2 },
  "basil pesto": { calories: 380, protein: 4.8, carbs: 6.7, fat: 37, fiber: 1.5 },
  "parmesan cheese": { calories: 431, protein: 38, carbs: 4.1, fat: 29, fiber: 0 },
  "white rice": { calories: 130, protein: 2.7, carbs: 28, fat: 0.3, fiber: 0.4 },
  "chicken breast": { calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0 },
  "egg": { calories: 155, protein: 13, carbs: 1.1, fat: 11, fiber: 0 },
  "whole wheat bread": { calories: 247, protein: 13, carbs: 41, fat: 3.4, fiber: 7 },
  "milk": { calories: 42, protein: 3.4, carbs: 5, fat: 1, fiber: 0 },
  "banana": { calories: 89, protein: 1.1, carbs: 23, fat: 0.3, fiber: 2.6 },
  "apple": { calories: 52, protein: 0.3, carbs: 14, fat: 0.2, fiber: 2.4 },
  "paneer": { calories: 265, protein: 18, carbs: 1.2, fat: 20, fiber: 0 },
  "butter": { calories: 717, protein: 0.9, carbs: 0.1, fat: 81, fiber: 0 },
  "onion": { calories: 40, protein: 1.1, carbs: 9.3, fat: 0.1, fiber: 1.7 },
  "tomato": { calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, fiber: 1.2 },
  "spinach": { calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, fiber: 2.2 },
  "dal": { calories: 116, protein: 9, carbs: 20, fat: 0.4, fiber: 8 }
};

const RECIPE_TEMPLATES = {
  "pesto pasta": {
    dishName: "Pesto Pasta",
    ingredients: [
      { name: "cooked pasta", grams: 140 },
      { name: "basil pesto", grams: 30 },
      { name: "parmesan cheese", grams: 10 }
    ],
    assumptions: "• 140g cooked pasta\n• 30g basil pesto\n• 10g parmesan cheese"
  },
  "scrambled eggs with toast": {
    dishName: "Scrambled Eggs with Toast",
    ingredients: [
      { name: "egg", grams: 100 },
      { name: "whole wheat bread", grams: 50 },
      { name: "butter", grams: 5 }
    ],
    assumptions: "• 2 large eggs (100g)\n• 2 slices whole wheat bread (50g)\n• 5g butter"
  },
  "banana shake": {
    dishName: "Banana Shake",
    ingredients: [
      { name: "milk", grams: 250 },
      { name: "banana", grams: 120 }
    ],
    assumptions: "• 1 glass milk (250g)\n• 1 medium banana (120g)"
  },
  "dal rice": {
    dishName: "Dal Rice",
    ingredients: [
      { name: "white rice", grams: 150 },
      { name: "dal", grams: 150 }
    ],
    assumptions: "• 150g white rice\n• 150g cooked dal"
  },
  "paneer bhurji": {
    dishName: "Paneer Bhurji",
    ingredients: [
      { name: "paneer", grams: 150 },
      { name: "onion", grams: 50 },
      { name: "tomato", grams: 50 },
      { name: "butter", grams: 5 }
    ],
    assumptions: "• 150g paneer\n• 50g onion\n• 50g tomato\n• 5g butter"
  }
};

module.exports = {
  INGREDIENT_DATABASE,
  RECIPE_TEMPLATES
};
