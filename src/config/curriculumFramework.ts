/**
 * KHUNG KIẾN THỨC TOÁN 12 CHUẨN BỘ GIÁO DỤC VÀ ĐÀO TẠO (GDPT 2018)
 * Thống nhất toàn hệ thống FMATH12
 */

export interface CompetencyItem {
  id: string;
  name: string;
  criteria: string[];
}

export interface TopicSection {
  id: string;
  code: string;
  title: string;
  items: CompetencyItem[];
}

export interface KnowledgeDomain {
  id: string;
  roman: string;
  title: string;
  sections: TopicSection[];
}

export const COGNITIVE_LEVELS = [
  { id: 'nhan_biet', name: 'Nhận biết', shortName: 'NB', color: 'emerald', desc: 'Nhớ, nhận diện định nghĩa, công thức, hình ảnh trực quan cơ bản.' },
  { id: 'thong_hieu', name: 'Thông hiểu', shortName: 'TH', color: 'blue', desc: 'Hiểu bản chất, giải thích, chuyển đổi biểu diễn và áp dụng trực tiếp 1 bước.' },
  { id: 'van_dung', name: 'Vận dụng', shortName: 'VD', color: 'amber', desc: 'Kết nối nhiều kiến thức, phương pháp biến đổi, bấm máy tính, giải toán dạng quen.' },
  { id: 'van_dung_cao', name: 'Vận dụng cao', shortName: 'VDC', color: 'rose', desc: 'Giải quyết bài toán cực trị, tham số m, bài toán liên môn và thực tiễn nâng cao.' }
] as const;

