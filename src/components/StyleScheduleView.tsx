import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  AlertTriangle, 
  Clock, 
  Layers, 
  BellRing, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  Zap, 
  Database,
  ArrowRight,
  TrendingDown,
  FileSpreadsheet,
  Download
} from 'lucide-react';
import { StyleScheduleRecord, ScheduleOverlapConflict, UrgentPushNotification, BankDataModel } from '../types';
import { DailyLineScheduleCalendar } from './DailyLineScheduleCalendar';

interface StyleScheduleViewProps {
  schedules: StyleScheduleRecord[];
  conflicts: ScheduleOverlapConflict[];
  urgentNotifications: UrgentPushNotification[];
  bankDataModels?: BankDataModel[];
  onAddNew: () => void;
  onEdit: (record: StyleScheduleRecord) => void;
  onDelete: (id: string) => void;
  onOpenPushModal: () => void;
  onNavigateScenario?: () => void;
  canInputData?: boolean;
}

export const StyleScheduleView: React.FC<StyleScheduleViewProps> = ({
  schedules,
  conflicts,
  urgentNotifications,
  bankDataModels = [],
  onAddNew,
  onEdit,
  onDelete,
  onOpenPushModal,
  onNavigateScenario,
  canInputData = true
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'calendar' | 'table'>('calendar');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLine, setFilterLine] = useState<number | 'all'>('all');

  // Metrik Ringkasan
  const totalStyles = schedules.length;
  const totalRemainingQty = schedules.reduce((acc, s) => acc + s.remainingQty, 0);
  const totalOtHours = Number(schedules.reduce((acc, s) => acc + s.otHoursNeeded, 0).toFixed(1));
  const activeOtLinesCount = new Set(schedules.filter(s => s.needsOT).map(s => s.lineId)).size;
  const overlapCount = conflicts.length;
  const unreadNotifCount = urgentNotifications.filter(n => !n.read).length;

  // Filter jadwal untuk tabel
  const filteredSchedules = schedules.filter(s => {
    const matchesSearch = s.styleName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.buyer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.lineName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLine = filterLine === 'all' || s.lineId === filterLine;
    return matchesSearch && matchesLine;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-150 font-['Plus_Jakarta_Sans',sans-serif]">
      
      {/* KPI METRIC CARDS HEADER */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Total Style Aktif */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Alokasi Model Aktif</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-black text-slate-900">{totalStyles}</span>
            <span className="text-xs text-slate-400 ml-1">Style Sewing</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Terbagi di {activeOtLinesCount} Line produksi</p>
        </div>

        {/* Total Sisa Qty (Backlog) */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Sisa Target (Backlog)</span>
            <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-black text-red-600">
              {totalRemainingQty.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400 ml-1">pcs</span>
          </div>
          <p className="text-[11px] text-red-600 font-semibold mt-1">Harus diselesaikan lewat OT</p>
        </div>

        {/* Total Jam Lembur (OT) */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Estimasi Jam Lembur (OT)</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-black text-amber-600">{totalOtHours}</span>
            <span className="text-xs text-slate-400 ml-1">Jam Terencana</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Rata-rata 2 - 2.5 jam/shift malam</p>
        </div>

        {/* Status Tumpang Tindih (Overlaps) */}
        <div className={`p-4 rounded-xl border transition-all ${
          overlapCount > 0 
            ? 'bg-red-50/80 border-red-300 shadow-xs' 
            : 'bg-white border-slate-200 shadow-2xs'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">Tumpang Tindih (Overlap)</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              overlapCount > 0 ? 'bg-red-600 text-white animate-pulse' : 'bg-emerald-50 text-emerald-600'
            }`}>
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-1.5">
            <span className={`text-xl sm:text-2xl font-black ${overlapCount > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
              {overlapCount}
            </span>
            <span className="text-xs font-bold text-slate-500">Hari Bentrok</span>
          </div>
          <p className={`text-[11px] font-bold mt-1 ${overlapCount > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
            {overlapCount > 0 ? 'Perlu penyesuaian alokasi mesin' : 'Jadwal rapi tanpa bentrok'}
          </p>
        </div>

      </div>

      {/* BAR SKENARIO JADWAL STYLE SEWING & JAM LEMBUR (6 Hari vs 5 Hari) */}
      <div className="bg-gradient-to-r from-blue-900 via-[#1a3478] to-slate-900 rounded-xl p-3.5 sm:p-4 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 border border-blue-800/60">
        <div className="flex items-start sm:items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0 text-amber-300">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-extrabold text-sm sm:text-base tracking-wide">
                Bar Skenario Jadwal Style Sewing &amp; Jam Lembur
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase">
                Simulasi Produksi
              </span>
            </div>
            <p className="text-xs text-blue-200 mt-0.5 max-w-2xl leading-relaxed">
              Standar: <span className="font-bold text-white">6 Hari Kerja</span> (Senin–Jumat 8 Jam, Sabtu 5 Jam). Bila menerapkan <span className="font-bold text-amber-200">5 Hari Kerja</span> (Sabtu Libur), diperlukan kompensasi <span className="font-bold text-emerald-300">+1 Jam Lembur/hari</span> untuk mempertahankan output tepat waktu.
            </p>
          </div>
        </div>

        {onNavigateScenario && (
          <button
            id="btn-goto-scenario-analysis"
            onClick={onNavigateScenario}
            className="self-start md:self-center shrink-0 px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg text-xs font-black transition-all shadow-md active:scale-95 flex items-center space-x-1.5"
          >
            <span>Buka Analisis 5 Hari &amp; OT</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* ACTION & VIEW CONTROLS */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        
        {/* Sub-Tab Navigation */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg w-full sm:w-auto">
          <button
            onClick={() => setActiveSubTab('calendar')}
            className={`flex-1 sm:flex-none px-2.5 sm:px-3.5 py-1.5 rounded-md text-xs font-extrabold transition-all flex items-center justify-center space-x-1.5 ${
              activeSubTab === 'calendar'
                ? 'bg-white text-blue-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span className="sm:hidden">Kalender Line</span>
            <span className="hidden sm:inline">Kalender Harian Kategori Line</span>
          </button>

          <button
            onClick={() => setActiveSubTab('table')}
            className={`flex-1 sm:flex-none px-2.5 sm:px-3.5 py-1.5 rounded-md text-xs font-extrabold transition-all flex items-center justify-center space-x-1.5 ${
              activeSubTab === 'table'
                ? 'bg-white text-blue-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="sm:hidden">Tabel ({schedules.length})</span>
            <span className="hidden sm:inline">Tabel Rekapitulasi Alokasi & OT ({schedules.length})</span>
          </button>
        </div>

        {/* Buttons & Search */}
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
          {/* Pusat Notifikasi Push Button */}
          <button
            onClick={onOpenPushModal}
            className="relative px-2.5 sm:px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-colors inline-flex items-center justify-center space-x-1.5 border border-slate-300 active:scale-95"
          >
            <BellRing className="w-3.5 h-3.5 text-blue-700" />
            <span>Notifikasi</span>
            {unreadNotifCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-red-600 text-white text-[9px] font-black flex items-center justify-center">
                {unreadNotifCount}
              </span>
            )}
          </button>

          {/* Add New Schedule Button (Enforce canInputData) */}
          {canInputData ? (
            <button
              onClick={onAddNew}
              className="px-3 sm:px-4 py-1.5 bg-[#1a3478] hover:bg-blue-900 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs inline-flex items-center justify-center space-x-1.5 active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="sm:hidden">+ Jadwal</span>
              <span className="hidden sm:inline">+ Input Jadwal Style Baru</span>
            </button>
          ) : (
            <span className="px-3 py-1.5 bg-slate-100 text-slate-500 rounded-lg text-xs font-semibold border border-slate-200 flex items-center justify-center">
              🔒 Akun Pantau (Read-Only)
            </span>
          )}
        </div>

      </div>

      {/* VIEW: KALENDER HARIAN */}
      {activeSubTab === 'calendar' && (
        <DailyLineScheduleCalendar
          schedules={schedules}
          conflicts={conflicts}
          onAddNewSchedule={(lineId) => onAddNew()}
        />
      )}

      {/* VIEW: TABEL REKAPITULASI */}
      {activeSubTab === 'table' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          
          {/* Table Search & Filters */}
          <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari style, buyer, atau line..."
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-slate-500 font-semibold">Filter Line:</span>
              <select
                value={filterLine}
                onChange={(e) => setFilterLine(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800"
              >
                <option value="all">Semua Line (1-10)</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                  <option key={num} value={num}>Line {num}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100 text-[11px] font-extrabold text-slate-600 uppercase border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Line</th>
                  <th className="py-3 px-4">Model / Style & Buyer</th>
                  <th className="py-3 px-3 text-right">Target Order</th>
                  <th className="py-3 px-3 text-right">Target/Hari</th>
                  <th className="py-3 px-3 text-right">Aktual</th>
                  <th className="py-3 px-3 text-right">Sisa Qty</th>
                  <th className="py-3 px-4 text-center">Periode Normal</th>
                  <th className="py-3 px-3 text-center">Lembur (OT)</th>
                  <th className="py-3 px-4 text-center">Selesai OT</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {filteredSchedules.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-8 text-center text-slate-400">
                      Tidak ada data jadwal style yang cocok dengan filter.
                    </td>
                  </tr>
                ) : (
                  filteredSchedules.map((sch) => {
                    const hasConflict = conflicts.some(c => c.lineId === sch.lineId && (c.previousStyle.id === sch.id || c.incomingStyle.id === sch.id));

                    return (
                      <tr key={sch.id} className="hover:bg-blue-50/30 transition-colors">
                        
                        {/* Line */}
                        <td className="py-3 px-4">
                          <span className="font-extrabold px-2 py-0.5 rounded-md bg-[#1a3478] text-white text-[10px]">
                            {sch.lineName}
                          </span>
                        </td>

                        {/* Style & Buyer */}
                        <td className="py-3 px-4">
                          <div className="font-extrabold text-slate-900">{sch.styleName}</div>
                          <div className="text-[11px] text-slate-500 font-semibold">{sch.buyer}</div>
                        </td>

                        {/* Qty Order */}
                        <td className="py-3 px-3 text-right font-extrabold text-slate-900">
                          {sch.orderQty.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">pcs</span>
                        </td>

                        {/* Target Daily */}
                        <td className="py-3 px-3 text-right font-semibold text-slate-700">
                          {sch.dailyTargetQty.toLocaleString()}
                        </td>

                        {/* Aktual */}
                        <td className="py-3 px-3 text-right font-bold text-slate-900">
                          {sch.actualQty.toLocaleString()}
                        </td>

                        {/* Sisa Qty */}
                        <td className="py-3 px-3 text-right">
                          <span className={`font-black ${sch.remainingQty > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                            {sch.remainingQty.toLocaleString()}
                          </span>
                        </td>

                        {/* Periode Normal */}
                        <td className="py-3 px-4 text-center text-[11px] text-slate-600">
                          <span className="font-semibold">{sch.startDate}</span>
                          <span className="text-slate-400 mx-1">s/d</span>
                          <span className="font-semibold">{sch.plannedEndDate}</span>
                        </td>

                        {/* Lembur OT */}
                        <td className="py-3 px-3 text-center">
                          {sch.needsOT ? (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-black text-[11px] border border-amber-300">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>{sch.otHoursNeeded}j ({sch.otDaysNeeded}hr)</span>
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400">-</span>
                          )}
                        </td>

                        {/* Tanggal Selesai OT */}
                        <td className="py-3 px-4 text-center text-[11px]">
                          {sch.needsOT ? (
                            <span className="font-bold text-slate-800">{sch.otEndDate}</span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        {/* Status & Overlap */}
                        <td className="py-3 px-3 text-center">
                          {hasConflict ? (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-red-600 text-white font-black text-[10px] animate-pulse">
                              <Zap className="w-3 h-3" />
                              <span>OVERLAP</span>
                            </span>
                          ) : sch.remainingQty === 0 ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] border border-emerald-300">
                              Selesai
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px] border border-blue-300">
                              Berjalan
                            </span>
                          )}
                        </td>

                        {/* Aksi */}
                        <td className="py-3 px-4 text-center">
                          {canInputData ? (
                            <div className="flex items-center justify-center space-x-1.5">
                              <button
                                onClick={() => onEdit(sch)}
                                className="p-1 rounded-md text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors cursor-pointer"
                                title="Edit Jadwal & OT"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => onDelete(sch.id)}
                                className="p-1 rounded-md text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                                title="Hapus Jadwal"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-medium italic">Pantau Saja</span>
                          )}
                        </td>

                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

    </div>
  );
};
