import React from 'react';
import { LineData, DashboardSummary } from '../types';
import { formatRupiah, formatPercent, formatMonthYearIndonesian } from '../utils/formatters';
import { DollarSign, ArrowUpRight, ArrowDownRight, Tag } from 'lucide-react';

interface RevenueTableProps {
  lines: LineData[];
  summary: DashboardSummary;
  selectedMonth?: string;
}

export const RevenueTable: React.FC<RevenueTableProps> = ({ lines, summary, selectedMonth }) => {
  const avgCmRate = lines.length > 0
    ? Math.round(lines.reduce((acc, l) => acc + (l.cmRate || 0), 0) / lines.length)
    : 37000;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Table Header Info */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">
              Kinerja Revenue &amp; Tarif CM per Style
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Perhitungan revenue riil mengikuti tarif CM per pcs dari masing-masing style periode {selectedMonth ? formatMonthYearIndonesian(selectedMonth) : 'berjalan'}
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs">
          <span className="px-2.5 py-1 bg-blue-50 text-blue-800 font-semibold rounded-md border border-blue-200" title="Rata-rata tarif CM terhitung dari style aktif">
            Tarif CM Style: Rp {avgCmRate.toLocaleString('id-ID')} (Rata-rata)
          </span>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto w-full">
        <table className="min-w-full text-xs text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
              <th className="px-4 py-3 min-w-[70px]">Line</th>
              <th className="px-4 py-3 min-w-[180px]">Style Garment</th>
              <th className="px-4 py-3 text-right min-w-[90px]">CM (IDR)</th>
              <th className="px-4 py-3 text-right min-w-[140px]">Revenue Aktual</th>
              <th className="px-4 py-3 text-right min-w-[140px]">Target Anggaran</th>
              <th className="px-4 py-3 text-right min-w-[100px]">Selisih (%)</th>
              <th className="px-4 py-3 text-right min-w-[140px]">Variansi (IDR)</th>
              <th className="px-4 py-3 text-center min-w-[100px]">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {lines.length === 0 && (
              <tr>
                <td colSpan={8} className="py-14 text-center text-slate-400 text-sm">
                  <div className="flex flex-col items-center justify-center space-y-2 max-w-md mx-auto px-4">
                    <DollarSign className="w-8 h-8 text-slate-300" />
                    <p className="font-semibold text-slate-700">
                      Belum ada data revenue sewing line untuk periode {selectedMonth ? formatMonthYearIndonesian(selectedMonth) : 'ini'}
                    </p>
                    <p className="text-xs text-slate-400">
                      Realisasi omzet per line akan otomatis dihitung berdasarkan output riil dan tarif CM per pcs style.
                    </p>
                  </div>
                </td>
              </tr>
            )}
            {lines.map((line) => {
              const isSurplus = line.varianceRevenue >= 0;
              return (
                <tr key={line.lineId} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-4 py-3.5 font-bold text-slate-900">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-blue-50 text-blue-700 font-bold">
                      {line.lineId}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="font-semibold text-slate-900 flex items-center space-x-1.5">
                      <Tag className="w-3.5 h-3.5 text-slate-400" />
                      <span>{line.style}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono text-slate-600">
                    {line.cmRate.toLocaleString('id-ID')}
                  </td>
                  <td className="px-4 py-3.5 text-right font-bold font-mono text-slate-900">
                    {formatRupiah(line.actualRevenue)}
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono text-slate-600">
                    {formatRupiah(line.targetRevenue)}
                  </td>
                  <td className={`px-4 py-3.5 text-right font-semibold font-mono ${
                    isSurplus ? 'text-emerald-600' : 'text-amber-600'
                  }`}>
                    {isSurplus ? '+' : ''}{formatPercent(line.variancePercent)}
                  </td>
                  <td className={`px-4 py-3.5 text-right font-bold font-mono ${
                    isSurplus ? 'text-emerald-600' : 'text-amber-600'
                  }`}>
                    {formatRupiah(line.varianceRevenue)}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                      isSurplus 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {isSurplus ? (
                        <>
                          <ArrowUpRight className="w-3 h-3" />
                          <span>Surplus</span>
                        </>
                      ) : (
                        <>
                          <ArrowDownRight className="w-3 h-3" />
                          <span>Defisit</span>
                        </>
                      )}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-slate-100/90 font-bold border-t-2 border-slate-300 text-slate-900">
              <td colSpan={2} className="px-4 py-3.5 text-sm uppercase tracking-wider">
                Total Ringkasan Periode 2
              </td>
              <td className="px-4 py-3.5 text-right text-slate-500 font-mono">
                Rata-rata
              </td>
              <td className="px-4 py-3.5 text-right font-mono text-sm text-blue-700">
                {formatRupiah(summary.totalActualRevenue)}
              </td>
              <td className="px-4 py-3.5 text-right font-mono text-sm text-slate-700">
                {formatRupiah(summary.totalTargetRevenue)}
              </td>
              <td className={`px-4 py-3.5 text-right font-mono text-sm ${
                summary.netRevenueVariance >= 0 ? 'text-emerald-700' : 'text-amber-700'
              }`}>
                {summary.overallVariancePercent > 0 ? '+' : ''}
                {formatPercent(summary.overallVariancePercent)}
              </td>
              <td className={`px-4 py-3.5 text-right font-mono text-sm ${
                summary.netRevenueVariance >= 0 ? 'text-emerald-700' : 'text-amber-700'
              }`}>
                {formatRupiah(summary.netRevenueVariance)}
              </td>
              <td className="px-4 py-3.5 text-center">
                <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-bold ${
                  summary.netRevenueVariance >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {summary.netRevenueVariance >= 0 ? 'Target Tercapai' : 'Perlu Evaluasi'}
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
