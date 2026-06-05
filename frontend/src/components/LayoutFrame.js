'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { 
  Home, 
  ShoppingBag, 
  PlusCircle, 
  Calendar, 
  MessageSquare, 
  History, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  User,
  Activity
} from 'lucide-react';
import { profileAPI } from '../utils/api';

export default function LayoutFrame({ children }) {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [profile, setProfile] = useState(null);
  const router = useRouter();
  const pathname = usePathname();

  // Load user profile targets for header display
  useEffect(() => {
    if (user && user.hasProfile) {
      profileAPI.getProfile()
        .then(res => {
          if (res.success) setProfile(res.profile);
        })
        .catch(err => console.error(err));
    }
  }, [user]);

  // Hide frame on auth and onboarding pages
  if (pathname === '/login' || pathname === '/register' || pathname === '/onboarding') {
    return <>{children}</>;
  }

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: Home },
    { name: 'Pantry & Fridge', path: '/pantry', icon: ShoppingBag },
    { name: 'Log & Track', path: '/tracker', icon: PlusCircle },
    { name: 'Meal Planner', path: '/planner', icon: Calendar },
    { name: 'AI Kitchen Chatbot', path: '/chat', icon: MessageSquare },
    { name: 'Meal History', path: '/history', icon: History },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-rose-50/20 text-rose-950 overflow-hidden font-sans">
      
      {/* Mobile Drawer Backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-pink-900/20 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-white border-r border-pink-100 transition-all duration-300 lg:static lg:translate-x-0 
          ${sidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'} 
          ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-pink-100 bg-pink-50/30">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-pink-500 rounded-lg text-white">
              <Activity size={20} />
            </div>
            {(!isCollapsed || sidebarOpen) && (
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                NutriMate AI
              </span>
            )}
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="p-1 rounded-lg hover:bg-pink-50 text-pink-600 lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 py-4 space-y-1 overflow-y-auto px-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <button
                key={item.name}
                onClick={() => {
                  router.push(item.path);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center p-3 rounded-xl transition-all duration-200 group text-left
                  ${isActive 
                    ? 'bg-pink-500 text-white font-bold shadow-md shadow-pink-500/10' 
                    : 'text-rose-900/80 hover:bg-pink-50 hover:text-pink-950'}`}
              >
                <Icon size={20} className={isActive ? 'text-white' : 'text-rose-500 group-hover:text-pink-600 transition-colors'} />
                {(!isCollapsed || sidebarOpen) && (
                  <span className="ml-3 text-sm font-semibold">{item.name}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Collapse Button (Desktop only) */}
        <div className="hidden lg:block border-t border-pink-100 p-3">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full flex justify-center py-2 px-3 rounded-lg text-xs font-semibold text-rose-400 hover:bg-pink-50 hover:text-pink-600 transition-colors"
          >
            {isCollapsed ? '➔' : '➔ Collapse'}
          </button>
        </div>

        {/* User Footer Profile */}
        <div className="p-4 border-t border-pink-100 bg-pink-50/20 flex items-center justify-between">
          <div className="flex items-center overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-pink-550/10 border border-pink-500/20 flex items-center justify-center text-pink-500 shrink-0">
              <User size={16} />
            </div>
            {(!isCollapsed || sidebarOpen) && (
              <div className="ml-2 overflow-hidden">
                <p className="text-xs font-extrabold truncate text-rose-950">{user?.name}</p>
                <p className="text-[10px] truncate text-rose-600/70">{user?.email}</p>
              </div>
            )}
          </div>
          {(!isCollapsed || sidebarOpen) && (
            <button 
              onClick={logout}
              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-100/50 hover:text-rose-700 transition-colors"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </aside>

      {/* Main App Container */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        
        {/* Header bar */}
        <header className="flex items-center justify-between h-16 px-6 bg-white border-b border-pink-100 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-pink-50 text-pink-650 lg:hidden"
          >
            <Menu size={20} />
          </button>

          {/* Goal & Calorie Summary */}
          <div className="hidden sm:flex items-center space-x-6 text-sm font-semibold text-rose-800">
            {profile && (
              <>
                <div>
                  Goal: <span className="font-extrabold text-pink-600">{profile.goal.replace('_', ' ').toUpperCase()}</span>
                </div>
                <div className="h-4 w-px bg-pink-100" />
                <div>
                  Target: <span className="font-extrabold text-rose-950">{profile.calorieTarget} kcal</span>
                </div>
                <div className="h-4 w-px bg-pink-100" />
                <div className="hidden md:block">
                  Macros: <span className="text-rose-700 font-medium">P:{profile.proteinTarget}g | C:{profile.carbTarget}g | F:{profile.fatTarget}g</span>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {/* Quick stats for mobile */}
            {profile && (
              <div className="sm:hidden text-xs bg-pink-100 px-3 py-1 rounded-full text-pink-700 font-bold border border-pink-200/50">
                Target: {profile.calorieTarget} kcal
              </div>
            )}
            
            {/* Logout button */}
            <button
              onClick={logout}
              className="flex items-center space-x-1.5 text-xs font-bold text-pink-700 hover:text-pink-900 bg-pink-50 px-3 py-1.5 rounded-xl border border-pink-100 hover:bg-pink-100 transition-all"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Page content view */}
        <main className="flex-1 overflow-y-auto bg-[#fff8f9] p-6 relative">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>

    </div>
  );
}
