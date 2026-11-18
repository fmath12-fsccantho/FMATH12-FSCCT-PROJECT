import React, { useState, useEffect } from 'react';
import { 
  Database, Users, BookOpen, Award, CheckCircle2, AlertCircle, 
  Loader2, Sparkles, RefreshCcw, Shield, Plus, Trash2, 
  TrendingUp, Clock, GraduationCap, School, Layers, Check,
  ChevronRight, ArrowRight, Zap, Filter, Eye, Lock
} from 'lucide-react';
import { supabase } from '../../config/supabase';
import ManagementHeader from '../../components/common/ManagementHeader';

// ─── Danh sách tên họ tiếng Việt chân thực ──────────────────────────
const VIET_LAST_NAMES = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý'];
const VIET_MIDDLE_BOY = ['Văn', 'Hữu', 'Minh', 'Đức', 'Quốc', 'Thành', 'Tuấn', 'Gia', 'Bảo', 'Hoàng', 'Trọng', 'Phước'];
const VIET_MIDDLE_GIRL = ['Thị', 'Ngọc', 'Thảo', 'Phương', 'Mai', 'Thanh', 'Quỳnh', 'Khánh', 'Tuyết', 'Như', 'Hải', 'Ánh'];
const VIET_FIRST_BOY = ['Nam', 'Hùng', 'Dũng', 'Phong', 'Quân', 'Khôi', 'Khoa', 'Khang', 'Thịnh', 'Phát', 'Huy', 'Kiệt', 'Long', 'Tài', 'Triết', 'Lâm'];
const VIET_FIRST_GIRL = ['Anh', 'Vy', 'Linh', 'Trang', 'Hương', 'Nhi', 'Hân', 'Châu', 'Yến', 'Trâm', 'Ngân', 'Chi', 'Tú', 'Quyên', 'Thư', 'Diệp'];

const SCHOOL_OPTIONS = [
  { id: 'THPT FPT Cần Thơ', name: 'THPT FPT Cần Thơ', isFpt: true },
  { id: 'THPT FPT Đà Nẵng', name: 'THPT FPT Đà Nẵng', isFpt: true },
  { id: 'THPT FPT Hà Nội', name: 'THPT FPT Hà Nội', isFpt: true },
  { id: 'THPT Chuyên Lý Tự Trọng', name: 'THPT Chuyên Lý Tự Trọng (Cần Thơ)', isFpt: false },
  { id: 'THPT Chuyên Chu Văn An', name: 'THPT Chuyên Chu Văn An (Hà Nội)', isFpt: false },
  { id: 'THPT Chuyên Lê Hồng Phong', name: 'THPT Chuyên Lê Hồng Phong (TP.HCM)', isFpt: false },
  { id: 'THPT Phan Châu Trinh', name: 'THPT Phan Châu Trinh (Đà Nẵng)', isFpt: false },
  { id: 'THPT Marie Curie', name: 'THPT Marie Curie', isFpt: false },
];

const removeAccents = (str: string) => {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().replace(/\s+/g, '');
};

