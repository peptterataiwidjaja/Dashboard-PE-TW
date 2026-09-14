import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  BarChart,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { LineData } from '../types';
import { DATE_LABELS } from '../data/defaultData';
import { formatRupiah, formatPercent, formatNumber, formatMonthYearIndonesian, generateDateLabelsForMonth } from '../utils/formatters';
import { Filter, BarChart3, TrendingUp, DollarSign, PieChart as PieIcon } from 'lucide-react';

interface ChartsSectionProps {
  lines: LineData[];
  selectedMonth?: string;
}

export const ChartsSection: React.FC<ChartsSectionProps> = ({ lines, selectedMonth }) => {
  const [selectedLineId, setSelectedLineId] = useState<number | 'all'>('all');

  const dateLabels = useMemo(() => {
    if (lines.length > 0 && lines[0].daily && lines[0].daily.length > 0) {
      return lines[0].daily.map(d => d.dateLabel);
    }
    if (selectedMonth) {
      return generateDateLabelsForMonth(selectedMonth);
    }
    return DATE_LABELS;
  }, [lines, selectedMonth]);

  // Compute Daily Trend Data for selected line or average of all lines
  const dailyTrendData = useMemo(() => {
    return dateLabels.map((label, idx) => {
      if (selectedLineId === 'all') {
        // Average across lines that have data for this day
        const validLines = lines.filter(l => l.daily && l.daily[idx] && l.daily[idx].smvTarget !== null);
        if (validLines.length === 0) {
          return {
            dateLabel: label,
            smvTarget: null,
            smvActual: null,
            pencapaian: null
          };
        }
        const avgTgt = validLines.reduce((acc, l) => acc + (l.daily[idx].smvTarget || 0), 0) / validLines.length;
        const avgAct = validLines.reduce((acc, l) => acc + (l.daily[idx].smvActual || 0), 0) / validLines.length;
        const avgAch = validLines.reduce((acc, l) => acc + (l.daily[idx].pencapaian || 0), 0) / validLines.length;

        return {
          dateLabel: label,
          smvTarget: Number(avgTgt.toFixed(2)),
          smvActual: Number(avgAct.toFixed(2)),
          pencapaian: Number(avgAch.toFixed(2))
        };
      } else {
        const line = lines.find(l => l.lineId === selectedLineId);
        const day = line?.daily ? line.daily[idx] : undefined;
        return {
          dateLabel: label,
          smvTarget: day?.smvTarget ?? null,
          smvActual: day?.smvActual ?? null,
          pencapaian: day?.pencapaian ?? null
        };
      }
    });
  }, [lines, selectedLineId, dateLabels]);

  if (lines.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
        <div className="flex flex-col items-center justify-center space-y-3 max-w-md mx-auto">
          <div className="p-3.5 bg-blue-50 rounded-2xl text-blue-600">
            <BarChart3 className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            Belum Ada Data Tren SMV untuk {selectedMonth ? formatMonthYearIndonesian(selectedMonth) : 'Bulan Ini'}
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Grafik komparasi SMV target vs aktual dan tren pencapaian harian akan otomatis aktif saat terdapat data produksi di bulan terpilih.
          </p>
        </div>
      </div>
    );
  }

  // Data for Line Achievement Comparison
  const lineComparisonData = useMemo(() => {
    return lines.map(l => ({
      name: l.lineName,
      lineId: l.lineId,
      achievement: l.overallAchievement,
      garmentStyle: l.style,
      isOptimal: l.overallAchievement >= 80,
      isWarning: l.overallAchievement < 70
    }));
  }, [lines]);

  // Data for Revenue vs Target
  const revenueComparisonData = useMemo(() => {
    return lines.map(l => ({
      name: l.lineName,
      actualM: Number((l.actualRevenue / 1000000).toFixed(1)),
      targetM: Number((l.targetRevenue / 1000000).toFixed(1)),
      varianceM: Number((l.varianceRevenue / 1000000).toFixed(1)),
      actualRaw: l.actualRevenue,
      targetRaw: l.targetRevenue,
      varianceRaw: l.varianceRevenue,
      garmentStyle: l.style
    }));
  }, [lines]);

  // Data for Achievement distribution categories
  const distributionData = useMemo(() => {
    let optimal = 0;
    let standard = 0;
    let warning = 0;

    lines.forEach(l => {
      l.daily.forEach(d => {
        if (d.pencapaian !== null) {
          if (d.pencapaian >= 80) optimal++;
          else if (d.pencapaian >= 70) standard++;
          else warning++;
        }
      });
    });

    const total = optimal + standard + warning;
    return [
      { name: 'Optimal (≥80%)', count: optimal, percent: total > 0 ? (optimal / total) * 100 : 0, color: '#2563eb' },
      { name: 'Standar (70-79%)', count: standard, percent: total > 0 ? (standard / total) * 100 : 0, color: '#60a5fa' },
      { name: 'Perlu Perhatian (<70%)', count: warning, percent: total > 0 ? (warning / total) * 100 : 0, color: '#f59e0b' }
    ];
  }, [lines]);

  return (
    <div className="space-y-6">
      
      {/* Top Main Chart: Tren SMV Harian & Pencapaian */}
      <div 
        id="chart-smv-daily-trend" 
        className="bg-white rounded-xl p-4 sm:p-6 border border-slate-200 shadow-sm"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-bold text-slate-900">
                Tren Harian: SMV Target vs Aktual & Efisiensi (%)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Pantau dinamika waktu standar kerja (menit) dan pencapaian target harian
            </p>
          </div>

          {/* Line Selector Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              id="select-line-filter"
              value={selectedLineId}
              onChange={(e) => setSelectedLineId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all cursor-pointer"
            >
              <option value="all">Semua Line (Rata-rata Gabungan)</option>
              {lines.map(l => (
                <option key={l.lineId} value={l.lineId}>
                  {l.lineName} - {l.style} ({formatPercent(l.overallAchievement)})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Chart Canvas */}
        <div className="mt-6 h-72 sm:h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={dailyTrendData} margin={{ top: 10, right: 10, left: -15, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis 
                dataKey="dateLabel" 
                tick={{ fontSize: 10, fill: '#64748b' }} 
                angle={-45} 
                textAnchor="end"
                interval={0}
                height={40}
              />
              {/* Left Y Axis: SMV Time in Minutes */}
              <YAxis 
                yAxisId="left" 
                tick={{ fontSize: 11, fill: '#64748b' }}
                domain={[0, 'dataMax + 20']}
                label={{ value: 'SMV (menit)', angle: -90, position: 'insideLeft', offset: 25, fontSize: 10, fill: '#94a3b8' }}
              />
              {/* Right Y Axis: Achievement Percentage */}
              <YAxis 
                yAxisId="right" 
                orientation="right" 
                tick={{ fontSize: 11, fill: '#64748b' }}
                domain={[0, 140]}
                unit="%"
                label={{ value: 'Pencapaian (%)', angle: 90, position: 'insideRight', offset: -5, fontSize: 10, fill: '#94a3b8' }}
              />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-200 text-xs space-y-1.5 min-w-[170px]">
                        <p className="font-bold text-slate-800 border-b border-slate-100 pb-1">{label}</p>
                        <div className="flex justify-between items-center text-slate-600">
                          <span className="flex items-center space-x-1.5">
                            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                            <span>SMV Target:</span>
                          </span>
                          <strong className="font-semibold text-slate-900">{formatNumber(data.smvTarget)} min</strong>
                        </div>
                        <div className="flex justify-between items-center text-slate-600">
                          <span className="flex items-center space-x-1.5">
                            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                            <span>SMV Aktual:</span>
                          </span>
                          <strong className="font-semibold text-slate-900">{formatNumber(data.smvActual)} min</strong>
                        </div>
                        <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                          <span className="flex items-center space-x-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            <span className="font-medium text-slate-800">Pencapaian:</span>
                          </span>
                          <strong className="font-bold text-blue-600">{formatPercent(data.pencapaian)}</strong>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend 
                verticalAlign="top" 
                height={36} 
                iconType="circle"
                wrapperStyle={{ fontSize: 12, paddingTop: 0 }}
              />
              <ReferenceLine yAxisId="right" y={80} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Target 80%', fill: '#059669', fontSize: 10 }} />
              
              <Bar yAxisId="left" dataKey="smvTarget" name="SMV Target (min)" fill="#93c5fd" radius={[4, 4, 0, 0]} maxBarSize={18} />
              <Bar yAxisId="left" dataKey="smvActual" name="SMV Aktual (min)" fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={18} />
              <Line yAxisId="right" type="monotone" dataKey="pencapaian" name="Pencapaian (%)" stroke="#059669" strokeWidth={2.5} dot={{ r: 3, fill: '#059669' }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 2: Secondary Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 2: Perbandingan Pencapaian Antar Line */}
        <div 
          id="chart-line-comparison" 
          className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Pencapaian Akurasi Antar Line (%)
              </h3>
            </div>
            <span className="text-xs text-slate-400">Target Standard: 80%</span>
          </div>

          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={lineComparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis unit="%" domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip 
                  formatter={(val: any, name: any, item: any) => [
                    `${formatPercent(Number(val))} (${item.payload?.garmentStyle || ''})`,
                    'Pencapaian'
                  ]}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: 8, borderColor: '#e2e8f0', fontSize: 12 }}
                />
                <ReferenceLine y={80} stroke="#2563eb" strokeDasharray="3 3" label={{ value: '80% Tgt', fill: '#2563eb', fontSize: 10 }} />
                <Bar dataKey="achievement" radius={[6, 6, 0, 0]} maxBarSize={36}>
                  {lineComparisonData.map((entry, index) => {
                    let fillColor = '#2563eb'; // standard primary blue
                    if (entry.isWarning) fillColor = '#f59e0b'; // amber for line 6 (56.90%)
                    else if (entry.achievement >= 78) fillColor = '#1d4ed8'; // deep blue for top performers
                    return <Cell key={`cell-${index}`} fill={fillColor} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex items-center justify-center space-x-4 text-xs text-slate-500">
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded bg-blue-700"></span>
              <span>Kinerja Tinggi (&gt;78%)</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded bg-blue-600"></span>
              <span>Standar (70-78%)</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded bg-amber-500"></span>
              <span>Di bawah 70%</span>
            </span>
          </div>
        </div>

        {/* Chart 3: Revenue vs Target Per Line (Juta IDR) */}
        <div 
          id="chart-revenue-comparison" 
          className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Realisasi Revenue vs Target (Juta IDR)
              </h3>
            </div>
            <span className="text-xs text-slate-400">Juni Periode 2</span>
          </div>

          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueComparisonData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis domain={[0, 240]} tick={{ fontSize: 11, fill: '#64748b' }} unit=" Jt" />
                <Tooltip 
                  formatter={(val: any, name: any) => [`Rp ${val} Juta`, name]}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: 8, borderColor: '#e2e8f0', fontSize: 12 }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: 4 }} />
                <Bar dataKey="actualM" name="Revenue Aktual" fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={20} />
                <Bar dataKey="targetM" name="Target Anggaran" fill="#93c5fd" radius={[4, 4, 0, 0]} maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-center text-xs text-slate-400">
            Line 3 & Line 5 mencatat surplus variansi positif di atas target
          </p>
        </div>

      </div>

    </div>
  );
};
