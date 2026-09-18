import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  Layers, 
  Plus, 
  Search, 
  TrendingDown, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Edit2, 
  Trash2, 
  Zap,
  Check
} from 'lucide-react';
import { StyleScheduleRecord, ScheduleOverlapConflict, UrgentPushNotification } from '../types';
import { DailyLineScheduleCalendar } from './DailyLineScheduleCalendar';

interface StyleScheduleViewProps {
  schedules: StyleScheduleRecord[];
  conflicts: ScheduleOverlapConflict[];
  urgentNotifications?: UrgentPushNotification[];
  onAddNew: () => void;
  onEdit: (schedule: StyleScheduleRecord) => void;
  onDelete: (id: string) => void;
  onResolveConflict?: (conflictId: string) => void;
  onOpenPushModal?: () => void;
  onNavigateScenario?: () => void;
  canInputData?: boolean;
}

export const StyleScheduleView: React.FC<StyleScheduleViewProps> = ({
  schedules,
  conflicts,
  onAddNew,
  onEdit,
  onDelete,
  canInputData = true
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'calendar' | 'table'>('calendar');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLine, setFilterLine] = useState<number | 'all'>('all');

  // Metrik Ringkasan Bersih
  const totalStyles = schedules.length;
  const totalTargetOrder = schedules.reduce((acc, s) => acc + s.orderQty, 0);
  const totalActual = schedules.reduce((acc, s) => acc + s.actualQty, 0);
  const totalRemainingQty = schedules.reduce((acc, s) => acc + s.remainingQty, 0);
  const overlapCount = conflicts.length;

  // Filter jadwal untuk tabel
  const filteredSchedules = schedules.filter(s => {
    const matchesSearch = s.styleName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.buyer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.lineName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLine = filterLine === 'all' || s.lineId === filterLine;
    return matchesSearch && matchesLine;
  });

  return (
    <div className="space-y-5 animate-in fade-in duration-150 font-['Plus_Jakarta_Sans',sans-serif]">
      
      {/* 4 KPI METRIC CARDS - Bersih & Rapi */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Total Style Aktif */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Model Terjadwal</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-black text-slate-900">{totalStyles}</span>
            <span className="text-xs text-slate-400 ml-1">Style</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Lini sewing 1 - 10</p>
        </div>

        {/* Total Target Order */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Target Order</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-black text-indigo-900">
              {totalTargetOrder.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400 ml-1">pcs</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Kapasitas 8 jam normal / 5 jam Sabtu</p>
        </div>

        {/* Total Aktual Selesai */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Aktual Tercapai</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-black text-emerald-700">
              {totalActual.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400 ml-1">pcs</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Diinput dari rekap harian</p>
        </div>

        {/* Sisa Target (Backlog) & Status Overlap */}
        <div className={`p-4 rounded-xl border transition-all ${
          overlapCount > 0 
            ? 'bg-red-50/70 border-red-300' 
            : 'bg-white border-slate-200 shadow-2xs'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">Sisa Target Produksi</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              overlapCount > 0 ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-700'
            }`}>
              {overlapCount > 0 ? <Zap className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-1.5">
            <span className="text-xl sm:text-2xl font-black text-slate-900">
              {totalRemainingQty.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400">pcs</span>
          </div>
          <p className={`text-[11px] font-bold mt-1 ${overlapCount > 0 ? 'text-red-700' : 'text-slate-500'}`}>
            {overlapCount > 0 ? `${overlapCount} hari tumpang tindih terdeteksi` : 'Tidak ada tumpang tindih'}
          </p>
        </div>

      </div>

      {/* ACTION & SUB-TAB NAVIGATION */}
      <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        
        {/* Sub-Tab Navigation */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveSubTab('calendar')}
            className={`px-3 sm:px-4 py-1.5 rounded-md text-xs font-extrabold transition-all flex items-center space-x-1.5 ${
              activeSubTab === 'calendar'
                ? 'bg-white text-blue-800 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Kalender Lini Sewing</span>
          </button>

          <button
            onClick={() => setActiveSubTab('table')}
            className={`px-3 sm:px-4 py-1.5 rounded-md text-xs font-extrabold transition-all flex items-center space-x-1.5 ${
              activeSubTab === 'table'
                ? 'bg-white text-blue-800 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Tabel Jadwal Style ({schedules.length})</span>
          </button>
        </div>

        {/* Add New Schedule Button */}
        {canInputData && (
          <button
            onClick={onAddNew}
            className="px-4 py-2 bg-[#1a3478] hover:bg-blue-900 text-white rounded-lg text-xs font-extrabold transition-colors shadow-2xs flex items-center justify-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Input Jadwal Style Baru</span>
          </button>
        )}
      </div>

      {/* SUB-VIEW 1: KALENDER HARIAN */}
      {activeSubTab === 'calendar' && (
        <DailyLineScheduleCalendar
          schedules={schedules}
          conflicts={conflicts}
          onAddNewSchedule={onAddNew}
        />
      )}

      {/* SUB-VIEW 2: TABEL DAFTAR JADWAL */}
      {activeSubTab === 'table' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          
          {/* Table Search & Filters */}
          <div className="p-3.5 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
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
                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-800"
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
                  <th className="py-3 px-3 text-right">Target Total</th>
                  <th className="py-3 px-3 text-right">Target (8 Jam)</th>
                  <th className="py-3 px-3 text-right">Sabtu (5 Jam)</th>
                  <th className="py-3 px-3 text-right">Aktual</th>
                  <th className="py-3 px-3 text-right">Sisa Target</th>
                  <th className="py-3 px-4 text-center">Periode Jadwal</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {filteredSchedules.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-400">
                      Tidak ada jadwal style yang cocok dengan filter.
                    </td>
                  </tr>
                ) : (
                  filteredSchedules.map((sch) => {
                    const hasConflict = conflicts.some(
                      c => c.lineId === sch.lineId && (c.previousStyle.id === sch.id || c.incomingStyle.id === sch.id)
                    );
                    const satTarget = Math.round((sch.dailyTargetQty * 5) / 8);

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

                        {/* Target Daily 8 Jam */}
                        <td className="py-3 px-3 text-right font-semibold text-blue-900">
                          {sch.dailyTargetQty.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">pcs</span>
                        </td>

                        {/* Target Sabtu 5 Jam */}
                        <td className="py-3 px-3 text-right font-semibold text-amber-800">
                          {satTarget.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">pcs</span>
                        </td>

                        {/* Aktual */}
                        <td className="py-3 px-3 text-right font-bold text-slate-900">
                          {sch.actualQty.toLocaleString()}
                        </td>

                        {/* Sisa Target (Berkurang dari input rekap harian) */}
                        <td className="py-3 px-3 text-right">
                          <span className={`font-black ${sch.remainingQty > 0 ? 'text-amber-800' : 'text-emerald-700'}`}>
                            {sch.remainingQty.toLocaleString()}
                          </span>
                        </td>

                        {/* Periode */}
                        <td className="py-3 px-4 text-center text-[11px] text-slate-600">
                          <span className="font-semibold">{sch.startDate}</span>
                          <span className="text-slate-400 mx-1">s/d</span>
                          <span className="font-semibold">{sch.plannedEndDate}</span>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3 text-center">
                          {hasConflict ? (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-red-600 text-white font-black text-[10px]">
                              <Zap className="w-3 h-3" />
                              <span>OVERLAP</span>
                            </span>
                          ) : sch.remainingQty === 0 ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                              Selesai
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px]">
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
                                className="p-1 rounded-md text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors"
                                title="Edit Jadwal Style"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => onDelete(sch.id)}
                                className="p-1 rounded-md text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
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
