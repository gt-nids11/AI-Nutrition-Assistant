'use client';

import { useState, useEffect } from 'react';
import { trackerAPI } from '../../utils/api';
import { 
  Calendar, 
  History, 
  TrendingUp, 
  Utensils, 
  Scale, 
  Flame,
  Info,
  Loader
} from 'lucide-react';

export default function HistoryPage() {
  const [filter, setFilter] = useState('week'); // 'week' or 'month'
  const [meals, setMeals] = useState([]);
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistoryData();
  }, [filter]);

  const loadHistoryData = async () => {
    try {
      setLoading(true);
      const res = await trackerAPI.getHistory(filter);
      if (res.success) {
        setMeals(res.meals);
        setSummaries(res.summaries);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Group meals by date
  const groupMealsByDate = () => {
    const groups = {};
    meals.forEach(meal => {
      const dateObj = new Date(meal.loggedAt);
      const dateStr = dateObj.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
      if (!groups[dateStr]) {
        groups[dateStr] = [];
      }
      groups[dateStr].push(meal);
    });
    return groups;
  };

  const mealGroups = groupMealsByDate();
  const dates = Object.keys(mealGroups);

  // Compute Averages
  const computeAverages = () => {
    if (summaries.length === 0) return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    
    let cSum = 0, pSum = 0, carbSum = 0, fSum = 0;
    
    summaries.forEach(s => {
      cSum += s.totalCalories || 0;
      pSum += s.totalProtein || 0;
      carbSum += s.totalCarbs || 0;
      fSum += s.totalFat || 0;
    });

    const len = summaries.length;
    return {
      calories: Math.round(cSum / len),
      protein: Math.round(pSum / len),
      carbs: Math.round(carbSum / len),
      fat: Math.round(fSum / len)
    };
  };

  const averages = computeAverages();

  // Render SVG Trend Chart
  const renderTrendChart = () => {
    if (summaries.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-48 bg-zinc-950/20 rounded-2xl border border-zinc-800/50">
          <TrendingUp size={24} className="text-zinc-650 mb-2" />
          <p className="text-xs text-zinc-550">No logs in this duration yet.</p>
        </div>
      );
    }

    const chartHeight = 160;
    const chartWidth = 700;
    const padding = 25;
    
    const calorieTarget = summaries[0]?.calorieTarget || 2000;
    const maxVal = Math.max(...summaries.map(s => s.totalCalories), calorieTarget, 1000);

    const points = summaries.map((s, index) => {
      const x = padding + (index * (chartWidth - padding * 2)) / (summaries.length - 1 || 1);
      const y = chartHeight - padding - (s.totalCalories * (chartHeight - padding * 2)) / maxVal;
      return { x, y, val: s.totalCalories, date: s.date.split('-').slice(1).join('/') };
    });

    const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    
    // Closed path for gradient fill
    const areaPathData = points.length > 0 
      ? `${pathData} L ${points[points.length - 1].x} ${chartHeight - padding} L ${points[0].x} ${chartHeight - padding} Z` 
      : '';

    // Target baseline Y coordinate
    const targetY = chartHeight - padding - (calorieTarget * (chartHeight - padding * 2)) / maxVal;

    return (
      <div className="w-full overflow-x-auto select-none">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full min-w-[550px] overflow-visible">
          <defs>
            <linearGradient id="historyGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1={padding} y1={chartHeight - padding} x2={chartWidth - padding} y2={chartHeight - padding} stroke="#27272a" strokeWidth={1} />
          
          {/* Target Baseline */}
          <line 
            x1={padding} 
            y1={targetY} 
            x2={chartWidth - padding} 
            y2={targetY} 
            stroke="#ef4444" 
            strokeWidth={1} 
            strokeDasharray="4,4" 
          />
          <text x={chartWidth - padding - 60} y={targetY - 5} fill="#ef4444" fontSize={8} className="font-semibold">
            Target: {calorieTarget} kcal
          </text>

          {/* Area Fill */}
          {areaPathData && <path d={areaPathData} fill="url(#historyGradient)" />}

          {/* Line Path */}
          {pathData && <path d={pathData} fill="none" stroke="#10b981" strokeWidth={2} />}

          {/* Data Nodes */}
          {points.map((p, idx) => (
            <g key={idx}>
              <circle cx={p.x} cy={p.y} r={3} fill="#10b981" stroke="#09090b" strokeWidth={1} />
              
              {/* Show text values on nodes for week, hide/reduce for month to keep clean */}
              {(filter === 'week' || idx % 3 === 0) && (
                <>
                  <text x={p.x} y={p.y - 8} fill="#a1a1aa" fontSize={7} textAnchor="middle">
                    {p.val}
                  </text>
                  <text x={p.x} y={chartHeight - padding + 12} fill="#71717a" fontSize={7} textAnchor="middle">
                    {p.date}
                  </text>
                </>
              )}
            </g>
          ))}
        </svg>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Header & controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Meal History</h1>
          <p className="text-sm text-zinc-400">Review your past calorie logs and historical nutritional reports.</p>
        </div>
        
        {/* Toggle controls */}
        <div className="flex bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden self-start sm:self-auto shrink-0 p-1">
          <button
            onClick={() => setFilter('week')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all
              ${filter === 'week' 
                ? 'bg-emerald-600 text-white shadow-md' 
                : 'text-zinc-500 hover:text-zinc-350'}`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setFilter('month')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all
              ${filter === 'month' 
                ? 'bg-emerald-600 text-white shadow-md' 
                : 'text-zinc-500 hover:text-zinc-350'}`}
          >
            Last 30 Days
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader className="animate-spin text-emerald-500" size={32} />
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Dashboard Averages Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Avg Calories', val: averages.calories, unit: 'kcal', icon: Flame, text: 'text-orange-500' },
              { label: 'Avg Protein', val: averages.protein, unit: 'g', icon: Scale, text: 'text-indigo-400' },
              { label: 'Avg Carbs', val: averages.carbs, unit: 'g', icon: Utensils, text: 'text-emerald-400' },
              { label: 'Avg Fat', val: averages.fat, unit: 'g', icon: Scale, text: 'text-amber-500' }
            ].map(card => {
              const Icon = card.icon;
              return (
                <div key={card.label} className="bg-zinc-900/40 border border-zinc-850 p-5 rounded-2xl flex flex-col justify-between h-28 relative overflow-hidden">
                  <div className="flex justify-between items-center text-zinc-500 shrink-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider">{card.label}</span>
                    <Icon size={16} className={card.text} />
                  </div>
                  <div className="mt-2 shrink-0">
                    <span className="text-2xl font-black text-white">{card.val}</span>
                    <span className="text-xs text-zinc-500 ml-1">{card.unit}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Calorie trend chart wrapper */}
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center space-x-1.5">
              <TrendingUp size={14} className="text-emerald-400" />
              <span>Caloric Progress Graph</span>
            </h3>
            {renderTrendChart()}
          </div>

          {/* Historical Eaten Lists */}
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-6 space-y-5">
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center space-x-1.5">
              <History size={14} className="text-emerald-400" />
              <span>Meal History Log</span>
            </h3>

            {dates.length === 0 ? (
              <div className="text-center py-8 text-zinc-500 text-xs">
                <span>No logged entries in this range.</span>
              </div>
            ) : (
              <div className="space-y-6">
                {dates.map(dateStr => (
                  <div key={dateStr} className="space-y-2.5">
                    <div className="flex items-center space-x-2 py-1.5 border-b border-zinc-800/80 shrink-0">
                      <Calendar size={14} className="text-emerald-400" />
                      <span className="text-xs font-black text-zinc-350">{dateStr}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-1">
                      {mealGroups[dateStr].map(meal => (
                        <div key={meal._id} className="bg-zinc-950/40 border border-zinc-850 p-4 rounded-xl flex justify-between items-center text-xs">
                          <div>
                            <div className="flex items-center space-x-1.5">
                              <span className="font-bold text-zinc-200 capitalize">{meal.foodName}</span>
                              <span className="text-[8px] px-1.5 py-0.5 rounded-full border border-emerald-950 bg-emerald-950/20 text-emerald-400 font-bold capitalize">
                                {meal.mealType}
                              </span>
                            </div>
                            <p className="text-[9px] text-zinc-500 mt-1">
                              P: {meal.protein}g | C: {meal.carbs}g | F: {meal.fat}g | Fib: {meal.fiber}g
                            </p>
                          </div>
                          <span className="font-bold text-zinc-200 shrink-0 ml-4">{meal.calories} kcal</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
