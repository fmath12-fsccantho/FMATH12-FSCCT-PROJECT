import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Mail, Lock, User, LogIn, UserPlus,
  Eye, EyeOff, Loader2, CheckCircle2, AlertCircle,
  RefreshCw, ChevronLeft, GraduationCap, School,
  Sun, Moon, ShieldCheck
} from 'lucide-react';
import {
  signInWithPopup, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth, googleProvider } from '../../config/firebase';
import { useAppStore } from '../../store/useAppStore';
import { supabase } from '../../config/supabase';

// ─── Password Strength Evaluator (Clean Solid Colors) ────────
const getStrength = (pwd: string) => {
  if (!pwd) return { level: 0, label: '', color: '' };
  let s = 0;
  if (pwd.length >= 8) s++;
  if (/[A-Z]/.test(pwd)) s++;
  if (/[0-9]/.test(pwd)) s++;
  if (/[^a-zA-Z0-9]/.test(pwd)) s++;
  if (s <= 1) return { level: 1, label: 'Yếu', color: '#dc2626' };
  if (s === 2) return { level: 2, label: 'Khá', color: '#d97706' };
  return { level: 3, label: 'Mạnh', color: '#16a34a' };
};

type Tab = 'login' | 'register' | 'forgot';
type UserRole = 'student' | 'teacher';

// ─── Reusable Input Field (Flat & Minimalist) ─────────────────
const InputField = ({
  icon, type, value, onChange, placeholder, autoComplete, rightEl
}: {
  icon: React.ReactNode; type: string; value: string;
  onChange: (v: string) => void; placeholder: string;
  autoComplete?: string; rightEl?: React.ReactNode;
}) => (
  <div className="relative group">
    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors pointer-events-none">
      {icon}
    </div>
    <input
      type={type} 
      value={value} 
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder} 
      autoComplete={autoComplete}
      className="w-full h-11 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-10 text-[13.5px] font-sans text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 transition-all shadow-2xs"
    />
    {rightEl && <div className="absolute right-3.5 top-1/2 -translate-y-1/2">{rightEl}</div>}
  </div>
);

// ─── Google Sign-In Button (Standard Flat Clean) ──────────────
const GoogleButton = ({ onClick, loading }: { onClick: () => void; loading: boolean }) => (
  <button 
    type="button" 
    onClick={onClick} 
    disabled={loading}
    className="w-full h-11 flex items-center justify-center gap-3 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl font-bold font-heading text-[13px] border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-750 transition-all disabled:opacity-60 shadow-2xs cursor-pointer active:scale-[0.99]"
  >
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
    Tiếp tục với tài khoản Google
  </button>
);

