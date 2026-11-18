import React, { useState, useEffect } from 'react';
import { 
  Menu, X, Check, ArrowRight, Sun, Moon, LogIn,
  BookOpen, BrainCircuit, Sparkles, Compass, Flame,
  Trophy, Target, ChevronDown, ChevronUp,
  Layers, BarChart3, CheckCircle2, Clock, ArrowUpRight,
  Star, Users, FileText, Zap, Award
} from 'lucide-react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  const [isDark, setIsDark] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeHeroTab, setActiveHeroTab] = useState<'ai' | 'mastery' | 'streak'>('ai');
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleDark = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    if (newTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen relative font-sans text-slate-800 dark:text-slate-100 bg-[#f8fafc] dark:bg-[#090d16] overflow-x-hidden selection:bg-indigo-500 selection:text-white transition-colors duration-300">
      
      {/* ========================================================================= */}
      {/* 1. AMBIENT AURA BACKGROUND LIGHTS                                         */}
      {/* ========================================================================= */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 [contain:strict]">
        {/* Glow Orb Top */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[450px] bg-[radial-gradient(ellipse_at_center,rgba(79,70,229,0.18),transparent_70%)] dark:bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.22),transparent_70%)]"></div>
        {/* Glow Orb Right */}
        <div className="absolute top-[35%] -right-32 w-[500px] h-[500px] bg-[radial-gradient(ellipse_at_center,rgba(6,182,212,0.12),transparent_70%)]"></div>
        {/* Glow Orb Left */}
        <div className="absolute top-[65%] -left-32 w-[500px] h-[500px] bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.12),transparent_70%)]"></div>
        {/* Delicate grid texture */}
        <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40"></div>
      </div>

      {/* ========================================================================= */}
      {/* 2. FLOATING NAVIGATION BAR                                                */}
      {/* ========================================================================= */}
      <header className="fixed top-4 left-1/2 -translate-x-1/2 w-[92%] max-w-7xl px-5 sm:px-7 py-3.5 rounded-2xl flex justify-between items-center z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/90 dark:border-slate-800/90 shadow-[0_10px_35px_-5px_rgba(15,23,42,0.08)] dark:shadow-[0_10px_35px_-5px_rgba(0,0,0,0.5)] transition-all">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <button 
            className="lg:hidden text-slate-700 dark:text-slate-200 hover:text-indigo-600 p-1 rounded-lg"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Menu"
          >
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="relative">
              <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-blue-500 via-sky-400 to-cyan-400 opacity-70 blur-xs group-hover:opacity-100 transition-opacity"></div>
              <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 via-sky-600 to-blue-800 text-white flex items-center justify-center font-bold text-lg shadow-md">
                <span className="font-heading">∑</span>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-xl md:text-2xl font-black font-heading tracking-tight text-slate-950 dark:text-white leading-none">
                FMATH<span className="bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-500 bg-clip-text text-transparent">12</span>
              </span>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-wider font-heading uppercase">
                GDPT 2018
              </span>
            </div>
          </Link>
        </div>

        {/* Desktop Nav Links */}
        <nav className="hidden lg:flex items-center gap-7 font-heading text-[13.5px] font-semibold text-slate-600 dark:text-slate-300">
          <a href="#features" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Tính năng nổi bật</a>
          <a href="#ai-tutor" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">FMATH12 AI Tutor</a>
          <a href="#curriculum" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Chuyên đề Toán 12</a>
          <a href="#roadmap" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Lộ trình 9+</a>
          <a href="#faq" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Hỏi đáp</a>
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleDark}
            className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-indigo-600 transition-all active:scale-95"
            aria-label="Đổi giao diện"
          >
            {isDark ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} />}
          </button>

          <Link 
            to="/login" 
            className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white px-4 sm:px-5 py-2.5 rounded-xl text-[13.5px] font-bold font-heading shadow-md shadow-indigo-600/25 hover:shadow-indigo-600/40 hover:-translate-y-0.5 active:scale-95 transition-all"
          >
            <LogIn size={15} /> 
            <span className="hidden sm:inline">Vào học ngay</span>
            <span className="sm:hidden">Vào học</span>
          </Link>
        </div>
      </header>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 w-[92%] bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl p-6 rounded-2xl shadow-2xl z-40 flex flex-col gap-3 border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 lg:hidden">
          <a href="#features" onClick={() => setIsMobileMenuOpen(false)} className="font-heading font-bold text-slate-800 dark:text-white hover:text-indigo-600 py-1.5 flex items-center justify-between">
            Tính năng nổi bật <ArrowRight size={15} className="text-slate-400" />
          </a>
          <a href="#ai-tutor" onClick={() => setIsMobileMenuOpen(false)} className="font-heading font-bold text-slate-800 dark:text-white hover:text-indigo-600 py-1.5 flex items-center justify-between">
            FMATH12 AI Tutor <ArrowRight size={15} className="text-slate-400" />
          </a>
          <a href="#curriculum" onClick={() => setIsMobileMenuOpen(false)} className="font-heading font-bold text-slate-800 dark:text-white hover:text-indigo-600 py-1.5 flex items-center justify-between">
            Chuyên đề Toán 12 <ArrowRight size={15} className="text-slate-400" />
          </a>
          <a href="#roadmap" onClick={() => setIsMobileMenuOpen(false)} className="font-heading font-bold text-slate-800 dark:text-white hover:text-indigo-600 py-1.5 flex items-center justify-between">
            Lộ trình 9+ <ArrowRight size={15} className="text-slate-400" />
          </a>
          <a href="#faq" onClick={() => setIsMobileMenuOpen(false)} className="font-heading font-bold text-slate-800 dark:text-white hover:text-indigo-600 py-1.5 flex items-center justify-between">
            Hỏi đáp <ArrowRight size={15} className="text-slate-400" />
          </a>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <Link to="/login" className="btn-primary w-full py-3 text-center justify-center font-heading">
              Đăng nhập / Bắt đầu ngay
            </Link>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. HERO SECTION                                                           */}
      {/* ========================================================================= */}
      <section className="relative z-10 container mx-auto px-5 sm:px-6 pt-32 sm:pt-36 md:pt-40 pb-16 sm:pb-24 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Headlines & CTAs */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-7 text-center lg:text-left">
            
            {/* Tag badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50/90 dark:bg-indigo-950/70 border border-indigo-200/80 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold font-heading shadow-sm">
              <Sparkles size={14} className="text-indigo-600 dark:text-indigo-400 animate-pulse" />
              <span>FMATH12 2.0 • Kỷ Nguyên Học Toán Thích Ứng 2026</span>
            </div>

            {/* Main Headline (Raleway Display) */}
            <h1 className="text-4xl sm:text-5xl lg:text-[3.8rem] font-black font-raleway text-slate-950 dark:text-white leading-[1.12] tracking-tight">
              Khai Phóng Trí Tuệ <br className="hidden sm:block" />
              Toán Học 12 Cùng <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 font-raleway">
                FMATH12 AI
              </span>
            </h1>

            {/* Subtitle (Be Vietnam Pro) */}
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-sans font-normal">
              Nền tảng tự học và luyện thi Toán 12 đột phá: Kết hợp trợ giảng AI đa bước, bản đồ năng lực 7 chuyên đề và kho đề phân loại chuẩn cấu trúc Bộ GD&ĐT mới nhất — giúp bạn học sâu bản chất, làm chủ phản xạ và bứt phá điểm 9+.
            </p>

            {/* CTA Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-3.5 pt-2">
              <Link 
                to="/login" 
                className="btn-primary py-3.5 sm:py-4 px-8 text-[15px] font-bold font-heading shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/40 hover:-translate-y-0.5 active:scale-95 transition-all rounded-xl flex items-center justify-center gap-2 group"
              >
                <span>Bắt đầu học miễn phí</span>
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <a 
                href="#curriculum" 
                className="btn-outline py-3.5 sm:py-4 px-7 text-[15px] font-semibold font-heading rounded-xl hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center justify-center gap-2"
              >
                <BookOpen size={17} />
                <span>Khám phá 7 chuyên đề</span>
              </a>
            </div>

            {/* Key Trust Metrics (Raleway Numbers) */}
            <div className="pt-6 border-t border-slate-200/70 dark:border-slate-800/80 grid grid-cols-3 gap-4 max-w-lg mx-auto lg:mx-0">
              <div className="text-left">
                <div className="text-2xl sm:text-3xl font-black font-raleway text-slate-900 dark:text-white">100%</div>
                <div className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 font-sans mt-0.5">Chuẩn đề Bộ GD 2025</div>
              </div>
              <div className="text-left">
                <div className="text-2xl sm:text-3xl font-black font-raleway text-indigo-600 dark:text-indigo-400">24/7</div>
                <div className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 font-sans mt-0.5">FMATH12 AI Trợ giảng</div>
              </div>
              <div className="text-left">
                <div className="text-2xl sm:text-3xl font-black font-raleway text-cyan-600 dark:text-cyan-400">10k+</div>
                <div className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 font-sans mt-0.5">Câu hỏi phân dạng</div>
              </div>
            </div>

          </div>

          {/* Right Column: Interactive Live Showcase Widget */}
          <div className="lg:col-span-5 relative w-full max-w-lg mx-auto">
            
            {/* Glowing Backdrop */}
            <div className="absolute -inset-2 bg-gradient-to-tr from-indigo-500/25 via-purple-500/20 to-cyan-500/25 rounded-3xl blur-2xl -z-10"></div>
            
            {/* Showcase Main Container */}
            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xl overflow-hidden transition-all">
              
              {/* Interactive Tabs Header */}
              <div className="p-3 bg-slate-50/90 dark:bg-slate-850/90 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-rose-400/80"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-400/80"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-400/80"></div>
                </div>

                <div className="flex items-center gap-1 bg-slate-200/70 dark:bg-slate-800 p-0.5 rounded-xl text-xs font-heading font-semibold">
                  <button 
                    onClick={() => setActiveHeroTab('ai')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      activeHeroTab === 'ai' 
                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-xs' 
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    AI Tutor
                  </button>
                  <button 
                    onClick={() => setActiveHeroTab('mastery')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      activeHeroTab === 'mastery' 
                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-xs' 
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    Bản đồ năng lực
                  </button>
                  <button 
                    onClick={() => setActiveHeroTab('streak')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      activeHeroTab === 'streak' 
                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-xs' 
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    Streak & Bảng vàng
                  </button>
                </div>
              </div>

              {/* Showcase Body Content Based on Tab */}
              <div className="p-6 space-y-5 min-h-[360px] flex flex-col justify-between">
                
                {activeHeroTab === 'ai' && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-lg font-raleway border border-indigo-200/60 dark:border-indigo-800">
                          ∫
                        </div>
                        <div>
                          <h4 className="font-heading font-bold text-slate-900 dark:text-white text-sm m-0">Tích Phân Ứng Dụng Thực Tế</h4>
                          <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">Đề minh họa 2025 • Mức độ 8.5+</span>
                        </div>
                      </div>
                      <span className="badge-primary">FMATH AI Active</span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 space-y-1.5">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-heading">Câu hỏi:</div>
                      <div className="font-mono text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                        S = ∫[0..4] (4x - x²) dx - S(tam giác OAB)
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 font-sans leading-relaxed m-0">
                        Tính thể tích khối bê tông của cổng vòm parabol giới hạn bởi đồ thị và đường thẳng d.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-gradient-to-br from-indigo-50/90 to-purple-50/60 dark:from-indigo-950/40 dark:to-slate-800/60 border border-indigo-200/80 dark:border-indigo-800/80 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 dark:text-indigo-300 font-heading">
                        <BrainCircuit size={16} />
                        <span>FMATH12 AI phân tích tư duy:</span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-200 font-sans leading-relaxed m-0">
                        💡 <strong>Lưu ý:</strong> Học sinh thường quên trừ phần diện tích tam giác con. Hãy tìm giao điểm của parabol và đường thẳng trước, rồi mới áp dụng công thức tích phân từng phần!
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
                      <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-emerald-500" /> Giải thích 3 bước chi tiết</span>
                      <span className="text-indigo-600 dark:text-indigo-400 font-bold font-heading">Có mẹo Casio 580</span>
                    </div>
                  </div>
                )}

                {activeHeroTab === 'mastery' && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                      <div>
                        <h4 className="font-heading font-bold text-slate-900 dark:text-white text-sm m-0">Hồ Sơ Năng Lực Toán 12</h4>
                        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Đánh giá theo chuẩn Bộ GD&ĐT</span>
                      </div>
                      <span className="badge-primary">Tổng quan 8.6</span>
                    </div>

                    <div className="space-y-3 font-sans">
                      <div>
                        <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          <span>Ứng dụng Đạo hàm khảo sát hàm số</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-raleway font-black">94% • Thuần thục</span>
                        </div>
                        <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full w-[94%]"></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          <span>Hình học Không gian & Tọa độ Oxyz</span>
                          <span className="text-indigo-600 dark:text-indigo-400 font-raleway font-black">88% • Đạt chuẩn</span>
                        </div>
                        <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full w-[88%]"></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          <span>Xác suất có điều kiện & Công thức Bayes</span>
                          <span className="text-amber-500 dark:text-amber-400 font-raleway font-black">72% • Cần luyện thêm</span>
                        </div>
                        <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-500 rounded-full w-[72%]"></div>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/80 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                      <Target size={16} className="shrink-0 text-amber-600" />
                      <span>Gợi ý: Làm ngay 5 bài trắc nghiệm Đúng/Sai phần Bayes để kéo điểm chuyên đề!</span>
                    </div>
                  </div>
                )}

                {activeHeroTab === 'streak' && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                      <div>
                        <h4 className="font-heading font-bold text-slate-900 dark:text-white text-sm m-0">Gamification & Thành Tích</h4>
                        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Động lực học mỗi ngày</span>
                      </div>
                      <span className="badge-warning">Hạng 4 Tuần</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800 text-center space-y-1">
                        <Flame size={24} className="mx-auto text-amber-500 animate-bounce" />
                        <div className="text-2xl font-black font-raleway text-slate-900 dark:text-white">18 Ngày</div>
                        <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Chuỗi Streak liên tục</div>
                      </div>

                      <div className="p-4 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800 text-center space-y-1">
                        <Trophy size={24} className="mx-auto text-indigo-600 dark:text-indigo-400" />
                        <div className="text-2xl font-black font-raleway text-slate-900 dark:text-white">2,850 XP</div>
                        <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">FMATH Master Level 8</div>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center font-bold">
                          🥇
                        </div>
                        <div className="text-xs">
                          <p className="font-bold font-heading text-slate-900 dark:text-white m-0">Huy hiệu: Khắc tinh Oxyz</p>
                          <p className="text-[11px] text-slate-500 m-0">Đã giải đúng 50 bài hình học không gian</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-emerald-600">+100 XP</span>
                    </div>
                  </div>
                )}

                {/* Footer preview note */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                    <span>Live Simulator</span>
                  </span>
                  <Link to="/login" className="text-indigo-600 dark:text-indigo-400 font-bold font-heading flex items-center gap-1 hover:underline">
                    Trải nghiệm thực tế <ArrowRight size={13} />
                  </Link>
                </div>

              </div>

            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. NEW EXAM FORMAT 2025 HIGHLIGHT                                         */}
      {/* ========================================================================= */}
      <section className="py-16 relative z-10 border-y border-slate-200/70 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/40 backdrop-blur-md">
        <div className="container mx-auto px-5 sm:px-6 max-w-7xl">
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
            <span className="badge-primary">Bám sát đổi mới</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold font-heading text-slate-950 dark:text-white">
              Đột Phá Với Cấu Trúc Đề Mới Bộ GD&ĐT 2025
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base font-sans">
              FMATH12 là nền tảng đầu tiên tối ưu hóa 100% dạng bài luyện tập theo đúng chuẩn 3 phần thi chính thức, giúp học sinh xóa tan nỗi lo khoanh lụi và đạt điểm tuyệt đối.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Part 1 */}
            <div className="flat-card-interactive p-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 font-heading">Phần I (12 câu)</span>
                <span className="badge-primary">3.0 Điểm</span>
              </div>
              <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white">
                Trắc Nghiệm 4 Lựa Chọn
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-sans">
                Kiểm tra kiến thức cốt lõi ở mức độ Nhận biết và Thông hiểu. Luyện phản xạ nhanh với mẹo nhận diện đồ thị hàm số và bảng biến thiên chỉ trong 30 giây.
              </p>
            </div>

            {/* Part 2 */}
            <div className="flat-card-interactive p-6 space-y-3 border-indigo-200/80 dark:border-indigo-800/80 relative">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 font-heading">Phần II (4 câu - 16 ý)</span>
                <span className="badge-primary">4.0 Điểm</span>
              </div>
              <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white">
                Trắc Nghiệm Đúng / Sai
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-sans">
                Đòi hỏi tư duy sâu và tính toán chính xác cả 4 mệnh đề trong một bài toán thực tế. AI trợ giảng sẽ chỉ ra từng bẫy ngụy biện logic để không mất điểm oan.
              </p>
            </div>

            {/* Part 3 */}
            <div className="flat-card-interactive p-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 font-heading">Phần III (6 câu)</span>
                <span className="badge-info">3.0 Điểm</span>
              </div>
              <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white">
                Câu Hỏi Trả Lời Ngắn
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-sans">
                Tuyệt đối không thể đoán mò: Học sinh tự giải và điền trực tiếp giá trị số. Hệ thống tự động phân tích phương sai, làm tròn số và so khớp đáp số chuẩn mực.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. BENTO GRID FEATURES                                                    */}
      {/* ========================================================================= */}
      <section id="features" className="py-24 relative z-10">
        <div className="container mx-auto px-5 sm:px-6 max-w-7xl">
          
          <div className="text-center mb-16 max-w-2xl mx-auto space-y-3">
            <span className="badge-primary">Giá trị vượt trội</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-950 dark:text-white font-heading">
              Hệ Sinh Thái Học Toán Toàn Diện
            </h2>
            <p className="text-slate-600 dark:text-slate-400 font-sans text-sm sm:text-base">
              Mỗi tính năng trong FMATH12 được nghiên cứu để hỗ trợ học sinh học chủ động, giảm tải áp lực và tối ưu hoá thời gian tự học tại nhà.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Feature 1: Large card - AI Tutor */}
            <div id="ai-tutor" className="md:col-span-2 flat-card-interactive p-7 md:p-9 relative overflow-hidden group">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-5 shadow-sm group-hover:scale-105 transition-transform">
                <BrainCircuit size={26} />
              </div>
              <h3 className="text-2xl font-bold font-heading text-slate-900 dark:text-white mb-2.5">
                FMATH12 AI — Gia Sư Toán Học Cá Nhân 24/7
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed font-sans max-w-xl">
                Không đơn thuần đưa đáp số, FMATH12 AI phân tích tư duy đa chiều: phát hiện dòng biến đổi sai, gợi ý kiến thức cần ôn lại và chỉ dẫn các mẹo phím tắt Casio 580VNX/880BTG tương thích.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <span className="badge-primary">Phát hiện bẫy đề thi</span>
                <span className="badge-info">Gợi ý tư duy từng bước</span>
                <span className="badge-success">Mẹo Casio 580 & 880</span>
              </div>
            </div>

            {/* Feature 2: Interactive Theory */}
            <div className="flat-card-interactive p-7 md:p-8 group">
              <div className="w-12 h-12 rounded-2xl bg-cyan-50 dark:bg-cyan-950/70 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mb-5 shadow-sm group-hover:scale-105 transition-transform">
                <BookOpen size={26} />
              </div>
              <h3 className="text-xl font-bold font-heading text-slate-900 dark:text-white mb-2">
                Lý Thuyết Trực Quan
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed font-sans">
                Hệ thống sơ đồ tư duy, công thức KaTeX sắc nét, bảng biến thiên động và ví dụ minh họa từng chuyên đề giúp bạn hiểu sâu bản chất toán học.
              </p>
            </div>

            {/* Feature 3: Adaptive Mastery Map */}
            <div className="flat-card-interactive p-7 md:p-8 group">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-5 shadow-sm group-hover:scale-105 transition-transform">
                <Compass size={26} />
              </div>
              <h3 className="text-xl font-bold font-heading text-slate-900 dark:text-white mb-2">
                Bản Đồ Năng Lực Thích Ứng
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed font-sans">
                Thuật toán tự động chấm điểm độ thông thạo từng chủ đề, nhận diện lỗ hổng kiến thức và đề xuất bài luyện tập bù đắp tức thì.
              </p>
            </div>

            {/* Feature 4: Large card - Gamification */}
            <div className="md:col-span-2 flat-card-interactive p-7 md:p-9 relative overflow-hidden group">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-5 shadow-sm group-hover:scale-105 transition-transform">
                <Trophy size={26} />
              </div>
              <h3 className="text-2xl font-bold font-heading text-slate-900 dark:text-white mb-2.5">
                Gamification & Bảng Vàng Vinh Danh
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed font-sans max-w-xl">
                Biến việc học Toán thành trải nghiệm đầy hứng khởi: Tích lũy điểm XP, thăng hạng FMATH Level, giữ chuỗi ngày học Streak liên tục và vinh danh trên bảng vàng tuần toàn quốc.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <span className="badge-warning">FMATH Streak giữ nhịp học</span>
                <span className="badge-primary">Bảng xếp hạng tuần</span>
                <span className="badge-primary">Bộ huy hiệu danh dự</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. 7 CHUYÊN ĐỀ TOÁN 12 TRỌNG TÂM                                          */}
      {/* ========================================================================= */}
      <section id="curriculum" className="py-20 relative z-10 bg-slate-100/60 dark:bg-slate-900/40 border-y border-slate-200/70 dark:border-slate-800/80">
        <div className="container mx-auto px-5 sm:px-6 max-w-7xl">
          <div className="text-center mb-14 max-w-2xl mx-auto space-y-3">
            <span className="badge-primary">Khung chuẩn GDPT 2018</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-950 dark:text-white font-heading">
              7 Chuyên Đề Trọng Tâm Toán 12
            </h2>
            <p className="text-slate-600 dark:text-slate-400 font-sans text-sm sm:text-base">
              Hệ thống học liệu và ngân hàng câu hỏi được chia nhỏ khoa học theo đúng ma trận đề thi tốt nghiệp THPT.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[
              { id: 1, title: 'Ứng Dụng Đạo Hàm', desc: 'Đơn điệu, cực trị, GTLN-GTNN, tiệm cận & đồ thị thực tế', count: '1,850+ câu', icon: '📈' },
              { id: 2, title: 'Tọa Độ Không Gian Oxyz', desc: 'Vectơ, mặt phẳng, mặt cầu & bài toán thực tế khoảng cách', count: '1,420+ câu', icon: '📐' },
              { id: 3, title: 'Nguyên Hàm & Tích Phân', desc: 'Bảng công thức, đổi biến, từng phần & ứng dụng tính thể tích', count: '1,680+ câu', icon: '∫' },
              { id: 4, title: 'Số Liệu Ghép Nhóm', desc: 'Phương sai, độ lệch chuẩn, tứ phân vị & xử lý dữ liệu lớn', count: '920+ câu', icon: '📊' },
              { id: 5, title: 'Xác Suất Có Điều Kiện', desc: 'Quy tắc nhân, sơ đồ cây, công thức xác suất toàn phần & Bayes', count: '1,150+ câu', icon: '🎲' },
              { id: 6, title: 'Phương Trình & Bất PT Mũ', desc: 'Hàm số lũy thừa, logarit & bài toán lãi suất, tăng trưởng', count: '1,200+ câu', icon: '⚡' },
              { id: 7, title: 'Bài Toán Tối Ưu Thực Tế', desc: 'Mô hình hóa kinh tế, cực trị hình học & tối ưu chi phí vật liệu', count: '850+ câu', icon: '🎯' },
            ].map((topic) => (
              <div key={topic.id} className="flat-card-interactive p-5 flex flex-col justify-between group">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{topic.icon}</span>
                    <span className="text-[11px] font-bold text-slate-400 font-heading">Chuyên đề 0{topic.id}</span>
                  </div>
                  <h4 className="text-base font-bold font-heading text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {topic.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
                    {topic.desc}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400 font-heading">{topic.count}</span>
                  <Link to="/quiz" className="text-slate-400 group-hover:text-indigo-600 transition-colors flex items-center gap-1 font-bold">
                    Luyện tập <ArrowUpRight size={13} />
                  </Link>
                </div>
              </div>
            ))}

            {/* Bonus Box: All-in-one */}
            <div className="flat-card p-5 bg-gradient-to-br from-indigo-600 to-violet-700 text-white flex flex-col justify-between shadow-lg">
              <div className="space-y-2">
                <span className="badge-primary bg-white/20 text-white border-white/30">Kho đề tổng hợp</span>
                <h4 className="text-lg font-bold font-heading text-white">Đề Thi Thử Chuẩn 2025</h4>
                <p className="text-xs text-white/80 leading-relaxed font-sans">
                  Bộ đề thi tổng hợp đầy đủ 3 phần thi với đồng hồ bấm giờ, phân tích phổ điểm và xếp hạng tức thì.
                </p>
              </div>
              <Link to="/quiz" className="mt-4 inline-flex items-center justify-center gap-1.5 bg-white text-indigo-900 px-4 py-2 rounded-xl text-xs font-bold font-heading shadow-md hover:bg-slate-50 transition-colors">
                Làm đề ngay <ArrowRight size={14} />
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. LỘ TRÌNH BỨT PHÁ 9+                                                    */}
      {/* ========================================================================= */}
      <section id="roadmap" className="py-24 relative z-10">
        <div className="container mx-auto px-5 sm:px-6 max-w-6xl">
          <div className="text-center mb-16 max-w-2xl mx-auto space-y-3">
            <span className="badge-primary">Chiến thuật khoa học</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-950 dark:text-white font-heading">
              Lộ Trình Bứt Phá Điểm 9+
            </h2>
            <p className="text-slate-600 dark:text-slate-400 font-sans text-sm sm:text-base">
              Không học dàn trải — tập trung vào các điểm mấu chốt để tối ưu hóa thời gian và gia tăng điểm số nhanh nhất.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                step: 'GIAI ĐOẠN 1',
                target: 'Mục tiêu: 6.5 - 7.5 Điểm',
                title: 'Nền Tảng & Xóa Mất Gốc',
                desc: 'Nắm chắc 100% công thức đạo hàm, tích phân cơ bản và phản xạ nhanh các câu hỏi Phần I.',
                bullets: [
                  'Thuần thục 7 bảng công thức trọng tâm',
                  'Phản xạ nhận diện đồ thị hàm số dưới 40s',
                  'Kỹ năng bấm máy Casio kiểm tra nghiệm'
                ]
              },
              {
                step: 'GIAI ĐOẠN 2',
                target: 'Mục tiêu: 7.5 - 8.5 Điểm',
                title: 'Thực Chiến Đúng/Sai & Oxyz',
                desc: 'Chinh phục Phần II (Trắc nghiệm Đúng/Sai) và giải thành thạo các bài toán không gian thực tế.',
                bullets: [
                  'Tư duy phân tích 4 mệnh đề độc lập',
                  'Phương pháp tọa độ hóa hình không gian',
                  'Bài toán xác suất có điều kiện & Bayes'
                ]
              },
              {
                step: 'GIAI ĐOẠN 3',
                target: 'Mục tiêu: 9.0 - 10.0 Điểm',
                title: 'Vận Dụng Cao & Trả Lời Ngắn',
                desc: 'Làm chủ các bài toán thực tế, tối ưu hóa kinh tế và rèn luyện độ chuẩn xác tuyệt đối ở Phần III.',
                bullets: [
                  'Kỹ thuật chặn khoảng & đánh giá cực trị',
                  'Chống sai số câu hỏi điền đáp án ngắn',
                  'Chiến thuật phân bổ 90 phút tối ưu'
                ]
              }
            ].map((card, idx) => (
              <div key={idx} className="flat-card-interactive p-7 flex flex-col justify-between group">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="badge-primary">{card.step}</span>
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 font-heading">{card.target}</span>
                  </div>
                  <h3 className="text-xl font-bold font-heading text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-sans font-normal">
                    {card.desc}
                  </p>
                  <div className="h-px bg-slate-100 dark:bg-slate-800 my-4" />
                  <ul className="space-y-2.5 font-sans">
                    {card.bullets.map((b, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
                        <div className="w-4 h-4 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                          <Check size={11} strokeWidth={3} />
                        </div>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. HỌC SINH NÓI GÌ VỀ FMATH12 (TESTIMONIALS)                             */}
      {/* ========================================================================= */}
      <section className="py-20 relative z-10 bg-white/60 dark:bg-slate-900/40 border-y border-slate-200/70 dark:border-slate-800/80">
        <div className="container mx-auto px-5 sm:px-6 max-w-6xl">
          <div className="text-center mb-14 max-w-2xl mx-auto space-y-3">
            <span className="badge-primary">Cộng đồng tin tưởng</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-950 dark:text-white font-heading">
              Đồng Hành Cùng Hàng Nghìn Sĩ Tử
            </h2>
            <p className="text-slate-600 dark:text-slate-400 font-sans text-sm sm:text-base">
              Lắng nghe trải nghiệm bứt phá điểm số thực tế từ những học sinh đã sử dụng FMATH12.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: 'Nguyễn Minh Quân',
                school: 'THPT Chuyên Hà Nội - Amsterdam',
                score: 'Toán 9.4 • Đợt thi thử Tỉnh',
                comment: 'FMATH12 AI giải thích phần Trắc nghiệm Đúng/Sai rất chi tiết. Trước đây mình hay bị bẫy ở ý c và d, nhờ AI chỉ ra nguyên nhân ngụy biện nên mình đã tự tin hẳn!'
              },
              {
                name: 'Trần Thảo Linh',
                school: 'THPT Lê Quý Đôn (TP.HCM)',
                score: 'Từ 6.2 lên 8.8 sau 6 tuần',
                comment: 'Bản đồ năng lực chỉ đúng ngay lỗ hổng phần Xác suất có điều kiện của mình. Mình luyện đúng các bài AI gợi ý và điểm số cải thiện rõ rệt, không cần học lan man.'
              },
              {
                name: 'Hoàng Quốc Bảo',
                school: 'THPT Phan Châu Trinh (Đà Nẵng)',
                score: 'Streak 42 ngày • Top 10 Bảng vàng',
                comment: 'Tính năng Streak và thăng hạng XP thực sự gây nghiện theo hướng tích cực! Mỗi ngày mình đều vào giải ít nhất 10 bài để giữ lửa học tập.'
              }
            ].map((t, idx) => (
              <div key={idx} className="flat-card p-6 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-1 text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={15} fill="currentColor" />
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-sans italic">
                    "{t.comment}"
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                  <p className="font-bold font-heading text-sm text-slate-900 dark:text-white m-0">{t.name}</p>
                  <p className="text-[11px] text-slate-500 m-0">{t.school}</p>
                  <span className="badge-primary mt-2 inline-block">{t.score}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. FAQ ACCORDION                                                          */}
      {/* ========================================================================= */}
      <section id="faq" className="py-24 relative z-10">
        <div className="container mx-auto px-5 sm:px-6 max-w-4xl">
          <div className="text-center mb-14 space-y-3">
            <span className="badge-primary">Giải đáp nhanh</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-950 dark:text-white font-heading">
              Câu Hỏi Thường Gặp
            </h2>
            <p className="text-slate-600 dark:text-slate-400 font-sans text-sm sm:text-base">
              Tất cả những điều bạn cần biết trước khi bắt đầu hành trình cùng FMATH12.
            </p>
          </div>

          <div className="space-y-3.5">
            {[
              {
                q: 'FMATH12 có bám sát đề thi định dạng mới từ năm 2025 không?',
                a: 'Có, 100% ngân hàng câu hỏi trên FMATH12 được biên soạn và chuẩn hóa theo cấu trúc 3 phần mới nhất của Bộ GD&ĐT: Phần I (Trắc nghiệm nhiều lựa chọn), Phần II (Trắc nghiệm Đúng/Sai), và Phần III (Trả lời ngắn).'
              },
              {
                q: 'FMATH12 AI trợ giảng giải bài tập như thế nào?',
                a: 'FMATH12 AI không chỉ đưa ra đáp án cuối cùng. AI hoạt động như một gia sư thực thụ: phân tích dữ kiện đầu bài, gợi ý hướng tiếp cận tư duy, phát hiện sai sót trong từng bước biến đổi đại số và hướng dẫn thao tác Casio tương ứng.'
              },
              {
                q: 'Tôi có thể sử dụng FMATH12 trên điện thoại di động không?',
                a: 'Hoàn toàn mượt mà! FMATH12 được thiết kế responsive tối ưu cho cả smartphone, máy tính bảng và máy tính để bàn. Bạn có thể tự học mọi lúc mọi nơi.'
              },
              {
                q: 'Tính năng Bản đồ năng lực hoạt động ra sao?',
                a: 'Khi bạn làm bài tập, hệ thống tự động ghi nhận độ chính xác và thời gian giải của bạn trên 7 chuyên đề. Từ đó hệ thống tạo biểu đồ năng lực trực quan và cảnh báo chính xác mảng kiến thức bạn đang còn yếu để tập trung cải thiện.'
              }
            ].map((faq, idx) => (
              <div 
                key={idx} 
                className="flat-card overflow-hidden transition-all duration-200 cursor-pointer"
                onClick={() => toggleFaq(idx)}
              >
                <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
                  <h4 className="font-heading font-bold text-sm sm:text-base text-slate-900 dark:text-white m-0">
                    {faq.q}
                  </h4>
                  <div className="text-slate-400 shrink-0">
                    {activeFaq === idx ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </div>
                {activeFaq === idx && (
                  <div className="px-4 sm:px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-sans leading-relaxed border-t border-slate-100 dark:border-slate-800 animate-in fade-in">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 10. CALL TO ACTION BANNER                                                 */}
      {/* ========================================================================= */}
      <section className="py-16 px-5 sm:px-6 max-w-5xl mx-auto relative z-10">
        <div className="relative rounded-3xl p-8 sm:p-14 text-center text-white overflow-hidden shadow-2xl bg-gradient-to-tr from-indigo-700 via-indigo-600 to-violet-700 border border-white/20">
          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <span className="px-4 py-1.5 rounded-full bg-white/15 text-white text-xs font-bold font-heading uppercase tracking-wider backdrop-blur-md">
              Khai mở tiềm năng toán học
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black font-raleway leading-tight">
              Sẵn Sàng Bứt Phá Điểm 9+ Cùng FMATH12?
            </h2>
            <p className="text-sm sm:text-base opacity-90 leading-relaxed font-sans font-normal">
              Đăng ký tài khoản ngay hôm nay để nhận bản đồ năng lực cá nhân hóa và khám phá kho 10,000+ câu hỏi luyện thi chuẩn Bộ GD&ĐT hoàn toàn miễn phí.
            </p>
            <div className="pt-2">
              <Link 
                to="/login" 
                className="inline-flex items-center gap-2 bg-white text-indigo-900 font-bold font-heading px-8 py-4 rounded-xl shadow-xl hover:bg-slate-50 hover:scale-105 active:scale-95 transition-all text-base"
              >
                Bắt đầu ngay hôm nay <ArrowRight size={18} />
              </Link>
            </div>
          </div>

          {/* Ambient Glows inside Banner */}
          <div className="absolute w-72 h-72 rounded-full bg-cyan-400/20 blur-3xl -top-16 -left-16 pointer-events-none"></div>
          <div className="absolute w-72 h-72 rounded-full bg-purple-400/25 blur-3xl -bottom-16 -right-16 pointer-events-none"></div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 11. FOOTER                                                                */}
      {/* ========================================================================= */}
      <footer className="relative z-10 bg-white dark:bg-slate-950 pt-16 pb-12 border-t border-slate-200/80 dark:border-slate-800 transition-colors">
        <div className="container mx-auto px-5 sm:px-6 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-slate-100 dark:border-slate-800">
            
            {/* Logo & Description */}
            <div className="md:col-span-2 space-y-4">
              <Link to="/" className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-800 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                  ∑
                </div>
                <span className="text-2xl font-black font-raleway text-slate-900 dark:text-white tracking-tight">
                  FMATH<span className="text-indigo-600 dark:text-indigo-400">12</span>
                </span>
              </Link>
              <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm leading-relaxed max-w-md font-sans font-normal">
                FMATH12 — Hệ sinh thái Học tập Thích ứng & Trí tuệ Nhân tạo Toán học 12. Mang đến phương pháp học tập trực quan, thông minh và hiệu quả cho học sinh Việt Nam theo khung chương trình mới 2025.
              </p>
            </div>

            {/* Quick links */}
            <div>
              <h4 className="font-bold font-heading text-slate-900 dark:text-white text-xs sm:text-sm mb-4 uppercase tracking-wider">
                Khám Phá
              </h4>
              <ul className="space-y-2.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-sans">
                <li><Link to="/theory" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Lý thuyết Trực quan</Link></li>
                <li><Link to="/quiz" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Luyện tập Chuyên đề</Link></li>
                <li><Link to="/resources" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Học liệu & Bài giảng</Link></li>
                <li><Link to="/leaderboard" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Bảng vàng Vinh danh</Link></li>
              </ul>
            </div>

            {/* Account & Help */}
            <div>
              <h4 className="font-bold font-heading text-slate-900 dark:text-white text-xs sm:text-sm mb-4 uppercase tracking-wider">
                Hệ Thống
              </h4>
              <ul className="space-y-2.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-sans">
                <li><Link to="/login" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Đăng nhập Học sinh</Link></li>
                <li><Link to="/login" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Cổng Giáo viên / Quản trị</Link></li>
                <li><a href="#faq" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Hỏi đáp & Hỗ trợ</a></li>
              </ul>
            </div>

          </div>

          <div className="pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-medium text-slate-400 font-sans">
            <p>© 2026 FMATH12 Platform. All rights reserved.</p>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-slate-500 dark:text-slate-400 font-semibold font-heading">FMATH12 Cloud Active • Chuẩn GDPT 2018</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
