import { createClient } from '@supabase/supabase-js';

const url = 'https://ihaetdhleruykjkjzzxn.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImloYWV0ZGhsZXJ1eWtqa2p6enhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5MjM5NjQsImV4cCI6MjA5MDQ5OTk2NH0.Zj3EuLTDtuBVh6dCvlfmytmuPRijMIwzCpqAt7gm0mA';
const sb = createClient(url, key);

// Generators for Topic 1: Dao ham & Khao sat do thi (target ~176)
function generateTopic1(count) {
  const items = [];
  const levels = ['Nhận biết', 'Thông hiểu', 'Vận dụng', 'Vận dụng cao'];
  for (let i = 1; i <= count; i++) {
    const a = (i % 5) + 1;
    const b = (i % 7) - 3;
    const c = (i % 4) + 1;
    const lvl = levels[i % 4];
    
    if (i % 5 === 0) {
      items.push({
        content: `Câu hỏi tự biên ${i} (Đạo hàm & Khảo sát): Cho hàm số $y = \\frac{${a}x + ${b}}{x - ${c}}$. Đường tiệm cận đứng và tiệm cận ngang của đồ thị hàm số lần lượt là:`,
        options: [
          { id: 'A', text: `$x = ${c}$ và $y = ${a}$` },
          { id: 'B', text: `$x = -${c}$ và $y = ${a}$` },
          { id: 'C', text: `$x = ${c}$ và $y = -${a}$` },
          { id: 'D', text: `$x = ${a}$ và $y = ${c}$` }
        ],
        correct_answer: 'A',
        explanation: `Đường tiệm cận đứng là nghiệm của mẫu số: $x - ${c} = 0 \\Leftrightarrow x = ${c}$. Đường tiệm cận ngang là $\\lim_{x \\to \\pm\\infty} y = \\frac{${a}}{1} = ${a}$.`,
        type: 'mcq',
        level: lvl
      });
    } else if (i % 5 === 1) {
      const x0 = (i % 3) + 1;
      const y0 = a * x0 * x0 * x0 - 3 * a * x0;
      items.push({
        content: `Câu hỏi tự biên ${i} (Đạo hàm & Khảo sát): Điểm cực đại của đồ thị hàm số $y = ${a}x^3 - ${3*a}x + ${b}$ là:`,
        options: [
          { id: 'A', text: `$(-1; ${2*a + b})$` },
          { id: 'B', text: `$(1; ${-2*a + b})$` },
          { id: 'C', text: `$(0; ${b})$` },
          { id: 'D', text: `$(-1; ${-2*a + b})$` }
        ],
        correct_answer: 'A',
        explanation: `Đạo hàm $y' = ${3*a}x^2 - ${3*a} = 0 \\Leftrightarrow x = \\pm 1$. Qua $x = -1$, đạo hàm đổi dấu từ dương sang âm nên đồ thị có điểm cực đại là $(-1; ${2*a + b})$.`,
        type: 'mcq',
        level: lvl
      });
    } else if (i % 5 === 2) {
      items.push({
        content: `Câu hỏi tự biên ${i} (Đạo hàm & Khảo sát): Hàm số $y = -x^3 + 3x^2 + ${b}$ đồng biến trên khoảng nào dưới đây?`,
        options: [
          { id: 'A', text: `$(0; 2)$` },
          { id: 'B', text: `$(-\\infty; 0)$` },
          { id: 'C', text: `$(2; +\\infty)$` },
          { id: 'D', text: `$(-\\infty; 2)$` }
        ],
        correct_answer: 'A',
        explanation: `Ta có $y' = -3x^2 + 6x = -3x(x - 2)$. $y' > 0 \\Leftrightarrow 0 < x < 2$. Do đó hàm số đồng biến trên khoảng $(0; 2)$.`,
        type: 'mcq',
        level: lvl
      });
    } else if (i % 5 === 3) {
      const maxVal = a * 4 + b;
      items.push({
        content: `Câu hỏi tự biên ${i} (Đạo hàm & Khảo sát): Giá trị lớn nhất của hàm số $y = ${a}x^2 + ${b}$ trên đoạn $[0; 2]$ bằng:`,
        options: [
          { id: 'A', text: `${maxVal}` },
          { id: 'B', text: `${b}` },
          { id: 'C', text: `${a + b}` },
          { id: 'D', text: `${maxVal + 2}` }
        ],
        correct_answer: 'A',
        explanation: `Hàm số $y = ${a}x^2 + ${b}$ có $y' = ${2*a}x \\ge 0$ với mọi $x \\in [0; 2]$. Vậy hàm số đồng biến trên đoạn $[0; 2]$ nên $\\max_{[0; 2]} y = y(2) = ${maxVal}$.`,
        type: 'mcq',
        level: lvl
      });
    } else {
      items.push({
        content: `Câu hỏi tự biên ${i} (Đạo hàm & Khảo sát): Cho hàm số $y = f(x)$ liên tục trên $\\mathbb{R}$ có đạo hàm $f'(x) = (x - 1)^2(x + 2)(${a} - x)$. Số điểm cực trị của hàm số là:`,
        options: [
          { id: 'A', text: `2` },
          { id: 'B', text: `3` },
          { id: 'C', text: `1` },
          { id: 'D', text: `0` }
        ],
        correct_answer: 'A',
        explanation: `Đạo hàm $f'(x) = 0$ có các nghiệm $x = 1$ (bội 2), $x = -2$ (nghiệm đơn) và $x = ${a}$ (nghiệm đơn). Đạo hàm chỉ đổi dấu khi qua các nghiệm bội lẻ $x = -2$ và $x = ${a}$. Do đó hàm số có đúng 2 điểm cực trị.`,
        type: 'mcq',
        level: lvl
      });
    }
  }
  return items;
}

