import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  AlertTriangle, 
  Clock, 
  Layers, 
  Info, 
  Filter, 
  Maximize2,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Zap,
  Eye,
  SlidersHorizontal,
  LayoutGrid,
  List
} from 'lucide-react';
import { StyleScheduleRecord, ScheduleOverlapConflict } from '../types';

interface DailyLineScheduleCalendarProps {
  schedules: StyleScheduleRecord[];
  conflicts: ScheduleOverlapConflict[];
  onSelectSchedule?: (schedule: StyleScheduleRecord) => void;
  onAddNewSchedule?: (lineId?: number) => void;
  canInputData?: boolean;
}

export const DailyLineScheduleCalendar: React.FC<DailyLineScheduleCalendarProps> = ({
  schedules,
  conflicts,
  onSelectSchedule,
  onAddNewSchedule,
  canInputData = true
}) => {
  // Filter state
  const [selectedMonth, setSelectedMonth] = useState<number>(8); // 8 = September (0-indexed)
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [filterLineId, setFilterLineId] = useState<number | 'all'>('all');
  const [filterMode, setFilterMode] = useState<'all' | 'overlaps_only' | 'ot_only'>('all');
  const [activeCellDetail, setActiveCellDetail] = useState<{
    dateStr: string;
    lineId: number;
    lineName: string;
    regularStyles: StyleScheduleRecord[];
    otStyles: StyleScheduleRecord[];
    conflicts: ScheduleOverlapConflict[];
  } | null>(null);
  const [viewLayout, setViewLayout] = useState<'calendar' | 'agenda'>('calendar');

  // Days in selected month
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const dayNumbers = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Helper formatting
  const getDayName = (day: number) => {
    const d = new Date(selectedYear, selectedMonth, day);
    const names = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    return names[d.getDay()];
  };

  const isSunday = (day: number) => {
    const d = new Date(selectedYear, selectedMonth, day);
    return d.getDay() === 0;
  };

  const isSaturday = (day: number) => {
    const d = new Date(selectedYear, selectedMonth, day);
    return d.getDay() === 6;
  };

  const formatDate = (day: number): string => {
    const m = String(selectedMonth + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${selectedYear}-${m}-${d}`;
  };

  // Distinct Lines from schedules
  const allLineIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const displayedLineIds = filterLineId === 'all' 
    ? allLineIds 
    : [filterLineId];

  // Helper to determine what is active on a date for a line
  const getLineDayContent = (lineId: number, dateStr: string) => {
    const lineSchedules = schedules.filter(s => s.lineId === lineId);
    
    // Regular active: date is between startDate and plannedEndDate
    const regularStyles = lineSchedules.filter(s => {
      return dateStr >= s.startDate && dateStr <= s.plannedEndDate;
    });

    // OT active: date is after plannedEndDate and up to otEndDate, AND has sisa > 0
    const otStyles = lineSchedules.filter(s => {
      return s.needsOT && s.otDaysNeeded > 0 && dateStr > s.plannedEndDate && dateStr <= s.otEndDate;
    });

    // Overlaps for this line and date
    const dayConflicts = conflicts.filter(c => c.lineId === lineId && c.date === dateStr);

    const isOverlap = dayConflicts.length > 0 || (regularStyles.length > 0 && otStyles.length > 0);

    return {
      regularStyles,
      otStyles,
      dayConflicts,
      isOverlap
    };
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      
      {/* Top Header Controls */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/70">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Title & Month Picker */}
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-700 text-white flex items-center justify-center shrink-0">
                <CalendarIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-[#1a3478]">
                  Kalender Harian Alokasi Style Sewing & Jam Lembur (OT)
                </h3>
                <p className="text-xs text-slate-500">
                  Visualisasi durasi style, kelanjutan jam lembur (OT), dan deteksi tumpang tindih antar model
                </p>
              </div>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Dynamic Month & Year Selectors with Navigation */}
            <div className="flex items-center space-x-1 bg-white border border-blue-200 rounded-xl p-1 shadow-2xs">
              <button
                onClick={() => {
                  if (selectedMonth === 0) {
                    setSelectedMonth(11);
                    setSelectedYear(prev => prev - 1);
                  } else {
                    setSelectedMonth(prev => prev - 1);
                  }
                }}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors cursor-pointer"
                title="Bulan Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Month Selector */}
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-transparent text-xs font-black text-blue-900 px-1 py-1 focus:outline-hidden cursor-pointer"
              >
                {[
                  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
                ].map((name, idx) => (
                  <option key={idx} value={idx}>{name}</option>
                ))}
              </select>

              {/* Year Selector */}
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-transparent text-xs font-black text-blue-900 px-1 py-1 focus:outline-hidden cursor-pointer"
              >
                {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map((yr) => (
                  <option key={yr} value={yr}>{yr}</option>
                ))}
              </select>

              <button
                onClick={() => {
                  if (selectedMonth === 11) {
                    setSelectedMonth(0);
                    setSelectedYear(prev => prev + 1);
                  } else {
                    setSelectedMonth(prev => prev + 1);
                  }
                }}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors cursor-pointer"
                title="Bulan Berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Button: Hari Ini / Bulan Sekarang */}
            <button
              onClick={() => {
                const now = new Date();
                setSelectedMonth(now.getMonth());
                setSelectedYear(now.getFullYear());
              }}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold transition-all text-[11px] cursor-pointer"
            >
              Bulan Sekarang
            </button>

            {/* Filter Line */}
            <div className="flex items-center space-x-1 bg-white border border-slate-300 rounded-lg px-2 py-1 shadow-2xs">
              <Filter className="w-3 h-3 text-slate-400" />
              <select
                value={filterLineId}
                onChange={(e) => setFilterLineId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-hidden"
              >
                <option value="all">Semua Kategori Line</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                  <option key={n} value={n}>Line {n}</option>
                ))}
              </select>
            </div>

            {/* Filter Conflict Mode */}
            <div className="flex items-center space-x-1 bg-white border border-slate-300 rounded-lg px-2 py-1 shadow-2xs">
              <select
                value={filterMode}
                onChange={(e) => setFilterMode(e.target.value as any)}
                className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-hidden"
              >
                <option value="all">Semua Status</option>
                <option value="overlaps_only">⚡ Tumpang Tindih Saja ({conflicts.length})</option>
                <option value="ot_only">🟠 Berjalan di Jam OT</option>
              </select>
            </div>

            {/* Toggle Calendar vs Agenda */}
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5">
              <button
                onClick={() => setViewLayout('calendar')}
                className={`p-1.5 rounded-md text-xs font-bold transition-all ${
                  viewLayout === 'calendar' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Tampilan Matriks Kalender"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewLayout('agenda')}
                className={`p-1.5 rounded-md text-xs font-bold transition-all ${
                  viewLayout === 'agenda' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Tampilan Daftar Agenda per Line"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick Action Button - Gated for PE only */}
            {canInputData && onAddNewSchedule && (
              <button
                onClick={() => onAddNewSchedule()}
                className="px-3 py-1.5 bg-[#1a3478] hover:bg-blue-900 text-white rounded-lg font-bold shadow-2xs transition-colors"
              >
                + Input Style
              </button>
            )}
          </div>

        </div>

        {/* Legend Ribbon */}
        <div className="mt-3 pt-3 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">Keterangan Kalender:</span>
            
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-xs bg-blue-600 border border-blue-700"></span>
              <span className="text-slate-600 font-medium">Senin - Jumat (Normal 7-8 Jam)</span>
            </div>

            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-xs bg-amber-400 border border-amber-500"></span>
              <span className="text-amber-900 font-bold">Sabtu (Masuk 1/2 Hari)</span>
            </div>

            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-xs bg-red-100 border border-red-300"></span>
              <span className="text-red-700 font-bold">Minggu (Libur)</span>
            </div>

            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-xs bg-amber-500 border border-amber-600"></span>
              <span className="text-slate-600 font-medium">Lembur / OT</span>
            </div>

            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-xs bg-red-600 border border-red-700 flex items-center justify-center text-white text-[8px] font-black">
                ⚡
              </span>
              <span className="text-red-700 font-extrabold">Tumpang Tindih (Overlap)</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 font-semibold">
            {conflicts.length > 0 ? (
              <span className="text-red-600 font-bold inline-flex items-center space-x-1">
                <AlertTriangle className="w-3 h-3" />
                <span>Terdeteksi {conflicts.length} hari tumpang tindih alokasi</span>
              </span>
            ) : (
              <span className="text-emerald-600 font-bold inline-flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Semua alokasi lini teratur tanpa tumpang tindih</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* CALENDAR MATRIX VIEW */}
      {viewLayout === 'calendar' ? (
        <div className="overflow-x-auto">
          <div className="min-w-[1100px]">
            
            {/* Table Header: Days of the Month */}
            <div 
              className="grid bg-slate-100 border-b border-slate-300 text-center sticky top-0 z-10"
              style={{ gridTemplateColumns: `140px repeat(${daysInMonth}, minmax(32px, 1fr))` }}
            >
              
              {/* Sticky Corner Header */}
              <div className="p-2.5 font-bold text-xs text-[#1a3478] bg-slate-200 border-r border-slate-300 flex items-center justify-center sticky left-0 z-20">
                Kategori Line
              </div>

              {/* Day Columns */}
              {dayNumbers.map((day) => {
                const dayName = getDayName(day);
                const isSun = isSunday(day);
                const isSat = isSaturday(day);
                return (
                  <div
                    key={day}
                    className={`py-1.5 px-0.5 border-r border-slate-200 text-[10px] font-bold ${
                      isSun 
                        ? 'bg-red-50/90 text-red-700' 
                        : isSat 
                          ? 'bg-amber-50/90 text-amber-800' 
                          : 'text-slate-700'
                    }`}
                  >
                    <div className="text-[8.5px] uppercase tracking-tighter">
                      {dayName}
                    </div>
                    <div className="text-xs font-black">{day}</div>
                    {isSun && (
                      <span className="inline-block text-[7.5px] font-extrabold text-red-600 bg-red-100 px-1 rounded-xs">
                        LIBUR
                      </span>
                    )}
                    {isSat && (
                      <span className="inline-block text-[7.5px] font-extrabold text-amber-700 bg-amber-100 px-1 rounded-xs">
                        1/2 HARI
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Line Rows */}
            <div className="divide-y divide-slate-200">
              {displayedLineIds.map((lineId) => {
                const lineName = `Line ${lineId}`;
                const lineSchedules = schedules.filter(s => s.lineId === lineId);
                const hasLineConflict = conflicts.some(c => c.lineId === lineId);

                // Filter check
                if (filterMode === 'overlaps_only' && !hasLineConflict) {
                  return null;
                }
                if (filterMode === 'ot_only' && !lineSchedules.some(s => s.needsOT)) {
                  return null;
                }

                return (
                  <div 
                    key={lineId}
                    className="grid hover:bg-blue-50/20 transition-colors group"
                    style={{ gridTemplateColumns: `140px repeat(${daysInMonth}, minmax(32px, 1fr))` }}
                  >
                    {/* Sticky Line Header */}
                    <div className="p-3 bg-white border-r border-slate-300 flex flex-col justify-center sticky left-0 z-10 shadow-2xs group-hover:bg-slate-50">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs text-slate-900">{lineName}</span>
                        {hasLineConflict && (
                          <span 
                            className="w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center text-[9px] font-black animate-pulse"
                            title="Terdapat tumpang tindih pada Line ini!"
                          >
                            ⚡
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {lineSchedules.length} style terdaftar
                      </span>
                    </div>

                    {/* Day Cells for this Line */}
                    {dayNumbers.map((day) => {
                      const dateStr = formatDate(day);
                      const isSun = isSunday(day);
                      const isSat = isSaturday(day);
                      const { regularStyles, otStyles, dayConflicts, isOverlap } = getLineDayContent(lineId, dateStr);

                      const hasRegular = regularStyles.length > 0;
                      const hasOt = otStyles.length > 0;

                      return (
                        <div
                          key={day}
                          onClick={() => {
                            if (hasRegular || hasOt || isOverlap || isSun || isSat) {
                              setActiveCellDetail({
                                dateStr,
                                lineId,
                                lineName,
                                regularStyles,
                                otStyles,
                                conflicts: dayConflicts
                              });
                            }
                          }}
                          className={`min-h-[58px] p-0.5 border-r border-slate-200 relative flex flex-col justify-center gap-0.5 cursor-pointer transition-all ${
                            isSun 
                              ? 'bg-slate-100/90 hover:bg-red-50/50' 
                              : isSat 
                                ? 'bg-amber-50/30 hover:bg-amber-100/40' 
                                : 'hover:bg-blue-100/30'
                          } ${isOverlap ? 'bg-red-50/80 ring-1 ring-inset ring-red-400' : ''}`}
                        >
                          {/* OVERLAP DISPLAY: FLASHING COMBINED BAR */}
                          {isOverlap ? (
                            <div className="w-full bg-linear-to-r from-red-600 to-amber-600 text-white rounded-xs p-1 text-[9px] font-extrabold leading-tight shadow-2xs flex flex-col justify-center text-center animate-pulse">
                              <span className="text-[8px] uppercase tracking-wider text-amber-200 flex items-center justify-center space-x-0.5">
                                <Zap className="w-2.5 h-2.5 text-yellow-300" />
                                <span>OVERLAP</span>
                              </span>
                              <span className="truncate text-white font-black">
                                {regularStyles[0]?.styleName.split(' ')[0] || 'Baru'}
                              </span>
                              <span className="text-[7.5px] text-amber-100 truncate">
                                + OT {otStyles[0]?.styleName.split(' ')[0]}
                              </span>
                            </div>
                          ) : (
                            <>
                              {/* Regular Shift Style */}
                              {hasRegular && (
                                <div 
                                  className="w-full bg-blue-600 text-white rounded-xs px-1 py-0.5 text-[8.5px] font-bold truncate leading-tight shadow-2xs"
                                  title={`${regularStyles[0].styleName} (${regularStyles[0].buyer}) - Shift Reguler`}
                                >
                                  {regularStyles[0].styleName.split('/')[0]}
                                </div>
                              )}

                              {/* Overtime (OT) Continuation Style */}
                              {hasOt && (
                                <div 
                                  className="w-full bg-amber-500 text-white rounded-xs px-1 py-0.5 text-[8px] font-black truncate leading-tight shadow-2xs flex items-center space-x-0.5"
                                  title={`LEMBUR (OT): ${otStyles[0].styleName} - Sisa: ${otStyles[0].remainingQty} pcs`}
                                >
                                  <Clock className="w-2 h-2 text-white shrink-0" />
                                  <span className="truncate">OT: {otStyles[0].remainingQty}p</span>
                                </div>
                              )}

                              {/* Empty day label for Sunday / Saturday */}
                              {!hasRegular && !hasOt && isSun && (
                                <span className="text-[7.5px] font-bold text-slate-400 text-center select-none">
                                  LIBUR
                                </span>
                              )}
                              {!hasRegular && !hasOt && isSat && (
                                <span className="text-[7.5px] font-bold text-amber-600/70 text-center select-none">
                                  1/2 HARI
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      );
                    })}

                  </div>
                );
              })}
            </div>

          </div>
        </div>
      ) : (
        /* AGENDA / LIST VIEW (PERFECT FOR MOBILE) */
        <div className="p-4 sm:p-6 space-y-4">
          <div className="text-xs font-bold text-slate-500 mb-2">
            Tampilan Agenda Kategori Line & Ringkasan Alokasi Lembur:
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayedLineIds.map((lineId) => {
              const lineName = `Line ${lineId}`;
              const lineSchedules = schedules.filter(s => s.lineId === lineId);
              const lineConflicts = conflicts.filter(c => c.lineId === lineId);

              return (
                <div 
                  key={lineId}
                  className={`p-4 rounded-xl border transition-all ${
                    lineConflicts.length > 0 
                      ? 'bg-red-50/40 border-red-300' 
                      : 'bg-white border-slate-200 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-1 rounded-lg bg-[#1a3478] text-white font-extrabold text-xs">
                        {lineName}
                      </span>
                      {lineConflicts.length > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-red-600 text-white font-black text-[10px] animate-pulse flex items-center space-x-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>{lineConflicts.length} Hari Overlap</span>
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => onAddNewSchedule && onAddNewSchedule(lineId)}
                      className="text-xs text-blue-700 hover:text-blue-800 font-bold hover:underline"
                    >
                      + Tambah Style
                    </button>
                  </div>

                  {/* Schedules in this line */}
                  <div className="space-y-2.5">
                    {lineSchedules.map((sch) => (
                      <div 
                        key={sch.id}
                        className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-slate-900">{sch.styleName}</span>
                          <span className="text-[11px] font-semibold text-slate-500">{sch.buyer}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                          <div>
                            Target: <span className="font-bold text-slate-800">{sch.orderQty.toLocaleString()} pcs</span>
                          </div>
                          <div>
                            Aktual: <span className="font-bold text-slate-800">{sch.actualQty.toLocaleString()} pcs</span>
                          </div>
                          <div>
                            Jadwal: <span className="font-bold text-slate-800">{sch.startDate} s/d {sch.plannedEndDate}</span>
                          </div>
                          <div>
                            Sisa Backlog: <span className={`font-bold ${sch.remainingQty > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                              {sch.remainingQty.toLocaleString()} pcs
                            </span>
                          </div>
                        </div>

                        {sch.needsOT && (
                          <div className="p-2 bg-amber-50 border border-amber-200 rounded-md text-[11px] text-amber-900 flex items-center justify-between">
                            <span className="flex items-center space-x-1">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>Lembur {sch.otHoursNeeded} jam ({sch.otDaysNeeded} hari)</span>
                            </span>
                            <span className="font-bold">Selesai OT: {sch.otEndDate}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL / DRAWER DETAIL HARI TUMPANG TINDIH & LEMBUR */}
      {activeCellDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-5 sm:p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 bg-[#1a3478] text-white text-xs font-black rounded-md">
                    {activeCellDetail.lineName}
                  </span>
                  <h4 className="text-sm font-extrabold text-slate-900">
                    Detail Alokasi: {activeCellDetail.dateStr}
                  </h4>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Status operasional sewing harian dan pembagian shift/lembur
                </p>
              </div>

              <button
                onClick={() => setActiveCellDetail(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            {/* Sunday / Saturday Status Banner */}
            {new Date(activeCellDetail.dateStr).getDay() === 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 font-bold flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse shrink-0"></span>
                <span>HARI MINGGU: Libur Operasional Pabrik (0 Jam Kerja Reguler)</span>
              </div>
            )}
            {new Date(activeCellDetail.dateStr).getDay() === 6 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 font-bold flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0"></span>
                <span>HARI SABTU: Masuk Setengah Hari (08:00 - 12:00 / 4 Jam Kerja Reguler)</span>
              </div>
            )}

            {/* Overlap Alert Header if detected */}
            {activeCellDetail.conflicts.length > 0 && (
              <div className="p-3.5 bg-red-50 border border-red-300 rounded-xl space-y-1.5 text-xs text-red-900">
                <div className="flex items-center space-x-1.5 font-black text-red-800">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>PERINGATAN: TUMPANG TINDIH LINE PRODUKSI (OVERLAP)</span>
                </div>
                <p className="text-[11px] text-red-700 leading-relaxed">
                  {activeCellDetail.conflicts[0].recommendation}
                </p>
              </div>
            )}

            {/* Regular Styles Active */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-blue-800 uppercase tracking-wider flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                <span>Shift Reguler (08:00 - 17:00):</span>
              </span>
              {activeCellDetail.regularStyles.length > 0 ? (
                activeCellDetail.regularStyles.map(s => (
                  <div key={s.id} className="p-3 bg-blue-50/60 border border-blue-200 rounded-lg text-xs space-y-1">
                    <div className="flex justify-between font-bold text-blue-900">
                      <span>{s.styleName}</span>
                      <span>Target: {s.dailyTargetQty} pcs/hr</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-blue-700">
                      <span>Buyer: {s.buyer}</span>
                      <span>SMV: {s.smv} min | MP: {s.manpower} op</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic">Tidak ada jadwal shift reguler hari ini.</p>
              )}
            </div>

            {/* OT Styles Active */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span>Shift Lembur / Overtime (17:00 - 19:30):</span>
              </span>
              {activeCellDetail.otStyles.length > 0 ? (
                activeCellDetail.otStyles.map(s => (
                  <div key={s.id} className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs space-y-1">
                    <div className="flex justify-between font-bold text-amber-900">
                      <span>{s.styleName}</span>
                      <span className="text-red-700 font-extrabold">Sisa Backlog: {s.remainingQty} pcs</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-amber-700">
                      <span>Kebutuhan OT: {s.otHoursNeeded} jam</span>
                      <span>Selesai OT: {s.otEndDate}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic">Tidak ada jam lembur yang dijadwalkan hari ini.</p>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setActiveCellDetail(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-colors"
              >
                Tutup Detail
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
