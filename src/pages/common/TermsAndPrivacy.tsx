import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  ShieldCheck, FileText, Lock, ChevronLeft, CheckCircle2, 
  AlertCircle, Scale, BrainCircuit, Sparkles, School, Eye, 
  HelpCircle, Globe, Award
} from 'lucide-react';

const TermsAndPrivacy = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>('terms');

  useEffect(() => {
    if (location.pathname.includes('privacy')) {
      setActiveTab('privacy');
    } else {
      setActiveTab('terms');
    }
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col selection:bg-blue-500 selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 text-slate-900 dark:text-white group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-sky-600 to-cyan-500 text-white flex items-center justify-center font-black text-lg shadow-md">
              ∑
            </div>
            <div>
              <span className="font-heading font-extrabold text-lg tracking-tight">
                FMATH<span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">12</span>
              </span>
              <span className="text-[10px] font-bold block text-slate-400 -mt-1 font-mono uppercase tracking-wider">PRO LEGAL</span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setActiveTab('terms')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold font-heading transition-all ${
                  activeTab === 'terms'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <FileText size={14} /> Điều khoản Dịch vụ
              </button>
              <button
                onClick={() => setActiveTab('privacy')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold font-heading transition-all ${
                  activeTab === 'privacy'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <ShieldCheck size={14} /> Chính sách Bảo mật
              </button>
            </div>

            <Link
              to="/login"
              className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors hidden sm:inline-flex items-center gap-1"
            >
              <ChevronLeft size={14} /> Quay lại đăng nhập
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-10">
        {/* Banner */}
        <div className="relative rounded-3xl overflow-hidden p-8 mb-8 bg-gradient-to-br from-blue-700 via-indigo-700 to-sky-700 text-white shadow-xl shadow-blue-900/10 border border-white/10">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-sky-200 text-xs font-bold mb-3 border border-white/20">
              <Scale size={13} /> Khung Quy Định Pháp Lý & Chuẩn Khảo Thí GDPT 2018
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-heading tracking-tight mb-2">
              {activeTab === 'terms' ? 'Điều Khoản Dịch Vụ FMATH12 PRO' : 'Chính Sách Bảo Mật & Quyền Riêng Tư'}
            </h1>
            <p className="text-sm text-sky-100/90 leading-relaxed font-normal">
              Cập nhật lần cuối: <strong>Năm học 2025 - 2026</strong>. Áp dụng cho toàn bộ người dùng, học sinh, giáo viên và đơn vị đối tác trên nền tảng FMATH12 PRO.
            </p>
          </div>
        </div>

        {/* Legal Text Cards */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-10 shadow-sm space-y-8 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          
          {/* TAB 1: TERMS OF SERVICE */}
          {activeTab === 'terms' && (
            <div className="space-y-8 animate-in fade-in">
              <section className="space-y-3">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white font-heading flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">1</span>
                  Giới thiệu & Phạm vi Áp dụng
                </h2>
                <p>
                  Chào mừng bạn đến với <strong>FMATH12 PRO</strong> — Hệ sinh thái Học tập Thích ứng & Khảo thí Trí tuệ Nhân tạo Toán 12 Chuẩn Chương trình Giáo dục Phổ thông 2018 (Bộ GD&ĐT). Khi truy cập hoặc sử dụng bất kỳ tính năng nào của hệ thống, bạn xác nhận đã đọc, hiểu và đồng ý tuân thủ toàn bộ các điều khoản dịch vụ này.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white font-heading flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">2</span>
                  Tài khoản & Trách nhiệm Người dùng
                </h2>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    <strong>Đăng ký & Định danh:</strong> Người dùng cam kết cung cấp thông tin chính xác khi đăng ký tài khoản (học sinh, giáo viên hoặc cán bộ quản lý giáo dục).
                  </li>
                  <li>
                    <strong>Bảo mật thông tin đăng nhập:</strong> Bạn chịu trách nhiệm bảo mật thông tin tài khoản, mật khẩu và liên kết đăng nhập. Mọi hoạt động phát sinh từ tài khoản của bạn được xem là do bạn thực hiện.
                  </li>
                  <li>
                    <strong>Tính trung thực học thuật:</strong> Không sử dụng các công cụ gian lận can thiệp vào quá trình làm bài thi, khảo sát năng lực trực tuyến hoặc giả mạo kết quả đánh giá.
                  </li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white font-heading flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">3</span>
                  Nguyên tắc Hoạt động của Trợ lý AI (FMATH12 AI Tutor)
                </h2>
                <p>
                  FMATH12 tích hợp các mô hình trí tuệ nhân tạo chuyên biệt để hướng dẫn sư phạm, giải thích lý thuyết trực quan, gợi mở phương pháp tư duy và phân tích ma trận điểm yếu:
                </p>
                <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-2">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>Mục tiêu Sư phạm:</strong> AI đóng vai trò cố vấn học tập, định hướng học sinh tự tư duy thay vì chỉ cung cấp đáp án cơ học.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>Không vi phạm bản quyền:</strong> Đề bài, ngân hàng câu hỏi và dữ liệu sư phạm được bảo vệ và chỉ phục vụ mục đích nghiên cứu học tập.</span>
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white font-heading flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">4</span>
                  Quyền Sở hữu Trí tuệ
                </h2>
                <p>
                  Toàn bộ nội dung bài giảng, lý thuyết tương tác, sơ đồ tư duy, mã nguồn phần mềm, thuật toán chẩn đoán IRT / Bayesian Knowledge Tracing và giao diện đồ họa thuộc quyền sở hữu độc quyền của <strong>Dự án FMATH12 PRO</strong>. Nghiêm cấm mọi hành vi sao chép, trích xuất dữ liệu tự động (scraping) hoặc thương mại hóa khi chưa có sự chấp thuận bằng văn bản.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white font-heading flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">5</span>
                  Sửa đổi Điều khoản & Chấm dứt Dịch vụ
                </h2>
                <p>
                  FMATH12 có quyền cập nhật, bổ sung các điều khoản này theo yêu cầu nâng cấp kỹ thuật hoặc quy định mới của ngành giáo dục. Mọi vi phạm nghiêm trọng có thể dẫn đến việc khóa tài khoản vĩnh viễn mà không cần báo trước.
                </p>
              </section>
            </div>
          )}

          {/* TAB 2: PRIVACY POLICY */}
          {activeTab === 'privacy' && (
            <div className="space-y-8 animate-in fade-in">
              <section className="space-y-3">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white font-heading flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">1</span>
                  Cam kết Bảo mật Quyền Riêng tư
                </h2>
                <p>
                  FMATH12 PRO cam kết bảo vệ dữ liệu cá nhân của người học và nhà giáo dục theo đúng tinh thần <strong>Nghị định 13/2023/NĐ-CP</strong> của Chính phủ về Bảo vệ Dữ liệu Cá nhân. Chúng tôi tôn trọng quyền tự quyết dữ liệu và áp dụng các tiêu chuẩn an toàn bảo mật cao cấp nhất.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white font-heading flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">2</span>
                  Dữ liệu Thu thập & Mục đích Sử dụng
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
                    <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <School size={14} className="text-blue-500" /> Dữ liệu Định danh Học sinh
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Họ tên, địa chỉ email, mã học sinh, trường học trực thuộc và lớp học tham gia nhằm định tuyến chương trình học và phân nhóm lớp.
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
                    <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <BrainCircuit size={14} className="text-emerald-500" /> Dữ liệu Khảo thí & Tiến độ
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Lịch sử làm bài, điểm số bài thi, thời gian giải câu hỏi, nhật ký ôn tập lý thuyết nhằm huấn luyện thuật toán AI chẩn đoán lỗ hổng kiến thức cá nhân hóa.
                    </p>
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white font-heading flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">3</span>
                  Chính sách Phân quyền & Giới hạn Quyền Admin đối với Lớp học
                </h2>
                <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 p-4 rounded-2xl space-y-2 text-amber-900 dark:text-amber-200 text-xs">
                  <div className="font-bold flex items-center gap-2 text-sm">
                    <Lock size={16} className="text-amber-600 dark:text-amber-400" /> 
                    Quy định Bảo mật Danh sách & Sĩ số Lớp học
                  </div>
                  <p>
                    Để đảm bảo quyền riêng tư tuyệt đối cho học sinh và quyền tự chủ chuyên môn của Giáo viên, <strong>Tài khoản Quản trị viên (Admin) bị kỹ thuật hóa để KHÔNG xem được chi tiết danh tính và số lượng học sinh nội bộ của từng lớp học</strong>. Chỉ có Giáo viên trực tiếp phụ trách lớp và chính học sinh trong lớp mới có quyền truy cập dữ liệu học tập nội bộ này.
                  </p>
                </div>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white font-heading flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">4</span>
                  Lưu trữ An toàn & Không Chia sẻ Bên thứ Ba
                </h2>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Toàn bộ thông tin được mã hóa đường truyền TLS 1.3 và lưu trữ an toàn trên hạ tầng đám mây Supabase PostgreSQL chuẩn doanh nghiệp.</li>
                  <li>FMATH12 tuyệt đối <strong>không bán, không chuyển giao</strong> dữ liệu học sinh sinh viên cho bất kỳ đơn vị quảng cáo hoặc bên thứ ba thương mại nào.</li>
                  <li>Dữ liệu chỉ được xử lý nội bộ nhằm phục vụ việc nâng cao chất lượng giáo dục và báo cáo học vụ cho phụ huynh/nhà trường khi có yêu cầu hợp pháp.</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white font-heading flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">5</span>
                  Quyền của Chủ thể Dữ liệu
                </h2>
                <p>
                  Bạn có quyền xem lại, điều chỉnh thông tin hồ sơ cá nhân hoặc gửi yêu cầu xóa dữ liệu học tập bất kỳ lúc nào qua kênh hỗ trợ học vụ hoặc trang Hồ sơ cá nhân.
                </p>
              </section>
            </div>
          )}

          {/* Footer of Card */}
          <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-blue-600 dark:text-blue-400" />
              <span>Hệ thống Bảo mật FMATH12 PRO — Tuân thủ Tiêu chuẩn An toàn GDPT 2018</span>
            </div>
            <Link
              to="/"
              className="text-blue-600 dark:text-blue-400 font-bold hover:underline"
            >
              Trở về Trang chủ
            </Link>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-400">
        © 2026 FMATH12 Platform — Hệ sinh thái Học tập Thích ứng & Trí tuệ Toán học AI Toàn Quốc.
      </footer>
    </div>
  );
};

export default TermsAndPrivacy;