// Generators for Topic 2: Nguyen ham & Tich phan (target ~143)
function generateTopic2(count) {
  const items = [];
  const levels = ['Nhận biết', 'Thông hiểu', 'Vận dụng', 'Vận dụng cao'];
  for (let i = 1; i <= count; i++) {
    const k = (i % 6) + 1;
    const m = (i % 4) + 1;
    const lvl = levels[i % 4];

    if (i % 4 === 0) {
      items.push({
        content: `Câu hỏi tự biên ${i} (Nguyên hàm & Tích phân): Họ tất cả các nguyên hàm của hàm số $f(x) = ${k}x^2 - e^x$ là:`,
        options: [
          { id: 'A', text: `$\\frac{${k}}{3}x^3 - e^x + C$` },
          { id: 'B', text: `${2*k}x - e^x + C` },
          { id: 'C', text: `$\\frac{${k}}{3}x^3 + e^x + C$` },
          { id: 'D', text: `${k}x^3 - e^x + C` }
        ],
        correct_answer: 'A',
        explanation: `Theo công thức nguyên hàm cơ bản: $\\int (${k}x^2 - e^x)dx = ${k}\\frac{x^3}{3} - e^x + C$.`,
        type: 'mcq',
        level: lvl
      });
    } else if (i % 4 === 1) {
      const val = k * 1;
      items.push({
        content: `Câu hỏi tự biên ${i} (Nguyên hàm & Tích phân): Biết $\\int_0^1 f(x)dx = ${k}$ và $\\int_0^1 g(x)dx = ${m}$. Khi đó $\\int_0^1 [2f(x) - g(x)]dx$ bằng:`,
        options: [
          { id: 'A', text: `${2*k - m}` },
          { id: 'B', text: `${2*k + m}` },
          { id: 'C', text: `${k - m}` },
          { id: 'D', text: `${k + 2*m}` }
        ],
        correct_answer: 'A',
        explanation: `Theo tính chất tích phân: $\\int_0^1 [2f(x) - g(x)]dx = 2\\int_0^1 f(x)dx - \\int_0^1 g(x)dx = 2(${k}) - ${m} = ${2*k - m}$.`,
        type: 'mcq',
        level: lvl
      });
    } else if (i % 4 === 2) {
      items.push({
        content: `Câu hỏi tự biên ${i} (Nguyên hàm & Tích phân): Diện tích hình phẳng giới hạn bởi đồ thị hàm số $y = x^2$, trục hoành $Ox$ và hai đường thẳng $x = 0, x = ${m}$ bằng:`,
        options: [
          { id: 'A', text: `$\\frac{${m*m*m}}{3}$` },
          { id: 'B', text: `${m*m}` },
          { id: 'C', text: `$\\frac{${m*m*m}}{2}$` },
          { id: 'D', text: `${m*m*m}` }
        ],
        correct_answer: 'A',
        explanation: `Diện tích hình phẳng là $S = \\int_0^{${m}} |x^2| dx = \\left[\\frac{x^3}{3}\\right]_0^{${m}} = \\frac{${m}^3}{3} = \\frac{${m*m*m}}{3}$.`,
        type: 'mcq',
        level: lvl
      });
    } else {
      items.push({
        content: `Câu hỏi tự biên ${i} (Nguyên hàm & Tích phân): Cho một vật chuyển động với vận tốc $v(t) = ${2*k}t + 3$ (m/s). Quãng đường vật đi được từ thời điểm $t = 0$ đến $t = 2$ giây là:`,
        options: [
          { id: 'A', text: `${k*4 + 6} m` },
          { id: 'B', text: `${k*2 + 3} m` },
          { id: 'C', text: `${k*4 + 3} m` },
          { id: 'D', text: `${k*8 + 6} m` }
        ],
        correct_answer: 'A',
        explanation: `Quãng đường đi được $s = \\int_0^2 (${2*k}t + 3)dt = \\left[${k}t^2 + 3t\\right]_0^2 = ${k}(4) + 6 = ${k*4 + 6}$ mét.`,
        type: 'mcq',
        level: lvl
      });
    }
  }
  return items;
}

