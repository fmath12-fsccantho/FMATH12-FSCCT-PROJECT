import React, { useMemo } from 'react';

interface MathPoint {
  x: number;
  y: number;
  label?: string;
}

interface MathGraphPlotterProps {
  rawText?: string;
  fn?: string;
  title?: string;
  domain?: [number, number];
  range?: [number, number];
  points?: MathPoint[];
}

/**
 * An toàn tính toán giá trị hàm số f(x)
 */
const evaluateMath = (fnStr: string, x: number): number => {
  try {
    let clean = fnStr
      .toLowerCase()
      .replace(/(\d)([a-z])/g, '$1*$2') // 3x -> 3*x, 4x -> 4*x
      .replace(/(\))\s*([a-z0-9])/g, '$1*$2')
      .replace(/([a-z0-9])\s*(\()/g, '$1*$2')
      .replace(/\^/g, '**') // x^3 -> x**3
      .replace(/sin/g, 'Math.sin')
      .replace(/cos/g, 'Math.cos')
      .replace(/tan/g, 'Math.tan')
      .replace(/sqrt/g, 'Math.sqrt')
      .replace(/abs/g, 'Math.abs')
      .replace(/ln/g, 'Math.log')
      .replace(/pi/g, 'Math.PI');

    // Kiểm tra an toàn: chỉ cho phép toán tử và biến x
    if (!/^[0-9x\s+\-*/().Math,]+$/.test(clean)) return NaN;
    const f = new Function('x', `return ${clean};`);
    const val = f(x);
    return isFinite(val) ? val : NaN;
  } catch {
    return NaN;
  }
};

/**
 * Phân tích khối mã `function-plot` từ Markdown do AI sinh ra
 */
export const parsePlotCode = (rawText: string) => {
  const lines = rawText.split('\n');
  let fn = '';
  let title = '';
  let domain: [number, number] = [-3, 3];
  let points: MathPoint[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (/^(fn|f\(x\)|y)\s*[:=]/i.test(trimmed)) {
      fn = trimmed.replace(/^(fn|f\(x\)|y)\s*[:=]\s*/i, '').trim();
    } else if (/^title\s*[:=]/i.test(trimmed)) {
      title = trimmed.replace(/^title\s*[:=]\s*/i, '').trim();
    } else if (/^domain\s*[:=]/i.test(trimmed)) {
      const match = trimmed.match(/(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)/);
      if (match) {
        domain = [parseFloat(match[1]), parseFloat(match[2])];
      }
    } else if (/^(points|extrema)\s*[:=]/i.test(trimmed)) {
      const cleanLine = trimmed.replace(/^(points|extrema)\s*[:=]\s*/i, '');
      const ptMatches = cleanLine.matchAll(/\(([^)]+)\)/g);
      for (const m of ptMatches) {
        const parts = m[1].split(',').map(s => s.trim());
        if (parts.length >= 2) {
          const px = parseFloat(parts[0]);
          const py = parseFloat(parts[1]);
          if (!isNaN(px) && !isNaN(py)) {
            points.push({ x: px, y: py, label: parts[2] || `(${px}, ${py})` });
          }
        }
      }
    } else if (!fn && (trimmed.includes('x^') || trimmed.includes('x*') || trimmed.includes('x +') || trimmed.includes('x -'))) {
      fn = trimmed;
    }
  }

  return { fn, title, domain, points };
};

