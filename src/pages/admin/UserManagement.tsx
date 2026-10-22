import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, Search, ShieldCheck, User, Mail, GraduationCap, Loader2, 
  Trash2, Edit3, CheckCircle2, Ban, Unlock, BellRing, Send, X, 
  Bold, Italic, List, BookOpen, Award, Globe, RefreshCcw, Filter
} from 'lucide-react';
import { supabase } from '../../config/supabase';
import ManagementHeader from '../../components/common/ManagementHeader';
import { isFptTeacherOrAdmin } from '../../utils/permissionUtils';

const UserManagement = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  
  const [usersList, setUsersList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // States cho Modal Đổi Vai trò
  const [roleModalUser, setRoleModalUser] = useState<any | null>(null);
  const [selectedNewRole, setSelectedNewRole] = useState<'student' | 'teacher' | 'admin'>('student');
  const [selectedTeacherSchool, setSelectedTeacherSchool] = useState<string>('THPT FPT Cần Thơ');
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  // States cho Modal Gửi Thông báo
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [notifTarget, setNotifTarget] = useState<any>(null); 
  const [notifAudience, setNotifAudience] = useState<'all' | 'student' | 'teacher'>('all'); 
  const [notifForm, setNotifForm] = useState({ title: '', message: '', type: 'system' });
  const [isSendingNotif, setIsSendingNotif] = useState(false);

  // Ref cho thanh công cụ Markdown
  const notifTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    
    const { data } = await supabase
      .from('users')
      .select(`
        *,
        class_members (
          status,
          classes (
            name
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (data) {
      const formattedData = data.map(u => {
        const classInfo = u.class_members?.map((cm: any) => {
          if (!cm.classes?.name) return null;
          if (cm.status === 'joined') return cm.classes.name;
          if (cm.status === 'pending') return `${cm.classes.name} (Chờ duyệt)`;
          return null;
        }).filter(Boolean) || [];

        return {
          ...u, 
          status: u.status || 'active',
          joined_classes: classInfo.length > 0 ? classInfo.join(' • ') : 'Chưa vào lớp'
        };
      });
      setUsersList(formattedData);
    }
    setIsLoading(false);
  };

  const openRoleModal = (user: any) => {
    setRoleModalUser(user);
    setSelectedNewRole(user.role || 'student');
    setSelectedTeacherSchool(
      user.school || (user.email?.toLowerCase().includes('fpt') ? 'THPT FPT Cần Thơ' : 'Giáo viên Toàn quốc')
    );
  };

  const submitRoleChange = async () => {
    if (!roleModalUser) return;
    setIsUpdatingRole(true);
    
    const updatePayload: any = { role: selectedNewRole };
    if (selectedNewRole === 'teacher') {
      updatePayload.school = selectedTeacherSchool;
    }

    const { error } = await supabase.from('users').update(updatePayload).eq('id', roleModalUser.id);
    if (!error) {
      setUsersList(prev => prev.map(u => u.id === roleModalUser.id ? { ...u, ...updatePayload } : u));
      setRoleModalUser(null);
      alert(`Cập nhật phân quyền thành công!`);
    } else {
      alert("Lỗi cập nhật quyền: " + error.message);
    }
    setIsUpdatingRole(false);
  };

  const handleUpdateStatus = async (userId: string, newStatus: 'active' | 'banned') => {
    const actionName = newStatus === 'active' ? 'Duyệt / Mở khóa' : 'Khóa (Ban)';
    if (!window.confirm(`Bạn có chắc chắn muốn ${actionName} tài khoản này?`)) return;

    const { error } = await supabase.from('users').update({ status: newStatus }).eq('id', userId);
    if (!error) {
      setUsersList(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
    } else {
      alert("Lỗi cập nhật trạng thái: " + error.message);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm("CẢNH BÁO: Xóa toàn bộ dữ liệu của người dùng này vĩnh viễn. Chắc chắn xóa?")) return;
    const { error } = await supabase.from('users').delete().eq('id', userId);
    if (!error) {
      setUsersList(prev => prev.filter(u => u.id !== userId));
    } else {
      alert("Lỗi xóa: " + error.message);
    }
  };

  const handleOpenNotifModal = (user: any | null) => {
    setNotifTarget(user);
    setNotifAudience('all'); 
    setNotifForm({ title: '', message: '', type: 'system' });
    setShowNotifModal(true);
  };

  const insertMarkdown = (before: string, after: string = '') => {
    const textarea = notifTextareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = notifForm.message.substring(start, end);
    const newText = notifForm.message.substring(0, start) + before + selectedText + after + notifForm.message.substring(end);
    
    setNotifForm({ ...notifForm, message: newText });
  };

  const handleSendNotification = async () => {
    if (!notifForm.title.trim() || !notifForm.message.trim()) {
      return alert("Vui lòng nhập đầy đủ Tiêu đề và Nội dung thông báo!");
    }

    setIsSendingNotif(true);
    try {
      let targetUserIds: string[] = [];

      if (notifTarget) {
        targetUserIds = [notifTarget.id];
      } else {
        if (notifAudience === 'all') {
          targetUserIds = usersList.filter(u => u.role !== 'admin').map(u => u.id);
        } else {
          targetUserIds = usersList.filter(u => u.role === notifAudience).map(u => u.id);
        }
      }

      if (targetUserIds.length === 0) return alert("Không tìm thấy người dùng nào thuộc nhóm này!");

      const notifPayload = targetUserIds.map(uid => ({
        user_id: uid,
        title: notifForm.title,
        message: notifForm.message,
        type: notifForm.type,
        is_read: false
      }));

      const { error } = await supabase.from('notifications').insert(notifPayload);
      if (error) throw error;

      alert(`Đã gửi thông báo thành công tới ${targetUserIds.length} người dùng!`);
      setShowNotifModal(false);
      setNotifForm({ title: '', message: '', type: 'system' });
    } catch (err: any) {
      alert("Lỗi khi gửi thông báo: " + err.message);
    } finally {
      setIsSendingNotif(false);
    }
  };

  const filteredUsers = usersList.filter(user => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = 
      (user.full_name?.toLowerCase() || '').includes(query) ||
      (user.email?.toLowerCase() || '').includes(query) ||
      (user.student_code?.toLowerCase() || '').includes(query);

    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="page-container relative animate-in fade-in">
      <div className="page-content custom-scrollbar">
        <div className="max-w-7xl mx-auto w-full pb-16">
          
          {/* HEADER ĐỒNG BỘ */}
          <ManagementHeader
            title="Quản Lý Người Dùng & Phân Quyền"
            subtitle="Phân quyền Quản trị viên, Giáo viên THPT FPT Cần Thơ, Giáo viên Toàn quốc và Học sinh"
            icon={<Users size={22} />}
            actions={
              <>
                <button
                  onClick={() => handleOpenNotifModal(null)}
                  className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5 shadow-sm"
                >
                  <Send size={13} /> Gửi thông báo Pop-up
                </button>
                <button
                  onClick={fetchUsers}
                  disabled={isLoading}
                  className="btn-secondary text-xs px-3.5 py-2 flex items-center gap-1.5"
                >
                  <RefreshCcw size={13} className={isLoading ? 'animate-spin' : ''} />
                  <span>Làm mới</span>
                </button>
              </>
            }
          />

          {/* BỘ LỌC VÀ TÌM KIẾM */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-xs mb-6 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm theo tên, email hoặc mã số..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 text-slate-800 dark:text-slate-200"
              />
            </div>

            <div className="flex items-center gap-2 self-start md:self-auto">
              <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                {[
                  { key: 'all', label: 'Tất cả' },
                  { key: 'teacher', label: 'Giáo viên' },
                  { key: 'student', label: 'Học sinh' },
                  { key: 'admin', label: 'Admin' }
                ].map(item => (
                  <button
                    key={item.key}
                    onClick={() => setRoleFilter(item.key)}
                    className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      roleFilter === item.key 
                        ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs' 
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* BẢNG NGƯỜI DÙNG */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-3">
              <Loader2 className="animate-spin text-blue-600" size={32}/>
              <p className="text-xs text-slate-400">Đang tải danh sách người dùng...</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 dark:bg-slate-850/80 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider font-heading">
                      <th className="p-3.5 pl-5">Người dùng</th>
                      <th className="p-3.5">Email / Đơn vị</th>
                      <th className="p-3.5 text-center">Vai trò & Quyền hạn</th>
                      <th className="p-3.5 text-center">Trạng thái</th>
                      <th className="p-3.5 pr-5 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredUsers.map(user => {
                      const isFptTeacher = user.role === 'teacher' && isFptTeacherOrAdmin(user);

                      return (
                        <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition-colors">
                          
                          {/* Tên & Avatar */}
                          <td className="p-3.5 pl-5 flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-2xs ${
                              user.role === 'admin' ? 'bg-rose-600' : 
                              user.role === 'teacher' ? 'bg-blue-600' : 'bg-emerald-600'
                            }`}>
                              {user.avatar_url ? (
                                <img src={user.avatar_url} alt="Ava" className="w-full h-full object-cover rounded-xl"/>
                              ) : (
                                (user.full_name?.charAt(0) || 'U')
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 dark:text-white truncate max-w-[160px]">
                                {user.full_name || 'Chưa cập nhật'}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                ID: {user.student_code || '---'}
                              </div>
                            </div>
                          </td>

                          {/* Email & Đơn vị / Lớp */}
                          <td className="p-3.5">
                            <div className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1">
                              <Mail size={13} className="text-slate-400 shrink-0"/> 
                              <span className="truncate max-w-[200px]">{user.email}</span>
                            </div>
                            {user.role === 'student' ? (
                              <div className="text-[11px] text-slate-400 truncate max-w-[220px]">
                                Lớp: <span className="font-bold text-blue-600 dark:text-blue-400">{user.joined_classes}</span>
                              </div>
                            ) : (
                              <div className="text-[11px] text-slate-400 truncate max-w-[220px]">
                                Đơn vị: <span className="font-semibold text-slate-600 dark:text-slate-300">{user.school || 'Giáo viên Toàn quốc'}</span>
                              </div>
                            )}
                          </td>

                          {/* Vai trò & Quyền hạn */}
                          <td className="p-3.5 text-center">
                            {user.role === 'admin' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                                <ShieldCheck size={11} /> Admin (Toàn quyền)
                              </span>
                            ) : user.role === 'teacher' ? (
                              isFptTeacher ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800" title="Có quyền biên tập đề và giáo trình hệ thống">
                                  <Award size={11} /> GV FPT Cần Thơ (Biên tập)
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-800" title="Tạo lớp, tạo đề riêng & đóng góp đề">
                                  <Globe size={11} /> GV Toàn quốc (Liên trường)
                                </span>
                              )
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                <User size={11} /> Học sinh
                              </span>
                            )}
                          </td>

                          {/* Trạng thái */}
                          <td className="p-3.5 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                              user.status === 'active' 
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' :
                              user.status === 'pending'
                                ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 animate-pulse' :
                              'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200'
                            }`}>
                              {user.status === 'active' ? 'Hoạt động' : user.status === 'pending' ? 'Chờ duyệt' : 'Bị Khóa'}
                            </span>
                          </td>

                          {/* Thao tác */}
                          <td className="p-3.5 pr-5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button 
                                onClick={() => handleOpenNotifModal(user)} 
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-colors cursor-pointer" 
                                title="Gửi thông báo riêng"
                              >
                                <BellRing size={14}/>
                              </button>

                              {user.status === 'pending' && (
                                <button 
                                  onClick={() => handleUpdateStatus(user.id, 'active')} 
                                  className="px-2 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-bold hover:bg-emerald-700 transition-colors"
                                >
                                  Duyệt
                                </button>
                              )}

                              {user.status === 'banned' ? (
                                <button 
                                  onClick={() => handleUpdateStatus(user.id, 'active')} 
                                  className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer" 
                                  title="Mở khóa tài khoản"
                                >
                                  <Unlock size={14}/>
                                </button>
                              ) : (
                                <button 
                                  onClick={() => handleUpdateStatus(user.id, 'banned')} 
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer" 
                                  title="Khóa tài khoản"
                                >
                                  <Ban size={14}/>
                                </button>
                              )}

                              <button 
                                onClick={() => openRoleModal(user)} 
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer" 
                                title="Phân quyền vai trò"
                              >
                                <Edit3 size={14}/>
                              </button>

                              <button 
                                onClick={() => handleDeleteUser(user.id)} 
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer" 
                                title="Xóa tài khoản"
                              >
                                <Trash2 size={14}/>
                              </button>
                            </div>
                          </td>

                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ==========================================
          MODAL PHÂN QUYỀN VAI TRÒ
          ========================================== */}
      {roleModalUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl p-6 md:p-7 shadow-xl border border-slate-200 dark:border-slate-800 relative">
            <button 
              onClick={() => setRoleModalUser(null)} 
              className="absolute top-5 right-5 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
            >
              <X size={18}/>
            </button>
            
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-heading mb-1 flex items-center gap-2 m-0">
              <ShieldCheck className="text-blue-600" size={18}/> Phân Quyền Tài Khoản
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Cập nhật cho: <strong className="text-slate-900 dark:text-white">{roleModalUser.full_name || roleModalUser.email}</strong>
            </p>

            <div className="space-y-2.5 mb-5">
              {[
                { key: 'student', label: 'Học sinh', desc: 'Làm bài thi, học lý thuyết 4 bậc và luyện tập cá nhân' },
                { key: 'teacher', label: 'Giáo viên', desc: 'Quản lý lớp học, tạo đề thi, giao bài và chấm điểm' },
                { key: 'admin', label: 'Quản trị viên (Admin)', desc: 'Toàn quyền tối cao quản trị hệ thống, dữ liệu và người dùng' }
              ].map(r => (
                <label 
                  key={r.key} 
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedNewRole === r.key 
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/50 text-blue-900 dark:text-blue-200' 
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <input 
                    type="radio" 
                    name="userRole" 
                    value={r.key} 
                    checked={selectedNewRole === r.key} 
                    onChange={() => setSelectedNewRole(r.key as any)}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-bold text-xs">{r.label}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{r.desc}</div>
                  </div>
                </label>
              ))}
            </div>

            {/* Mục chọn phân quyền giáo viên THPT FPT Cần Thơ vs Toàn quốc */}
            {selectedNewRole === 'teacher' && (
              <div className="mb-5 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Phân quyền đơn vị công tác của Giáo viên:
                </label>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                    <input
                      type="radio"
                      name="teacherSchool"
                      value="THPT FPT Cần Thơ"
                      checked={selectedTeacherSchool.includes('FPT')}
                      onChange={() => setSelectedTeacherSchool('THPT FPT Cần Thơ')}
                    />
                    <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                      <Award size={13} /> THPT FPT Cần Thơ (Toàn quyền biên tập đề & lý thuyết hệ thống)
                    </span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                    <input
                      type="radio"
                      name="teacherSchool"
                      value="Giáo viên Toàn quốc"
                      checked={!selectedTeacherSchool.includes('FPT')}
                      onChange={() => setSelectedTeacherSchool('Giáo viên Toàn quốc')}
                    />
                    <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                      <Globe size={13} /> Giáo viên Toàn quốc (Tạo lớp, tạo đề riêng, đóng góp đề)
                    </span>
                  </label>
                </div>
              </div>
            )}

            <div className="flex gap-2.5">
              <button 
                onClick={() => setRoleModalUser(null)} 
                className="btn-secondary flex-1 py-2 text-xs font-bold"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={submitRoleChange} 
                disabled={isUpdatingRole} 
                className="btn-primary flex-1 py-2 text-xs font-bold flex justify-center items-center gap-1.5"
              >
                {isUpdatingRole ? <Loader2 size={14} className="animate-spin"/> : <CheckCircle2 size={14}/>} 
                <span>Lưu thay đổi</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL GỬI THÔNG BÁO POP-UP
          ========================================== */}
      {showNotifModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl p-6 md:p-7 shadow-xl border border-slate-200 dark:border-slate-800 relative flex flex-col max-h-[90vh]">
            <button 
              onClick={() => setShowNotifModal(false)} 
              className="absolute top-5 right-5 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
            >
              <X size={18}/>
            </button>
            
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-heading mb-1 flex items-center gap-2 m-0">
              <Send className="text-blue-600" size={17}/> Gửi Thông Báo Pop-up
            </h3>
            
            <div className="text-[11px] font-bold text-blue-600 dark:text-blue-400 mb-4 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-full inline-block w-fit border border-blue-200 dark:border-blue-800">
              {notifTarget ? `Gửi riêng cho: ${notifTarget.full_name}` : `Gửi thông báo hàng loạt`}
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-3.5 mb-5 text-xs">
              {!notifTarget && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Đối tượng nhận</label>
                  <select 
                    value={notifAudience} 
                    onChange={e => setNotifAudience(e.target.value as any)} 
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500"
                  >
                    <option value="all">Tất cả Giáo viên & Học sinh ({usersList.filter(u => u.role !== 'admin').length} người)</option>
                    <option value="student">Chỉ gửi Học sinh ({usersList.filter(u => u.role === 'student').length} người)</option>
                    <option value="teacher">Chỉ gửi Giáo viên ({usersList.filter(u => u.role === 'teacher').length} người)</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Tiêu đề thông báo</label>
                <input 
                  type="text" 
                  value={notifForm.title} 
                  onChange={e => setNotifForm({ ...notifForm, title: e.target.value })} 
                  placeholder="VD: Cập nhật đề thi mới, Nhắc nhở nộp bài..." 
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Nội dung thông báo</label>
                <textarea 
                  ref={notifTextareaRef}
                  value={notifForm.message} 
                  onChange={e => setNotifForm({ ...notifForm, message: e.target.value })} 
                  placeholder="Nhập nội dung thông báo gửi đến người dùng..." 
                  className="w-full p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 h-28 resize-none custom-scrollbar"
                />
              </div>
            </div>

            <div className="flex gap-2.5">
              <button 
                onClick={() => setShowNotifModal(false)} 
                className="btn-secondary flex-1 py-2 text-xs font-bold"
              >
                Hủy
              </button>
              <button 
                onClick={handleSendNotification} 
                disabled={isSendingNotif} 
                className="btn-primary flex-1 py-2 text-xs font-bold flex justify-center items-center gap-1.5"
              >
                {isSendingNotif ? <Loader2 size={14} className="animate-spin"/> : <Send size={14}/>} 
                <span>Gửi thông báo</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default UserManagement;