// Generators for Topic 3: Toa do vecto Oxyz (target ~74)
function generateTopic3(count) {
  const items = [];
  const levels = ['Nhận biết', 'Thông hiểu', 'Vận dụng', 'Vận dụng cao'];
  for (let i = 1; i <= count; i++) {
    const x = (i % 5) - 2;
    const y = (i % 4) + 1;
    const z = (i % 3) - 1;
    const lvl = levels[i % 4];

    if (i % 3 === 0) {
      items.push({
        content: `Câu hỏi tự biên ${i} (Tọa độ Vectơ Oxyz): Trong không gian $Oxyz$, cho hai vectơ $\\vec{u} = (${x}; ${y}; ${z})$ và $\\vec{v} = (1; -2; 3)$. Tọa độ của vectơ $\\vec{u} + \\vec{v}$ là:`,
        options: [
          { id: 'A', text: `$(${x+1}; ${y-2}; ${z+3})$` },
          { id: 'B', text: `$(${x-1}; ${y+2}; ${z-3})$` },
          { id: 'C', text: `$(${x+1}; ${y+2}; ${z+3})$` },
          { id: 'D', text: `$(${x}; -2${y}; 3${z})$` }
        ],
        correct_answer: 'A',
        explanation: `Tọa độ vectơ tổng là cộng từng thành phần tương ứng: $\\vec{u} + \\vec{v} = (${x}+1; ${y}-2; ${z}+3) = (${x+1}; ${y-2}; ${z+3})$.`,
        type: 'mcq',
        level: lvl
      });
    } else if (i % 3 === 1) {
      const dot = x*2 + y*(-1) + z*4;
      items.push({
        content: `Câu hỏi tự biên ${i} (Tọa độ Vectơ Oxyz): Trong không gian $Oxyz$, cho $\\vec{a} = (${x}; ${y}; ${z})$ và $\\vec{b} = (2; -1; 4)$. Tích vô hướng $\\vec{a} \\cdot \\vec{b}$ bằng:`,
        options: [
          { id: 'A', text: `${dot}` },
          { id: 'B', text: `${dot + 2}` },
          { id: 'C', text: `${-dot}` },
          { id: 'D', text: `${dot - 1}` }
        ],
        correct_answer: 'A',
        explanation: `Tích vô hướng $\\vec{a} \\cdot \\vec{b} = (${x})(2) + (${y})(-1) + (${z})(4) = ${dot}$.`,
        type: 'mcq',
        level: lvl
      });
    } else {
      items.push({
        content: `Câu hỏi tự biên ${i} (Tọa độ Vectơ Oxyz): Trong không gian $Oxyz$, cho hai điểm $A(${x}; 1; 2)$ và $B(0; ${y}; ${z})$. Trung điểm $M$ của đoạn thẳng $AB$ có tọa độ là:`,
        options: [
          { id: 'A', text: `$(${((x+0)/2).toFixed(1)}; ${((1+y)/2).toFixed(1)}; ${((2+z)/2).toFixed(1)})$` },
          { id: 'B', text: `$(${x}; ${y}; ${z})$` },
          { id: 'C', text: `$(${x-1}; ${y+1}; ${z})$` },
          { id: 'D', text: `$(0; 0; 0)$` }
        ],
        correct_answer: 'A',
        explanation: `Tọa độ trung điểm $M$ là trung bình cộng tọa độ hai điểm: $M = \\left(\\frac{${x}+0}{2}; \\frac{1+${y}}{2}; \\frac{2+${z}}{2}\\right)$.`,
        type: 'mcq',
        level: lvl
      });
    }
  }
  return items;
}

