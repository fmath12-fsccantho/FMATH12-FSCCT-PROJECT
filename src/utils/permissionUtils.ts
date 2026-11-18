/**
 * Hệ thống Phân quyền FMATH12 (Role & Content Permission System)
 * 
 * Quy định phân quyền:
 * 1. Admin: Có toàn quyền quản trị tối cao trên toàn hệ thống (Users, Classes, Exams, Theory, Question Bank).
 * 2. Giáo viên THPT FPT Cần Thơ:
 *    - Nhận diện qua: Email @fpt.edu.vn, @fe.edu.vn, @fpt.com.vn, chứa 'fct', 
 *      hoặc trường công tác 'THPT FPT Cần Thơ', hoặc cờ phân quyền tường minh từ Admin.
 *    - Quyền: Biên tập, chỉnh sửa đề thi chuẩn hệ thống, chỉnh sửa lý thuyết chuẩn, quản lý lớp học.
 * 3. Giáo viên Toàn quốc (Liên trường):
 *    - Không thuộc FPT Cần Thơ.
 *    - Quyền: Tạo lớp, quản lý học sinh, tạo đề thi mới, đóng góp đề, nhân bản đề thi hệ thống thành đề riêng.
 *    - Hạn chế: KHÔNG được sửa/xóa các đề và nội dung lý thuyết có sẵn của hệ thống.
 * 4. Học sinh: Làm bài, học lý thuyết, xem lộ trình, thi đua.
 */

export interface UserPermissionContext {
  id?: string;
  role?: string;
  email?: string;
  school?: string;
  is_core_teacher?: boolean;
  can_edit_system_content?: boolean;
  is_fpt_teacher?: boolean;
  [key: string]: any;
}

/**
 * Kiểm tra người dùng có phải là Quản trị viên (Admin) hay không.
 */
export const isAdminUser = (user: UserPermissionContext | null | undefined): boolean => {
  return user?.role === 'admin';
};

/**
 * Kiểm tra xem giáo viên có thuộc THPT FPT Cần Thơ (hoặc Admin) hay không.
 * Điều kiện:
 * - Admin: Luôn đúng.
 * - Giáo viên có email @fpt.edu.vn, @fe.edu.vn, @fpt.com.vn hoặc chứa 'fct'.
 * - Giáo viên có school chứa 'thpt fpt' hoặc 'fpt cần thơ'.
 * - Hoặc cờ phân quyền tường minh được cấp bởi Admin.
 */
export const isFptTeacherOrAdmin = (user: UserPermissionContext | null | undefined): boolean => {
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (user.role !== 'teacher') return false;

  const email = (user.email || '').toLowerCase().trim();
  const school = (user.school || '').toLowerCase().trim();

  // Kiểm tra domain email FPT
  const isFptEmail = email.endsWith('@fpt.edu.vn') || 
                     email.endsWith('@fe.edu.vn') || 
                     email.endsWith('@fpt.com.vn') ||
                     email.includes('fct');

  // Kiểm tra trường học
  const isFptSchool = school.includes('thpt fpt') || 
                      school.includes('fpt cần thơ') || 
                      school.includes('fpt can tho');

  // Cờ phân quyền do Admin chỉ định
  const isExplicit = Boolean(user.is_core_teacher || user.can_edit_system_content || user.is_fpt_teacher);

  return isFptEmail || isFptSchool || isExplicit;
};

/**
 * Kiểm tra quyền chỉnh sửa nội dung lý thuyết có sẵn của hệ thống:
 * Chỉ Admin và Giáo viên THPT FPT Cần Thơ mới có quyền sửa lý thuyết gốc.
 */
export const canEditTheoryContent = (user: UserPermissionContext | null | undefined): boolean => {
  return isFptTeacherOrAdmin(user);
};

/**
 * Kiểm tra quyền chỉnh sửa một đề thi cụ thể:
 * - Admin: Toàn quyền sửa tất cả các đề.
 * - Giáo viên THPT FPT Cần Thơ: Được sửa tất cả các đề (hệ thống và cá nhân).
 * - Giáo viên thông thường: Chỉ được sửa đề do chính mình tạo ra (teacher_id === user.id).
 */
export const canEditExam = (user: UserPermissionContext | null | undefined, exam: any): boolean => {
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (user.role !== 'teacher') return false;

  // Giáo viên FPT Cần Thơ có quyền biên tập đề hệ thống
  if (isFptTeacherOrAdmin(user)) return true;

  // Giáo viên thông thường chỉ sửa được đề do chính mình tạo
  if (exam) {
    const creatorId = exam.teacher_id || exam.author_id || exam.created_by;
    if (creatorId && String(creatorId) === String(user.id)) {
      return true;
    }
  }

  return false;
};

/**
 * Kiểm tra quyền xóa đề thi (đồng nhất với quyền sửa đề).
 */
export const canDeleteExam = (user: UserPermissionContext | null | undefined, exam: any): boolean => {
  return canEditExam(user, exam);
};

/**
 * Kiểm tra quyền duyệt đề thi do giáo viên tạo/đóng góp:
 * Chỉ Quản trị viên (Admin) hoặc Tổ trưởng/Giáo viên chuyên môn THPT FPT Cần Thơ mới có quyền duyệt đề.
 */
export const canApproveExam = (user: UserPermissionContext | null | undefined): boolean => {
  return isFptTeacherOrAdmin(user);
};

/**
 * Trả về thông tin nhãn vai trò chi tiết để hiển thị đồng bộ trên giao diện.
 */
export const getUserRoleBadgeInfo = (user: UserPermissionContext | null | undefined) => {
  if (!user) {
    return {
      label: 'Khách',
      type: 'guest',
      color: 'slate',
      description: 'Chưa đăng nhập'
    };
  }

  if (user.role === 'admin') {
    return {
      label: 'Quản trị viên Hệ thống',
      shortLabel: 'Admin',
      type: 'admin',
      color: 'rose',
      description: 'Toàn quyền quản trị hệ thống'
    };
  }

  if (user.role === 'teacher') {
    if (isFptTeacherOrAdmin(user)) {
      return {
        label: 'Giáo viên THPT FPT Cần Thơ',
        shortLabel: 'GV FPT Cần Thơ',
        type: 'fpt_teacher',
        color: 'blue',
        description: 'Biên tập đề thi & lý thuyết hệ thống'
      };
    }
    return {
      label: 'Giáo viên Toàn quốc',
      shortLabel: 'GV Toàn quốc',
      type: 'external_teacher',
      color: 'sky',
      description: 'Tạo lớp, tạo đề thi & đóng góp câu hỏi'
    };
  }

  return {
    label: user.school?.includes('FPT') ? 'Học sinh THPT FPT' : 'Học sinh',
    shortLabel: 'Học sinh',
    type: 'student',
    color: 'emerald',
    description: 'Học sinh luyện tập'
  };
};
