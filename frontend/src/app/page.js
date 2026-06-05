'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { profileAPI, trackerAPI, pantryAPI } from '../utils/api';
import Link from 'next/link';
import { 
  Flame, 
  Droplet, 
  Sparkles, 
  AlertTriangle, 
  Plus, 
  Minus,
  TrendingUp,
  Apple,
  Utensils
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [dailyLog, setDailyLog] = useState(null);
  const [expiringItems, setExpiringItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [waterChangeLoading, setWaterChangeLoading] = useState(false);
  const [historyData, setHistoryData] = useState([]);

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        // Load profile targets
        const profileRes = await profileAPI.getProfile();
        if (profileRes.success) {
          setProfile(profileRes.profile);
        }

        // Load today's log summary
        const logRes = await trackerAPI.getDaily(todayStr);
        if (logRes.success) {
          setDailyLog(logRes.summary);
        }

        // Load expiring pantry items
        const expiringRes = await pantryAPI.getExpiring();
        if (expiringRes.success) {
          setExpiringItems(expiringRes.items);
        }

        // Load history for charting
        const historyRes = await trackerAPI.getHistory('week');
        if (historyRes.success) {
          setHistoryData(historyRes.summaries || []);
        }
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user && user.hasProfile) {
      loadDashboardData();
    }
  }, [user]);

  const handleUpdateWater = async (amount) => {
    if (waterChangeLoading) return;
    try {
      setWaterChangeLoading(true);
      const res = await trackerAPI.updateWater(amount, todayStr);
      if (res.success) {
        setDailyLog(prev => ({
          ...prev,
          waterIntake: res.waterIntake
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setWaterChangeLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-emerald-500" />
      </div>
    );
  }

  // Fallbacks if stats not loaded
  const calorieTarget = profile?.calorieTarget || 2000;
  const caloriesConsumed = dailyLog?.totalCalories || 0;
  const remainingCalories = Math.max(0, calorieTarget - caloriesConsumed);
  const caloriePercent = Math.min(100, Math.round((caloriesConsumed / calorieTarget) * 100));

  // Circular progress stroke calculation
  const circleRadius = 50;
  const circleCircumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circleCircumference - (caloriePercent / 100) * circleCircumference;

  // Macros progress mapping
  const macros = [
    { 
      name: 'Protein', 
      consumed: dailyLog?.totalProtein || 0, 
      target: profile?.proteinTarget || 150, 
      unit: 'g',
      color: 'bg-indigo-500', 
      text: 'text-indigo-400' 
    },
    { 
      name: 'Carbs', 
      consumed: dailyLog?.totalCarbs || 0, 
      target: profile?.carbTarget || 220, 
      unit: 'g',
      color: 'bg-emerald-500', 
      text: 'text-emerald-400' 
    },
    { 
      name: 'Fat', 
      consumed: dailyLog?.totalFat || 0, 
      target: profile?.fatTarget || 65, 
      unit: 'g',
      color: 'bg-amber-500', 
      text: 'text-amber-400' 
    }
  ];

  // Expiring items display count
  const expiringCount = expiringItems.length;

  // Render dynamic SVG chart from history logs
  const renderCalorieChart = () => {
    if (historyData.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-48 bg-zinc-950/20 rounded-2xl border border-zinc-800/50">
          <Utensils size={24} className="text-zinc-600 mb-2" />
          <p className="text-xs text-zinc-500">No calorie logs for this week yet.</p>
        </div>
      );
    }

    const maxCalorieVal = Math.max(...historyData.map(h => h.totalCalories), calorieTarget, 1000);
    const chartHeight = 150;
    const chartWidth = 500;
    const padding = 20;

    // Generate points
    const points = historyData.map((d, index) => {
      const x = padding + (index * (chartWidth - padding * 2)) / (historyData.length - 1 || 1);
      const y = chartHeight - padding - (d.totalCalories * (chartHeight - padding * 2)) / maxCalorieVal;
      return { x, y, val: d.totalCalories, date: d.date.split('-').slice(1).join('/') };
    });

    const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    
    // Closed path for gradient fill
    const areaPathData = points.length > 0 
      ? `${pathData} L ${points[points.length - 1].x} ${chartHeight - padding} L ${points[0].x} ${chartHeight - padding} Z` 
      : '';

    // Target baseline Y coordinate
    const targetY = chartHeight - padding - (calorieTarget * (chartHeight - padding * 2)) / maxCalorieVal;

    return (
      <div className="w-full overflow-x-auto select-none">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full min-w-[400px] overflow-visible">
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1={padding} y1={chartHeight - padding} x2={chartWidth - padding} y2={chartHeight - padding} stroke="#27272a" strokeWidth={1} />
          <line x1={padding} y1={padding} x2={chartWidth - padding} y2={padding} stroke="#27272a" strokeWidth={0.5} strokeDasharray="3,3" />

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
          {areaPathData && <path d={areaPathData} fill="url(#chartGradient)" />}

          {/* Line Path */}
          {pathData && <path d={pathData} fill="none" stroke="#10b981" strokeWidth={2} />}

          {/* Data Nodes */}
          {points.map((p, idx) => (
            <g key={idx}>
              <circle cx={p.x} cy={p.y} r={3} fill="#10b981" stroke="#09090b" strokeWidth={1} />
              <text x={p.x} y={p.y - 8} fill="#a1a1aa" fontSize={8} textAnchor="middle">
                {p.val}
              </text>
              <text x={p.x} y={chartHeight - padding + 12} fill="#71717a" fontSize={8} textAnchor="middle">
                {p.date}
              </text>
            </g>
          ))}
        </svg>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-gradient-to-r from-emerald-950/20 via-zinc-900/50 to-teal-950/20 border border-zinc-800 p-6 md:p-8 rounded-3xl backdrop-blur-md relative overflow-hidden">
        <div className="absolute right-10 top-0 bottom-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-2xl" />
        <div className="space-y-2 relative z-10">
          <h1 className="text-3xl font-extrabold tracking-tight">
            Hi, <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">{user?.name}</span>
          </h1>
          <p className="text-sm text-zinc-400 max-w-lg">
            Welcome back to your nutrition dashboard. Today is a great day to eat clean, reduce pantry waste, and hit your fitness targets.
          </p>
          {expiringCount > 0 && (
            <div className="flex items-center space-x-2 text-xs text-amber-400 font-semibold bg-amber-950/20 border border-amber-900/30 p-2.5 rounded-xl mt-3 inline-block">
              <AlertTriangle size={14} />
              <span>You have {expiringCount} pantry item{expiringCount > 1 ? 's' : ''} expiring soon!</span>
              <Link href="/pantry" className="underline hover:text-amber-300 ml-1">
                View Pantry
              </Link>
            </div>
          )}
        </div>
        <div className="mt-4 md:mt-0 flex shrink-0 space-x-3">
          <Link href="/tracker" className="flex items-center space-x-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-4 py-3 rounded-xl shadow-lg shadow-emerald-900/10 transition-all">
            <Plus size={16} />
            <span>Log a Meal</span>
          </Link>
          <Link href="/chat" className="flex items-center space-x-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-semibold text-xs px-4 py-3 rounded-xl transition-all">
            <Sparkles size={16} className="text-emerald-400" />
            <span>Ask Kitchen Copilot</span>
          </Link>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Calorie Ring Budget Card */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden h-[340px]">
          <div className="absolute top-4 left-4 text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center space-x-1.5">
            <Flame size={14} className="text-orange-500" />
            <span>Calorie Budget</span>
          </div>

          <div className="relative w-40 h-40 flex items-center justify-center mt-4">
            {/* SVG Progress Circle */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="80"
                cy="80"
                r={circleRadius}
                className="stroke-zinc-800 fill-none"
                strokeWidth="10"
              />
              <circle
                cx="80"
                cy="80"
                r={circleRadius}
                className="stroke-emerald-500 fill-none transition-all duration-500"
                strokeWidth="10"
                strokeDasharray={circleCircumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-3xl font-extrabold text-white">{remainingCalories}</span>
              <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">kcal left</span>
            </div>
          </div>

          <div className="w-full grid grid-cols-2 gap-4 mt-6 border-t border-zinc-800/60 pt-4">
            <div>
              <p className="text-[10px] uppercase font-bold text-zinc-500">Consumed</p>
              <p className="text-lg font-bold text-emerald-400">{caloriesConsumed} kcal</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-zinc-500">Target Budget</p>
              <p className="text-lg font-bold text-zinc-200">{calorieTarget} kcal</p>
            </div>
          </div>
        </div>

        {/* Macronutrient Budgets Card */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-6 flex flex-col justify-between h-[340px]">
          <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center space-x-1.5">
            <Apple size={14} className="text-indigo-400" />
            <span>Macronutrient Targets</span>
          </div>

          <div className="space-y-5 flex-1 flex flex-col justify-center mt-2">
            {macros.map((macro) => {
              const pct = Math.min(100, Math.round((macro.consumed / macro.target) * 100));
              return (
                <div key={macro.name} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-zinc-200">{macro.name}</span>
                    <span className="text-zinc-400">
                      <strong className={macro.text}>{macro.consumed}{macro.unit}</strong> / {macro.target}{macro.unit} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-zinc-800/80 h-2.5 rounded-full overflow-hidden border border-zinc-700/30">
                    <div 
                      className={`${macro.color} h-full rounded-full transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-[10px] text-zinc-500 text-center border-t border-zinc-800/60 pt-4 font-medium">
            Macronutrients are automatically computed based on health goal.
          </div>
        </div>

        {/* Water Intake Logger Card */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-6 flex flex-col justify-between h-[340px]">
          <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center space-x-1.5">
            <Droplet size={14} className="text-teal-400" />
            <span>Water Intake</span>
          </div>

          <div className="flex flex-col items-center justify-center py-4 relative">
            <span className="text-4xl font-extrabold text-teal-400">{dailyLog?.waterIntake || 0} <span className="text-sm font-semibold text-zinc-500">ml</span></span>
            <span className="text-xs text-zinc-400 mt-1">Daily Target: 3000 ml</span>
            
            {/* Visual cup status */}
            <div className="flex items-center space-x-1.5 mt-5">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((cupNum) => {
                const cupThreshold = cupNum * 250;
                const active = (dailyLog?.waterIntake || 0) >= cupThreshold;
                return (
                  <div 
                    key={cupNum}
                    className={`w-3.5 h-6 rounded-b-md border transition-all duration-300
                      ${active 
                        ? 'bg-teal-500/80 border-teal-400 shadow-sm shadow-teal-500/20' 
                        : 'bg-zinc-800/30 border-zinc-700'}`}
                  />
                );
              })}
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => handleUpdateWater(250)}
              disabled={waterChangeLoading}
              className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-750 active:scale-98 border border-zinc-700 text-zinc-200 text-xs font-bold rounded-xl flex items-center justify-center space-x-1 transition-all"
            >
              <Plus size={14} className="text-teal-400" />
              <span>Cup (+250ml)</span>
            </button>
            <button
              onClick={() => handleUpdateWater(500)}
              disabled={waterChangeLoading}
              className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-750 active:scale-98 border border-zinc-700 text-zinc-200 text-xs font-bold rounded-xl flex items-center justify-center space-x-1 transition-all"
            >
              <Plus size={14} className="text-teal-400" />
              <span>Bottle (+500ml)</span>
            </button>
          </div>
        </div>

      </div>

      {/* Progress Charts & Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Calorie Analytics Line Chart */}
        <div className="lg:col-span-2 bg-zinc-900/40 border border-zinc-800 rounded-3xl p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center space-x-1.5">
              <TrendingUp size={14} className="text-emerald-400" />
              <span>Weekly Calorie Trends</span>
            </h3>
            <span className="text-[10px] text-zinc-500 font-semibold uppercase">Last 7 Days</span>
          </div>
          {renderCalorieChart()}
        </div>

        {/* Near Expiry Pantry Highlights */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center space-x-1.5">
              <AlertTriangle size={14} className="text-amber-500" />
              <span>Fridge Expiry Warning</span>
            </h3>

            {expiringItems.length === 0 ? (
              <div className="py-8 text-center text-zinc-500 text-xs flex flex-col items-center">
                <Sparkles size={20} className="text-emerald-400 mb-2" />
                <span>All ingredients are perfectly fresh!</span>
              </div>
            ) : (
              <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                {expiringItems.slice(0, 4).map((item) => {
                  const daysLeft = Math.ceil((new Date(item.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
                  return (
                    <div key={item._id} className="flex justify-between items-center bg-zinc-950/40 border border-zinc-800 p-3 rounded-xl text-xs">
                      <div>
                        <p className="font-bold text-zinc-200">{item.name}</p>
                        <p className="text-[10px] text-zinc-500">{item.quantity} {item.unit}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border
                        ${daysLeft <= 1 
                          ? 'bg-red-950/20 text-red-400 border-red-900/30' 
                          : 'bg-amber-950/20 text-amber-400 border-amber-900/30'}`}
                      >
                        {daysLeft <= 0 ? 'Expired' : daysLeft === 1 ? 'Expires Tomorrow' : `Expires in ${daysLeft} days`}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <Link href="/pantry" className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-750 text-center text-xs font-semibold rounded-xl border border-zinc-700 text-zinc-300 block transition-all mt-4">
            Manage Pantry Items
          </Link>
        </div>

      </div>

    </div>
  );
}
