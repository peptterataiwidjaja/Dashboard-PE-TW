import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Save, 
  Database, 
  Calculator, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  Layers, 
  ArrowRight,
  TrendingDown,
  ShieldAlert
} from 'lucide-react';
import { MonthlyProductivityRecord, BankDataModel, StyleScheduleRecord } from '../types';
import { calculateEfficiency, calculateProductivityPerOp, generateSmartAnalysis } from '../data/monthlyRecapData';

interface InputRecapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: MonthlyProductivityRecord) => void;
  initialData?: MonthlyProductivityRecord | null;
  bankDataModels: BankDataModel[];
  preselectedModel?: BankDataModel | null;
  styleSchedules?: StyleScheduleRecord[];
  onUpdateScheduleActual?: (scheduleId: string, addedActualQty: number) => void;
  defaultMonth?: string;
  canInputData?: boolean;
}

export const InputRecapModal: React.FC<InputRecapModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  bankDataModels,
  preselectedModel,
  styleSchedules = [],
  onUpdateScheduleActual,
  defaultMonth,
  canInputData = true
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const initialDate = defaultMonth 
    ? (todayStr.startsWith(defaultMonth) ? todayStr : `${defaultMonth}-01`)
    : todayStr;

  const [formData, setFormData] = useState<Omit<MonthlyProductivityRecord, 'id' | 'efficiencyPercent' | 'productivityPcsPerOp'>>({
    lineId: 1,
    lineName: 'Line 1',
    date: initialDate,
    style: '',
    modelId: '',
    targetDailyPcs: 0,
    actualDailyPcs: 0,
    targetOutputPcs: 0,
    actualOutputPcs: 0,
    manpower: 36,
    workingHours: 8,
    smvStandard: 0,
    defectPercent: 0,
    analysisStatus: 'optimal',
    analysisNote: '',
    note: ''
  });

  const [selectedScheduleId, setSelectedScheduleId] = useState<string>('');
  const [calcEff, setCalcEff] = useState<number>(0);
  const [calcProd, setCalcProd] = useState<number>(0);
  const [isManualModelOverride, setIsManualModelOverride] = useState<boolean>(false);

  // Otomatis deteksi style/model yang sedang berjalan di Line & Tanggal yang dipilih
  useEffect(() => {
    if (!initialData && !isManualModelOverride) {
      const runningSched = styleSchedules.find(s => 
        s.lineId === formData.lineId &&
        formData.date >= s.startDate &&
        formData.date <= (s.otEndDate || s.plannedEndDate)
      ) || styleSchedules.find(s => s.lineId === formData.lineId && s.status !== 'completed');

      if (runningSched) {
        setSelectedScheduleId(runningSched.id);
        setFormData(prev => ({
          ...prev,
          style: runningSched.styleName,
          modelId: runningSched.modelId || '',
          targetDailyPcs: runningSched.dailyTargetQty,
          targetOutputPcs: runningSched.orderQty,
          smvStandard: runningSched.smv || 14.5,
          manpower: runningSched.manpower || 36,
          workingHours: runningSched.standardWorkingHours || 8
        }));
      }
    }
  }, [formData.lineId, formData.date, styleSchedules, initialData, isManualModelOverride]);

  // Initialize data
  useEffect(() => {
    const activeDate = defaultMonth 
      ? (todayStr.startsWith(defaultMonth) ? todayStr : `${defaultMonth}-01`)
      : todayStr;

    if (initialData) {
      setFormData({
        lineId: initialData.lineId,
        lineName: initialData.lineName,
        date: initialData.date || activeDate,
        style: initialData.style,
        modelId: initialData.modelId || '',
        targetDailyPcs: initialData.targetDailyPcs || 0,
        actualDailyPcs: initialData.actualDailyPcs || initialData.actualOutputPcs || 0,
        targetOutputPcs: initialData.targetOutputPcs || 0,
        actualOutputPcs: initialData.actualOutputPcs || 0,
        manpower: initialData.manpower || 36,
        workingHours: initialData.workingHours || 8,
        smvStandard: initialData.smvStandard || 0,
        defectPercent: initialData.defectPercent || 0,
        analysisStatus: initialData.analysisStatus || 'optimal',
        analysisNote: initialData.analysisNote || '',
        note: initialData.note || ''
      });
      setIsManualModelOverride(true);
      // Cari jika ada schedule yang cocok
      const matched = styleSchedules.find(s => s.lineId === initialData.lineId && s.styleName === initialData.style);
      if (matched) setSelectedScheduleId(matched.id);
    } else if (preselectedModel) {
      setFormData({
        lineId: 1,
        lineName: 'Line 1',
        date: activeDate,
        style: preselectedModel.modelCode,
        modelId: preselectedModel.id,
        targetDailyPcs: preselectedModel.targetDailyPcs,
        actualDailyPcs: preselectedModel.targetDailyPcs,
        targetOutputPcs: preselectedModel.targetTotalPcs,
        actualOutputPcs: preselectedModel.targetDailyPcs,
        manpower: preselectedModel.manpowerStandard,
        workingHours: preselectedModel.workingHoursStandard,
        smvStandard: preselectedModel.smvStandard,
        defectPercent: 1.0,
        analysisStatus: 'optimal',
        analysisNote: 'Target awal ditetapkan sesuai standar Bank Data IE.',
        note: preselectedModel.description || ''
      });
      setIsManualModelOverride(true);
    } else {
      // Default to first active schedule on Line 1 if exists
      const line1Sched = styleSchedules.find(s => s.lineId === 1 && s.status !== 'completed');
      if (line1Sched) {
        setSelectedScheduleId(line1Sched.id);
        setFormData({
          lineId: 1,
          lineName: 'Line 1',
          date: activeDate,
          style: line1Sched.styleName,
          modelId: line1Sched.modelId || '',
          targetDailyPcs: line1Sched.dailyTargetQty,
          actualDailyPcs: line1Sched.dailyTargetQty,
          targetOutputPcs: line1Sched.orderQty,
          actualOutputPcs: line1Sched.actualQty + line1Sched.dailyTargetQty,
          manpower: line1Sched.manpower || 36,
          workingHours: line1Sched.standardWorkingHours || 8,
          smvStandard: line1Sched.smv || 15.0,
          defectPercent: 1.0,
          analysisStatus: 'optimal',
          analysisNote: 'Output harian mengurangi target perencanaan PO.',
          note: ''
        });
      } else if (bankDataModels.length > 0) {
        const firstBank = bankDataModels[0];
        setFormData({
          lineId: 1,
          lineName: 'Line 1',
          date: activeDate,
          style: firstBank.modelCode,
          modelId: firstBank.id,
          targetDailyPcs: firstBank.targetDailyPcs,
          actualDailyPcs: firstBank.targetDailyPcs,
          targetOutputPcs: firstBank.targetTotalPcs,
          actualOutputPcs: firstBank.targetDailyPcs,
          manpower: firstBank.manpowerStandard || 36,
          workingHours: firstBank.workingHoursStandard || 8,
          smvStandard: firstBank.smvStandard,
          defectPercent: 1.0,
          analysisStatus: 'optimal',
          analysisNote: '',
          note: ''
        });
      } else {
        setFormData({
          lineId: 1,
          lineName: 'Line 1',
          date: activeDate,
          style: '',
          modelId: '',
          targetDailyPcs: 0,
          actualDailyPcs: 0,
          targetOutputPcs: 0,
          actualOutputPcs: 0,
          manpower: 36,
          workingHours: 8,
          smvStandard: 0,
          defectPercent: 0,
          analysisStatus: 'optimal',
          analysisNote: '',
          note: ''
        });
      }
    }
  }, [initialData, preselectedModel, isOpen, defaultMonth]);

  // Recalculate auto metrics
  useEffect(() => {
    const eff = calculateEfficiency(
      formData.actualDailyPcs,
      formData.smvStandard,
      formData.manpower,
      formData.workingHours
    );
    const prod = calculateProductivityPerOp(formData.actualDailyPcs, formData.manpower);
    setCalcEff(eff);
    setCalcProd(prod);
  }, [formData.actualDailyPcs, formData.smvStandard, formData.manpower, formData.workingHours]);

  if (!isOpen) return null;

  // Active connected plan from styleSchedules
  const activeLinkedPlan = styleSchedules.find(s => s.id === selectedScheduleId);

  // Perhitungan sisa target perencanaan setelah input harian
  const planOrderQty = activeLinkedPlan ? activeLinkedPlan.orderQty : formData.targetOutputPcs;
  const planPrevActual = activeLinkedPlan ? activeLinkedPlan.actualQty : Math.max(0, formData.actualOutputPcs - formData.actualDailyPcs);
  const planRemainingBeforeToday = Math.max(0, planOrderQty - planPrevActual);
  const planRemainingAfterToday = Math.max(0, planRemainingBeforeToday - formData.actualDailyPcs);

  // Quick autofill when choosing a model from Bank Data
  const handleSelectBankModel = (modelId: string) => {
    const found = bankDataModels.find(m => m.id === modelId);
    if (found) {
      setFormData(prev => ({
        ...prev,
        modelId: found.id,
        style: found.modelCode,
        targetDailyPcs: found.targetDailyPcs,
        targetOutputPcs: found.targetTotalPcs,
        smvStandard: found.smvStandard,
        manpower: found.manpowerStandard,
        workingHours: found.workingHoursStandard,
        note: found.description || prev.note
      }));
    }
  };

  // When choosing an active schedule / monthly planning
  const handleSelectSchedule = (schedId: string) => {
    setSelectedScheduleId(schedId);
    const sched = styleSchedules.find(s => s.id === schedId);
    if (sched) {
      setFormData(prev => ({
        ...prev,
        lineId: sched.lineId,
        lineName: sched.lineName,
        style: sched.styleName,
        modelId: sched.modelId || '',
        targetDailyPcs: sched.dailyTargetQty,
        smvStandard: sched.smv,
        targetOutputPcs: sched.orderQty,
        actualDailyPcs: sched.dailyTargetQty,
        actualOutputPcs: sched.actualQty + sched.dailyTargetQty,
        manpower: sched.manpower || prev.manpower,
        workingHours: sched.standardWorkingHours || prev.workingHours
      }));
    }
  };

  // Generate Smart Analysis
  const handleAutoAnalysis = () => {
    const result = generateSmartAnalysis(
      formData.actualDailyPcs,
      formData.targetDailyPcs,
      calcEff,
      formData.defectPercent
    );
    setFormData(prev => ({
      ...prev,
      analysisStatus: result.status,
      analysisNote: result.text
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const record: MonthlyProductivityRecord = {
      id: initialData ? initialData.id : `rec-${Date.now()}`,
      ...formData,
      actualOutputPcs: planPrevActual + formData.actualDailyPcs,
      targetOutputPcs: planOrderQty,
      efficiencyPercent: calcEff,
      productivityPcsPerOp: calcProd
    };

    onSave(record);

    // Update target reduction in linked schedule/plan
    if (selectedScheduleId && onUpdateScheduleActual) {
      onUpdateScheduleActual(selectedScheduleId, formData.actualDailyPcs);
    }

    onClose();
  };

  const isDailyReached = formData.actualDailyPcs >= formData.targetDailyPcs;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150">
        
        {/* Accent Bar */}
        <div className="h-1.5 w-full bg-linear-to-r from-blue-700 via-blue-600 to-red-600"></div>

        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
              <h3 className="text-base font-bold text-slate-900">
                {initialData ? 'Edit Data Produksi Harian' : 'Masukan Data Produksi Harian (Mengurangi Perencanaan)'}
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              PT Teratai Widjaja • Input harian otomatis mengurangi sisa target order perencanaan
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto">
          
          {/* SECTION: HUBUNGKAN KE PERENCANAAN BULANAN (TARGET PENGURANGAN OTOMATIS) */}
          {styleSchedules.length > 0 && (
            <div className="p-3.5 bg-linear-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-blue-700 shrink-0" />
                  <span className="text-xs font-black text-blue-950 uppercase tracking-wide">
                    Hubungkan ke Perencanaan Bulanan Model:
                  </span>
                </div>
                <span className="text-[10px] font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded">
                  Target Berkurang Otomatis
                </span>
              </div>

              <select
                value={selectedScheduleId}
                onChange={(e) => handleSelectSchedule(e.target.value)}
                className="w-full text-xs font-bold px-3 py-2 bg-white border border-blue-300 rounded-lg text-blue-950 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
              >
                <option value="">-- Pilih Rencana / Style yang Sedang Berjalan --</option>
                {styleSchedules.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.lineName} • {s.styleName} ({s.buyer}) • Target Order: {s.orderQty.toLocaleString('id-ID')} pcs • Sisa: {s.remainingQty.toLocaleString('id-ID')} pcs
                  </option>
                ))}
              </select>

              {/* Dynamic Target Reduction Panel */}
              <div className="p-2.5 bg-white/90 border border-blue-200 rounded-lg grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Target Order PO</span>
                  <strong className="font-mono text-slate-800 font-bold block">
                    {planOrderQty.toLocaleString('id-ID')} pcs
                  </strong>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Telah Tercapai</span>
                  <strong className="font-mono text-blue-700 font-bold block">
                    {planPrevActual.toLocaleString('id-ID')} pcs
                  </strong>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded p-1">
                  <span className="text-[10px] text-emerald-800 uppercase block font-black">
                    Sisa Setelah Hari Ini
                  </span>
                  <strong className="font-mono text-emerald-700 font-black text-xs block">
                    {planRemainingAfterToday.toLocaleString('id-ID')} pcs
                  </strong>
                </div>
              </div>

              <div className="flex items-center space-x-1.5 text-[11px] text-blue-900 font-medium pt-0.5">
                <TrendingDown className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>
                  Input harian <strong>{formData.actualDailyPcs} pcs</strong> akan <strong>hanya mengurangi</strong> sisa target order dari perencanaan.
                </span>
              </div>
            </div>
          )}

          {/* Quick Informative Mode Alert */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-700 text-white flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-black text-blue-950">
                  Mode Input Cepat: Hanya Masukkan Output Aktual
                </div>
                <div className="text-[11px] text-blue-800">
                  Model & target SMV terdeteksi otomatis dari Style yang sedang aktif di Line dan Tanggal ini.
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsManualModelOverride(!isManualModelOverride)}
              className="text-[11px] font-bold text-blue-700 hover:text-blue-900 underline ml-2 shrink-0 cursor-pointer"
            >
              {isManualModelOverride ? 'Tutup Ubah Manual' : 'Ganti Model Manual'}
            </button>
          </div>

          {/* Row 1: Line & Tanggal Masukan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Lini Produksi (Line)
              </label>
              <select
                value={formData.lineId}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setFormData(prev => ({
                    ...prev,
                    lineId: val,
                    lineName: `Line ${val}`
                  }));
                }}
                className="w-full text-xs font-semibold px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600 cursor-pointer"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(l => (
                  <option key={l} value={l}>Line {l}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tanggal Kerja (Masukan Tanggal)
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => {
                  const newDate = e.target.value;
                  const day = new Date(newDate + 'T00:00:00').getDay();
                  const hours = day === 6 ? 5 : 8;
                  setFormData(prev => ({ 
                    ...prev, 
                    date: newDate,
                    workingHours: !isManualModelOverride ? hours : prev.workingHours
                  }));
                }}
                className="w-full text-xs font-bold px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600 text-slate-900"
                required
              />
            </div>
          </div>

          {/* Running Style Detection Card */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Style / Model Aktif Berjalan:
              </span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                ● Aktif di Jadwal
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-black text-slate-900 block">
                  {formData.style || '(Belum ada style teralokasi)'}
                </span>
                <span className="text-xs text-slate-500">
                  Target PO: {planOrderQty.toLocaleString('id-ID')} pcs • SMV Standar: {formData.smvStandard} menit • Jam: {formData.workingHours} jam
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">Target Harian Standar</span>
                <span className="text-sm font-black text-blue-700">{formData.targetDailyPcs} pcs/hari</span>
              </div>
            </div>
          </div>

          {/* Manual Model Override (Hidden by default) */}
          {isManualModelOverride && (
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2 animate-in fade-in duration-150">
              <label className="block text-xs font-bold text-amber-900">
                Pilih Model / Style Lain (Manual Override)
              </label>
              <select
                value={formData.modelId || ''}
                onChange={(e) => handleSelectBankModel(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2 bg-white border border-amber-300 rounded-lg text-slate-900 cursor-pointer"
              >
                <option value="">-- Pilih dari Bank Data --</option>
                {bankDataModels.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.modelCode} ({m.buyer}) • SMV {m.smvStandard} min • Target {m.targetDailyPcs} pcs/hr
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={formData.style}
                onChange={(e) => setFormData(prev => ({ ...prev, style: e.target.value }))}
                placeholder="Nama Style Kustom..."
                className="w-full text-xs font-bold px-3 py-2 bg-white border border-amber-300 rounded-lg text-slate-900"
              />
            </div>
          )}

          {/* PRIMARY FOCUSED INPUT: HANYA OUTPUT AKTUAL */}
          <div className="p-4 bg-linear-to-br from-blue-50 to-indigo-50/80 border-2 border-blue-500 rounded-2xl shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-black text-blue-950 uppercase tracking-wide">
                  Masukan Output Aktual Hari Ini (Pcs) *
                </label>
                <p className="text-xs text-blue-800">
                  Input ini otomatis menghitung efisiensi, produktivitas, dan mengurangi sisa target order PO
                </p>
              </div>
              <span className={`text-xs font-black px-2.5 py-1 rounded-lg ${
                isDailyReached ? 'bg-emerald-600 text-white' : 'bg-red-500 text-white'
              }`}>
                {isDailyReached ? '✓ Target Tercapai' : '✕ Di Bawah Target'}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="number"
                min={0}
                value={formData.actualDailyPcs === 0 ? '' : formData.actualDailyPcs}
                onChange={(e) => setFormData(prev => ({ ...prev, actualDailyPcs: Number(e.target.value) || 0 }))}
                placeholder="0"
                className="w-full text-2xl font-mono font-black px-4 py-2.5 bg-white border-2 border-blue-400 rounded-xl text-blue-900 focus:outline-hidden focus:ring-3 focus:ring-blue-600 shadow-inner"
                autoFocus
                required
              />
              <span className="text-sm font-bold text-blue-900 shrink-0">Pcs</span>
            </div>

            {/* Quick adjust buttons */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] font-semibold text-blue-900 mr-1">Penyesuaian Cepat:</span>
              {[50, 100, 200, 500].map(add => (
                <button
                  key={add}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, actualDailyPcs: prev.actualDailyPcs + add }))}
                  className="px-2 py-1 bg-white hover:bg-blue-100 text-blue-800 border border-blue-300 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer"
                >
                  +{add}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, actualDailyPcs: formData.targetDailyPcs }))}
                className="px-2 py-1 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer"
              >
                = Target ({formData.targetDailyPcs})
              </button>
            </div>
          </div>

          {/* READ-ONLY LIVE RESULTS: "DAN SISANYA DAPAT DILIHAT" */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center space-x-1.5">
                <Calculator className="w-4 h-4 text-blue-700" />
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  Hasil Perhitungan & Analisis Otomatis:
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-semibold">
                Sistem menghitung seketika
              </span>
            </div>

            {/* 4-Stat Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-2.5 bg-white rounded-xl border border-slate-200 text-center">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Target Harian</span>
                <span className="text-sm font-black text-slate-800 block">{formData.targetDailyPcs} pcs</span>
                <span className="text-[9px] text-slate-400">Standar IE</span>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-slate-200 text-center">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Efisiensi Sewing</span>
                <span className={`text-sm font-black block ${calcEff >= 70 ? 'text-blue-700' : 'text-red-600'}`}>
                  {calcEff}%
                </span>
                <span className="text-[9px] text-slate-400">Target ≥70%</span>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-slate-200 text-center">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Produktivitas</span>
                <span className="text-sm font-black text-slate-800 block">{calcProd} pcs/op</span>
                <span className="text-[9px] text-slate-400">{formData.manpower} operator</span>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-slate-200 text-center">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Deviasi Output</span>
                <span className={`text-sm font-black block ${
                  formData.actualDailyPcs - formData.targetDailyPcs >= 0 ? 'text-emerald-600' : 'text-red-600'
                }`}>
                  {formData.actualDailyPcs - formData.targetDailyPcs >= 0 ? '+' : ''}
                  {formData.actualDailyPcs - formData.targetDailyPcs} pcs
                </span>
                <span className="text-[9px] text-slate-400">vs target harian</span>
              </div>
            </div>

            {/* Sisa Target PO & Pengurangan Otomatis */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Total PO Style</span>
                <span className="font-bold text-slate-800">{planOrderQty.toLocaleString('id-ID')} pcs</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Telah Dihasilkan</span>
                <span className="font-bold text-blue-700">{(planPrevActual + formData.actualDailyPcs).toLocaleString('id-ID')} pcs</span>
              </div>
              <div className="bg-emerald-50 rounded-lg p-1 border border-emerald-200">
                <span className="text-[10px] text-emerald-800 block uppercase font-black">Sisa Target PO</span>
                <span className="font-black text-emerald-700 text-xs">{planRemainingAfterToday.toLocaleString('id-ID')} pcs</span>
              </div>
            </div>

            {/* Smart Analysis Summary */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 flex items-center space-x-1">
                  <span className={`w-2 h-2 rounded-full ${
                    formData.analysisStatus === 'optimal' ? 'bg-emerald-500' :
                    formData.analysisStatus === 'warning' ? 'bg-amber-500' : 'bg-red-500'
                  }`}></span>
                  <span>Evaluasi Status: {formData.analysisStatus.toUpperCase()}</span>
                </span>
                <button
                  type="button"
                  onClick={handleAutoAnalysis}
                  className="text-[11px] font-bold text-blue-700 hover:text-blue-900 inline-flex items-center space-x-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Perbarui Analisis</span>
                </button>
              </div>
              <p className="text-slate-600 text-[11px] italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                "{formData.analysisNote || 'Kinerja lini terpantau dalam kondisi terprediksi berdasarkan masukan output.'}"
              </p>
            </div>
          </div>

          {/* Perhitungan Otomatis Banner */}
          <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calculator className="w-4 h-4 text-blue-700" />
              <span className="text-xs font-bold text-blue-900">Hasil Kalkulasi Efisiensi Harian:</span>
            </div>
            <div className="flex items-center space-x-4 text-xs font-mono">
              <div>
                <span className="text-slate-500 mr-1">Efisiensi:</span>
                <strong className={`font-black ${calcEff >= 70 ? 'text-blue-700' : 'text-red-600'}`}>
                  {calcEff}%
                </strong>
              </div>
              <div>
                <span className="text-slate-500 mr-1">Output/Operator:</span>
                <strong className="text-slate-800 font-bold">{calcProd} pcs/hari</strong>
              </div>
            </div>
          </div>

          {/* Akun Monitor Read-Only Banner */}
          {!canInputData && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center space-x-2 text-xs text-amber-900 font-medium">
              <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                <strong>Akses Terbatas:</strong> Anda sedang menggunakan <strong>Akun Monitor</strong>. Pengisian dan penyimpanan data hanya dapat dilakukan oleh <strong>Akun PE</strong>.
              </span>
            </div>
          )}

          {/* Buttons */}
          <div className="pt-2 flex justify-end space-x-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              {canInputData ? 'Batal' : 'Tutup'}
            </button>
            <button
              type="submit"
              disabled={!canInputData}
              className={`px-5 py-2 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 ${
                canInputData
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-200 active:scale-95 cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
              }`}
            >
              <Save className="w-3.5 h-3.5" />
              <span>{canInputData ? 'Simpan & Kurangi Target Rencana' : '🔒 Akses Monitor (Hanya Lihat)'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
