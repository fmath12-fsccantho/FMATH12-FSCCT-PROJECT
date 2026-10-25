// src/utils/examMatrixUtils.ts

export interface QuestionMatrixStats {
  total: number;
  byType: {
    mcq: number;
    tf: number;
    saq: number;
  };
  byLevel: {
    'Nhận biết': number;
    'Thông hiểu': number;
    'Vận dụng': number;
    'Vận dụng cao': number;
  };
  crossMatrix: {
    mcq: { 'Nhận biết': number; 'Thông hiểu': number; 'Vận dụng': number; 'Vận dụng cao': number };
    tf: { 'Nhận biết': number; 'Thông hiểu': number; 'Vận dụng': number; 'Vận dụng cao': number };
    saq: { 'Nhận biết': number; 'Thông hiểu': number; 'Vận dụng': number; 'Vận dụng cao': number };
  };
}

export const QUESTION_FORMAT_LABELS: Record<string, { label: string; short: string; badgeClass: string; partName: string }> = {
  mcq: {
    label: 'Trắc nghiệm nhiều lựa chọn',
    short: 'MCQ (Phần I)',
    partName: 'Phần I: 4 Lựa chọn',
    badgeClass: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200/80 dark:border-blue-800'
  },
  tf: {
    label: 'Trắc nghiệm Đúng / Sai',
    short: 'Đúng/Sai (Phần II)',
    partName: 'Phần II: Đúng / Sai',
    badgeClass: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200/80 dark:border-amber-800'
  },
  saq: {
    label: 'Trắc nghiệm Trả lời ngắn',
    short: 'TL Ngắn (Phần III)',
    partName: 'Phần III: Trả lời ngắn',
    badgeClass: 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200/80 dark:border-purple-800'
  }
};

export const COGNITIVE_LEVEL_LABELS: Record<string, { label: string; short: string; badgeClass: string; dotColor: string }> = {
  'Nhận biết': {
    label: 'Nhận biết',
    short: 'NB',
    badgeClass: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800',
    dotColor: 'bg-emerald-500'
  },
  'Thông hiểu': {
    label: 'Thông hiểu',
    short: 'TH',
    badgeClass: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200/80 dark:border-blue-800',
    dotColor: 'bg-blue-500'
  },
  'Vận dụng': {
    label: 'Vận dụng',
    short: 'VD',
    badgeClass: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200/80 dark:border-amber-800',
    dotColor: 'bg-amber-500'
  },
  'Vận dụng cao': {
    label: 'Vận dụng cao',
    short: 'VDC',
    badgeClass: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200/80 dark:border-rose-800',
    dotColor: 'bg-rose-500'
  }
};

export const normalizeQuestionType = (q: any): 'mcq' | 'tf' | 'saq' => {
  if (!q) return 'mcq';
  if (q.type === 'tf') return 'tf';
  if (q.type === 'saq') return 'saq';
  if (q.type === 'mcq') return 'mcq';

  if (typeof q.correct_answer === 'object' && q.correct_answer !== null) return 'tf';
  if (typeof q.correct_answer === 'string') {
    const ca = q.correct_answer.toLowerCase().trim();
    if (ca.includes('true') || ca.includes('false')) return 'tf';
  }
  if (Array.isArray(q.options) && q.options.length > 0) return 'mcq';
  return 'saq';
};

export const normalizeQuestionLevel = (level: string | undefined): 'Nhận biết' | 'Thông hiểu' | 'Vận dụng' | 'Vận dụng cao' => {
  if (!level) return 'Nhận biết';
  const l = String(level).trim().toLowerCase();
  if (l.includes('vận dụng cao') || l === 'vdc' || l.includes('van_dung_cao')) return 'Vận dụng cao';
  if (l.includes('vận dụng') || l === 'vd' || l.includes('van_dung')) return 'Vận dụng';
  if (l.includes('thông hiểu') || l === 'th' || l.includes('thong_hieu')) return 'Thông hiểu';
  return 'Nhận biết';
};

export const calculateQuestionMatrix = (questions: any[]): QuestionMatrixStats => {
  const stats: QuestionMatrixStats = {
    total: questions ? questions.length : 0,
    byType: { mcq: 0, tf: 0, saq: 0 },
    byLevel: { 'Nhận biết': 0, 'Thông hiểu': 0, 'Vận dụng': 0, 'Vận dụng cao': 0 },
    crossMatrix: {
      mcq: { 'Nhận biết': 0, 'Thông hiểu': 0, 'Vận dụng': 0, 'Vận dụng cao': 0 },
      tf: { 'Nhận biết': 0, 'Thông hiểu': 0, 'Vận dụng': 0, 'Vận dụng cao': 0 },
      saq: { 'Nhận biết': 0, 'Thông hiểu': 0, 'Vận dụng': 0, 'Vận dụng cao': 0 },
    }
  };

  if (!questions || questions.length === 0) return stats;

  questions.forEach(q => {
    const qType = normalizeQuestionType(q);
    const qLevel = normalizeQuestionLevel(q.level);

    stats.byType[qType] = (stats.byType[qType] || 0) + 1;
    stats.byLevel[qLevel] = (stats.byLevel[qLevel] || 0) + 1;
    stats.crossMatrix[qType][qLevel] = (stats.crossMatrix[qType][qLevel] || 0) + 1;
  });

  return stats;
};

