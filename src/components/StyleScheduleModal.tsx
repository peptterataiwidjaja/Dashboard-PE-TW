import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Save, 
  Calendar, 
  Clock, 
  Layers, 
  AlertTriangle, 
  CheckCircle2, 
  Info,
  Database,
  ArrowRight,
  TrendingDown,
  Sparkles,
  Calculator,
  ShieldCheck
} from 'lucide-react';
import { StyleScheduleRecord, BankDataModel } from '../types';
import { calculateScheduleMetrics, addWorkingDays, formatDateYMD, calculateAutoScheduleFromSMV } from '../utils/scheduleCalculations';

interface StyleScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: StyleScheduleRecord) => void;
  initialData?: StyleScheduleRecord | null;
  bankDataModels?: BankDataModel[];
  existingSchedules?: StyleScheduleRecord[];
}

export const StyleScheduleModal: React.FC<StyleScheduleModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  bankDataModels = [],
  existingSchedules = []
}) => {
  const [lineId, setLineId] = useState<number>(1);
  const [styleName, setStyleName] = useState<string>('');
  const [buyer, setBuyer] = useState<string>('');
  const [modelId, setModelId] = useState<string>('');
  const [orderQty, setOrderQty] = useState<number>(5000);
  const [dailyTargetQty, setDailyTargetQty] = useState<number>(500);
  const [actualQty, setActualQty] = useState<number>(0);
  const [startDate, setStartDate] = useState<string>(formatDateYMD(new Date()));
  const [plannedEndDate, setPlannedEndDate] = useState<string>(addWorkingDays(formatDateYMD(new Date()), 10));
  const [standardWorkingHours, setStandardWorkingHours] = useState<number>(8);
  const [manpower, setManpower] = useState<number>(36);
  const [smv, setSmv] = useState<number>(14.5);
  const [otHoursPerDay, setOtHoursPerDay] = useState<number>(2);
  const [notes, setNotes] = useState<string>('');
  const [isAutoCalculated, setIsAutoCalculated] = useState<boolean>(true);

  // Otomatis hitung target harian dengan buffer 10% dan tanggal selesai dari SMV
  const autoSchedule = useMemo(() => {
    return calculateAutoScheduleFromSMV({
      orderQty,
      smv,
      manpower,
      startDate,
      bufferPercent: 10,
      fiveDayWeek: false
    });
  }, [orderQty, smv, manpower, startDate]);

  // Sinkronisasi otomatis saat nilai SMV, Order, Manpower, atau StartDate berubah jika auto-calc aktif
  useEffect(() => {
    if (isAutoCalculated && autoSchedule) {
      setDailyTargetQty(autoSchedule.targetDailyMonFri);
      setPlannedEndDate(autoSchedule.plannedEndDate);
    }
  }, [autoSchedule, isAutoCalculated]);

  // Sinkronisasi saat form dibuka atau initialData berubah
  useEffect(() => {
    if (initialData) {
      setLineId(initialData.lineId);
      setStyleName(initialData.styleName);
      setBuyer(initialData.buyer);
      setModelId(initialData.modelId || '');
      setOrderQty(initialData.orderQty);
      setDailyTargetQty(initialData.dailyTargetQty);
      setActualQty(initialData.actualQty);
      setStartDate(initialData.startDate);
      setPlannedEndDate(initialData.plannedEndDate);
      setStandardWorkingHours(initialData.standardWorkingHours || 8);
      setManpower(initialData.manpower || 36);
      setSmv(initialData.smv || 14.5);
      setOtHoursPerDay(initialData.otHoursPerDay || 2);
      setNotes(initialData.notes || '');
      setIsAutoCalculated(false); // Mode edit mempertahankan nilai tersimpan
    } else {
      setLineId(1);
      setStyleName('');
      setBuyer('');
      setModelId('');
      setOrderQty(5000);
      setActualQty(0);
      const today = formatDateYMD(new Date());
      setStartDate(today);
      setStandardWorkingHours(8);
      setManpower(36);
      setSmv(14.5);
      setOtHoursPerDay(2);
      setNotes('');
      setIsAutoCalculated(true);
      
      // Auto calculation initial default
      const initCalc = calculateAutoScheduleFromSMV({
        orderQty: 5000,
        smv: 14.5,
        manpower: 36,
        startDate: today,
        bufferPercent: 10,
        fiveDayWeek: false
      });
      setDailyTargetQty(initCalc.targetDailyMonFri);
      setPlannedEndDate(initCalc.plannedEndDate);
    }
  }, [initialData, isOpen]);

  // Paksa hitung ulang otomatis dari SMV
  const handleRecalculateFromSMV = () => {
    setIsAutoCalculated(true);
    if (autoSchedule) {
      setDailyTargetQty(autoSchedule.targetDailyMonFri);
      setPlannedEndDate(autoSchedule.plannedEndDate);
    }
  };

  // Pilih dari Bank Data Model
  const handleSelectBankModel = (selectedId: string) => {
    setModelId(selectedId);
    if (!selectedId) return;
    const model = bankDataModels.find(m => m.id === selectedId);
    if (model) {
      setStyleName(model.modelCode);
      setBuyer(model.buyer);
      setSmv(model.smvStandard || 14.5);
      setManpower(model.manpowerStandard || 36);
      if (model.targetTotalPcs) {
        setOrderQty(model.targetTotalPcs);
      }
      setIsAutoCalculated(true);
    }
  };

  if (!isOpen) return null;

  // Hitung metrik live
  const preview = calculateScheduleMetrics({
    id: initialData?.id || 'temp',
    lineId,
    lineName: `Line ${lineId}`,
    styleName: styleName || 'Style Baru',
    buyer: buyer || 'Buyer',
    orderQty,
    dailyTargetQty,
    actualQty,
    startDate,
    plannedEndDate,
    standardWorkingHours,
    manpower,
    smv,
    otHoursPerDay,
    notes
  });

  // Deteksi live apakah pada Line yang dipilih ada potensi tumpang tindih
  const lineExisting = existingSchedules.filter(s => s.lineId === lineId && (!initialData || s.id !== initialData.id));
  const potentialOverlapWithPrev = lineExisting.find(s => s.needsOT && s.otEndDate >= startDate && s.startDate <= startDate);
  const potentialOverlapWithNext = lineExisting.find(s => s.startDate <= preview.otEndDate && s.startDate > startDate && preview.needsOT);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!styleName.trim()) {
      alert('Silakan isi Nama Model / Style.');
      return;
    }

    const calculated = calculateScheduleMetrics({
      id: initialData?.id || `sch-${Date.now()}`,
      lineId,
      lineName: `Line ${lineId}`,
      styleName: styleName.trim(),
      buyer: buyer.trim() || 'Umum',
      modelId: modelId || undefined,
      orderQty: Number(orderQty) || 0,
      dailyTargetQty: Number(dailyTargetQty) || 500,
      actualQty: Number(actualQty) || 0,
      startDate,
      plannedEndDate,
      standardWorkingHours: Number(standardWorkingHours) || 8,
      manpower: Number(manpower) || 36,
      smv: Number(smv) || 14.5,
      otHoursPerDay: Number(otHoursPerDay) || 2,
      notes: notes.trim()
    });

    onSave(calculated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6">
        
        {/* Header Modal */}
        <div className="px-6 py-4 bg-linear-to-r from-blue-800 to-[#1a3478] text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/15 backdrop-blur-xs flex items-center justify-center text-white">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">
                {initialData ? 'Ubah Alokasi Jadwal Style & Lembur (OT)' : 'Input Bank Data Manual Style Sewing & Jadwal OT'}
              </h3>
              <p className="text-xs text-blue-100">
                Alokasikan style ke Line produksi, hitung sisa target & estimasi jam lembur
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          
          {/* Auto Calculation Banner & Feature Highlight */}
          <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-emerald-50 border border-blue-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-blue-600 text-white rounded-lg shrink-0 mt-0.5 shadow-xs">
                <Calculator className="w-5 h-5" />
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-blue-950 uppercase tracking-wide">
                    Sistem Perhitungan Otomatis dari Target SMV & Buffer 10%
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold border border-blue-200">
                    Senin-Jumat: 8 Jam • Sabtu: 5 Jam
                  </span>
                </div>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  Cukup masukkan <strong>Target SMV</strong> dan <strong>Qty Order</strong>. Sistem secara otomatis menghitung target harian 
                  dengan penambahan <strong>buffer 10%</strong> dari target awal, serta menghitung tanggal selesai secara presisi 
                  lalu langsung di-plot ke dalam kalender alokasi style sewing.
                </p>
              </div>
            </div>

            {/* Live Calculation Output Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3 pt-3 border-t border-blue-200/60">
              <div className="bg-white/80 rounded-lg p-2 border border-blue-100">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">SMV Target</span>
                <span className="text-sm font-black text-blue-900 font-mono">{smv || 14.5} <span className="text-[10px] text-slate-400 font-normal">menit</span></span>
                <span className="text-[9px] text-slate-500 block">+10% Buffer: {autoSchedule.effectiveSMV} mnt</span>
              </div>

              <div className="bg-white/80 rounded-lg p-2 border border-blue-100">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Target Sen - Jum (8 Jam)</span>
                <span className="text-sm font-black text-indigo-900 font-mono">
                  {autoSchedule.targetDailyMonFri} <span className="text-[10px] text-slate-400 font-normal">pcs/hr</span>
                </span>
                <span className="text-[9px] text-slate-500 block">Awal Murni: {autoSchedule.baseDailyMonFri} pcs</span>
              </div>

              <div className="bg-white/80 rounded-lg p-2 border border-blue-100">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Target Sabtu (5 Jam)</span>
                <span className="text-sm font-black text-indigo-900 font-mono">
                  {autoSchedule.targetDailySaturday} <span className="text-[10px] text-slate-400 font-normal">pcs/hr</span>
                </span>
                <span className="text-[9px] text-slate-500 block">Awal Murni: {autoSchedule.baseDailySaturday} pcs</span>
              </div>

              <div className="bg-white/80 rounded-lg p-2 border border-emerald-200 bg-emerald-50/50">
                <span className="text-[10px] uppercase font-bold text-emerald-700 block">Plot Tanggal Selesai</span>
                <span className="text-sm font-black text-emerald-900 font-mono">
                  {autoSchedule.plannedEndDate}
                </span>
                <span className="text-[9px] text-emerald-600 block">{autoSchedule.totalWorkingDays} Hari Kerja</span>
              </div>
            </div>
          </div>

          {/* Quick Bank Data Template Selector */}
          {bankDataModels.length > 0 && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center space-x-2">
                <Database className="w-4 h-4 text-slate-700 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-slate-800">Atau Pilih dari Bank Data Model:</span>
                  <p className="text-[11px] text-slate-500">Otomatis mengisi Buyer & Waktu SMV Standar</p>
                </div>
              </div>
              <select
                value={modelId}
                onChange={(e) => handleSelectBankModel(e.target.value)}
                className="text-xs font-semibold bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              >
                <option value="">-- Pilih Model dari Bank Data --</option>
                {bankDataModels.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.modelCode} ({m.buyer}) - SMV {m.smvStandard} mnt
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Grid Input Utama */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            
            {/* Kategori Line */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kategori Line Produksi *
              </label>
              <select
                value={lineId}
                onChange={(e) => setLineId(Number(e.target.value))}
                className="w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                required
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                  <option key={num} value={num}>Line {num} (Sewing)</option>
                ))}
              </select>
            </div>

            {/* Nama Style */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Style / Garment Model *
              </label>
              <input
                type="text"
                value={styleName}
                onChange={(e) => setStyleName(e.target.value)}
                placeholder="Contoh: DELAMI H067 / CHINO PANTS"
                className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                required
              />
            </div>

            {/* Buyer / Customer */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Buyer / Customer
              </label>
              <input
                type="text"
                value={buyer}
                onChange={(e) => setBuyer(e.target.value)}
                placeholder="Contoh: DELAMI, ZARA, UNIQLO"
                className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            {/* SMV Target - PROMINENT INPUT */}
            <div className="bg-blue-50/50 p-2 rounded-xl border border-blue-200/80">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-black text-blue-900">
                  Target SMV (Menit) *
                </label>
                <span className="text-[10px] text-blue-700 font-bold bg-blue-100 px-1.5 py-0.2 rounded">
                  Kunci Hitung
                </span>
              </div>
              <input
                type="number"
                step="0.01"
                min="0.1"
                value={smv}
                onChange={(e) => {
                  setSmv(Number(e.target.value));
                  setIsAutoCalculated(true);
                }}
                className="w-full text-xs font-black bg-white border border-blue-400 rounded-lg px-3 py-2 text-blue-950 focus:ring-2 focus:ring-blue-600"
                required
              />
            </div>

            {/* Total Target Order / PO (Pcs) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Total Target Order (Qty Order) *
              </label>
              <input
                type="number"
                min="1"
                value={orderQty}
                onChange={(e) => {
                  setOrderQty(Number(e.target.value));
                  setIsAutoCalculated(true);
                }}
                className="w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                required
              />
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Start Date (Mulai Sewing) *
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setIsAutoCalculated(true);
                }}
                className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                required
              />
            </div>

            {/* Target Output per Hari (Pcs/Hari) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  Target per Hari (+10% Buffer) *
                </label>
                {isAutoCalculated && (
                  <span className="text-[10px] text-emerald-600 font-bold flex items-center space-x-0.5">
                    <Sparkles className="w-3 h-3" />
                    <span>Otomatis</span>
                  </span>
                )}
              </div>
              <input
                type="number"
                min="1"
                value={dailyTargetQty}
                onChange={(e) => {
                  setDailyTargetQty(Number(e.target.value));
                  setIsAutoCalculated(false);
                }}
                className="w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                required
              />
            </div>

            {/* Planned End Date */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  Planned End Date *
                </label>
                <button
                  type="button"
                  onClick={handleRecalculateFromSMV}
                  className="text-[10px] text-blue-600 hover:text-blue-700 font-bold underline flex items-center space-x-0.5 cursor-pointer"
                  title="Hitung ulang otomatis dari SMV dan buffer 10%"
                >
                  <Sparkles className="w-3 h-3 text-blue-600" />
                  <span>Hitung Ulang</span>
                </button>
              </div>
              <input
                type="date"
                value={plannedEndDate}
                onChange={(e) => {
                  setPlannedEndDate(e.target.value);
                  setIsAutoCalculated(false);
                }}
                className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                required
              />
            </div>

            {/* Aktual Output Saat Ini (Pcs) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Aktual Output Saat Ini (Pcs)
              </label>
              <input
                type="number"
                min="0"
                value={actualQty}
                onChange={(e) => setActualQty(Number(e.target.value))}
                className="w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            {/* Manpower & Jam Reguler */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Manpower Operator Sewing
              </label>
              <input
                type="number"
                min="1"
                value={manpower}
                onChange={(e) => {
                  setManpower(Number(e.target.value));
                  setIsAutoCalculated(true);
                }}
                className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            {/* Standar Kapasitas Lembur per Hari */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kapasitas Jam Lembur (OT Jam/Hari)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="5"
                value={otHoursPerDay}
                onChange={(e) => setOtHoursPerDay(Number(e.target.value))}
                className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

          </div>

          {/* LIVE METRIC PREVIEW: SISA QTY & PERHITUNGAN OT */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-700" />
                <span>Kalkulasi Otomatis Sisa Target & Kebutuhan Lembur (OT)</span>
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                preview.remainingQty > 0 
                  ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              }`}>
                {preview.remainingQty > 0 ? `Perlu Lembur (${preview.otDaysNeeded} Hari)` : 'Target Selesai Tepat Waktu'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-500">Sisa Qty (Backlog)</span>
                <p className={`text-base font-black ${preview.remainingQty > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                  {preview.remainingQty.toLocaleString()} <span className="text-[11px] font-normal text-slate-500">pcs</span>
                </p>
              </div>

              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-500">Total Jam OT Dibutuhkan</span>
                <p className="text-base font-black text-amber-600">
                  {preview.otHoursNeeded} <span className="text-[11px] font-normal text-slate-500">jam</span>
                </p>
              </div>

              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-500">Estimasi Hari Lembur</span>
                <p className="text-base font-black text-blue-700">
                  {preview.otDaysNeeded} <span className="text-[11px] font-normal text-slate-500">hari ({otHoursPerDay}j/hr)</span>
                </p>
              </div>

              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-500">Tanggal Selesai OT</span>
                <p className="text-xs font-extrabold text-slate-900 mt-1">
                  {preview.otEndDate}
                </p>
              </div>
            </div>

            {/* LIVE OVERLAP WARNING BOX */}
            {(potentialOverlapWithPrev || potentialOverlapWithNext) && (
              <div className="p-3 bg-red-50/90 border border-red-300 rounded-lg flex items-start space-x-2.5 text-xs text-red-900 animate-in fade-in duration-200">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-extrabold text-red-800">
                    Peringatan: Terdapat Potensi Tumpang Tindih (Overlap) pada Line {lineId}!
                  </p>
                  {potentialOverlapWithPrev && (
                    <p className="text-[11px] text-red-700 leading-relaxed">
                      Style ini mulai pada <strong>{startDate}</strong>, bertepatan dengan sisa jam lembur style <strong>{potentialOverlapWithPrev.styleName}</strong> yang masih berjalan hingga <strong>{potentialOverlapWithPrev.otEndDate}</strong>.
                    </p>
                  )}
                  {potentialOverlapWithNext && (
                    <p className="text-[11px] text-red-700 leading-relaxed">
                      Lembur style ini diperkirakan sampai <strong>{preview.otEndDate}</strong>, berbenturan dengan jadwal mulai style berikutnya <strong>{potentialOverlapWithNext.styleName}</strong> ({potentialOverlapWithNext.startDate}).
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Catatan Tambahan */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Catatan Hambatan / Instruksi Alokasi Operator
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Perlu pembagian regu lembur untuk obras sisa target dan persiapan setting mesin style baru di shift pagi."
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          {/* Action Footer */}
          <div className="pt-2 border-t border-slate-200 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold bg-[#1a3478] hover:bg-blue-900 text-white rounded-lg shadow-sm active:scale-95 transition-all inline-flex items-center space-x-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Simpan Jadwal & Hitung OT</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
