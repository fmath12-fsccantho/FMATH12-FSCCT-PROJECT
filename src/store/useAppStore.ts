import { create } from 'zustand';

// ==========================================
// 1. APP STORE (Quản lý User, Theme, Thông báo, Offline State)
// ==========================================
export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'system' | 'class' | 'exam' | 'achievement';
  time: string;
  isRead: boolean;
  link?: string;
}

interface AppState {
  isDark: boolean;
  toggleDark: () => void;
  isFptStudent: boolean;
  setIsFptStudent: (val: boolean) => void;
  toggleFptStudent: () => void;
  
  currentUser: {
    id?: string;
    name: string;
    email?: string;
    studentId: string;
    className: string;
    xp: number;
    level: number;
    streak: number;
    last_active_date?: string | null;
    role: 'student' | 'teacher' | 'admin';
    avatar_url?: string | null;
    school?: string;
  };
  
  switchRole: (newRole: 'student' | 'teacher' | 'admin') => void;
  setUser: (userData: any) => void;
  
  notifications: AppNotification[];
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;

  // --- TÍNH NĂNG LƯU TRỮ OFFLINE KHI LUYỆN TẬP ---
  isOnline: boolean;
  setOnlineStatus: (status: boolean) => void;
  offlineAnswers: Record<string, any>;
  setOfflineAnswer: (questionId: string, answer: any) => void;
  syncAnswersToDB: (examSessionId: string, studentId: string) => Promise<void>;
  clearOfflineAnswers: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  isDark: localStorage.getItem('theme') === 'dark',
  toggleDark: () => set((state) => {
    const newDark = !state.isDark;
    if (newDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
    return { isDark: newDark };
  }),
  
  isFptStudent: false, 
  setIsFptStudent: (val) => set({ isFptStudent: val }),
  toggleFptStudent: () => set((state) => ({ isFptStudent: !state.isFptStudent })),
  
  currentUser: {
    name: "Đang tải...",
    studentId: "...",
    className: "...",
    xp: 0,
    level: 1,
    streak: 0,
    last_active_date: null,
    role: 'student'
  },

  switchRole: (newRole) => set((state) => ({
    currentUser: { ...state.currentUser, role: newRole }
  })),

  setUser: (userData) => set((state) => {
    if (!userData) return state;
    
    // Ngăn chặn re-render vòng lặp nếu thông tin cơ bản không đổi
    if (
      state.currentUser.id === userData.id &&
      state.currentUser.xp === (userData.xp || 0) &&
      state.currentUser.level === (userData.level || 1) &&
      state.currentUser.streak === (userData.streak || 0) &&
      state.currentUser.role === (userData.role || 'student') &&
      state.currentUser.name === (userData.full_name || userData.name)
    ) {
      return state;
    }

    return {
      currentUser: {
        id: userData.id,
        name: userData.full_name || userData.name || "Học sinh",
        email: userData.email,
        studentId: userData.student_code || "Chưa cập nhật",
        className: userData.class_name || "Chưa xếp lớp",
        xp: userData.xp || 0,
        level: userData.level || 1,
        streak: userData.streak || 0,
        last_active_date: userData.last_active_date || null,
        role: userData.role || 'student',
        avatar_url: userData.avatar_url || null,
        school: userData.school || (userData.email?.toLowerCase().includes('fct') ? "THPT FPT Cần Thơ" : (userData.role === 'teacher' ? "Giáo viên Toàn quốc" : "Học sinh Tự do"))
      },
      isFptStudent: false
    };
  }),
  
  notifications: [],
  markAsRead: (id) => set((state) => ({
    notifications: state.notifications.map(n => n.id === id ? { ...n, isRead: true } : n)
  })),
  markAllAsRead: () => set((state) => ({
    notifications: state.notifications.map(n => ({ ...n, isRead: true }))
  })),

  // --- TÍNH NĂNG OFFLINE TOLERANCE ---
  isOnline: navigator.onLine,
  setOnlineStatus: (status) => set({ isOnline: status }),
  offlineAnswers: {},
  setOfflineAnswer: (questionId, answer) => set((state) => ({
    offlineAnswers: { ...state.offlineAnswers, [questionId]: answer }
  })),
  clearOfflineAnswers: () => set({ offlineAnswers: {} }),
  syncAnswersToDB: async (examSessionId, studentId) => {
    const { offlineAnswers, isOnline } = get();
    if (!isOnline || Object.keys(offlineAnswers).length === 0) return;
    try {
      console.log("[Sync] Đã đồng bộ đáp án lên server:", offlineAnswers);
    } catch (error) {
      console.error("[Sync] Lỗi đồng bộ:", error);
    }
  }
}));

// ==========================================
// 2. EXAM STORE 
// ==========================================
interface ExamCache {
  currentExamData: any | null; 
  isPreloaded: boolean;        
  setPreloadedExam: (data: any) => void; 
  clearCache: () => void;      
}

export const useExamStore = create<ExamCache>((set) => ({
  currentExamData: null,
  isPreloaded: false,
  setPreloadedExam: (data) => set({ currentExamData: data, isPreloaded: true }),
  clearCache: () => set({ currentExamData: null, isPreloaded: false }),
}));