// Preset ma trận chuẩn GDPT 2018 Bộ GD&ĐT
export const EXAM_MATRIX_PRESETS = [
  {
    id: 'gdpt_2025_standard',
    title: 'Chuẩn Bộ GD&ĐT 2025 (22 câu)',
    description: '12 câu MCQ (Phần I) + 4 câu Đúng/Sai (Phần II) + 6 câu Trả lời ngắn (Phần III)',
    timeLimit: 90,
    total: 22,
    matrix: {
      mcq: { 'Nhận biết': 6, 'Thông hiểu': 4, 'Vận dụng': 2, 'Vận dụng cao': 0 },
      tf: { 'Nhận biết': 1, 'Thông hiểu': 2, 'Vận dụng': 1, 'Vận dụng cao': 0 },
      saq: { 'Nhận biết': 0, 'Thông hiểu': 2, 'Vận dụng': 3, 'Vận dụng cao': 1 },
    }
  },
  {
    id: 'test_45_min',
    title: 'Kiểm tra 45 phút / Giữa kỳ (20 câu)',
    description: '12 câu MCQ + 4 câu Đúng/Sai + 4 câu Trả lời ngắn',
    timeLimit: 45,
    total: 20,
    matrix: {
      mcq: { 'Nhận biết': 6, 'Thông hiểu': 4, 'Vận dụng': 2, 'Vận dụng cao': 0 },
      tf: { 'Nhận biết': 1, 'Thông hiểu': 2, 'Vận dụng': 1, 'Vận dụng cao': 0 },
      saq: { 'Nhận biết': 0, 'Thông hiểu': 2, 'Vận dụng': 2, 'Vận dụng cao': 0 },
    }
  },
  {
    id: 'quick_quiz_15_min',
    title: 'Kiểm tra 15 phút (10 câu)',
    description: '8 câu MCQ + 2 câu Đúng/Sai (hoặc Trả lời ngắn)',
    timeLimit: 15,
    total: 10,
    matrix: {
      mcq: { 'Nhận biết': 5, 'Thông hiểu': 3, 'Vận dụng': 0, 'Vận dụng cao': 0 },
      tf: { 'Nhận biết': 1, 'Thông hiểu': 1, 'Vận dụng': 0, 'Vận dụng cao': 0 },
      saq: { 'Nhận biết': 0, 'Thông hiểu': 0, 'Vận dụng': 0, 'Vận dụng cao': 0 },
    }
  },
  {
    id: 'mcq_practice_40',
    title: 'Luyện tập Trắc nghiệm 40 câu',
    description: '40 câu Trắc nghiệm 4 lựa chọn đủ 4 mức độ năng lực',
    timeLimit: 50,
    total: 40,
    matrix: {
      mcq: { 'Nhận biết': 16, 'Thông hiểu': 14, 'Vận dụng': 8, 'Vận dụng cao': 2 },
      tf: { 'Nhận biết': 0, 'Thông hiểu': 0, 'Vận dụng': 0, 'Vận dụng cao': 0 },
      saq: { 'Nhận biết': 0, 'Thông hiểu': 0, 'Vận dụng': 0, 'Vận dụng cao': 0 },
    }
  }
];

// Hàm bốc câu hỏi từ kho theo ma trận số lượng mong muốn
export const pickQuestionsByMatrix = (
  allQuestions: any[],
  targetMatrix: {
    mcq: Record<string, number>;
    tf: Record<string, number>;
    saq: Record<string, number>;
  }
): { picked: any[]; report: { requested: number; obtained: number; details: string[] } } => {
  const picked: any[] = [];
  const details: string[] = [];
  let totalRequested = 0;

  // Xáo trộn ngẫu nhiên toàn bộ câu hỏi trước khi phân loại
  const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());

  // Nhóm câu hỏi theo dạng thức và mức độ
  const buckets: Record<string, Record<string, any[]>> = {
    mcq: { 'Nhận biết': [], 'Thông hiểu': [], 'Vận dụng': [], 'Vận dụng cao': [] },
    tf: { 'Nhận biết': [], 'Thông hiểu': [], 'Vận dụng': [], 'Vận dụng cao': [] },
    saq: { 'Nhận biết': [], 'Thông hiểu': [], 'Vận dụng': [], 'Vận dụng cao': [] },
  };

  shuffled.forEach(q => {
    const qType = normalizeQuestionType(q);
    const qLevel = normalizeQuestionLevel(q.level);
    if (buckets[qType] && buckets[qType][qLevel]) {
      buckets[qType][qLevel].push(q);
    }
  });

  const types = ['mcq', 'tf', 'saq'] as const;
  const levels = ['Nhận biết', 'Thông hiểu', 'Vận dụng', 'Vận dụng cao'] as const;

  types.forEach(t => {
    levels.forEach(lvl => {
      const needed = targetMatrix[t]?.[lvl] || 0;
      if (needed <= 0) return;
      totalRequested += needed;

      const availablePool = buckets[t][lvl];
      const takeCount = Math.min(needed, availablePool.length);
      const chosen = availablePool.slice(0, takeCount);
      picked.push(...chosen);

      const typeShort = QUESTION_FORMAT_LABELS[t].short;
      const levelShort = COGNITIVE_LEVEL_LABELS[lvl].short;

      if (takeCount < needed) {
        details.push(`[${typeShort} - ${levelShort}]: Chỉ có ${takeCount}/${needed} câu trong kho`);
      } else {
        details.push(`[${typeShort} - ${levelShort}]: Đã chọn đủ ${takeCount}/${needed} câu`);
      }
    });
  });

  return {
    picked,
    report: {
      requested: totalRequested,
      obtained: picked.length,
      details
    }
  };
};