// ─── Main LoginPage Component (Modern Flat Solid Design) ─────
const LoginPage = () => {
  const navigate = useNavigate();
  const { switchRole, setIsFptStudent, setUser } = useAppStore();

  const [tab, setTab] = useState<Tab>('login');
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const [isDark, setIsDark] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Login inputs
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [showLoginPass, setShowLoginPass] = useState(false);

  // Register inputs
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regSchool, setRegSchool] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [showRegPass, setShowRegPass] = useState(false);

  // Forgot password inputs
  const [forgotEmail, setForgotEmail] = useState('');

  const strength = getStrength(regPass);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDark = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const switchTab = (t: Tab) => { 
    setTab(t); 
    setError(''); 
    setSuccess(''); 
  };

  // ─── Sync with Supabase & Redirect ──────────────────────────
  const syncAndRedirect = async (
    email: string, 
    displayName?: string, 
    explicitRole?: UserRole, 
    schoolName?: string
  ) => {
    const cleanEmail = email.toLowerCase().trim();
    let role: 'admin' | 'teacher' | 'student' = explicitRole || 'student';
    let defaultDisplayName = displayName;

    // Phân quyền đặc biệt cho Admin & BGK / Tài khoản demo
    if (cleanEmail === '5phutcungpy@gmail.com') {
      role = 'admin';
    } else if (cleanEmail === 'aiquizfct@gmail.com' || cleanEmail === 'giaoviendemo.bgk@gmail.com') {
      role = 'teacher';
      if (!defaultDisplayName) defaultDisplayName = 'Giáo Viên Demo';
    } else if (cleanEmail === 'hocsinhdemo.bgk@gmail.com') {
      role = 'student';
      if (!defaultDisplayName) defaultDisplayName = 'Học Sinh Demo';
    }

    if (cleanEmail === 'hocsinhdemo.bgk@gmail.com' || cleanEmail === 'giaoviendemo.bgk@gmail.com') {
      sessionStorage.removeItem('has_seen_bgk_welcome');
    }

    const isFct = cleanEmail.includes('fct');
    let computedSchool = schoolName?.trim();
    if (isFct) {
      computedSchool = 'THPT FPT Cần Thơ';
    } else if (!computedSchool) {
      computedSchool = (role === 'teacher' ? 'Giáo viên Toàn quốc' : 'Học sinh Tự do');
    }

    setIsFptStudent(false);
    switchRole(role);

    try {
      const { data: existing } = await supabase.from('users').select('*').eq('email', cleanEmail).maybeSingle();
      if (existing) {
        if (cleanEmail === 'giaoviendemo.bgk@gmail.com' && existing.role !== 'teacher') {
          await supabase.from('users').update({ role: 'teacher', full_name: 'Giáo Viên Demo' }).eq('id', existing.id);
          existing.role = 'teacher';
          existing.full_name = 'Giáo Viên Demo';
        }
        if (cleanEmail === 'hocsinhdemo.bgk@gmail.com' && (!existing.full_name || existing.full_name !== 'Học Sinh Demo')) {
          await supabase.from('users').update({ full_name: 'Học Sinh Demo' }).eq('id', existing.id);
          existing.full_name = 'Học Sinh Demo';
        }

        // Tự động gán đúng THPT FPT Cần Thơ nếu email FCT
        if (isFct && existing.school !== 'THPT FPT Cần Thơ') {
          await supabase.from('users').update({ school: 'THPT FPT Cần Thơ' }).eq('id', existing.id);
          existing.school = 'THPT FPT Cần Thơ';
        }
        // Nếu học sinh chưa tham gia lớp và email KHÔNG chứa fct, không gán mặc định FPT Cần Thơ
        else if (!isFct && (!existing.class_name || existing.class_name === 'Chưa xếp lớp') && existing.role === 'student' && existing.school === 'THPT FPT Cần Thơ') {
          await supabase.from('users').update({ school: 'Học sinh Tự do' }).eq('id', existing.id);
          existing.school = 'Học sinh Tự do';
        }

        setUser(existing);
        switchRole(existing.role);
      } else {
        const code = `TS_${Math.floor(Date.now() / 1000)}`;
        const { data: created } = await supabase.from('users').insert({
          full_name: defaultDisplayName || cleanEmail.split('@')[0],
          email: cleanEmail, 
          role, 
          school: computedSchool,
          xp: 0, 
          level: 1, 
          streak: 0,
          status: 'active', 
          student_code: code
        }).select('*').single();
        setUser(created || { 
          full_name: defaultDisplayName, 
          email: cleanEmail, 
          role, 
          school: computedSchool 
        });
      }
    } catch (e) { 
      console.warn('DB sync:', e); 
    }

    navigate('/dashboard');
  };

  // ─── Handlers ───────────────────────────────────────────────
  const handleLogin = async (e?: React.FormEvent, customEmail?: string, customPass?: string) => {
    if (e) e.preventDefault();
    const emailToUse = customEmail || loginEmail;
    const passToUse = customPass || loginPass;

    if (!emailToUse || !passToUse) { 
      setError('Vui lòng nhập đầy đủ email và mật khẩu!'); 
      return; 
    }
    setLoading(true); 
    setError('');
    
    try {
      const { user } = await signInWithEmailAndPassword(auth, emailToUse, passToUse);
      localStorage.removeItem('demo_mode');
      await syncAndRedirect(user.email!, user.displayName || undefined);
      return;
    } catch (err: any) {
      if (emailToUse === 'hocsinhdemo.bgk@gmail.com' || emailToUse === 'giaoviendemo.bgk@gmail.com') {
        const demoName = emailToUse.includes('giaovien') ? 'Giáo Viên Demo' : 'Học Sinh Demo';
        const demoRole = emailToUse.includes('giaovien') ? 'teacher' : 'student';
        localStorage.setItem('demo_mode', 'true');
        await syncAndRedirect(emailToUse, demoName, demoRole);
        return;
      }

      const map: Record<string, string> = {
        'auth/user-not-found': 'Email này chưa được đăng ký trong hệ thống!',
        'auth/wrong-password': 'Mật khẩu không chính xác. Vui lòng thử lại!',
        'auth/invalid-credential': 'Email hoặc mật khẩu không đúng!',
        'auth/too-many-requests': 'Tài khoản tạm thời bị khóa do thử quá nhiều lần. Vui lòng thử lại sau!',
      };
      setError(map[err.code] || 'Đăng nhập không thành công. Vui lòng kiểm tra lại kết nối!');
    } finally { 
      setLoading(false); 
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim()) { setError('Vui lòng nhập họ và tên của bạn!'); return; }
    if (!regEmail.trim()) { setError('Vui lòng nhập địa chỉ email!'); return; }
    if (regPass.length < 6) { setError('Mật khẩu tối thiểu phải từ 6 ký tự!'); return; }
    if (regPass !== regConfirm) { setError('Mật khẩu xác nhận không khớp!'); return; }
    
    setLoading(true); 
    setError('');
    
    try {
      const { user } = await createUserWithEmailAndPassword(auth, regEmail.trim(), regPass);
      await updateProfile(user, { displayName: regName.trim() });
      await syncAndRedirect(user.email!, regName.trim(), selectedRole, regSchool.trim() || undefined);
    } catch (err: any) {
      const map: Record<string, string> = {
        'auth/email-already-in-use': 'Email này đã tồn tại tài khoản. Vui lòng chuyển sang Đăng nhập!',
        'auth/invalid-email': 'Định dạng email không hợp lệ!',
        'auth/weak-password': 'Mật khẩu quá yếu! Hãy kết hợp thêm số hoặc chữ hoa.',
      };
      setError(map[err.code] || 'Đăng ký không thành công. Vui lòng thử lại!');
    } finally { 
      setLoading(false); 
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) { setError('Vui lòng nhập email tài khoản của bạn!'); return; }
    setLoading(true); 
    setError('');
    
    try {
      await sendPasswordResetEmail(auth, forgotEmail.trim());
      setSuccess(`Đã gửi liên kết đặt lại mật khẩu đến ${forgotEmail.trim()}. Bạn vui lòng kiểm tra hộp thư!`);
      setForgotEmail('');
    } catch (err: any) {
      setError(err.code === 'auth/user-not-found' ? 'Email này chưa từng đăng ký tài khoản!' : 'Không thể gửi email lúc này. Vui lòng thử lại sau!');
    } finally { 
      setLoading(false); 
    }
  };

  const handleGoogle = async () => {
    setLoading(true); 
    setError('');
    try {
      const { user } = await signInWithPopup(auth, googleProvider);
      await syncAndRedirect(user.email!, user.displayName || undefined);
    } catch (err: any) { 
      setError('Đăng nhập với Google bị gián đoạn!'); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="min-h-screen w-full relative font-sans text-slate-800 dark:text-slate-100 bg-[#f8fafc] dark:bg-[#0b0f19] flex flex-col justify-between selection:bg-blue-600 selection:text-white transition-colors duration-200 overflow-x-hidden">
      
      {/* ─── Minimal Geometric Background Pattern (No Lag, No Heavy Gradient) ─── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 opacity-40 dark:opacity-20">
        <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:20px_20px]" />
      </div>

      {/* ─── Top Navigation Bar ─────────────────────────────── */}
      <header className="relative z-10 w-full max-w-5xl mx-auto px-5 sm:px-8 py-4 shrink-0 flex items-center justify-between">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-heading font-bold text-xs sm:text-[13px] transition-colors py-1.5 px-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 shadow-2xs"
        >
          <ArrowLeft size={16} /> Trang chủ
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleDark}
            className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/90 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-2xs cursor-pointer"
            aria-label="Đổi giao diện sáng/tối"
          >
            {isDark ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} />}
          </button>
        </div>
      </header>

      {/* ─── Centered Luxury Auth Container (Flat & Solid Design) ─ */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 py-6 sm:py-8">
        <div className="w-full max-w-[440px] mx-auto">
          
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8 transition-all">
            
            {/* Header / Brand */}
            <div className="flex flex-col items-center text-center mb-6">
              <Link to="/" className="inline-flex items-center gap-2.5 mb-3 group">
                <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-2xl shadow-xs group-hover:bg-blue-700 transition-colors">
                  <span className="font-heading">∑</span>
                </div>
              </Link>
              
              <h1 className="text-2xl sm:text-[25px] font-black font-heading tracking-tight text-slate-900 dark:text-white leading-tight">
                FMATH<span className="text-blue-600 dark:text-blue-400">12</span>
              </h1>
              
              <p className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 font-sans mt-1">
                {tab === 'login' && 'Nền tảng Tự luyện & Đánh giá Năng lực Toán 12'}
                {tab === 'register' && 'Khởi tạo tài khoản cá nhân hóa cho học sinh & giáo viên'}
                {tab === 'forgot' && 'Khôi phục quyền truy cập tài khoản FMATH12'}
              </p>
            </div>

            {/* Segmented Control Tabs (Clean Flat) */}
            {tab !== 'forgot' && (
              <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-5">
                <button 
                  onClick={() => switchTab('login')}
                  className={`flex-1 py-2 rounded-lg font-bold font-heading text-xs sm:text-[13px] transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    tab === 'login' 
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-xs' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <LogIn size={14} /> Đăng nhập
                </button>
                <button 
                  onClick={() => switchTab('register')}
                  className={`flex-1 py-2 rounded-lg font-bold font-heading text-xs sm:text-[13px] transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    tab === 'register' 
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-xs' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <UserPlus size={14} /> Đăng ký
                </button>
              </div>
            )}

            {/* Forgot Password Header Nav */}
            {tab === 'forgot' && (
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                <button 
                  onClick={() => switchTab('login')} 
                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                  aria-label="Quay lại"
                >
                  <ChevronLeft size={17} />
                </button>
                <div>
                  <h3 className="text-sm font-bold font-heading text-slate-900 dark:text-white m-0">Đặt lại mật khẩu</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 m-0">Nhập email để nhận liên kết khôi phục</p>
                </div>
              </div>
            )}

            {/* Feedback Alerts */}
            {error && (
              <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle size={16} className="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <span className="text-rose-700 dark:text-rose-300 text-xs font-medium leading-relaxed">{error}</span>
              </div>
            )}
            
            {success && (
              <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-xl flex items-start gap-2.5 animate-in fade-in">
                <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-emerald-700 dark:text-emerald-300 text-xs font-medium leading-relaxed">{success}</span>
              </div>
            )}

            {/* ─── TAB 1: LOGIN ──────────────────────────────── */}
            {tab === 'login' && (
              <form onSubmit={handleLogin} className="space-y-3.5">
                
                {/* Google 1-Click Button */}
                <GoogleButton onClick={handleGoogle} loading={loading} />

                {/* Divider */}
                <div className="relative my-2 text-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                  </div>
                  <span className="relative bg-white dark:bg-slate-900 px-3 text-[10.5px] font-bold font-heading text-slate-400 uppercase tracking-wider">
                    Hoặc đăng nhập bằng email
                  </span>
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold font-heading text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Địa chỉ Email
                  </label>
                  <InputField 
                    icon={<Mail size={16} />} 
                    type="email" 
                    value={loginEmail}
                    onChange={setLoginEmail} 
                    placeholder="email@example.com" 
                    autoComplete="email" 
                  />
                </div>

                {/* Password */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold font-heading text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      Mật khẩu
                    </label>
                    <button 
                      type="button" 
                      onClick={() => switchTab('forgot')}
                      className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-bold font-heading cursor-pointer"
                    >
                      Quên mật khẩu?
                    </button>
                  </div>
                  <InputField 
                    icon={<Lock size={16} />}
                    type={showLoginPass ? 'text' : 'password'}
                    value={loginPass} 
                    onChange={setLoginPass}
                    placeholder="••••••••" 
                    autoComplete="current-password"
                    rightEl={
                      <button 
                        type="button" 
                        onClick={() => setShowLoginPass(!showLoginPass)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                      >
                        {showLoginPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    } 
                  />
                </div>

                {/* Submit Button (Solid Clean) */}
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold font-heading rounded-xl transition-all flex items-center justify-center gap-2 text-[13.5px] disabled:opacity-60 shadow-xs active:scale-[0.99] cursor-pointer mt-1"
                >
                  {loading ? <Loader2 size={17} className="animate-spin" /> : <LogIn size={17} />}
                  Đăng nhập vào hệ thống
                </button>

              </form>
            )}

            {/* ─── TAB 2: REGISTER ───────────────────────────── */}
            {tab === 'register' && (
              <form onSubmit={handleRegister} className="space-y-3">
                
                {/* Role Selector */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold font-heading text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Bạn tham gia với vai trò
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedRole('student')}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold font-heading flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        selectedRole === 'student'
                          ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-600 text-blue-700 dark:text-blue-300 shadow-2xs'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-750'
                      }`}
                    >
                      <GraduationCap size={15} /> Học sinh THPT
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedRole('teacher')}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold font-heading flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        selectedRole === 'teacher'
                          ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-600 text-blue-700 dark:text-blue-300 shadow-2xs'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-750'
                      }`}
                    >
                      <User size={15} /> Thầy cô / Giáo viên
                    </button>
                  </div>
                </div>

                {/* Full Name */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold font-heading text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Họ và tên
                  </label>
                  <InputField 
                    icon={<User size={16} />} 
                    type="text" 
                    value={regName}
                    onChange={setRegName} 
                    placeholder="VD: Nguyễn Hoàng Nam" 
                    autoComplete="name" 
                  />
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold font-heading text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Địa chỉ Email
                  </label>
                  <InputField 
                    icon={<Mail size={16} />} 
                    type="email" 
                    value={regEmail}
                    onChange={setRegEmail} 
                    placeholder="email@example.com" 
                    autoComplete="email" 
                  />
                </div>

                {/* School Name */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold font-heading text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      Trường THPT
                    </label>
                    <span className="text-[10px] text-slate-400 font-medium">Không bắt buộc</span>
                  </div>
                  <InputField 
                    icon={<School size={16} />} 
                    type="text" 
                    value={regSchool}
                    onChange={setRegSchool} 
                    placeholder="VD: THPT Chu Văn An, THPT FPT..." 
                  />
                </div>

                {/* Password */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold font-heading text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Mật khẩu
                  </label>
                  <InputField 
                    icon={<Lock size={16} />}
                    type={showRegPass ? 'text' : 'password'}
                    value={regPass} 
                    onChange={setRegPass}
                    placeholder="Tối thiểu 6 ký tự" 
                    autoComplete="new-password"
                    rightEl={
                      <button 
                        type="button" 
                        onClick={() => setShowRegPass(!showRegPass)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                      >
                        {showRegPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    } 
                  />

                  {/* Password Strength Bar */}
                  {regPass && (
                    <div className="pt-1 space-y-1">
                      <div className="flex gap-1.5">
                        {[1, 2, 3].map(i => (
                          <div 
                            key={i} 
                            className="flex-1 h-1.5 rounded-full transition-all duration-300"
                            style={{ 
                              backgroundColor: i <= strength.level ? strength.color : '#e2e8f0' 
                            }} 
                          />
                        ))}
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-bold font-heading">
                        <span style={{ color: strength.color }}>Độ mạnh: {strength.label}</span>
                        {strength.level < 3 && (
                          <span className="text-slate-400 font-normal">Nên thêm số & chữ hoa</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold font-heading text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Xác nhận mật khẩu
                  </label>
                  <InputField 
                    icon={<Lock size={16} />}
                    type="password" 
                    value={regConfirm} 
                    onChange={setRegConfirm}
                    placeholder="Nhập lại mật khẩu" 
                    autoComplete="new-password" 
                  />
                  {regConfirm && (
                    <p className={`text-[10.5px] font-bold flex items-center gap-1 mt-1 ${
                      regConfirm === regPass ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      {regConfirm === regPass
                        ? <><CheckCircle2 size={12} /> Mật khẩu khớp</>
                        : <><AlertCircle size={12} /> Mật khẩu chưa khớp</>}
                    </p>
                  )}
                </div>

                {/* Register Submit Button (Solid Clean) */}
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold font-heading rounded-xl transition-all flex items-center justify-center gap-2 text-[13.5px] disabled:opacity-60 shadow-xs active:scale-[0.99] cursor-pointer mt-2"
                >
                  {loading ? <Loader2 size={17} className="animate-spin" /> : <UserPlus size={17} />}
                  Tạo tài khoản FMATH12
                </button>

                <div className="relative my-2 text-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                  </div>
                  <span className="relative bg-white dark:bg-slate-900 px-3 text-[10.5px] font-bold font-heading text-slate-400 uppercase tracking-wider">
                    Hoặc đăng ký nhanh
                  </span>
                </div>

                <GoogleButton onClick={handleGoogle} loading={loading} />

              </form>
            )}

            {/* ─── TAB 3: FORGOT PASSWORD ────────────────────── */}
            {tab === 'forgot' && (
              <form onSubmit={handleForgot} className="space-y-3.5">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-sans leading-relaxed">
                  Nhập địa chỉ email bạn đã sử dụng để đăng ký. Hệ thống FMATH12 sẽ gửi liên kết an toàn để bạn tạo mật khẩu mới.
                </p>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold font-heading text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Email đã đăng ký
                  </label>
                  <InputField 
                    icon={<Mail size={16} />} 
                    type="email" 
                    value={forgotEmail}
                    onChange={setForgotEmail} 
                    placeholder="email@example.com" 
                    autoComplete="email" 
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold font-heading rounded-xl transition-all flex items-center justify-center gap-2 text-[13.5px] disabled:opacity-60 shadow-xs active:scale-[0.99] cursor-pointer"
                >
                  {loading ? <Loader2 size={17} className="animate-spin" /> : <RefreshCw size={17} />}
                  Gửi liên kết khôi phục
                </button>

                <button
                  type="button"
                  onClick={() => switchTab('login')}
                  className="w-full py-2 text-xs text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 font-bold font-heading text-center cursor-pointer"
                >
                  ← Trở về đăng nhập
                </button>
              </form>
            )}

            {/* Footer Terms */}
            <p className="text-[10.5px] text-slate-400 dark:text-slate-500 text-center mt-5 font-sans font-normal leading-relaxed">
              Bằng cách tiếp tục, bạn đồng ý với{' '}
              <span className="text-blue-600 dark:text-blue-400 cursor-pointer hover:underline">Điều khoản dịch vụ</span>
              {' '}và{' '}
              <span className="text-blue-600 dark:text-blue-400 cursor-pointer hover:underline">Chính sách bảo mật</span>
              {' '}của FMATH12 Platform.
            </p>

          </div>

        </div>
      </main>

      {/* ─── Page Footer ─────────────────────────────────────── */}
      <footer className="relative z-10 w-full max-w-5xl mx-auto px-5 sm:px-8 py-3 shrink-0 text-center text-xs text-slate-400 font-sans flex items-center justify-center">
        © 2026 FMATH12 Platform — Hệ sinh thái Học tập Thích ứng & Trí tuệ Toán học AI Toàn Quốc.
      </footer>

    </div>
  );
};

export default LoginPage;
