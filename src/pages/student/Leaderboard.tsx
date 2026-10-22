import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Flame, Loader2, User, Star, Award, Sparkles } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { supabase } from '../../config/supabase';

const Leaderboard = () => {
  const { currentUser } = useAppStore();
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<'all' | 'month' | 'week'>('all');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, full_name, avatar_url, xp, level, streak, school')
          .order('xp', { ascending: false })
          .limit(50);

        if (!error && data) {
          setUsers(data);
        }
      } catch (err) {
        console.error("Lỗi tải bảng xếp hạng:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, [timeFilter]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-76px)] bg-[#f8fafc] dark:bg-[#090d16] text-slate-400">
        <Loader2 size={36} className="animate-spin mb-3 text-indigo-600" />
        <p className="font-medium text-sm font-heading">Đang đồng bộ Bảng vàng FMATH12...</p>
      </div>
    );
  }

  const top3 = users.slice(0, 3);
  const others = users.slice(3);

  const myRankIndex = users.findIndex(u => u.id === currentUser?.id);
  const myRank = myRankIndex !== -1 ? myRankIndex + 1 : '100+';

  return (
    <div className="page-container animate-in fade-in">
      
      {/* HEADER */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 md:px-8 py-6 shrink-0">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black font-heading text-slate-900 dark:text-white mb-1.5 flex items-center gap-2.5">
              <Trophy size={28} className="text-amber-500" /> Bảng Vàng Vinh Danh Toàn Quốc
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm m-0 font-normal">
              Đua top điểm kinh nghiệm Aura XP rèn luyện Toán 12 theo chuẩn Bộ GD&ĐT 2025.
            </p>
          </div>
          
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700 w-max self-start md:self-auto">
            <button 
              onClick={() => setTimeFilter('week')}
              className={`px-3.5 py-1.5 text-xs font-bold font-heading rounded-lg transition-all ${
                timeFilter === 'week' 
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs' 
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Tuần
            </button>
            <button 
              onClick={() => setTimeFilter('month')}
              className={`px-3.5 py-1.5 text-xs font-bold font-heading rounded-lg transition-all ${
                timeFilter === 'month' 
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs' 
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Tháng
            </button>
            <button 
              onClick={() => setTimeFilter('all')}
              className={`px-3.5 py-1.5 text-xs font-bold font-heading rounded-lg transition-all ${
                timeFilter === 'all' 
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs' 
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Toàn thời gian
            </button>
          </div>
        </div>
      </div>

      <div className="page-content">
        <div className="max-w-4xl mx-auto space-y-6">
        
          {/* ========================================================================= */}
          {/* TOP 3 PODIUM                                                              */}
          {/* ========================================================================= */}
          {top3.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end pt-4 pb-2">
              
              {/* TOP 2 (BẠC) */}
              {top3[1] && (
                <div className="order-2 md:order-1 flat-card p-6 text-center relative overflow-hidden flex flex-col items-center border-slate-300 dark:border-slate-700">
                  <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 font-black font-raleway flex items-center justify-center mb-3 text-sm border border-slate-200 dark:border-slate-700">
                    #2
                  </div>
                  <div className="w-18 h-18 rounded-full bg-slate-100 dark:bg-slate-800 border-4 border-slate-200 dark:border-slate-700 mb-2.5 overflow-hidden flex items-center justify-center text-slate-400">
                    {top3[1].avatar_url ? <img src={top3[1].avatar_url} className="w-full h-full object-cover" alt="Ava"/> : <User size={30}/>}
                  </div>
                  <h3 className="font-bold font-heading text-slate-900 dark:text-white text-sm sm:text-base mb-1 line-clamp-1">{top3[1].full_name}</h3>
                  <span className="badge-primary mb-3">Level {top3[1].level || 1}</span>
                  <div className="font-black text-xl font-raleway text-slate-900 dark:text-white flex items-center justify-center gap-1">
                    <Flame size={18} className="text-indigo-500" /> {top3[1].xp || 0} <span className="text-xs font-normal text-slate-400">XP</span>
                  </div>
                </div>
              )}

              {/* TOP 1 (VÀNG) */}
              {top3[0] && (
                <div className="order-1 md:order-2 flat-card p-7 text-center relative overflow-hidden flex flex-col items-center border-amber-300 dark:border-amber-600/60 shadow-xl shadow-amber-500/10 md:-translate-y-3 z-10 bg-gradient-to-b from-amber-50/50 via-white to-white dark:from-amber-950/20 dark:via-slate-900 dark:to-slate-900">
                  <div className="w-11 h-11 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3 shadow-sm border border-amber-200/80 dark:border-amber-700">
                    <Trophy size={20} className="animate-bounce" />
                  </div>
                  <div className="w-22 h-22 rounded-full bg-amber-50 dark:bg-amber-950/40 border-4 border-amber-300 dark:border-amber-500 mb-2.5 overflow-hidden flex items-center justify-center text-amber-500">
                    {top3[0].avatar_url ? <img src={top3[0].avatar_url} className="w-full h-full object-cover" alt="Ava"/> : <User size={36}/>}
                  </div>
                  <h3 className="font-black font-heading text-slate-900 dark:text-white text-base sm:text-lg mb-1 line-clamp-1">{top3[0].full_name}</h3>
                  <span className="badge-warning mb-3">Quán Quân • Level {top3[0].level || 1}</span>
                  <div className="font-black text-2xl font-raleway text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1.5">
                    <Flame size={22} className="text-amber-500" /> {top3[0].xp || 0} <span className="text-sm font-normal text-slate-400">XP</span>
                  </div>
                </div>
              )}

              {/* TOP 3 (ĐỒNG) */}
              {top3[2] && (
                <div className="order-3 md:order-3 flat-card p-6 text-center relative overflow-hidden flex flex-col items-center border-orange-200 dark:border-orange-800/60">
                  <div className="w-9 h-9 rounded-full bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 font-black font-raleway flex items-center justify-center mb-3 text-sm border border-orange-200 dark:border-orange-700">
                    #3
                  </div>
                  <div className="w-18 h-18 rounded-full bg-orange-50 dark:bg-orange-950/40 border-4 border-orange-200 dark:border-orange-700 mb-2.5 overflow-hidden flex items-center justify-center text-orange-500">
                    {top3[2].avatar_url ? <img src={top3[2].avatar_url} className="w-full h-full object-cover" alt="Ava"/> : <User size={30}/>}
                  </div>
                  <h3 className="font-bold font-heading text-slate-900 dark:text-white text-sm sm:text-base mb-1 line-clamp-1">{top3[2].full_name}</h3>
                  <span className="badge-warning mb-3">Level {top3[2].level || 1}</span>
                  <div className="font-black text-xl font-raleway text-slate-900 dark:text-white flex items-center justify-center gap-1">
                    <Flame size={18} className="text-orange-500" /> {top3[2].xp || 0} <span className="text-xs font-normal text-slate-400">XP</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* VỊ TRÍ CỦA BẠN                                                            */}
          {/* ========================================================================= */}
          {currentUser && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-cyan-500/10 border border-indigo-200/80 dark:border-indigo-800/80 flex items-center gap-4 shadow-sm">
              <div className="w-11 h-11 rounded-xl bg-white dark:bg-slate-800 border border-indigo-200/80 dark:border-indigo-700 flex items-center justify-center font-black text-indigo-600 dark:text-indigo-400 text-sm font-raleway shrink-0 shadow-xs">
                #{myRank}
              </div>
              <div className="flex-1 min-w-0 flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center text-slate-400 shrink-0">
                  {currentUser.avatar_url ? <img src={currentUser.avatar_url} className="w-full h-full object-cover" alt="Me"/> : <User size={20}/>}
                </div>
                <div className="min-w-0">
                  <div className="font-bold font-heading text-slate-900 dark:text-white text-sm flex items-center gap-2 truncate">
                    <span>{currentUser.name || currentUser.full_name}</span>
                    <span className="badge-primary py-0.5">Bạn</span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <Star size={12} className="text-amber-500" /> Level {currentUser.level || 1} • {currentUser.school || 'Học sinh Tự do'}
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-black text-lg font-raleway text-indigo-600 dark:text-indigo-400 leading-none mb-0.5">
                  {currentUser.xp || 0}
                </div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">XP</div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* DANH SÁCH THỨ HẠNG CÒN LẠI (TỪ TOP 4)                                    */}
          {/* ========================================================================= */}
          {others.length > 0 && (
            <div className="flat-card p-0 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
              {others.map((user, index) => {
                const actualRank = index + 4;
                const isMe = user.id === currentUser?.id;

                return (
                  <div 
                    key={user.id} 
                    className={`flex items-center gap-3.5 p-3.5 sm:p-4 transition-colors ${
                      isMe 
                        ? 'bg-indigo-50/70 dark:bg-indigo-950/40' 
                        : 'hover:bg-slate-50 dark:hover:bg-slate-850/60'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs font-raleway shrink-0 ${
                      isMe 
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}>
                      {actualRank}
                    </div>
                    
                    <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center text-slate-400 shrink-0">
                      {user.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover" alt="Ava"/> : <User size={16}/>}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className={`font-bold font-heading text-xs sm:text-sm truncate ${
                        isMe ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-900 dark:text-white'
                      }`}>
                        {user.full_name}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        Level {user.level || 1} • {user.school || 'Học sinh Tự do'}
                      </div>
                    </div>
                    
                    <div className="text-right shrink-0">
                      <div className="font-bold text-sm font-raleway text-slate-900 dark:text-white flex items-center gap-1">
                        <Flame size={14} className="text-amber-500" />
                        <span>{user.xp || 0}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {users.length === 0 && !isLoading && (
            <div className="flat-card text-center py-16">
              <Trophy size={42} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
              <p className="text-slate-500 text-sm font-medium">Chưa có dữ liệu bảng vàng.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Leaderboard;