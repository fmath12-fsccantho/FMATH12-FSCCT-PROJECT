import { askGroqAI } from './groqAI';
import { CURRICULUM_PROMPT_TEXT } from '../config/curriculumFramework';

export interface QuestionAnalysisResult {
  level: 'Nhận biết' | 'Thông hiểu' | 'Vận dụng' | 'Vận dụng cao';
  levelExplanation: string;
  domain: string; // VD: "I. MỘT SỐ YẾU TỐ GIẢI TÍCH"
  topic: string;  // VD: "1. Ứng dụng đạo hàm để khảo sát và vẽ đồ thị của hàm số"
  subTopic: string; // VD: "1.3. Khảo sát và vẽ đồ thị của hàm số"
  competency: string; // VD: "Nhận biết hình ảnh hình học của đường tiệm cận..."
  trapsAndMistakes?: string;
  solutionHint?: string;
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
      const responseText = await askGroqAI(systemPrompt, prompt, true);
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

    // Heuristic fallback nếu AI mạng bận
    return this.fallbackAnalyze(question.content);
  },

  /**
   * Phân tích tức thì dựa trên từ khóa Toán học (Fallback dự phòng)
   */
  fallbackAnalyze(content: string): QuestionAnalysisResult {
    const text = content.toLowerCase();

    // 1. Oxyz
    if (text.includes('oxyz') || text.includes('mặt phẳng') || text.includes('mặt cầu') || text.includes('vectơ') || text.includes('đường thẳng')) {
      if (text.includes('mặt cầu')) {
        return {
          level: text.includes('tiếp xúc') || text.includes('cực trị') ? 'Vận dụng' : 'Thông hiểu',
          levelExplanation: 'Câu hỏi về phương trình mặt cầu trong không gian Oxyz.',
          domain: 'II. HÌNH HỌC VÀ ĐO LƯỜNG (Phương pháp tọa độ trong không gian Oxyz)',
          topic: '4. Phương trình mặt cầu',
          subTopic: '4. Phương trình mặt cầu',
          competency: 'Xác định tâm, bán kính và thiết lập phương trình mặt cầu.',
          trapsAndMistakes: 'Nhầm dấu tọa độ tâm khi chuyển từ dạng phương trình khai triển.',
          solutionHint: 'Đưa phương trình về dạng chính tắc để đọc tọa độ tâm I và bán kính R.'
        };
      }
      return {
        level: text.includes('góc') || text.includes('khoảng cách') ? 'Vận dụng' : 'Thông hiểu',
        levelExplanation: 'Câu hỏi về hình học giải tích không gian Oxyz.',
        domain: 'II. HÌNH HỌC VÀ ĐO LƯỜNG (Phương pháp tọa độ trong không gian Oxyz)',
        topic: '2. Phương trình mặt phẳng & Đường thẳng',
        subTopic: 'Phương trình và quan hệ không gian',
        competency: 'Thiết lập phương trình và xác định vị trí tương đối.',
        trapsAndMistakes: 'Nhầm lẫn giữa vectơ pháp tuyến của mặt phẳng và vectơ chỉ phương của đường thẳng.',
        solutionHint: 'Xác định rõ VTPT và điểm đi qua.'
      };
    }

    // 2. Thống kê & Xác suất
    if (text.includes('xác suất') || text.includes('bayes') || text.includes('điều kiện') || text.includes('ghép nhóm') || text.includes('phương sai') || text.includes('độ lệch chuẩn')) {
      if (text.includes('xác suất') || text.includes('bayes')) {
        return {
          level: text.includes('bayes') ? 'Vận dụng' : 'Thông hiểu',
          levelExplanation: 'Câu hỏi thuộc chuyên đề Xác suất có điều kiện chuẩn GDPT mới.',
          domain: 'III. THỐNG KÊ VÀ XÁC SUẤT',
          topic: '2. Xác suất',
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
        topic: '1. Thống kê (Phân tích và xử lý dữ liệu)',
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
        solutionHint: 'Tìm hoành độ giao điểm rồi áp dụng công thức tích phân tích diện tích.'
      };
    }

    // 4. Mặc định: Đạo hàm & Khảo sát hàm số
    return {
      level: text.includes('cực trị') || text.includes('tiệm cận') ? 'Nhận biết' : 'Thông hiểu',
      levelExplanation: 'Câu hỏi ứng dụng đạo hàm để khảo sát tính chất của hàm số.',
      domain: 'I. MỘT SỐ YẾU TỐ GIẢI TÍCH',
      topic: '1. Ứng dụng đạo hàm để khảo sát và vẽ đồ thị của hàm số',
      subTopic: '1.1. Tính đơn điệu và Cực trị của hàm số',
      competency: 'Nhận biết tính đơn điệu, cực trị qua bảng biến thiên hoặc đồ thị.',
      trapsAndMistakes: 'Nhầm giữa giá trị cực trị (y) và điểm cực trị của hàm số (x).',
      solutionHint: 'Xét dấu đạo hàm f\'(x) hoặc đọc trực tiếp từ bảng biến thiên.'
    };
  }
};