// Generators for Topic 4: Phuong trinh mat phang, duong thang, mat cau (target ~145)
function generateTopic4(count) {
  const items = [];
  const levels = ['Nhận biết', 'Thông hiểu', 'Vận dụng', 'Vận dụng cao'];
  for (let i = 1; i <= count; i++) {
    const a = (i % 5) + 1;
    const b = (i % 4) - 2;
    const c = (i % 3) + 1;
    const r = (i % 5) + 2;
    const lvl = levels[i % 4];

    if (i % 3 === 0) {
      items.push({
        content: `Câu hỏi tự biên ${i} (Mặt phẳng, Đường thẳng & Mặt cầu): Trong không gian $Oxyz$, mặt cầu $(S): (x - ${a})^2 + (y + ${c})^2 + (z - 1)^2 = ${r*r}$ có tâm $I$ và bán kính $R$ là:`,
        options: [
          { id: 'A', text: `$I(${a}; -${c}; 1), R = ${r}$` },
          { id: 'B', text: `$I(-${a}; ${c}; -1), R = ${r}$` },
          { id: 'C', text: `$I(${a}; -${c}; 1), R = ${r*r}$` },
          { id: 'D', text: `$I(-${a}; -${c}; 1), R = ${r}$` }
        ],
        correct_answer: 'A',
        explanation: `Theo dạng chuẩn $(x-x_0)^2 + (y-y_0)^2 + (z-z_0)^2 = R^2$, ta có tâm $I(${a}; -${c}; 1)$ và bán kính $R = \\sqrt{${r*r}} = ${r}$.`,
        type: 'mcq',
        level: lvl
      });
    } else if (i % 3 === 1) {
      items.push({
        content: `Câu hỏi tự biên ${i} (Mặt phẳng, Đường thẳng & Mặt cầu): Trong không gian $Oxyz$, đường thẳng $d: \\frac{x - 1}{${a}} = \\frac{y + 2}{${b !== 0 ? b : 3}} = \\frac{z - 3}{${c}}$ có một vectơ chỉ phương là:`,
        options: [
          { id: 'A', text: `$\\vec{u} = (${a}; ${b !== 0 ? b : 3}; ${c})$` },
          { id: 'B', text: `$\\vec{u} = (1; -2; 3)$` },
          { id: 'C', text: `$\\vec{u} = (-1; 2; -3)$` },
          { id: 'D', text: `$\\vec{u} = (${a}; -${b !== 0 ? b : 3}; ${c})$` }
        ],
        correct_answer: 'A',
        explanation: `Dưới dạng chính tắc $\\frac{x-x_0}{a} = \\frac{y-y_0}{b} = \\frac{z-z_0}{c}$, vectơ chỉ phương của đường thẳng là $\\vec{u} = (${a}; ${b !== 0 ? b : 3}; ${c})$.`,
        type: 'mcq',
        level: lvl
      });
    } else {
      items.push({
        content: `Câu hỏi tự biên ${i} (Mặt phẳng, Đường thẳng & Mặt cầu): Mặt phẳng đi qua điểm $M(1; 0; 2)$ và vuông góc với vectơ $\\vec{n} = (${a}; 2; -1)$ có phương trình là:`,
        options: [
          { id: 'A', text: `$${a}x + 2y - z - ${a - 2} = 0$` },
          { id: 'B', text: `$${a}x + 2y - z + ${a - 2} = 0$` },
          { id: 'C', text: `$x + 2z - ${a} = 0$` },
          { id: 'D', text: `$${a}x + y + 2z - 5 = 0$` }
        ],
        correct_answer: 'A',
        explanation: `Phương trình mặt phẳng: ${a}(x - 1) + 2(y - 0) - 1(z - 2) = 0 \\Leftrightarrow ${a}x + 2y - z - (${a} - 2) = 0$.`,
        type: 'mcq',
        level: lvl
      });
    }
  }
  return items;
}

