/**
 * BỘ 14 ĐỀ THI BỔ SUNG CHUẨN GDPT 2018 & CÁC TRƯỜNG CHUYÊN / SỞ GIÁO DỤC
 * Giúp tổng số đề thi trong hệ thống đạt chuẩn 62 đề (nằm trong tầm 50 - 68 đề).
 */

export interface SystemExamItem {
  id: string;
  title: string;
  type: string;
  group_name: string;
  time_limit: number;
  status: string;
  questionsCount: number;
  created_at: string;
  teacher_id: string;
  author: {
    id: string;
    full_name: string;
    email: string;
    school: string;
  };
  mockAttempts?: number;
  mockAvgScore?: number;
  mockMaxScore?: number;
}

export const SUPPLEMENTAL_SYSTEM_EXAMS: SystemExamItem[] = [
  {
    id: 'sys-exam-bgd-2026-01',
    title: 'ĐỀ MINH HỌA TỐT NGHIỆP THPT 2026 - BỘ GIÁO DỤC VÀ ĐÀO TẠO',
    type: 'Đề luyện thi',
    group_name: 'BỘ GIÁO DỤC 2026',
    time_limit: 5400, // 90 phút
    status: 'active',
    questionsCount: 34,
    created_at: '2026-03-15T08:00:00.000Z',
    teacher_id: 'ba4093ca-5e8e-4347-a015-f075f3e21fad',
    author: {
      id: 'ba4093ca-5e8e-4347-a015-f075f3e21fad',
      full_name: 'Hội đồng Khảo thí BGD & FMATH12',
      email: 'khaothi@fmath12.edu.vn',
      school: 'Bộ Giáo dục & Đào tạo'
    },
    mockAttempts: 412,
    mockAvgScore: 7.42,
    mockMaxScore: 10.0
  },
  {
    id: 'sys-exam-so-hanoi-2026',
    title: 'ĐỀ KHẢO SÁT CHẤT LƯỢNG TOÁN 12 - SỞ GD&ĐT HÀ NỘI 2026',
    type: 'Đề luyện thi',
    group_name: 'BỘ ĐỀ SỞ GIÁO DỤC',
    time_limit: 5400,
    status: 'active',
    questionsCount: 34,
    created_at: '2026-03-20T08:00:00.000Z',
    teacher_id: 'ba4093ca-5e8e-4347-a015-f075f3e21fad',
    author: {
      id: 'ba4093ca-5e8e-4347-a015-f075f3e21fad',
      full_name: 'Sở GD&ĐT Hà Nội',
      email: 'sogd_hanoi@moet.edu.vn',
      school: 'Sở GD&ĐT Hà Nội'
    },
    mockAttempts: 328,
    mockAvgScore: 7.18,
    mockMaxScore: 9.8
  },
  {
    id: 'sys-exam-so-hcm-2026',
    title: 'ĐỀ KHẢO SÁT CHẤT LƯỢNG TOÁN 12 - SỞ GD&ĐT TP. HỒ CHÍ MINH 2026',
    type: 'Đề luyện thi',
    group_name: 'BỘ ĐỀ SỞ GIÁO DỤC',
    time_limit: 5400,
    status: 'active',
    questionsCount: 34,
    created_at: '2026-03-22T08:00:00.000Z',
    teacher_id: 'ba4093ca-5e8e-4347-a015-f075f3e21fad',
    author: {
      id: 'ba4093ca-5e8e-4347-a015-f075f3e21fad',
      full_name: 'Sở GD&ĐT TP. Hồ Chí Minh',
      email: 'sogd_hcm@moet.edu.vn',
      school: 'Sở GD&ĐT TP. Hồ Chí Minh'
    },
    mockAttempts: 295,
    mockAvgScore: 7.35,
    mockMaxScore: 9.75
  },
  {
    id: 'sys-exam-chuyen-lamson-2026',
    title: 'ĐỀ THI THỬ TỐT NGHIỆP THPT - THPT CHUYÊN LAM SƠN (THANH HÓA)',
    type: 'Đề luyện thi',
    group_name: 'TRƯỜNG CHUYÊN TOÀN QUỐC',
    time_limit: 5400,
    status: 'active',
    questionsCount: 34,
    created_at: '2026-03-25T08:00:00.000Z',
    teacher_id: 'ba4093ca-5e8e-4347-a015-f075f3e21fad',
    author: {
      id: 'ba4093ca-5e8e-4347-a015-f075f3e21fad',
      full_name: 'Tổ Toán - THPT Chuyên Lam Sơn',
      email: 'toan.lamson@edu.vn',
      school: 'THPT Chuyên Lam Sơn'
    },
    mockAttempts: 210,
    mockAvgScore: 6.85,
    mockMaxScore: 9.6
  },
  {
    id: 'sys-exam-chuyen-amsterdam-2026',
    title: 'ĐỀ THI THỬ TỐT NGHIỆP THPT - THPT CHUYÊN HÀ NỘI - AMSTERDAM',
    type: 'Đề luyện thi',
    group_name: 'TRƯỜNG CHUYÊN TOÀN QUỐC',
    time_limit: 5400,
    status: 'active',
    questionsCount: 34,
    created_at: '2026-03-28T08:00:00.000Z',
    teacher_id: 'ba4093ca-5e8e-4347-a015-f075f3e21fad',
    author: {
      id: 'ba4093ca-5e8e-4347-a015-f075f3e21fad',
      full_name: 'Tổ Toán - THPT Chuyên HN-Amsterdam',
      email: 'toan.ams@edu.vn',
      school: 'THPT Chuyên Hà Nội - Amsterdam'
    },
    mockAttempts: 245,
    mockAvgScore: 6.95,
    mockMaxScore: 9.85
  },
  {
    id: 'sys-exam-chuyen-phanboichau-2026',
    title: 'ĐỀ THI THỬ TỐT NGHIỆP THPT - THPT CHUYÊN PHAN BỘI CHÂU (NGHỆ AN)',
    type: 'Đề luyện thi',
    group_name: 'TRƯỜNG CHUYÊN TOÀN QUỐC',
    time_limit: 5400,
    status: 'active',
    questionsCount: 34,
    created_at: '2026-04-01T08:00:00.000Z',
    teacher_id: 'ba4093ca-5e8e-4347-a015-f075f3e21fad',
    author: {
      id: 'ba4093ca-5e8e-4347-a015-f075f3e21fad',
      full_name: 'Tổ Toán - THPT Chuyên Phan Bội Châu',
      email: 'toan.pbc@edu.vn',
      school: 'THPT Chuyên Phan Bội Châu'
    },
    mockAttempts: 188,
    mockAvgScore: 6.72,
    mockMaxScore: 9.5
  },
  {
    id: 'sys-exam-chuyen-lehongphong-2026',
    title: 'ĐỀ THI THỬ TỐT NGHIỆP THPT - THPT CHUYÊN LÊ HỒNG PHONG (NAM ĐỊNH)',
    type: 'Đề luyện thi',
    group_name: 'TRƯỜNG CHUYÊN TOÀN QUỐC',
    time_limit: 5400,
    status: 'active',
    questionsCount: 34,
    created_at: '2026-04-03T08:00:00.000Z',
    teacher_id: 'ba4093ca-5e8e-4347-a015-f075f3e21fad',
    author: {
      id: 'ba4093ca-5e8e-4347-a015-f075f3e21fad',
      full_name: 'Tổ Toán - THPT Chuyên Lê Hồng Phong',
      email: 'toan.lhp@edu.vn',
      school: 'THPT Chuyên Lê Hồng Phong'
    },
    mockAttempts: 176,
    mockAvgScore: 6.92,
    mockMaxScore: 9.65
  },
  {
    id: 'sys-exam-chuyen-quochoc-2026',
    title: 'ĐỀ THI THỬ TỐT NGHIỆP THPT - THPT CHUYÊN QUỐC HỌC HUẾ',
    type: 'Đề luyện thi',
    group_name: 'TRƯỜNG CHUYÊN TOÀN QUỐC',
    time_limit: 5400,
    status: 'active',
    questionsCount: 34,
    created_at: '2026-04-05T08:00:00.000Z',
    teacher_id: 'ba4093ca-5e8e-4347-a015-f075f3e21fad',
    author: {
      id: 'ba4093ca-5e8e-4347-a015-f075f3e21fad',
      full_name: 'Tổ Toán - THPT Chuyên Quốc Học Huế',
      email: 'toan.quochoc@edu.vn',
      school: 'THPT Chuyên Quốc Học Huế'
    },
    mockAttempts: 194,
    mockAvgScore: 7.05,
    mockMaxScore: 9.7
  },
  {
    id: 'sys-exam-dgnl-hsa-2026',
    title: 'ĐỀ ĐÁNH GIÁ NĂNG LỰC (HSA) - ĐẠI HỌC QUỐC GIA HÀ NỘI 2026',
    type: 'VSAT',
    group_name: 'ĐÁNH GIÁ NĂNG LỰC',
    time_limit: 4500, // 75 phút
    status: 'active',
    questionsCount: 50,
    created_at: '2026-04-08T08:00:00.000Z',
    teacher_id: 'ba4093ca-5e8e-4347-a015-f075f3e21fad',
    author: {
      id: 'ba4093ca-5e8e-4347-a015-f075f3e21fad',
      full_name: 'Trung tâm Khảo thí ĐHQG Hà Nội',
      email: 'hsa@vnu.edu.vn',
      school: 'ĐHQG Hà Nội'
    },
    mockAttempts: 340,
    mockAvgScore: 7.22,
    mockMaxScore: 9.8
  },
  {
    id: 'sys-exam-dgnl-apt-2026',
    title: 'ĐỀ ĐÁNH GIÁ NĂNG LỰC (APT) - ĐẠI HỌC QUỐC GIA TP.HCM 2026',
    type: 'VSAT',
    group_name: 'ĐÁNH GIÁ NĂNG LỰC',
    time_limit: 3600, // 60 phút
    status: 'active',
    questionsCount: 30,
    created_at: '2026-04-10T08:00:00.000Z',
    teacher_id: 'ba4093ca-5e8e-4347-a015-f075f3e21fad',
    author: {
      id: 'ba4093ca-5e8e-4347-a015-f075f3e21fad',
      full_name: 'Trung tâm Khảo thí ĐHQG TP.HCM',
      email: 'cet@vnuhcm.edu.vn',
      school: 'ĐHQG TP.HCM'
    },
    mockAttempts: 315,
    mockAvgScore: 7.38,
    mockMaxScore: 9.75
  },
  {
    id: 'sys-exam-dgtd-tsa-2026',
    title: 'ĐỀ ĐÁNH GIÁ TƯ DUY (TSA) - ĐẠI HỌC BÁCH KHOA HÀ NỘI 2026',
    type: 'VSAT',
    group_name: 'ĐÁNH GIÁ TƯ DUY',
    time_limit: 3600, // 60 phút
    status: 'active',
    questionsCount: 40,
    created_at: '2026-04-12T08:00:00.000Z',
    teacher_id: 'ba4093ca-5e8e-4347-a015-f075f3e21fad',
    author: {
      id: 'ba4093ca-5e8e-4347-a015-f075f3e21fad',
      full_name: 'Hội đồng Tuyển sinh ĐH Bách Khoa HN',
      email: 'tsa@hust.edu.vn',
      school: 'Đại học Bách Khoa Hà Nội'
    },
    mockAttempts: 260,
    mockAvgScore: 6.64,
    mockMaxScore: 9.4
  },
  {
    id: 'sys-exam-fpt-cantho-dot1',
    title: 'ĐỀ KHẢO SÁT NĂNG LỰC TOÁN 12 - THPT FPT TOÀN QUỐC (ĐỢT 1)',
    type: 'Đề luyện thi',
    group_name: 'FPT EDUCATION',
    time_limit: 5400,
    status: 'active',
    questionsCount: 34,
    created_at: '2026-04-15T08:00:00.000Z',
    teacher_id: 'ba4093ca-5e8e-4347-a015-f075f3e21fad',
    author: {
      id: 'ba4093ca-5e8e-4347-a015-f075f3e21fad',
      full_name: 'Tổ Tự Nhiên - THPT FPT Cần Thơ',
      email: 'fsc.cantho@fe.edu.vn',
      school: 'THPT FPT Cần Thơ'
    },
    mockAttempts: 520,
    mockAvgScore: 7.68,
    mockMaxScore: 10.0
  },
  {
    id: 'sys-exam-fpt-cantho-dot2',
    title: 'ĐỀ KHẢO SÁT NĂNG LỰC TOÁN 12 - THPT FPT TOÀN QUỐC (ĐỢT 2)',
    type: 'Đề luyện thi',
    group_name: 'FPT EDUCATION',
    time_limit: 5400,
    status: 'active',
    questionsCount: 34,
    created_at: '2026-04-18T08:00:00.000Z',
    teacher_id: 'ba4093ca-5e8e-4347-a015-f075f3e21fad',
    author: {
      id: 'ba4093ca-5e8e-4347-a015-f075f3e21fad',
      full_name: 'Tổ Tự Nhiên - THPT FPT Cần Thơ',
      email: 'fsc.cantho@fe.edu.vn',
      school: 'THPT FPT Cần Thơ'
    },
    mockAttempts: 485,
    mockAvgScore: 7.55,
    mockMaxScore: 9.9
  },
  {
    id: 'sys-exam-toiuu-thuctien-2026',
    title: 'ĐỀ RÈN LUYỆN TOÁN TỐI ƯU & MÔ HÌNH HÓA THỰC TIỄN 2026',
    type: 'Đề luyện thi',
    group_name: 'TOÁN THỰC TIỄN & LIÊN MÔN',
    time_limit: 3600, // 60 phút
    status: 'active',
    questionsCount: 22,
    created_at: '2026-04-20T08:00:00.000Z',
    teacher_id: 'ba4093ca-5e8e-4347-a015-f075f3e21fad',
    author: {
      id: 'ba4093ca-5e8e-4347-a015-f075f3e21fad',
      full_name: 'Ban Chuyên môn FMATH12 PRO',
      email: 'chuyenmon@fmath12.edu.vn',
      school: 'THPT FPT Cần Thơ'
    },
    mockAttempts: 375,
    mockAvgScore: 7.28,
    mockMaxScore: 9.8
  }
];

export const TOTAL_SYSTEM_EXAMS_TARGET = 62;
