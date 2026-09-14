import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  CheckCircle2, 
  AlertTriangle,
  FileSpreadsheet, 
  Download,
  Filter,
  BarChart2,
  Tag,
  Calendar,
  Database,
  Search,
  Sparkles,
  AlertCircle,
  ShieldAlert,
  Printer,
  Layers,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell
} from 'recharts';
import { MonthlyProductivityRecord, StyleScheduleRecord } from '../types';
import { formatPercent, formatMonthYearIndonesian, getPreviousMonth, getNextMonth } from '../utils/formatters';

interface MonthlyRecapViewProps {
  records: MonthlyProductivityRecord[];
  onAddNew: () => void;
  onEdit: (record: MonthlyProductivityRecord) => void;
  onDelete: (id: string) => void;
  onExportPdf: () => void;
  onOpenBankData?: () => void;
  onOpenIncidentModal?: () => void;
  incidentsCount?: number;
  styleSchedules?: StyleScheduleRecord[];
  onOpenMonthlyPlan?: () => void;
  selectedMonth?: string;
  onMonthChange?: (month: string) => void;
  canInputData?: boolean;
  canEditDelete?: boolean;
}

export const MonthlyRecapView: React.FC<MonthlyRecapViewProps> = ({
  records,
  onAddNew,
  onEdit,
  onDelete,
  onExportPdf,
  onOpenBankData,
  onOpenIncidentModal,
  incidentsCount = 0,
  styleSchedules = [],
  onOpenMonthlyPlan,
  selectedMonth,
  onMonthChange,
  canInputData = true,
  canEditDelete = true
}) => {
  const [filterDate, setFilterDate] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [mobileViewMode, setMobileViewMode] = useState<'card' | 'table'>('card');

  // Available unique dates
  const availableDates = useMemo(() => {
    return Array.from(new Set(records.map(r => r.date))).sort().reverse();
  }, [records]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const matchDate = filterDate === 'all' || r.date === filterDate;
      const matchStatus = filterStatus === 'all' || r.analysisStatus === filterStatus;
      const matchSearch = !searchQuery.trim() || 
        r.style.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.lineName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.analysisNote && r.analysisNote.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchDate && matchStatus && matchSearch;
    });
  }, [records, filterDate, filterStatus, searchQuery]);

  // Aggregate KPIs for Daily Output & Overall
  const kpi = useMemo(() => {
    const totalTargetDaily = filteredRecords.reduce((acc, r) => acc + (r.targetDailyPcs || r.targetOutputPcs), 0);
    const totalActualDaily = filteredRecords.reduce((acc, r) => acc + (r.actualDailyPcs || r.actualOutputPcs), 0);
    const dailyVariancePcs = totalActualDaily - totalTargetDaily;
    const dailyAchievementRate = totalTargetDaily > 0 ? (totalActualDaily / totalTargetDaily) * 100 : 0;
    
    const avgEfficiency = filteredRecords.length > 0
      ? filteredRecords.reduce((acc, r) => acc + r.efficiencyPercent, 0) / filteredRecords.length
      : 0;

    const totalManpower = filteredRecords.reduce((acc, r) => acc + r.manpower, 0);
    const avgDefect = filteredRecords.length > 0
      ? filteredRecords.reduce((acc, r) => acc + r.defectPercent, 0) / filteredRecords.length
      : 0;

    return {
      totalTargetDaily,
      totalActualDaily,
      dailyVariancePcs,
      dailyAchievementRate,
      avgEfficiency,
      totalManpower,
      avgDefect
    };
  }, [filteredRecords]);

  // Chart data for Daily Output Target vs Actual
  const chartData = useMemo(() => {
    return filteredRecords.map(r => ({
      name: r.lineName,
      targetDaily: r.targetDailyPcs || r.targetOutputPcs,
      actualDaily: r.actualDailyPcs || r.actualOutputPcs,
      efficiency: r.efficiencyPercent,
      garmentStyle: r.style,
      isMet: (r.actualDailyPcs || r.actualOutputPcs) >= (r.targetDailyPcs || r.targetOutputPcs)
    }));
  }, [filteredRecords]);

  // Format date helper (e.g. 2026-06-25 -> 25/06/2026)
  const formatDateLabel = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Control Bar */}
      <div className="bg-white p-3.5 sm:p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-600 shrink-0"></span>
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight uppercase">
              LEMBAR KERJA REKAP PRODUKTIVITAS & AKTUAL PERHARI
            </h2>
            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              PT Teratai Widjaja
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-1">
            Monitoring aktual perhari periode {selectedMonth ? formatMonthYearIndonesian(selectedMonth) : 'aktif'}, target harian, dan evaluasi analisis operasional
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full md:w-auto">
          {/* Month Selector */}
          {selectedMonth && onMonthChange && (
            <div className="flex items-center space-x-1 bg-slate-50 border border-slate-200 rounded-lg p-1">
              <button
                type="button"
                onClick={() => onMonthChange(getPreviousMonth(selectedMonth))}
                className="p-1 hover:bg-white rounded text-slate-600 hover:text-blue-700 transition-colors"
                title="Bulan Sebelumnya"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <div className="flex items-center space-x-1 px-1">
                <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => e.target.value && onMonthChange(e.target.value)}
                  className="text-xs font-bold text-slate-800 bg-transparent border-0 p-0 focus:ring-0 cursor-pointer"
                  title="Pilih Bulan Rekap"
                />
              </div>
              <button
                type="button"
                onClick={() => onMonthChange(getNextMonth(selectedMonth))}
                className="p-1 hover:bg-white rounded text-slate-600 hover:text-blue-700 transition-colors"
                title="Bulan Berikutnya"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
            {/* Date Filter */}
            <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="text-xs font-semibold text-slate-700 bg-transparent focus:outline-none cursor-pointer w-full"
              >
                <option value="all">Semua Tgl ({records.length})</option>
                {availableDates.map(d => (
                  <option key={d} value={d}>Tgl: {formatDateLabel(d)}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="text-xs font-semibold text-slate-700 bg-transparent focus:outline-none cursor-pointer w-full"
              >
                <option value="all">Semua Status</option>
                <option value="optimal">Optimal</option>
                <option value="warning">Warning</option>
                <option value="critical">Bottleneck</option>
              </select>
            </div>
          </div>

          {/* Button: Masukan Perencanaan Bulanan & Input Harian */}
          {canInputData ? (
            <>
              {onOpenMonthlyPlan && (
                <button
                  onClick={onOpenMonthlyPlan}
                  className="inline-flex items-center justify-center space-x-1.5 px-3 py-2 sm:py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95 w-full sm:w-auto cursor-pointer"
                  title="Input Model, Target Order, Target Harian, SMV & Tanggal Mulai"
                >
                  <Layers className="w-3.5 h-3.5 text-blue-400" />
                  <span>+ Perencanaan Bulanan</span>
                </button>
              )}

              <button
                onClick={onAddNew}
                className="inline-flex items-center justify-center space-x-1.5 px-3.5 py-2 sm:py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm shadow-blue-200 active:scale-95 w-full sm:w-auto cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Masukan Data Harian</span>
              </button>
            </>
          ) : (
            <span className="px-3 py-2 sm:py-1.5 bg-slate-100 text-slate-500 rounded-lg text-xs font-semibold border border-slate-200 inline-flex items-center justify-center">
              🔒 Akun Pantau (Read-Only)
            </span>
          )}
        </div>
      </div>

      {/* MONITORING PERENCANAAN BULANAN: TARGET ORDER, SMV & SISA TARGET (PENGURANGAN OTOMATIS) */}
      {styleSchedules.length > 0 && (
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
              <h3 className="text-xs sm:text-sm font-black text-slate-900 tracking-tight uppercase">
                Perencanaan Bulanan Model & Pengurangan Sisa Target Order
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                Otomatis Berkurang per Input Harian
              </span>
            </div>
            {onOpenMonthlyPlan && (
              <button
                onClick={onOpenMonthlyPlan}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors flex items-center space-x-1 cursor-pointer self-start sm:self-auto"
              >
                <span>+ Tambah Rencana Model Lain</span>
                <span aria-hidden="true">&rarr;</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {styleSchedules.slice(0, 4).map(plan => {
              const percentAchieved = plan.orderQty > 0 ? Math.min(100, (plan.actualQty / plan.orderQty) * 100) : 0;
              return (
                <div key={plan.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 hover:border-blue-300 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black text-slate-900 truncate">{plan.lineName}: {plan.styleName}</span>
                    <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                      plan.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {plan.status === 'completed' ? 'Tercapai' : 'Aktif'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1 text-[11px] font-mono">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Target Order</span>
                      <strong className="text-slate-800 font-bold">{plan.orderQty.toLocaleString('id-ID')} pcs</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Target/Hari</span>
                      <strong className="text-blue-700 font-bold">{plan.dailyTargetQty.toLocaleString('id-ID')} pcs/hr</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">SMV Standar</span>
                      <strong className="text-slate-700 font-bold">{plan.smv || 25.46}m</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Mulai Kapan</span>
                      <span className="text-slate-700 font-semibold">{plan.startDate}</span>
                    </div>
                  </div>

                  {/* Progress Bar & Sisa Target */}
                  <div className="pt-1.5 border-t border-slate-200 space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-500">Telah Terpenuhi: <strong>{plan.actualQty.toLocaleString('id-ID')} pcs</strong></span>
                      <strong className="text-blue-700">{percentAchieved.toFixed(0)}%</strong>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${percentAchieved >= 100 ? 'bg-emerald-600' : 'bg-blue-600'}`}
                        style={{ width: `${percentAchieved}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between text-[10px] pt-0.5">
                      <span className="text-slate-600 font-medium">Sisa Target Order:</span>
                      <strong className="font-mono text-emerald-800 font-black bg-emerald-100 px-1.5 py-0.2 rounded">
                        {plan.remainingQty.toLocaleString('id-ID')} pcs
                      </strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* KPI Cards: Dominant White with Crisp Blue & Red Accents */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Aktual per Hari vs Target per Hari */}
        <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600"></div>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Total Aktual per Hari (Pcs/Hari)
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 font-mono">
              {kpi.totalActualDaily.toLocaleString('id-ID')}
            </span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
              kpi.dailyAchievementRate >= 100 
                ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {formatPercent(kpi.dailyAchievementRate)}
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex justify-between">
            <span>Target Harian: {kpi.totalTargetDaily.toLocaleString('id-ID')} pcs</span>
            <span className={kpi.dailyVariancePcs >= 0 ? 'text-blue-700 font-semibold' : 'text-red-600 font-semibold'}>
              {kpi.dailyVariancePcs >= 0 ? '+' : ''}{kpi.dailyVariancePcs.toLocaleString('id-ID')} pcs
            </span>
          </div>
        </div>

        {/* KPI 2: Rata-rata Efisiensi Sewing */}
        <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600"></div>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Rata-rata Efisiensi Sewing
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-blue-700 font-mono">
              {formatPercent(kpi.avgEfficiency)}
            </span>
            <span className="text-xs font-semibold text-slate-500">
              Benchmark ≥75%
            </span>
          </div>
          <div className="mt-2.5 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-blue-600 h-full rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(100, Math.max(0, kpi.avgEfficiency || 0))}%` }}
            ></div>
          </div>
          <p className="mt-1.5 text-[10px] text-slate-400">
            Dihitung dari Earned Minutes vs Available Minutes
          </p>
        </div>

        {/* KPI 3: Total Manpower (Operator) */}
        <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-red-600"></div>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Total Operator (Manpower)
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 font-mono">
              {kpi.totalManpower} <span className="text-sm font-semibold text-slate-500">Orang</span>
            </span>
            <span className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Aktif di {filteredRecords.length} lini produksi PT Teratai Widjaja
          </p>
        </div>

        {/* KPI 4: Rata-rata Defect / Reject Rate */}
        <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-red-600"></div>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Rata-rata Defect Rate
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className={`text-2xl font-black font-mono ${
              kpi.avgDefect <= 2.0 ? 'text-blue-700' : 'text-red-600'
            }`}>
              {formatPercent(kpi.avgDefect)}
            </span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
              kpi.avgDefect <= 2.0 ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'
            }`}>
              {kpi.avgDefect <= 2.0 ? 'Toleransi OK' : 'Perhatian'}
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Standar toleransi defect quality control: Maksimal 2,0%
          </p>
        </div>

      </div>

      {/* Output per Hari Chart */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <BarChart2 className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Perbandingan Target per Hari vs Aktual per Hari (Pcs/Hari)
            </h3>
          </div>
          <div className="flex items-center space-x-3 text-xs text-slate-500">
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded bg-blue-600"></span>
              <span>Aktual per Hari</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded bg-slate-300"></span>
              <span>Target per Hari</span>
            </span>
          </div>
        </div>

        <div className="mt-4 h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis domain={[0, 'dataMax + 100']} tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip
                formatter={(val: any, name: any, item: any) => [
                  `${Number(val).toLocaleString('id-ID')} pcs/hari (${item.payload?.garmentStyle || item.payload?.style || ''})`,
                  name === 'actualDaily' ? 'Aktual per Hari' : 'Target per Hari'
                ]}
                contentStyle={{ backgroundColor: '#ffffff', borderRadius: 8, borderColor: '#e2e8f0', fontSize: 12 }}
              />
              <Bar dataKey="targetDaily" name="Target per Hari" fill="#cbd5e1" radius={[4, 4, 0, 0]} maxBarSize={24} />
              <Bar dataKey="actualDaily" name="Aktual per Hari" radius={[4, 4, 0, 0]} maxBarSize={24}>
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.isMet ? '#1d4ed8' : '#dc2626'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Main Table with Date, Daily Output, and Dedicated KOLOM ANALISIS */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-3.5 sm:p-5 border-b border-slate-100 flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                Tabel Lembar Kerja Produksi Sewing & Evaluasi Analisis
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500">
                Menampilkan {filteredRecords.length} rekaman produksi harian dengan kolom analisis operasional
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {onOpenIncidentModal && (
                <button
                  onClick={onOpenIncidentModal}
                  className="inline-flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg transition-colors shadow-2xs"
                  title="Lembar Disposisi Hambatan Line & Persetujuan PE / FM"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                  <span>Form Disposisi ({incidentsCount})</span>
                </button>
              )}
              <button
                onClick={onExportPdf}
                className="inline-flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold bg-[#1a3478] hover:bg-blue-900 text-white rounded-lg transition-colors shadow-2xs"
                title="Cetak PDF Resmi Disetujui PE & FM"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak PDF</span>
              </button>
              {onOpenBankData && (
                <button
                  onClick={onOpenBankData}
                  className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg transition-colors"
                >
                  <Database className="w-3.5 h-3.5 text-blue-700" />
                  <span>Bank Data Model</span>
                </button>
              )}
              {canInputData && (
                <button
                  onClick={onAddNew}
                  className="inline-flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-blue-600" />
                  <span>+ Data Baru</span>
                </button>
              )}
            </div>
          </div>

          {/* Mobile View Toggle */}
          <div className="flex md:hidden items-center bg-slate-100 p-1 rounded-lg text-xs font-bold">
            <button
              type="button"
              onClick={() => setMobileViewMode('card')}
              className={`flex-1 py-1.5 rounded-md transition-all ${mobileViewMode === 'card' ? 'bg-white text-blue-700 shadow-2xs font-extrabold' : 'text-slate-600'}`}
            >
              Tampilan Kartu ({filteredRecords.length})
            </button>
            <button
              type="button"
              onClick={() => setMobileViewMode('table')}
              className={`flex-1 py-1.5 rounded-md transition-all ${mobileViewMode === 'table' ? 'bg-white text-blue-700 shadow-2xs font-extrabold' : 'text-slate-600'}`}
            >
              Tabel Lebar
            </button>
          </div>
        </div>

        {/* Mobile Cards Container (Visible on < md when mobileViewMode === 'card') */}
        {mobileViewMode === 'card' && (
          <div className="md:hidden p-3 space-y-3">
            {filteredRecords.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                Tidak ada data produksi untuk filter yang dipilih.
              </div>
            ) : (
              filteredRecords.map((r) => {
                const targetDay = r.targetDailyPcs || r.targetOutputPcs;
                const actualDay = r.actualDailyPcs || r.actualOutputPcs;
                const achRate = targetDay > 0 ? (actualDay / targetDay) * 100 : 0;
                const isOptimal = r.efficiencyPercent >= 75;
                const isDefectHigh = r.defectPercent > 2.0;

                const statusStyles = {
                  optimal: {
                    badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
                    dot: 'bg-emerald-500',
                    label: 'Optimal'
                  },
                  warning: {
                    badge: 'bg-amber-50 text-amber-800 border-amber-200',
                    dot: 'bg-amber-500',
                    label: 'Warning'
                  },
                  critical: {
                    badge: 'bg-red-50 text-red-800 border-red-200',
                    dot: 'bg-red-500',
                    label: 'Bottleneck'
                  }
                }[r.analysisStatus || (achRate >= 98 ? 'optimal' : achRate >= 85 ? 'warning' : 'critical')];

                return (
                  <div key={r.id} className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs space-y-2.5">
                    {/* Header Row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-extrabold text-xs">
                          {r.lineName || `Line ${r.lineId}`}
                        </span>
                        <span className="text-xs font-semibold text-slate-600">
                          {formatDateLabel(r.date)}
                        </span>
                      </div>
                      <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusStyles.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusStyles.dot}`}></span>
                        <span>{statusStyles.label}</span>
                      </span>
                    </div>

                    {/* Style Name */}
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-900 bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{r.style}</span>
                    </div>

                    {/* Key Metrics Grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-slate-50/70 p-2 rounded-lg border border-slate-100">
                        <span className="text-[10px] text-slate-400 font-medium block">Target / Aktual</span>
                        <div className="flex items-baseline space-x-1 mt-0.5">
                          <span className="font-bold text-slate-800">{actualDay.toLocaleString('id-ID')}</span>
                          <span className="text-[10px] text-slate-400">/ {targetDay.toLocaleString('id-ID')} pcs</span>
                        </div>
                        <span className={`text-[10px] font-bold ${achRate >= 100 ? 'text-blue-700' : 'text-red-600'}`}>
                          Capaian: {formatPercent(achRate)}
                        </span>
                      </div>

                      <div className="bg-slate-50/70 p-2 rounded-lg border border-slate-100">
                        <span className="text-[10px] text-slate-400 font-medium block">Efisiensi Sewing</span>
                        <div className="mt-0.5">
                          <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${
                            isOptimal ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {formatPercent(r.efficiencyPercent)}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-1">
                          Benchmark ≥75%
                        </span>
                      </div>

                      <div className="bg-slate-50/70 p-2 rounded-lg border border-slate-100">
                        <span className="text-[10px] text-slate-400 font-medium block">Operator / SMV</span>
                        <div className="text-slate-800 font-semibold mt-0.5">
                          {r.manpower} OP • {r.smvStandard} min
                        </div>
                      </div>

                      <div className="bg-slate-50/70 p-2 rounded-lg border border-slate-100">
                        <span className="text-[10px] text-slate-400 font-medium block">Defect Rate</span>
                        <div className={`font-semibold mt-0.5 ${isDefectHigh ? 'text-red-600 font-bold' : 'text-slate-700'}`}>
                          {formatPercent(r.defectPercent)}
                        </div>
                      </div>
                    </div>

                    {/* Operational Analysis Note */}
                    <div className="p-2.5 rounded-lg bg-blue-50/40 border border-blue-100 text-xs">
                      <span className="text-[10px] font-bold text-blue-900 uppercase block tracking-wider mb-0.5">
                        Analisis Operasional & Hambatan
                      </span>
                      <p className="text-[11px] text-slate-600 leading-snug">
                        {r.analysisNote || r.note || 'Produksi berjalan lancar sesuai instruksi standar.'}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    {canEditDelete && (
                      <div className="flex items-center justify-end space-x-2 pt-1 border-t border-slate-100">
                        <button
                          onClick={() => onEdit(r)}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 active:scale-95 transition-all cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => onDelete(r.id)}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 active:scale-95 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Table container (Always visible on >= md, conditional on < md) */}
        <div className={`overflow-x-auto w-full ${mobileViewMode === 'card' ? 'hidden md:block' : 'block'}`}>
          <table className="min-w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                <th className="px-3 py-3 text-center min-w-[65px]">Line</th>
                <th className="px-3 py-3 min-w-[95px]">Tanggal</th>
                <th className="px-3 py-3 min-w-[160px]">Model / Style</th>
                <th className="px-3 py-3 text-right min-w-[95px]">Target/Hari</th>
                <th className="px-3 py-3 text-right min-w-[95px]">Aktual/Hari</th>
                <th className="px-3 py-3 text-right min-w-[85px]">Capaian (%)</th>
                <th className="px-3 py-3 text-center min-w-[55px]">MP</th>
                <th className="px-3 py-3 text-right min-w-[70px]">SMV</th>
                <th className="px-3 py-3 text-right min-w-[85px]">Efisiensi</th>
                <th className="px-3 py-3 text-right min-w-[75px]">Defect</th>
                <th className="px-3 py-3 min-w-[260px]">Kolom Analisis Operasional</th>
                <th className="px-3 py-3 text-center min-w-[75px]">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={12} className="py-14 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2 max-w-md mx-auto px-4">
                      <FileSpreadsheet className="w-8 h-8 text-slate-300" />
                      <p className="font-semibold text-slate-700">
                        Belum ada rekaman rekap produksi untuk bulan {selectedMonth ? formatMonthYearIndonesian(selectedMonth) : 'ini'}
                      </p>
                      <p className="text-xs text-slate-400">
                        Silakan klik tombol "+ Masukan Data Harian" untuk menambahkan rekaman produksi atau pilih bulan lain.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
              {filteredRecords.map((r) => {
                const targetDay = r.targetDailyPcs || r.targetOutputPcs;
                const actualDay = r.actualDailyPcs || r.actualOutputPcs;
                const achRate = targetDay > 0 ? (actualDay / targetDay) * 100 : 0;
                const isOptimal = r.efficiencyPercent >= 75;
                const isDefectHigh = r.defectPercent > 2.0;

                const statusStyles = {
                  optimal: {
                    badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
                    dot: 'bg-emerald-500',
                    label: 'Optimal'
                  },
                  warning: {
                    badge: 'bg-amber-50 text-amber-800 border-amber-200',
                    dot: 'bg-amber-500',
                    label: 'Warning'
                  },
                  critical: {
                    badge: 'bg-red-50 text-red-800 border-red-200',
                    dot: 'bg-red-500',
                    label: 'Bottleneck'
                  }
                }[r.analysisStatus || (achRate >= 98 ? 'optimal' : achRate >= 85 ? 'warning' : 'critical')];

                return (
                  <tr key={r.id} className="hover:bg-blue-50/25 transition-colors">
                    <td className="px-3 py-3 text-center font-bold">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-blue-50 text-blue-700 font-extrabold text-xs">
                        {r.lineId}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-slate-800 whitespace-nowrap font-medium">
                      {formatDateLabel(r.date)}
                    </td>
                    <td className="px-3 py-3 font-semibold text-slate-800">
                      <div className="flex items-center space-x-1.5">
                        <Tag className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{r.style}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-slate-600">
                      {targetDay.toLocaleString('id-ID')} pcs
                    </td>
                    <td className="px-3 py-3 text-right font-mono font-bold text-slate-900">
                      {actualDay.toLocaleString('id-ID')} pcs
                    </td>
                    <td className={`px-3 py-3 text-right font-mono font-bold ${
                      achRate >= 100 ? 'text-blue-700' : 'text-red-600'
                    }`}>
                      {formatPercent(achRate)}
                    </td>
                    <td className="px-3 py-3 text-center font-mono text-slate-700">
                      {r.manpower}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-slate-700 font-semibold">
                      {r.smvStandard}
                    </td>
                    <td className="px-3 py-3 text-right font-mono">
                      <span className={`px-2 py-0.5 rounded font-bold ${
                        isOptimal ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {formatPercent(r.efficiencyPercent)}
                      </span>
                    </td>
                    <td className={`px-3 py-3 text-right font-mono font-semibold ${
                      isDefectHigh ? 'text-red-600' : 'text-slate-700'
                    }`}>
                      {formatPercent(r.defectPercent)}
                    </td>
                    <td className="px-3 py-3 text-slate-700 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-1.5">
                          <span className={`inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-bold border ${statusStyles.badge}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusStyles.dot}`}></span>
                            <span>{statusStyles.label}</span>
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-snug">
                          {r.analysisNote || r.note || 'Produksi berjalan sesuai instruksi kerja standar.'}
                        </p>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      {canEditDelete ? (
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => onEdit(r)}
                            className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                            title="Edit Rekaman"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDelete(r.id)}
                            className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Hapus Rekaman"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium italic">Pantau</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100/90 font-bold border-t-2 border-slate-300 text-slate-900">
                <td colSpan={3} className="px-3 py-3 text-xs uppercase tracking-wider">
                  Total & Rata-rata Harian
                </td>
                <td className="px-3 py-3 text-right font-mono text-slate-700">
                  {kpi.totalTargetDaily.toLocaleString('id-ID')} pcs
                </td>
                <td className="px-3 py-3 text-right font-mono text-blue-700">
                  {kpi.totalActualDaily.toLocaleString('id-ID')} pcs
                </td>
                <td className={`px-3 py-3 text-right font-mono ${
                  kpi.dailyAchievementRate >= 100 ? 'text-blue-700' : 'text-red-600'
                }`}>
                  {formatPercent(kpi.dailyAchievementRate)}
                </td>
                <td className="px-3 py-3 text-center font-mono">
                  {kpi.totalManpower}
                </td>
                <td className="px-3 py-3 text-right text-slate-400">-</td>
                <td className="px-3 py-3 text-right font-mono text-blue-700">
                  {formatPercent(kpi.avgEfficiency)}
                </td>
                <td className="px-3 py-3 text-right font-mono text-red-600">
                  {formatPercent(kpi.avgDefect)}
                </td>
                <td colSpan={2} className="px-3 py-3 text-slate-400 text-xs">
                  Evaluasi kinerja akumulatif {filteredRecords.length} lini
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

    </div>
  );
};