const DataSeeder = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'classes' | 'attempts'>('users');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ─── Real DB State for selections ─────────────────────────────
  const [dbStudents, setDbStudents] = useState<any[]>([]);
  const [dbTeachers, setDbTeachers] = useState<any[]>([]);
  const [dbExams, setDbExams] = useState<any[]>([]);
  const [dbClasses, setDbClasses] = useState<any[]>([]);
  const [classFilter, setClassFilter] = useState<'all' | 'fpt' | 'nationwide'>('all');

  // ─── TAB 1: BƠM TÀI KHOẢN (ACCOUNTS SEEDER) ───────────────────
  const [accRole, setAccRole] = useState<'student' | 'teacher'>('student');
  const [accSchool, setAccSchool] = useState<string>('THPT FPT Cần Thơ');
  const [accCount, setAccCount] = useState<number>(10);
  const [previewUsers, setPreviewUsers] = useState<any[]>([]);

  // ─── TAB 2: BƠM LỚP HỌC (CLASS SEEDER) ────────────────────────
  const [classScope, setClassScope] = useState<'fpt' | 'nationwide'>('fpt');
  const [classGrade, setClassGrade] = useState<'10' | '11' | '12'>('12');
  const [classTeacherId, setClassTeacherId] = useState<string>('');
  const [classCustomName, setClassCustomName] = useState<string>('');
  const [classBatchStream, setClassBatchStream] = useState<'single' | 'bundle'>('bundle');

  // ─── TAB 3: BƠM LƯỢT NỘP BÀI (ATTEMPT SEEDER) ─────────────────
  const [attemptExamId, setAttemptExamId] = useState<string>('all');
  const [attemptCount, setAttemptCount] = useState<number>(20);
  const [attemptScoreRange, setAttemptScoreRange] = useState<'high' | 'medium' | 'excellent' | 'mixed'>('high');
  const [attemptDateRange, setAttemptDateRange] = useState<'today' | 'week'>('week');
  const [recentBuffLogs, setRecentBuffLogs] = useState<any[]>([]);

  // ─── Load Live DB Data ────────────────────────────────────────
  const loadDatabaseContext = async () => {
    try {
      // 1. Get Students
      const { data: students } = await supabase
        .from('users')
        .select('id, full_name, email, school, class_name, xp')
        .eq('role', 'student')
        .order('created_at', { ascending: false });
      if (students) setDbStudents(students);

      // 2. Get Teachers
      const { data: teachers } = await supabase
        .from('users')
        .select('id, full_name, email, school')
        .in('role', ['teacher', 'admin'])
        .order('created_at', { ascending: false });
      if (teachers) {
        setDbTeachers(teachers);
        if (teachers.length > 0 && !classTeacherId) {
          setClassTeacherId(teachers[0].id);
        }
      }

      // 3. Get Exams
      const { data: exams } = await supabase
        .from('exams')
        .select('id, title, type, time_limit')
        .order('created_at', { ascending: false });
      if (exams) setDbExams(exams);

      // 4. Get Classes
      const { data: classes } = await supabase
        .from('classes')
        .select('id, name, code, join_code, teacher_id, type, school_year, created_at')
        .order('created_at', { ascending: false });
      if (classes) setDbClasses(classes);

    } catch (err: any) {
      console.error("Lỗi tải context DB:", err);
    }
  };

  useEffect(() => {
    loadDatabaseContext();
  }, []);

  // ─── Helper: Sinh tên học sinh ngẫu nhiên ──────────────────────
  const generateRandomFullName = () => {
    const isBoy = Math.random() > 0.48;
    const lastName = VIET_LAST_NAMES[Math.floor(Math.random() * VIET_LAST_NAMES.length)];
    const middleName = isBoy 
      ? VIET_MIDDLE_BOY[Math.floor(Math.random() * VIET_MIDDLE_BOY.length)]
      : VIET_MIDDLE_GIRL[Math.floor(Math.random() * VIET_MIDDLE_GIRL.length)];
    const firstName = isBoy
      ? VIET_FIRST_BOY[Math.floor(Math.random() * VIET_FIRST_BOY.length)]
      : VIET_FIRST_GIRL[Math.floor(Math.random() * VIET_FIRST_GIRL.length)];

    return `${lastName} ${middleName} ${firstName}`;
  };

  // ─── Generator: Tạo danh sách User Xem trước ──────────────────
  const generateUsersPreview = (count: number, role: 'student' | 'teacher', school: string) => {
    const isFpt = school.toLowerCase().includes('fpt');
    const list: any[] = [];
    const usedEmails = new Set<string>();

    const streamClasses = ['12T1', '12T2', '12T3', '12X1', '12X2', '12X3', '12K'];

    for (let i = 0; i < count; i++) {
      const fullName = generateRandomFullName();
      const rawName = removeAccents(fullName);
      const randNum = Math.floor(1000 + Math.random() * 9000);
      
      let email = '';
      if (role === 'teacher') {
        email = isFpt 
          ? `${rawName.substring(0, 10)}${Math.floor(10 + Math.random() * 90)}@fpt.edu.vn`
          : `gv.${rawName.substring(0, 10)}${randNum}@gmail.com`;
      } else {
        email = isFpt 
          ? `${rawName.substring(0, 8)}fs${randNum}@fe.edu.vn`
          : `${rawName.substring(0, 8)}${randNum}@gmail.com`;
      }

      if (usedEmails.has(email)) {
        email = `${email.split('@')[0]}${i}@${email.split('@')[1]}`;
      }
      usedEmails.add(email);

      const assignedClass = streamClasses[Math.floor(Math.random() * streamClasses.length)];
      const studentCode = isFpt ? `FS12${randNum}` : `CT12${randNum}`;
      const level = Math.floor(2 + Math.random() * 10);
      const xp = level * 180 + Math.floor(Math.random() * 120);
      const streak = Math.floor(1 + Math.random() * 22);

      const avatarSeed = encodeURIComponent(fullName);
      const avatarUrl = `https://api.dicebear.com/7.x/notionists/svg?seed=${avatarSeed}&backgroundColor=e2e8f0,fed7aa,fef08a,d9f99d,c7d2fe`;

      list.push({
        id: crypto.randomUUID(),
        email,
        full_name: fullName,
        role,
        school,
        class_name: role === 'student' ? assignedClass : null,
        student_code: role === 'student' ? studentCode : null,
        xp,
        level,
        streak,
        avatar_url: avatarUrl,
        is_fscct: isFpt,
        status: 'active',
        created_at: new Date(Date.now() - Math.floor(Math.random() * 15 * 86400000)).toISOString()
      });
    }

    setPreviewUsers(list);
  };

  useEffect(() => {
    generateUsersPreview(accCount, accRole, accSchool);
  }, [accCount, accRole, accSchool]);

  // ─── ACTION 1: BƠM TÀI KHOẢN VÀO SUPABASE ────────────────────
  const handleExecuteBuffUsers = async () => {
    if (previewUsers.length === 0) return;
    setIsProcessing(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const { error } = await supabase.from('users').insert(previewUsers);
      if (error) throw error;

      setSuccessMsg(`Đã bơm thành công ${previewUsers.length} tài khoản (${accRole === 'student' ? 'Học sinh' : 'Giáo viên'}) vào cơ sở dữ liệu Supabase!`);
      // Reload context & generate next preview batch
      await loadDatabaseContext();
      generateUsersPreview(accCount, accRole, accSchool);
    } catch (err: any) {
      setErrorMsg(`Lỗi khi bơm tài khoản: ${err.message || 'Không thể ghi vào Supabase'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // ─── ACTION 2: BƠM LỚP HỌC (FPT NỘI BỘ HOẶC TOÀN QUỐC) ────────
  const handleExecuteBuffClasses = async () => {
    setIsProcessing(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const selectedTeacher = dbTeachers.find(t => t.id === classTeacherId) || dbTeachers[0];
      const teacherId = selectedTeacher?.id || 'admin';
      const isFpt = classScope === 'fpt';
      const classType = isFpt ? 'fpt' : 'regular'; // or nationwide

      const newClassesToInsert: any[] = [];

      if (classBatchStream === 'bundle') {
        // Tạo trọn bộ lớp tổ hợp: T (Toán-Tin), X (KHTN), K (KHXH)
        const templates = isFpt ? [
          { name: `${classGrade}T1 - Chuyên Toán Tin FPT`, type: 'fpt' },
          { name: `${classGrade}T2 - Công Nghệ & AI FPT`, type: 'fpt' },
          { name: `${classGrade}X1 - KHTN Y Dược FPT`, type: 'fpt' },
          { name: `${classGrade}X2 - Kỹ Thuật Vi Mạch FPT`, type: 'fpt' },
          { name: `${classGrade}K1 - Kinh Tế Số & Ngoại Ngữ FPT`, type: 'fpt' },
        ] : [
          { name: `${classGrade}A1 - THPT Chuyên Quốc Gia`, type: 'regular' },
          { name: `${classGrade}A2 - Luyện Thi Đại Học Toán 12`, type: 'regular' },
          { name: `${classGrade}B1 - Tổ Hợp KHTN Toàn Quốc`, type: 'regular' },
          { name: `${classGrade}D1 - Tổ Hợp D01 & Đánh Giá Năng Lực`, type: 'regular' },
        ];

        let baseSort = dbClasses.length + 1;
        for (const item of templates) {
          const code = Math.random().toString(36).substring(2, 8).toUpperCase();
          newClassesToInsert.push({
            id: crypto.randomUUID(),
            name: item.name,
            code,
            join_code: code,
            teacher_id: teacherId,
            school_year: '2026-2027',
            sort_order: baseSort++,
            type: item.type,
            created_at: new Date().toISOString()
          });
        }
      } else {
        // Tạo 1 lớp tùy chỉnh
        const finalName = classCustomName.trim() || (isFpt ? `${classGrade}T1 - THPT FPT Cần Thơ` : `${classGrade}A1 - Toàn Quốc`);
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        newClassesToInsert.push({
          id: crypto.randomUUID(),
          name: finalName,
          code,
          join_code: code,
          teacher_id: teacherId,
          school_year: '2026-2027',
          sort_order: dbClasses.length + 1,
          type: classType,
          created_at: new Date().toISOString()
        });
      }

      const { error } = await supabase.from('classes').insert(newClassesToInsert);
      if (error) throw error;

      setSuccessMsg(`Đã tạo và kích hoạt thành công ${newClassesToInsert.length} lớp học (${isFpt ? 'Nội bộ FPT' : 'Toàn quốc'}) trên hệ thống!`);
      setClassCustomName('');
      await loadDatabaseContext();
    } catch (err: any) {
      setErrorMsg(`Lỗi khi tạo lớp học: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // ─── ACTION 3: BƠM LƯỢT NỘP BÀI TỪ DỮ LIỆU THỰC TRONG DB ──────
  const handleExecuteBuffAttempts = async () => {
    if (dbStudents.length === 0) {
      setErrorMsg("Chưa có học sinh nào trong cơ sở dữ liệu để gán lượt nộp bài. Vui lòng bơm tài khoản học sinh trước!");
      return;
    }
    if (dbExams.length === 0) {
      setErrorMsg("Chưa có bài thi/đề thi nào trong cơ sở dữ liệu.");
      return;
    }

    setIsProcessing(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const attemptsToInsert: any[] = [];
      const logItems: any[] = [];

      // Chọn tập đề thi
      const targetExams = attemptExamId === 'all' 
        ? dbExams 
        : dbExams.filter(e => e.id === attemptExamId);

      for (let i = 0; i < attemptCount; i++) {
        // Pick ngẫu nhiên 1 học sinh thực từ DB
        const student = dbStudents[Math.floor(Math.random() * dbStudents.length)];
        // Pick ngẫu nhiên 1 đề thi từ targetExams
        const exam = targetExams[Math.floor(Math.random() * targetExams.length)];

        // Tính điểm chân thực theo dải cấu hình
        let score = 8.0;
        if (attemptScoreRange === 'excellent') {
          score = Number((9.0 + Math.random() * 1.0).toFixed(2));
        } else if (attemptScoreRange === 'high') {
          score = Number((7.8 + Math.random() * 1.8).toFixed(2));
        } else if (attemptScoreRange === 'medium') {
          score = Number((6.0 + Math.random() * 2.0).toFixed(2));
        } else {
          score = Number((6.2 + Math.random() * 3.6).toFixed(2));
        }
        if (score > 10) score = 10;

        // Thời gian làm bài (giây): 15 phút đến 85 phút
        const timeLimitMinutes = exam.time_limit || 90;
        const durationSec = Math.floor((timeLimitMinutes * 0.4 + Math.random() * (timeLimitMinutes * 0.5)) * 60);

        // Ngày nộp bài chân thực
        const now = Date.now();
        const daysBack = attemptDateRange === 'today' ? 0.3 : 7;
        const submittedAt = new Date(now - Math.floor(Math.random() * daysBack * 86400000)).toISOString();

        attemptsToInsert.push({
          id: crypto.randomUUID(),
          exam_id: exam.id,
          user_id: student.id,
          score,
          time_spent: durationSec,
          created_at: submittedAt
        });

        logItems.push({
          studentName: student.full_name,
          studentSchool: student.school || 'THPT',
          examTitle: exam.title,
          score,
          duration: `${Math.round(durationSec / 60)} phút`,
          time: new Date(submittedAt).toLocaleString('vi-VN')
        });
      }

      const { error } = await supabase.from('exam_attempts').insert(attemptsToInsert);
      if (error) throw error;

      setSuccessMsg(`Đã bơm thành công ${attemptsToInsert.length} lượt nộp bài từ ${dbStudents.length} học sinh thực tế vào cơ sở dữ liệu Supabase!`);
      setRecentBuffLogs(logItems.slice(0, 10));
    } catch (err: any) {
      setErrorMsg(`Lỗi khi bơm lượt nộp: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Filtered classes for Tab 2
  const filteredClasses = dbClasses.filter(c => {
    const isFpt = c.type === 'fpt' || c.name.toLowerCase().includes('fpt') || c.name.toLowerCase().includes('fscct');
    if (classFilter === 'fpt') return isFpt;
    if (classFilter === 'nationwide') return !isFpt;
    return true;
  });

  return (
    <div className="space-y-6 pb-20 animate-in fade-in max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <ManagementHeader 
        icon={<Database className="text-amber-500" size={24} />}
        title="Trung Tâm Bơm Dữ Liệu & Khảo Thí (Data Seeder)"
        subtitle="Công cụ mô phỏng dữ liệu lớn chuẩn GDPT 2018: Bơm tài khoản, quản lý lớp FPT / Toàn quốc và buff lượt nộp bài thi vào Supabase."
      />

      {/* Alert Notices */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3 text-emerald-800 dark:text-emerald-200 text-sm font-medium animate-in fade-in">
          <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center gap-3 text-rose-800 dark:text-rose-200 text-sm font-medium animate-in fade-in">
          <AlertCircle size={18} className="text-rose-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Top Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="flat-card p-4 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
            <Users size={20} />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 font-heading uppercase tracking-wider">Học sinh trong DB</div>
            <div className="text-xl font-black text-slate-900 dark:text-white font-heading">{dbStudents.length}</div>
          </div>
        </div>

        <div className="flat-card p-4 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
            <GraduationCap size={20} />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 font-heading uppercase tracking-wider">Giáo viên & Admin</div>
            <div className="text-xl font-black text-slate-900 dark:text-white font-heading">{dbTeachers.length}</div>
          </div>
        </div>

        <div className="flat-card p-4 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <School size={20} />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 font-heading uppercase tracking-wider">Lớp học hiện có</div>
            <div className="text-xl font-black text-slate-900 dark:text-white font-heading">{dbClasses.length}</div>
          </div>
        </div>

        <div className="flat-card p-4 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
            <Award size={20} />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 font-heading uppercase tracking-wider">Đề thi sẵn sàng</div>
            <div className="text-xl font-black text-slate-900 dark:text-white font-heading">{dbExams.length}</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700/80 max-w-2xl">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold font-heading transition-all ${
            activeTab === 'users'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Users size={16} /> Bơm Tài Khoản
        </button>

        <button
          onClick={() => setActiveTab('classes')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold font-heading transition-all ${
            activeTab === 'classes'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <School size={16} /> Bơm & Quản Lý Lớp Học
        </button>

        <button
          onClick={() => setActiveTab('attempts')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold font-heading transition-all ${
            activeTab === 'attempts'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Award size={16} /> Bơm Lượt Nộp Bài
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: BƠM TÀI KHOẢN (ACCOUNTS SEEDER)                                    */}
      {/* ========================================================================= */}
      {activeTab === 'users' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in">
          {/* Controls Panel */}
          <div className="lg:col-span-5 space-y-5">
            <div className="flat-card p-6 space-y-4">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold font-heading">
                <Sparkles size={18} className="text-amber-500" />
                <span>Cấu Hình Sinh Tài Khoản Tự Động</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tự động tạo các tài khoản học sinh/giáo viên Việt Nam với email, họ tên, XP, Level, chuỗi ngày streak và ảnh đại diện hoạt hình đẹp mắt.
              </p>

              {/* Role Selection */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-heading">
                  Loại Tài Khoản
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAccRole('student')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      accRole === 'student'
                        ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    👨‍🎓 Học Sinh (Student)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccRole('teacher')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      accRole === 'teacher'
                        ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    👩‍🏫 Giáo Viên (Teacher)
                  </button>
                </div>
              </div>

              {/* School Selection */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-heading">
                  Trường Học & Đơn Vị Trực Thuộc
                </label>
                <select
                  value={accSchool}
                  onChange={(e) => setAccSchool(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-white focus:outline-none focus:border-blue-500"
                >
                  {SCHOOL_OPTIONS.map((sch) => (
                    <option key={sch.id} value={sch.id}>
                      {sch.isFpt ? `🏢 [FPT Edu] ${sch.name}` : `🌐 [Toàn quốc] ${sch.name}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Count Selector */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-heading">
                    Số Lượng Tài Khoản Cần Bơm
                  </label>
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400 font-mono">
                    {accCount} tài khoản
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {[5, 10, 20, 50].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setAccCount(num)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold font-mono transition-all border ${
                        accCount === num
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      +{num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-2">
                <button
                  onClick={handleExecuteBuffUsers}
                  disabled={isProcessing || previewUsers.length === 0}
                  className="w-full h-11 bg-gradient-to-r from-blue-600 via-sky-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold font-heading rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider disabled:opacity-50 cursor-pointer"
                >
                  {isProcessing ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Zap size={16} />
                  )}
                  Bơm Ngay {previewUsers.length} Tài Khoản Vào Supabase
                </button>

                <button
                  type="button"
                  onClick={() => generateUsersPreview(accCount, accRole, accSchool)}
                  className="w-full py-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center justify-center gap-1.5"
                >
                  <RefreshCcw size={13} /> Tạo lại mẫu ngẫu nhiên khác
                </button>
              </div>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="lg:col-span-7">
            <div className="flat-card overflow-hidden flex flex-col h-[560px]">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-850/50">
                <div className="flex items-center gap-2">
                  <Eye size={16} className="text-blue-500" />
                  <span className="text-xs font-bold text-slate-800 dark:text-white font-heading uppercase tracking-wider">
                    Danh Sách Mẫu Sắp Được Ghi Vào Database ({previewUsers.length})
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">Status: Ready to insert</span>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                {previewUsers.map((u, idx) => (
                  <div 
                    key={u.id}
                    className="p-3 rounded-xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400 font-mono font-bold text-[10px] w-4">{idx + 1}</span>
                      <img 
                        src={u.avatar_url} 
                        alt={u.full_name} 
                        className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-100" 
                      />
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          {u.full_name}
                          {u.is_fscct && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                              FPT
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-bold text-blue-600 dark:text-blue-400 font-mono">
                        {u.class_name ? `Lớp ${u.class_name}` : u.school}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Cấp {u.level} • {u.xp} XP • {u.streak} ngày streak
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: BƠM & QUẢN LÝ LỚP HỌC (FPT NỘI BỘ VS TOÀN QUỐC)                   */}
      {/* ========================================================================= */}
      {activeTab === 'classes' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in">
          {/* Create / Seeder Class Form */}
          <div className="lg:col-span-5 space-y-5">
            <div className="flat-card p-6 space-y-4">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold font-heading">
                <School size={18} className="text-emerald-500" />
                <span>Bơm Phiên Lớp Học Chuẩn GDPT 2018</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Phân loại rành mạch giữa <strong>Lớp học nội bộ FPT</strong> (dành cho học sinh khối FPT Edu) và <strong>Lớp học toàn quốc</strong> (học sinh các trường THPT cả nước).
              </p>

              {/* Scope Selection */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-heading">
                  Phân Hệ Quản Lý Lớp Học
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setClassScope('fpt')}
                    className={`p-3 rounded-xl text-left border transition-all ${
                      classScope === 'fpt'
                        ? 'bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-800 ring-2 ring-amber-500/20'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center gap-1.5">
                      🏢 Lớp Nội Bộ FPT
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      THPT FPT Cần Thơ & FE Edu
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setClassScope('nationwide')}
                    className={`p-3 rounded-xl text-left border transition-all ${
                      classScope === 'nationwide'
                        ? 'bg-blue-50 text-blue-900 border-blue-300 dark:bg-blue-950/60 dark:text-blue-200 dark:border-blue-800 ring-2 ring-blue-500/20'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center gap-1.5">
                      🌐 Lớp Toàn Quốc
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Trường THPT cả nước
                    </div>
                  </button>
                </div>
              </div>

              {/* Grade Selection */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-heading">
                  Khối Lớp
                </label>
                <div className="flex gap-2">
                  {(['10', '11', '12'] as const).map(g => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setClassGrade(g)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold font-mono border transition-all ${
                        classGrade === g
                          ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      Khối {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mode Selection */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-heading">
                  Phương thức sinh lớp
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setClassBatchStream('bundle')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                      classBatchStream === 'bundle'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    ⚡ Trọn Bộ Tổ Hợp (4-5 Lớp)
                  </button>
                  <button
                    type="button"
                    onClick={() => setClassBatchStream('single')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                      classBatchStream === 'single'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    ✏️ Tùy Chỉnh 1 Lớp
                  </button>
                </div>
              </div>

              {/* Custom Class Name if single */}
              {classBatchStream === 'single' && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-heading">
                    Tên Lớp Học Tùy Chỉnh
                  </label>
                  <input
                    type="text"
                    value={classCustomName}
                    onChange={(e) => setClassCustomName(e.target.value)}
                    placeholder="VD: 12T1 - Chuyên Toán Tin FPT"
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}

              {/* Teacher Assignment */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-heading">
                  Giáo Viên Phụ Trách Lớp
                </label>
                <select
                  value={classTeacherId}
                  onChange={(e) => setClassTeacherId(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-white focus:outline-none focus:border-blue-500"
                >
                  {dbTeachers.length === 0 ? (
                    <option value="admin">Quản Trị Viên (Admin)</option>
                  ) : (
                    dbTeachers.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.full_name} ({t.school || 'Giáo viên'})
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Action Button */}
              <button
                onClick={handleExecuteBuffClasses}
                disabled={isProcessing}
                className="w-full h-11 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold font-heading rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider disabled:opacity-50 cursor-pointer"
              >
                {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                Tạo Và Bơm Lớp Vào Cơ Sở Dữ Liệu
              </button>
            </div>
          </div>

          {/* Classes Table with Privacy notice */}
          <div className="lg:col-span-7">
            <div className="flat-card overflow-hidden flex flex-col h-[560px]">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap justify-between items-center gap-2 bg-slate-50/50 dark:bg-slate-850/50">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800 dark:text-white font-heading uppercase tracking-wider">
                    Danh Sách Lớp ({filteredClasses.length})
                  </span>
                </div>

                {/* Filter Scope */}
                <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => setClassFilter('all')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                      classFilter === 'all' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'text-slate-500'
                    }`}
                  >
                    Tất cả
                  </button>
                  <button
                    onClick={() => setClassFilter('fpt')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                      classFilter === 'fpt' ? 'bg-amber-500 text-white' : 'text-slate-500'
                    }`}
                  >
                    Nội bộ FPT
                  </button>
                  <button
                    onClick={() => setClassFilter('nationwide')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                      classFilter === 'nationwide' ? 'bg-blue-600 text-white' : 'text-slate-500'
                    }`}
                  >
                    Toàn quốc
                  </button>
                </div>
              </div>

              {/* Privacy Notice Banner for Admin */}
              <div className="px-4 py-2 bg-amber-50/70 dark:bg-amber-950/30 border-b border-amber-200/50 dark:border-amber-900/40 flex items-center gap-2 text-[11.5px] text-amber-800 dark:text-amber-300 font-medium">
                <Lock size={13} className="shrink-0 text-amber-600" />
                <span>
                  <strong>Quy định bảo mật:</strong> Quản trị viên (Admin) không được phép truy cập số lượng và danh sách học sinh bên trong lớp học.
                </span>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                {filteredClasses.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    Chưa có lớp học nào phù hợp với bộ lọc.
                  </div>
                ) : (
                  filteredClasses.map((cls) => {
                    const isFpt = cls.type === 'fpt' || cls.name.toLowerCase().includes('fpt') || cls.name.toLowerCase().includes('fscct');
                    return (
                      <div 
                        key={cls.id}
                        className="p-3.5 rounded-xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 text-xs hover:border-slate-300 transition-colors"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-white font-heading text-sm">
                              {cls.name}
                            </span>
                            {isFpt ? (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold font-mono bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                🏢 Nội bộ FPT
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold font-mono bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                🌐 Toàn quốc
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                            <span>Mã lớp: <strong className="font-mono text-primary">{cls.join_code}</strong></span>
                            <span>•</span>
                            <span>Niên khóa: {cls.school_year || '2026-2027'}</span>
                          </div>
                        </div>

                        {/* Privacy protected student count */}
                        <div className="text-right">
                          <span 
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700 select-none cursor-help"
                            title="Chính sách bảo mật: Admin không có quyền truy cập sĩ số học sinh nội bộ"
                          >
                            <Lock size={11} className="text-amber-500" /> Sĩ số: •••
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: BƠM LƯỢT NỘP BÀI THI THẬT (EXAM ATTEMPTS BUFF)                     */}
      {/* ========================================================================= */}
      {activeTab === 'attempts' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in">
          {/* Buff Controls */}
          <div className="lg:col-span-5 space-y-5">
            <div className="flat-card p-6 space-y-4">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold font-heading">
                <Award size={18} className="text-purple-500" />
                <span>Bơm Lượt Nộp Bài Dựa Trên DB Thực Tế</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Hệ thống tự động đọc danh sách <strong>học sinh có thực</strong> và <strong>đề thi có thực</strong> trong Supabase, sau đó mô phỏng lịch sử làm bài thi với điểm số, thời gian làm bài chân thực.
              </p>

              {/* Target Exam */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-heading">
                  Bài Thi Cần Bơm Lượt Làm
                </label>
                <select
                  value={attemptExamId}
                  onChange={(e) => setAttemptExamId(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="all">🎯 Tất Cả Bài Thi (Phân bổ ngẫu nhiên)</option>
                  {dbExams.map(ex => (
                    <option key={ex.id} value={ex.id}>
                      {ex.title} ({ex.time_limit || 90} phút)
                    </option>
                  ))}
                </select>
              </div>

              {/* Score Profile */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-heading">
                  Phổ Điểm Khảo Thí
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAttemptScoreRange('high')}
                    className={`p-2.5 rounded-xl text-xs font-bold text-left border transition-all ${
                      attemptScoreRange === 'high'
                        ? 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-300'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <div>Khá - Giỏi</div>
                    <div className="text-[10px] font-mono text-slate-400">7.8 - 9.6 điểm</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAttemptScoreRange('excellent')}
                    className={`p-2.5 rounded-xl text-xs font-bold text-left border transition-all ${
                      attemptScoreRange === 'excellent'
                        ? 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <div>Thủ Khoa / Xuất Sắc</div>
                    <div className="text-[10px] font-mono text-slate-400">9.0 - 10.0 điểm</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAttemptScoreRange('medium')}
                    className={`p-2.5 rounded-xl text-xs font-bold text-left border transition-all ${
                      attemptScoreRange === 'medium'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <div>Trung Bình - Khá</div>
                    <div className="text-[10px] font-mono text-slate-400">6.0 - 8.0 điểm</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAttemptScoreRange('mixed')}
                    className={`p-2.5 rounded-xl text-xs font-bold text-left border transition-all ${
                      attemptScoreRange === 'mixed'
                        ? 'bg-purple-50 text-purple-700 border-purple-300 dark:bg-purple-950 dark:text-purple-300'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <div>Phân Phối Chuẩn</div>
                    <div className="text-[10px] font-mono text-slate-400">6.2 - 9.8 điểm</div>
                  </button>
                </div>
              </div>

              {/* Count */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-heading">
                    Số Lượng Lượt Nộp Cần Bơm
                  </label>
                  <span className="text-xs font-bold text-purple-600 dark:text-purple-400 font-mono">
                    {attemptCount} lượt
                  </span>
                </div>
                <div className="flex gap-2">
                  {[10, 20, 50, 100].map(cnt => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setAttemptCount(cnt)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold font-mono border transition-all ${
                        attemptCount === cnt
                          ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      +{cnt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date distribution */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-heading">
                  Thời Gian Phân Bổ
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setAttemptDateRange('today')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      attemptDateRange === 'today'
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    Hôm nay (Vài giờ trước)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAttemptDateRange('week')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      attemptDateRange === 'week'
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    Rải đều 7 ngày qua
                  </button>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={handleExecuteBuffAttempts}
                disabled={isProcessing || dbStudents.length === 0}
                className="w-full h-11 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold font-heading rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider disabled:opacity-50 cursor-pointer"
              >
                {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                Ghi {attemptCount} Lượt Nộp Vào Database
              </button>
            </div>
          </div>

          {/* Buff Logs / Live attempts */}
          <div className="lg:col-span-7">
            <div className="flat-card overflow-hidden flex flex-col h-[560px]">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-850/50">
                <div className="flex items-center gap-2">
                  <TrendingUp size={16} className="text-purple-500" />
                  <span className="text-xs font-bold text-slate-800 dark:text-white font-heading uppercase tracking-wider">
                    Nhật Ký Lượt Nộp Vừa Bơm Vào Database
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">Realtime Supabase Insert</span>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                {recentBuffLogs.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
                    <Award size={36} className="text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="text-xs font-medium">Chưa có lượt buff nào trong phiên này.</p>
                    <p className="text-[11px] text-slate-400 max-w-xs mt-1">
                      Nhấn nút "Ghi Lượt Nộp Vào Database" để tự động sinh hàng loạt kết quả thi từ học sinh thực tế.
                    </p>
                  </div>
                ) : (
                  recentBuffLogs.map((log, idx) => (
                    <div 
                      key={idx}
                      className="p-3 rounded-xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <span>{log.studentName}</span>
                          <span className="text-[10px] text-slate-400 font-normal">({log.studentSchool})</span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Bài thi: <span className="font-semibold text-slate-800 dark:text-slate-200">{log.examTitle}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-mono font-black text-sm text-emerald-600 dark:text-emerald-400">
                          {log.score} điểm
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {log.duration} • {log.time}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataSeeder;
