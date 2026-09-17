import React, { useState, useMemo } from 'react';
import { 
  X, 
  Printer, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Layers, 
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { RepairDefectRecord } from '../types';
import { 
  formatPercent, 
  formatIndonesianFullDate, 
  formatIndonesianFullDateWithDay,
  formatMonthYearIndonesian 
} from '../utils/formatters';

interface PrintRepairModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: RepairDefectRecord[];
  onPrint: (date: string) => void;
  initialSelectedDate?: string;
  selectedMonth?: string;
}

export const PrintRepairModal: React.FC<PrintRepairModalProps> = ({
  isOpen,
  onClose,
  records,
  onPrint,
  initialSelectedDate,
  selectedMonth
}) => {
  // Available distinct dates from records
  const availableDates = useMemo(() => {
    return Array.from(new Set(records.map(r => r.date).filter(Boolean))).sort().reverse();
  }, [records]);

  // Selected date state
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    if (initialSelectedDate && initialSelectedDate !== 'all') return initialSelectedDate;
    if (availableDates.length > 0) return availableDates[0];
    return 'all';
  });

  // Custom calendar date
  const [calendarDate, setCalendarDate] = useState<string>('');

  // Sync when initialSelectedDate or availableDates change
  React.useEffect(() => {
    if (isOpen) {
      if (initialSelectedDate && initialSelectedDate !== 'all') {
        setSelectedDate(initialSelectedDate);
      } else if (availableDates.length > 0) {
        setSelectedDate(availableDates[0]);
      } else {
        setSelectedDate('all');
      }
    }
  }, [isOpen, initialSelectedDate, availableDates]);

  if (!isOpen) return null;

  // Selected date records
  const selectedRecords = selectedDate === 'all'
    ? records
    : records.filter(r => r.date === selectedDate);

  // Selected date stats
  const totalChecked = selectedRecords.reduce((acc, r) => acc + r.totalCheckedPcs, 0);
  const totalRepair = selectedRecords.reduce((acc, r) => acc + r.totalRepairPcs, 0);
  const avgRepairRate = totalChecked > 0 ? (totalRepair / totalChecked) * 100 : 0;
  const criticalCount = selectedRecords.filter(r => r.repairPercent >= 10.0).length;

  const handleApplyCalendarDate = (dateVal: string) => {
    if (dateVal) {
      setSelectedDate(dateVal);
      setCalendarDate(dateVal);
    }
  };

  const handleConfirmPrint = () => {
    onPrint(selectedDate);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-linear-to-r from-emerald-700 to-teal-800 text-white p-4 sm:p-5 flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0 border border-white/20">
              <Printer className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight">
                  Pilihan Cetak Laporan Rekapitulasi Repair
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-100 text-[10px] font-bold border border-emerald-400/30">
                  Per Hari
                </span>
              </div>
              <p className="text-xs text-emerald-100/90 mt-0.5">
                Pilih tanggal data repair untuk mencetak dokumen PDF rekapitulasi harian lengkap dengan status kualitas per line.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">

          {/* Opsi 1: Pilihan Cepat Daftar Tanggal yang Tersedia */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span>Pilih Tanggal Data Repair Tersedia ({availableDates.length} Tanggal Tercatat):</span>
              </label>
              {selectedMonth && (
                <span className="text-[11px] text-slate-500 font-medium">
                  Periode: {formatMonthYearIndonesian(selectedMonth)}
                </span>
              )}
            </div>

            {availableDates.length === 0 ? (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center text-xs text-slate-500">
                Belum ada catatan data repair sewing yang tersimpan pada periode ini.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                {availableDates.map(dateStr => {
                  const dayRecords = records.filter(r => r.date === dateStr);
                  const dayChecked = dayRecords.reduce((acc, r) => acc + r.totalCheckedPcs, 0);
                  const dayRepair = dayRecords.reduce((acc, r) => acc + r.totalRepairPcs, 0);
                  const dayRate = dayChecked > 0 ? (dayRepair / dayChecked) * 100 : 0;
                  const dayCritical = dayRecords.filter(r => r.repairPercent >= 10.0).length;
                  const isSelected = selectedDate === dateStr;

                  return (
                    <button
                      key={dateStr}
                      type="button"
                      onClick={() => setSelectedDate(dateStr)}
                      className={`text-left p-3 rounded-xl border transition-all relative flex flex-col justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-50/90 border-emerald-500 ring-2 ring-emerald-400 shadow-xs'
                          : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1 mb-1.5">
                        <div>
                          <p className={`text-xs font-black ${isSelected ? 'text-emerald-900' : 'text-slate-900'}`}>
                            {formatIndonesianFullDateWithDay(dateStr)}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            {dayRecords.length} Lini Sewing • {dayChecked.toLocaleString('id-ID')} pcs dicek
                          </p>
                        </div>
                        {isSelected && (
                          <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 text-[11px]">
                        <span className="font-mono font-bold text-slate-700">
                          Repair: <span className={dayRate >= 10 ? 'text-red-600' : dayRate > 3 ? 'text-amber-600' : 'text-emerald-700'}>
                            {dayRepair} pcs ({formatPercent(dayRate)})
                          </span>
                        </span>

                        {dayCritical > 0 ? (
                          <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-800 text-[9px] font-black font-mono">
                            🚨 {dayCritical} Kritis
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[9px] font-bold">
                            Aman
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Opsi 2: Input Kalender Manual & Opsi Semua Hari */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-700 text-[11px] whitespace-nowrap">Pilih Tanggal Lain:</span>
              <input
                type="date"
                value={selectedDate === 'all' ? '' : selectedDate}
                onChange={(e) => handleApplyCalendarDate(e.target.value)}
                className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              />
            </div>

            <button
              type="button"
              onClick={() => setSelectedDate('all')}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                selectedDate === 'all'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-300'
              }`}
            >
              Semua Tanggal Bulan Ini ({records.length} Lini)
            </button>
          </div>

          {/* Preview Ringkasan Laporan Rekapitulasi Harian Terpilih */}
          <div className="bg-slate-900 text-white p-4 rounded-xl space-y-3 shadow-md">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Pratinjau Data Laporan yang Akan Dicetak:
                </span>
              </div>
              <span className="text-xs font-mono font-black text-emerald-400">
                {selectedDate === 'all' ? 'Rekapitulasi Gabungan' : formatIndonesianFullDateWithDay(selectedDate)}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60">
                <span className="text-[10px] text-slate-400 block">Lini Sewing</span>
                <span className="text-base font-black font-mono text-white mt-0.5 block">
                  {selectedRecords.length} <span className="text-[10px] font-normal text-slate-400">Line</span>
                </span>
              </div>

              <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60">
                <span className="text-[10px] text-slate-400 block">Output Diperiksa</span>
                <span className="text-base font-black font-mono text-white mt-0.5 block">
                  {totalChecked.toLocaleString('id-ID')} <span className="text-[10px] font-normal text-slate-400">pcs</span>
                </span>
              </div>

              <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60">
                <span className="text-[10px] text-slate-400 block">Total Repair</span>
                <span className="text-base font-black font-mono text-red-400 mt-0.5 block">
                  {totalRepair.toLocaleString('id-ID')} <span className="text-[10px] font-normal text-slate-400">pcs</span>
                </span>
              </div>

              <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60">
                <span className="text-[10px] text-slate-400 block">Tingkat Repair</span>
                <span className={`text-base font-black font-mono mt-0.5 block ${
                  avgRepairRate >= 10.0 ? 'text-red-400' : avgRepairRate > 3.0 ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {formatPercent(avgRepairRate)}
                </span>
              </div>
            </div>

            {/* List preview of lines included */}
            {selectedRecords.length > 0 && (
              <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center gap-1.5 text-[10px]">
                <span className="text-slate-400 font-semibold">Daftar Line:</span>
                {selectedRecords.map(r => (
                  <span
                    key={r.id}
                    className={`px-2 py-0.5 rounded font-mono font-bold ${
                      r.repairPercent >= 10.0
                        ? 'bg-red-950 text-red-300 border border-red-800'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {r.lineName} ({r.style}) - {r.repairPercent.toFixed(1)}%
                  </span>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-4 sm:px-6 py-3.5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            {selectedDate === 'all' ? (
              <span>Mencetak rekapitulasi semua data repair dalam bulan ini</span>
            ) : (
              <span>Format dokumen: <strong>A4 Landscape Standar QC & PE PT Teratai Widjaja</strong></span>
            )}
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Batal
            </button>

            <button
              type="button"
              onClick={handleConfirmPrint}
              disabled={selectedRecords.length === 0}
              className="inline-flex items-center space-x-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-700/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Printer className="w-4 h-4 text-white" />
              <span>
                {selectedDate === 'all'
                  ? 'Buka & Cetak Rekap Semua Tanggal'
                  : `Cetak Rekap Harian (${formatIndonesianFullDate(selectedDate)})`}
              </span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