export const CURRICULUM_FRAMEWORK: KnowledgeDomain[] = [
  {
    id: 'giai_tich',
    roman: 'I',
    title: 'MỘT SỐ YẾU TỐ GIẢI TÍCH',
    sections: [
      {
        id: 'dao_ham_khao_sat',
        code: '1',
        title: 'Ứng dụng đạo hàm để khảo sát và vẽ đồ thị của hàm số',
        items: [
          {
            id: '1.1',
            name: 'Tính đơn điệu và Cực trị của hàm số',
            criteria: [
              'Nhận biết tính đồng biến, nghịch biến trên một khoảng qua dấu đạo hàm cấp một.',
              'Thể hiện tính đơn điệu trong bảng biến thiên.',
              'Nhận biết tính đơn điệu, điểm cực trị, giá trị cực trị qua bảng biến thiên hoặc đồ thị.'
            ]
          },
          {
            id: '1.2',
            name: 'Giá trị lớn nhất (GTLN) và Giá trị nhỏ nhất (GTNN)',
            criteria: [
              'Nhận biết GTLN, GTNN của hàm số trên một tập xác định cho trước.',
              'Xác định GTLN, GTNN bằng đạo hàm trong các trường hợp đơn giản.'
            ]
          },
          {
            id: '1.3',
            name: 'Khảo sát và vẽ đồ thị của hàm số',
            criteria: [
              'Nhận biết hình ảnh hình học của đường tiệm cận ngang, tiệm cận đứng, tiệm cận xiên.',
              'Mô tả sơ đồ tổng quát để khảo sát hàm số.',
              'Khảo sát và vẽ đồ thị hàm số bậc ba: y = ax³ + bx² + cx + d (a ≠ 0).',
              'Khảo sát và vẽ đồ thị hàm phân thức bậc nhất/bậc nhất: y = (ax+b)/(cx+d) (c ≠ 0, ad - bc ≠ 0).',
              'Khảo sát và vẽ đồ thị hàm phân thức bậc hai/bậc nhất: y = (ax²+bx+c)/(mx+n) (a ≠ 0, m ≠ 0).',
              'Nhận biết tính đối xứng (trục đối xứng, tâm đối xứng) của đồ thị các hàm số trên.'
            ]
          },
          {
            id: '1.4',
            name: 'Ứng dụng đạo hàm vào thực tiễn',
            criteria: [
              'Vận dụng đạo hàm và khảo sát hàm số để giải quyết các bài toán thực tiễn (bài toán tối ưu kinh tế, vật lý, thời gian, quãng đường...).'
            ]
          }
        ]
      },
      {
        id: 'nguyen_ham_tich_phan',
        code: '2',
        title: 'Nguyên hàm và Tích phân',
        items: [
          {
            id: '2.1',
            name: 'Nguyên hàm và Bảng nguyên hàm sơ cấp',
            criteria: [
              'Nhận biết khái niệm và giải thích tính chất cơ bản của nguyên hàm.',
              'Xác định nguyên hàm của các hàm số sơ cấp cơ bản (y=x^α, y=1/x, y=sin x, y=cos x, y=1/cos² x, y=1/sin² x, y=a^x, y=e^x).',
              'Tính nguyên hàm trong những trường hợp đơn giản.'
            ]
          },
          {
            id: '2.2',
            name: 'Tích phân và Ứng dụng hình học của tích phân',
            criteria: [
              'Nhận biết định nghĩa và các tính chất của tích phân.',
              'Tính tích phân trong những trường hợp đơn giản.',
              'Ứng dụng tích phân tính diện tích hình phẳng.',
              'Ứng dụng tích phân tính thể tích hình khối (khối tròn xoay).',
              'Vận dụng tích phân giải các bài toán liên quan đến thực tiễn.'
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'hinh_hoc_oxyz',
    roman: 'II',
    title: 'HÌNH HỌC VÀ ĐO LƯỜNG (Phương pháp tọa độ trong không gian Oxyz)',
    sections: [
      {
        id: 'vecto_oxyz',
        code: '1',
        title: 'Tọa độ của vectơ và Biểu thức tọa độ của các phép toán vectơ',
        items: [
          {
            id: 'II.1',
            name: 'Hệ tọa độ không gian & Tọa độ vectơ',
            criteria: [
              'Nhận biết vectơ và các phép toán vectơ trong không gian (tổng, hiệu, tích với một số, tích vô hướng).',
              'Nhận biết tọa độ của vectơ đối với hệ trục tọa độ.',
              'Xác định độ dài của vectơ và biểu thức tọa độ của các phép toán vectơ.',
              'Vận dụng tọa độ vectơ giải các bài toán thực tiễn.'
            ]
          }
        ]
      },
      {
        id: 'mat_phang_oxyz',
        code: '2',
        title: 'Phương trình mặt phẳng',
        items: [
          {
            id: 'II.2',
            name: 'Phương trình tổng quát của mặt phẳng',
            criteria: [
              'Nhận biết phương trình tổng quát của mặt phẳng.',
              'Thiết lập phương trình tổng quát của mặt phẳng (qua 1 điểm và biết VTPT; qua 1 điểm và biết cặp VTCP; qua 3 điểm không thẳng hàng).',
              'Thiết lập điều kiện hai mặt phẳng song song, vuông góc với nhau.',
              'Tính khoảng cách từ một điểm đến một mặt phẳng.',
              'Vận dụng phương trình mặt phẳng giải các bài toán thực tiễn.'
            ]
          }
        ]
      },
      {
        id: 'duong_thang_oxyz',
        code: '3',
        title: 'Phương trình đường thẳng trong không gian',
        items: [
          {
            id: 'II.3',
            name: 'Phương trình đường thẳng trong không gian',
            criteria: [
              'Nhận biết phương trình chính tắc, phương trình tham số và vectơ chỉ phương của đường thẳng.',
              'Thiết lập phương trình đường thẳng (qua 1 điểm và biết 1 VTCP; qua 2 điểm).',
              'Xác định điều kiện để hai đường thẳng chéo nhau, cắt nhau, song song hoặc vuông góc.',
              'Thiết lập công thức tính góc: giữa hai đường thẳng, giữa đường thẳng và mặt phẳng, giữa hai mặt phẳng.',
              'Vận dụng phương trình đường thẳng giải các bài toán thực tiễn.'
            ]
          }
        ]
      },
      {
        id: 'mat_cau_oxyz',
        code: '4',
        title: 'Phương trình mặt cầu',
        items: [
          {
            id: 'II.4',
            name: 'Phương trình mặt cầu',
            criteria: [
              'Nhận biết phương trình mặt cầu.',
              'Xác định tâm và bán kính của mặt cầu khi biết phương trình.',
              'Thiết lập phương trình mặt cầu khi biết tâm và bán kính.',
              'Vận dụng phương trình mặt cầu giải các bài toán thực tiễn.'
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'thong_ke_xac_suat',
    roman: 'III',
    title: 'THỐNG KÊ VÀ XÁC SUẤT',
    sections: [
      {
        id: 'thong_ke',
        code: '1',
        title: 'Thống kê (Phân tích và xử lý dữ liệu)',
        items: [
          {
            id: '1.1',
            name: 'Các số đặc trưng của mẫu số liệu ghép nhóm',
            criteria: [
              'Tính các số đặc trưng đo mức độ phân tán: khoảng biến thiên, khoảng tứ phân vị, phương sai, độ lệch chuẩn.',
              'Giải thích ý nghĩa và vai trò của các số đặc trưng đo mức độ phân tán trong thực tiễn.',
              'Đưa ra kết luận từ ý nghĩa của các số đặc trưng trong trường hợp đơn giản và liên hệ thực tiễn/liên môn.'
            ]
          }
        ]
      },
      {
        id: 'xac_suat',
        code: '2',
        title: 'Xác suất',
        items: [
          {
            id: '2.1',
            name: 'Khái niệm về xác suất có điều kiện',
            criteria: [
              'Nhận biết khái niệm xác suất có điều kiện.',
              'Giải thích ý nghĩa của xác suất có điều kiện trong các tình huống thực tiễn quen thuộc.'
            ]
          },
          {
            id: '2.2',
            name: 'Các quy tắc tính xác suất',
            criteria: [
              'Mô tả công thức xác suất toàn phần và công thức Bayes qua bảng dữ liệu thống kê 2 × 2 và sơ đồ hình cây.',
              'Sử dụng công thức Bayes để tính xác suất có điều kiện và vận dụng vào bài toán thực tiễn.',
              'Sử dụng sơ đồ hình cây để tính xác suất có điều kiện trong các bài toán thực tiễn liên quan tới thống kê.'
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'thuc_hanh_trai_nghiem',
    roman: 'IV',
    title: 'THỰC HÀNH PHẦN MỀM & TRẢI NGHIỆM (Tích hợp công cụ bổ trợ trên Web)',
    sections: [
      {
        id: 'thuc_hanh_giai_tich',
        code: '1',
        title: 'Thực hành Giải tích',
        items: [
          {
            id: 'IV.1',
            name: 'Mô phỏng đồ thị & tương giao',
            criteria: ['Vẽ đồ thị, minh họa sự tương giao và biến đổi đồ thị, tạo mô hình khối tròn xoay.']
          }
        ]
      },
      {
        id: 'thuc_hanh_oxyz',
        code: '2',
        title: 'Thực hành Hình học Oxyz',
        items: [
          {
            id: 'IV.2',
            name: 'Mô hình không gian 3D',
            criteria: ['Biểu thị điểm, vectơ, vẽ đường thẳng, mặt phẳng, mặt cầu và quan sát sự thay đổi hình dạng khi thay đổi tham số.']
          }
        ]
      },
      {
        id: 'thuc_hanh_tk_xs',
        code: '3',
        title: 'Thực hành Thống kê & Xác suất',
        items: [
          {
            id: 'IV.3',
            name: 'Xử lý dữ liệu & Phân bố',
            criteria: ['Tính toán các số đặc trưng thống kê và phân bố nhị thức bằng phần mềm.']
          }
        ]
      },
      {
        id: 'ung_dung_thuc_tien',
        code: '4',
        title: 'Ứng dụng thực tiễn & Liên môn',
        items: [
          {
            id: 'IV.4',
            name: 'Tối ưu hóa đa ngành',
            criteria: ['Bài toán tài chính, hệ thống định vị GPS, đồ họa kỹ thuật, tối ưu hóa.']
          }
        ]
      }
    ]
  }
];

/**
 * Trả về danh sách phẳng các chuyên đề chính để hiển thị bản đồ năng lực (Radar / Progress)
 */
export const CORE_TOPICS = [
  {
    id: 'dao_ham',
    name: 'Khảo sát hàm số & Ứng dụng đạo hàm',
    domain: 'I. GIẢI TÍCH',
    code: '1.1 - 1.4',
    weight: 0.25
  },
  {
    id: 'tich_phan',
    name: 'Nguyên hàm, Tích phân & Ứng dụng',
    domain: 'I. GIẢI TÍCH',
    code: '2.1 - 2.2',
    weight: 0.20
  },
  {
    id: 'oxyz',
    name: 'Phương pháp tọa độ không gian Oxyz',
    domain: 'II. HÌNH HỌC',
    code: '1 - 4',
    weight: 0.25
  },
  {
    id: 'thong_ke',
    name: 'Thống kê mẫu số liệu ghép nhóm',
    domain: 'III. THỐNG KÊ',
    code: '1.1',
    weight: 0.10
  },
  {
    id: 'xac_suat',
    name: 'Xác suất có điều kiện & Công thức Bayes',
    domain: 'III. XÁC SUẤT',
    code: '2.1 - 2.2',
    weight: 0.10
  },
  {
    id: 'thuc_te',
    name: 'Ứng dụng thực tiễn & Tối ưu hóa liên môn',
    domain: 'IV. THỰC HÀNH',
    code: '1 - 4',
    weight: 0.10
  }
];

/**
 * Văn bản định dạng khung kiến thức để cấp cho AI Prompt
 */
export const CURRICULUM_PROMPT_TEXT = `
KHUNG KIẾN THỨC TOÁN 12 CHUẨN BỘ GIÁO DỤC & ĐÀO TẠO (GDPT 2018):
I. MỘT SỐ YẾU TỐ GIẢI TÍCH
1. Ứng dụng đạo hàm để khảo sát và vẽ đồ thị của hàm số
   1.1. Tính đơn điệu và Cực trị của hàm số (đồng biến, nghịch biến, BBT, đồ thị)
   1.2. Giá trị lớn nhất (GTLN) và Giá trị nhỏ nhất (GTNN)
   1.3. Khảo sát và vẽ đồ thị của hàm số (bậc ba, phân thức 1/1, phân thức 2/1, tiệm cận ngang/đứng/xiên, tâm/trục đối xứng)
   1.4. Ứng dụng đạo hàm vào thực tiễn (tối ưu kinh tế, vật lý, thời gian, quãng đường...)
2. Nguyên hàm và Tích phân
   2.1. Nguyên hàm và Bảng nguyên hàm sơ cấp
   2.2. Tích phân và Ứng dụng hình học của tích phân (diện tích hình phẳng, thể tích khối tròn xoay, bài toán thực tiễn)

II. HÌNH HỌC VÀ ĐO LƯỜNG (Phương pháp tọa độ trong không gian Oxyz)
1. Tọa độ của vectơ và Biểu thức tọa độ của các phép toán vectơ
2. Phương trình mặt phẳng (VTPT, cặp VTCP, vị trí tương đối, khoảng cách, thực tiễn)
3. Phương trình đường thẳng trong không gian (chính tắc, tham số, góc, vị trí tương đối, thực tiễn)
4. Phương trình mặt cầu (tâm, bán kính, tiếp xúc, thực tiễn)

III. THỐNG KÊ VÀ XÁC SUẤT
1. Thống kê (Phân tích và xử lý dữ liệu)
   1.1. Các số đặc trưng của mẫu số liệu ghép nhóm (khoảng biến thiên, tứ phân vị, phương sai, độ lệch chuẩn, liên hệ thực tiễn)
2. Xác suất
   2.1. Khái niệm về xác suất có điều kiện
   2.2. Các quy tắc tính xác suất (xác suất toàn phần, công thức Bayes, sơ đồ hình cây, bài toán thực tiễn)

IV. THỰC HÀNH PHẦN MỀM & TRẢI NGHIỆM (Tích hợp công cụ bổ trợ trên Web)
1. Thực hành Giải tích (đồ thị, tương giao, tròn xoay)
2. Thực hành Hình học Oxyz (3D, tham số)
3. Thực hành Thống kê & Xác suất
4. Ứng dụng thực tiễn & Liên môn (tài chính, GPS, đồ họa, tối ưu)

PHÂN LOẠI 4 MỨC ĐỘ NHẬN THỨC:
- Nhận biết (NB): Đọc trực tiếp, nhận dạng công thức, đọc giá trị cực trị/tiệm cận từ đồ thị/BBT.
- Thông hiểu (TH): Biến đổi 1-2 bước cơ bản, tính đạo hàm/tích phân mẫu chuẩn, giải phương trình tọa độ cơ bản.
- Vận dụng (VD): Phối hợp nhiều công thức, áp dụng phương pháp giải toán điển hình, kỹ thuật Casio hoặc bài toán thực tế mức độ vừa.
- Vận dụng cao (VDC): Bài toán chứa tham số m, bài toán cực trị hình học, tích phân hàm ẩn, tối ưu hóa thực tiễn phức tạp.
`.trim();
