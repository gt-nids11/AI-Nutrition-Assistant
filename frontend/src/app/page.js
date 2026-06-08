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
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-pink-500" />
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
      color: 'bg-rose-400', 
      text: 'text-rose-600' 
    },
    { 
      name: 'Carbs', 
      consumed: dailyLog?.totalCarbs || 0, 
      target: profile?.carbTarget || 220, 
      unit: 'g',
      color: 'bg-pink-400', 
      text: 'text-pink-600' 
    },
    { 
      name: 'Fat', 
      consumed: dailyLog?.totalFat || 0, 
      target: profile?.fatTarget || 65, 
      unit: 'g',
      color: 'bg-pink-300', 
      text: 'text-pink-500' 
    }
  ];

  // Expiring items display count
  const expiringCount = expiringItems.length;

  // Render dynamic SVG chart from history logs
  const renderCalorieChart = () => {
    if (historyData.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-48 bg-pink-50/20 rounded-2xl border border-pink-100">
          <Utensils size={24} className="text-pink-300 mb-2" />
          <p className="text-xs text-rose-500/80">No calorie logs for this week yet.</p>
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
              <stop offset="0%" stopColor="#FF4FA3" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#FF4FA3" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1={padding} y1={chartHeight - padding} x2={chartWidth - padding} y2={chartHeight - padding} stroke="#FFE08A" strokeWidth={1} />
          <line x1={padding} y1={padding} x2={chartWidth - padding} y2={padding} stroke="#FFE08A" strokeWidth={0.5} strokeDasharray="3,3" />

          {/* Target Baseline */}
          <line 
            x1={padding} 
            y1={targetY} 
            x2={chartWidth - padding} 
            y2={targetY} 
            stroke="#FF4FA3" 
            strokeWidth={1} 
            strokeDasharray="4,4" 
          />
          <text x={chartWidth - padding - 60} y={targetY - 5} fill="#1F1F1F" fontSize={8} className="font-extrabold">
            Target: {calorieTarget} kcal
          </text>

          {/* Area Fill */}
          {areaPathData && <path d={areaPathData} fill="url(#chartGradient)" />}

          {/* Line Path */}
          {pathData && <path d={pathData} fill="none" stroke="#FF4FA3" strokeWidth={2} />}

          {/* Data Nodes */}
          {points.map((p, idx) => (
            <g key={idx}>
              <circle cx={p.x} cy={p.y} r={3} fill="#FFD93D" stroke="#FF4FA3" strokeWidth={1.5} />
              <text x={p.x} y={p.y - 8} fill="#1F1F1F" fontSize={8} textAnchor="middle" className="font-bold">
                {p.val}
              </text>
              <text x={p.x} y={chartHeight - padding + 12} fill="#1F1F1F" fontSize={8} textAnchor="middle" className="font-bold">
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-gradient-to-r from-pink-100/40 via-white to-rose-100/40 border border-pink-200/50 p-6 md:p-8 rounded-3xl backdrop-blur-md relative overflow-hidden shadow-sm">
        <div className="absolute right-10 top-0 bottom-0 w-48 h-48 bg-pink-500/5 rounded-full blur-2xl" />
        <div className="space-y-2 relative z-10">
          <h1 className="text-3xl font-extrabold tracking-tight">
            Hi, <span className="bg-gradient-to-r from-pink-600 to-rose-500 bg-clip-text text-transparent">{user?.name}</span>
          </h1>
          <p className="text-sm text-rose-700 max-w-lg font-semibold">
            Welcome back to your nutrition dashboard. Today is a great day to eat clean, reduce pantry waste, and hit your fitness targets.
          </p>
          {expiringCount > 0 && (
            <div className="flex items-center space-x-2 text-xs text-pink-700 font-extrabold bg-pink-100 border border-pink-200/50 p-2.5 rounded-xl mt-3 inline-block">
              <AlertTriangle size={14} className="text-pink-550" />
              <span>You have {expiringCount} pantry item{expiringCount > 1 ? 's' : ''} expiring soon!</span>
              <Link href="/pantry" className="underline hover:text-pink-900 ml-1">
                View Pantry
              </Link>
            </div>
          )}
        </div>
        <div className="mt-4 md:mt-0 flex shrink-0 space-x-3">
          <Link href="/tracker" className="flex items-center space-x-1 bg-pink-500 hover:bg-pink-400 text-white font-extrabold text-xs px-4 py-3 rounded-xl shadow-lg shadow-pink-500/10 transition-all">
            <Plus size={16} />
            <span>Log a Meal</span>
          </Link>
          <Link href="/chat" className="flex items-center space-x-1 bg-white hover:bg-pink-50 text-pink-700 border border-pink-200/50 font-extrabold text-xs px-4 py-3 rounded-xl transition-all">
            <Sparkles size={16} className="text-pink-500" />
            <span>Ask Kitchen Copilot</span>
          </Link>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Calorie Ring Budget Card */}
        <div className="bg-white border border-pink-100 rounded-3xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden h-[340px] shadow-sm shadow-pink-100/20">
          <div className="absolute top-4 left-4 text-xs font-bold text-rose-600/75 uppercase tracking-widest flex items-center space-x-1.5">
            <Flame size={14} className="text-pink-550" />
            <span>Calorie Budget</span>
          </div>

          <div className="relative w-40 h-40 flex items-center justify-center mt-4">
            {/* SVG Progress Circle */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="80"
                cy="80"
                r={circleRadius}
                className="stroke-pink-100 fill-none"
                strokeWidth="10"
              />
              <circle
                cx="80"
                cy="80"
                r={circleRadius}
                className="stroke-pink-500 fill-none transition-all duration-500"
                strokeWidth="10"
                strokeDasharray={circleCircumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-rose-950">{remainingCalories}</span>
              <span className="text-[10px] uppercase font-bold text-rose-500/80 tracking-wider">kcal left</span>
            </div>
          </div>

          <div className="w-full grid grid-cols-2 gap-4 mt-6 border-t border-pink-100 pt-4">
            <div>
              <p className="text-[10px] uppercase font-bold text-rose-550">Consumed</p>
              <p className="text-lg font-extrabold text-pink-600">{caloriesConsumed} kcal</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-rose-550">Target Budget</p>
              <p className="text-lg font-extrabold text-rose-950">{calorieTarget} kcal</p>
            </div>
          </div>
        </div>

        {/* Macronutrient Budgets Card */}
        <div className="bg-white border border-pink-100 rounded-3xl p-6 flex flex-col justify-between h-[340px] shadow-sm shadow-pink-100/20">
          <div className="text-xs font-bold text-rose-600/75 uppercase tracking-widest flex items-center space-x-1.5">
            <Apple size={14} className="text-pink-550" />
            <span>Macronutrient Targets</span>
          </div>

          <div className="space-y-5 flex-1 flex flex-col justify-center mt-2">
            {macros.map((macro) => {
              const pct = Math.min(100, Math.round((macro.consumed / macro.target) * 100));
              return (
                <div key={macro.name} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-rose-950">{macro.name}</span>
                    <span className="text-rose-700/80">
                      <strong className={macro.text}>{macro.consumed}{macro.unit}</strong> / {macro.target}{macro.unit} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-pink-100/50 h-2.5 rounded-full overflow-hidden border border-pink-200/20">
                    <div 
                      className={`${macro.color} h-full rounded-full transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-[10px] text-rose-500/80 text-center border-t border-pink-100 pt-4 font-bold">
            Macronutrients are automatically computed based on health goal.
          </div>
        </div>

        {/* Water Intake Logger Card */}
        <div className="bg-white border border-pink-100 rounded-3xl p-6 flex flex-col justify-between h-[340px] shadow-sm shadow-pink-100/20">
          <div className="text-xs font-bold text-rose-600/75 uppercase tracking-widest flex items-center space-x-1.5">
            <Droplet size={14} className="text-pink-500" />
            <span>Water Intake</span>
          </div>

          <div className="flex flex-col items-center justify-center py-4 relative">
            <span className="text-4xl font-extrabold text-pink-600">{dailyLog?.waterIntake || 0} <span className="text-sm font-semibold text-rose-500">ml</span></span>
            <span className="text-xs text-rose-700 font-bold mt-1">Daily Target: 3000 ml</span>
            
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
                        ? 'bg-pink-400 border-pink-300 shadow-sm shadow-pink-450/20' 
                        : 'bg-pink-50 border-pink-100'}`}
                  />
                );
              })}
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => handleUpdateWater(250)}
              disabled={waterChangeLoading}
              className="flex-1 py-3 bg-pink-50 hover:bg-pink-100 active:scale-98 border border-pink-200/50 text-pink-700 text-xs font-extrabold rounded-xl flex items-center justify-center space-x-1 transition-all"
            >
              <Plus size={14} className="text-pink-500" />
              <span>Cup (+250ml)</span>
            </button>
            <button
              onClick={() => handleUpdateWater(500)}
              disabled={waterChangeLoading}
              className="flex-1 py-3 bg-pink-50 hover:bg-pink-100 active:scale-98 border border-pink-200/50 text-pink-700 text-xs font-extrabold rounded-xl flex items-center justify-center space-x-1 transition-all"
            >
              <Plus size={14} className="text-pink-500" />
              <span>Bottle (+500ml)</span>
            </button>
          </div>
        </div>

      </div>

      {/* Progress Charts & Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Calorie Analytics Line Chart */}
        <div className="lg:col-span-2 bg-white border border-pink-100 rounded-3xl p-6 space-y-4 shadow-sm shadow-pink-100/20">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-rose-650 uppercase tracking-widest flex items-center space-x-1.5">
              <TrendingUp size={14} className="text-pink-500" />
              <span>Weekly Calorie Trends</span>
            </h3>
            <span className="text-[10px] text-rose-500/80 font-bold uppercase">Last 7 Days</span>
          </div>
          {renderCalorieChart()}
        </div>

        {/* Near Expiry Pantry Highlights */}
        <div className="bg-white border border-pink-100 rounded-3xl p-6 flex flex-col justify-between shadow-sm shadow-pink-100/20">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-rose-650 uppercase tracking-widest flex items-center space-x-1.5">
              <AlertTriangle size={14} className="text-pink-600" />
              <span>Fridge Expiry Warning</span>
            </h3>

            {expiringItems.length === 0 ? (
              <div className="py-8 text-center text-rose-600 text-xs flex flex-col items-center">
                <Sparkles size={20} className="text-pink-500 mb-2 animate-pulse" />
                <span>All ingredients are perfectly fresh!</span>
              </div>
            ) : (
              <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                {expiringItems.slice(0, 4).map((item) => {
                  const daysLeft = Math.ceil((new Date(item.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
                  return (
                    <div key={item._id} className="flex justify-between items-center bg-pink-50/50 border border-pink-100 p-3 rounded-xl text-xs font-semibold">
                      <div>
                        <p className="font-extrabold text-rose-950 capitalize">{item.name}</p>
                        <p className="text-[10px] text-rose-600/80">{item.quantity} {item.unit}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border
                        ${daysLeft <= 1 
                          ? 'bg-red-100 text-red-700 border-red-200' 
                          : 'bg-amber-100 text-amber-700 border-amber-200'}`}
                      >
                        {daysLeft <= 0 ? 'Expired' : daysLeft === 1 ? 'Expires Tomorrow' : `Expires in ${daysLeft} days`}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <Link href="/pantry" className="w-full py-2.5 bg-pink-50 hover:bg-pink-100 text-center text-xs font-bold rounded-xl border border-pink-200 text-pink-700 block transition-all mt-4">
            Manage Pantry Items
          </Link>
        </div>

      </div>

    </div>
  );
}