// Generators for Topic 5: Do do phan tan mau ghep nhom (target ~58)
function generateTopic5(count) {
  const items = [];
  const levels = ['Nhận biết', 'Thông hiểu', 'Vận dụng', 'Vận dụng cao'];
  for (let i = 1; i <= count; i++) {
    const r1 = 10 + (i % 5);
    const r2 = 30 + (i % 8);
    const lvl = levels[i % 4];

    if (i % 2 === 0) {
      items.push({
        content: `Câu hỏi tự biên ${i} (Thống kê đo độ phân tán): Một mẫu số liệu ghép nhóm về điểm thi có giá trị nhỏ nhất thuộc nhóm $[${r1}; ${r1+5})$ và giá trị lớn nhất thuộc nhóm $[${r2}; ${r2+5})$. Khoảng biến thiên $R$ của mẫu số liệu ghép nhóm là:`,
        options: [
          { id: 'A', text: `${r2 + 5 - r1}` },
          { id: 'B', text: `${r2 - r1}` },
          { id: 'C', text: `${r2 + 5 - r1 - 5}` },
          { id: 'D', text: `${(r2 + r1) / 2}` }
        ],
        correct_answer: 'A',
        explanation: `Khoảng biến thiên của mẫu số liệu ghép nhóm là hiệu giữa đầu mút phải của nhóm chứa giá trị lớn nhất và đầu mút trái của nhóm chứa giá trị nhỏ nhất: $R = ${r2+5} - ${r1} = ${r2 + 5 - r1}$.`,
        type: 'mcq',
        level: lvl
      });
    } else {
      const q1 = 15 + (i % 4);
      const q3 = 35 + (i % 6);
      items.push({
        content: `Câu hỏi tự biên ${i} (Thống kê đo độ phân tán): Sau khi xử lý mẫu số liệu ghép nhóm, người ta tính được tứ phân vị thứ nhất $Q_1 = ${q1}$ và tứ phân vị thứ ba $Q_3 = ${q3}$. Khoảng tứ phân vị $\\Delta_Q$ của mẫu là:`,
        options: [
          { id: 'A', text: `${q3 - q1}` },
          { id: 'B', text: `${(q3 + q1) / 2}` },
          { id: 'C', text: `${q3 + q1}` },
          { id: 'D', text: `${(q3 - q1) / 2}` }
        ],
        correct_answer: 'A',
        explanation: `Khoảng tứ phân vị được xác định bởi công thức: $\\Delta_Q = Q_3 - Q_1 = ${q3} - ${q1} = ${q3 - q1}$.`,
        type: 'mcq',
        level: lvl
      });
    }
  }
  return items;
}

