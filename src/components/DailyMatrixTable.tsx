import React, { useState, useMemo } from 'react';
import { LineData } from '../types';
import { DATE_LABELS } from '../data/defaultData';
import { formatNumber, formatPercent, getAchievementColor, formatMonthYearIndonesian, generateDateLabelsForMonth } from '../utils/formatters';
import { Table, Filter, Search, Info } from 'lucide-react';

interface DailyMatrixTableProps {
  lines: LineData[];
  selectedMonth?: string;
}

export const DailyMatrixTable: React.FC<DailyMatrixTableProps> = ({ lines, selectedMonth }) => {
  const [filterLineId, setFilterLineId] = useState<number | 'all'>('all');
  const [metricFilter, setMetricFilter] = useState<'all' | 'tgt' | 'act' | 'ach'>('all');

  const dateLabels = useMemo(() => {
    if (lines.length > 0 && lines[0].daily && lines[0].daily.length > 0) {
      return lines[0].daily.map(d => d.dateLabel);
    }
    if (selectedMonth) {
      return generateDateLabelsForMonth(selectedMonth);
    }
    return DATE_LABELS;
  }, [lines, selectedMonth]);

  const filteredLines = filterLineId === 'all' 
    ? lines 
    : lines.filter(l => l.lineId === filterLineId);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header controls */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Table className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">
              Matriks Akurasi SMV & Pencapaian Harian
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Data operasional SMV Target, Aktual, dan Rasio Efisiensi sewing line
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Line Filter */}
          <div className="flex items-center space-x-1.5">
            <span className="text-xs text-slate-500 font-medium">Line:</span>
            <select
              id="filter-table-line"
              value={filterLineId}
              onChange={(e) => setFilterLineId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            >
              <option value="all">Semua Line ({lines.length})</option>
              {lines.map(l => (
                <option key={l.lineId} value={l.lineId}>Line {l.lineId}</option>
              ))}
            </select>
          </div>

          {/* Metric Filter */}
          <div className="flex items-center space-x-1.5">
            <span className="text-xs text-slate-500 font-medium">Metrik:</span>
            <select
              id="filter-table-metric"
              value={metricFilter}
              onChange={(e) => setMetricFilter(e.target.value as any)}
              className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            >
              <option value="all">Semua Baris (TGT, ACT, ACH)</option>
              <option value="ach">Hanya Pencapaian (%)</option>
              <option value="act">Hanya SMV ACT</option>
              <option value="tgt">Hanya SMV TGT</option>
            </select>
          </div>
        </div>
      </div>

      {/* Legend & Guide */}
      <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
        <div className="flex items-center space-x-3">
          <span className="font-semibold text-slate-700">Indikator Pencapaian:</span>
          <span className="inline-flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded bg-emerald-100 border border-emerald-300"></span>
            <span>Optimal (≥80%)</span>
          </span>
          <span className="inline-flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded bg-blue-50 border border-blue-200"></span>
            <span>Standar (70-79%)</span>
          </span>
          <span className="inline-flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded bg-amber-50 border border-amber-200"></span>
            <span>Kurang (&lt;70%)</span>
          </span>
        </div>
        <div className="text-[11px] text-slate-400">
          Geser horizontal untuk melihat seluruh tanggal
        </div>
      </div>

      {/* Horizontal Scrollable Table with Sticky Line Column */}
      <div className="overflow-x-auto w-full">
        <table className="min-w-full text-xs text-left border-collapse">
          <thead>
            <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-700 font-semibold">
              <th className="sticky left-0 z-20 bg-slate-100 px-3.5 py-3 border-r border-slate-200 min-w-[70px]">
                Line
              </th>
              <th className="sticky left-[70px] z-20 bg-slate-100 px-3 py-3 border-r border-slate-200 min-w-[90px]">
                Pencapaian
              </th>
              <th className="sticky left-[160px] z-20 bg-slate-100 px-3 py-3 border-r border-slate-200 min-w-[85px]">
                Metrik
              </th>
              {dateLabels.map((label, idx) => (
                <th key={idx} className="px-3 py-3 text-center border-r border-slate-200 min-w-[75px] whitespace-nowrap">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredLines.length === 0 && (
              <tr>
                <td colSpan={dateLabels.length + 3} className="py-16 text-center text-slate-400 text-sm">
                  <div className="flex flex-col items-center justify-center space-y-2 max-w-md mx-auto px-4">
                    <Table className="w-8 h-8 text-slate-300" />
                    <p className="font-semibold text-slate-700">
                      Belum ada data matriks SMV untuk periode {selectedMonth ? formatMonthYearIndonesian(selectedMonth) : 'ini'}
                    </p>
                    <p className="text-xs text-slate-400">
                      Data matriks harian akan otomatis terisi saat Anda menambahkan rekap produksi harian di tab "Rekap Harian & Analisis" atau menghubungkan Google Sheet.
                    </p>
                  </div>
                </td>
              </tr>
            )}
            {filteredLines.map((line) => {
              const showTgt = metricFilter === 'all' || metricFilter === 'tgt';
              const showAct = metricFilter === 'all' || metricFilter === 'act';
              const showAch = metricFilter === 'all' || metricFilter === 'ach';

              const activeRowCount = (showTgt ? 1 : 0) + (showAct ? 1 : 0) + (showAch ? 1 : 0);
              if (activeRowCount === 0) return null;

              return (
                <React.Fragment key={line.lineId}>
                  {/* Row 1: SMV TGT */}
                  {showTgt && (
                    <tr className="hover:bg-blue-50/30 transition-colors">
                      <td 
                        rowSpan={activeRowCount} 
                        className="sticky left-0 z-10 bg-white font-bold text-slate-900 px-3.5 py-2.5 border-r border-b border-slate-200 text-center"
                      >
                        <div className="flex flex-col items-center">
                          <span className="text-sm font-extrabold text-blue-600">{line.lineId}</span>
                          <span className="text-[10px] text-slate-400">Line</span>
                        </div>
                      </td>
                      <td 
                        rowSpan={activeRowCount} 
                        className="sticky left-[70px] z-10 bg-white font-bold px-3 py-2.5 border-r border-b border-slate-200 text-center"
                      >
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                          line.overallAchievement >= 80 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : line.overallAchievement >= 70 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-amber-100 text-amber-800'
                        }`}>
                          {formatPercent(line.overallAchievement)}
                        </span>
                      </td>
                      <td className="sticky left-[160px] z-10 bg-white font-semibold text-slate-600 px-3 py-2 border-r border-slate-200 whitespace-nowrap">
                        SMV TGT
                      </td>
                      {line.daily.map((day, dIdx) => (
                        <td key={dIdx} className="px-3 py-2 text-center text-slate-600 border-r border-slate-100 font-mono">
                          {formatNumber(day.smvTarget)}
                        </td>
                      ))}
                    </tr>
                  )}

                  {/* Row 2: SMV ACT */}
                  {showAct && (
                    <tr className="hover:bg-blue-50/30 transition-colors">
                      {!showTgt && (
                        <>
                          <td 
                            rowSpan={activeRowCount} 
                            className="sticky left-0 z-10 bg-white font-bold text-slate-900 px-3.5 py-2.5 border-r border-b border-slate-200 text-center"
                          >
                            <span className="text-sm font-extrabold text-blue-600">{line.lineId}</span>
                          </td>
                          <td 
                            rowSpan={activeRowCount} 
                            className="sticky left-[70px] z-10 bg-white font-bold px-3 py-2.5 border-r border-b border-slate-200 text-center"
                          >
                            <span className="text-xs font-bold text-blue-700">{formatPercent(line.overallAchievement)}</span>
                          </td>
                        </>
                      )}
                      <td className="sticky left-[160px] z-10 bg-white font-semibold text-slate-600 px-3 py-2 border-r border-slate-200 whitespace-nowrap">
                        SMV ACT
                      </td>
                      {line.daily.map((day, dIdx) => (
                        <td key={dIdx} className="px-3 py-2 text-center text-slate-800 font-medium border-r border-slate-100 font-mono">
                          {formatNumber(day.smvActual)}
                        </td>
                      ))}
                    </tr>
                  )}

                  {/* Row 3: PENCAPAIAN */}
                  {showAch && (
                    <tr className="border-b-2 border-slate-200 bg-slate-50/40 hover:bg-blue-50/40 transition-colors">
                      {!showTgt && !showAct && (
                        <>
                          <td 
                            rowSpan={activeRowCount} 
                            className="sticky left-0 z-10 bg-white font-bold text-slate-900 px-3.5 py-2.5 border-r border-b border-slate-200 text-center"
                          >
                            <span className="text-sm font-extrabold text-blue-600">{line.lineId}</span>
                          </td>
                          <td 
                            rowSpan={activeRowCount} 
                            className="sticky left-[70px] z-10 bg-white font-bold px-3 py-2.5 border-r border-b border-slate-200 text-center"
                          >
                            <span className="text-xs font-bold text-blue-700">{formatPercent(line.overallAchievement)}</span>
                          </td>
                        </>
                      )}
                      <td className="sticky left-[160px] z-10 bg-slate-50 font-bold text-blue-900 px-3 py-2 border-r border-slate-200 whitespace-nowrap">
                        PENCAPAIAN
                      </td>
                      {line.daily.map((day, dIdx) => {
                        const ach = day.pencapaian;
                        let colorClass = 'text-slate-400';
                        let bgClass = '';
                        if (ach !== null) {
                          if (ach >= 80) {
                            colorClass = 'text-emerald-700 font-bold';
                            bgClass = 'bg-emerald-50/60';
                          } else if (ach >= 70) {
                            colorClass = 'text-blue-700 font-semibold';
                            bgClass = 'bg-blue-50/50';
                          } else {
                            colorClass = 'text-amber-700 font-semibold';
                            bgClass = 'bg-amber-50/50';
                          }
                        }
                        return (
                          <td key={dIdx} className={`px-3 py-2 text-center border-r border-slate-100 font-mono ${colorClass} ${bgClass}`}>
                            {formatPercent(ach)}
                          </td>
                        );
                      })}
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
