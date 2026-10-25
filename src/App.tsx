import React, { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import DashboardLayout from './components/layout/DashboardLayout';

const LandingPage = lazy(() => import('./pages/common/LandingPage'));
const LoginPage = lazy(() => import('./pages/common/LoginPage'));
const Profile = lazy(() => import('./pages/common/Profile'));
const OverviewSwitcher = lazy(() => import('./pages/common/OverviewSwitcher'));

const Theory = lazy(() => import('./pages/student/Theory'));
const Resources = lazy(() => import('./pages/student/Resources'));
const QuizList = lazy(() => import('./pages/student/QuizList'));
const QuizDetail = lazy(() => import('./pages/student/QuizDetail'));
const QuizTaking = lazy(() => import('./pages/student/QuizTaking')); 
const Classroom = lazy(() => import('./pages/student/Classroom'));
const Leaderboard = lazy(() => import('./pages/student/Leaderboard'));
const JoinClass = lazy(() => import('./pages/student/JoinClass'));

const ClassManager = lazy(() => import('./pages/teacher/ClassManager'));
const QuestionBank = lazy(() => import('./pages/teacher/QuestionBank'));
const ExamBank = lazy(() => import('./pages/teacher/ExamBank'));
const ExamCreator = lazy(() => import('./pages/teacher/ExamCreator'));
const ContentCreator = lazy(() => import('./pages/teacher/ContentCreator'));
const AssignmentGrader = lazy(() => import('./pages/teacher/AssignmentGrader'));
const TheoryEditor = lazy(() => import('./pages/teacher/TheoryEditor'));
const ExamEditor = lazy(() => import('./pages/teacher/ExamEditor'));

const UserManagement = lazy(() => import('./pages/admin/UserManagement'));
const AdminAnalyticsPage = lazy(() => import('./pages/admin/AdminAnalyticsPage'));

const FullPageLoading = () => (
  <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-900/95 backdrop-blur-md select-none animate-in fade-in">
    <div className="flex flex-col items-center space-y-5 max-w-sm text-center">
      <div className="relative w-20 h-20 flex items-center justify-center">
        <div className="absolute inset-0 rounded-3xl bg-blue-500/20 blur-xl animate-pulse"></div>
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-blue-600 via-sky-600 to-cyan-400 animate-spin [animation-duration:8s] opacity-70"></div>
        <div className="w-16 h-16 rounded-2xl bg-slate-950 text-white flex items-center justify-center font-black text-2xl shadow-2xl font-heading relative z-10 border border-white/10">
          <span className="bg-gradient-to-tr from-blue-400 via-sky-300 to-cyan-300 bg-clip-text text-transparent">∑</span>
        </div>
      </div>

      <div className="space-y-1.5">
        <h3 className="font-extrabold text-[20px] text-white font-heading m-0 tracking-wider">
          FMATH<span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">12</span>
        </h3>
        <p className="text-[13px] text-slate-400 font-medium m-0">Hệ sinh thái Học tập Thích ứng & Trí tuệ Toán học AI</p>
      </div>

      <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
        <div className="h-full bg-gradient-to-r from-blue-500 via-sky-500 to-cyan-400 rounded-full w-2/3 animate-pulse"></div>
      </div>
    </div>
  </div>
);

const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-10 rounded-2xl text-center flex flex-col items-center justify-center h-full min-h-[350px] shadow-sm max-w-2xl mx-auto my-8">
    <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">{title}</h2>
    <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm max-w-sm">Tính năng này đang được phát triển trong phiên bản FMATH12.</p>
    <button onClick={() => window.history.back()} className="btn-secondary px-6">Quay lại</button>
  </div>
);

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    const mainEl = document.querySelector('main');
    if (mainEl) {
      mainEl.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }, [pathname]);

  return null;
};

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Suspense fallback={<FullPageLoading />}><LandingPage /></Suspense>} />
        <Route path="/login" element={<Suspense fallback={<FullPageLoading />}><LoginPage /></Suspense>} />
        
        {/* Phân hệ Luyện tập & Làm bài tập tự luyện */}
        <Route path="/quiz/:id/take" element={<Suspense fallback={<FullPageLoading />}><QuizTaking /></Suspense>} />

        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<OverviewSwitcher />} />
          <Route path="/overview" element={<OverviewSwitcher />} />
          <Route path="/profile" element={<Profile />} />
          
          <Route path="/join/:code" element={<JoinClass />} />
          <Route path="/theory" element={<Theory />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/quiz" element={<QuizList />} />
          <Route path="/quiz/:id" element={<QuizDetail />} />
          <Route path="/classroom" element={<Classroom />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          
          <Route path="/class-manager" element={<ClassManager />} />
          <Route path="/question-bank" element={<QuestionBank />} />
          <Route path="/exam-bank" element={<ExamBank />} />
          <Route path="/exam-creator" element={<ExamCreator />} />
          <Route path="/content-creator" element={<ContentCreator />} />
          <Route path="/grading" element={<AssignmentGrader />} />
          <Route path="/theory-editor/:lessonId" element={<TheoryEditor />} /> 
          <Route path="/exam-editor" element={<ExamEditor />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