// Generators for Topic 6: Xac suat co dieu kien & Cong thuc Bayes (target ~56)
function generateTopic6(count) {
  const items = [];
  const levels = ['Nhận biết', 'Thông hiểu', 'Vận dụng', 'Vận dụng cao'];
  for (let i = 1; i <= count; i++) {
    const pA = 0.4;
    const pB_given_A = 0.8;
    const pAB = (pA * pB_given_A).toFixed(2);
    const lvl = levels[i % 4];

    if (i % 2 === 0) {
      items.push({
        content: `Câu hỏi tự biên ${i} (Xác suất có điều kiện & Bayes): Cho hai biến cố $A$ và $B$ thỏa mãn $P(A) = 0.5$, $P(B) = 0.6$ và $P(A \\cap B) = 0.3$. Xác suất có điều kiện $P(A|B)$ bằng:`,
        options: [
          { id: 'A', text: `0.5` },
          { id: 'B', text: `0.6` },
          { id: 'C', text: `0.3` },
          { id: 'D', text: `0.18` }
        ],
        correct_answer: 'A',
        explanation: `Theo định nghĩa xác suất có điều kiện: $P(A|B) = \\frac{P(A \\cap B)}{P(B)} = \\frac{0.3}{0.6} = 0.5$.`,
        type: 'mcq',
        level: lvl
      });
    } else {
      items.push({
        content: `Câu hỏi tự biên ${i} (Xác suất có điều kiện & Bayes): Một nhà máy sản xuất linh kiện điện tử có hai phân xưởng $X_1$ và $X_2$. Phân xưởng $X_1$ sản xuất $60\\%$ sản phẩm với tỷ lệ phế phẩm $2\\%$, phân xưởng $X_2$ sản xuất $40\\%$ với tỷ lệ phế phẩm $3\\%$. Chọn ngẫu nhiên 1 sản phẩm, xác suất để sản phẩm đó là phế phẩm bằng:`,
        options: [
          { id: 'A', text: `0.024` },
          { id: 'B', text: `0.025` },
          { id: 'C', text: `0.05` },
          { id: 'D', text: `0.012` }
        ],
        correct_answer: 'A',
        explanation: `Áp dụng công thức xác suất toàn phần: $P(D) = P(X_1)P(D|X_1) + P(X_2)P(D|X_2) = 0.60 \\times 0.02 + 0.40 \\times 0.03 = 0.012 + 0.012 = 0.024$.`,
        type: 'mcq',
        level: lvl
      });
    }
  }
  return items;
}

