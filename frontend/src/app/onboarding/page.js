'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { profileAPI } from '../../utils/api';
import { 
  Activity, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  User, 
  Scale, 
  Ruler, 
  Calendar,
  AlertCircle
} from 'lucide-react';

export default function OnboardingPage() {
  const { refreshUser } = useAuth();
  const router = useRouter();

  // Wizard state
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Form Fields
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('male');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [activityLevel, setActivityLevel] = useState('moderate');
  const [goal, setGoal] = useState('healthy_lifestyle');
  const [dietaryRestrictions, setDietaryRestrictions] = useState([]);
  const [favoriteCuisines, setFavoriteCuisines] = useState([]);

  // Mock list options
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

  const handleNext = () => {
    setError('');
    if (step === 1) {
      if (!age || !height || !weight) {
        return setError('Please fill in age, height, and weight fields');
      }
      if (isNaN(Number(age)) || isNaN(Number(height)) || isNaN(Number(weight))) {
        return setError('Metrics must be valid numbers');
      }
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handlePrev = () => {
    setError('');
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    setError('');
    setLoading(true);

    try {
      // 1. Save onboarding profile (computes BMR, TDEE, macros)
      const profileResponse = await profileAPI.saveProfile({
        age: Number(age),
        gender,
        height: Number(height),
        weight: Number(weight),
        activityLevel,
        goal
      });

      if (!profileResponse.success) {
        throw new Error(profileResponse.message || 'Failed to save health profile');
      }

      // 2. Save preferences
      const prefResponse = await profileAPI.updatePreferences({
        dietaryRestrictions,
        favoriteCuisines
      });

      if (!prefResponse.success) {
        throw new Error(prefResponse.message || 'Failed to save preferences');
      }

      // Refresh Auth Context to update hasProfile flag
      await refreshUser();
      router.push('/');
    } catch (err) {
      setError(err.message || 'An error occurred during onboarding. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FFFDF7] px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-pink-300/20 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full bg-rose-300/20 blur-3xl" />

      <div className="w-full max-w-2xl bg-white border border-pink-100 p-8 md:p-10 rounded-3xl backdrop-blur-md relative z-10 space-y-8 shadow-xl shadow-pink-100/10">
        
        {/* Header Indicator */}
        <div className="flex items-center justify-between pb-4 border-b border-pink-50">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-pink-500 rounded-xl text-white">
              <Activity size={20} />
            </div>
            <span className="font-bold text-md text-rose-950">Set Up Your Profile</span>
          </div>
          <div className="text-sm font-bold text-rose-500">
            Step <span className="text-pink-650">{step}</span> of 3
          </div>
        </div>

        {/* Steps Progress Bar */}
        <div className="w-full bg-pink-50 h-1 rounded-full overflow-hidden">
          <div 
            className="bg-pink-500 h-full transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        {error && (
          <div className="flex items-center space-x-2 text-sm text-red-700 bg-red-55 border border-red-200 p-4 rounded-xl font-bold">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* ======================================= */}
        {/* STEP 1: HEALTH METRICS */}
        {/* ======================================= */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-extrabold text-rose-950">Tell us about yourself</h3>
              <p className="text-sm text-rose-700 font-semibold">These stats are used to estimate your Basal Metabolic Rate (BMR).</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-semibold text-xs text-rose-750">
              
              {/* Gender selector */}
              <div>
                <label className="block uppercase tracking-wider mb-2 font-bold">Gender</label>
                <div className="grid grid-cols-3 gap-3">
                  {['male', 'female', 'other'].map(g => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGender(g)}
                      className={`py-3 rounded-xl border text-sm font-bold capitalize transition-all
                        ${gender === g 
                          ? 'border-pink-500 bg-pink-500/10 text-pink-650 shadow-sm shadow-pink-500/5' 
                          : 'border-pink-100 bg-pink-50/10 text-rose-500 hover:border-pink-200'}`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Age field */}
              <div>
                <label className="block uppercase tracking-wider mb-2 font-bold">Age</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-pink-400">
                    <Calendar size={18} />
                  </span>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="block w-full rounded-xl border border-pink-100 bg-pink-50/10 py-3 pl-10 pr-3 text-sm text-rose-950 font-semibold focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500 transition-all"
                    placeholder="e.g. 25"
                  />
                </div>
              </div>

              {/* Height field */}
              <div>
                <label className="block uppercase tracking-wider mb-2 font-bold">Height (cm)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-pink-400">
                    <Ruler size={18} />
                  </span>
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    className="block w-full rounded-xl border border-pink-100 bg-pink-50/10 py-3 pl-10 pr-3 text-sm text-rose-950 font-semibold focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500 transition-all"
                    placeholder="e.g. 175"
                  />
                </div>
              </div>

              {/* Weight field */}
              <div>
                <label className="block uppercase tracking-wider mb-2 font-bold">Weight (kg)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-pink-400">
                    <Scale size={18} />
                  </span>
                  <input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="block w-full rounded-xl border border-pink-100 bg-pink-50/10 py-3 pl-10 pr-3 text-sm text-rose-950 font-semibold focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500 transition-all"
                    placeholder="e.g. 70"
                  />
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ======================================= */}
        {/* STEP 2: ACTIVITY & HEALTH GOALS */}
        {/* ======================================= */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-extrabold text-rose-950">Set your focus</h3>
              <p className="text-sm text-rose-700 font-semibold">Choose your current activity level and health objective to establish calorie targets.</p>
            </div>

            <div className="space-y-6 font-semibold text-xs text-rose-700">
              
              {/* Activity Level */}
              <div>
                <label className="block uppercase tracking-wider mb-3 font-bold">Activity Level</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                  {[
                    { id: 'sedentary', name: 'Sedentary', desc: 'Little to no exercise' },
                    { id: 'light', name: 'Light', desc: '1-3 days/week' },
                    { id: 'moderate', name: 'Moderate', desc: '3-5 days/week' },
                    { id: 'active', name: 'Active', desc: '6-7 days/week' },
                    { id: 'extra', name: 'Extra', desc: 'Athletic/Heavy job' }
                  ].map(act => (
                    <button
                      key={act.id}
                      type="button"
                      onClick={() => setActivityLevel(act.id)}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all h-24
                        ${activityLevel === act.id 
                          ? 'border-pink-500 bg-pink-500/10 text-pink-650 shadow-sm shadow-pink-500/5' 
                          : 'border-pink-100 bg-pink-50/10 text-rose-500 hover:border-pink-200'}`}
                    >
                      <span className="text-xs font-bold">{act.name}</span>
                      <span className="text-[9px] text-rose-400 mt-1 font-semibold">{act.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Health Goals */}
              <div>
                <label className="block uppercase tracking-wider mb-3 font-bold">Health Goal</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                  {[
                    { id: 'weight_loss', name: 'Weight Loss', desc: 'Target calorie deficit' },
                    { id: 'weight_gain', name: 'Weight Gain', desc: 'Target calorie surplus' },
                    { id: 'muscle_gain', name: 'Muscle Gain', desc: 'Lean surplus, high protein' },
                    { id: 'maintenance', name: 'Maintenance', desc: 'Maintain current weight' },
                    { id: 'healthy_lifestyle', name: 'Healthy Lifestyle', desc: 'Clean eating balance' }
                  ].map(g => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setGoal(g.id)}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all h-24
                        ${goal === g.id 
                          ? 'border-pink-500 bg-pink-500/10 text-pink-650 shadow-sm shadow-pink-500/5' 
                          : 'border-pink-100 bg-pink-50/10 text-rose-500 hover:border-pink-200'}`}
                    >
                      <span className="text-xs font-bold leading-tight">{g.name}</span>
                      <span className="text-[9px] text-rose-400 mt-1 font-semibold">{g.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ======================================= */}
        {/* STEP 3: DIET & PREFERENCES */}
        {/* ======================================= */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-extrabold text-rose-955">Diet & Cuisine Preference</h3>
              <p className="text-sm text-rose-700 font-semibold">Help the AI curate recipe suggestions you actually enjoy.</p>
            </div>

            <div className="space-y-6 font-semibold text-xs text-rose-750">
              
              {/* Dietary Restrictions */}
              <div>
                <label className="block uppercase tracking-wider mb-3 font-bold">Dietary Restrictions (Optional)</label>
                <div className="flex flex-wrap gap-3">
                  {restrictionOptions.map(option => {
                    const isSelected = dietaryRestrictions.includes(option.id);
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => toggleRestriction(option.id)}
                        className={`px-4 py-2 rounded-full border text-xs font-bold flex items-center space-x-1.5 transition-all
                          ${isSelected 
                            ? 'border-pink-500 bg-pink-500/10 text-pink-650' 
                            : 'border-pink-100 bg-pink-50/10 text-rose-500 hover:border-pink-200'}`}
                      >
                        {isSelected && <Check size={12} />}
                        <span>{option.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cuisines */}
              <div>
                <label className="block uppercase tracking-wider mb-3 font-bold">Favorite Cuisines (Optional)</label>
                <div className="flex flex-wrap gap-3">
                  {cuisineOptions.map(option => {
                    const isSelected = favoriteCuisines.includes(option.id);
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => toggleCuisine(option.id)}
                        className={`px-4 py-2 rounded-full border text-xs font-bold flex items-center space-x-1.5 transition-all
                          ${isSelected 
                            ? 'border-pink-500 bg-pink-500/10 text-pink-650' 
                            : 'border-pink-100 bg-pink-50/10 text-rose-500 hover:border-pink-200'}`}
                      >
                        {isSelected && <Check size={12} />}
                        <span>{option.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ======================================= */}
        {/* WIZARD ACTIONS */}
        {/* ======================================= */}
        <div className="flex items-center justify-between pt-6 border-t border-pink-50">
          <div>
            {step > 1 && (
              <button
                type="button"
                onClick={handlePrev}
                disabled={loading}
                className="flex items-center space-x-1.5 text-rose-600 hover:text-rose-900 font-bold text-sm transition-colors py-2 px-3 hover:bg-pink-50 rounded-xl"
              >
                <ArrowLeft size={16} />
                <span>Back</span>
              </button>
            )}
          </div>

          <div>
            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center space-x-1.5 bg-pink-500 hover:bg-pink-400 text-white font-extrabold text-sm transition-all py-3 px-6 rounded-xl shadow-md shadow-pink-500/10"
              >
                <span>Continue</span>
                <ArrowRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center space-x-1.5 bg-pink-500 hover:bg-pink-400 text-white font-extrabold text-sm transition-all py-3 px-6 rounded-xl disabled:opacity-50 shadow-md shadow-pink-500/10"
              >
                {loading ? 'Setting up...' : 'Get Started'}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
