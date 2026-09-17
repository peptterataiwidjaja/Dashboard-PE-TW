import React, { useState } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  Edit3, 
  FileText, 
  Printer, 
  Sparkles, 
  TrendingUp, 
  Activity, 
  Wrench, 
  Scissors, 
  Users, 
  Compass, 
  ShieldAlert, 
  Search, 
  ChevronRight,
  Info,
  Calendar,
  X,
  Save,
  Layers,
  ArrowRight,
  Filter
} from 'lucide-react';
import { RepairDefectRecord, DefectBreakdown, FishboneAnalysis } from '../types';
import { generateAutomaticFishbone } from '../data/repairDefectData';
import { formatPercent, formatIndonesianFullDate, formatIndonesianFullDateWithDay } from '../utils/formatters';
import { PrintRepairModal } from './PrintRepairModal';

interface RepairDefectViewProps {
  records: RepairDefectRecord[];
  onSaveRecord: (record: RepairDefectRecord) => void;
  onDeleteRecord: (id: string) => void;
  onOpenPdfReport?: (reportType: 'productivity' | 'incidents' | 'repair', initialDate?: string) => void;
  canInputData?: boolean;
  canEditDelete?: boolean;
}

export const RepairDefectView: React.FC<RepairDefectViewProps> = ({
  records,
  onSaveRecord,
  onDeleteRecord,
  onOpenPdfReport,
  canInputData = true,
  canEditDelete = true
}) => {
  const [selectedRecordId, setSelectedRecordId] = useState<string>(
    records.find(r => r.isCritical10Percent)?.id || records[0]?.id || ''
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<RepairDefectRecord | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedLineFilter, setSelectedLineFilter] = useState<number | 'all'>('all');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('all');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);

  // Distinct recorded dates for repair
  const availableDates = React.useMemo(() => {
    return Array.from(new Set(records.map(r => r.date).filter(Boolean))).sort().reverse();
  }, [records]);

  // Selected date statistics for daily recapitulation
  const selectedDayStats = React.useMemo(() => {
    if (selectedDateFilter === 'all') return null;
    const dayRecs = records.filter(r => r.date === selectedDateFilter);
    const checked = dayRecs.reduce((acc, r) => acc + r.totalCheckedPcs, 0);
    const repair = dayRecs.reduce((acc, r) => acc + r.totalRepairPcs, 0);
    const rate = checked > 0 ? (repair / checked) * 100 : 0;
    const critical = dayRecs.filter(r => r.repairPercent >= 10.0).length;
    return {
      lineCount: dayRecs.length,
      totalChecked: checked,
      totalRepair: repair,
      repairRate: rate,
      criticalCount: critical
    };
  }, [records, selectedDateFilter]);

  // Selected record for Fishbone diagram
  const activeRecord = records.find(r => r.id === selectedRecordId) || records[0];

  // Overall KPI statistics
  const totalCheckedAll = records.reduce((acc, r) => acc + r.totalCheckedPcs, 0);
  const totalRepairAll = records.reduce((acc, r) => acc + r.totalRepairPcs, 0);
  const avgRepairRate = totalCheckedAll > 0 ? (totalRepairAll / totalCheckedAll) * 100 : 0;
  const criticalCount = records.filter(r => r.repairPercent >= 10.0).length;

  // Filtered by Line selection, Date selection, and Search query
  const filteredRecords = records.filter(r => {
    const matchLine = selectedLineFilter === 'all' || r.lineId === selectedLineFilter;
    const matchDate = selectedDateFilter === 'all' || r.date === selectedDateFilter;
    const matchSearch = !searchFilter || 
      r.lineName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      r.style.toLowerCase().includes(searchFilter.toLowerCase()) ||
      r.date.includes(searchFilter);
    return matchLine && matchDate && matchSearch;
  });

  // Calculate distinct lines and their quality summary
  const availableLines = Array.from(new Set(records.map(r => r.lineId))).sort((a: string, b: string) => 
    a.localeCompare(b, undefined, { numeric: true })
  );
  
  // Specific line analysis data when a single line is filtered
  const singleLineRecords = selectedLineFilter !== 'all' 
    ? records.filter(r => r.lineId === selectedLineFilter)
    : [];
  
  const lineCheckedPcs = singleLineRecords.reduce((acc, r) => acc + r.totalCheckedPcs, 0);
  const lineRepairPcs = singleLineRecords.reduce((acc, r) => acc + r.totalRepairPcs, 0);
  const lineRepairPercent = lineCheckedPcs > 0 ? (lineRepairPcs / lineCheckedPcs) * 100 : 0;

  // Aggregate defects for selected line
  const lineDefectTotals = singleLineRecords.reduce((acc, r) => {
    acc.brokenStitch += r.defects.brokenStitch || 0;
    acc.puckering += r.defects.puckering || 0;
    acc.brokenNeedle += r.defects.brokenNeedle || 0;
    acc.oilStains += r.defects.oilStains || 0;
    acc.shading += r.defects.shading || 0;
    acc.measurementMismatch += r.defects.measurementMismatch || 0;
    acc.openSeam += r.defects.openSeam || 0;
    acc.other += r.defects.other || 0;
    return acc;
  }, {
    brokenStitch: 0,
    puckering: 0,
    brokenNeedle: 0,
    oilStains: 0,
    shading: 0,
    measurementMismatch: 0,
    openSeam: 0,
    other: 0
  });

  const lineDefectList = [
    { key: 'brokenStitch', label: 'Jahitan Loncat / Putus', count: lineDefectTotals.brokenStitch, color: 'bg-red-500' },
    { key: 'puckering', label: 'Jahitan Kerut (Puckering)', count: lineDefectTotals.puckering, color: 'bg-amber-500' },
    { key: 'brokenNeedle', label: 'Jarum Patah / Tusukan', count: lineDefectTotals.brokenNeedle, color: 'bg-rose-500' },
    { key: 'oilStains', label: 'Noda Minyak Mesin', count: lineDefectTotals.oilStains, color: 'bg-orange-500' },
    { key: 'shading', label: 'Belang Warna Kain (Shading)', count: lineDefectTotals.shading, color: 'bg-purple-500' },
    { key: 'measurementMismatch', label: 'Ukuran Tidak Sesuai Spek', count: lineDefectTotals.measurementMismatch, color: 'bg-blue-500' },
    { key: 'openSeam', label: 'Jahitan Terbuka / Lolos Obras', count: lineDefectTotals.openSeam, color: 'bg-indigo-500' },
    { key: 'other', label: 'Cacat Lain-lain', count: lineDefectTotals.other, color: 'bg-slate-400' }
  ].sort((a, b) => b.count - a.count);

  const totalLineDefectTypes = lineDefectList.reduce((acc, d) => acc + d.count, 0);

  const handleOpenAddModal = () => {
    setEditingRecord(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (rec: RepairDefectRecord) => {
    setEditingRecord(rec);
    setIsModalOpen(true);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Banner & KPI Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse"></span>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              Pemantauan Repair & Defect Sewing per Line
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 text-xs font-mono font-bold border border-red-200">
              Ambang Kritis: ≥ 10.0%
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Inspeksi harian kualitas jahitan, rincian jenis cacat garmen, dan analisis sebab-akibat 
            menggunakan diagram Fishbone (Ishikawa 6M) otomatis untuk tindakan korektif dan pencegahan (CAPA).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canInputData ? (
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Catat Data Repair Line</span>
            </button>
          ) : (
            <span className="px-3 py-1.5 bg-slate-100 text-slate-500 rounded-lg text-xs font-semibold border border-slate-200">
              🔒 Akun Pantau (Read-Only)
            </span>
          )}

          {onOpenPdfReport && (
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-300">
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(true)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-800 rounded-lg text-xs font-bold transition-all border border-slate-200 shadow-2xs active:scale-95 cursor-pointer"
                title="Buka dialog lengkap pilihan tanggal data repair untuk cetak PDF"
              >
                <Printer className="w-3.5 h-3.5 text-emerald-600" />
                <span>Pilihan Cetak per Hari...</span>
              </button>

              <div className="flex items-center space-x-1 pl-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <select
                  value={selectedDateFilter}
                  onChange={(e) => setSelectedDateFilter(e.target.value)}
                  className="bg-white text-slate-800 text-xs font-semibold px-2 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                  title="Pilih tanggal data repair untuk disaring atau dicetak"
                >
                  <option value="all">Semua Tanggal Data</option>
                  {availableDates.map(d => (
                    <option key={d} value={d}>
                      Tgl: {formatDate(d)} ({records.filter(r => r.date === d).length} Lini)
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => onOpenPdfReport('repair', selectedDateFilter !== 'all' ? selectedDateFilter : (availableDates[0] || undefined))}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
                title={
                  selectedDateFilter !== 'all'
                    ? `Cetak Laporan Rekapitulasi Repair Harian untuk Tanggal ${formatDate(selectedDateFilter)}`
                    : 'Cetak Laporan Rekapitulasi Repair Harian'
                }
              >
                <Printer className="w-3.5 h-3.5 text-white" />
                <span>
                  {selectedDateFilter !== 'all' 
                    ? `Cetak Rekap Tgl ${formatDate(selectedDateFilter)}` 
                    : 'Cetak Rekap Repair Harian'}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold uppercase text-slate-500 block">Total Garmen Diperiksa</span>
          <span className="text-2xl font-black text-slate-900 block mt-1 font-mono">
            {totalCheckedAll.toLocaleString('id-ID')} <span className="text-xs text-slate-400 font-normal">pcs</span>
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Akumulasi seluruh lini aktif</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold uppercase text-slate-500 block">Total Repair / Defect</span>
          <span className="text-2xl font-black text-red-600 block mt-1 font-mono">
            {totalRepairAll.toLocaleString('id-ID')} <span className="text-xs text-slate-400 font-normal">pcs</span>
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Memerlukan perbaikan sewing</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold uppercase text-slate-500 block">Rata-Rata Repair Rate</span>
          <span className={`text-2xl font-black block mt-1 font-mono ${
            avgRepairRate >= 10 ? 'text-red-600' : avgRepairRate > 5 ? 'text-amber-600' : 'text-blue-700'
          }`}>
            {formatPercent(avgRepairRate)}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Toleransi standar pabrik ≤ 3.0%</span>
        </div>

        <div className={`p-4 rounded-xl border transition-all shadow-2xs ${
          criticalCount > 0 
            ? 'bg-red-50/70 border-red-300 ring-2 ring-red-500/20' 
            : 'bg-emerald-50/70 border-emerald-300'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-700 block">Status Lini Kritis (≥10%)</span>
            {criticalCount > 0 ? (
              <span className="px-2 py-0.5 rounded bg-red-600 text-white font-mono text-[10px] font-black uppercase tracking-wider animate-pulse">
                PERINGATAN
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-mono text-[10px] font-black uppercase tracking-wider">
                NORMAL
              </span>
            )}
          </div>
          <span className={`text-2xl font-black block mt-1 font-mono ${
            criticalCount > 0 ? 'text-red-700' : 'text-emerald-700'
          }`}>
            {criticalCount} Lini Kritis
          </span>
          <span className="text-[11px] text-slate-600 mt-0.5 block">
            {criticalCount > 0 ? 'Wajib tindakan perbaikan & fishbone' : 'Semua lini di bawah 10%'}
          </span>
        </div>
      </div>

      {/* PANEL PILIHAN CETAK LAPORAN REKAPITULASI REPAIR PER HARI */}
      {onOpenPdfReport && (
        <div className="bg-white rounded-2xl border-2 border-emerald-500/40 p-4 sm:p-5 shadow-xs space-y-4 relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200 shadow-2xs">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                    Pilihan Cetak Laporan Rekapitulasi Repair per Hari
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    Standar A4 QC & PE
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pilih tanggal data pemeriksaan untuk mencetak dokumen resmi PDF harian lengkap dengan Pareto cacat, lini kritis, dan lembar pengesahan tanda tangan.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(true)}
                className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-300 cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5 text-slate-600" />
                <span>Pilih Tanggal Lain...</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenPdfReport('repair', selectedDateFilter !== 'all' ? selectedDateFilter : (availableDates[0] || undefined))}
                disabled={availableDates.length === 0}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-emerald-700/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>
                  {selectedDateFilter !== 'all'
                    ? `Cetak Rekap Harian (${formatDate(selectedDateFilter)})`
                    : availableDates[0]
                      ? `Cetak Rekap Harian (${formatDate(availableDates[0])})`
                      : 'Cetak Rekap Harian'}
                </span>
              </button>
            </div>
          </div>

          {/* Quick Date Pills: Pilih Tanggal Pemeriksaan */}
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
              <span className="font-extrabold text-slate-800 uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                <span>Pilihan Tanggal Data Repair Tersedia:</span>
              </span>
              <span className="text-[11px] text-slate-500">
                Pilih tanggal untuk menyaring tabel dan menentukan tanggal cetak laporan harian
              </span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1.5 no-scrollbar">
              <button
                type="button"
                onClick={() => setSelectedDateFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedDateFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                }`}
              >
                Semua Tanggal ({records.length} Lini)
              </button>

              {availableDates.map(dateStr => {
                const dayRecs = records.filter(r => r.date === dateStr);
                const dayChecked = dayRecs.reduce((acc, r) => acc + r.totalCheckedPcs, 0);
                const dayRepair = dayRecs.reduce((acc, r) => acc + r.totalRepairPcs, 0);
                const dayRate = dayChecked > 0 ? (dayRepair / dayChecked) * 100 : 0;
                const hasCritical = dayRecs.some(r => r.repairPercent >= 10.0);
                const isSelected = selectedDateFilter === dateStr;

                return (
                  <button
                    key={dateStr}
                    type="button"
                    onClick={() => setSelectedDateFilter(dateStr)}
                    className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer border ${
                      isSelected
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-500 ring-2 ring-emerald-400 shadow-xs'
                        : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    <span>{formatIndonesianFullDateWithDay(dateStr)}</span>
                    <span className="px-1.5 py-0.2 rounded-md bg-slate-100 text-[10px] text-slate-600 font-mono">
                      {dayRecs.length} Line
                    </span>
                    <span className={`text-[10px] font-mono ${dayRate >= 10 ? 'text-red-600 font-black' : dayRate > 3 ? 'text-amber-600' : 'text-emerald-700'}`}>
                      {formatPercent(dayRate)}
                    </span>
                    {hasCritical && (
                      <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" title="Ada Lini Kritis (≥10%)" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Selected Date Summary Indicator */}
            {selectedDayStats && selectedDateFilter !== 'all' && (
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                  <span className="font-black text-emerald-900">
                    Target Rekap Harian: {formatIndonesianFullDateWithDay(selectedDateFilter)}
                  </span>
                  <span className="text-slate-300 hidden sm:inline">•</span>
                  <span className="text-slate-600">{selectedDayStats.lineCount} Lini Sewing</span>
                  <span className="text-slate-300 hidden sm:inline">•</span>
                  <span className="text-slate-600">Diperiksa: {selectedDayStats.totalChecked.toLocaleString('id-ID')} pcs</span>
                  <span className="text-slate-300 hidden sm:inline">•</span>
                  <span className="text-slate-600">Repair: {selectedDayStats.totalRepair} pcs</span>
                  <span className="text-slate-300 hidden sm:inline">•</span>
                  <span className={`font-bold ${selectedDayStats.repairRate >= 10 ? 'text-red-600' : selectedDayStats.repairRate > 3 ? 'text-amber-600' : 'text-emerald-700'}`}>
                    Repair Rate: {formatPercent(selectedDayStats.repairRate)}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => onOpenPdfReport('repair', selectedDateFilter)}
                    className="inline-flex items-center space-x-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Cetak PDF Tanggal Ini</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <Wrench className="w-4 h-4 text-blue-700" />
            <span className="text-xs font-black text-slate-900 uppercase tracking-wide">
              Pilihan Line Produksi (Filter Masalah per Line):
            </span>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Pilih line untuk melihat rincian masalah dan jenis defect jahitan spesifik
          </span>
        </div>

        {/* Line Pill Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setSelectedLineFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all whitespace-nowrap cursor-pointer ${
              selectedLineFilter === 'all'
                ? 'bg-blue-700 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
            }`}
          >
            Semua Line ({records.length})
          </button>

          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(lineNum => {
            const lineRecs = records.filter(r => r.lineId === lineNum);
            const hasCritical = lineRecs.some(r => r.repairPercent >= 10.0);
            const lineMaxRate = lineRecs.length > 0 
              ? Math.max(...lineRecs.map(r => r.repairPercent)) 
              : 0;
            const isSelected = selectedLineFilter === lineNum;

            return (
              <button
                key={lineNum}
                onClick={() => setSelectedLineFilter(lineNum)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center space-x-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-blue-700 text-white shadow-xs ring-2 ring-blue-300'
                    : hasCritical
                      ? 'bg-red-50 hover:bg-red-100 text-red-800 border border-red-300'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                }`}
              >
                <span>Line {lineNum}</span>
                {lineRecs.length > 0 ? (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-black ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : hasCritical
                        ? 'bg-red-600 text-white animate-pulse'
                        : 'bg-slate-200 text-slate-800'
                  }`}>
                    {lineMaxRate.toFixed(1)}%
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400">-</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* PANEL MASALAH KHUSUS LINE JIKA LINE DIPILIH */}
      {selectedLineFilter !== 'all' && (
        <div className="bg-linear-to-br from-slate-900 to-blue-950 text-white p-5 rounded-2xl shadow-md space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div>
              <div className="flex items-center space-x-2">
                <span className={`w-3 h-3 rounded-full ${lineRepairPercent >= 10 ? 'bg-red-500 animate-ping' : 'bg-emerald-400'}`}></span>
                <h3 className="text-base font-black tracking-wide">
                  Analisis Masalah Kualitas & Jenis Defect: Line {selectedLineFilter}
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-black ${
                  lineRepairPercent >= 10.0 ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'
                }`}>
                  Tingkat Repair: {lineRepairPercent.toFixed(1)}%
                </span>
              </div>
              <p className="text-xs text-blue-200 mt-0.5">
                Total {lineCheckedPcs.toLocaleString('id-ID')} pcs diperiksa • {lineRepairPcs.toLocaleString('id-ID')} pcs cacat/repair • {singleLineRecords.length} catatan model
              </p>
            </div>

            <button
              onClick={() => setSelectedLineFilter('all')}
              className="text-xs text-blue-300 hover:text-white underline self-start sm:self-auto cursor-pointer"
            >
              Reset ke Semua Line
            </button>
          </div>

          {/* Breakdown Grafik Bar Masalah Defect Khusus Line */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Distribusi Jenis Cacat Jahitan (Defect Breakdown) di Line {selectedLineFilter}:
              </span>
              <span className="text-xs text-blue-200 font-mono">
                Total Akumulasi Cacat: {totalLineDefectTypes} pcs
              </span>
            </div>

            {totalLineDefectTypes === 0 ? (
              <div className="p-4 bg-white/5 rounded-xl text-center text-xs text-slate-300">
                Belum ada data cacat tercatat untuk Line {selectedLineFilter}.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {lineDefectList.map(defect => {
                  const pct = totalLineDefectTypes > 0 ? (defect.count / totalLineDefectTypes) * 100 : 0;
                  return (
                    <div key={defect.key} className="bg-white/10 backdrop-blur-xs p-2.5 rounded-xl border border-white/10 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-200">{defect.label}</span>
                        <span className="font-mono font-black text-white">
                          {defect.count} pcs ({pct.toFixed(1)}%)
                        </span>
                      </div>
                      {/* Bar Grafik */}
                      <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${defect.color} rounded-full transition-all duration-500`}
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Table Section: Tabel Repair per Line dengan Kolom Bar Merah jika >= 10% */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-slate-700" />
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
              Matriks Kinerja Kualitas & Kolom Bar Repair {selectedLineFilter !== 'all' ? `Line ${selectedLineFilter}` : 'Semua Line'}
            </h3>
          </div>

          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari Line / Style..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="text-xs pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 w-44"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px] uppercase">
                <th className="p-3 text-center w-16">Line</th>
                <th className="p-3 w-24">Tanggal</th>
                <th className="p-3">Model / Style</th>
                <th className="p-3 text-right">Diperiksa (Pcs)</th>
                <th className="p-3 text-right">Repair (Pcs)</th>
                {/* INI ADALAH KOLOM BAR PERSENTASE DEFECT DENGAN BAR MERAH SAAT >= 10% */}
                <th className="p-3 w-72 min-w-[280px]">
                  <div className="flex items-center justify-between">
                    <span>Tingkat Repair (%) & Kolom Bar</span>
                    <span className="text-[9px] text-red-600 font-black">Merah jika ≥ 10%</span>
                  </div>
                </th>
                <th className="p-3 text-center">Top Defect</th>
                <th className="p-3 text-center w-36">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.map(r => {
                const isCritical = r.repairPercent >= 10.0;
                const isSelected = r.id === selectedRecordId;

                // Hitung jenis defect tertinggi untuk preview
                const defectList = [
                  { label: 'Jahitan Loncat', val: r.defects.brokenStitch },
                  { label: 'Kerut (Puckering)', val: r.defects.puckering },
                  { label: 'Jarum Patah', val: r.defects.brokenNeedle },
                  { label: 'Noda Minyak', val: r.defects.oilStains },
                  { label: 'Belang Warna', val: r.defects.shading },
                  { label: 'Ukuran Spek', val: r.defects.measurementMismatch },
                  { label: 'Jahitan Terbuka', val: r.defects.openSeam }
                ].sort((a, b) => b.val - a.val);

                const topDefect = defectList[0]?.val > 0 ? defectList[0] : null;

                return (
                  <tr 
                    key={r.id} 
                    className={`transition-colors hover:bg-slate-50/80 ${
                      isSelected ? 'bg-blue-50/40' : ''
                    } ${isCritical ? 'bg-red-50/20' : ''}`}
                  >
                    {/* Line Badge */}
                    <td className="p-3 text-center">
                      <span className={`inline-block px-2 py-1 rounded-md font-bold font-mono text-xs ${
                        isCritical 
                          ? 'bg-red-600 text-white shadow-xs' 
                          : 'bg-slate-100 text-slate-800'
                      }`}>
                        {r.lineName}
                      </span>
                    </td>

                    {/* Tanggal */}
                    <td className="p-3 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                      {formatDate(r.date)}
                    </td>

                    {/* Model / Style */}
                    <td className="p-3">
                      <span className="font-bold text-slate-900 block">{r.style}</span>
                      <span className="text-[10px] text-slate-500">
                        {r.notes || 'Pemeriksaan inline & endline'}
                      </span>
                    </td>

                    {/* Diperiksa */}
                    <td className="p-3 text-right font-mono font-semibold text-slate-700">
                      {r.totalCheckedPcs.toLocaleString('id-ID')}
                    </td>

                    {/* Repair Pcs */}
                    <td className="p-3 text-right font-mono font-bold">
                      <span className={isCritical ? 'text-red-600 font-black' : 'text-slate-800'}>
                        {r.totalRepairPcs.toLocaleString('id-ID')}
                      </span>
                    </td>

                    {/* KOLOM BAR MERAH KETIKA REPAIR MENCAPAI ANGKA 10 % */}
                    <td className={`p-3 ${isCritical ? 'bg-red-100/40' : ''}`}>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className={`font-mono font-black ${
                            isCritical ? 'text-red-700 text-sm flex items-center space-x-1' : 'text-slate-700'
                          }`}>
                            {isCritical && <AlertTriangle className="w-3.5 h-3.5 text-red-600 inline mr-1" />}
                            {r.repairPercent.toFixed(2)}%
                          </span>
                          
                          {isCritical ? (
                            <span className="px-2 py-0.5 rounded-full bg-red-600 text-white font-mono text-[9px] font-black tracking-wider uppercase shadow-xs">
                              🚨 KRITIS (≥10%)
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500 font-mono">
                              Aman (&lt;10%)
                            </span>
                          )}
                        </div>

                        {/* Visual Progress Bar - KOLOM BAR MERAH */}
                        <div className="w-full bg-slate-200 rounded-full h-3.5 overflow-hidden p-0.5 border border-slate-300">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isCritical 
                                ? 'bg-gradient-to-r from-red-600 to-red-700 shadow-sm animate-pulse' 
                                : r.repairPercent > 5 
                                  ? 'bg-amber-500' 
                                  : 'bg-blue-600'
                            }`}
                            style={{ width: `${Math.min(Math.max(r.repairPercent * 3.5, 4), 100)}%` }}
                            title={`Repair: ${r.repairPercent.toFixed(1)}%`}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Top Defect */}
                    <td className="p-3 text-center">
                      {topDefect ? (
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                          {topDefect.label} ({topDefect.val} pcs)
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[10px]">-</span>
                      )}
                    </td>

                    {/* Aksi */}
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => setSelectedRecordId(r.id)}
                          className={`px-2.5 py-1 rounded text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer ${
                            isSelected 
                              ? 'bg-blue-600 text-white shadow-xs' 
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                          title="Buka Analisis Fishbone Line ini"
                        >
                          <Compass className="w-3 h-3" />
                          <span>Fishbone</span>
                        </button>

                        {onOpenPdfReport && (
                          <button
                            onClick={() => onOpenPdfReport('repair', r.date)}
                            className="p-1 hover:bg-emerald-50 text-slate-500 hover:text-emerald-700 rounded transition-colors cursor-pointer"
                            title={`Cetak Rekapitulasi Harian Tanggal ${formatDate(r.date)}`}
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {canEditDelete && (
                          <>
                            <button
                              onClick={() => handleOpenEditModal(r)}
                              className="p-1 hover:bg-slate-100 text-slate-500 hover:text-blue-600 rounded transition-colors cursor-pointer"
                              title="Edit Data Repair"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => {
                                if (window.confirm(`Hapus catatan repair ${r.lineName} (${r.style})?`)) {
                                  onDeleteRecord(r.id);
                                }
                              }}
                              className="p-1 hover:bg-slate-100 text-slate-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                              title="Hapus"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION DIAGRAM FISHBONE (ISHIKAWA 6M) SECARA OTOMATIS */}
      {activeRecord && (
        <div className="bg-white rounded-2xl border-2 border-slate-300 shadow-md p-6 space-y-6">
          
          {/* Header Fishbone */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-slate-800 pb-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-blue-600"></span>
                <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
                  DIAGRAM FISHBONE (ISHIKAWA 6M) — ANALISIS OTOMATIS AKAR MASALAH DEFECT
                </h3>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Target Analisis: <strong className="text-slate-900">{activeRecord.lineName}</strong> • Style: <strong className="text-blue-700">{activeRecord.style}</strong> • Tanggal: {formatDate(activeRecord.date)} • Tingkat Repair: <strong className={activeRecord.isCritical10Percent ? 'text-red-600' : 'text-slate-900'}>{activeRecord.repairPercent.toFixed(2)}%</strong>
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 rounded-full text-xs font-mono font-black uppercase tracking-wider ${
                activeRecord.isCritical10Percent 
                  ? 'bg-red-600 text-white shadow-xs animate-pulse' 
                  : 'bg-blue-100 text-blue-800 border border-blue-300'
              }`}>
                {activeRecord.isCritical10Percent ? '🚨 STATUS REPAIR KRITIS ≥10%' : 'STATUS REPAIR NORMAL'}
              </span>
            </div>
          </div>

          {/* FISHBONE DIAGRAM VISUAL COMPONENT */}
          <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-2xl">
            
            {/* Diagram Title Banner */}
            <div className="text-center mb-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Struktur Analisis Sebab-Akibat 6M (Man, Machine, Material, Method, Measurement, Milieu)
              </span>
            </div>

            {/* Visual Fishbone Grid Layout */}
            <div className="relative">
              
              {/* Top 3 Bones: Man, Machine, Material */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                
                {/* 1. MAN */}
                <div className="p-3.5 bg-white border-2 border-amber-300 rounded-xl shadow-2xs relative">
                  <div className="flex items-center space-x-2 pb-2 border-b border-amber-200 mb-2">
                    <Users className="w-4 h-4 text-amber-600" />
                    <h4 className="text-xs font-black uppercase text-amber-900 tracking-wide">
                      1. Man (Operator / Keterampilan)
                    </h4>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    {activeRecord.fishbone.branches[0]?.causes.map((c, i) => (
                      <li key={i} className="flex items-start space-x-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0"></span>
                        <span className="leading-snug">{c}</span>
                      </li>
                    ))}
                  </ul>
                  {/* Bone connector indicator */}
                  <div className="hidden md:block absolute -bottom-5 left-1/2 -translate-x-1/2 w-0.5 h-5 bg-amber-400"></div>
                </div>

                {/* 2. MACHINE */}
                <div className="p-3.5 bg-white border-2 border-blue-300 rounded-xl shadow-2xs relative">
                  <div className="flex items-center space-x-2 pb-2 border-b border-blue-200 mb-2">
                    <Wrench className="w-4 h-4 text-blue-600" />
                    <h4 className="text-xs font-black uppercase text-blue-900 tracking-wide">
                      2. Machine (Mesin & Peralatan)
                    </h4>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    {activeRecord.fishbone.branches[1]?.causes.map((c, i) => (
                      <li key={i} className="flex items-start space-x-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0"></span>
                        <span className="leading-snug">{c}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="hidden md:block absolute -bottom-5 left-1/2 -translate-x-1/2 w-0.5 h-5 bg-blue-400"></div>
                </div>

                {/* 3. MATERIAL */}
                <div className="p-3.5 bg-white border-2 border-purple-300 rounded-xl shadow-2xs relative">
                  <div className="flex items-center space-x-2 pb-2 border-b border-purple-200 mb-2">
                    <Scissors className="w-4 h-4 text-purple-600" />
                    <h4 className="text-xs font-black uppercase text-purple-900 tracking-wide">
                      3. Material (Kain & Komponen)
                    </h4>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    {activeRecord.fishbone.branches[2]?.causes.map((c, i) => (
                      <li key={i} className="flex items-start space-x-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0"></span>
                        <span className="leading-snug">{c}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="hidden md:block absolute -bottom-5 left-1/2 -translate-x-1/2 w-0.5 h-5 bg-purple-400"></div>
                </div>

              </div>

              {/* Central Spine with Fish Head (Effect) */}
              <div className="my-4 relative flex items-center justify-between">
                
                {/* Horizontal Spine Line */}
                <div className="flex-1 h-3 bg-slate-800 rounded-l-full relative flex items-center shadow-inner">
                  <div className="w-full border-t border-dashed border-slate-400"></div>
                </div>

                {/* Fish Head (Akibat / The Problem) */}
                <div className="shrink-0 w-full sm:w-80 ml-2 p-3 bg-red-600 text-white rounded-r-2xl rounded-l-md shadow-lg border-2 border-red-700">
                  <div className="flex items-center space-x-1.5 text-[10px] font-black uppercase tracking-wider text-red-100">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
                    <span>AKIBAT / MASALAH UTAMA (EFFECT):</span>
                  </div>
                  <p className="text-xs font-extrabold mt-1 leading-snug">
                    {activeRecord.fishbone.effect}
                  </p>
                  <div className="mt-1.5 pt-1.5 border-t border-red-500/80 flex items-center justify-between text-[10px] font-mono">
                    <span>Defect: {activeRecord.totalRepairPcs} pcs</span>
                    <span className="font-black bg-red-800/80 px-1.5 py-0.5 rounded">
                      Rate: {activeRecord.repairPercent.toFixed(2)}%
                    </span>
                  </div>
                </div>

              </div>

              {/* Bottom 3 Bones: Method, Measurement, Milieu */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                
                {/* 4. METHOD */}
                <div className="p-3.5 bg-white border-2 border-emerald-300 rounded-xl shadow-2xs relative">
                  <div className="hidden md:block absolute -top-5 left-1/2 -translate-x-1/2 w-0.5 h-5 bg-emerald-400"></div>
                  <div className="flex items-center space-x-2 pb-2 border-b border-emerald-200 mb-2">
                    <Compass className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-xs font-black uppercase text-emerald-900 tracking-wide">
                      4. Method (Metode Kerja & SOP)
                    </h4>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    {activeRecord.fishbone.branches[3]?.causes.map((c, i) => (
                      <li key={i} className="flex items-start space-x-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></span>
                        <span className="leading-snug">{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 5. MEASUREMENT */}
                <div className="p-3.5 bg-white border-2 border-cyan-300 rounded-xl shadow-2xs relative">
                  <div className="hidden md:block absolute -top-5 left-1/2 -translate-x-1/2 w-0.5 h-5 bg-cyan-400"></div>
                  <div className="flex items-center space-x-2 pb-2 border-b border-cyan-200 mb-2">
                    <Activity className="w-4 h-4 text-cyan-600" />
                    <h4 className="text-xs font-black uppercase text-cyan-900 tracking-wide">
                      5. Measurement (Inspeksi & Kalibrasi)
                    </h4>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    {activeRecord.fishbone.branches[4]?.causes.map((c, i) => (
                      <li key={i} className="flex items-start space-x-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-1.5 shrink-0"></span>
                        <span className="leading-snug">{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 6. MILIEU */}
                <div className="p-3.5 bg-white border-2 border-slate-400 rounded-xl shadow-2xs relative">
                  <div className="hidden md:block absolute -top-5 left-1/2 -translate-x-1/2 w-0.5 h-5 bg-slate-500"></div>
                  <div className="flex items-center space-x-2 pb-2 border-b border-slate-200 mb-2">
                    <ShieldAlert className="w-4 h-4 text-slate-600" />
                    <h4 className="text-xs font-black uppercase text-slate-800 tracking-wide">
                      6. Milieu (Lingkungan Kerja)
                    </h4>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    {activeRecord.fishbone.branches[5]?.causes.map((c, i) => (
                      <li key={i} className="flex items-start space-x-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-500 mt-1.5 shrink-0"></span>
                        <span className="leading-snug">{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>

              </div>

            </div>

          </div>

          {/* TINDAKAN PREVENTIF DAN PERBAIKAN (CAPA) BOX */}
          <div className="p-5 bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-2xl shadow-lg space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-black uppercase tracking-wider text-amber-300">
                  REKOMENDASI TINDAKAN PERBAIKAN & PREVENTIF (CAPA)
                </h4>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                Dokumen Resmi QC & Production Engineering
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              
              {/* Kolom 1: Akar Masalah Utama */}
              <div className="p-3.5 bg-slate-800/80 border border-slate-700 rounded-xl space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-400 block">
                  🎯 Akar Masalah Utama (Root Cause)
                </span>
                <p className="text-slate-200 leading-relaxed font-medium">
                  {activeRecord.fishbone.primaryRootCause}
                </p>
              </div>

              {/* Kolom 2: Tindakan Perbaikan Segera */}
              <div className="p-3.5 bg-slate-800/80 border border-slate-700 rounded-xl space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 block">
                  ⚡ Tindakan Perbaikan Segera (Corrective)
                </span>
                <p className="text-slate-200 leading-relaxed font-medium">
                  {activeRecord.fishbone.correctiveAction}
                </p>
              </div>

              {/* Kolom 3: Tindakan Pencegahan Jangka Panjang */}
              <div className="p-3.5 bg-slate-800/80 border border-slate-700 rounded-xl space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                  🛡️ Tindakan Pencegahan (Preventive)
                </span>
                <p className="text-slate-200 leading-relaxed font-medium">
                  {activeRecord.fishbone.preventiveAction}
                </p>
              </div>

            </div>

            {/* Kolom Penanggung Jawab & Tanda Tangan Manual */}
            <div className="pt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="flex items-center space-x-3">
                <label className="text-slate-400 text-xs font-semibold whitespace-nowrap">
                  PIC Penanggung Jawab:
                </label>
                <input
                  type="text"
                  placeholder="(Diisi nama manual...)"
                  value={activeRecord.picName || ''}
                  onChange={(e) => {
                    const updated = { ...activeRecord, picName: e.target.value };
                    onSaveRecord(updated);
                  }}
                  className="w-full text-xs px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center space-x-3">
                <label className="text-slate-400 text-xs font-semibold whitespace-nowrap">
                  Diverifikasi Oleh:
                </label>
                <input
                  type="text"
                  placeholder="(Diisi nama manual...)"
                  value={activeRecord.verifiedBy || ''}
                  onChange={(e) => {
                    const updated = { ...activeRecord, verifiedBy: e.target.value };
                    onSaveRecord(updated);
                  }}
                  className="w-full text-xs px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

          </div>

        </div>
      )}

      {/* MODAL INPUT / EDIT DATA REPAIR */}
      {isModalOpen && (
        <RepairInputModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={(record) => {
            onSaveRecord(record);
            setIsModalOpen(false);
            setSelectedRecordId(record.id);
          }}
          initialData={editingRecord}
        />
      )}

      {/* MODAL PILIHAN CETAK LAPORAN REPAIR PER HARI */}
      {isPrintModalOpen && (
        <PrintRepairModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          records={records}
          initialSelectedDate={selectedDateFilter !== 'all' ? selectedDateFilter : undefined}
          onPrint={(date) => {
            if (onOpenPdfReport) {
              onOpenPdfReport('repair', date !== 'all' ? date : undefined);
            }
          }}
        />
      )}

    </div>
  );
};

interface RepairInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: RepairDefectRecord) => void;
  initialData?: RepairDefectRecord | null;
}

const RepairInputModal: React.FC<RepairInputModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData
}) => {
  const [lineId, setLineId] = useState<number>(initialData?.lineId || 1);
  const [date, setDate] = useState<string>(initialData?.date || new Date().toISOString().split('T')[0]);
  const [style, setStyle] = useState<string>(initialData?.style || '');
  const [totalCheckedPcs, setTotalCheckedPcs] = useState<number>(initialData?.totalCheckedPcs || 450);
  
  // Defect breakdown
  const [defects, setDefects] = useState<DefectBreakdown>(initialData?.defects || {
    brokenStitch: 10,
    puckering: 8,
    brokenNeedle: 2,
    oilStains: 2,
    shading: 0,
    measurementMismatch: 3,
    openSeam: 1,
    other: 0
  });

  const [picName, setPicName] = useState<string>(initialData?.picName || '');
  const [verifiedBy, setVerifiedBy] = useState<string>(initialData?.verifiedBy || '');
  const [notes, setNotes] = useState<string>(initialData?.notes || '');

  if (!isOpen) return null;

  // Hitung total repair dan persentase
  const totalRepairPcs = (Object.values(defects) as number[]).reduce((a: number, b: number) => a + Number(b || 0), 0);
  const repairPercent = totalCheckedPcs > 0 ? (totalRepairPcs / totalCheckedPcs) * 100 : 0;
  const isCritical = repairPercent >= 10.0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const fishbone = generateAutomaticFishbone(`Line ${lineId}`, style || 'Style Garment', repairPercent, defects);

    const record: RepairDefectRecord = {
      id: initialData?.id || `rd-${Date.now()}`,
      lineId,
      lineName: `Line ${lineId}`,
      date,
      style: style || `Style Line ${lineId}`,
      totalCheckedPcs,
      totalRepairPcs,
      repairPercent: Number(repairPercent.toFixed(2)),
      isCritical10Percent: isCritical,
      defects,
      fishbone,
      picName,
      verifiedBy,
      notes,
      updatedAt: new Date().toISOString()
    };

    onSave(record);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header Modal */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="text-sm font-black tracking-tight">
                {initialData ? 'Ubah Data Repair & Defect' : 'Masukan Data Repair & Defect Line'}
              </h3>
              <p className="text-[11px] text-slate-400">
                Pencatatan hasil inspeksi QC & kalkulasi kolom bar repair
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          
          {/* Row 1: Line, Tanggal, Style */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Lini Sewing (Line)
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

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tanggal Inspeksi
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs font-bold px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Model / Style Garment
              </label>
              <input
                type="text"
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                placeholder="Contoh: DELAMI H200"
                className="w-full text-xs font-bold px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
              />
            </div>
          </div>

          {/* Row 2: Total Output Diperiksa */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Total Output Garmen Diperiksa QC (Pcs)
            </label>
            <input
              type="number"
              min={1}
              value={totalCheckedPcs}
              onChange={(e) => setTotalCheckedPcs(Number(e.target.value))}
              className="w-full text-xs font-mono font-bold px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              required
            />
          </div>

          {/* Breakdown Jenis Cacat (Defect) */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <span className="text-xs font-black uppercase text-slate-800 tracking-wide block">
              Rincian Jenis Cacat Sewing (Pcs)
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Jahitan Loncat / Putus
                </label>
                <input
                  type="number"
                  min={0}
                  value={defects.brokenStitch}
                  onChange={(e) => setDefects(p => ({ ...p, brokenStitch: Number(e.target.value) }))}
                  className="w-full text-xs font-mono px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Kerut (Puckering)
                </label>
                <input
                  type="number"
                  min={0}
                  value={defects.puckering}
                  onChange={(e) => setDefects(p => ({ ...p, puckering: Number(e.target.value) }))}
                  className="w-full text-xs font-mono px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Jarum Patah / Tusukan
                </label>
                <input
                  type="number"
                  min={0}
                  value={defects.brokenNeedle}
                  onChange={(e) => setDefects(p => ({ ...p, brokenNeedle: Number(e.target.value) }))}
                  className="w-full text-xs font-mono px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Noda Minyak / Kotor
                </label>
                <input
                  type="number"
                  min={0}
                  value={defects.oilStains}
                  onChange={(e) => setDefects(p => ({ ...p, oilStains: Number(e.target.value) }))}
                  className="w-full text-xs font-mono px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Belang Warna (Shading)
                </label>
                <input
                  type="number"
                  min={0}
                  value={defects.shading}
                  onChange={(e) => setDefects(p => ({ ...p, shading: Number(e.target.value) }))}
                  className="w-full text-xs font-mono px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Ukuran Spek Meleset
                </label>
                <input
                  type="number"
                  min={0}
                  value={defects.measurementMismatch}
                  onChange={(e) => setDefects(p => ({ ...p, measurementMismatch: Number(e.target.value) }))}
                  className="w-full text-xs font-mono px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Jahitan Terbuka (Open)
                </label>
                <input
                  type="number"
                  min={0}
                  value={defects.openSeam}
                  onChange={(e) => setDefects(p => ({ ...p, openSeam: Number(e.target.value) }))}
                  className="w-full text-xs font-mono px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Cacat Lain-lain
                </label>
                <input
                  type="number"
                  min={0}
                  value={defects.other}
                  onChange={(e) => setDefects(p => ({ ...p, other: Number(e.target.value) }))}
                  className="w-full text-xs font-mono px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Real-time Indicator Banner */}
          <div className={`p-4 rounded-xl border flex items-center justify-between ${
            isCritical ? 'bg-red-50 border-red-300' : 'bg-blue-50 border-blue-200'
          }`}>
            <div>
              <span className="text-xs font-bold text-slate-800 block">
                Hasil Akumulasi Repair & Defect:
              </span>
              <span className="text-[11px] text-slate-600">
                Total: <strong>{totalRepairPcs} pcs</strong> dari {totalCheckedPcs} pcs diperiksa
              </span>
            </div>

            <div className="text-right">
              <span className={`text-lg font-black font-mono block ${
                isCritical ? 'text-red-700' : 'text-blue-700'
              }`}>
                {repairPercent.toFixed(2)}%
              </span>
              {isCritical ? (
                <span className="text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded">
                  ⚠️ Kritis (≥10%) - Bar Merah Aktif
                </span>
              ) : (
                <span className="text-[10px] font-bold text-blue-700">
                  Normal (&lt;10%)
                </span>
              )}
            </div>
          </div>

          {/* Manual Names Fields (No hardcoded values) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Nama PIC Penanggung Jawab (Diisi Manual)
              </label>
              <input
                type="text"
                placeholder="Kosongkan jika tanda tangan fisik"
                value={picName}
                onChange={(e) => setPicName(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Nama Verifikator PE / QC (Diisi Manual)
              </label>
              <input
                type="text"
                placeholder="Kosongkan jika tanda tangan fisik"
                value={verifiedBy}
                onChange={(e) => setVerifiedBy(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
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
              <span>Simpan Data Repair</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
