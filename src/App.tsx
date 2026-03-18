import React, { useEffect, useState } from "react";
import ProfileForm from "./components/ProfileForm";
import ResultCard from "./components/ResultCard";
import ChatInterface from "./components/ChatInterface";
import CategoryCard from "./components/ui/CategoryCard";
import SajuSummaryHeader from "./components/SajuSummaryHeader";
import {
  SajuProfile,
  UnifiedSajuResult,
  generateSajuReading,
  generateUnifiedSaju,
} from "./services/geminiService";
import { FORTUNE_CATEGORIES } from "./constants/fortuneCategories";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, MessageSquare, User as UserIcon, LogOut } from "lucide-react";
import ErrorModal from "./components/ErrorModal";

/** Explicit app screen state. Single source of truth for which screen is shown. */
type AppScreen = "setup" | "home" | "result" | "consult";

export default function App() {
  const [screen, setScreen] = useState<AppScreen>("setup");
  const [profile, setProfile] = useState<SajuProfile | null>(null);
  const [summary, setSummary] = useState<UnifiedSajuResult | null>(null);
  const [reading, setReading] = useState<UnifiedSajuResult | null>(null);
  const [currentCategory, setCurrentCategory] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingSummary, setIsFetchingSummary] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryAction, setRetryAction] = useState<(() => Promise<void>) | null>(null);

  const [sessionId, setSessionId] = useState<string>(() =>
    Math.random().toString(36).substring(7)
  );

  const [initialChatInput, setInitialChatInput] = useState<string>("");

  const fetchSummary = async (data: SajuProfile) => {
    if (isFetchingSummary) return;

    setIsFetchingSummary(true);
    try {
      setErrorMessage(null);
      const requestId = Math.random().toString(36).substring(7);
      const fixed = await generateUnifiedSaju(data, sessionId, requestId);
      setProfile(data);
      setSummary(fixed);
    } catch (error: any) {
      console.error("fetchSummary failed:", error);
      setErrorMessage("기본 사주 요약을 불러오지 못했다.\n잠시 후 다시 시도해라.");
      setRetryAction(() => async () => {
        await fetchSummary(data);
      });
    } finally {
      setIsFetchingSummary(false);
    }
  };

  const handleProfileSubmit = async (data: SajuProfile) => {
    setSummary(null);
    setReading(null);
    setCurrentCategory(null);
    setInitialChatInput("");
    setErrorMessage(null);
    setRetryAction(null);

    setProfile(data);
    localStorage.setItem("saju_profile", JSON.stringify(data));
    window.location.hash = "";

    setScreen("home");
    console.log("[APP FLOW] setup -> home");
    await fetchSummary(data);
  };

  const handleCategorySelect = async (categoryId: string) => {
    if (!profile) return;

    setCurrentCategory(categoryId);
    setReading(null);
    setScreen("result");
    console.log("[APP FLOW] home -> result", categoryId);
    window.scrollTo({ top: 0, behavior: "smooth" });

    const run = async () => {
      const requestId = Math.random().toString(36).substring(7);

      try {
        setErrorMessage(null);
        setIsLoading(true);

        const result = await generateSajuReading(profile, categoryId, sessionId, requestId);

        console.log("CATEGORY RESULT:", result);
        console.log("SUMMARY:", result?.summary);
        console.log("ONE LINER:", result?.summary?.one_liner);
        console.log("[SAJU] setReading about to run:", {
          hasSummary: !!result?.summary?.one_liner,
          core_analysis_len: result?.analysis?.core_analysis?.filter(Boolean).length ?? 0,
          core_engine: result?.extended_identity?.core_engine,
          thinking_style: result?.extended_identity?.thinking_style,
          instinct_style: result?.extended_identity?.instinct_style,
          motivation_core: result?.extended_identity?.motivation_core,
          weakness_pattern: result?.extended_identity?.weakness_pattern,
          relationship_pattern: result?.extended_identity?.relationship_pattern,
          human_type_title: result?.human_type_card?.title,
        });

        setReading(result);
      } catch (error: any) {
        console.error("generateSajuReading failed:", error);

        const message =
          error?.message?.includes("503") ||
          error?.message?.includes("UNAVAILABLE") ||
          error?.message?.includes("high demand")
            ? "지금 해석 엔진 요청이 몰렸다.\n몇 초 뒤 다시 시도해라."
            : "카테고리 해석 중 문제가 생겼다.\n잠시 후 다시 시도해라.";

        setErrorMessage(message);
        setRetryAction(() => run);
      } finally {
        setIsLoading(false);
      }
    };

    await run();
  };

  const resetProfile = () => {
    if (!confirm("모든 정보와 대화 내역이 초기화된다. 계속하겠습니까?")) return;

    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("saju_")) {
        localStorage.removeItem(key);
      }
    });

    setProfile(null);
    setSummary(null);
    setReading(null);
    setCurrentCategory(null);
    setInitialChatInput("");
    setErrorMessage(null);
    setRetryAction(null);
    setIsLoading(false);
    setIsFetchingSummary(false);
    setSessionId(Math.random().toString(36).substring(7));
    setScreen("setup");
    window.location.hash = "#setup";
  };

  const goBackFromResult = () => {
    setScreen("home");
    setCurrentCategory(null);
    setReading(null);
  };

  const openConsult = (prompt?: string) => {
    setInitialChatInput(prompt ?? "");
    setScreen("consult");
    console.log("[APP FLOW] result -> consult");
  };

  const closeConsult = () => {
    setInitialChatInput("");
    setScreen(reading ? "result" : "home");
  };

  useEffect(() => {
    const pathname = window.location.pathname || "/";
    const hash = window.location.hash;
    const isRoot = pathname === "/";
    const isSetupPath = pathname === "/setup" || hash === "#setup";

    if (isRoot || isSetupPath) {
      setScreen("setup");
      if (isRoot) {
        console.log("[APP ENTRY] forcing setup page on root path");
      }
      if (hash !== "#setup" && isSetupPath) {
        window.location.hash = "#setup";
      }
    }

    const saved = localStorage.getItem("saju_profile");
    if (!saved) {
      if (!isRoot && hash !== "#setup") {
        window.location.hash = "#setup";
      }
      return;
    }

    try {
      const parsedProfile = JSON.parse(saved) as SajuProfile;
      setProfile(parsedProfile);
      if (isRoot || isSetupPath) {
        return;
      }
      setScreen("home");
      fetchSummary(parsedProfile);
    } catch (e) {
      console.error("failed to parse saved profile", e);
      localStorage.removeItem("saju_profile");
      setProfile(null);
      setSummary(null);
      setReading(null);
      setScreen("setup");
      window.location.hash = "#setup";
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === "#setup") {
        setScreen("setup");
      }
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const activeCategory = FORTUNE_CATEGORIES.find((c) => c.id === currentCategory);

  const pathname = typeof window !== "undefined" ? window.location.pathname || "/" : "/";

  useEffect(() => {
    if (screen === "result" && !profile) setScreen("home");
    if (screen === "consult" && !profile) setScreen("setup");
    if (screen === "home" && !profile) setScreen("setup");
  }, [screen, profile]);

  console.log("[APP FLOW]", {
    path: pathname,
    screen,
    hasProfile: !!profile,
    hasSummary: !!summary,
    hasReading: !!reading,
    selectedCategory: currentCategory,
  });

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_center,_rgba(0,255,163,0.08),_transparent_35%),linear-gradient(180deg,_#02131B_0%,_#02070B_100%)]" />
      <div className="fixed inset-0 -z-10 opacity-[0.08] bg-[linear-gradient(to_right,transparent_0%,rgba(255,255,255,0.05)_50%,transparent_100%)] bg-[length:100%_4px]" />

      <header className="sticky top-0 z-20 backdrop-blur-md bg-black/30 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <a href="#setup" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-neon-primary/20 to-neon-secondary/20 border border-neon-primary/30 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-neon-primary" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-white group-hover:text-neon-primary transition-colors">
                천명(天命)
              </h1>
              <p className="text-[11px] tracking-[0.2em] text-neon-primary/80 uppercase">
                Futuristic Saju
              </p>
            </div>
          </a>

          <div className="flex items-center gap-2">
            {profile && (
              <>
                <button
                  onClick={() => { setScreen("consult"); console.log("[APP FLOW] home -> consult"); }}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white hover:border-neon-primary/40 hover:text-neon-primary transition-colors"
                >
                  <span className="inline-flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    상담
                  </span>
                </button>

                <button
                  onClick={resetProfile}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white hover:border-red-400/40 hover:text-red-300 transition-colors"
                >
                  <span className="inline-flex items-center gap-2">
                    <LogOut className="w-4 h-4" />
                    나가기
                  </span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <AnimatePresence mode="wait">
          {screen === "setup" && (
            <motion.section
              key="setup"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35 }}
              className="max-w-7xl mx-auto px-4 py-10"
            >
              <div className="max-w-5xl mx-auto text-center mb-10">
                <div className="inline-flex items-center gap-2 rounded-full border border-neon-primary/20 bg-neon-primary/10 px-4 py-2 text-neon-primary text-sm mb-5">
                  <Sparkles className="w-4 h-4" />
                  인간 구조 분석 시스템
                </div>

                <h2 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-4 leading-tight">
                  우리는 내가 선택을 한다고 믿지만
                  <br />
                  <span className="text-neon-primary">결국 정해진 길로 돌아온다</span>
                </h2>

                <p className="text-white/60 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
                  이건 해석이 아니라
                  <br />
                  네가 반복해온 방향이다
                </p>
              </div>

              <ProfileForm onSubmit={handleProfileSubmit} />
            </motion.section>
          )}

          {screen === "home" && profile && !summary && (
            <motion.section
              key="home-loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-7xl mx-auto px-4 py-16 text-center"
            >
              {isFetchingSummary ? (
                <>
                  <div className="text-white/80 font-medium">사주 요약 불러오는 중...</div>
                  <div className="mt-2 text-sm text-text-sub">잠시만 기다려.</div>
                </>
              ) : (
                <>
                  <div className="text-white/80 font-medium">요약을 불러오지 못했다.</div>
                  <div className="mt-2 text-sm text-text-sub">
                    <a href="#setup" className="text-neon-primary underline">설정으로 돌아가기</a>
                  </div>
                </>
              )}
            </motion.section>
          )}

          {screen === "home" && profile && summary && (
            <motion.section
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35 }}
              className="max-w-7xl mx-auto px-4 py-8"
            >
              <SajuSummaryHeader data={summary} />

              <div className="mt-12 mb-10 text-center">
                <h2 className="text-5xl font-black tracking-tight text-white">
                  반갑습니다, <span className="text-neon-primary">{profile.name || "이땡땡"}님</span>
                </h2>
                <p className="text-white/50 mt-3 text-lg">
                  오늘 당신의 운명은 어떤 흐름을 향하고 있나요?
                </p>
              </div>

              <div className="grid md:grid-cols-2 xl:grid-cols-5 gap-5">
                {FORTUNE_CATEGORIES.slice()
                  .sort((a, b) => a.order - b.order)
                  .map((category) => (
                    <CategoryCard
                      key={category.id}
                      index={category.order}
                      titleKr={category.label}
                      titleEn={category.titleEn}
                      subtitle={category.subtitle}
                      icon={category.icon}
                      onClick={() => handleCategorySelect(category.id)}
                    />
                  ))}
              </div>
            </motion.section>
          )}

          {screen === "result" && profile && (
            <motion.section
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35 }}
              className="max-w-7xl mx-auto px-4 py-8"
            >
              <div className="mb-6 flex items-center justify-between">
                <button
                  onClick={goBackFromResult}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white hover:border-neon-primary/40 hover:text-neon-primary transition-colors"
                >
                  ← 돌아가기
                </button>

                {activeCategory && (
                  <div className="text-right">
                    <div className="text-white/40 text-xs uppercase tracking-[0.2em]">Category</div>
                    <div className="text-white font-semibold">{activeCategory.label}</div>
                    <div className="text-white/35 text-xs mt-1">{activeCategory.titleEn}</div>
                  </div>
                )}
              </div>

              <ResultCard
                profile={profile}
                summary={summary}
                reading={reading}
                category={
                  activeCategory
                    ? { titleKr: activeCategory.label, titleEn: activeCategory.titleEn }
                    : null
                }
                categoryId={currentCategory}
                isLoading={isLoading}
                onAskDeeper={openConsult}
              />
            </motion.section>
          )}

          {screen === "consult" && profile && (
            <motion.section
              key="consult"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35 }}
              className="max-w-7xl mx-auto px-4 py-8"
            >
              <div className="mb-6 flex items-center justify-between">
                <button
                  onClick={closeConsult}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white hover:border-neon-primary/40 hover:text-neon-primary transition-colors"
                >
                  ← 돌아가기
                </button>

                <div className="inline-flex items-center gap-2 rounded-full border border-neon-primary/20 bg-neon-primary/10 px-4 py-2 text-neon-primary text-sm">
                  <MessageSquare className="w-4 h-4" />
                  내 사주 상담
                </div>
              </div>

              <ChatInterface
                profile={profile}
                summary={summary}
                reading={reading}
                sessionId={sessionId}
                initialInput={initialChatInput}
                onInitialInputConsumed={() => setInitialChatInput("")}
              />
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      <footer className="py-8 text-center text-white/30 text-xs">
        <div className="flex items-center justify-center gap-2 mb-2">
          <UserIcon className="w-3 h-3" />
          <span>© 2026 천명(天命) · Futuristic Saju System</span>
        </div>
        <p>이 분석은 참고용 해석이며, 절대적 진실이 아니라 패턴 해석 도구입니다.</p>
      </footer>

      <ErrorModal
        open={!!errorMessage}
        title="해석 중 오류가 났다"
        message={errorMessage || ""}
        onRetry={retryAction || undefined}
        onClose={() => {
          setErrorMessage(null);
          setRetryAction(null);
        }}
      />
    </div>
  );
}
