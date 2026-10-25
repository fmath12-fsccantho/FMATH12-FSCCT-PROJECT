import { askGroqAI } from './groqAI';
import { CURRICULUM_PROMPT_TEXT } from '../config/curriculumFramework';
import { supabase } from '../config/supabase';

export interface QuestionAnalysisResult {
  questionId?: string;
  index?: number;
  level: 'Nhận biết' | 'Thông hiểu' | 'Vận dụng' | 'Vận dụng cao';
  levelExplanation: string;
  domain: string; // VD: "I. MỘT SỐ YẾU TỐ GIẢI TÍCH"
  topic: string;  // VD: "1. Ứng dụng đạo hàm để khảo sát và vẽ đồ thị của hàm số"
  subTopic: string; // VD: "1.3. Khảo sát và vẽ đồ thị của hàm số"
  competency: string; // VD: "Nhận biết hình ảnh hình học của đường tiệm cận..."
  trapsAndMistakes?: string;
  solutionHint?: string;
}

export interface ExamMatrixSummary {
  totalQuestions: number;
  levels: {
    nb: number; // Nhận biết
    th: number; // Thông hiểu
    vd: number; // Vận dụng
    vdc: number; // Vận dụng cao
  };
  levelPercentages: {
    nb: number;
    th: number;
    vd: number;
    vdc: number;
  };
  domains: { [domain: string]: number };
  topics: { [topic: string]: number };
  standardCompliance: string;
  recommendation: string;
}