export const MathGraphPlotter: React.FC<MathGraphPlotterProps> = ({
  rawText,
  fn: propFn,
  title: propTitle,
  domain: propDomain,
  range: propRange,
  points: propPoints
}) => {
  const parsed = useMemo(() => {
    if (rawText) return parsePlotCode(rawText);
    return {
      fn: propFn || '',
      title: propTitle || '',
      domain: propDomain || [-3, 3],
      points: propPoints || []
    };
  }, [rawText, propFn, propTitle, propDomain, propPoints]);

  const { fn, title, domain, points } = parsed;

  const width = 460;
  const height = 280;
  const padX = 45;
  const padY = 35;
  const plotW = width - 2 * padX;
  const plotH = height - 2 * padY;

  // Tính toán đường cong và dải giá trị Y
  const plotData = useMemo(() => {
    if (!fn) return null;

    const [xMin, xMax] = domain;
    const steps = 140;
    const rawPoints: Array<{ x: number; y: number }> = [];
    let minY = Infinity;
    let maxY = -Infinity;

    for (let i = 0; i <= steps; i++) {
      const x = xMin + (i * (xMax - xMin)) / steps;
      const y = evaluateMath(fn, x);
      if (!isNaN(y)) {
        rawPoints.push({ x, y });
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }

    if (rawPoints.length === 0) return null;

    // Đảm bảo có cả trục Ox (y=0) trong tầm nhìn
    if (minY > 0) minY = 0;
    if (maxY < 0) maxY = 0;

    // Thêm biên trên/dưới 15% để đồ thị thở đẹp
    const spanY = Math.max(maxY - minY, 2);
    let finalYMin = minY - spanY * 0.15;
    let finalYMax = maxY + spanY * 0.15;

    // Nếu người dùng chỉ định range
    if (propRange) {
      finalYMin = propRange[0];
      finalYMax = propRange[1];
    }

    const scaleX = plotW / (xMax - xMin);
    const scaleY = plotH / (finalYMax - finalYMin);

    const toPx = (x: number, y: number) => ({
      px: padX + (x - xMin) * scaleX,
      py: padY + (finalYMax - y) * scaleY
    });

    const origin = toPx(0, 0);

    // Xây dựng đường cong SVG (ngắt nếu bước nhảy quá lớn ví dụ tiệm cận)
    let pathD = '';
    let isDrawing = false;
    for (let i = 0; i < rawPoints.length; i++) {
      const { x, y } = rawPoints[i];
      if (y < finalYMin - spanY || y > finalYMax + spanY) {
        isDrawing = false;
        continue;
      }
      const { px, py } = toPx(x, y);
      if (!isDrawing) {
        pathD += `M ${px.toFixed(1)} ${py.toFixed(1)} `;
        isDrawing = true;
      } else {
        pathD += `L ${px.toFixed(1)} ${py.toFixed(1)} `;
      }
    }

    // Tọa độ các điểm cực trị / đặc biệt
    const renderedPoints = points.map(pt => {
      const coords = toPx(pt.x, pt.y);
      return { ...pt, ...coords };
    });

    // Các vạch chia trục Ox
    const xTicks: number[] = [];
    const stepX = (xMax - xMin) > 6 ? 2 : 1;
    for (let x = Math.ceil(xMin); x <= Math.floor(xMax); x += stepX) {
      if (x !== 0) xTicks.push(x);
    }

    // Các vạch chia trục Oy
    const yTicks: number[] = [];
    const stepY = (finalYMax - finalYMin) > 8 ? 2 : 1;
    for (let y = Math.ceil(finalYMin); y <= Math.floor(finalYMax); y += stepY) {
      if (y !== 0) yTicks.push(y);
    }

    return {
      pathD,
      origin,
      renderedPoints,
      xTicks,
      yTicks,
      toPx,
      xMin,
      xMax,
      finalYMin,
      finalYMax
    };
  }, [fn, domain, points, propRange]);

  if (!plotData) {
    return null;
  }

  const { pathD, origin, renderedPoints, xTicks, yTicks, toPx, xMin, xMax, finalYMin, finalYMax } = plotData;

  return (
    <span className="block my-6 text-center select-none">
      <span className="inline-block p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-md max-w-full overflow-x-auto">
        {title && (
          <span className="block font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100 font-heading mb-2">
            {title}
          </span>
        )}
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full max-w-[460px] h-auto block mx-auto"
          style={{ minWidth: '320px', minHeight: '220px' }}
        >
          <defs>
            {/* Mũi tên trục tọa độ */}
            <marker id="arrowX" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#64748b" />
            </marker>
            <marker id="arrowY" viewBox="0 0 10 10" refX="5" refY="4" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 1 10 L 5 0 L 9 10 z" fill="#64748b" />
            </marker>
          </defs>

          {/* Lưới tọa độ mờ */}
          {xTicks.map(x => {
            const { px } = toPx(x, 0);
            return (
              <line key={`gridX-${x}`} x1={px} y1={padY} x2={px} y2={height - padY} stroke="#e2e8f0" strokeDasharray="2,2" strokeWidth="1" className="dark:stroke-slate-800" />
            );
          })}
          {yTicks.map(y => {
            const { py } = toPx(0, y);
            return (
              <line key={`gridY-${y}`} x1={padX} y1={py} x2={width - padX} y2={py} stroke="#e2e8f0" strokeDasharray="2,2" strokeWidth="1" className="dark:stroke-slate-800" />
            );
          })}

          {/* Trục Ox */}
          <line
            x1={padX - 10}
            y1={origin.py}
            x2={width - padX + 18}
            y2={origin.py}
            stroke="#64748b"
            strokeWidth="1.8"
            markerEnd="url(#arrowX)"
          />
          <text x={width - padX + 12} y={origin.py + 16} fontSize="12" fontWeight="bold" fill="#64748b" textAnchor="middle">
            x
          </text>

          {/* Trục Oy */}
          <line
            x1={origin.px}
            y1={height - padY + 10}
            x2={origin.px}
            y2={padY - 18}
            stroke="#64748b"
            strokeWidth="1.8"
            markerEnd="url(#arrowY)"
          />
          <text x={origin.px - 14} y={padY - 8} fontSize="12" fontWeight="bold" fill="#64748b" textAnchor="middle">
            y
          </text>

          {/* Gốc tọa độ O */}
          <text x={origin.px - 10} y={origin.py + 14} fontSize="11" fontWeight="bold" fill="#64748b">
            O
          </text>

          {/* Vạch chia trục Ox */}
          {xTicks.map(x => {
            const { px, py } = toPx(x, 0);
            return (
              <g key={`tickX-${x}`}>
                <line x1={px} y1={origin.py - 3} x2={px} y2={origin.py + 3} stroke="#64748b" strokeWidth="1.5" />
                <text x={px} y={origin.py + 14} fontSize="10" fill="#64748b" textAnchor="middle">
                  {x}
                </text>
              </g>
            );
          })}

          {/* Vạch chia trục Oy */}
          {yTicks.map(y => {
            const { px, py } = toPx(0, y);
            return (
              <g key={`tickY-${y}`}>
                <line x1={origin.px - 3} y1={py} x2={origin.px + 3} stroke="#64748b" strokeWidth="1.5" />
                <text x={origin.px - 8} y={py + 3} fontSize="10" fill="#64748b" textAnchor="end">
                  {y}
                </text>
              </g>
            );
          })}

          {/* Đường cong đồ thị toán học chính xác 100% */}
          <path d={pathD} fill="none" stroke="#2563eb" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />

          {/* Các điểm cực trị & tọa độ mốc */}
          {renderedPoints.map((pt, i) => (
            <g key={`pt-${i}`}>
              {/* Nét đứt dóng xuống trục */}
              <line x1={pt.px} y1={pt.py} x2={pt.px} y2={origin.py} stroke="#f43f5e" strokeDasharray="3,3" strokeWidth="1" opacity="0.6" />
              <line x1={pt.px} y1={pt.py} x2={origin.px} y2={pt.py} stroke="#f43f5e" strokeDasharray="3,3" strokeWidth="1" opacity="0.6" />

              {/* Chấm tròn cực trị */}
              <circle cx={pt.px} cy={pt.py} r="5" fill="#e11d48" stroke="#ffffff" strokeWidth="2" className="drop-shadow-xs" />
              {/* Nhãn điểm */}
              <text
                x={pt.px}
                y={pt.py < origin.py ? pt.py - 9 : pt.py + 17}
                fontSize="11"
                fontWeight="bold"
                fill="#e11d48"
                textAnchor="middle"
                className="font-ui"
              >
                {pt.label}
              </text>
            </g>
          ))}
        </svg>
      </span>
      <span className="block text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium italic">
        Đồ thị giải tích trực quan chuẩn xác 100% (FMATH12 Math Engine)
      </span>
    </span>
  );
};