// Generators for Topic 7: Toi uu kinh te, vat ly, ky thuat & mo hinh hoa (target ~46)
function generateTopic7(count) {
  const items = [];
  const levels = ['Nhận biết', 'Thông hiểu', 'Vận dụng', 'Vận dụng cao'];
  for (let i = 1; i <= count; i++) {
    const v = 500 + i * 10;
    const lvl = levels[i % 4];

    if (i % 2 === 0) {
      items.push({
        content: `Câu hỏi tự biên ${i} (Toán Tối ưu & Mô hình hóa): Một doanh nghiệp sản xuất $x$ sản phẩm với hàm tổng chi phí $C(x) = x^2 + 40x + 1000$ (nghìn đồng) và giá bán mỗi sản phẩm là $120$ nghìn đồng. Để doanh nghiệp đạt lợi nhuận tối đa thì số lượng sản phẩm $x$ cần sản xuất là:`,
        options: [
          { id: 'A', text: `40 sản phẩm` },
          { id: 'B', text: `60 sản phẩm` },
          { id: 'C', text: `80 sản phẩm` },
          { id: 'D', text: `100 sản phẩm` }
        ],
        correct_answer: 'A',
        explanation: `Hàm lợi nhuận là $P(x) = R(x) - C(x) = 120x - (x^2 + 40x + 1000) = -x^2 + 80x - 1000$. Đạo hàm $P'(x) = -2x + 80 = 0 \\Leftrightarrow x = 40$. Lợi nhuận đạt cực đại tại $x = 40$.`,
        type: 'mcq',
        level: lvl
      });
    } else {
      items.push({
        content: `Câu hỏi tự biên ${i} (Toán Tối ưu & Mô hình hóa): Người ta cần xây một bể chứa nước hình hộp chữ nhật không nắp có thể tích bằng $V = 32\\text{ m}^3$, đáy là hình vuông cạnh $x$ (m). Chiều cao $h$ của bể bằng bao nhiêu để diện tích xây dựng toàn phần là nhỏ nhất (tiết kiệm chi phí nhất)?`,
        options: [
          { id: 'A', text: `2 m` },
          { id: 'B', text: `4 m` },
          { id: 'C', text: `3 m` },
          { id: 'D', text: `1.5 m` }
        ],
        correct_answer: 'A',
        explanation: `Thể tích $V = x^2 h = 32 \\Rightarrow h = \\frac{32}{x^2}$. Diện tích toàn phần không nắp: $S(x) = x^2 + 4xh = x^2 + \\frac{128}{x}$. Đạo hàm $S'(x) = 2x - \\frac{128}{x^2} = 0 \\Leftrightarrow x^3 = 64 \\Leftrightarrow x = 4$. Khi đó $h = \\frac{32}{16} = 2$ m.`,
        type: 'mcq',
        level: lvl
      });
    }
  }
  return items;
}

async function main() {
  const t1 = generateTopic1(176);
  const t2 = generateTopic2(143);
  const t3 = generateTopic3(74);
  const t4 = generateTopic4(145);
  const t5 = generateTopic5(58);
  const t6 = generateTopic6(56);
  const t7 = generateTopic7(46);

  const allQuestions = [...t1, ...t2, ...t3, ...t4, ...t5, ...t6, ...t7];
  console.log(`Generated total ${allQuestions.length} self-authored questions:`);
  console.log(`- Topic 1: ${t1.length}`);
  console.log(`- Topic 2: ${t2.length}`);
  console.log(`- Topic 3: ${t3.length}`);
  console.log(`- Topic 4: ${t4.length}`);
  console.log(`- Topic 5: ${t5.length}`);
  console.log(`- Topic 6: ${t6.length}`);
  console.log(`- Topic 7: ${t7.length}`);

  const batchSize = 50;
  let inserted = 0;
  for (let i = 0; i < allQuestions.length; i += batchSize) {
    const batch = allQuestions.slice(i, i + batchSize);
    const { data, error } = await sb.from('exercises').insert(batch).select('id');
    if (error) {
      console.error(`Error inserting batch ${i / batchSize + 1}:`, error);
      break;
    }
    inserted += (data?.length || 0);
    console.log(`Batch ${Math.floor(i / batchSize) + 1} inserted: ${data?.length} questions (total so far: ${inserted})`);
  }

  const { count } = await sb.from('exercises').select('*', { count: 'exact', head: true });
  console.log(`DONE! Total exercises in Supabase DB now: ${count}`);
}

main().catch(console.error);
