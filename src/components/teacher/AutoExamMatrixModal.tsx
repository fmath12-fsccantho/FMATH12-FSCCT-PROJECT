// src/components/teacher/AutoExamMatrixModal.tsx
import React, { useState, useMemo } from 'react';
import { 
  X, Sparkles, Layers, Target, Check, AlertCircle, 
  RefreshCw, CheckCircle2, ChevronRight, BookOpen
} from 'lucide-react';
import { 
  EXAM_MATRIX_PRESETS, 
  pickQuestionsByMatrix, 
  normalizeQuestionType, 
  normalizeQuestionLevel 
} from '../../utils/examMatrixUtils';

interface AutoExamMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
  allAvailableQuestions: any[];
  onApplyMatrixQuestions: (pickedQuestions: any[], matrixTitle: string) => void;
}

export const AutoExamMatrixModal: React.FC<AutoExamMatrixModalProps> = ({
  isOpen,
  onClose,
  allAvailableQuestions,
  onApplyMatrixQuestions
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('gdpt_2025_standard');

  // Matrix state
  const [matrix, setMatrix] = useState({
    mcq: { 'Nhận biết': 6, 'Thông hiểu': 4, 'Vận dụng': 2, 'Vận dụng cao': 0 },
    tf: { 'Nhận biết': 1, 'Thông hiểu': 2, 'Vận dụng': 1, 'Vận dụng cao': 0 },
    saq: { 'Nhận biết': 0, 'Thông hiểu': 2, 'Vận dụng': 3, 'Vận dụng cao': 1 },
  });

  // Thống kê số câu khả dụng trong kho hiện tại
  const availableStats = useMemo(() => {
    const stats: Record<string, Record<string, number>> = {
      mcq: { 'Nhận biết': 0, 'Thông hiểu': 0, 'Vận dụng': 0, 'Vận dụng cao': 0 },
      tf: { 'Nhận biết': 0, 'Thông hiểu': 0, 'Vận dụng': 0, 'Vận dụng cao': 0 },
      saq: { 'Nhận biết': 0, 'Thông hiểu': 0, 'Vận dụng': 0, 'Vận dụng cao': 0 },
    };

    allAvailableQuestions.forEach(q => {
      const t = normalizeQuestionType(q);
      const lvl = normalizeQuestionLevel(q.level);
      if (stats[t] && stats[t][lvl] !== undefined) {
        stats[t][lvl]++;
      }
    });

    return stats;
  }, [allAvailableQuestions]);

  const totalRequested = useMemo(() => {
    let sum = 0;
    (['mcq', 'tf', 'saq'] as const).forEach(t => {
      (['Nhận biết', 'Thông hiểu', 'Vận dụng', 'Vận dụng cao'] as const).forEach(lvl => {
        sum += Number(matrix[t][lvl]) || 0;
      });
    });
    return sum;
  }, [matrix]);

  if (!isOpen) return null;

  const handleSelectPreset = (preset: typeof EXAM_MATRIX_PRESETS[0]) => {
    setSelectedPresetId(preset.id);
    setMatrix(JSON.parse(JSON.stringify(preset.matrix)));
  };

  const handleCellChange = (type: 'mcq' | 'tf' | 'saq', level: 'Nhận biết' | 'Thông hiểu' | 'Vận dụng' | 'Vận dụng cao', val: number) => {
    setMatrix(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [level]: Math.max(0, val)
      }
    }));
    setSelectedPresetId('custom');
  };

  const handleGenerate = () => {
    if (totalRequested <= 0) {
      alert("Vui lòng cấu hình số lượng lớn hơn 0 câu hỏi!");
      return;
    }

    const { picked, report } = pickQuestionsByMatrix(allAvailableQuestions, matrix);

    if (picked.length === 0) {
      alert("Không tìm thấy câu hỏi phù hợp trong kho dữ liệu theo ma trận đã cấu hình!");
      return;
    }

    const currentPreset = EXAM_MATRIX_PRESETS.find(p => p.id === selectedPresetId);
    const title = currentPreset ? currentPreset.title : `Đề thi ${picked.length} câu theo ma trận`;

    onApplyMatrixQuestions(picked, title);
    
    if (report.obtained < report.requested) {
      alert(`Đã bốc ${report.obtained}/${report.requested} câu vào đề do một số mức độ trong kho câu hỏi chưa đủ số lượng.\nChi tiết:\n- ` + report.details.slice(0, 5).join('\n- '));
    } else {
      alert(`🎉 Tuyệt vời! Đã bốc đủ 100% (${report.obtained}/${report.requested} câu) từ Ngân hàng câu hỏi vào Đề thi theo đúng ma trận cấu trúc!`);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95">
        
        {/* MODAL HEADER */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-850">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight font-heading">
                Sinh đề tự động theo Ma trận & Định mức số lượng
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 m-0">
                Lựa chọn số lượng câu theo từng Dạng thức và Mức độ năng lực chuẩn Bộ GD&ĐT
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
          
          {/* MỤC 1: CHỌN PRESET ĐỊNH MỨC MẪU */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 font-heading">
              1. Chọn Ma trận mẫu nhanh (Preset)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {EXAM_MATRIX_PRESETS.map(preset => {
                const isSelected = selectedPresetId === preset.id;
                return (
                  <div
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset)}
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-850'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                          <span>{preset.title}</span>
                          {isSelected && <span className="w-2 h-2 rounded-full bg-blue-500"></span>}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-0 leading-relaxed">
                          {preset.description}
                        </p>
                      </div>
                      <span className="shrink-0 px-2 py-0.5 rounded text-[11px] font-extrabold bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-ui">
                        {preset.total} câu
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* MỤC 2: BẢNG CẤU HÌNH ĐỊNH MỨC MA TRẬN */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-heading">
                2. Thiết lập số lượng từng Dạng thức & Mức độ năng lực
              </label>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                Kho khả dụng: <b className="text-slate-900 dark:text-white">{allAvailableQuestions.length} câu</b>
              </span>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-center text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700">
                    <th className="p-3 text-left font-heading">Dạng thức</th>
                    <th className="p-3 text-emerald-700 dark:text-emerald-400 font-heading">Nhận biết (NB)</th>
                    <th className="p-3 text-blue-700 dark:text-blue-400 font-heading">Thông hiểu (TH)</th>
                    <th className="p-3 text-amber-700 dark:text-amber-400 font-heading">Vận dụng (VD)</th>
                    <th className="p-3 text-rose-700 dark:text-rose-400 font-heading">Vận dụng cao (VDC)</th>
                    <th className="p-3 font-heading text-slate-900 dark:text-white bg-slate-200/60 dark:bg-slate-700/60">Tổng dòng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-ui">
                  
                  {/* PHẦN I: MCQ */}
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-3 text-left font-semibold text-slate-800 dark:text-slate-200">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">Phần I: Trắc nghiệm (MCQ)</div>
                          <div className="text-[10px] text-slate-400">Kho có: {availableStats.mcq['Nhận biết'] + availableStats.mcq['Thông hiểu'] + availableStats.mcq['Vận dụng'] + availableStats.mcq['Vận dụng cao']} câu</div>
                        </div>
                      </div>
                    </td>
                    {(['Nhận biết', 'Thông hiểu', 'Vận dụng', 'Vận dụng cao'] as const).map(lvl => (
                      <td key={lvl} className="p-2">
                        <div className="flex flex-col items-center gap-1">
                          <input 
                            type="number"
                            min="0"
                            value={matrix.mcq[lvl]}
                            onChange={e => handleCellChange('mcq', lvl, parseInt(e.target.value) || 0)}
                            className="w-14 text-center font-bold px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          />
                          <span className="text-[9px] text-slate-400">kho: {availableStats.mcq[lvl]}</span>
                        </div>
                      </td>
                    ))}
                    <td className="p-3 font-black text-blue-600 dark:text-blue-400 bg-blue-50/40 dark:bg-blue-950/20">
                      {matrix.mcq['Nhận biết'] + matrix.mcq['Thông hiểu'] + matrix.mcq['Vận dụng'] + matrix.mcq['Vận dụng cao']} câu
                    </td>
                  </tr>

                  {/* PHẦN II: TF */}
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-3 text-left font-semibold text-slate-800 dark:text-slate-200">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">Phần II: Đúng / Sai (TF)</div>
                          <div className="text-[10px] text-slate-400">Kho có: {availableStats.tf['Nhận biết'] + availableStats.tf['Thông hiểu'] + availableStats.tf['Vận dụng'] + availableStats.tf['Vận dụng cao']} câu</div>
                        </div>
                      </div>
                    </td>
                    {(['Nhận biết', 'Thông hiểu', 'Vận dụng', 'Vận dụng cao'] as const).map(lvl => (
                      <td key={lvl} className="p-2">
                        <div className="flex flex-col items-center gap-1">
                          <input 
                            type="number"
                            min="0"
                            value={matrix.tf[lvl]}
                            onChange={e => handleCellChange('tf', lvl, parseInt(e.target.value) || 0)}
                            className="w-14 text-center font-bold px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                          />
                          <span className="text-[9px] text-slate-400">kho: {availableStats.tf[lvl]}</span>
                        </div>
                      </td>
                    ))}
                    <td className="p-3 font-black text-amber-600 dark:text-amber-400 bg-amber-50/40 dark:bg-amber-950/20">
                      {matrix.tf['Nhận biết'] + matrix.tf['Thông hiểu'] + matrix.tf['Vận dụng'] + matrix.tf['Vận dụng cao']} câu
                    </td>
                  </tr>

                  {/* PHẦN III: SAQ */}
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-3 text-left font-semibold text-slate-800 dark:text-slate-200">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">Phần III: Trả lời ngắn (SAQ)</div>
                          <div className="text-[10px] text-slate-400">Kho có: {availableStats.saq['Nhận biết'] + availableStats.saq['Thông hiểu'] + availableStats.saq['Vận dụng'] + availableStats.saq['Vận dụng cao']} câu</div>
                        </div>
                      </div>
                    </td>
                    {(['Nhận biết', 'Thông hiểu', 'Vận dụng', 'Vận dụng cao'] as const).map(lvl => (
                      <td key={lvl} className="p-2">
                        <div className="flex flex-col items-center gap-1">
                          <input 
                            type="number"
                            min="0"
                            value={matrix.saq[lvl]}
                            onChange={e => handleCellChange('saq', lvl, parseInt(e.target.value) || 0)}
                            className="w-14 text-center font-bold px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                          />
                          <span className="text-[9px] text-slate-400">kho: {availableStats.saq[lvl]}</span>
                        </div>
                      </td>
                    ))}
                    <td className="p-3 font-black text-purple-600 dark:text-purple-400 bg-purple-50/40 dark:bg-purple-950/20">
                      {matrix.saq['Nhận biết'] + matrix.saq['Thông hiểu'] + matrix.saq['Vận dụng'] + matrix.saq['Vận dụng cao']} câu
                    </td>
                  </tr>

                  {/* TỔNG CỘNG THEO MỨC ĐỘ */}
                  <tr className="bg-slate-100/90 dark:bg-slate-800 font-extrabold text-slate-900 dark:text-white border-t border-slate-200 dark:border-slate-700">
                    <td className="p-3 text-left font-heading">TỔNG MỨC ĐỘ</td>
                    <td className="p-3 text-emerald-700 dark:text-emerald-400 font-black">
                      {matrix.mcq['Nhận biết'] + matrix.tf['Nhận biết'] + matrix.saq['Nhận biết']}
                    </td>
                    <td className="p-3 text-blue-700 dark:text-blue-400 font-black">
                      {matrix.mcq['Thông hiểu'] + matrix.tf['Thông hiểu'] + matrix.saq['Thông hiểu']}
                    </td>
                    <td className="p-3 text-amber-700 dark:text-amber-400 font-black">
                      {matrix.mcq['Vận dụng'] + matrix.tf['Vận dụng'] + matrix.saq['Vận dụng']}
                    </td>
                    <td className="p-3 text-rose-700 dark:text-rose-400 font-black">
                      {matrix.mcq['Vận dụng cao'] + matrix.tf['Vận dụng cao'] + matrix.saq['Vận dụng cao']}
                    </td>
                    <td className="p-3 text-sm font-black bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200">
                      {totalRequested} câu
                    </td>
                  </tr>

                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* MODAL FOOTER */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/60 dark:bg-slate-850">
          <div className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2">
            <span>Tổng yêu cầu:</span>
            <span className="text-base font-black text-blue-600 dark:text-blue-400 font-ui px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800">
              {totalRequested} câu hỏi
            </span>
            <span className="text-slate-400">|</span>
            <span className="text-slate-500">Khả dụng: {allAvailableQuestions.length} câu</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="btn-outline px-4 py-2 text-xs flex-1 sm:flex-none justify-center"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleGenerate}
              className="btn-primary px-5 py-2 text-xs flex-1 sm:flex-none justify-center gap-2 shadow-sm font-bold"
            >
              <Sparkles size={16} /> Bốc câu hỏi vào Đề ngay
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