export const questionAiAnalyzer = {
  /**
   * Phân tích câu hỏi Toán 12 theo khung chuẩn GDPT 2018 bằng AI THẬT
   */
  async analyzeQuestion(question: {
    content: string;
    options?: any[];
    correct_answer?: any;
    explanation?: string;
    type?: string;
  }): Promise<QuestionAnalysisResult> {
    const prompt = `Dưới đây là một câu hỏi môn Toán lớp 12:

[ĐỀ BÀI CÂU HỎI]:
${question.content}

${question.options && question.options.length > 0 ? `[CÁC LỰA CHỌN]:\n${question.options.map((o: any) => `${o.id || o.label || '-'}: ${o.text || o}`).join('\n')}` : ''}
${question.correct_answer ? `[ĐÁP ÁN ĐÚNG]: ${typeof question.correct_answer === 'object' ? JSON.stringify(question.correct_answer) : question.correct_answer}` : ''}
${question.explanation ? `[LỜI GIẢI THAM KHẢO]: ${question.explanation}` : ''}

DỰA TRÊN KHUNG KIẾN THỨC VÀ TIÊU CHUẨN ĐÁNH GIÁ SAU ĐÂY:
${CURRICULUM_PROMPT_TEXT}

NHIỆM VỤ CỦA BẠN:
1. Phân loại câu hỏi thuộc mức độ nhận thức nào trong 4 mức: "Nhận biết", "Thông hiểu", "Vận dụng", hoặc "Vận dụng cao".
2. Giải thích ngắn gọn (1-2 câu) lý do xếp vào mức độ này.
3. Xác định câu hỏi nằm ở phần nào (domain), chuyên đề nào (topic), mục kiến thức chi tiết nào (subTopic) và tiêu chí/năng lực cụ thể (competency) theo đúng khung trên.
4. Chỉ ra 1 bẫy sai lầm phổ biến học sinh hay mắc ở câu này.
5. Gợi mở hướng giải ngắn gọn (1-2 bước).

BẮT BUỘC TRẢ VỀ DUY NHẤT 1 ĐỐI TƯỢNG JSON (không có markdown code block, không có lời dẫn):
{
  "level": "Nhận biết" | "Thông hiểu" | "Vận dụng" | "Vận dụng cao",
  "levelExplanation": "Lý giải ngắn gọn",
  "domain": "I. MỘT SỐ YẾU TỐ GIẢI TÍCH" hoặc "II. HÌNH HỌC VÀ ĐO LƯỜNG (Oxyz)" hoặc "III. THỐNG KÊ VÀ XÁC SUẤT" hoặc "IV. THỰC HÀNH PHẦN MỀM & TRẢI NGHIỆM",
  "topic": "Tên chuyên đề chính",
  "subTopic": "Tên mục kiến thức chi tiết (ví dụ: 1.1. Tính đơn điệu và Cực trị)",
  "competency": "Tiêu chí kỹ năng học sinh cần đạt",
  "trapsAndMistakes": "Bẫy học sinh hay nhầm lẫn",
  "solutionHint": "Gợi ý hướng xử lý then chốt"
}`;

    const systemPrompt = "Bạn là Chuyên gia Khảo thí và Giảng dạy Toán học THPT của Bộ GD&ĐT Việt Nam. Bạn có khả năng phân tích ma trận đề thi và định vị chuẩn xác câu hỏi vào khung kiến thức GDPT 2018. Bạn chỉ trả về JSON thuần túy.";

    try {
      const responseText = await askGroqAI(systemPrompt, prompt, true, undefined, {
        isInternal: true,
        model: 'llama-3.1-8b-instant'
      });
      if (responseText) {
        let cleanText = responseText.trim();
        if (cleanText.startsWith('```')) {
          cleanText = cleanText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
        }
        const parsed = JSON.parse(cleanText);
        return {
          level: parsed.level || 'Thông hiểu',
          levelExplanation: parsed.levelExplanation || 'Câu hỏi đòi hỏi hiểu và áp dụng kiến thức trọng tâm.',
          domain: parsed.domain || 'I. MỘT SỐ YẾU TỐ GIẢI TÍCH',
          topic: parsed.topic || 'Ứng dụng đạo hàm để khảo sát hàm số',
          subTopic: parsed.subTopic || 'Khảo sát và vẽ đồ thị hàm số',
          competency: parsed.competency || 'Vận dụng kiến thức trọng tâm giải toán.',
          trapsAndMistakes: parsed.trapsAndMistakes || '',
          solutionHint: parsed.solutionHint || ''
        };
      }
    } catch (err) {
      console.warn("Lỗi phân tích AI, áp dụng phân tích dự phòng từ khóa:", err);
    }

    return this.fallbackAnalyze(question.content);
  },

  /**
   * Phân tích tức thì dựa trên từ khóa Toán học (Fallback dự phòng & Tốc độ cao)
   */
  fallbackAnalyze(content: string): QuestionAnalysisResult {
    const text = (content || '').toLowerCase();

    // 1. Oxyz
    if (text.includes('oxyz') || text.includes('mặt phẳng') || text.includes('mặt cầu') || text.includes('vectơ') || text.includes('đường thẳng') || text.includes('tọa độ không gian')) {
      if (text.includes('mặt cầu')) {
        return {
          level: text.includes('tiếp xúc') || text.includes('cực trị') || text.includes('tham số') ? 'Vận dụng' : 'Thông hiểu',
          levelExplanation: 'Câu hỏi về phương trình mặt cầu trong không gian Oxyz.',
          domain: 'II. HÌNH HỌC VÀ ĐO LƯỜNG (Oxyz)',
          topic: '4. Phương trình mặt cầu',
          subTopic: '4. Phương trình mặt cầu',
          competency: 'Xác định tâm, bán kính và thiết lập phương trình mặt cầu.',
          trapsAndMistakes: 'Nhầm dấu tọa độ tâm khi chuyển từ dạng phương trình khai triển.',
          solutionHint: 'Đưa phương trình về dạng chính tắc để đọc tọa độ tâm I và bán kính R.'
        };
      }
      return {
        level: text.includes('góc') || text.includes('khoảng cách') || text.includes('cắt nhau') ? 'Vận dụng' : 'Thông hiểu',
        levelExplanation: 'Câu hỏi về hình học giải tích không gian Oxyz.',
        domain: 'II. HÌNH HỌC VÀ ĐO LƯỜNG (Oxyz)',
        topic: '2. Phương trình mặt phẳng & Đường thẳng',
        subTopic: 'Phương trình và quan hệ không gian',
        competency: 'Thiết lập phương trình và xác định vị trí tương đối.',
        trapsAndMistakes: 'Nhầm lẫn giữa vectơ pháp tuyến của mặt phẳng và vectơ chỉ phương của đường thẳng.',
        solutionHint: 'Xác định rõ VTPT/VTCP và điểm đi qua.'
      };
    }

    // 2. Thống kê & Xác suất
    if (text.includes('xác suất') || text.includes('bayes') || text.includes('điều kiện') || text.includes('ghép nhóm') || text.includes('phương sai') || text.includes('độ lệch chuẩn') || text.includes('khoảng biến thiên') || text.includes('tứ phân vị')) {
      if (text.includes('xác suất') || text.includes('bayes') || text.includes('toàn phần')) {
        return {
          level: text.includes('bayes') || text.includes('toàn phần') ? 'Vận dụng' : 'Thông hiểu',
          levelExplanation: 'Câu hỏi thuộc chuyên đề Xác suất có điều kiện chuẩn GDPT mới.',
          domain: 'III. THỐNG KÊ VÀ XÁC SUẤT',
          topic: '2. Xác suất có điều kiện',
          subTopic: '2.2. Các quy tắc tính xác suất (Bayes)',
          competency: 'Sử dụng công thức xác suất toàn phần và công thức Bayes.',
          trapsAndMistakes: 'Nhầm lẫn giữa P(A|B) và P(B|A).',
          solutionHint: 'Vẽ sơ đồ hình cây để trực quan hóa các nhánh xác suất.'
        };
      }
      return {
        level: 'Thông hiểu',
        levelExplanation: 'Câu hỏi tính các số đặc trưng đo mức độ phân tán của mẫu số liệu ghép nhóm.',
        domain: 'III. THỐNG KÊ VÀ XÁC SUẤT',
        topic: '1. Thống kê ghép nhóm',
        subTopic: '1.1. Các số đặc trưng của mẫu số liệu ghép nhóm',
        competency: 'Tính khoảng tứ phân vị, phương sai và độ lệch chuẩn.',
        trapsAndMistakes: 'Nhầm công thức độ lệch chuẩn và phương sai (quên căn bậc hai).',
        solutionHint: 'Lập bảng tần số và giá trị đại diện cho từng nhóm số liệu.'
      };
    }

    // 3. Nguyên hàm & Tích phân
    if (text.includes('nguyên hàm') || text.includes('tích phân') || text.includes('diện tích hình phẳng') || text.includes('thể tích khối tròn xoay')) {
      return {
        level: text.includes('diện tích') || text.includes('thể tích') || text.includes('thực tiễn') ? 'Vận dụng' : 'Thông hiểu',
        levelExplanation: 'Câu hỏi về giải tích nguyên hàm và tích phân.',
        domain: 'I. MỘT SỐ YẾU TỐ GIẢI TÍCH',
        topic: '2. Nguyên hàm và Tích phân',
        subTopic: '2.2. Tích phân và Ứng dụng hình học của tích phân',
        competency: 'Ứng dụng tích phân tính diện tích, thể tích khối tròn xoay.',
        trapsAndMistakes: 'Quên trị tuyệt đối khi tính diện tích hình phẳng giới hạn bởi 2 đồ thị.',
        solutionHint: 'Tìm hoành độ giao điểm rồi áp dụng công thức tích phân tính diện tích.'
      };
    }

    // 4. Mặc định: Đạo hàm & Khảo sát hàm số
    const isVDC = text.includes('có bao nhiêu giá trị nguyên') || text.includes('tham số m') || text.includes('đồng biến trên khoảng');
    const isNB = text.includes('tiệm cận đứng') || text.includes('tiệm cận ngang') || text.includes('điểm cực đại') || text.includes('điểm cực tiểu');
    return {
      level: isVDC ? 'Vận dụng cao' : isNB ? 'Nhận biết' : 'Thông hiểu',
      levelExplanation: 'Câu hỏi ứng dụng đạo hàm để khảo sát tính chất của hàm số.',
      domain: 'I. MỘT SỐ YẾU TỐ GIẢI TÍCH',
      topic: '1. Ứng dụng đạo hàm để khảo sát hàm số',
      subTopic: '1.1. Tính đơn điệu và Cực trị của hàm số',
      competency: 'Nhận biết tính đơn điệu, cực trị qua bảng biến thiên hoặc đồ thị.',
      trapsAndMistakes: 'Nhầm giữa giá trị cực trị (y) và điểm cực trị của hàm số (x).',
      solutionHint: 'Xét dấu đạo hàm f\'(x) hoặc đọc trực tiếp từ bảng biến thiên.'
    };
  },

  /**
   * PHÂN TÍCH TOÀN BỘ CÂU HỎI TRONG BÀI/ĐỀ THI SIÊU TỐC ("NHANH LUÔN")
   * Xử lý song song theo khối với cơ chế Multi-key Groq + Heuristic Fallback
   */
  async batchAnalyzeExamQuestions(
    questions: any[],
    onProgress?: (processed: number, total: number) => void
  ): Promise<{ results: QuestionAnalysisResult[]; matrix: ExamMatrixSummary }> {
    if (!questions || questions.length === 0) {
      return {
        results: [],
        matrix: {
          totalQuestions: 0,
          levels: { nb: 0, th: 0, vd: 0, vdc: 0 },
          levelPercentages: { nb: 0, th: 0, vd: 0, vdc: 0 },
          domains: {},
          topics: {},
          standardCompliance: 'Chưa có câu hỏi',
          recommendation: 'Đề thi chưa có câu hỏi nào để phân tích.'
        }
      };
    }

    const total = questions.length;
    let completedCount = 0;
    const results: QuestionAnalysisResult[] = new Array(total);

    // Gom câu hỏi thành các nhóm 5 câu để phân tích đồng thời
    const CHUNK_SIZE = 5;
    const chunks: Array<{ chunkIndex: number; items: Array<{ globalIndex: number; q: any }> }> = [];

    for (let i = 0; i < total; i += CHUNK_SIZE) {
      const slice = questions.slice(i, i + CHUNK_SIZE).map((q, idx) => ({
        globalIndex: i + idx,
        q
      }));
      chunks.push({ chunkIndex: Math.floor(i / CHUNK_SIZE), items: slice });
    }

    // Xử lý từng khối câu hỏi bằng AI
    const processChunk = async (chunk: { chunkIndex: number; items: Array<{ globalIndex: number; q: any }> }) => {
      const promptItems = chunk.items.map((item, idx) => {
        const q = item.q;
        return `[CÂU ${idx + 1}]:
${q.content || ''}
${q.options && q.options.length > 0 ? `Lựa chọn: ${(q.options || []).map((o: any) => `${o.id || o.label || '-'}: ${o.text || o}`).join(', ')}` : ''}
${q.correct_answer ? `Đáp án: ${typeof q.correct_answer === 'object' ? JSON.stringify(q.correct_answer) : q.correct_answer}` : ''}`;
      }).join('\n---\n');

      const systemPrompt = `Bạn là Chuyên gia Khảo thí GDPT 2018 môn Toán 12. Phân tích nhanh danh sách các câu hỏi sau và trả về DUY NHẤT một mảng JSON:
[
  {
    "index": 1,
    "level": "Nhận biết" | "Thông hiểu" | "Vận dụng" | "Vận dụng cao",
    "levelExplanation": "Lý giải ngắn gọn 1 câu",
    "domain": "I. MỘT SỐ YẾU TỐ GIẢI TÍCH" | "II. HÌNH HỌC VÀ ĐO LƯỜNG (Oxyz)" | "III. THỐNG KÊ VÀ XÁC SUẤT" | "IV. THỰC HÀNH",
    "topic": "Tên chuyên đề chính",
    "subTopic": "Mục chi tiết",
    "competency": "Năng lực cần đạt",
    "trapsAndMistakes": "1 bẫy học sinh hay mắc",
    "solutionHint": "1 bước then chốt để giải nhanh"
  }
]`;

      try {
        const responseText = await askGroqAI(systemPrompt, promptItems, true, undefined, {
          model: 'llama-3.1-8b-instant',
          isInternal: true
        });
        if (responseText) {
          let clean = responseText.trim();
          if (clean.startsWith('```')) {
            clean = clean.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
          }
          const parsed = JSON.parse(clean);
          if (Array.isArray(parsed)) {
            parsed.forEach((res: any, idx: number) => {
              if (idx < chunk.items.length) {
                const target = chunk.items[idx];
                results[target.globalIndex] = {
                  questionId: target.q.id,
                  index: target.globalIndex + 1,
                  level: res.level || 'Thông hiểu',
                  levelExplanation: res.levelExplanation || 'Đòi hỏi nắm vững kiến thức trọng tâm.',
                  domain: res.domain || 'I. MỘT SỐ YẾU TỐ GIẢI TÍCH',
                  topic: res.topic || 'Ứng dụng đạo hàm khảo sát hàm số',
                  subTopic: res.subTopic || 'Kiến thức trọng tâm',
                  competency: res.competency || 'Vận dụng kiến thức giải toán',
                  trapsAndMistakes: res.trapsAndMistakes || '',
                  solutionHint: res.solutionHint || ''
                };
              }
            });
          }
        }
      } catch (err) {
        console.warn("Lỗi phân tích chunk AI, chuyển sang phân tích từ khóa dự phòng tức thì:", err);
      }

      // Đảm bảo mọi câu hỏi trong chunk đều có kết quả (nếu AI sót hoặc lỗi thì dùng fallback)
      chunk.items.forEach(item => {
        if (!results[item.globalIndex]) {
          const fallback = questionAiAnalyzer.fallbackAnalyze(item.q.content || '');
          results[item.globalIndex] = {
            ...fallback,
            questionId: item.q.id,
            index: item.globalIndex + 1
          };
        }
        completedCount++;
        if (onProgress) {
          onProgress(completedCount, total);
        }
      });
    };

    // Chạy các khối câu hỏi theo từng đợt (Concurrency: 2) kèm khoảng nghỉ 100ms
    // Giúp tối ưu hóa tốc độ cao nhưng tuyệt đối không làm quá tải giới hạn token (TPM)
    const CONCURRENCY = 2;
    for (let i = 0; i < chunks.length; i += CONCURRENCY) {
      const batch = chunks.slice(i, i + CONCURRENCY);
      await Promise.all(batch.map(chunk => processChunk(chunk)));
      if (i + CONCURRENCY < chunks.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Tính toán Thống kê Ma trận đề thi (Matrix Summary)
    const levels = { nb: 0, th: 0, vd: 0, vdc: 0 };
    const domains: { [domain: string]: number } = {};
    const topics: { [topic: string]: number } = {};

    results.forEach(r => {
      if (!r) return;
      if (r.level === 'Nhận biết') levels.nb++;
      else if (r.level === 'Thông hiểu') levels.th++;
      else if (r.level === 'Vận dụng') levels.vd++;
      else if (r.level === 'Vận dụng cao') levels.vdc++;

      const d = r.domain || 'I. MỘT SỐ YẾU TỐ GIẢI TÍCH';
      domains[d] = (domains[d] || 0) + 1;

      const t = r.topic || 'Chuyên đề chung';
      topics[t] = (topics[t] || 0) + 1;
    });

    const levelPercentages = {
      nb: Math.round((levels.nb / total) * 100),
      th: Math.round((levels.th / total) * 100),
      vd: Math.round((levels.vd / total) * 100),
      vdc: Math.round((levels.vdc / total) * 100)
    };

    // Đánh giá chuẩn GDPT 2018
    let standardCompliance = 'Chuẩn phân hóa Đề thi Tốt nghiệp THPT 2026';
    let recommendation = 'Đề thi có tỉ lệ phân bổ hợp lý giữa các mức độ nhận thức.';

    if (total === 22 || total === 34) {
      standardCompliance = `Chuẩn cấu trúc Đề thi Mới của Bộ GD&ĐT (${total} câu)`;
    } else if (total === 40 || total === 50) {
      standardCompliance = `Chuẩn đề trắc nghiệm truyền thống (${total} câu)`;
    }

    if (levelPercentages.nb + levelPercentages.th > 75) {
      recommendation = 'Đề thi hơi nghiêng về mức độ cơ bản. Có thể bổ sung thêm 2-3 câu Vận dụng thực tiễn để tăng độ phân hóa.';
    } else if (levelPercentages.vd + levelPercentages.vdc > 50) {
      recommendation = 'Đề thi có độ khó cao, phù hợp để ôn thi học sinh giỏi hoặc phân loại các mốc 8.5 - 10 điểm.';
    }

    const matrix: ExamMatrixSummary = {
      totalQuestions: total,
      levels,
      levelPercentages,
      domains,
      topics,
      standardCompliance,
      recommendation
    };

    return { results, matrix };
  },

  /**
   * Lưu nhanh kết quả phân tích mức độ vào cơ sở dữ liệu Supabase
   */
  async saveAnalysisToExercises(results: QuestionAnalysisResult[]) {
    try {
      const updates = results
        .filter(r => r.questionId)
        .map(r => 
          supabase
            .from('exercises')
            .update({
              level: r.level,
              topic: r.topic
            })
            .eq('id', r.questionId)
        );
      await Promise.all(updates);
      return true;
    } catch (e) {
      console.error("Lỗi lưu phân tích vào CSDL:", e);
      return false;
    }
  }
};
