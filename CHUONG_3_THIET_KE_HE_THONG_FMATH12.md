# BÁO CÁO NGHIÊN CỨU KHOA HỌC KỸ THUẬT

# CHƯƠNG 3: THIẾT KẾ HỆ THỐNG WEBSITE FMATH12 HỖ TRỢ TỰ HỌC VÀ LUYỆN TẬP THÍCH ỨNG MÔN TOÁN 12

---

## 3.1. TỔNG QUAN VỀ THIẾT KẾ HỆ THỐNG

### 3.1.1. Nguyên tắc và yêu cầu thiết kế

Hệ thống website **FMATH12** được định hướng xây dựng như một hệ sinh thái học tập thích ứng (Adaptive Learning Platform) kết hợp Trí tuệ nhân tạo (AI), bám sát chương trình Giáo dục Phổ thông 2018 (GDPT 2018) và cấu trúc định dạng đề thi tốt nghiệp THPT từ năm 2025 của Bộ Giáo dục và Đào tạo. Hệ thống tập trung hoàn toàn vào việc **hỗ trợ học sinh tự học, tự luyện tập có định hướng và tự đánh giá năng lực (Formative Assessment & Self-Paced Practice)**, tuyệt đối loại bỏ các áp lực thi cử căng thẳng hay rào cản giám sát khảo thí phức tạp. Quá trình thiết kế tuân thủ nghiêm ngặt các nguyên tắc và yêu cầu sau:

#### a) Các nguyên tắc sư phạm cốt lõi
1. **Nguyên tắc "Sư phạm đảo ngược" & Đồng hành kiến tạo (Reverse Pedagogy & Socratic Scaffolding):**
   - Nền tảng kiên quyết từ chối vai trò của một công cụ giải bài hộ hay kho lưu trữ thụ động. Thay vì lập tức đưa ra đáp án cuối cùng đóng khung ($A, B, C, D$), hệ thống đóng vai trò người gia sư đồng hành kiên nhẫn, phân tích nguyên nhân sai lầm trong logic toán học và đặt câu hỏi gợi ý từng bước (Socratic questioning & step-by-step guidance) để học sinh tự mình tìm ra lời giải đúng.
   - **Tối ưu hóa trải nghiệm tự học tự do:** Vì hệ thống không áp đặt mô hình khảo thí giám sát thi cử, học sinh có toàn quyền chủ động tự học theo tốc độ cá nhân (self-paced). Chatbot AI Socratic Scaffolding luôn sẵn sàng hỗ trợ tháo gỡ điểm nghẽn nhận thức cả trong quá trình tự học lý thuyết, giải bài tập tự luyện và phân tích sâu các sai lầm sau khi nộp bài (*AI Question Analyzer*).
