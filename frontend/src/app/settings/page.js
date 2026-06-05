'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { profileAPI } from '../../utils/api';
import { 
  User, 
  Key, 
  Settings, 
  Check, 
  Info,
  Scale,
  Ruler,
  Calendar,
  Loader,
  AlertCircle
} from 'lucide-react';

export default function SettingsPage() {
  const { refreshUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingStats, setSavingStats] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [savingKeys, setSavingKeys] = useState(false);

  // Form errors / successes
  const [statsError, setStatsError] = useState('');
  const [statsSuccess, setStatsSuccess] = useState('');
  
  const [prefsError, setPrefsError] = useState('');
  const [prefsSuccess, setPrefsSuccess] = useState('');
  
  const [keysError, setKeysError] = useState('');
  const [keysSuccess, setKeysSuccess] = useState('');

  // Form fields
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('male');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [activityLevel, setActivityLevel] = useState('moderate');
  const [goal, setGoal] = useState('healthy_lifestyle');
  
  const [dietaryRestrictions, setDietaryRestrictions] = useState([]);
  const [favoriteCuisines, setFavoriteCuisines] = useState([]);
  
  const [provider, setProvider] = useState('none');
  const [apiKey, setApiKey] = useState('');

  const restrictionOptions = [
    { id: 'vegetarian', name: 'Vegetarian' },
    { id: 'vegan', name: 'Vegan' },
    { id: 'gluten-free', name: 'Gluten-Free' },
    { id: 'dairy-free', name: 'Dairy-Free' },
    { id: 'keto', name: 'Keto-Friendly' },
  ];

  const cuisineOptions = [
    { id: 'indian', name: 'Indian' },
    { id: 'italian', name: 'Italian' },
    { id: 'mexican', name: 'Mexican' },
    { id: 'asian', name: 'Asian' },
    { id: 'mediterranean', name: 'Mediterranean' },
    { id: 'american', name: 'American' },
  ];

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await profileAPI.getProfile();
      if (res.success && res.profile) {
        const p = res.profile;
        setProfile(p);
        setAge(p.age || '');
        setGender(p.gender || 'male');
        setHeight(p.height || '');
        setWeight(p.weight || '');
        setActivityLevel(p.activityLevel || 'moderate');
        setGoal(p.goal || 'healthy_lifestyle');
        setDietaryRestrictions(p.dietaryRestrictions || []);
        setFavoriteCuisines(p.favoriteCuisines || []);
        setProvider(p.customApiKey?.provider || 'none');
        setApiKey(p.customApiKey?.key || '');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatsSubmit = async (e) => {
    e.preventDefault();
    setStatsError('');
    setStatsSuccess('');

    if (!age || !height || !weight) {
      return setStatsError('Please fill in age, height and weight');
    }

    setSavingStats(true);
    try {
      const res = await profileAPI.saveProfile({
        age: Number(age),
        gender,
        height: Number(height),
        weight: Number(weight),
        activityLevel,
        goal
      });

      if (res.success) {
        setProfile(res.profile);
        setStatsSuccess('Health statistics updated successfully');
        await refreshUser(); // Update header targets
      }
    } catch (err) {
      setStatsError(err.message || 'Failed to update stats');
    } finally {
      setSavingStats(false);
    }
  };

  const handlePrefsSubmit = async (e) => {
    e.preventDefault();
    setPrefsError('');
    setPrefsSuccess('');

    setSavingPrefs(true);
    try {
      const res = await profileAPI.updatePreferences({
        dietaryRestrictions,
        favoriteCuisines
      });

      if (res.success) {
        setProfile(res.profile);
        setPrefsSuccess('Dietary preferences updated successfully');
      }
    } catch (err) {
      setPrefsError(err.message || 'Failed to update preferences');
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleKeysSubmit = async (e) => {
    e.preventDefault();
    setKeysError('');
    setKeysSuccess('');

    setSavingKeys(true);
    try {
      const res = await profileAPI.updatePreferences({
        customApiKey: {
          provider,
          key: apiKey
        }
      });

      if (res.success) {
        setProfile(res.profile);
        setKeysSuccess('LLM provider configuration saved successfully');
      }
    } catch (err) {
      setKeysError(err.message || 'Failed to save configuration');
    } finally {
      setSavingKeys(false);
    }
  };

  const toggleRestriction = (id) => {
    if (dietaryRestrictions.includes(id)) {
      setDietaryRestrictions(dietaryRestrictions.filter(item => item !== id));
    } else {
      setDietaryRestrictions([...dietaryRestrictions, id]);
    }
  };

  const toggleCuisine = (id) => {
    if (favoriteCuisines.includes(id)) {
      setFavoriteCuisines(favoriteCuisines.filter(item => item !== id));
    } else {
      setFavoriteCuisines([...favoriteCuisines, id]);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Loader className="animate-spin text-emerald-500" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center space-x-2">
          <Settings size={28} className="text-zinc-400" />
          <span>Profile Settings</span>
        </h1>
        <p className="text-sm text-zinc-400">Configure health goals, dietary preferences, and custom AI settings.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Stats card */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center space-x-1.5 border-b border-zinc-800 pb-3">
            <User size={16} className="text-emerald-400" />
            <span>Health & Fitness Metrics</span>
          </h3>

          <form onSubmit={handleStatsSubmit} className="space-y-4 text-xs font-semibold">
            {statsSuccess && <p className="text-emerald-400 bg-emerald-950/20 border border-emerald-900/30 p-2.5 rounded-xl">{statsSuccess}</p>}
            {statsError && <p className="text-red-400 bg-red-950/20 border border-red-900/30 p-2.5 rounded-xl">{statsError}</p>}

            <div>
              <label className="block text-zinc-400 uppercase tracking-wider mb-1">Gender</label>
              <select 
                value={gender} 
                onChange={(e) => setGender(e.target.value)}
                className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl py-3 px-3 text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-zinc-400 uppercase tracking-wider mb-1 flex items-center"><Calendar size={12} className="mr-1 text-zinc-500" />Age</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full text-center bg-zinc-950/50 border border-zinc-800 rounded-xl py-2.5 px-2 text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-zinc-400 uppercase tracking-wider mb-1 flex items-center"><Ruler size={12} className="mr-1 text-zinc-500" />Height</label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="w-full text-center bg-zinc-950/50 border border-zinc-800 rounded-xl py-2.5 px-2 text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-zinc-400 uppercase tracking-wider mb-1 flex items-center"><Scale size={12} className="mr-1 text-zinc-500" />Weight</label>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full text-center bg-zinc-950/50 border border-zinc-800 rounded-xl py-2.5 px-2 text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-zinc-400 uppercase tracking-wider mb-1">Activity Level</label>
              <select 
                value={activityLevel} 
                onChange={(e) => setActivityLevel(e.target.value)}
                className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl py-3 px-3 text-white focus:border-emerald-500 focus:outline-none font-sans"
              >
                <option value="sedentary">Sedentary (No exercise)</option>
                <option value="light">Light (1-3 days/week)</option>
                <option value="moderate">Moderate (3-5 days/week)</option>
                <option value="active">Active (6-7 days/week)</option>
                <option value="extra">Extra Active (Very heavy sports)</option>
              </select>
            </div>

            <div>
              <label className="block text-zinc-400 uppercase tracking-wider mb-1">Health Goal</label>
              <select 
                value={goal} 
                onChange={(e) => setGoal(e.target.value)}
                className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl py-3 px-3 text-white focus:border-emerald-500 focus:outline-none font-sans"
              >
                <option value="weight_loss">Weight Loss</option>
                <option value="weight_gain">Weight Gain</option>
                <option value="muscle_gain">Muscle Gain</option>
                <option value="maintenance">Maintenance</option>
                <option value="healthy_lifestyle">Healthy Lifestyle</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={savingStats}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center"
            >
              {savingStats ? <Loader size={14} className="animate-spin" /> : <span>Update Stats</span>}
            </button>
          </form>
        </div>

        {/* Dietary preferences card */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center space-x-1.5 border-b border-zinc-800 pb-3">
            <Scale size={16} className="text-indigo-400" />
            <span>Preferences & Restrictions</span>
          </h3>

          <form onSubmit={handlePrefsSubmit} className="space-y-5">
            {prefsSuccess && <p className="text-emerald-400 bg-emerald-950/20 border border-emerald-900/30 p-2.5 rounded-xl text-xs font-semibold">{prefsSuccess}</p>}
            {prefsError && <p className="text-red-400 bg-red-950/20 border border-red-900/30 p-2.5 rounded-xl text-xs font-semibold">{prefsError}</p>}

            <div className="space-y-2.5">
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">Dietary Exclusions</label>
              <div className="flex flex-wrap gap-2">
                {restrictionOptions.map(option => {
                  const isSelected = dietaryRestrictions.includes(option.id);
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => toggleRestriction(option.id)}
                      className={`px-3 py-1.5 rounded-full border text-[10px] font-bold flex items-center space-x-1 transition-all
                        ${isSelected 
                          ? 'border-emerald-500 bg-emerald-950/30 text-emerald-400' 
                          : 'border-zinc-800 bg-zinc-950/50 text-zinc-500 hover:border-zinc-700'}`}
                    >
                      {isSelected && <Check size={10} />}
                      <span>{option.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2.5">
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">Favorite Cuisines</label>
              <div className="flex flex-wrap gap-2">
                {cuisineOptions.map(option => {
                  const isSelected = favoriteCuisines.includes(option.id);
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => toggleCuisine(option.id)}
                      className={`px-3 py-1.5 rounded-full border text-[10px] font-bold flex items-center space-x-1 transition-all
                        ${isSelected 
                          ? 'border-emerald-500 bg-emerald-950/30 text-emerald-400' 
                          : 'border-zinc-800 bg-zinc-950/50 text-zinc-500 hover:border-zinc-700'}`}
                    >
                      {isSelected && <Check size={10} />}
                      <span>{option.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={savingPrefs}
              className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-750 text-zinc-200 text-xs font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center shadow-md"
            >
              {savingPrefs ? <Loader size={14} className="animate-spin" /> : <span>Update Preferences</span>}
            </button>
          </form>
        </div>

        {/* AI key settings card */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center space-x-1.5 border-b border-zinc-800 pb-3">
            <Key size={16} className="text-teal-400" />
            <span>Kitchen Copilot AI Key</span>
          </h3>

          <form onSubmit={handleKeysSubmit} className="space-y-4 text-xs font-semibold">
            {keysSuccess && <p className="text-emerald-400 bg-emerald-950/20 border border-emerald-900/30 p-2.5 rounded-xl">{keysSuccess}</p>}
            {keysError && <p className="text-red-400 bg-red-950/20 border border-red-900/30 p-2.5 rounded-xl">{keysError}</p>}

            <div>
              <label className="block text-zinc-400 uppercase tracking-wider mb-1">Select AI Engine</label>
              <select 
                value={provider} 
                onChange={(e) => setProvider(e.target.value)}
                className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl py-3 px-3 text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="none">Local Mock Engine (Out-of-the-box)</option>
                <option value="gemini">Google Gemini API</option>
                <option value="openai">OpenAI GPT API</option>
              </select>
            </div>

            {provider !== 'none' && (
              <div className="space-y-1">
                <label className="block text-zinc-400 uppercase tracking-wider mb-1">Paste API Key</label>
                <input
                  type="password"
                  placeholder="e.g. AIzaSy..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="block w-full rounded-xl border border-zinc-800 bg-zinc-950/50 py-3 px-3.5 text-sm text-zinc-200 focus:border-emerald-500 focus:outline-none"
                />
                <p className="text-[9px] text-zinc-500 font-semibold leading-relaxed flex items-start space-x-1 mt-1">
                  <Info size={12} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span>Keys are stored in your private database profile and only used when communicating with AI providers.</span>
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={savingKeys}
              className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-750 text-zinc-200 text-xs font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center shadow-md"
            >
              {savingKeys ? <Loader size={14} className="animate-spin" /> : <span>Save API Config</span>}
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}
