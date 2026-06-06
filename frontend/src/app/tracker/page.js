'use client';

import { useState, useEffect } from 'react';
import { trackerAPI } from '../../utils/api';
import { 
  Sparkles, 
  Plus, 
  Trash2, 
  Calendar, 
  Info,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Flame,
  Scale,
  Loader
} from 'lucide-react';

export default function TrackerPage() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [meals, setMeals] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  // Natural Language Form State
  const [mealText, setMealText] = useState('');
  const [mealType, setMealType] = useState('breakfast');
  const [aiSubmitting, setAiSubmitting] = useState(false);

  // Manual Form State
  const [activeTab, setActiveTab] = useState('ai'); // 'ai' or 'manual'
  const [manualName, setManualName] = useState('');
  const [manualCal, setManualCal] = useState('');
  const [manualProt, setManualProt] = useState('');
  const [manualCarb, setManualCarb] = useState('');
  const [manualFat, setManualFat] = useState('');
  const [manualFib, setManualFib] = useState('');
  const [manualSubmitting, setManualSubmitting] = useState(false);

  // Expanded / Serving size custom states
  const [expandedMeals, setExpandedMeals] = useState({});
  const [customGramsValues, setCustomGramsValues] = useState({});
  const [customGramsActive, setCustomGramsActive] = useState({});

  // Message updates
  const [logSuccessMessage, setLogSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadDailyLogs();
  }, [date]);

  const loadDailyLogs = async () => {
    try {
      setLoading(true);
      const res = await trackerAPI.getDaily(date);
      if (res.success) {
        setMeals(res.meals);
        setSummary(res.summary);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (days) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    setDate(d.toISOString().split('T')[0]);
  };

  const handleAiLog = async (e) => {
    e.preventDefault();
    if (!mealText.trim()) return;

    setAiSubmitting(true);
    setErrorMessage('');
    setLogSuccessMessage('');
    try {
      const res = await trackerAPI.logMeal({
        mealText,
        mealType,
        date
      });

      if (res.success) {
        setMeals([...meals, res.mealLog]);
        setSummary(res.summary);
        setMealText('');
        setLogSuccessMessage(`Logged: ${res.mealLog.foodName} (${res.mealLog.calories} kcal)`);
        setTimeout(() => setLogSuccessMessage(''), 4000);
      }
    } catch (err) {
      setErrorMessage(err.message || 'AI failed to estimate nutritional values. Try manual logging.');
    } finally {
      setAiSubmitting(false);
    }
  };

  const handleManualLog = async (e) => {
    e.preventDefault();
    if (!manualName || !manualCal) {
      return setErrorMessage('Food name and Calories are required');
    }

    setManualSubmitting(true);
    setErrorMessage('');
    setLogSuccessMessage('');
    try {
      const res = await trackerAPI.logMeal({
        mealType,
        date,
        manualMacros: {
          foodName: manualName,
          calories: Number(manualCal),
          protein: Number(manualProt || 0),
          carbs: Number(manualCarb || 0),
          fat: Number(manualFat || 0),
          fiber: Number(manualFib || 0)
        }
      });

      if (res.success) {
        setMeals([...meals, res.mealLog]);
        setSummary(res.summary);
        // Clear
        setManualName('');
        setManualCal('');
        setManualProt('');
        setManualCarb('');
        setManualFat('');
        setManualFib('');
        setLogSuccessMessage(`Logged: ${res.mealLog.foodName} (${res.mealLog.calories} kcal)`);
        setTimeout(() => setLogSuccessMessage(''), 4000);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to log manually');
    } finally {
      setManualSubmitting(false);
    }
  };

  const handleDeleteMeal = async (id) => {
    try {
      const res = await trackerAPI.deleteMeal(id);
      if (res.success) {
        setMeals(meals.filter(m => m._id !== id));
        setSummary(res.summary);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to delete log');
    }
  };

  const toggleMealExpand = (id) => {
    setExpandedMeals(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleServingSizeChange = async (mealId, value) => {
    if (value === 'custom') {
      setCustomGramsActive(prev => ({ ...prev, [mealId]: true }));
      const meal = meals.find(m => m._id === mealId);
      const initialGrams = meal.customGrams || (meal.ingredients && meal.ingredients.reduce((acc, ing) => acc + (ing.baseGrams || ing.grams || 100), 0)) || 150;
      setCustomGramsValues(prev => ({ ...prev, [mealId]: initialGrams }));
      return;
    }

    setCustomGramsActive(prev => ({ ...prev, [mealId]: false }));

    try {
      const res = await trackerAPI.updateMeal(mealId, { servingSizeMultiplier: Number(value) });
      if (res.success) {
        setMeals(meals.map(m => m._id === mealId ? res.mealLog : m));
        setSummary(res.summary);
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('Failed to update serving size');
    }
  };

  const handleCustomGramsInput = (mealId, value) => {
    setCustomGramsValues(prev => ({ ...prev, [mealId]: value }));
  };

  const saveCustomGrams = async (mealId) => {
    const val = customGramsValues[mealId];
    if (!val || isNaN(val) || val <= 0) return;

    try {
      const res = await trackerAPI.updateMeal(mealId, { customGrams: Number(val) });
      if (res.success) {
        setMeals(meals.map(m => m._id === mealId ? res.mealLog : m));
        setSummary(res.summary);
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('Failed to update custom weight');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Date controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Log & Track Nutrition</h1>
          <p className="text-sm text-zinc-500 font-medium">Keep account of your daily calorie targets and nutrient splits.</p>
        </div>
        
        {/* Date Selector */}
        <div className="flex items-center bg-white border border-zinc-100 rounded-xl overflow-hidden self-start sm:self-auto shrink-0 shadow-sm">
          <button 
            onClick={() => handleDateChange(-1)}
            className="p-3 hover:bg-zinc-50 text-pink-600 hover:text-pink-900 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="px-4 py-2 text-xs font-extrabold text-zinc-950 flex items-center space-x-1.5">
            <Calendar size={14} className="text-pink-500" />
            <span>{new Date(date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
          </div>
          <button 
            onClick={() => handleDateChange(1)}
            className="p-3 hover:bg-zinc-50 text-pink-600 hover:text-pink-900 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Log Forms Area */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Form tab selector */}
          <div className="bg-white border border-zinc-100 p-6 rounded-3xl space-y-6 shadow-sm">
            <div className="flex space-x-2 border-b border-zinc-100 pb-4">
              <button
                onClick={() => { setActiveTab('ai'); setErrorMessage(''); }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all
                  ${activeTab === 'ai' 
                    ? 'bg-pink-500/10 border border-pink-500/20 text-pink-600' 
                    : 'text-zinc-400 hover:text-zinc-700 border border-transparent'}`}
              >
                <Sparkles size={14} />
                <span>Log with Copilot AI</span>
              </button>
              <button
                onClick={() => { setActiveTab('manual'); setErrorMessage(''); }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all
                  ${activeTab === 'manual' 
                    ? 'bg-pink-500/10 border border-pink-500/20 text-pink-600' 
                    : 'text-zinc-400 hover:text-zinc-700 border border-transparent'}`}
              >
                <ClipboardList size={14} />
                <span>Log manually</span>
              </button>
            </div>

            {logSuccessMessage && (
              <div className="bg-pink-50 border border-pink-200 text-pink-700 text-xs p-3.5 rounded-xl flex items-center space-x-2 font-bold animate-pulse">
                <Sparkles size={14} />
                <span>{logSuccessMessage}</span>
              </div>
            )}

            {errorMessage && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3.5 rounded-xl flex items-center space-x-2 font-bold">
                <Info size={14} />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Meal Type selection */}
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Select Meal Category</label>
              <div className="grid grid-cols-4 gap-2">
                {['breakfast', 'lunch', 'dinner', 'snack'].map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setMealType(type)}
                    className={`py-2 rounded-xl border text-xs font-bold capitalize transition-all
                      ${mealType === type 
                        ? 'border-pink-500 bg-pink-500/10 text-pink-600' 
                        : 'border-zinc-200 bg-zinc-50/10 text-zinc-500 hover:border-zinc-300 hover:text-zinc-700'}`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* AI NATURAL LANGUAGE FORM */}
            {activeTab === 'ai' && (
              <form onSubmit={handleAiLog} className="space-y-4 font-semibold text-xs text-zinc-650">
                <div>
                  <label className="block uppercase tracking-wider mb-2 font-extrabold text-zinc-500">Describe what you ate</label>
                  <textarea
                    rows={3}
                    placeholder="e.g. I had pesto pasta."
                    value={mealText}
                    onChange={(e) => setMealText(e.target.value)}
                    className="w-full bg-zinc-50/10 border border-zinc-200 rounded-xl p-3.5 text-sm text-zinc-900 font-semibold focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500 transition-all placeholder-zinc-400 resize-none"
                    required
                  />
                  <p className="text-[10px] text-zinc-400 mt-1 flex items-center space-x-1 font-bold">
                    <Info size={12} className="text-pink-500" />
                    <span>The AI estimates ingredients, serving sizes, and confidence levels.</span>
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={aiSubmitting}
                  className="w-full py-3.5 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-extrabold text-sm rounded-xl transition-all disabled:opacity-50 flex items-center justify-center space-x-2 shadow-lg shadow-pink-500/10"
                >
                  {aiSubmitting ? (
                    <Loader size={18} className="animate-spin" />
                  ) : (
                    <>
                      <Sparkles size={16} />
                      <span>Estimate & Log Meal</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* MANUAL FORM ENTRY */}
            {activeTab === 'manual' && (
              <form onSubmit={handleManualLog} className="space-y-4 font-semibold text-xs text-zinc-650">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block uppercase tracking-wider mb-1.5 font-extrabold text-zinc-500">Food/Dish Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Scrambled Eggs with Bread"
                      value={manualName}
                      onChange={(e) => setManualName(e.target.value)}
                      className="block w-full rounded-xl border border-zinc-200 bg-zinc-50/10 py-3 px-3.5 text-sm text-zinc-950 placeholder-zinc-400 font-semibold focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500 transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block uppercase tracking-wider mb-1.5 font-extrabold text-zinc-500">Calories (kcal)</label>
                    <input
                      type="number"
                      placeholder="e.g. 320"
                      value={manualCal}
                      onChange={(e) => setManualCal(e.target.value)}
                      className="block w-full rounded-xl border border-zinc-200 bg-zinc-50/10 py-3 px-3.5 text-sm text-zinc-955 placeholder-zinc-400 font-semibold focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500 transition-all"
                      required
                    />
                  </div>
                  
                  {/* Macros grid */}
                  <div className="md:col-span-2 grid grid-cols-4 gap-2">
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase mb-1 text-zinc-450">Protein (g)</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={manualProt}
                        onChange={(e) => setManualProt(e.target.value)}
                        className="w-full text-center rounded-lg border border-zinc-200 bg-zinc-50/10 py-2.5 px-2 text-xs text-zinc-950 focus:border-pink-500 focus:outline-none transition-all font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase mb-1 text-zinc-450">Carbs (g)</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={manualCarb}
                        onChange={(e) => setManualCarb(e.target.value)}
                        className="w-full text-center rounded-lg border border-zinc-200 bg-zinc-50/10 py-2.5 px-2 text-xs text-zinc-950 focus:border-pink-500 focus:outline-none transition-all font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase mb-1 text-zinc-450">Fat (g)</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={manualFat}
                        onChange={(e) => setManualFat(e.target.value)}
                        className="w-full text-center rounded-lg border border-zinc-200 bg-zinc-50/10 py-2.5 px-2 text-xs text-zinc-950 focus:border-pink-500 focus:outline-none transition-all font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase mb-1 text-zinc-450">Fiber (g)</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={manualFib}
                        onChange={(e) => setManualFib(e.target.value)}
                        className="w-full text-center rounded-lg border border-zinc-200 bg-zinc-50/10 py-2.5 px-2 text-xs text-zinc-950 focus:border-pink-500 focus:outline-none transition-all font-semibold"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={manualSubmitting}
                  className="w-full py-3.5 bg-zinc-50 hover:bg-zinc-100 border border-zinc-250 text-zinc-700 font-extrabold text-sm rounded-xl transition-all disabled:opacity-50 flex items-center justify-center space-x-1.5 shadow-md mt-2"
                >
                  {manualSubmitting ? (
                    <Loader size={18} className="animate-spin" />
                  ) : (
                    <>
                      <Plus size={16} className="text-pink-500" />
                      <span>Log Meal Manually</span>
                    </>
                  )}
                </button>
              </form>
            )}

          </div>

          {/* Eaten Meal checklist */}
          <div className="bg-white border border-zinc-100 p-6 rounded-3xl space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-zinc-700 uppercase tracking-widest flex items-center space-x-1.5 border-b border-zinc-100 pb-2">
              <ClipboardList size={14} className="text-pink-500" />
              <span>Logged Foods Checklist</span>
            </h3>

            {loading ? (
              <div className="flex h-32 items-center justify-center">
                <Loader className="animate-spin text-pink-500" size={24} />
              </div>
            ) : meals.length === 0 ? (
              <div className="py-8 text-center text-zinc-400 text-xs font-semibold flex flex-col items-center">
                <span>No meals logged for this date.</span>
              </div>
            ) : (
              <div className="divide-y divide-zinc-100 max-h-[480px] overflow-y-auto pr-1">
                {meals.map((meal) => {
                  const hasCustom = customGramsActive[meal._id] || meal.customGrams;
                  const score = meal.confidenceScore || 'medium';
                  const badgeColor = score === 'high' 
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600'
                    : score === 'medium'
                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-600'
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-600';

                  return (
                    <div key={meal._id} className="py-4 first:pt-0 last:pb-0 space-y-2">
                      <div className="flex justify-between items-start">
                        <div className="space-y-0.5">
                          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                            <span className="font-extrabold text-sm text-zinc-950 capitalize">{meal.foodName}</span>
                            <span className="px-1.5 py-0.5 rounded-full text-[8px] font-bold border border-pink-200 bg-pink-100 text-pink-700 capitalize">
                              {meal.mealType}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-bold border capitalize ${badgeColor}`}>
                              Confidence: {score}
                            </span>
                          </div>
                          
                          {meal.assumptions && (
                            <p className="text-[10px] text-zinc-400 font-semibold italic leading-tight">
                              Assumed: {meal.assumptions.replace(/\n/g, ', ')}
                            </p>
                          )}

                          {/* Serving Multiplier Selector */}
                          <div className="flex items-center space-x-2 pt-1">
                            <label className="text-[10px] text-zinc-450 font-bold">Serving:</label>
                            <select
                              value={hasCustom ? 'custom' : meal.servingSizeMultiplier}
                              onChange={(e) => handleServingSizeChange(meal._id, e.target.value)}
                              className="bg-zinc-50 border border-zinc-200 rounded-lg p-1 text-[10px] font-bold text-zinc-700 focus:outline-none"
                            >
                              <option value={0.5}>0.5x Portion</option>
                              <option value={1}>1.0x Portion</option>
                              <option value={1.5}>1.5x Portion</option>
                              <option value={2}>2.0x Portion</option>
                              <option value="custom">Custom Weight (g)</option>
                            </select>
                            
                            {hasCustom && (
                              <div className="flex items-center space-x-1">
                                <input
                                  type="number"
                                  placeholder="Grams"
                                  value={customGramsValues[meal._id] !== undefined ? customGramsValues[meal._id] : (meal.customGrams || '')}
                                  onChange={(e) => handleCustomGramsInput(meal._id, e.target.value)}
                                  onBlur={() => saveCustomGrams(meal._id)}
                                  className="w-16 bg-zinc-50 border border-zinc-200 rounded-lg p-1 text-[10px] font-bold text-center text-zinc-900 focus:outline-none"
                                />
                                <span className="text-[10px] text-zinc-400 font-bold">g</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 text-zinc-900">
                          <div className="text-right">
                            <p className="font-extrabold text-sm text-zinc-950">{meal.calories} kcal</p>
                            <p className="text-[9px] text-zinc-500 font-semibold">
                              P:{meal.protein}g C:{meal.carbs}g F:{meal.fat}g
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeleteMeal(meal._id)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-red-650 hover:bg-red-50 transition-all"
                            title="Delete entry"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Ingredients list breakdown */}
                      {meal.ingredients && meal.ingredients.length > 0 && (
                        <div className="pl-1">
                          <button
                            onClick={() => toggleMealExpand(meal._id)}
                            className="text-[10px] text-pink-600 hover:text-pink-700 font-bold flex items-center"
                          >
                            {expandedMeals[meal._id] ? 'Hide ingredients list [-]' : 'Show ingredients list [+]'}
                          </button>
                          
                          {expandedMeals[meal._id] && (
                            <div className="mt-1.5 p-2.5 bg-zinc-50/50 rounded-xl space-y-1.5 border border-zinc-100">
                              {meal.ingredients.map((ing, idx) => (
                                <div key={idx} className="flex justify-between items-center text-[10px] text-zinc-500 font-semibold">
                                  <span className="capitalize">{ing.grams}g {ing.name}</span>
                                  <span>{ing.calories} kcal (P: {ing.protein}g | C: {ing.carbs}g | F: {ing.fat}g)</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Nutrition stats sidebar summaries */}
        <div className="space-y-6">
          
          {/* Calorie Card mini summary */}
          <div className="bg-white border border-zinc-100 rounded-3xl p-6 flex flex-col items-center justify-center text-center shadow-sm">
            <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center space-x-1.5 mb-4">
              <Flame size={14} className="text-pink-500" />
              <span>Calorie Summary</span>
            </div>

            <div className="w-32 h-32 relative flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="45"
                  className="stroke-zinc-100 fill-none"
                  strokeWidth="8"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="45"
                  className="stroke-pink-500 fill-none transition-all duration-300"
                  strokeWidth="8"
                  strokeDasharray={2 * Math.PI * 45}
                  strokeDashoffset={2 * Math.PI * 45 - (Math.min(100, Math.round(((summary?.totalCalories || 0) / (summary?.calorieTarget || 2000)) * 100)) / 100) * (2 * Math.PI * 45)}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-zinc-950">{summary?.totalCalories || 0}</span>
                <span className="text-[9px] uppercase font-bold text-zinc-450 tracking-wider">kcal</span>
              </div>
            </div>

            <div className="w-full text-xs space-y-2.5 mt-5 border-t border-zinc-100 pt-4 text-zinc-700 font-semibold">
              <div className="flex justify-between">
                <span>Logged Calories:</span>
                <span className="font-extrabold text-zinc-950">{summary?.totalCalories || 0} kcal</span>
              </div>
              <div className="flex justify-between">
                <span>Remaining Target:</span>
                <span className={`font-extrabold ${((summary?.calorieTarget || 2000) - (summary?.totalCalories || 0)) >= 0 ? 'text-pink-600' : 'text-rose-500'}`}>
                  {(summary?.calorieTarget || 2000) - (summary?.totalCalories || 0)} kcal
                </span>
              </div>
            </div>
          </div>

          {/* Macros Card sidebar summaries */}
          <div className="bg-white border border-zinc-100 rounded-3xl p-6 shadow-sm">
            <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center space-x-1.5 mb-4">
              <Scale size={14} className="text-pink-500" />
              <span>Macronutrient Targets</span>
            </div>

            <div className="space-y-4">
              {[
                { name: 'Protein', consumed: summary?.totalProtein || 0, target: summary?.proteinTarget || 140, color: 'bg-pink-500' },
                { name: 'Carbs', consumed: summary?.totalCarbs || 0, target: summary?.carbTarget || 220, color: 'bg-emerald-500' },
                { name: 'Fat', consumed: summary?.totalFat || 0, target: summary?.fatTarget || 65, color: 'bg-sky-500' },
                { name: 'Fiber', consumed: summary?.totalFiber || 0, target: 30, color: 'bg-zinc-400' }
              ].map(macro => {
                const pct = Math.min(100, Math.round((macro.consumed / macro.target) * 100));
                return (
                  <div key={macro.name} className="space-y-1 text-zinc-900">
                    <div className="flex justify-between text-xs font-bold">
                      <span>{macro.name}</span>
                      <span className="text-zinc-500">
                        <strong>{macro.consumed}g</strong> / {macro.target}g
                      </span>
                    </div>
                    <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
                      <div className={`${macro.color} h-full rounded-full transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
