import{a as C}from"./groqAI-BQjr5O6L.js";import{s as k}from"./index-DP4yTpGf.js";const P=[{id:"dao_ham",name:"Khảo sát hàm số & Ứng dụng đạo hàm",domain:"I. GIẢI TÍCH",code:"1.1 - 1.4",weight:.25},{id:"tich_phan",name:"Nguyên hàm, Tích phân & Ứng dụng",domain:"I. GIẢI TÍCH",code:"2.1 - 2.2",weight:.2},{id:"oxyz",name:"Phương pháp tọa độ không gian Oxyz",domain:"II. HÌNH HỌC",code:"1 - 4",weight:.25},{id:"thong_ke",name:"Thống kê mẫu số liệu ghép nhóm",domain:"III. THỐNG KÊ",code:"1.1",weight:.1},{id:"xac_suat",name:"Xác suất có điều kiện & Công thức Bayes",domain:"III. XÁC SUẤT",code:"2.1 - 2.2",weight:.1},{id:"thuc_te",name:"Ứng dụng thực tiễn & Tối ưu hóa liên môn",domain:"IV. THỰC HÀNH",code:"1 - 4",weight:.1}],x=`
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
`.trim(),G={async analyzeQuestion(c){const n=`Dưới đây là một câu hỏi môn Toán lớp 12:

[ĐỀ BÀI CÂU HỎI]:
${c.content}

${c.options&&c.options.length>0?`[CÁC LỰA CHỌN]:
${c.options.map(i=>`${i.id||i.label||"-"}: ${i.text||i}`).join(`
`)}`:""}
${c.correct_answer?`[ĐÁP ÁN ĐÚNG]: ${typeof c.correct_answer=="object"?JSON.stringify(c.correct_answer):c.correct_answer}`:""}
${c.explanation?`[LỜI GIẢI THAM KHẢO]: ${c.explanation}`:""}

DỰA TRÊN KHUNG KIẾN THỨC VÀ TIÊU CHUẨN ĐÁNH GIÁ SAU ĐÂY:
${x}

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
}`,t="Bạn là Chuyên gia Khảo thí và Giảng dạy Toán học THPT của Bộ GD&ĐT Việt Nam. Bạn có khả năng phân tích ma trận đề thi và định vị chuẩn xác câu hỏi vào khung kiến thức GDPT 2018. Bạn chỉ trả về JSON thuần túy.";try{const i=await C(t,n,!0);if(i){let g=i.trim();g.startsWith("```")&&(g=g.replace(/^```(?:json)?\s*/i,"").replace(/\s*```$/,"").trim());const a=JSON.parse(g);return{level:a.level||"Thông hiểu",levelExplanation:a.levelExplanation||"Câu hỏi đòi hỏi hiểu và áp dụng kiến thức trọng tâm.",domain:a.domain||"I. MỘT SỐ YẾU TỐ GIẢI TÍCH",topic:a.topic||"Ứng dụng đạo hàm để khảo sát hàm số",subTopic:a.subTopic||"Khảo sát và vẽ đồ thị hàm số",competency:a.competency||"Vận dụng kiến thức trọng tâm giải toán.",trapsAndMistakes:a.trapsAndMistakes||"",solutionHint:a.solutionHint||""}}}catch(i){console.warn("Lỗi phân tích AI, áp dụng phân tích dự phòng từ khóa:",i)}return this.fallbackAnalyze(c.content)},fallbackAnalyze(c){const n=(c||"").toLowerCase();if(n.includes("oxyz")||n.includes("mặt phẳng")||n.includes("mặt cầu")||n.includes("vectơ")||n.includes("đường thẳng")||n.includes("tọa độ không gian"))return n.includes("mặt cầu")?{level:n.includes("tiếp xúc")||n.includes("cực trị")||n.includes("tham số")?"Vận dụng":"Thông hiểu",levelExplanation:"Câu hỏi về phương trình mặt cầu trong không gian Oxyz.",domain:"II. HÌNH HỌC VÀ ĐO LƯỜNG (Oxyz)",topic:"4. Phương trình mặt cầu",subTopic:"4. Phương trình mặt cầu",competency:"Xác định tâm, bán kính và thiết lập phương trình mặt cầu.",trapsAndMistakes:"Nhầm dấu tọa độ tâm khi chuyển từ dạng phương trình khai triển.",solutionHint:"Đưa phương trình về dạng chính tắc để đọc tọa độ tâm I và bán kính R."}:{level:n.includes("góc")||n.includes("khoảng cách")||n.includes("cắt nhau")?"Vận dụng":"Thông hiểu",levelExplanation:"Câu hỏi về hình học giải tích không gian Oxyz.",domain:"II. HÌNH HỌC VÀ ĐO LƯỜNG (Oxyz)",topic:"2. Phương trình mặt phẳng & Đường thẳng",subTopic:"Phương trình và quan hệ không gian",competency:"Thiết lập phương trình và xác định vị trí tương đối.",trapsAndMistakes:"Nhầm lẫn giữa vectơ pháp tuyến của mặt phẳng và vectơ chỉ phương của đường thẳng.",solutionHint:"Xác định rõ VTPT/VTCP và điểm đi qua."};if(n.includes("xác suất")||n.includes("bayes")||n.includes("điều kiện")||n.includes("ghép nhóm")||n.includes("phương sai")||n.includes("độ lệch chuẩn")||n.includes("khoảng biến thiên")||n.includes("tứ phân vị"))return n.includes("xác suất")||n.includes("bayes")||n.includes("toàn phần")?{level:n.includes("bayes")||n.includes("toàn phần")?"Vận dụng":"Thông hiểu",levelExplanation:"Câu hỏi thuộc chuyên đề Xác suất có điều kiện chuẩn GDPT mới.",domain:"III. THỐNG KÊ VÀ XÁC SUẤT",topic:"2. Xác suất có điều kiện",subTopic:"2.2. Các quy tắc tính xác suất (Bayes)",competency:"Sử dụng công thức xác suất toàn phần và công thức Bayes.",trapsAndMistakes:"Nhầm lẫn giữa P(A|B) và P(B|A).",solutionHint:"Vẽ sơ đồ hình cây để trực quan hóa các nhánh xác suất."}:{level:"Thông hiểu",levelExplanation:"Câu hỏi tính các số đặc trưng đo mức độ phân tán của mẫu số liệu ghép nhóm.",domain:"III. THỐNG KÊ VÀ XÁC SUẤT",topic:"1. Thống kê ghép nhóm",subTopic:"1.1. Các số đặc trưng của mẫu số liệu ghép nhóm",competency:"Tính khoảng tứ phân vị, phương sai và độ lệch chuẩn.",trapsAndMistakes:"Nhầm công thức độ lệch chuẩn và phương sai (quên căn bậc hai).",solutionHint:"Lập bảng tần số và giá trị đại diện cho từng nhóm số liệu."};if(n.includes("nguyên hàm")||n.includes("tích phân")||n.includes("diện tích hình phẳng")||n.includes("thể tích khối tròn xoay"))return{level:n.includes("diện tích")||n.includes("thể tích")||n.includes("thực tiễn")?"Vận dụng":"Thông hiểu",levelExplanation:"Câu hỏi về giải tích nguyên hàm và tích phân.",domain:"I. MỘT SỐ YẾU TỐ GIẢI TÍCH",topic:"2. Nguyên hàm và Tích phân",subTopic:"2.2. Tích phân và Ứng dụng hình học của tích phân",competency:"Ứng dụng tích phân tính diện tích, thể tích khối tròn xoay.",trapsAndMistakes:"Quên trị tuyệt đối khi tính diện tích hình phẳng giới hạn bởi 2 đồ thị.",solutionHint:"Tìm hoành độ giao điểm rồi áp dụng công thức tích phân tính diện tích."};const t=n.includes("có bao nhiêu giá trị nguyên")||n.includes("tham số m")||n.includes("đồng biến trên khoảng"),i=n.includes("tiệm cận đứng")||n.includes("tiệm cận ngang")||n.includes("điểm cực đại")||n.includes("điểm cực tiểu");return{level:t?"Vận dụng cao":i?"Nhận biết":"Thông hiểu",levelExplanation:"Câu hỏi ứng dụng đạo hàm để khảo sát tính chất của hàm số.",domain:"I. MỘT SỐ YẾU TỐ GIẢI TÍCH",topic:"1. Ứng dụng đạo hàm để khảo sát hàm số",subTopic:"1.1. Tính đơn điệu và Cực trị của hàm số",competency:"Nhận biết tính đơn điệu, cực trị qua bảng biến thiên hoặc đồ thị.",trapsAndMistakes:"Nhầm giữa giá trị cực trị (y) và điểm cực trị của hàm số (x).",solutionHint:"Xét dấu đạo hàm f'(x) hoặc đọc trực tiếp từ bảng biến thiên."}},async batchAnalyzeExamQuestions(c,n){if(!c||c.length===0)return{results:[],matrix:{totalQuestions:0,levels:{nb:0,th:0,vd:0,vdc:0},levelPercentages:{nb:0,th:0,vd:0,vdc:0},domains:{},topics:{},standardCompliance:"Chưa có câu hỏi",recommendation:"Đề thi chưa có câu hỏi nào để phân tích."}};const t=c.length;let i=0;const g=new Array(t),a=5,H=[];for(let h=0;h<t;h+=a){const p=c.slice(h,h+a).map((d,e)=>({globalIndex:h+e,q:d}));H.push({chunkIndex:Math.floor(h/a),items:p})}const N=async h=>{const p=h.items.map((e,u)=>{const s=e.q;return`[CÂU ${u+1}]:
${s.content||""}
${s.options&&s.options.length>0?`Lựa chọn: ${(s.options||[]).map(o=>`${o.id||o.label||"-"}: ${o.text||o}`).join(", ")}`:""}
${s.correct_answer?`Đáp án: ${typeof s.correct_answer=="object"?JSON.stringify(s.correct_answer):s.correct_answer}`:""}`}).join(`
---
`),d=`Bạn là Chuyên gia Khảo thí GDPT 2018 môn Toán 12. Phân tích nhanh danh sách các câu hỏi sau và trả về DUY NHẤT một mảng JSON:
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
]`;try{const e=await C(d,p,!0);if(e){let u=e.trim();u.startsWith("```")&&(u=u.replace(/^```(?:json)?\s*/i,"").replace(/\s*```$/,"").trim());const s=JSON.parse(u);Array.isArray(s)&&s.forEach((o,b)=>{if(b<h.items.length){const y=h.items[b];g[y.globalIndex]={questionId:y.q.id,index:y.globalIndex+1,level:o.level||"Thông hiểu",levelExplanation:o.levelExplanation||"Đòi hỏi nắm vững kiến thức trọng tâm.",domain:o.domain||"I. MỘT SỐ YẾU TỐ GIẢI TÍCH",topic:o.topic||"Ứng dụng đạo hàm khảo sát hàm số",subTopic:o.subTopic||"Kiến thức trọng tâm",competency:o.competency||"Vận dụng kiến thức giải toán",trapsAndMistakes:o.trapsAndMistakes||"",solutionHint:o.solutionHint||""}}})}}catch(e){console.warn("Lỗi phân tích chunk AI, dùng phân tích dự phòng tức thì:",e)}h.items.forEach(e=>{if(!g[e.globalIndex]){const u=G.fallbackAnalyze(e.q.content||"");g[e.globalIndex]={...u,questionId:e.q.id,index:e.globalIndex+1}}i++,n&&n(i,t)})};await Promise.all(H.map(h=>N(h)));const l={nb:0,th:0,vd:0,vdc:0},r={},T={};g.forEach(h=>{if(!h)return;h.level==="Nhận biết"?l.nb++:h.level==="Thông hiểu"?l.th++:h.level==="Vận dụng"?l.vd++:h.level==="Vận dụng cao"&&l.vdc++;const p=h.domain||"I. MỘT SỐ YẾU TỐ GIẢI TÍCH";r[p]=(r[p]||0)+1;const d=h.topic||"Chuyên đề chung";T[d]=(T[d]||0)+1});const m={nb:Math.round(l.nb/t*100),th:Math.round(l.th/t*100),vd:Math.round(l.vd/t*100),vdc:Math.round(l.vdc/t*100)};let v="Chuẩn phân hóa Đề thi Tốt nghiệp THPT 2026",I="Đề thi có tỉ lệ phân bổ hợp lý giữa các mức độ nhận thức.";return t===22||t===34?v=`Chuẩn cấu trúc Đề thi Mới của Bộ GD&ĐT (${t} câu)`:(t===40||t===50)&&(v=`Chuẩn đề trắc nghiệm truyền thống (${t} câu)`),m.nb+m.th>75?I="Đề thi hơi nghiêng về mức độ cơ bản. Có thể bổ sung thêm 2-3 câu Vận dụng thực tiễn để tăng độ phân hóa.":m.vd+m.vdc>50&&(I="Đề thi có độ khó cao, phù hợp để ôn thi học sinh giỏi hoặc phân loại các mốc 8.5 - 10 điểm."),{results:g,matrix:{totalQuestions:t,levels:l,levelPercentages:m,domains:r,topics:T,standardCompliance:v,recommendation:I}}},async saveAnalysisToExercises(c){try{const n=c.filter(t=>t.questionId).map(t=>k.from("exercises").update({level:t.level,topic:t.topic}).eq("id",t.questionId));return await Promise.all(n),!0}catch(n){return console.error("Lỗi lưu phân tích vào CSDL:",n),!1}}};export{P as C,G as q};
