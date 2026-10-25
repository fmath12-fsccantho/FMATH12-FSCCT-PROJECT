/**
 * FMATH12 High-Precision Math & LaTeX Normalization Engine
 * Chuẩn hóa các công thức toán LaTeX do AI hoặc người dùng nhập:
 * 1. Chuyển đổi display math: \\[ ... \\] hoặc \[ ... \] -> $$ ... $$
 * 2. Chuyển đổi inline math: \\( ... \\) hoặc \( ... \) -> $ ... $
 * 3. Xử lý ngoặc vuông [ \frac... ] hoặc [\frac...] -> $ ... $
 * 4. Tự động bọc $ cho các lệnh LaTeX trần trụi (\frac, \sqrt, \int, \sum, \vec...)
 * 5. Tách bước Bước 1, Bước 2,... và Kết luận thành từng đoạn xuống dòng đẹp mắt.
 */

export function formatMathAndSteps(text: string | null | undefined): string {
  if (!text) return '';
  let str = String(text);

  // 1. Chuyển đổi các khối LaTeX display math: \\[ ... \\] hoặc \[ ... \] -> $$ ... $$
  str = str.replace(/\\{1,2}\[\s*([\s\S]*?)\s*\\{1,2}\]/g, (_match, formula) => {
    return `\n\n$$\n${formula.trim()}\n$$\n\n`;
  });

  // 2. Chuyển đổi các khối LaTeX inline math: \\( ... \\) hoặc \( ... \) -> $ ... $
  str = str.replace(/\\{1,2}\(\s*([\s\S]*?)\s*\\{1,2}\)/g, (_match, formula) => {
    return `$${formula.trim()}$`;
  });

  // 3. Xử lý trường hợp ngoặc vuông bọc công thức toán học bị mất dấu backslash [ ... ]:
  // Ví dụ: [\frac{d}{dx}(x^n) = n x^{n-1},] hoặc [\frac{d}{dx}(c) = 0]
  str = str.replace(/\[\s*(\\?(?:frac|dfrac|sqrt|int|sum|prod|lim|cdot|vec|overrightarrow|alpha|beta|gamma|delta|Delta|pi|infty|times|div|partial|le|ge|ne|approx|in|notin|subset|cup|cap|to|rightarrow|log|ln|sin|cos|tan|cot)[\s\S]*?)\s*\]/g, (_match, inner) => {
    let clean = inner.trim();
    // Tách dấu chấm/phẩy/chấm phẩy ở cuối nếu có để nằm ngoài dấu $
    let trailingPunctuation = '';
    if (clean.endsWith(',') || clean.endsWith(';') || clean.endsWith('.')) {
      trailingPunctuation = clean.slice(-1);
      clean = clean.slice(0, -1).trim();
    }
    const mathContent = clean.startsWith('\\') ? clean : '\\' + clean;
    return `$${mathContent}$${trailingPunctuation}`;
  });

  // 4. Nếu có các lệnh LaTeX toán học đứng độc lập ngoài dấu đô-la:
  // Ví dụ: \frac{a}{b}, \sqrt{x}
  str = str.replace(/(?<!\$)(?:\\(?:frac|dfrac)\{[^{}]+\}\{[^{}]+\})(?!\$)/g, (match) => {
    return `$${match}$`;
  });

  // 5. Tự động xuống dòng và làm đẹp cấu trúc từng bước (Bước 1, Bước 2, Bước 3, ...)
  str = str.replace(/([^\n])\s*(Bước\s+\d+[:.])/gi, '$1\n\n**$2** ');
  str = str.replace(/^(Bước\s+\d+[:.])/gi, '**$1** ');

  // 6. Tự động xuống dòng trước kết luận
  str = str.replace(/([^\n])\s*(Vậy\s+đáp\s+án[\s\S]*)/gi, '$1\n\n💡 **Kết luận:** $2');

  // 7. Chuẩn hóa khoảng trắng và dòng trống
  str = str.replace(/\n{3,}/g, '\n\n').trim();

  return str;
}

export function formatLatexInline(text: string | null | undefined): string {
  if (!text) return '';
  return formatMathAndSteps(text);
}
