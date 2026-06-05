'use client';

import { useState, useEffect, useRef } from 'react';
import { chatAPI, profileAPI, pantryAPI, trackerAPI } from '../../utils/api';
import { 
  MessageSquare, 
  Send, 
  Trash2, 
  Info, 
  User, 
  Activity, 
  Sparkles,
  AlertTriangle,
  Scale,
  Brain,
  Cpu,
  Loader
} from 'lucide-react';

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const messagesEndRef = useRef(null);

  // Sidebar Memory Context States
  const [profile, setProfile] = useState(null);
  const [pantryItems, setPantryItems] = useState([]);
  const [dailyLog, setDailyLog] = useState(null);
  const [expiringCount, setExpiringCount] = useState(0);

  useEffect(() => {
    loadChatHistory();
    loadContextSidebar();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, submitting]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChatHistory = async () => {
    try {
      setLoading(true);
      const res = await chatAPI.getHistory();
      if (res.success) {
        setMessages(res.history);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadContextSidebar = async () => {
    try {
      // Load health profile metrics
      const profileRes = await profileAPI.getProfile();
      if (profileRes.success) {
        setProfile(profileRes.profile);
      }

      // Load pantry ingredients
      const pantryRes = await pantryAPI.getItems();
      if (pantryRes.success) {
        setPantryItems(pantryRes.items);
      }

      // Load expiring count
      const expiringRes = await pantryAPI.getExpiring();
      if (expiringRes.success) {
        setExpiringCount(expiringRes.count);
      }

      // Load today's calories consumed
      const todayStr = new Date().toISOString().split('T')[0];
      const dailyRes = await trackerAPI.getDaily(todayStr);
      if (dailyRes.success) {
        setDailyLog(dailyRes.summary);
      }
    } catch (err) {
      console.error('Error loading chat memory context:', err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || submitting) return;

    const userMessageText = input;
    setInput('');
    setSubmitting(true);

    // Optimistically add user message to client view
    const tempUserMsg = {
      _id: Date.now().toString(),
      role: 'user',
      content: userMessageText,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const res = await chatAPI.sendMessage(userMessageText);
      if (res.success) {
        // Replace user message with backend confirmation and add bot response
        setMessages(prev => [
          ...prev.filter(m => m._id !== tempUserMsg._id),
          res.userMessage,
          res.botResponse
        ]);
        
        // Refresh contexts since meal logging/recipes might modify values
        loadContextSidebar();
      }
    } catch (err) {
      console.error(err);
      // Add error message to thread
      setMessages(prev => [...prev, {
        _id: 'err-' + Date.now(),
        role: 'assistant',
        content: `Error: ${err.message || 'I had trouble responding. Please check your settings and connection.'}`,
        timestamp: new Date()
      }]);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClearHistory = async () => {
    if (!confirm('Are you sure you want to clear your conversation history? This will reset the chatbot session memory.')) return;
    try {
      const res = await chatAPI.clearHistory();
      if (res.success) {
        setMessages([]);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to clear history');
    }
  };

  const calorieTarget = profile?.calorieTarget || 2000;
  const caloriesConsumed = dailyLog?.totalCalories || 0;
  const caloriesLeft = Math.max(0, calorieTarget - caloriesConsumed);

  return (
    <div className="space-y-6">
      
      {/* Page Title & actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">AI Kitchen Chatbot</h1>
          <p className="text-sm text-zinc-400">Ask for recipes matching your pantry, substitutions, and nutrition tips.</p>
        </div>
        
        <button
          onClick={handleClearHistory}
          disabled={messages.length === 0}
          className="flex items-center justify-center space-x-1.5 bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 text-red-400 font-semibold text-xs px-3.5 py-2.5 rounded-xl transition-all disabled:opacity-30"
        >
          <Trash2 size={14} />
          <span>Clear Memory</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[70vh] items-stretch">
        
        {/* Chat Thread Container */}
        <div className="lg:col-span-3 bg-zinc-900/40 border border-zinc-800 rounded-3xl flex flex-col justify-between overflow-hidden h-full relative">
          
          {/* Scrollable messages panel */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 max-h-[calc(70vh-80px)]">
            
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <Loader className="animate-spin text-emerald-500" size={32} />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto space-y-4">
                <div className="p-4 bg-emerald-500/10 rounded-2xl text-emerald-400 border border-emerald-500/20 shadow-md">
                  <MessageSquare size={32} />
                </div>
                <div>
                  <h3 className="font-extrabold text-zinc-200">Start a Conversation</h3>
                  <p className="text-xs text-zinc-500 mt-1">
                    Ask questions like: "What can I cook with eggs and spinach?", "Recommend a high protein lunch", or "Can you estimate calories for 2 chapatis?"
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg) => {
                  const isBot = msg.role === 'assistant';
                  return (
                    <div 
                      key={msg._id}
                      className={`flex ${isBot ? 'justify-start' : 'justify-end'} animate-fade-in`}
                    >
                      <div className={`flex space-x-3.5 max-w-[85%] ${isBot ? '' : 'flex-row-reverse space-x-reverse'}`}>
                        {/* Avatar */}
                        <div className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0
                          ${isBot 
                            ? 'bg-emerald-500/15 border-emerald-500/20 text-emerald-400 font-extrabold' 
                            : 'bg-zinc-800 border-zinc-700 text-zinc-300'}`}
                        >
                          {isBot ? <Sparkles size={14} /> : <User size={14} />}
                        </div>

                        {/* Content bubble */}
                        <div className={`p-4 rounded-2xl border text-sm leading-relaxed whitespace-pre-line
                          ${isBot 
                            ? 'bg-zinc-900 border-zinc-800 text-zinc-200 shadow-sm' 
                            : 'bg-emerald-600 border-emerald-500 text-white font-medium shadow-md shadow-emerald-950/20'}`}
                        >
                          {msg.content}
                          <span className={`block text-[9px] mt-1.5 text-right font-medium
                            ${isBot ? 'text-zinc-550' : 'text-emerald-250'}`}
                          >
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Chat form */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-zinc-800 bg-zinc-900/50 flex space-x-3 shrink-0">
            <input
              type="text"
              placeholder="Ask your Kitchen Copilot..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={submitting}
              className="flex-1 bg-zinc-950/60 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all placeholder-zinc-550"
            />
            <button
              type="submit"
              disabled={!input.trim() || submitting}
              className="p-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all disabled:opacity-50 flex items-center justify-center shadow-lg"
            >
              {submitting ? (
                <Loader className="animate-spin" size={18} />
              ) : (
                <Send size={18} />
              )}
            </button>
          </form>

        </div>

        {/* Sidebar Context Memory */}
        <div className="hidden lg:flex flex-col bg-zinc-900/40 border border-zinc-800 rounded-3xl p-5 space-y-5 overflow-y-auto h-full">
          
          {/* Header */}
          <div className="flex items-center space-x-2 pb-3 border-b border-zinc-800">
            <Brain size={18} className="text-emerald-400" />
            <h3 className="text-xs font-black uppercase text-zinc-400 tracking-wider">AI Context Memory</h3>
          </div>

          {/* Calorie Stats */}
          <div className="space-y-2.5">
            <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center space-x-1.5">
              <Activity size={12} className="text-emerald-400" />
              <span>Budget Tracking</span>
            </h4>
            <div className="bg-zinc-950/40 border border-zinc-850 p-3 rounded-2xl space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-zinc-400">Calorie budget:</span>
                <span className="text-zinc-200">{caloriesLeft} / {calorieTarget} kcal</span>
              </div>
              <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full transition-all"
                  style={{ width: `${Math.min(100, Math.round((caloriesConsumed / calorieTarget) * 100))}%` }}
                />
              </div>
            </div>
          </div>

          {/* Pantry preview */}
          <div className="space-y-2.5 flex-1 overflow-hidden flex flex-col">
            <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center space-x-1.5 shrink-0">
              <Scale size={12} className="text-indigo-400" />
              <span>Pantry Inventory</span>
            </h4>
            
            {pantryItems.length === 0 ? (
              <p className="text-[10px] text-zinc-650 italic shrink-0">Pantry is empty</p>
            ) : (
              <div className="bg-zinc-950/40 border border-zinc-850 p-3 rounded-2xl space-y-1.5 text-xs text-zinc-400 flex-1 overflow-y-auto max-h-[140px] pr-1">
                {pantryItems.map(p => (
                  <div key={p._id} className="flex justify-between border-b border-zinc-900/60 pb-1 last:border-b-0 last:pb-0 font-medium">
                    <span className="capitalize truncate max-w-[90px]">{p.name}</span>
                    <span className="text-zinc-500 font-bold shrink-0">{p.quantity} {p.unit}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Warnings */}
          {expiringCount > 0 && (
            <div className="bg-amber-950/20 border border-amber-900/30 p-3 rounded-2xl flex items-start space-x-2 shrink-0">
              <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
              <div className="text-[10px] leading-tight text-amber-400 font-semibold">
                Remember: {expiringCount} pantry item{expiringCount > 1 ? 's are' : ' is'} expiring soon. AI will prioritize recipes using them.
              </div>
            </div>
          )}

          {/* Active provider */}
          <div className="border-t border-zinc-800 pt-3 flex items-center justify-between text-[10px] font-semibold text-zinc-500 shrink-0">
            <div className="flex items-center space-x-1">
              <Cpu size={12} className="text-zinc-655" />
              <span>Copilot Engine:</span>
            </div>
            <span className={`capitalize px-2 py-0.5 rounded-full border
              ${profile?.customApiKey?.provider !== 'none' 
                ? 'bg-emerald-950/20 border-emerald-900/30 text-emerald-400' 
                : 'bg-zinc-950 border-zinc-800 text-zinc-500'}`}
            >
              {profile?.customApiKey?.provider !== 'none' ? profile?.customApiKey?.provider : 'Local Mock'}
            </span>
          </div>

        </div>

      </div>

    </div>
  );
}