2. **Nguyên tắc phân hóa và thích ứng cá nhân (Adaptive Learning):** Mỗi học sinh có một "vùng phát triển gần nhất" (Vygotsky's ZPD) riêng biệt. Hệ thống tự động đo lường năng lực và đề xuất bài tập bù đắp lỗ hổng kiến thức phù hợp với trình độ hiện tại thông qua thuật toán chẩn đoán điểm mù tri thức.
3. **Nguyên tắc kiểm duyệt học liệu và an toàn thông tin (Pedagogical Guardrails):** Toàn bộ dữ liệu lý thuyết và bài tập được kiểm duyệt 100% bởi Tổ chuyên môn Toán - Tự nhiên (Trường THPT FPT Cần Thơ). Mô hình Trí tuệ nhân tạo được thiết lập rào chắn kỹ thuật nghiêm ngặt, triệt tiêu hiện tượng "ảo giác AI" (Hallucination), tuyệt đối không tự ý bịa đặt kiến thức hay công thức toán học sai lệch.

#### b) Yêu cầu kỹ thuật và phi chức năng
- **Bảo mật theo thiết kế (Security by Design):** Phân quyền dữ liệu độc lập giữa Giáo viên, Học sinh và Quản trị viên thông qua cơ chế *Row Level Security (RLS)* tại tầng cơ sở dữ liệu và xác thực *JSON Web Token (JWT)*.
- **Dung sai ngoại tuyến (Offline Tolerance):** Trong bối cảnh hạ tầng mạng trường học hoặc thiết bị học sinh có thể chập chờn, hệ thống có khả năng lưu trữ trạng thái làm bài tạm thời vào bộ nhớ cục bộ (Local Storage/Cache) và tự động đồng bộ lên máy chủ ngay khi có kết nối trở lại mà không làm gián đoạn hay mất bài làm của học sinh.
- **Hiển thị toán học thời gian thực (Zero-latency Math Rendering):** Tích hợp bộ máy KaTeX kết hợp công nghệ dựng đồ thị động vector SVG (*MathGraphPlotter*) giúp hiển thị các biểu thức vi phân, tích phân, ma trận, hình học $Oxyz$ và đồ thị hàm số sắc nét, trực quan với tốc độ dưới 100ms.
- **Khả năng mở rộng và chịu tải cao:** Kiến trúc Cloud Serverless cho phép đáp ứng đồng thời hàng trăm học sinh cùng truy cập tự luyện bài tập mà không xảy ra nghẽn mạng hay trễ phản hồi.

---

### 3.1.2. Công cụ và kiến trúc công nghệ

Hệ thống được thiết kế theo mô hình kiến trúc phân tầng hiện đại (**Multi-Tier Cloud-Native Architecture**) kết hợp các dịch vụ điện toán đám mây tiên tiến:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   GIAO DIỆN NGƯỜI DÙNG (FRONTEND CLIENT)                │
│   React 18 • TypeScript • Tailwind CSS • Zustand • Vite • KaTeX Engine │
└──────────────────┬─────────────────────────────────┬───────────────────┘
                   │ HTTPS / WSS                     │ REST / JSON
┌──────────────────▼────────────────┐    ┌───────────▼───────────────────┐
│     HẠ TẦNG DỮ LIỆU & BACKEND     │    │   TẦNG SUY LUẬN AI SƯ PHẠM    │
│            (SUPABASE)             │    │       (FMATH12 AI ENGINE)     │
│ • PostgreSQL Database Engine      │    │ • Groq AI High-Speed LPU      │
│ • Row Level Security (RLS)        │    │ • Pool 5 API Keys Failover    │
│ • Supabase Realtime Channels      │    │ • Strict Pedagogical Prompts  │
│ • Firebase Authentication (JWT)   │    │ • MathGraphPlotter (Auto SVG) │
└──────────────────┬────────────────┘    └───────────┬───────────────────┘
                   │                                 │
┌──────────────────▼─────────────────────────────────▼───────────────────┐
│     MICROSERVICE PHÂN TÍCH & CHẨN ĐOÁN NĂNG LỰC (PYTHON ENGINE)        │
│ • FastAPI Diagnostic Microservice • Bayesian Knowledge Tracing (BKT)   │
│ • Item Response Theory (IRT)      • Dynamic Scaffolding Generator      │
└────────────────────────────────────────────────────────────────────────┘
```

#### Bảng tổng hợp công nghệ sử dụng trong hệ thống

| Tầng kiến trúc | Công nghệ sử dụng | Vai trò & Mục đích ứng dụng |
| :--- | :--- | :--- |
| **Giao diện (Frontend)** | ReactJS 18, TypeScript, Tailwind CSS | Xây dựng giao diện Single Page Application (SPA) phản hồi nhanh, giao diện Responsive tương thích trên mọi kích thước màn hình (PC, Tablet, Smartphone). |
| **Quản lý trạng thái** | Zustand Store | Quản lý trạng thái người dùng, tiến trình tự luyện tập, chế độ đồng bộ ngoại tuyến mượt mà, tối ưu hiệu năng bộ nhớ trình duyệt. |
| **Xử lý biểu thức Toán** | KaTeX, Rehype-Katex, Remark-Math | Kết xuất ký hiệu công thức toán học chuẩn $\mathrm{\LaTeX}$ theo định dạng Sách giáo khoa với tốc độ cao vượt trội so với MathJax. |
| **Dựng đồ thị trực quan** | MathGraphPlotter Engine, SVG 2D/3D | Tự động phân tích chuỗi hàm số để vẽ hệ trục tọa độ, đồ thị bậc ba, phân thức hữu tỉ, đường tiệm cận và bảng biến thiên thời gian thực. |
| **Cơ sở dữ liệu & Realtime** | Supabase (PostgreSQL 15), Supabase Realtime | Lưu trữ cơ sở dữ liệu quan hệ; kích hoạt kênh đồng bộ WebSocket thời gian thực cho lớp học trực tuyến, cập nhật tiến độ nộp bài tập và chấm điểm tự động. |
| **Bảo mật cơ sở dữ liệu** | Row Level Security (RLS) & Firebase Auth | Khóa chặt dữ liệu tại tầng bảng ghi cơ sở dữ liệu, đảm bảo mỗi học sinh chỉ truy cập được dữ liệu cá nhân, bảo vệ quyền riêng tư học tập. |
| **Xử lý Trí tuệ Nhân tạo** | Groq AI Inference LPU (Language Processing Unit) | Đảm bảo tốc độ phản hồi gia sư AI đạt từ 300 - 500 token/giây, trả lời thắc mắc của học sinh gần như tức thời. |
| **Chịu tải & Chống nghẽn AI** | Pool 5 API Keys Luân phiên & Tự động Failover | Hệ thống phân phối tải tự động luân chuyển giữa 5 khóa API dự phòng; khi một khóa chạm ngưỡng giới hạn (HTTP 429), hệ thống tự chuyển khóa khác không làm gián đoạn người dùng. |
| **Engine Chẩn đoán (Diagnostic)**| Python 3 Microservice (FastAPI/BKT/IRT) | Tính toán ma trận chẩn đoán nhận thức 4 cấp độ, dự phóng điểm thi tốt nghiệp THPT chuẩn hóa dựa trên lý thuyết ứng đáp câu hỏi (IRT). |
| **Lưu trữ tài nguyên ảnh** | Cloudinary CDN | Tối ưu hóa dung lượng, nén và phân phối hình ảnh đồ thị, đề bài hình học không gian với băng thông cao. |

---

### 3.1.3. Quy trình thiết kế và phát triển

Dự án được triển khai theo mô hình linh hoạt **Agile/Scrum** kết hợp quy trình tư duy thiết kế sư phạm (**Design Thinking**) gồm 5 giai đoạn chính:

```
[Khảo sát thực trạng] ──> [Thiết kế kiến trúc] ──> [Hiện thực hóa hệ thống] ──> [Thử nghiệm thực chứng] ──> [Đánh giá & Hoàn thiện]
  (304 HS THPT Cần Thơ)     (DB, RLS, AI Engine)     (Frontend, Backend, AI)        (400+ Học sinh tham gia)       (Chuẩn hóa GDPT 2018)
```

1. **Giai đoạn 1 - Khảo sát thực trạng (Thấu cảm):** Tiến hành khảo sát trên 304 học sinh THPT tại Cần Thơ. Kết quả ghi nhận GPA môn Toán trung bình chỉ đạt **5.11/10**, tỷ lệ học sinh đạt dưới 7.0 điểm chiếm **85.86%**, và có tới **91.2%** học sinh thừa nhận khó khăn lớn nhất là *không có người hướng dẫn, tháo gỡ kịp thời khi gặp bài tập khó trong lúc tự học ở nhà*.
2. **Giai đoạn 2 - Thiết kế kiến trúc & Cơ sở dữ liệu:** Lập sơ đồ thực thể liên kết (ERD) với 10 bảng dữ liệu chuẩn hóa, cấu hình chính sách bảo mật RLS, tích hợp cấu trúc khung kiến thức 7 chuyên đề Toán 12 theo Thông tư 32/2018/TT-BGDĐT.
3. **Giai đoạn 3 - Lập trình phát triển hệ thống:**
   - Xây dựng giao diện học sinh, giáo viên và quản trị viên.
   - Huấn luyện System Prompt sư phạm cho Trợ lý AI và thiết lập bộ đệm API Keys chống sập mạng.
   - Xây dựng cơ chế lưu trữ bài làm ngoại tuyến (*Offline-Tolerance*) và thuật toán chẩn đoán năng lực thích ứng.
4. **Giai đoạn 4 - Thử nghiệm thực chứng:** Triển khai thử nghiệm diện rộng với hơn 517 tài khoản đăng ký, ghi nhận 1,504 lượt nộp bài tự luyện thực tế từ học sinh khối 12 trường THPT FPT Cần Thơ và một số trường THPT trên địa bàn thành phố.
5. **Giai đoạn 5 - Tinh chỉnh & Hoàn thiện:** Thu thập phản hồi từ giáo viên bộ môn Toán để tinh chỉnh độ khó ngân hàng bài tập, hoàn thiện chức năng phân tích bản đồ nhiệt (*Heatmap*).

---

### 3.1.4. Kết quả thiết kế

Hệ thống đã hoàn thiện 100% các phân hệ cốt lõi và được đóng gói thành giải pháp web hoàn chỉnh:
- **Tương thích đa nền tảng:** Chạy mượt mà trên tất cả trình duyệt hiện đại (Chrome, Safari, Edge, Firefox) mà không cần cài đặt phần mềm bổ trợ.
- **Tốc độ tải trang ấn tượng:** Thời gian tải trang ban đầu (First Contentful Paint) đạt dưới 1.2 giây nhờ kỹ thuật chia tách gói mã nguồn (Code Splitting) của Vite.
- **Khả năng thích ứng sư phạm:** Đã kiểm chứng khả năng tháo gỡ nút thắt nhận thức: **82% học sinh tự giải quyết thành công bài toán khó** ở lần làm lại sau khi nhận được gợi ý step-by-step từ trợ lý FMATH AI.

---

## 3.2. DỮ LIỆU HỆ THỐNG - NGÂN HÀNG CÂU HỎI

Ngân hàng câu hỏi của hệ thống FMATH12 được xây dựng công phu, chuẩn hóa hoàn toàn theo cấu trúc đề thi tốt nghiệp THPT từ năm 2025 do Bộ GD&ĐT ban hành, bao gồm **3 định dạng trắc nghiệm hiện đại**:
1. **Phần I - Trắc nghiệm nhiều lựa chọn:** Gồm 4 phương án $A, B, C, D$, chọn 1 đáp án đúng duy nhất.
2. **Phần II - Trắc nghiệm Đúng/Sai:** Mỗi câu hỏi gồm 4 ý $a), b), c), d)$. Quy tắc tính điểm bậc thang: đúng 1 ý được 0.1 điểm; đúng 2 ý được 0.25 điểm; đúng 3 ý được 0.5 điểm; đúng cả 4 ý được 1.0 điểm.
3. **Phần III - Trắc nghiệm Trả lời ngắn:** Đòi hỏi học sinh phải tự giải và điền kết quả số thực, phân số hoặc tọa độ, loại bỏ hoàn toàn yếu tố phỏng đoán may rủi.

Câu hỏi được phân định chặt chẽ theo **4 cấp độ nhận thức** của thang đo Bloom sửa đổi:
- **Nhận biết (NB):** Nhận diện định nghĩa, đọc trực tiếp công thức, xác định tiệm cận, điểm cực trị từ bảng biến thiên hoặc đồ thị cho sẵn.
- **Thông hiểu (TH):** Hiểu bản chất toán học, thực hiện biến đổi 1 - 2 bước, tính nguyên hàm cơ bản, giải phương trình mặt phẳng trực tiếp.
- **Vận dụng (VD):** Kết nối nhiều mảng kiến thức, giải bài toán có chứa tham số, ứng dụng tích phân tính diện tích, thể tích, xử lý bài toán xác suất thực tế.
- **Vận dụng cao (VDC):** Bài toán cực trị hình học không gian, tích phân hàm ẩn, bài toán tối ưu hóa thực tiễn liên môn phức tạp, bài toán phân loại điểm 9 - 10.

### Bảng số liệu thống kê chi tiết ngân hàng câu hỏi theo chuyên đề và mức độ nhận thức

| STT | Mảng kiến thức & Chuyên đề trọng tâm Toán 12 | Nhận biết (NB) | Thông hiểu (TH) | Vận dụng (VD) | Vận dụng cao (VDC) | Tổng số câu | Tỷ lệ (%) |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **I** | **MỘT SỐ YẾU TỐ GIẢI TÍCH** | | | | | | |
| 1 | Ứng dụng đạo hàm khảo sát & vẽ đồ thị hàm số | 185 | 162 | 114 | 58 | **519** | **25.2%** |
| 2 | Nguyên hàm, Tích phân và Ứng dụng hình học | 142 | 138 | 96 | 45 | **421** | **20.4%** |
| **II** | **HÌNH HỌC VÀ ĐO LƯỜNG (KHÔNG GIAN OXYZ)** | | | | | | |
| 3 | Tọa độ vectơ và các phép toán vectơ trong không gian | 85 | 74 | 42 | 18 | **219** | **10.6%** |
| 4 | Phương trình mặt phẳng, đường thẳng và mặt cầu | 148 | 136 | 98 | 46 | **428** | **20.8%** |
| **III**| **THỐNG KÊ VÀ XÁC SUẤT** | | | | | | |
| 5 | Các số đặc trưng đo độ phân tán mẫu số liệu ghép nhóm | 65 | 58 | 36 | 12 | **171** | **8.3%** |
| 6 | Xác suất có điều kiện và Công thức Bayes | 54 | 52 | 40 | 18 | **164** | **8.0%** |
| **IV** | **TOÁN LIÊN MÔN & BÀI TOÁN THỰC TIỄN** | | | | | | |
| 7 | Bài toán tối ưu kinh tế, vật lý, kỹ thuật và mô hình hóa | 32 | 38 | 44 | 24 | **138** | **6.7%** |
| **TỔNG CỘNG** | **TOÀN BỘ HỆ THỐNG FMATH12** | **711** | **658** | **470** | **221** | **2,060** | **100.0%** |
| **TỶ LỆ PHÂN BỐ CẤP ĐỘ NHẬN THỨC** | | **34.5%** | **31.9%** | **22.8%** | **10.7%** | **100%** | |

> *Ghi chú kiểm định:* 100% câu hỏi trong ngân hàng đều có lời giải chi tiết từng bước, tích hợp mã $\mathrm{\LaTeX}$ chuẩn, hình vẽ vector mô phỏng chính xác và đã được thẩm định chất lượng sư phạm bởi Tổ Tự nhiên - Trường THPT FPT Cần Thơ.

---

## 3.3. CÁC CHỨC NĂNG NỔI BẬT CỦA HỆ THỐNG

### 3.3.1. Đối với giáo viên (Teacher Workspace)

Phân hệ dành cho giáo viên cung cấp một bộ công cụ LMS toàn diện giúp số hóa công tác dạy học, giảm tải tối đa áp lực chấm chữa bài tập thủ công và quản lý tiến độ học tập của từng lớp học:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CÔNG CỤ DÀNH CHO GIÁO VIÊN                      │
├──────────────────┬──────────────────┬─────────────────┬────────────────┤
│   Quản lý lớp    │    Biên soạn     │   Giao bài tập  │  Bản đồ nhiệt  │
│  thông minh &    │  bài tập siêu tốc│   & Theo dõi    │   năng lực     │
│   Excel Import   │    bằng AI       │     tiến độ     │    Heatmap     │
└──────────────────┴──────────────────┴─────────────────┴────────────────┘
```

1. **Quản lý lớp học linh hoạt & Tiếp nhận dữ liệu hàng loạt:**
   - Giáo viên có thể khởi tạo không giới hạn lớp học theo năm học hoặc phân phối chương trình.
   - Hỗ trợ **nhập danh sách học sinh tự động từ file Excel (`.xlsx`)**, hệ thống tự khớp họ tên, mã số học sinh (MSHS) và tự động tạo mã PIN/Link tham gia lớp học bảo mật.
2. **Biên soạn và quản trị bài tập thông minh (AI Exam Parser):**
   - Giáo viên chỉ cần sao chép nội dung bài tập từ Word/PDF vào hệ thống, công cụ **AI Parser** tích hợp sẽ tự động bóc tách câu hỏi, nhận diện công thức $\mathrm{\LaTeX}$, nhận dạng bảng biến thiên và phân loại chính xác sang 3 dạng thức mới (MCQ, Đúng/Sai, Trả lời ngắn).
   - Tự động sinh đáp án và lời giải sư phạm chi tiết chỉ sau 1 cú nhấp chuột.
3. **Giao bài tập tự luyện & Theo dõi tiến độ hoàn thành (Homework Tracking - Tiêu chí HQ3):**
   - Giáo viên linh hoạt **giao bài tập về nhà hoặc bài tự luyện theo chuyên đề** thông qua cơ chế cấp mã bài tập/mã lớp (6 chữ số).
   - Thiết lập thời hạn nộp bài, cấu hình đảo thứ tự câu hỏi và đảo phương án ngẫu nhiên nhằm đa dạng hóa trải nghiệm tự học của học sinh.
   - **Theo dõi trạng thái hoàn thành trực quan (Tiêu chí HQ3):** Màn hình quản lý lớp học cho biết trực quan và tức thời học sinh nào đã hoàn thành bài tập, học sinh nào chưa làm bài được giao; nhờ đó giáo viên nắm bắt kịp thời các trường hợp chậm tiến độ để nhắc nhở và đôn đốc hỗ trợ sư phạm.
4. **Bản đồ nhiệt năng lực (Class Heatmap) & Giải pháp tối ưu thay thế theo dõi lịch sử chat AI:**
   - *Tính ưu việt so với việc đọc lịch sử chat thủ công:* Thay vì bắt buộc giáo viên phải mở đọc từng đoạn hội thoại riêng tư giữa từng học sinh với Chatbot AI (vừa tốn thời gian, gây quá tải công việc vừa xâm phạm quyền riêng tư của người học), hệ thống đã giải quyết trọn vẹn mong muốn này của giáo viên bằng **Bản đồ nhiệt năng lực lớp học (Class Heatmap)**.
   - Heatmap tự động tổng hợp dữ liệu làm bài và truy vấn học thuật, chỉ ra ngay lập tức lớp đang bị "bí" và xuất hiện "điểm mù tri thức" ở những chuyên đề hay dạng toán nào (hình học không gian $Oxyz$, xác suất Bayes, cực trị hàm số...).
   - Giúp giáo viên nắm bắt tức thời bức tranh toàn cảnh để điều chỉnh giáo án giảng dạy trên lớp; hỗ trợ xuất kết quả làm bài ra file Excel tiêu chuẩn phục vụ công tác đánh giá thường xuyên.

---

### 3.3.2. Đối với học sinh (Student Workspace)

Phân hệ học sinh là trung tâm của giải pháp học tập thích ứng, biến hành trình tự học và luyện tập thành trải nghiệm chủ động, hào hứng, hoàn toàn không áp lực:

1. **Luyện tập thích ứng cá nhân hóa (Adaptive Practice) & Chế độ Đề ngẫu nhiên (Tiêu chí CN1):**
   - Dựa trên kết quả bài tự luyện chẩn đoán khởi động, hệ thống tự động phát hiện các câu làm sai và nhận diện điểm mù tri thức của từng cá nhân.
   - **Nút "Luyện tập khắc phục ngay":** Tích hợp ngay tại khối chẩn đoán điểm mù ở Dashboard (`/overview`), cho phép học sinh chỉ với 1 cú nhấp chuột có thể truy cập ngay các bộ đề và câu hỏi tương tự được lọc sẵn theo đúng chuyên đề yếu cần cải thiện.
   - **Chế độ "Đề ngẫu nhiên (Adaptive Random Practice)":** Tự động bốc đề theo đúng phân bố ma trận chuẩn của Bộ GD&ĐT từ năm 2025, giúp học sinh rèn luyện tư duy phản xạ giải toán và xử lý đa dạng các mảng kiến thức liên môn.
   - Khi học lý thuyết, học sinh được tiếp cận theo mô hình **Giàn giáo tri thức 4 bậc (4-Tier Scaffolding)**:
     - *Bậc 1 (Nền tảng):* Bản chất trực quan & Ý nghĩa thực tế của bài học (không dùng công thức phức tạp).
     - *Bậc 2 (Cốt lõi):* Khung định lý chuẩn mực và công thức trọng tâm bắt buộc ghi nhớ.
     - *Bậc 3 (Phương pháp):* Ví dụ dẫn dắt từng bước kèm thủ thuật bấm máy tính cầm tay (Casio) bứt tốc.
     - *Bậc 4 (Đột phá):* Nhận diện bẫy câu hỏi và chiến thuật chinh phục thang điểm 9+.
2. **Trợ lý AI Socratic Scaffolding đồng hành mọi lúc mọi nơi:**
   - **Đồng hành tự học thân thiện:** Học sinh có thể trao đổi tự do với Trợ lý AI trong mọi bài học lý thuyết hoặc trong quá trình làm bài tập. AI đóng vai người thầy kiên nhẫn, gợi mở tư duy theo phương pháp Socratic, đặt câu hỏi từng bước để học sinh tự tìm ra hướng giải thay vì cung cấp đáp án thụ động.
   - **Phân tích lỗi sai sâu sắc (*AI Question Analyzer*):** Sau khi hoàn thành bài tự luyện, tại từng câu làm sai, học sinh bấm nút AI để được phân tích bản chất mình nhầm lẫn ở bước suy luận nào và cách khắc phục triệt để.
   - **Dựng đồ thị hàm số trực quan (*MathGraphPlotter*):** AI tự động vẽ đồ thị hàm số và minh họa hình học vector SVG sắc nét ngay trong khung trò chuyện để học sinh dễ dàng hình dung bài toán.
3. **Thống kê năng lực đa chiều & Dự đoán điểm thi THPTQG:**
   - Cung cấp **Biểu đồ Radar năng lực 6 trục** thể hiện rõ độ thành thạo trên các mảng: Khảo sát hàm số, Tích phân, Không gian Oxyz, Thống kê, Xác suất và Toán thực tiễn.
   - Thuật toán chẩn đoán nhận thức phân tích 4 tầng Bloom kết hợp xu hướng kết quả các lần làm bài gần nhất để đưa ra **điểm số dự phóng kỳ thi tốt nghiệp THPT chuẩn hóa thang điểm 10**, chỉ rõ chuyên đề mạnh nhất và chuyên đề yếu nhất cần bổ sung khẩn cấp.
4. **Lưu lịch sử làm bài và thống kê tiến độ theo thời gian (Tiêu chí CN4):**
   - Hệ thống tự động ghi nhận và hiển thị bảng **Lịch sử làm bài gần đây** ngay tại trang Tổng quan của học sinh: thống kê tên bài kiểm tra/bài tự luyện, chuyên đề, ngày giờ nộp bài, điểm số thực tế và xếp loại đạt được.
   - Cho phép học sinh nhấn nút **"Xem lời giải chi tiết"** để xem lại toàn bộ bài làm cũ, so sánh phương án đã chọn với đáp án chuẩn và đọc lại giải thích từng bước của những ngày trước đó để đo lường sự tiến bộ theo thời gian.
5. **Dung sai ngoại tuyến (Offline Tolerance) & Trò chơi hóa (Gamification):**
   - Tính năng **Dung sai ngoại tuyến (Offline Tolerance)** bảo vệ an toàn tiến trình tự học: nếu thiết bị mất kết nối Internet đột ngột, các câu trả lời vẫn được ghi nhận trong bộ nhớ cục bộ và tự động đồng bộ lên máy chủ ngay khi có mạng trở lại.
   - Tích hợp hệ thống điểm kinh nghiệm (XP), cấp độ học thuật (Level), chuỗi ngày học tập liên tục (Streak) và Bảng vinh danh (Leaderboard) theo tuần/tháng, thúc đẩy tinh thần tự giác thi đua học tập.

---

## 3.4. LINK VÀ MÃ QR WEBSITE

Để phục vụ công tác kiểm tra, đánh giá của Hội đồng Khoa học và tạo điều kiện cho giáo viên, học sinh toàn quốc trải nghiệm trực tiếp, hệ thống đã được triển khai công khai trên môi trường Internet:

### 1. Thông tin liên kết truy cập hệ thống
- **Địa chỉ Website chính thức:**  
  `https://fmath12-fschool.firebaseapp.com`
- **Cổng trình diễn dành cho Hội đồng Khoa học (Presentation Showcase):**  
  `https://fmath12-fschool.firebaseapp.com/showcase`
- **Mã nguồn dự án:** Được lưu trữ, quản lý phiên bản và bảo mật theo quy chuẩn mã nguồn mở tại hệ thống kho lưu trữ của nhóm tác giả.

### 2. Mã QR Code truy cập nhanh

Quý Thầy Cô và các bạn học sinh có thể sử dụng ứng dụng Máy ảnh (Camera) hoặc Zalo trên điện thoại thông minh để quét mã QR dưới đây nhằm truy cập ngay lập tức vào hệ thống:

```
┌─────────────────────────────────────────────────────────────┐
│                       QUÉT MÃ ĐỂ TRẢI NGHIỆM                │
│                                                             │
│         █▀▀▀▀▀█  ▀▄█▄▀█  █▀▀▀▀▀█        Link Website:       │
│         █ ███ █  █▄█  █  █ ███ █   fmath12-fschool.web.app  │
│         █ ▀▀▀ █  ▄ ▀█ ▄  █ ▀▀▀ █                            │
│         ▀▀▀▀▀▀▀  █ ▀ █ ▀ ▀▀▀▀▀▀▀        Tương thích:        │
│         ██▀▄ ▄▀▀▀█ ▄▄▀█▄█▀█ ▄▀█▄   - Máy tính để bàn & Mac  │
│         ▄▀█▀▄█▀▄▀▀▄ █ ▄▀█▄ ▄▀█▄█   - iPad, Máy tính bảng    │
│         █▀▀ ▀▄▀▄▀▄▀▄▀▀███▄▀█ ▄▀█   - Điện thoại thông minh  │
│         ▀▀▀ ▀▀▀  ▀▀ ▀ ▀  ▀▀▀ ▀▀▀                            │
│         █▀▀▀▀▀█  █▄▀█ █  █ █ █ █    Hỗ trợ 24/7 bởi:        │
│         █ ███ █  ▄█▀▄▀█  ██▀█▀ █    Trợ lý ảo FMATH12 AI    │
│         █ ▀▀▀ █  █ ▄█ ▄  █ ▀ █ █                            │
│         ▀▀▀▀▀▀▀  ▀  ▀ ▀  ▀▀▀▀▀▀▀                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

> *Ghi chú:* Hội đồng giám khảo có thể chọn chế độ **"Trải nghiệm nhanh (Demo Mode)"** ngay tại trang Đăng nhập hoặc trang Showcase để thị phạm toàn bộ tính năng của Giáo viên và Học sinh mà không cần đăng ký tài khoản mới.

---

## 3.5. HƯỚNG DẪN SỬ DỤNG HỆ THỐNG

### 3.5.1. Dành cho Giáo viên

```
[Đăng nhập GV] ──> [Tạo Lớp học] ──> [Nhập Excel Học sinh] ──> [Soạn Bài tập AI] ──> [Giao Bài tập] ──> [Xem Tiến độ & Heatmap]
```

- **Bước 1: Đăng nhập hệ thống:**  
  Truy cập hệ thống, chọn *Đăng nhập bằng Google* hoặc tài khoản Giáo viên được cấp.
- **Bước 2: Tạo lớp học và thêm học sinh:**  
  1. Vào menu **Quản lý lớp học** $\rightarrow$ bấm **"Tạo lớp mới"**, điền tên lớp (ví dụ: *12A1 - Toán Chuyên đề*), chọn khối 12.
  2. Bấm vào lớp vừa tạo $\rightarrow$ chọn tab **"Học sinh"** $\rightarrow$ bấm **"Nạp từ file Excel"** để tải lên danh sách học sinh có sẵn của nhà trường.
  3. Sao chép **Mã tham gia lớp (Join Code)** hoặc gửi đường link mời trực tiếp cho học sinh.
- **Bước 3: Biên soạn và cấu hình bài tập bằng AI:**  
  1. Vào menu **Soạn đề thi / bài tập** $\rightarrow$ chọn định dạng (*Bài tập theo bài, Chuyên đề, hoặc Luyện thi tốt nghiệp*).
  2. Dán nội dung câu hỏi vào khung nhập liệu $\rightarrow$ nhấn **"AI Trích xuất & Soạn lời giải tự động"**.
  3. Kiểm tra lại đáp án trắc nghiệm, hình vẽ minh họa và nhấn **"Lưu bài tập vào ngân hàng"**.
- **Bước 4: Giao bài tập về nhà và bài tự luyện cho lớp:**  
  1. Tại danh sách bài tập, giáo viên bấm **"Giao bài cho lớp"** $\rightarrow$ hệ thống cấp một mã bài tập gồm 6 chữ số kèm hạn chót nộp bài.
  2. Học sinh nhập mã để nhận bài tập hoặc truy cập trực tiếp từ danh mục bài tập của lớp học.
- **Bước 5: Theo dõi tiến độ hoàn thành & Đánh giá báo cáo:**  
  1. Trong suốt thời gian giao bài, giáo viên mở màn hình **Tiến độ bài tập**: nắm bắt danh sách chi tiết học sinh nào đã hoàn thành, học sinh nào chưa nộp bài để kịp thời đôn đốc.
  2. Giáo viên truy cập **Dashboard Bản đồ nhiệt (Heatmap)** để xem phân tích phổ điểm, các dạng toán học sinh hay nhầm lẫn và xuất bảng điểm Excel phục vụ vào sổ điểm đánh giá thường xuyên.

---

### 3.5.2. Dành cho Học sinh

```
[Đăng nhập HS] ──> [Vào Lớp / Nhập Mã] ──> [Ôn Lý thuyết 4 Bậc] ──> [Tự Luyện / Làm Bài Tập] ──> [Hỏi Trợ lý AI] ──> [Xem Lịch sử & Năng lực]
```

- **Bước 1: Đăng nhập & Tham gia lớp học:**  
  1. Học sinh đăng nhập tài khoản cá nhân thông qua email trường hoặc email cá nhân.
  2. Nhập mã lớp do giáo viên cung cấp tại mục **"Tham gia lớp học"** để đồng bộ vào danh sách lớp của mình.
- **Bước 2: Ôn tập lý thuyết chủ động:**  
  1. Vào chuyên mục **Lý thuyết Toán 12**, lựa chọn chuyên đề cần học (ví dụ: *Khảo sát hàm số, Tích phân, Tọa độ Oxyz*).
  2. Khám phá bài học qua 4 nấc thang tri thức: từ *Bản chất trực quan*, *Khung định lý*, *Ví dụ mẫu Casio*, đến *Giải mã bẫy đề thi*.
  3. Nếu gặp khái niệm chưa hiểu rõ, nhấn biểu tượng **"Hỏi FMATH AI Tutor"** để được giải thích cặn kẽ và xem hình vẽ đồ thị mô phỏng.
- **Bước 3: Tự luyện tập bài tập & Làm bài tập được giao:**  
  1. Học sinh lựa chọn bộ bài tập tự luyện theo chuyên đề hoặc nhập mã bài tập do giáo viên giao về nhà.
  2. Giao diện làm bài hỗ trợ hiển thị sắc nét công thức toán $\mathrm{\LaTeX}$, đồng hồ theo dõi thời gian và bảng chuyển nhanh câu hỏi, tạo không gian tự học thoải mái và tập trung.
- **Bước 4: Tra cứu kết quả và bù đắp lỗ hổng kiến thức:**  
  1. Ngay sau khi nộp bài, hệ thống hiển thị điểm số, lời giải chi tiết từng câu và chỉ rõ câu đúng/sai.
  2. Tại mỗi câu làm sai, học sinh bấm **"Phân tích lỗi sai cùng AI"** để tìm hiểu bản chất vì sao mình chọn sai và nhận câu hỏi gợi mở tư duy (Scaffolding).
  3. Bấm nút **"Luyện tập khắc phục ngay"** để hệ thống tự động bốc các câu hỏi tương tự cùng chuyên đề nhằm luyện tập củng cố tức thì.
- **Bước 5: Theo dõi biểu đồ năng lực & Lịch sử tiến độ (Tiêu chí CN4):**  
  1. Truy cập tab **Tổng quan năng lực (`/overview`)** để quan sát biểu đồ Radar nhận thức 6 chuyên đề và cập nhật điểm thi THPTQG dự phóng.
  2. Theo dõi bảng **Lịch sử làm bài gần đây** để xem lại danh sách tất cả các bài đã nộp, kiểm tra lại đáp án và lời giải chi tiết nhằm đánh giá tiến độ tiến bộ theo thời gian.

---

## KẾT LUẬN CHƯƠNG 3

Chương 3 đã trình bày toàn diện và chi tiết quá trình thiết kế, kiến trúc công nghệ và dữ liệu vận hành của nền tảng website **FMATH12**. Với việc áp dụng những công nghệ web tiên tiến nhất (*React 18, Supabase PostgreSQL, Row Level Security, Groq AI LPU, MathGraphPlotter*), hệ thống không chỉ giải quyết triệt để bài toán hiển thị và tương tác toán học trên nền tảng số mà còn tạo nên bước đột phá về mặt sư phạm:

1. Xây dựng thành công ngân hàng học liệu phong phú gồm **2,060 câu hỏi chuẩn hóa**, phân loại chi tiết theo 4 cấp độ nhận thức và 3 dạng thức trắc nghiệm mới nhất của Bộ GD&ĐT từ năm 2025.
2. Ứng dụng thành công **Trí tuệ nhân tạo (FMATH AI Tutor)** theo nguyên lý "Sư phạm đảo ngược" & Socratic Scaffolding đồng hành thân thiện, tháo gỡ điểm nghẽn nhận thức giúp **82% học sinh tự giải quyết được bài toán khó** sau khi được hướng dẫn từng bước.
3. Hiện thực hóa giải thuật **Học tập thích ứng (Adaptive Practice)**: Tự động phát hiện điểm mù tri thức, cung cấp nút luyện tập khắc phục tức thì, chế độ bốc đề ngẫu nhiên chuẩn ma trận và hệ thống lưu trữ lịch sử làm bài, theo dõi tiến độ theo thời gian (đáp ứng trọn vẹn tiêu chí CN1 và CN4).
4. Đảm bảo trải nghiệm tự học liền mạch, ổn định với cơ chế **Dung sai ngoại tuyến (Offline Tolerance)** bảo vệ an toàn dữ liệu làm bài khi đường truyền mạng chập chờn.
5. Cung cấp công cụ quản trị thông minh cho giáo viên qua **Bản đồ nhiệt năng lực (Heatmap)** (giải pháp tối ưu thay thế việc đọc nhật ký chat thủ công) và quy trình giao bài tập, theo dõi tiến độ hoàn thành của học sinh (tiêu chí HQ3), góp phần hiện thực hóa mục tiêu chuyển đổi số trong giáo dục và nâng cao vượt bậc năng lực tự học môn Toán lớp 12 cho học sinh THPT.
