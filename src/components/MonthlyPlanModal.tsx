import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  Calendar, 
  Clock, 
  Layers, 
  Database, 
  TrendingDown, 
  CheckCircle2, 
  Info,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { StyleScheduleRecord, BankDataModel } from '../types';
import { calculateScheduleMetrics, addWorkingDays, formatDateYMD } from '../utils/scheduleCalculations';

interface MonthlyPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: StyleScheduleRecord) => void;
  initialData?: StyleScheduleRecord | null;
  bankDataModels?: BankDataModel[];
  existingSchedules?: StyleScheduleRecord[];
}

export const MonthlyPlanModal: React.FC<MonthlyPlanModalProps> = ({
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
  const [orderQty, setOrderQty] = useState<number>(5000); // Target Order (pcs)
  const [dailyTargetQty, setDailyTargetQty] = useState<number>(500); // Target Harian Style (pcs/hari)
  const [smv, setSmv] = useState<number>(25.46); // SMV (menit/pcs)
  const [startDate, setStartDate] = useState<string>(formatDateYMD(new Date())); // Mulai Kapan
  const [plannedEndDate, setPlannedEndDate] = useState<string>(addWorkingDays(formatDateYMD(new Date()), 10));
  const [actualQty, setActualQty] = useState<number>(0);
  const [manpower, setManpower] = useState<number>(40);
  const [standardWorkingHours, setStandardWorkingHours] = useState<number>(8);
  const [otHoursPerDay, setOtHoursPerDay] = useState<number>(2);
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (initialData) {
      setLineId(initialData.lineId);
      setStyleName(initialData.styleName);
      setBuyer(initialData.buyer);
      setModelId(initialData.modelId || '');
      setOrderQty(initialData.orderQty);
      setDailyTargetQty(initialData.dailyTargetQty);
      setSmv(initialData.smv || 25.46);
      setStartDate(initialData.startDate);
      setPlannedEndDate(initialData.plannedEndDate);
      setActualQty(initialData.actualQty || 0);
      setManpower(initialData.manpower || 40);
      setStandardWorkingHours(initialData.standardWorkingHours || 8);
      setOtHoursPerDay(initialData.otHoursPerDay || 2);
      setNotes(initialData.notes || '');
    } else {
      setLineId(1);
      setStyleName('');
      setBuyer('');
      setModelId('');
      setOrderQty(5000);
      setDailyTargetQty(500);
      setSmv(25.46);
      const today = formatDateYMD(new Date());
      setStartDate(today);
      setPlannedEndDate(addWorkingDays(today, 10));
      setActualQty(0);
      setManpower(40);
      setStandardWorkingHours(8);
      setOtHoursPerDay(2);
      setNotes('');
    }
  }, [initialData, isOpen]);

  // Otomatis hitung estimasi hari dan tanggal selesai ketika orderQty / target harian berubah
  const handleAutoCalcEnd = (oQty: number, dQty: number, sDate: string) => {
    if (oQty > 0 && dQty > 0 && sDate) {
      const days = Math.ceil(oQty / dQty);
      setPlannedEndDate(addWorkingDays(sDate, days));
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
      setDailyTargetQty(model.targetDailyPcs || 500);
      setSmv(model.smvStandard || 25.46);
      setManpower(model.manpowerStandard || 40);
      if (model.targetTotalPcs) {
        setOrderQty(model.targetTotalPcs);
        handleAutoCalcEnd(model.targetTotalPcs, model.targetDailyPcs || 500, startDate);
      }
    }
  };

  if (!isOpen) return null;

  // Hitung sisa target
  const remainingTarget = Math.max(0, orderQty - actualQty);
  const estimatedDays = dailyTargetQty > 0 ? Math.ceil(orderQty / dailyTargetQty) : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const recordMetrics = calculateScheduleMetrics({
      id: initialData?.id || `sched-${Date.now()}`,
      lineId,
      lineName: `Line ${lineId}`,
      styleName: styleName || `Style Line ${lineId}`,
      buyer: buyer || 'Buyer',
      modelId,
      orderQty,
      dailyTargetQty,
      actualQty,
      startDate,
      plannedEndDate,
      standardWorkingHours,
      manpower,
      smv,
      otHoursPerDay,
      notes,
      status: actualQty >= orderQty ? 'completed' : 'running'
    });

    onSave(recordMetrics);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header Modal */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-tight uppercase">
                {initialData ? 'Ubah Perencanaan Bulanan Model' : 'Masukan Perencanaan Bulanan Model & Target Order'}
              </h3>
              <p className="text-[11px] text-slate-400">
                Input Model, Target Order, Target Harian, SMV & Tanggal Mulai (Input harian akan mengurangi target)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto">
          
          {/* Bank Data Quick Selector */}
          <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center space-x-2">
              <Database className="w-4 h-4 text-blue-700 shrink-0" />
              <div>
                <span className="text-xs font-bold text-blue-900 block">Pilih dari Bank Data Model</span>
                <span className="text-[10px] text-blue-700">Otomatis mengisi target harian, SMV standar, dan buyer</span>
              </div>
            </div>
            <select
              value={modelId}
              onChange={(e) => handleSelectBankModel(e.target.value)}
              className="text-xs font-semibold px-3 py-1.5 bg-white border border-blue-300 rounded-lg text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="">-- Pilih Model dari Bank Data --</option>
              {bankDataModels.map(m => (
                <option key={m.id} value={m.id}>
                  {m.modelCode} ({m.buyer}) • SMV: {m.smvStandard}m • Target: {m.targetDailyPcs} pcs/hr
                </option>
              ))}
            </select>
          </div>

          {/* Row 1: Line & Model / Style */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Lini Produksi (Line)
              </label>
              <select
                value={lineId}
                onChange={(e) => setLineId(Number(e.target.value))}
                className="w-full text-xs font-bold px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map(l => (
                  <option key={l} value={l}>Line {l}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Model / Style Garment
              </label>
              <input
                type="text"
                placeholder="Contoh: DELAMI H200, IPBO TOGA"
                value={styleName}
                onChange={(e) => setStyleName(e.target.value)}
                className="w-full text-xs font-bold px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
              />
            </div>
          </div>

          {/* Row 2: Buyer & SMV */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Buyer / Customer
              </label>
              <input
                type="text"
                placeholder="Contoh: Delami Brands, IPB University"
                value={buyer}
                onChange={(e) => setBuyer(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                SMV Standar (Menit / Pcs)
              </label>
              <input
                type="number"
                step="0.01"
                min={0.1}
                value={smv}
                onChange={(e) => setSmv(Number(e.target.value))}
                className="w-full text-xs font-mono font-bold px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-blue-700"
                required
              />
            </div>
          </div>

          {/* Row 3: Target Order & Target Harian Style */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wide block">
              Parameter Target Order & Target Harian Style
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Target Order Keseluruhan (Pcs)
                </label>
                <input
                  type="number"
                  min={1}
                  value={orderQty}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setOrderQty(val);
                    handleAutoCalcEnd(val, dailyTargetQty, startDate);
                  }}
                  className="w-full text-xs font-mono font-black px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
                  required
                />
                <span className="text-[10px] text-slate-500">Total kuantitas PO yang harus diproduksi</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Target Harian Style (Pcs / Hari)
                </label>
                <input
                  type="number"
                  min={1}
                  value={dailyTargetQty}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setDailyTargetQty(val);
                    handleAutoCalcEnd(orderQty, val, startDate);
                  }}
                  className="w-full text-xs font-mono font-black px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-blue-700"
                  required
                />
                <span className="text-[10px] text-slate-500">Kapasitas target output per hari lini</span>
              </div>
            </div>

            {/* Row 4: Mulai Kapan (Start Date) & Estimasi Selesai */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mulai Kapan (Tanggal Mulai Produksi)
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    const val = e.target.value;
                    setStartDate(val);
                    handleAutoCalcEnd(orderQty, dailyTargetQty, val);
                  }}
                  className="w-full text-xs font-bold px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Estimasi Tanggal Selesai (Rencana)
                </label>
                <input
                  type="date"
                  value={plannedEndDate}
                  onChange={(e) => setPlannedEndDate(e.target.value)}
                  className="w-full text-xs font-bold px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <span className="text-[10px] text-slate-500">Dihitung otomatis: ±{estimatedDays} hari kerja</span>
              </div>
            </div>
          </div>

          {/* Dynamic Reduction Logic Preview Banner */}
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
            <div className="flex items-center space-x-2 text-emerald-900 font-extrabold text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>LOGIKA PENGURANGAN OTOMATIS AKTIF:</span>
            </div>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              Target Order awal adalah <strong className="font-mono">{orderQty.toLocaleString('id-ID')} pcs</strong>. 
              Setiap kali masukan input harian dilakukan pada model ini, sistem akan <strong>hanya mengurangi</strong> sisa target 
              perencanaan secara real-time tanpa perlu menghitung manual.
            </p>
            <div className="pt-2 border-t border-emerald-200/80 flex items-center justify-between text-xs font-mono">
              <span className="text-emerald-950">Target Order: <strong>{orderQty.toLocaleString('id-ID')} pcs</strong></span>
              <span className="text-emerald-950">Aktual Saat Ini: <strong>{actualQty.toLocaleString('id-ID')} pcs</strong></span>
              <span className="text-emerald-950 font-black bg-emerald-100 px-2 py-0.5 rounded">
                Sisa Target: {remainingTarget.toLocaleString('id-ID')} pcs
              </span>
            </div>
          </div>

          {/* Manpower & Jam Kerja */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Alokasi Manpower (Operator)</label>
              <input
                type="number"
                min={1}
                value={manpower}
                onChange={(e) => setManpower(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Jam Kerja Reguler (Jam/Hari)</label>
              <input
                type="number"
                min={1}
                value={standardWorkingHours}
                onChange={(e) => setStandardWorkingHours(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono"
              />
            </div>
          </div>

          {/* Catatan Perencanaan */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Catatan Teknis / Penjadwalan
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Style prioritas export, pastikan pasokan cutting lancar sejak hari pertama."
              className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md active:scale-95 cursor-pointer flex items-center space-x-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Perencanaan Bulanan</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
