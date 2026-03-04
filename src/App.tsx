import React, { useState, useEffect } from 'react';
import ProfileForm from './components/ProfileForm';
import ResultCard from './components/ResultCard';
import ChatInterface from './components/ChatInterface';
import CategoryCard from './components/ui/CategoryCard';
import SajuSummaryHeader from './components/SajuSummaryHeader';
import { SajuProfile, UnifiedSajuResult, CATEGORIES, generateSajuReading, generateUnifiedSaju } from './services/geminiService';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, MessageSquare, User as UserIcon, LogOut } from 'lucide-react';

type View = 'onboarding' | 'dashboard' | 'result' | 'chat';

export default function App() {
  const [view, setView] = useState<View>('onboarding');
  const [profile, setProfile] = useState<SajuProfile | null>(null);
  const [summary, setSummary] = useState<UnifiedSajuResult | null>(null);
  const [currentCategory, setCurrentCategory] = useState<string | null>(null);
  const [reading, setReading] = useState<UnifiedSajuResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>(() => Math.random().toString(36).substring(7));
  const [initialChatInput, setInitialChatInput] = useState<string>('');

  // Load profile from local storage on mount
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === '#setup') {
        setView('onboarding');
      } else {
        const saved = localStorage.getItem('saju_profile');
        if (saved) {
          const parsedProfile = JSON.parse(saved);
          setProfile(parsedProfile);
          setView('dashboard');
          fetchSummary(parsedProfile);
        } else {
          setView('onboarding');
          window.location.hash = '#setup';
        }
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const fetchSummary = async (p: SajuProfile) => {
    const requestId = Math.random().toString(36).substring(7);
    const profileKey = `${p.birthDate}|${p.birthTime || '00:00'}|${p.calendarType}|${p.location || 'none'}|${p.gender}`;
    const cached = localStorage.getItem(`saju_cache_${profileKey}`);
    
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        // We still use cache if it exists, but we might need to re-fetch if schema changed
        if (parsed.session_id && parsed.pillar) {
          setSummary(parsed);
          return;
        }
      } catch (e) {
        console.error('Failed to parse cached summary:', e);
      }
    }

    try {
      const data = await generateUnifiedSaju(p, sessionId, requestId);
      setSummary(data);
      localStorage.setItem(`saju_cache_${profileKey}`, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to fetch summary:', e);
    }
  };

  const handleProfileSubmit = async (data: SajuProfile) => {
    setProfile(data);
    localStorage.setItem('saju_profile', JSON.stringify(data));
    window.location.hash = '';
    setView('dashboard');
    fetchSummary(data);
  };

  const handleCategorySelect = async (categoryId: string) => {
    if (!profile) return;
    const requestId = Math.random().toString(36).substring(7);
    setCurrentCategory(categoryId);
    setIsLoading(true);
    setView('result');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    try {
      const result = await generateSajuReading(profile, categoryId, sessionId, requestId);
      setReading(result);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const resetProfile = () => {
    if (confirm('모든 정보와 대화 내역이 초기화됩니다. 계속하시겠습니까?')) {
      // Clear all saju related keys
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('saju_')) {
          localStorage.removeItem(key);
        }
      });
      
      setProfile(null);
      setSummary(null);
      setReading(null);
      setSessionId(Math.random().toString(36).substring(7));
      
      // Redirect to setup with history replace
      window.location.hash = '#setup';
      window.history.replaceState(null, '', window.location.pathname + window.location.hash);
      setView('onboarding');
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Radial Glow Background */}
      <div className="radial-glow" />
      <div className="fixed top-[-10%] right-[-10%] w-[40%] h-[40%] bg-neon-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-neon-secondary/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="p-6 flex justify-between items-center z-50">
          <div 
            className="flex items-center space-x-3 cursor-pointer group" 
            onClick={() => {
              if (profile) {
                setInitialChatInput('');
                window.location.hash = '';
                setView('dashboard');
              }
            }}
          >
          <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center group-hover:border-neon-primary/50 transition-all shadow-[0_0_20px_rgba(0,255,156,0.1)]">
            <Sparkles className="w-6 h-6 text-neon-primary" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold tracking-tighter text-white">천명(天命)</h1>
            <span className="text-[10px] text-neon-primary font-bold tracking-widest uppercase opacity-60">Futuristic Saju</span>
          </div>
        </div>
        
        {profile && (
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => {
                setInitialChatInput('');
                setView('chat');
              }}
              className={`w-10 h-10 flex items-center justify-center rounded-xl border transition-all ${
                view === 'chat' 
                  ? 'bg-neon-secondary/20 border-neon-secondary text-neon-secondary shadow-[0_0_15px_rgba(91,225,255,0.2)]' 
                  : 'bg-white/5 border-white/10 text-text-sub hover:text-white hover:border-white/20'
              }`}
            >
              <MessageSquare className="w-5 h-5" />
            </button>
            <button 
              onClick={resetProfile}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-text-sub hover:text-red-400 hover:border-red-400/30 transition-all"
              title="정보 초기화"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        )}
      </header>

      <main className="flex-1 z-10">
        <AnimatePresence mode="wait">
          {view === 'onboarding' && (
            <motion.div 
              key="onboarding"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="container mx-auto px-6 py-4"
            >
              <ProfileForm onSubmit={handleProfileSubmit} />
            </motion.div>
          )}

          {view === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col"
            >
              <SajuSummaryHeader 
                data={summary || undefined} 
              />
              
              <div className="container mx-auto px-6 py-4 space-y-12">
                <div className="text-center space-y-4">
                  <motion.h2 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-4xl md:text-5xl font-bold tracking-tight text-white"
                  >
                    반갑습니다, <span className="text-neon-primary">{profile?.name || '익명'}</span>님
                  </motion.h2>
                  <p className="text-text-sub text-lg">오늘 당신의 운명은 어떤 흐름을 향하고 있나요?</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                  {CATEGORIES.map((cat, index) => (
                    <CategoryCard
                      key={cat.id}
                      number={(index + 1).toString().padStart(2, '0')}
                      icon={cat.icon}
                      label={cat.label}
                      onClick={() => handleCategorySelect(cat.id)}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {view === 'result' && (
            <div key="result" className="container mx-auto px-6 py-4">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-32 space-y-8">
                  <div className="relative">
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      className="w-24 h-24 border-2 border-neon-primary/10 border-t-neon-primary rounded-full"
                    />
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                    >
                      <Sparkles className="w-8 h-8 text-neon-primary shadow-[0_0_20px_rgba(0,255,156,0.5)]" />
                    </motion.div>
                  </div>
                  <div className="text-center space-y-3">
                    <p className="text-2xl font-bold text-white tracking-tight">하늘의 기운을 읽는 중입니다</p>
                    <p className="text-text-sub animate-pulse">잠시만 기다려주세요...</p>
                  </div>
                </div>
              ) : reading && (
                <ResultCard 
                  reading={reading} 
                  categoryLabel={CATEGORIES.find(c => c.id === currentCategory)?.label || ''}
                  onConsult={(question?: string) => {
                    setInitialChatInput(question || '');
                    setView('chat');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              )}
            </div>
          )}

          {view === 'chat' && profile && (
            <motion.div 
              key="chat"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="container mx-auto px-6 py-4"
            >
              <ChatInterface 
                profile={profile} 
                sessionId={sessionId} 
                initialMessage={initialChatInput} 
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="p-10 text-center space-y-3 z-10">
        <div className="flex justify-center space-x-4 mb-4">
          <div className="w-1 h-1 bg-neon-primary rounded-full" />
          <div className="w-1 h-1 bg-neon-secondary rounded-full" />
          <div className="w-1 h-1 bg-accent rounded-full" />
        </div>
        <p className="text-[10px] text-text-sub/40 uppercase tracking-[0.3em]">© 2026 천명(天命) - Futuristic Saju System</p>
        <p className="text-[10px] text-text-sub/20 max-w-md mx-auto leading-relaxed">
          본 서비스는 인공지능 기술을 활용한 참고용이며, 중대한 결정은 전문가와 상담하시기 바랍니다.
        </p>
      </footer>
    </div>
  );
}
