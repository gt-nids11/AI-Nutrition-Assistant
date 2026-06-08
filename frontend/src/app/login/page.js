'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';
import { Activity, Mail, Lock, AlertCircle, Loader } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login(email, password);
      if (res && !res.success) {
        setError(res.error || 'Invalid email or password');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FFFDF7] px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Decorative Blobs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-pink-300/20 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-80 h-80 rounded-full bg-rose-300/20 blur-3xl" />

      <div className="w-full max-w-md space-y-8 bg-white border border-pink-100 p-8 rounded-3xl backdrop-blur-md relative z-10 shadow-xl shadow-pink-100/10">
        
        {/* Header */}
        <div className="flex flex-col items-center">
          <div className="p-3 bg-pink-500 rounded-2xl text-white mb-3 shadow-lg shadow-pink-500/20 animate-pulse">
            <Activity size={28} />
          </div>
          <h2 className="mt-2 text-center text-3xl font-extrabold tracking-tight text-rose-950">
            Welcome to NutriMate AI
          </h2>
          <p className="mt-1 text-center text-sm text-rose-700 font-semibold">
            Log in to access your kitchen copilot
          </p>
        </div>

        {/* Form */}
        <form className="mt-8 space-y-6 font-semibold text-xs text-rose-700" onSubmit={handleSubmit}>
          
          {error && (
            <div className="flex items-center space-x-2 text-sm text-red-700 bg-red-50 border border-red-200 p-4 rounded-xl font-bold">
              <AlertCircle size={18} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4 rounded-md shadow-sm">
            
            {/* Email Field */}
            <div>
              <label htmlFor="email-address" className="block uppercase tracking-wider mb-1 font-bold">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-pink-400">
                  <Mail size={18} />
                </span>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-xl border border-pink-100 bg-pink-50/10 py-3 pl-10 pr-3 text-sm text-rose-950 placeholder-rose-300 font-semibold focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500 transition-all"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block uppercase tracking-wider mb-1 font-bold">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-pink-400">
                  <Lock size={18} />
                </span>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-xl border border-pink-100 bg-pink-50/10 py-3 pl-10 pr-3 text-sm text-rose-950 placeholder-rose-300 font-semibold focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

          </div>

          {/* Submit */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-xl bg-pink-500 py-3 px-4 text-sm font-bold text-white hover:bg-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 focus:ring-offset-pink-50 transition-all disabled:opacity-50 shadow-md shadow-pink-500/10"
            >
              {loading ? (
                <Loader size={18} className="animate-spin" />
              ) : (
                'Sign In'
              )}
            </button>
          </div>

        </form>

        {/* Footer Link */}
        <div className="text-center mt-6">
          <p className="text-sm text-rose-700 font-semibold">
            Don't have an account?{' '}
            <Link href="/register" className="font-extrabold text-pink-600 hover:text-pink-700 transition-colors">
              Create an account
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
