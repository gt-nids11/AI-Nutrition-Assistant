'use client';

import { useState, useEffect } from 'react';
import { plannerAPI } from '../../utils/api';
import { 
  Calendar, 
  Sparkles, 
  ShoppingCart, 
  CheckSquare, 
  Square,
  ChevronRight,
  Utensils,
  ChevronDown,
  Info,
  Loader
} from 'lucide-react';

export default function PlannerPage() {
  const [mealPlan, setMealPlan] = useState(null);
  const [groceryList, setGroceryList] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [generatingGrocery, setGeneratingGrocery] = useState(false);

  // Active day selected for details panel (default: Monday)
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [expandedMeal, setExpandedMeal] = useState('breakfast'); // breakfast, lunch, dinner, snack

  // Local checklist items crossed off state
  const [crossedItems, setCrossedItems] = useState({});

  useEffect(() => {
    loadPlannerData();
  }, []);

  const loadPlannerData = async () => {
    try {
      setLoading(true);
      
      const planRes = await plannerAPI.getPlan();
      if (planRes.success) {
        setMealPlan(planRes.mealPlan);
      }

      const groceryRes = await plannerAPI.getGrocery();
      if (groceryRes.success) {
        setGroceryList(groceryRes.groceryList);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePlan = async () => {
    try {
      setGeneratingPlan(true);
      const res = await plannerAPI.generatePlan();
      if (res.success) {
        setMealPlan(res.mealPlan);
        // Automatically regenerate grocery list to match the new plan
        handleGenerateGrocery(true);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to generate weekly plan: ' + err.message);
    } finally {
      setGeneratingPlan(false);
    }
  };

  const handleGenerateGrocery = async (silent = false) => {
    try {
      if (!silent) setGeneratingGrocery(true);
      const res = await plannerAPI.generateGrocery();
      if (res.success) {
        setGroceryList(res.groceryList);
        setCrossedItems({}); // Reset checklist crosses
      }
    } catch (err) {
      console.error(err);
      if (!silent) alert('Failed to generate grocery recommendations');
    } finally {
      if (!silent) setGeneratingGrocery(false);
    }
  };

  const toggleChecklist = (item) => {
    setCrossedItems(prev => ({
      ...prev,
      [item]: !prev[item]
    }));
  };

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Loader className="animate-spin text-emerald-500" size={32} />
      </div>
    );
  }

  const daysList = mealPlan || [];
  const currentDayPlan = daysList[activeDayIndex] || null;

  return (
    <div className="space-y-6">
      
      {/* Page Title & primary controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Weekly Meal Planner</h1>
          <p className="text-sm text-zinc-400">Generate structured daily meals optimized for nutrient values and pantry stock.</p>
        </div>

        <button
          onClick={handleGeneratePlan}
          disabled={generatingPlan}
          className="flex items-center justify-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm px-4 py-3 rounded-xl shadow-lg transition-all disabled:opacity-50 shrink-0"
        >
          {generatingPlan ? (
            <Loader size={16} className="animate-spin" />
          ) : (
            <Sparkles size={16} />
          )}
          <span>{daysList.length > 0 ? 'Regenerate 7-Day Plan' : 'Generate Weekly Plan'}</span>
        </button>
      </div>

      {daysList.length === 0 ? (
        <div className="bg-zinc-900/20 border border-zinc-800 rounded-3xl p-16 text-center flex flex-col items-center justify-center space-y-4">
          <Calendar size={48} className="text-zinc-650" />
          <div>
            <h3 className="text-lg font-bold text-zinc-350">No Weekly Plan Generated</h3>
            <p className="text-xs text-zinc-550 max-w-sm mt-1">
              Set up a personalized, waste-conscious meal plan that covers breakfast, lunch, dinner, and snacks for the week.
            </p>
          </div>
          <button
            onClick={handleGeneratePlan}
            disabled={generatingPlan}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-md transition-all flex items-center space-x-2"
          >
            {generatingPlan ? <Loader size={14} className="animate-spin" /> : <Sparkles size={14} />}
            <span>Create Plan Now</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          
          {/* Planner board */}
          <div className="lg:col-span-2 bg-zinc-900/40 border border-zinc-800 rounded-3xl p-6 flex flex-col space-y-6">
            
            {/* Days Horizontal selector */}
            <div className="flex space-x-1.5 overflow-x-auto pb-2 shrink-0 border-b border-zinc-800/80">
              {daysList.map((dayItem, index) => (
                <button
                  key={dayItem.day}
                  type="button"
                  onClick={() => {
                    setActiveDayIndex(index);
                    setExpandedMeal('breakfast');
                  }}
                  className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all shrink-0
                    ${activeDayIndex === index 
                      ? 'bg-emerald-600 text-white font-black shadow-md shadow-emerald-950/20' 
                      : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 border border-transparent'}`}
                >
                  {dayItem.day}
                </button>
              ))}
            </div>

            {/* Selected day meal lists */}
            {currentDayPlan && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start flex-1">
                
                {/* Vertical menu tabs */}
                <div className="md:col-span-4 space-y-2.5">
                  {['breakfast', 'lunch', 'dinner', 'snack'].map(type => {
                    const meal = currentDayPlan.meals[type];
                    const isSelected = expandedMeal === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setExpandedMeal(type)}
                        className={`w-full p-3.5 rounded-xl border text-left flex justify-between items-center transition-all group
                          ${isSelected 
                            ? 'border-emerald-500 bg-emerald-950/10 text-emerald-400 shadow-md shadow-emerald-500/5' 
                            : 'border-zinc-800/80 bg-zinc-950/20 text-zinc-400 hover:border-zinc-750 hover:text-zinc-200'}`}
                      >
                        <div>
                          <p className="text-[10px] uppercase font-extrabold tracking-wider text-zinc-550 group-hover:text-emerald-500">{type}</p>
                          <p className="text-xs font-bold truncate max-w-[130px] mt-0.5">{meal?.name || 'Loading...'}</p>
                        </div>
                        <ChevronRight size={14} className={isSelected ? 'text-emerald-400' : 'text-zinc-650 group-hover:text-zinc-400'} />
                      </button>
                    );
                  })}
                </div>

                {/* Extended Details Panel */}
                <div className="md:col-span-8 bg-zinc-950/40 border border-zinc-850 p-5 rounded-2xl space-y-4">
                  <div>
                    <span className="text-[9px] font-black uppercase bg-emerald-950/40 text-emerald-400 border border-emerald-900/30 px-2 py-0.5 rounded-full capitalize">
                      {expandedMeal}
                    </span>
                    <h3 className="text-xl font-extrabold text-zinc-200 mt-2">
                      {currentDayPlan.meals[expandedMeal]?.name}
                    </h3>
                  </div>

                  {/* Macros info */}
                  <div className="grid grid-cols-4 gap-2 bg-zinc-900/40 border border-zinc-850 p-3 rounded-xl text-center">
                    <div>
                      <p className="text-[8px] uppercase font-bold text-zinc-500">Calories</p>
                      <p className="text-xs font-bold text-emerald-400">{currentDayPlan.meals[expandedMeal]?.calories} kcal</p>
                    </div>
                    <div>
                      <p className="text-[8px] uppercase font-bold text-zinc-500">Protein</p>
                      <p className="text-xs font-bold text-zinc-200">{currentDayPlan.meals[expandedMeal]?.protein}g</p>
                    </div>
                    <div>
                      <p className="text-[8px] uppercase font-bold text-zinc-500">Carbs</p>
                      <p className="text-xs font-bold text-zinc-200">{currentDayPlan.meals[expandedMeal]?.carbs}g</p>
                    </div>
                    <div>
                      <p className="text-[8px] uppercase font-bold text-zinc-500">Fat</p>
                      <p className="text-xs font-bold text-zinc-200">{currentDayPlan.meals[expandedMeal]?.fat}g</p>
                    </div>
                  </div>

                  {/* Description recipe */}
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center space-x-1">
                      <Utensils size={12} className="text-emerald-400" />
                      <span>Prep Directions</span>
                    </p>
                    <p className="text-xs leading-relaxed text-zinc-400">
                      {currentDayPlan.meals[expandedMeal]?.recipe || 'No recipe details included. Follow standard nutritional recommendations.'}
                    </p>
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* Grocery list module */}
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-6 flex flex-col justify-between space-y-6">
            <div className="space-y-4 flex-1 flex flex-col min-h-0">
              
              {/* Header */}
              <div className="flex justify-between items-center shrink-0 border-b border-zinc-800 pb-3">
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center space-x-1.5">
                  <ShoppingCart size={14} className="text-teal-400" />
                  <span>Grocery Checklist</span>
                </h3>
                
                <button
                  onClick={() => handleGenerateGrocery(false)}
                  disabled={generatingGrocery}
                  className="p-1 rounded-lg text-zinc-500 hover:text-emerald-400 transition-colors"
                  title="Regenerate shopping checklist"
                >
                  {generatingGrocery ? <Loader size={14} className="animate-spin" /> : <span className="text-[9px] uppercase font-bold hover:underline">Sync</span>}
                </button>
              </div>

              {groceryList && (
                <div className="space-y-4 flex-1 overflow-y-auto pr-1">
                  
                  {/* Missing items checklist */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Missing Pantry ingredients</p>
                    {groceryList.missingIngredients.length === 0 ? (
                      <p className="text-[10px] text-zinc-650 italic">None. Your pantry is stocked!</p>
                    ) : (
                      <div className="space-y-1.5">
                        {groceryList.missingIngredients.map(item => {
                          const crossed = !!crossedItems[item];
                          return (
                            <button
                              key={item}
                              onClick={() => toggleChecklist(item)}
                              className="w-full flex items-start space-x-2 text-left py-1 text-xs text-zinc-400 hover:text-zinc-200 transition-all font-medium"
                            >
                              <span className="shrink-0 mt-0.5 text-emerald-400">
                                {crossed ? <CheckSquare size={14} /> : <Square size={14} />}
                              </span>
                              <span className={crossed ? 'line-through text-zinc-600' : ''}>{item}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Protein rich recommendations */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Goal Protein Boosters</p>
                    <ul className="list-disc list-inside text-xs text-zinc-400 space-y-1 font-medium pl-1">
                      {groceryList.proteinRichFoods.slice(0, 3).map(item => (
                        <li key={item} className="capitalize">{item}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Greens Recommendations */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Fruits & Veggies Suggestions</p>
                    <ul className="list-disc list-inside text-xs text-zinc-400 space-y-1 font-medium pl-1">
                      {groceryList.fruitsAndVegetables.slice(0, 3).map(item => (
                        <li key={item} className="capitalize">{item}</li>
                      ))}
                    </ul>
                  </div>

                </div>
              )}

            </div>

            <div className="text-[10px] text-zinc-500 bg-zinc-950/30 border border-zinc-850 p-3 rounded-2xl leading-tight flex items-start space-x-1.5 shrink-0">
              <Info size={14} className="text-emerald-500 shrink-0 mt-0.5" />
              <span>Shopping lists sync with your live pantry items and meal planner configurations automatically.</span>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
