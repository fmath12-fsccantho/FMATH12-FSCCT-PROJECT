// src/components/teacher/ExamMatrixSummary.tsx
import React, { useState } from 'react';
import { 
  Layers, ChevronDown, ChevronUp, Target, 
  HelpCircle, CheckCircle2, AlertTriangle, Sparkles
} from 'lucide-react';
import { 
  QuestionMatrixStats, 
  QUESTION_FORMAT_LABELS, 
  COGNITIVE_LEVEL_LABELS 
} from '../../utils/examMatrixUtils';

interface ExamMatrixSummaryProps {
  stats: QuestionMatrixStats;
  targetStandard?: boolean; // Nếu true, so sánh với chuẩn Bộ GD&ĐT 2025 (12 MCQ, 4 TF, 6 SAQ)
  onOpenAutoMatrix?: () => void;
  className?: string;
}

export const ExamMatrixSummary: React.FC<ExamMatrixSummaryProps> = ({
  stats,
  targetStandard = true,
  onOpenAutoMatrix,
  className = ''
}) => {
  const [showDetail, setShowDetail] = useState(false);

  // Đối chiếu định mức chuẩn Bộ 2025 (12 MCQ, 4 TF, 6 SAQ)
  const isMcqMet = stats.byType.mcq === 12;
  const isTfMet = stats.byType.tf === 4;
  const isSaqMet = stats.byType.saq === 6;
  const isTotalMet = stats.total === 22;

  return (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm transition-all ${className}`}>
      
      {/* HEADER BAR SUMMARY */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <Layers size={18} />
            </div>
            <div>
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300 font-heading">
                Ma trận số lượng câu hỏi
              </div>
              <div className="text-lg font-black text-slate-900 dark:text-white font-ui leading-tight flex items-center gap-2">
                <span>{stats.total}</span>
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">câu trong đề</span>
              </div>
            </div>
          </div>

          <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-800 hidden sm:block"></div>

          {/* DẠNG THỨC (FORMATS) */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors ${
              targetStandard && isMcqMet 
                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700' 
                : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            }`}>
              Phần I (MCQ): <b className="font-extrabold text-blue-600 dark:text-blue-400">{stats.byType.mcq}</b>
              {targetStandard && <span className="text-[10px] text-slate-600 dark:text-slate-300 font-bold ml-1">/ 12</span>}
            </span>

            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors ${
              targetStandard && isTfMet 
                ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700' 
                : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            }`}>
              Phần II (Đúng/Sai): <b className="font-extrabold text-amber-600 dark:text-amber-400">{stats.byType.tf}</b>
              {targetStandard && <span className="text-[10px] text-slate-600 dark:text-slate-300 font-bold ml-1">/ 4</span>}
            </span>

            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors ${
              targetStandard && isSaqMet 
                ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700' 
                : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            }`}>
              Phần III (TL Ngắn): <b className="font-extrabold text-purple-600 dark:text-purple-400">{stats.byType.saq}</b>
              {targetStandard && <span className="text-[10px] text-slate-600 dark:text-slate-300 font-bold ml-1">/ 6</span>}
            </span>
          </div>

          <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-800 hidden sm:block"></div>

          {/* MỨC ĐỘ NĂNG LỰC (LEVELS) */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> NB: <b>{stats.byLevel['Nhận biết']}</b>
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> TH: <b>{stats.byLevel['Thông hiểu']}</b>
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> VD: <b>{stats.byLevel['Vận dụng']}</b>
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> VDC: <b>{stats.byLevel['Vận dụng cao']}</b>
            </span>
          </div>
        </div>

        {/* CÁC NÚT THAO TÁC */}
        <div className="flex items-center gap-2 shrink-0">
          {onOpenAutoMatrix && (
            <button
              type="button"
              onClick={onOpenAutoMatrix}
              className="btn-primary py-1.5 px-3.5 text-xs flex items-center gap-1.5 shadow-sm"
              title="Cấu hình số lượng câu hỏi theo ma trận và bốc tự động"
            >
              <Sparkles size={14} /> Ma trận tự động
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowDetail(!showDetail)}
            className="btn-outline py-1.5 px-3 text-xs flex items-center gap-1 font-semibold"
          >
            {showDetail ? 'Thu gọn' : 'Bảng chi tiết'}
            {showDetail ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
          </button>
        </div>
      </div>

      {/* BẢNG CHI TIẾT MA TRẬN CHÉO (DẠNG THỨC x MỨC ĐỘ NĂNG LỰC) */}
      {showDetail && (
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 animate-in fade-in slide-in-from-top-2">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-center text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700">
                  <th className="p-2.5 text-left font-heading">Dạng thức câu hỏi (Cấu trúc đề 2025)</th>
                  <th className="p-2.5 text-emerald-700 dark:text-emerald-400 font-heading">Nhận biết (NB)</th>
                  <th className="p-2.5 text-blue-700 dark:text-blue-400 font-heading">Thông hiểu (TH)</th>
                  <th className="p-2.5 text-amber-700 dark:text-amber-400 font-heading">Vận dụng (VD)</th>
                  <th className="p-2.5 text-rose-700 dark:text-rose-400 font-heading">Vận dụng cao (VDC)</th>
                  <th className="p-2.5 font-heading text-slate-900 dark:text-white bg-slate-200/60 dark:bg-slate-700/60">Tổng cộng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-ui">
                {/* Phần I */}
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="p-2.5 text-left font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    Phần I: Trắc nghiệm 4 lựa chọn (MCQ)
                  </td>
                  <td className="p-2.5 font-bold text-slate-700 dark:text-slate-300">{stats.crossMatrix.mcq['Nhận biết']}</td>
                  <td className="p-2.5 font-bold text-slate-700 dark:text-slate-300">{stats.crossMatrix.mcq['Thông hiểu']}</td>
                  <td className="p-2.5 font-bold text-slate-700 dark:text-slate-300">{stats.crossMatrix.mcq['Vận dụng']}</td>
                  <td className="p-2.5 font-bold text-slate-700 dark:text-slate-300">{stats.crossMatrix.mcq['Vận dụng cao']}</td>
                  <td className="p-2.5 font-black text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20">{stats.byType.mcq} câu</td>
                </tr>

                {/* Phần II */}
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="p-2.5 text-left font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    Phần II: Trắc nghiệm Đúng / Sai (TF)
                  </td>
                  <td className="p-2.5 font-bold text-slate-700 dark:text-slate-300">{stats.crossMatrix.tf['Nhận biết']}</td>
                  <td className="p-2.5 font-bold text-slate-700 dark:text-slate-300">{stats.crossMatrix.tf['Thông hiểu']}</td>
                  <td className="p-2.5 font-bold text-slate-700 dark:text-slate-300">{stats.crossMatrix.tf['Vận dụng']}</td>
                  <td className="p-2.5 font-bold text-slate-700 dark:text-slate-300">{stats.crossMatrix.tf['Vận dụng cao']}</td>
                  <td className="p-2.5 font-black text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20">{stats.byType.tf} câu</td>
                </tr>

                {/* Phần III */}
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="p-2.5 text-left font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                    Phần III: Trắc nghiệm Trả lời ngắn (SAQ)
                  </td>
                  <td className="p-2.5 font-bold text-slate-700 dark:text-slate-300">{stats.crossMatrix.saq['Nhận biết']}</td>
                  <td className="p-2.5 font-bold text-slate-700 dark:text-slate-300">{stats.crossMatrix.saq['Thông hiểu']}</td>
                  <td className="p-2.5 font-bold text-slate-700 dark:text-slate-300">{stats.crossMatrix.saq['Vận dụng']}</td>
                  <td className="p-2.5 font-bold text-slate-700 dark:text-slate-300">{stats.crossMatrix.saq['Vận dụng cao']}</td>
                  <td className="p-2.5 font-black text-purple-600 dark:text-purple-400 bg-purple-50/50 dark:bg-purple-950/20">{stats.byType.saq} câu</td>
                </tr>

                {/* DÒNG TỔNG CỘNG */}
                <tr className="bg-slate-100/80 dark:bg-slate-800 font-extrabold text-slate-900 dark:text-white border-t border-slate-200 dark:border-slate-700">
                  <td className="p-2.5 text-left font-heading">TỔNG THEO MỨC ĐỘ</td>
                  <td className="p-2.5 text-emerald-700 dark:text-emerald-400 font-black">{stats.byLevel['Nhận biết']}</td>
                  <td className="p-2.5 text-blue-700 dark:text-blue-400 font-black">{stats.byLevel['Thông hiểu']}</td>
                  <td className="p-2.5 text-amber-700 dark:text-amber-400 font-black">{stats.byLevel['Vận dụng']}</td>
                  <td className="p-2.5 text-rose-700 dark:text-rose-400 font-black">{stats.byLevel['Vận dụng cao']}</td>
                  <td className="p-2.5 text-sm font-black bg-blue-100/70 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300">
                    {stats.total} câu
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {targetStandard && (
            <div className="mt-3 flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700">
              <div className="flex items-center gap-1.5 font-medium">
                <Target size={14} className="text-blue-500 shrink-0" />
                <span>
                  Định mức cấu trúc Đề thi Tốt nghiệp THPT 2025: <b>12 MCQ</b> (Phần I) + <b>4 Đúng/Sai</b> (Phần II) + <b>6 Trả lời ngắn</b> (Phần III) = <b>22 câu</b>.
                </span>
              </div>
              <div className="flex items-center gap-1.5 font-bold">
                {isTotalMet && isMcqMet && isTfMet && isSaqMet ? (
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 size={14} /> Chuẩn cấu trúc 100%
                  </span>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <AlertTriangle size={14} /> Chưa khớp hoàn toàn với cấu trúc 2025
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
