import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Clock, 
  Award, 
  AlertTriangle,
  Layers
} from 'lucide-react';
import { DashboardSummary } from '../types';
import { formatRupiah, formatPercent } from '../utils/formatters';

interface KpiSummaryProps {
  summary: DashboardSummary;
}

export const KpiSummary: React.FC<KpiSummaryProps> = ({ summary }) => {
  const isRevenueOnTarget = summary.netRevenueVariance >= 0;
  const achievementRate = summary.totalTargetRevenue > 0 
    ? (summary.totalActualRevenue / summary.totalTargetRevenue) * 100 
    : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
      
      {/* Card 1: Total Revenue Aktual */}
      <div 
        id="kpi-total-revenue"
        className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-sm hover:border-blue-300 transition-all"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Revenue Aktual
          </span>
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2.5">
          <div className="text-xl sm:text-2xl font-bold text-slate-900">
            {formatRupiah(summary.totalActualRevenue)}
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
            <span>Target: {formatRupiah(summary.totalTargetRevenue)}</span>
            <span className="font-semibold text-blue-600">
              {formatPercent(achievementRate)}
            </span>
          </div>
          {/* Progress bar */}
          <div className="mt-2.5 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-blue-600 h-full rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(100, Math.max(0, achievementRate || 0))}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Card 2: Net Revenue Variance */}
      <div 
        id="kpi-revenue-variance"
        className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-sm hover:border-blue-300 transition-all"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Variansi Revenue
          </span>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            isRevenueOnTarget ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
          }`}>
            {isRevenueOnTarget ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          </div>
        </div>
        <div className="mt-2.5">
          <div className={`text-xl sm:text-2xl font-bold ${
            isRevenueOnTarget ? 'text-emerald-600' : 'text-amber-600'
          }`}>
            {formatRupiah(summary.netRevenueVariance)}
          </div>
          <div className="mt-1 flex items-center space-x-1.5 text-xs text-slate-500">
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded font-semibold text-[11px] ${
              isRevenueOnTarget ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
            }`}>
              {summary.overallVariancePercent > 0 ? '+' : ''}
              {formatPercent(summary.overallVariancePercent)}
            </span>
            <span>vs Target Periode 2</span>
          </div>
          <p className="mt-2 text-xs text-slate-400">
            {isRevenueOnTarget ? 'Melampaui target anggaran' : 'Di bawah target periode berjalan'}
          </p>
        </div>
      </div>

      {/* Card 3: Rata-rata Pencapaian Akurasi SMV */}
      <div 
        id="kpi-avg-smv-achievement"
        className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-sm hover:border-blue-300 transition-all"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Rata-rata Akurasi SMV
          </span>
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Award className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2.5">
          <div className="flex items-baseline space-x-2">
            <div className="text-xl sm:text-2xl font-bold text-slate-900">
              {formatPercent(summary.avgLineAchievement)}
            </div>
            <span className="text-xs font-medium text-slate-500">Standar ≥80%</span>
          </div>
          <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500">
            <span>Rata-rata SMV: <strong className="text-slate-800">{summary.avgSmv} min</strong></span>
            <span className="text-blue-600 font-medium">{summary.activeLinesCount} Line Produksi</span>
          </div>
          <div className="mt-2.5 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-blue-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(100, Math.max(0, summary.avgLineAchievement || 0))}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Card 4: Line Kinerja Terbaik & Terendah */}
      <div 
        id="kpi-best-lowest-line"
        className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-sm hover:border-blue-300 transition-all"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Highlight Line
          </span>
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2.5 space-y-2">
          {summary.activeLinesCount === 0 ? (
            <div className="py-2 text-center text-slate-400">
              <p className="text-xs font-medium text-slate-600">Belum ada line aktif</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Input data rekap harian untuk melihat perbandingan line.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center space-x-1 text-slate-600">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>Terunggul: <strong>Line {summary.bestLine.lineId}</strong></span>
                </span>
                <span className="font-bold text-emerald-600">
                  {formatPercent(summary.bestLine.achievement)}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                <span className="flex items-center space-x-1 text-slate-600">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <span>Evaluasi: <strong>Line {summary.lowestLine.lineId}</strong></span>
                </span>
                <span className="font-bold text-amber-600">
                  {formatPercent(summary.lowestLine.achievement)}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {summary.bestLine.lineId === summary.lowestLine.lineId 
                  ? `Line ${summary.bestLine.lineId} aktif di periode ini.`
                  : `Perlu intervensi perbaikan alur pada Line ${summary.lowestLine.lineId}`}
              </p>
            </>
          )}
        </div>
      </div>

    </div>
  );
};
