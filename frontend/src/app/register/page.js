'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';
import { Activity, User, Mail, Lock, AlertCircle, Loader } from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }

    if (password.length < 6) {
      return setError('Password must be at least 6 characters');
    }

    setLoading(true);

    try {
      const res = await register(name, email, password);
      if (res && !res.success) {
        setError(res.error || 'Failed to create account');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Decorative Blobs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-80 h-80 rounded-full bg-teal-500/10 blur-3xl" />

      <div className="w-full max-w-md space-y-8 bg-zinc-900/60 border border-zinc-800 p-8 rounded-3xl backdrop-blur-md relative z-10">
        
        {/* Header */}
        <div className="flex flex-col items-center">
          <div className="p-3 bg-emerald-500 rounded-2xl text-zinc-950 mb-3 shadow-lg shadow-emerald-500/20">
            <Activity size={28} />
          </div>
          <h2 className="mt-2 text-center text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            Create an Account
          </h2>
          <p className="mt-1 text-center text-sm text-zinc-400">
            Join NutriMate AI and start healthy habits
          </p>
        </div>

        {/* Form */}
        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          
          {error && (
            <div className="flex items-center space-x-2 text-sm text-red-400 bg-red-950/20 border border-red-900/30 p-4 rounded-xl">
              <AlertCircle size={18} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4 rounded-md shadow-sm">
            
            {/* Name Field */}
            <div>
              <label htmlFor="user-name" className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                Full Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
                  <User size={18} />
                </span>
                <input
                  id="user-name"
                  name="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full rounded-xl border border-zinc-800 bg-zinc-950/50 py-3 pl-10 pr-3 text-sm text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                  placeholder="John Doe"
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email-address" className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
                  <Mail size={18} />
                </span>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-xl border border-zinc-800 bg-zinc-950/50 py-3 pl-10 pr-3 text-sm text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
                  <Lock size={18} />
                </span>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-xl border border-zinc-800 bg-zinc-950/50 py-3 pl-10 pr-3 text-sm text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
                  <Lock size={18} />
                </span>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full rounded-xl border border-zinc-800 bg-zinc-950/50 py-3 pl-10 pr-3 text-sm text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-xl bg-emerald-600 py-3 px-4 text-sm font-semibold text-white hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-zinc-900 transition-all disabled:opacity-50"
            >
              {loading ? (
                <Loader size={18} className="animate-spin" />
              ) : (
                'Create Account'
              )}
            </button>
          </div>

        </form>

        {/* Footer Link */}
        <div className="text-center mt-4">
          <p className="text-sm text-zinc-400">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-emerald-400 hover:text-emerald-300 transition-colors">
              Sign In
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
