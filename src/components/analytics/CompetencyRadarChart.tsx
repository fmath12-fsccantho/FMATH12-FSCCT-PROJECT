import React, { useState } from 'react';
import { 
  Target, Sparkles, TrendingUp, AlertTriangle, CheckCircle2, 
  HelpCircle, RefreshCw, ChevronRight, Zap, Award, Flame, ArrowRight
} from 'lucide-react';

export interface RadarTopicData {
  topic?: string;
  name: string;
  score: number; // 0 - 100
  domain?: string;
  masteryLevel?: string;
}

interface CompetencyRadarChartProps {
  data: RadarTopicData[];
  predictedScore?: number | string;
  scoreRange?: string;
  onPracticeTopic?: (topicName: string) => void;
  onGenerateMatrixExam?: () => void;
  onFixWeaknesses?: () => void;
}

export const CompetencyRadarChart: React.FC<CompetencyRadarChartProps> = ({
  data,
  predictedScore = '---',
  scoreRange = 'Chưa có dữ liệu',
  onPracticeTopic,
  onGenerateMatrixExam,
  onFixWeaknesses
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Chuẩn hóa 6-7 chuyên đề hiển thị
  const topics: RadarTopicData[] = data && data.length >= 5 ? data : [
    { name: 'Khảo sát hàm số & Đạo hàm', score: 78, domain: 'Giải tích' },
    { name: 'Nguyên hàm & Tích phân', score: 65, domain: 'Giải tích' },
    { name: 'Tọa độ không gian Oxyz', score: 82, domain: 'Hình học' },
    { name: 'Thống kê ghép nhóm', score: 88, domain: 'Thống kê' },
    { name: 'Xác suất & Công thức Bayes', score: 58, domain: 'Xác suất' },
    { name: 'Phương trình & Mũ - Logarit', score: 72, domain: 'Đại số' },
    { name: 'Toán mô hình hóa thực tế', score: 60, domain: 'Ứng dụng' }
  ];

  const count = topics.length;
  const size = 460;
  const center = size / 2;
  const radius = 150; // Bán kính radar
  const rings = [0.2, 0.4, 0.6, 0.8, 1.0]; // 5 vòng đồng tâm: 20%, 40%, 60%, 80%, 100%

  // Tọa độ góc của từng đỉnh
  const getCoordinates = (index: number, valPercent: number, rOffset = 0) => {
    // Bắt đầu từ 12 giờ (-PI/2) và xoay theo chiều kim đồng hồ
    const angle = (Math.PI * 2 / count) * index - Math.PI / 2;
    const r = (radius * (valPercent / 100)) + rOffset;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y, angle };
  };

  // Tạo chuỗi path cho đa giác dữ liệu của học sinh
  const studentPoints = topics.map((t, idx) => {
    const sc = Math.max(8, Math.min(100, Number(t.score) || 0));
    const { x, y } = getCoordinates(idx, sc);
    return `${x},${y}`;
  }).join(' ');

  // Tìm chuyên đề yếu nhất & mạnh nhất
  let weakest = topics[0];
  let strongest = topics[0];
  topics.forEach(t => {
    if (t.score < weakest.score) weakest = t;
    if (t.score > strongest.score) strongest = t;
  });

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
      
      {/* HEADER: Tiêu đề & Dự phỏng điểm */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-xs font-bold font-heading mb-1.5">
            <Sparkles size={13} />
            <span>Thống Kê Năng Lực Toàn Diện</span>
          </div>
          <h3 className="text-lg sm:text-xl font-black font-heading text-slate-900 dark:text-white m-0">
            Biểu Đồ Radar Năng Lực & Dự Phỏng Điểm THPT
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 m-0 mt-0.5">
            Mạng nhện đánh giá độ thuần thục 7 chuyên đề trọng tâm theo Ma trận thi THPT 2026
          </p>
        </div>

        {/* Khối dự phỏng điểm */}
        <div className="flex items-center gap-3 bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-50 dark:from-slate-800 dark:to-blue-950/50 p-3.5 px-4 rounded-2xl border border-blue-200/70 dark:border-blue-900/60 shadow-2xs shrink-0">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20">
            <Award size={22} />
          </div>
          <div>
            <span className="text-[11px] font-bold font-heading text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Dự Phỏng Điểm THPT 2026
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black font-raleway text-blue-600 dark:text-blue-400 leading-tight">
                {predictedScore}
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                / 10 điểm (Dải: {scoreRange})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* BODY: SVG RADAR CHART & CHI TIẾT TỪNG CHUYÊN ĐỀ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        
        {/* SVG SPIDER WEB RADAR (7 COLS) */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center">
          <div className="relative w-full max-w-[460px] aspect-square flex items-center justify-center select-none">
            <svg 
              viewBox={`0 0 ${size} ${size}`} 
              className="w-full h-full overflow-visible drop-shadow-sm"
            >
              <defs>
                {/* Gradient nền mạng nhện học sinh */}
                <linearGradient id="radarAreaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.45" />
                  <stop offset="50%" stopColor="#6366f1" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.25" />
                </linearGradient>

                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* 5 VÒNG ĐỒNG TÂM (RINGS) */}
              {rings.map((ratio, rIdx) => {
                const ringPoints = topics.map((_, idx) => {
                  const { x, y } = getCoordinates(idx, ratio * 100);
                  return `${x},${y}`;
                }).join(' ');

                return (
                  <g key={`ring-${rIdx}`}>
                    <polygon
                      points={ringPoints}
                      fill={rIdx % 2 === 0 ? 'rgba(241, 245, 249, 0.45)' : 'transparent'}
                      stroke="currentColor"
                      strokeWidth={rIdx === rings.length - 1 ? "1.5" : "1"}
                      strokeDasharray={rIdx === rings.length - 1 ? undefined : "3 3"}
                      className="text-slate-300 dark:text-slate-700 dark:fill-slate-800/30"
                    />
                    {/* Nhãn % mức độ ở trục 12h */}
                    <text
                      x={center + 6}
                      y={center - (radius * ratio) + 3}
                      className="text-[9.5px] font-bold fill-slate-400 dark:fill-slate-500 font-raleway select-none"
                    >
                      {Math.round(ratio * 100)}%
                    </text>
                  </g>
                );
              })}

              {/* CÁC TRỤC TỎA RA (SPOKES) */}
              {topics.map((_, idx) => {
                const { x, y } = getCoordinates(idx, 100);
                return (
                  <line
                    key={`spoke-${idx}`}
                    x1={center}
                    y1={center}
                    x2={x}
                    y2={y}
                    stroke="currentColor"
                    strokeWidth="1.2"
                    className="text-slate-200 dark:text-slate-700/80"
                  />
                );
              })}

              {/* ĐA GIÁC VÙNG NĂNG LỰC CỦA HỌC SINH */}
              <polygon
                points={studentPoints}
                fill="url(#radarAreaGradient)"
                stroke="#3b82f6"
                strokeWidth="2.5"
                strokeLinejoin="round"
                className="transition-all duration-500"
              />

              {/* CÁC ĐIỂM CHỐT VÀ TOOLTIP TƯƠNG TÁC TRÊN TỪNG ĐỈNH */}
              {topics.map((t, idx) => {
                const sc = Math.max(8, Math.min(100, Number(t.score) || 0));
                const { x, y } = getCoordinates(idx, sc);
                const isHovered = hoveredIndex === idx;

                return (
                  <g 
                    key={`point-${idx}`}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    onClick={() => onPracticeTopic && onPracticeTopic(t.name)}
                  >
                    {/* Vòng hào quang khi hover */}
                    {isHovered && (
                      <circle
                        cx={x}
                        cy={y}
                        r="9"
                        fill="#3b82f6"
                        opacity="0.3"
                        className="animate-ping"
                      />
                    )}
                    <circle
                      cx={x}
                      cy={y}
                      r={isHovered ? 6 : 4.5}
                      fill={sc >= 80 ? '#10b981' : sc >= 60 ? '#3b82f6' : '#f59e0b'}
                      stroke="#ffffff"
                      strokeWidth="2"
                      className="transition-all duration-200 filter drop-shadow-xs"
                    />
                  </g>
                );
              })}

              {/* NHÃN CHUYÊN ĐỀ PHÍA NGOÀI VÒNG */}
              {topics.map((t, idx) => {
                // Đặt nhãn lệch ra ngoài bán kính một chút
                const { x, y } = getCoordinates(idx, 100, 28);
                const isHovered = hoveredIndex === idx;
                const sc = Math.round(Number(t.score) || 0);

                let textAnchor: 'middle' | 'start' | 'end' = 'middle';
                if (x < center - 30) textAnchor = 'end';
                else if (x > center + 30) textAnchor = 'start';

                return (
                  <g 
                    key={`label-${idx}`}
                    className="cursor-pointer transition-transform"
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    onClick={() => onPracticeTopic && onPracticeTopic(t.name)}
                  >
                    <text
                      x={x}
                      y={y}
                      textAnchor={textAnchor}
                      className={`text-[11px] font-heading select-none transition-colors duration-150 ${
                        isHovered 
                          ? 'fill-blue-600 dark:fill-blue-400 font-black' 
                          : 'fill-slate-700 dark:fill-slate-300 font-bold'
                      }`}
                    >
                      {t.name.length > 22 ? t.name.slice(0, 20) + '...' : t.name}
                    </text>
                    <text
                      x={x}
                      y={y + 13}
                      textAnchor={textAnchor}
                      className={`text-[10px] font-raleway select-none font-bold ${
                        sc >= 80 ? 'fill-emerald-600 dark:fill-emerald-400' :
                        sc >= 60 ? 'fill-blue-600 dark:fill-blue-400' : 'fill-amber-600 dark:fill-amber-400'
                      }`}
                    >
                      {sc}% • {sc >= 80 ? 'Thành thạo' : sc >= 60 ? 'Vững vàng' : 'Cần củng cố'}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* THÔNG TIN CHI TIẾT & HÀNH ĐỘNG CÁ NHÂN HÓA (5 COLS) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Card điểm mạnh & Điểm mù */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
            
            {/* Điểm mạnh */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800/60 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                <CheckCircle2 size={16} />
              </div>
              <div className="min-w-0">
                <span className="text-[10.5px] font-bold font-heading text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
                  Chuyên Đề Vững Vàng Nhất
                </span>
                <p className="text-xs font-bold text-slate-800 dark:text-white truncate m-0 mt-0.5">
                  {strongest.name}
                </p>
                <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold font-raleway mt-0.5">
                  Đạt {strongest.score}% • Phản xạ nhanh
                </div>
              </div>
            </div>

            {/* Điểm mù cần khắc phục */}
            <div className="p-3.5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200/70 dark:border-rose-800/60 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                <Flame size={16} />
              </div>
              <div className="min-w-0">
                <span className="text-[10.5px] font-bold font-heading text-rose-800 dark:text-rose-300 uppercase tracking-wider block">
                  Chuyên Đề Cần Bứt Phá Gấp
                </span>
                <p className="text-xs font-bold text-slate-800 dark:text-white truncate m-0 mt-0.5">
                  {weakest.name}
                </p>
                <div className="text-[11px] text-rose-700 dark:text-rose-400 font-semibold font-raleway mt-0.5">
                  Mới đạt {weakest.score}% • Rễ bẫy trắc nghiệm mới
                </div>
              </div>
            </div>

          </div>

          {/* Quick Action Buttons */}
          <div className="pt-2 space-y-2.5">
            <button
              onClick={onFixWeaknesses}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white font-bold font-heading text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-rose-600/20 transition-all cursor-pointer"
            >
              <Target size={16} />
              <span>Luyện Tập Khắc Phục Lỗi Sai & Điểm Mù</span>
              <ArrowRight size={14} />
            </button>

            <button
              onClick={onGenerateMatrixExam}
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold font-heading text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
            >
              <Sparkles size={16} />
              <span>Tạo Đề Ngẫu Nhiên Theo Ma Trận Thi 2026</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center m-0 italic">
            💡 Dữ liệu tự động tái cân bằng và định hình lại theo từng kết quả bài nộp của học sinh.
          </p>

        </div>

      </div>

    </div>
  );
};
