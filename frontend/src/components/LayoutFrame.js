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
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
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

  const toggleSidebar = () => {
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      setDesktopSidebarOpen(!desktopSidebarOpen);
    } else {
      setSidebarOpen(!sidebarOpen);
    }
  };

  return (
    <div className="flex h-screen bg-[#09090b] text-zinc-100 overflow-hidden font-sans">
      
      {/* Mobile Drawer Backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-zinc-900 border-r border-zinc-800 transition-all duration-300 lg:static lg:translate-x-0 
          ${sidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'} 
          ${!desktopSidebarOpen ? 'lg:w-0 lg:overflow-hidden lg:border-r-0' : 'lg:w-64'}`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-gradient-to-r from-pink-500 to-rose-500 rounded-lg text-white">
              <Activity size={20} />
            </div>
            {(desktopSidebarOpen || sidebarOpen) && (
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">
                NutriMate AI
              </span>
            )}
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="p-1 rounded-lg hover:bg-zinc-850 text-zinc-400 lg:hidden"
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
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold shadow-md shadow-pink-500/10' 
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'}`}
              >
                <Icon size={20} className={isActive ? 'text-white' : 'text-pink-500 group-hover:text-pink-400 transition-colors'} />
                {(desktopSidebarOpen || sidebarOpen) && (
                  <span className="ml-3 text-sm font-semibold">{item.name}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Footer Profile */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/30 flex items-center justify-between">
          <div className="flex items-center overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 shrink-0">
              <User size={16} />
            </div>
            {(desktopSidebarOpen || sidebarOpen) && (
              <div className="ml-2 overflow-hidden">
                <p className="text-xs font-extrabold truncate text-zinc-200">{user?.name}</p>
                <p className="text-[10px] truncate text-zinc-500">{user?.email}</p>
              </div>
            )}
          </div>
          {(desktopSidebarOpen || sidebarOpen) && (
            <button 
              onClick={logout}
              className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
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
        <header className="flex items-center justify-between h-16 px-6 bg-zinc-950 border-b border-zinc-900 shrink-0">
          <div className="flex items-center space-x-3">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg hover:bg-zinc-900 text-zinc-400 hover:text-white transition-all"
              title="Toggle Menu"
            >
              <Menu size={20} />
            </button>
          </div>

          {/* Goal & Calorie Summary */}
          <div className="hidden sm:flex items-center space-x-6 text-sm font-semibold text-zinc-400">
            {profile && (
              <>
                <div>
                  Goal: <span className="font-extrabold text-pink-500">{profile.goal.replace('_', ' ').toUpperCase()}</span>
                </div>
                <div className="h-4 w-px bg-zinc-800" />
                <div>
                  Target: <span className="font-extrabold text-zinc-100">{profile.calorieTarget} kcal</span>
                </div>
                <div className="h-4 w-px bg-zinc-800" />
                <div className="hidden md:block">
                  Macros: <span className="text-zinc-500 font-medium">P:{profile.proteinTarget}g | C:{profile.carbTarget}g | F:{profile.fatTarget}g</span>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {/* Quick stats for mobile */}
            {profile && (
              <div className="sm:hidden text-xs bg-pink-500/10 px-3 py-1 rounded-full text-pink-500 font-bold border border-pink-500/20">
                Target: {profile.calorieTarget} kcal
              </div>
            )}
            
            {/* Logout button */}
            <button
              onClick={logout}
              className="flex items-center space-x-1.5 text-xs font-bold text-zinc-300 hover:text-white bg-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-800 hover:bg-zinc-800 transition-all"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Page content view */}
        <main className="flex-1 overflow-y-auto bg-[#09090b] p-6 relative">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>

    </div>
  );
}
