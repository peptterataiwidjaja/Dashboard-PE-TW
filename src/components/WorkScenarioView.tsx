import React, { useState } from 'react';
import { 
  SlidersHorizontal, 
  Calendar, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle2, 
  Zap, 
  Layers, 
  Info, 
  Sparkles, 
  ChevronRight, 
  ShieldCheck, 
  Printer, 
  ArrowRight,
  Calculator
} from 'lucide-react';
import { StyleScheduleRecord } from '../types';
import { simulateFiveDayVsSixDayScenario, WorkScenarioComparison } from '../utils/scheduleCalculations';

interface WorkScenarioViewProps {
  schedules: StyleScheduleRecord[];
  onSelectSchedule?: (schedule: StyleScheduleRecord) => void;
  onOpenPdfReport?: () => void;
}

export const WorkScenarioView: React.FC<WorkScenarioViewProps> = ({
  schedules,
  onSelectSchedule,
  onOpenPdfReport
}) => {
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>(
    schedules[0]?.id || ''
  );
  const [customOtHours, setCustomOtHours] = useState<number>(1.0);
  const [simFilterLine, setSimFilterLine] = useState<number | 'all'>('all');

  // Filter schedules
  const displayedSchedules = schedules.filter(s => 
    simFilterLine === 'all' || s.lineId === simFilterLine
  );

  // Generate comparison data for all displayed schedules
  const comparisons: WorkScenarioComparison[] = displayedSchedules.map(s => 
    simulateFiveDayVsSixDayScenario(s)
  );

  // Active comparison for detailed inspection
  const activeComparison = comparisons.find(c => c.scheduleId === selectedScheduleId) || comparisons[0];

  // Aggregated factory impact if all lines move to 5 days
  const totalOrdersPcs = displayedSchedules.reduce((acc, s) => acc + s.orderQty, 0);
  const totalLinesCount = displayedSchedules.length;
  const avgDelayDays = comparisons.length > 0 
    ? (comparisons.reduce((acc, c) => acc + c.fiveDayWithoutOT.delayCalendarDays, 0) / comparisons.length).toFixed(1)
    : '0';

  const totalWeeklyLostHours = totalLinesCount * 5; // 5 hours lost each Saturday per line
  const totalWeeklyCompensateOTHours = totalLinesCount * 5; // 5 OT hours per week per line

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-700 text-white flex items-center justify-center shrink-0">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-black text-[#1a3478] tracking-tight">
                Bar Skenario Jadwal Style Sewing & Analisis 5 Hari Kerja vs 6 Hari
              </h2>
              <p className="text-xs text-slate-500">
                Simulasi jam kerja mingguan, dampak libur Sabtu penuh terhadap keterlambatan PO, dan mitigasi jam lembur kompensasi (OT).
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Line Filter */}
          <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs">
            <span className="font-semibold text-slate-600">Filter Line:</span>
            <select
              value={simFilterLine}
              onChange={(e) => setSimFilterLine(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="bg-transparent font-bold text-slate-900 focus:outline-hidden cursor-pointer"
            >
              <option value="all">Semua Line ({schedules.length})</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                <option key={n} value={n}>Line {n}</option>
              ))}
            </select>
          </div>

          {onOpenPdfReport && (
            <button
              onClick={onOpenPdfReport}
              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Analisis PDF</span>
            </button>
          )}
        </div>
      </div>

      {/* 3 SCENARIOS COMPARISON BAR CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* SKENARIO 1: STANDAR (6 HARI KERJA) */}
        <div className="bg-white rounded-2xl border-2 border-slate-300 p-4 shadow-xs relative overflow-hidden space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase text-slate-700 tracking-wider bg-slate-100 px-2.5 py-0.5 rounded-full">
              Skenario 1 (Standar Aktif)
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-blue-700"></span>
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900">6 Hari Kerja Reguler</h3>
            <p className="text-xs text-slate-500">Senin–Jumat 8 Jam, Sabtu 5 Jam (1/2 Hari)</p>
          </div>

          <div className="space-y-1.5 pt-1 text-xs">
            <div className="flex items-center justify-between p-2 bg-slate-50 rounded-xl">
              <span className="text-slate-600">Jam Kerja Mingguan:</span>
              <strong className="font-mono text-blue-900 font-black">45.0 Jam/Minggu</strong>
            </div>
            <div className="flex items-center justify-between p-2 bg-slate-50 rounded-xl">
              <span className="text-slate-600">Alokasi Sabtu:</span>
              <strong className="font-mono text-slate-800 font-bold">Masuk 5 Jam</strong>
            </div>
            <div className="flex items-center justify-between p-2 bg-slate-50 rounded-xl">
              <span className="text-slate-600">Status Keterlambatan:</span>
              <strong className="text-emerald-700 font-bold">0 Hari (Baseline)</strong>
            </div>
          </div>
        </div>

        {/* SKENARIO 2: 5 HARI KERJA TANPA LEMBUR */}
        <div className="bg-white rounded-2xl border-2 border-amber-300 p-4 shadow-xs relative overflow-hidden space-y-3 bg-linear-to-b from-amber-50/40 to-white">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase text-amber-900 tracking-wider bg-amber-100 px-2.5 py-0.5 rounded-full">
              Skenario 2 (Risiko Delay)
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
          </div>
          <div>
            <h3 className="text-base font-black text-amber-950">5 Hari Kerja (Tanpa Lembur)</h3>
            <p className="text-xs text-slate-500">Sabtu Libur Penuh • Hanya Senin–Jumat 8 Jam</p>
          </div>

          <div className="space-y-1.5 pt-1 text-xs">
            <div className="flex items-center justify-between p-2 bg-amber-50 rounded-xl">
              <span className="text-slate-600">Jam Kerja Mingguan:</span>
              <strong className="font-mono text-amber-900 font-black">40.0 Jam (-5 Jam/Mgg)</strong>
            </div>
            <div className="flex items-center justify-between p-2 bg-amber-50 rounded-xl">
              <span className="text-slate-600">Output Hilang Tiap Sabtu:</span>
              <strong className="font-mono text-red-600 font-bold">~62.5% Target Harian</strong>
            </div>
            <div className="flex items-center justify-between p-2 bg-amber-50 rounded-xl">
              <span className="text-slate-600">Rata-rata Delay Delivery:</span>
              <strong className="text-red-600 font-black">+{avgDelayDays} Hari Kalender</strong>
            </div>
          </div>
        </div>

        {/* SKENARIO 3: 5 HARI KERJA DENGAN LEMBUR KOMPENSASI */}
        <div className="bg-white rounded-2xl border-2 border-blue-600 p-4 shadow-xs relative overflow-hidden space-y-3 bg-linear-to-b from-blue-50/50 to-white">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase text-blue-900 tracking-wider bg-blue-100 px-2.5 py-0.5 rounded-full">
              Skenario 3 (Rekomendasi IE)
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          </div>
          <div>
            <h3 className="text-base font-black text-blue-950">5 Hari Kerja + 1 Jam OT/Hari</h3>
            <p className="text-xs text-slate-500">Sabtu Libur Penuh • Senin–Jumat 8 Jam + 1 Jam Lembur</p>
          </div>

          <div className="space-y-1.5 pt-1 text-xs">
            <div className="flex items-center justify-between p-2 bg-blue-50 rounded-xl">
              <span className="text-slate-600">Total Jam Mingguan:</span>
              <strong className="font-mono text-blue-950 font-black">45.0 Jam (Sama Standar)</strong>
            </div>
            <div className="flex items-center justify-between p-2 bg-blue-50 rounded-xl">
              <span className="text-slate-600">Kompensasi Jam Lembur:</span>
              <strong className="font-mono text-blue-700 font-bold">+5 Jam OT / Minggu</strong>
            </div>
            <div className="flex items-center justify-between p-2 bg-blue-50 rounded-xl">
              <span className="text-slate-600">Ketepatan Selesai (Delivery):</span>
              <strong className="text-emerald-700 font-black">✓ 100% On-Time (Sesuai Jadwal)</strong>
            </div>
          </div>
        </div>

      </div>

      {/* DETAIL SIMULASI PER STYLE YANG SEDANG DIPILIH */}
      {activeComparison && (
        <div className="bg-linear-to-br from-slate-900 to-blue-950 text-white p-5 sm:p-6 rounded-2xl shadow-md space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-xs font-black">
                  {activeComparison.lineName}
                </span>
                <h3 className="text-base sm:text-lg font-black tracking-tight">
                  Simulasi Detail Model: {activeComparison.styleName} ({activeComparison.buyer})
                </h3>
              </div>
              <p className="text-xs text-blue-200 mt-1">
                Order: {activeComparison.orderQty.toLocaleString('id-ID')} pcs • SMV: {activeComparison.smv} menit • Manpower: {activeComparison.manpower} operator • Mulai: {activeComparison.startDate}
              </p>
            </div>

            {/* Schedule Selector */}
            <div className="flex items-center space-x-2">
              <span className="text-xs text-blue-200 font-medium">Ganti Style:</span>
              <select
                value={selectedScheduleId}
                onChange={(e) => setSelectedScheduleId(e.target.value)}
                className="bg-white/10 border border-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-xl focus:outline-hidden cursor-pointer"
              >
                {displayedSchedules.map(s => (
                  <option key={s.id} value={s.id} className="text-slate-900">
                    {s.lineName} • {s.styleName} ({s.orderQty.toLocaleString('id-ID')} pcs)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 3-Column Comparative Metrics for this specific style */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            
            <div className="bg-white/10 backdrop-blur-xs p-4 rounded-xl border border-white/15 space-y-2">
              <span className="text-blue-300 font-black uppercase tracking-wider block text-[10px]">
                Jadwal 6 Hari Kerja (Standar)
              </span>
              <div className="text-xl font-black font-mono text-white">
                {activeComparison.sixDay.plannedEndDate}
              </div>
              <div className="text-blue-200 space-y-1 pt-1">
                <p>• Total Hari Kalender: <strong>{activeComparison.sixDay.totalCalendarDays} hari</strong></p>
                <p>• Hari Kerja Efektif: <strong>{activeComparison.sixDay.totalWorkingDays} hari</strong></p>
                <p>• Target Sen-Jum: <strong>{activeComparison.sixDay.dailyTargetMonFri} pcs/hr</strong></p>
                <p>• Target Sabtu (5 jam): <strong>{activeComparison.sixDay.dailyTargetSat} pcs</strong></p>
              </div>
            </div>

            <div className="bg-amber-950/40 backdrop-blur-xs p-4 rounded-xl border border-amber-500/30 space-y-2">
              <span className="text-amber-300 font-black uppercase tracking-wider block text-[10px]">
                Jika 5 Hari Kerja (Tanpa OT)
              </span>
              <div className="text-xl font-black font-mono text-amber-200 flex items-center justify-between">
                <span>{activeComparison.fiveDayWithoutOT.plannedEndDate}</span>
                <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full font-sans">
                  +{activeComparison.fiveDayWithoutOT.delayCalendarDays} Hari Delay
                </span>
              </div>
              <div className="text-amber-100 space-y-1 pt-1">
                <p>• Total Hari Kalender: <strong>{activeComparison.fiveDayWithoutOT.totalCalendarDays} hari</strong></p>
                <p>• Hari Kerja Efektif: <strong>{activeComparison.fiveDayWithoutOT.totalWorkingDays} hari</strong></p>
                <p>• Defisit Jam per Minggu: <strong>-5.0 Jam</strong></p>
                <p className="text-red-300 font-bold">⚠️ Berisiko penalti buyer akibat pengiriman terlambat</p>
              </div>
            </div>

            <div className="bg-emerald-950/40 backdrop-blur-xs p-4 rounded-xl border border-emerald-500/30 space-y-2">
              <span className="text-emerald-300 font-black uppercase tracking-wider block text-[10px]">
                Mitigasi: 5 Hari + 1 Jam OT/Hari
              </span>
              <div className="text-xl font-black font-mono text-emerald-200 flex items-center justify-between">
                <span>{activeComparison.fiveDayWithCompensationOT.plannedEndDate}</span>
                <span className="text-xs bg-emerald-600 text-white px-2 py-0.5 rounded-full font-sans">
                  On-Time (Tepat)
                </span>
              </div>
              <div className="text-emerald-100 space-y-1 pt-1">
                <p>• Jam Lembur Harian: <strong>1.0 Jam/Hari (17:00–18:00)</strong></p>
                <p>• Lembur Mingguan: <strong>5.0 Jam OT</strong></p>
                <p>• Total Jam OT Diperlukan: <strong>{activeComparison.fiveDayWithCompensationOT.totalOTHoursForOrder} Jam OT</strong></p>
                <p className="text-emerald-300 font-bold">✓ Karyawan tetap libur Sabtu, delivery buyer aman!</p>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* COMPARATIVE MATRIX TABLE FOR ALL ACTIVE STYLES */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-blue-700" />
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
              Matriks Komparasi Jadwal Seluruh Style (6 Hari vs 5 Hari Kerja)
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-semibold">
            {comparisons.length} Jadwal Dianalisis
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px] uppercase">
                <th className="p-3 text-center">Line</th>
                <th className="p-3">Model / Style</th>
                <th className="p-3 text-right">Order (Pcs)</th>
                <th className="p-3 text-center">Mulai</th>
                <th className="p-3 text-center bg-blue-50/70 text-blue-900 border-x border-blue-200">
                  6 Hari Kerja (Standar)
                </th>
                <th className="p-3 text-center bg-amber-50/70 text-amber-900 border-r border-amber-200">
                  5 Hari (Tanpa OT)
                </th>
                <th className="p-3 text-center bg-emerald-50/70 text-emerald-900">
                  5 Hari + OT Kompensasi
                </th>
                <th className="p-3 text-center">Rekomendasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {comparisons.map((c) => {
                const isSelected = c.scheduleId === selectedScheduleId;

                return (
                  <tr 
                    key={c.scheduleId}
                    onClick={() => setSelectedScheduleId(c.scheduleId)}
                    className={`hover:bg-blue-50/30 transition-colors cursor-pointer ${
                      isSelected ? 'bg-blue-50/50 font-medium' : ''
                    }`}
                  >
                    <td className="p-3 text-center font-bold text-slate-900">
                      {c.lineName}
                    </td>
                    <td className="p-3 font-extrabold text-blue-950">
                      <div>{c.styleName}</div>
                      <span className="text-[10px] text-slate-500 font-normal">
                        Buyer: {c.buyer} • SMV: {c.smv} min
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-slate-800">
                      {c.orderQty.toLocaleString('id-ID')}
                    </td>
                    <td className="p-3 text-center font-mono text-slate-600">
                      {c.startDate}
                    </td>

                    {/* 6 Hari Selesai */}
                    <td className="p-3 text-center bg-blue-50/30 font-mono font-bold text-blue-900 border-x border-blue-100">
                      <div>{c.sixDay.plannedEndDate}</div>
                      <span className="text-[10px] text-slate-500 font-normal">
                        {c.sixDay.totalCalendarDays} hari
                      </span>
                    </td>

                    {/* 5 Hari Tanpa OT */}
                    <td className="p-3 text-center bg-amber-50/30 border-r border-amber-100">
                      <div className="font-mono font-bold text-amber-950">
                        {c.fiveDayWithoutOT.plannedEndDate}
                      </div>
                      <span className="inline-block text-[10px] px-1.5 py-0.2 rounded-full bg-red-100 text-red-700 font-bold">
                        +{c.fiveDayWithoutOT.delayCalendarDays} hari delay
                      </span>
                    </td>

                    {/* 5 Hari + OT */}
                    <td className="p-3 text-center bg-emerald-50/30">
                      <div className="font-mono font-bold text-emerald-900">
                        {c.fiveDayWithCompensationOT.plannedEndDate}
                      </div>
                      <span className="inline-block text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                        +5 Jam OT/mgg
                      </span>
                    </td>

                    {/* Rekomendasi */}
                    <td className="p-3 text-center">
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-black text-[10px]">
                        <CheckCircle2 className="w-3 h-3 text-blue-600" />
                        <span>Mitigasi OT</span>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
