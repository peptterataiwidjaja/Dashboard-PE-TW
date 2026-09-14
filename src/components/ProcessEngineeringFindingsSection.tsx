import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  Cell, 
  PieChart, 
  Pie,
  ReferenceLine 
} from 'recharts';
import { ProcessEngineeringFinding, PECategory } from '../types';
import { PE_CATEGORY_CONFIG } from '../data/peFindingsData';
import { formatNumber, formatPercent, formatRupiah } from '../utils/formatters';
import { 
  Wrench, 
  Layers, 
  Activity, 
  Scissors, 
  Users, 
  Cpu, 
  TrendingUp, 
  Clock, 
  Calculator, 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  Check, 
  Copy, 
  ArrowRight,
  ShieldCheck,
  Zap,
  Info
} from 'lucide-react';

interface ProcessEngineeringFindingsSectionProps {
  findings: ProcessEngineeringFinding[];
  onAddNew: () => void;
  onEdit: (finding: ProcessEngineeringFinding) => void;
  onDelete: (id: string) => void;
  onUpdateStatus: (id: string, newStatus: 'implemented' | 'trial' | 'evaluation') => void;
}

export const ProcessEngineeringFindingsSection: React.FC<ProcessEngineeringFindingsSectionProps> = ({
  findings,
  onAddNew,
  onEdit,
  onDelete,
  onUpdateStatus
}) => {
  const [selectedLineFilter, setSelectedLineFilter] = useState<number | 'all'>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<PECategory | 'all'>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'implemented' | 'trial' | 'evaluation'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Interactive ROI Simulation State
  const [simulatedSmvReductionSeconds, setSimulatedSmvReductionSeconds] = useState<number>(18);
  const [simulatedDailyTargetBase, setSimulatedDailyTargetBase] = useState<number>(600);
  const [simulatedCmRate, setSimulatedCmRate] = useState<number>(37000);

  // Filtered Findings
  const filteredFindings = useMemo(() => {
    return findings.filter(f => {
      const matchLine = selectedLineFilter === 'all' || f.lineId === selectedLineFilter;
      const matchCategory = selectedCategoryFilter === 'all' || f.category === selectedCategoryFilter;
      const matchStatus = selectedStatusFilter === 'all' || f.status === selectedStatusFilter;
      const matchSearch = 
        searchQuery === '' ||
        f.operationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.styleName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.findingDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.kaizenAction.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.lineName.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchLine && matchCategory && matchStatus && matchSearch;
    });
  }, [findings, selectedLineFilter, selectedCategoryFilter, selectedStatusFilter, searchQuery]);

  // Aggregate KPI Calculations
  const stats = useMemo(() => {
    const total = findings.length;
    const implemented = findings.filter(f => f.status === 'implemented').length;
    const trial = findings.filter(f => f.status === 'trial').length;
    const evaluation = findings.filter(f => f.status === 'evaluation').length;

    const avgVarianceSec = total > 0 
      ? findings.reduce((acc, f) => acc + f.varianceSeconds, 0) / total 
      : 0;
    const avgVariancePct = total > 0 
      ? findings.reduce((acc, f) => acc + f.variancePercent, 0) / total 
      : 0;
    const totalPotentialSavingSec = findings.reduce((acc, f) => acc + f.potentialSavingSeconds, 0);
    const totalPotentialOutputGain = findings.reduce((acc, f) => acc + f.potentialOutputGainPcs, 0);

    return {
      total,
      implemented,
      trial,
      evaluation,
      avgVarianceSec,
      avgVariancePct,
      totalPotentialSavingSec,
      totalPotentialOutputGain
    };
  }, [findings]);

  // Chart 1 Data: SMV Comparison per Operation (Top operations by variance)
  const chartData = useMemo(() => {
    return findings.map(f => ({
      name: f.operationName.length > 18 ? f.operationName.substring(0, 18) + '...' : f.operationName,
      fullName: `${f.lineName}: ${f.operationName} (${f.styleName})`,
      line: f.lineName,
      smvStandard: Number(f.smvStandard.toFixed(2)),
      smvActual: Number(f.smvActual.toFixed(2)),
      varianceSec: f.varianceSeconds,
      variancePct: Number(f.variancePercent.toFixed(1)),
      savingSec: f.potentialSavingSeconds
    }));
  }, [findings]);

  // Chart 2 Data: Category Distribution
  const categoryPieData = useMemo(() => {
    const counts: Record<string, number> = {};
    findings.forEach(f => {
      counts[f.category] = (counts[f.category] || 0) + 1;
    });

    const colors: Record<PECategory, string> = {
      motion_waste: '#d97706', // amber-600
      attachment_tooling: '#2563eb', // blue-600
      workstation_ergonomics: '#059669', // emerald-600
      material_interlining: '#7c3aed', // purple-600
      operator_skill: '#e11d48', // rose-600
      machine_tension: '#0891b2' // cyan-600
    };

    return Object.entries(counts).map(([catKey, count]) => {
      const cfg = PE_CATEGORY_CONFIG[catKey as PECategory];
      return {
        name: cfg ? cfg.shortLabel : catKey,
        value: count,
        color: colors[catKey as PECategory] || '#64748b'
      };
    });
  }, [findings]);

  // Simulated ROI Calculation
  const roiSimulation = useMemo(() => {
    // Current cycle time per garment assumed approx 30 minutes (1800 seconds)
    const baseGarmentSeconds = 30 * 60; // 1800 detik
    const newGarmentSeconds = Math.max(1, baseGarmentSeconds - simulatedSmvReductionSeconds);
    const productivityMultiplier = baseGarmentSeconds / newGarmentSeconds;
    const additionalOutputPerDay = Math.round(simulatedDailyTargetBase * (productivityMultiplier - 1));
    const newDailyOutput = simulatedDailyTargetBase + additionalOutputPerDay;
    const additionalDailyRevenue = additionalOutputPerDay * simulatedCmRate;
    const additionalMonthlyRevenue = additionalDailyRevenue * 25; // 25 hari kerja

    return {
      additionalOutputPerDay,
      newDailyOutput,
      additionalDailyRevenue,
      additionalMonthlyRevenue,
      pctGain: Number(((additionalOutputPerDay / simulatedDailyTargetBase) * 100).toFixed(1))
    };
  }, [simulatedSmvReductionSeconds, simulatedDailyTargetBase, simulatedCmRate]);

  const handleCopyFinding = (finding: ProcessEngineeringFinding) => {
    const text = `[REKAYASA PROSES & DIAGNOSTIK SMV]\nLine: ${finding.lineName} (${finding.styleName})\nOperasi: ${finding.operationName}\nKategori: ${PE_CATEGORY_CONFIG[finding.category]?.label}\nSMV Std: ${finding.smvStandard} mnt (${(finding.smvStandard*60).toFixed(0)} dtk) | Aktual: ${finding.smvActual} mnt (${(finding.smvActual*60).toFixed(0)} dtk) | Deviasi: +${finding.varianceSeconds} dtk (+${finding.variancePercent.toFixed(1)}%)\nTemuan: ${finding.findingDescription}\nAkar Masalah: ${finding.rootCause}\nTindakan Kaizen: ${finding.kaizenAction}\nPotensi Hemat: ${finding.potentialSavingSeconds} dtk/garment (+${finding.potentialOutputGainPcs} pcs/hari)\nStatus: ${finding.status.toUpperCase()} | PE: ${finding.peInspector}`;
    navigator.clipboard.writeText(text);
    setCopiedId(finding.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-8">
      
      {/* Top Banner & Header */}
      <div className="p-5 sm:p-6 border-b border-slate-200 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-48 h-48 bg-blue-600/20 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute right-32 -bottom-10 w-40 h-40 bg-red-600/20 rounded-full blur-2xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2.5 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/40 text-blue-300 text-[10px] font-black uppercase tracking-wider">
                Industrial Engineering (IE) & Process Rekayasa
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-bold">
                Live Diagnostik SMV
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Analisis Tren Temuan Rekayasa Proses & Diagnostik SMV
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
              Pemantauan deviasi siklus waktu operasi kritis, audit pemborosan gerakan (motion waste), perkakas corong & folder, stabilitas line balancing, serta simulator nilai dampak perbaikan Kaizen PT Teratai Widjaja.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={onAddNew}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center space-x-2 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ Catat Temuan PE Baru</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="p-5 sm:p-6 bg-slate-50/70 border-b border-slate-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          
          {/* Card 1: Total Temuan */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Total Temuan PE
              </span>
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Wrench className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900">
              {stats.total} <span className="text-xs font-semibold text-slate-500">Kasus</span>
            </div>
            <div className="mt-2 flex items-center space-x-2 text-[11px]">
              <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                {stats.implemented} Selesai
              </span>
              <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">
                {stats.trial} Trial
              </span>
              <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">
                {stats.evaluation} Evaluasi
              </span>
            </div>
          </div>

          {/* Card 2: Rata-Rata Deviasi SMV */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Rata-rata Deviasi SMV
              </span>
              <div className="w-7 h-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-red-600">
              +{stats.avgVarianceSec.toFixed(1)} <span className="text-xs font-semibold text-slate-500">dtk/potong</span>
            </div>
            <p className="mt-2 text-[11px] font-medium text-slate-500">
              +{stats.avgVariancePct.toFixed(1)}% di atas standar toleransi PE
            </p>
          </div>

          {/* Card 3: Potensi Penghematan Siklus */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Potensi Penghematan
              </span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-emerald-700">
              {stats.totalPotentialSavingSec} <span className="text-xs font-semibold text-slate-500">dtk / gmt</span>
            </div>
            <p className="mt-2 text-[11px] font-medium text-slate-500">
              Dari pemangkasan motion waste & attachment
            </p>
          </div>

          {/* Card 4: Potensi Kenaikan Output */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Potensi Gain Output
              </span>
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-blue-700">
              +{formatNumber(stats.totalPotentialOutputGain)} <span className="text-xs font-semibold text-slate-500">pcs/hari</span>
            </div>
            <p className="mt-2 text-[11px] font-medium text-slate-500">
              Kenaikan kapasitas sewing gabungan pabrik
            </p>
          </div>

        </div>
      </div>

      {/* Visual Charts: Composed Variance Trend & Category Distribution */}
      <div className="p-5 sm:p-6 border-b border-slate-200">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Chart 1: Bar & Line Composed Chart (Deviasi SMV Aktual vs Standar per Operasi Kritis) */}
          <div className="lg:col-span-2 bg-slate-50/50 p-4 sm:p-5 rounded-xl border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
                  <Activity className="w-4 h-4 text-blue-600" />
                  <span>Komparasi SMV Standar vs Teramati PE & Deviasi Detik</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Target SMV standar vs aktual teramati per stasiun operasi kritis sewing
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center space-x-1 text-[11px] font-semibold text-slate-600">
                  <span className="w-3 h-3 bg-blue-600 rounded-xs"></span>
                  <span>SMV Std</span>
                </span>
                <span className="inline-flex items-center space-x-1 text-[11px] font-semibold text-slate-600">
                  <span className="w-3 h-3 bg-red-500 rounded-xs"></span>
                  <span>SMV Akt</span>
                </span>
                <span className="inline-flex items-center space-x-1 text-[11px] font-semibold text-slate-600">
                  <span className="w-3 h-0.5 bg-amber-500"></span>
                  <span>Deviasi (dtk)</span>
                </span>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 10, fill: '#64748b' }} 
                    angle={-25}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis 
                    yAxisId="left" 
                    unit="m" 
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    domain={[0, 'dataMax + 0.5']}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    unit="s" 
                    tick={{ fontSize: 10, fill: '#d97706' }}
                    domain={[0, 'dataMax + 10']}
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl text-xs space-y-1 z-50">
                            <p className="font-bold text-blue-300">{d.fullName}</p>
                            <p>SMV Standar: <span className="font-bold text-white">{d.smvStandard} menit</span> ({(d.smvStandard*60).toFixed(0)} dtk)</p>
                            <p>SMV Aktual Teramati: <span className="font-bold text-red-400">{d.smvActual} menit</span> ({(d.smvActual*60).toFixed(0)} dtk)</p>
                            <p>Selisih Deviasi: <span className="font-bold text-amber-400">+{d.varianceSec} detik (+{d.variancePct}%)</span></p>
                            <p>Potensi Hemat Kaizen: <span className="font-bold text-emerald-400">{d.savingSec} detik</span></p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar yAxisId="left" dataKey="smvStandard" name="SMV Standar (menit)" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={14} />
                  <Bar yAxisId="left" dataKey="smvActual" name="SMV Aktual (menit)" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={14} />
                  <Line yAxisId="right" type="monotone" dataKey="varianceSec" name="Deviasi (detik)" stroke="#d97706" strokeWidth={2.5} dot={{ r: 4, fill: '#d97706' }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Proporsi Kategori Penyebab Variansi SMV */}
          <div className="bg-slate-50/50 p-4 sm:p-5 rounded-xl border border-slate-200 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
                <PieChart className="w-4 h-4 text-emerald-600" />
                <span>Distribusi Kategori Kendala PE</span>
              </h3>
              <p className="text-xs text-slate-500">
                Faktor dominan yang memicu selisih SMV standar
              </p>
            </div>

            <div className="h-52 w-full my-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(val: number, name: string) => [`${val} Temuan`, name]}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-200">
              {categoryPieData.map((item, idx) => (
                <div key={idx} className="flex items-center space-x-1.5 text-[10px] text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                  <span className="truncate">{item.name} ({item.value})</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Simulator Rekayasa Nilai & Dampak Finansial SMV (Interactive Kaizen ROI) */}
      <div className="p-5 sm:p-6 bg-linear-to-r from-blue-50 via-indigo-50/40 to-slate-50 border-b border-slate-200">
        <div className="flex items-center space-x-2.5 mb-3">
          <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Simulator Rekayasa Nilai (Kaizen Value & Financial Impact ROI)
            </h3>
            <p className="text-xs text-slate-500">
              Kalkulasi matematis dampak pemangkasan SMV terhadap penambahan output & proyeksi revenue CM
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
          
          {/* Controls: Slider & Inputs */}
          <div className="lg:col-span-7 bg-white p-4 rounded-xl border border-slate-200 space-y-4 shadow-2xs">
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
                <span className="flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  <span>Simulasi Pemangkasan SMV per Garment:</span>
                </span>
                <span className="text-sm font-black text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200">
                  {simulatedSmvReductionSeconds} Detik ({((simulatedSmvReductionSeconds/60)).toFixed(2)} menit)
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="60"
                step="1"
                value={simulatedSmvReductionSeconds}
                onChange={(e) => setSimulatedSmvReductionSeconds(parseInt(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-bold mt-1">
                <span>5 dtk (Kaizen Ringan)</span>
                <span>30 dtk (Attachment Baru)</span>
                <span>60 dtk (Full Re-Layout)</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Basis Output Line (Pcs/Hari)
                </label>
                <input
                  type="number"
                  min="100"
                  step="50"
                  value={simulatedDailyTargetBase}
                  onChange={(e) => setSimulatedDailyTargetBase(parseInt(e.target.value) || 0)}
                  className="w-full text-xs font-bold px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Tarif Ongkos Jahit (CM Rate/Pcs)
                </label>
                <input
                  type="number"
                  min="5000"
                  step="1000"
                  value={simulatedCmRate}
                  onChange={(e) => setSimulatedCmRate(parseInt(e.target.value) || 0)}
                  className="w-full text-xs font-bold px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Results Output Cards */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-3">
            <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl">
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block mb-1">
                Tambahan Output Harian
              </span>
              <div className="text-xl font-black text-emerald-700">
                +{roiSimulation.additionalOutputPerDay} <span className="text-xs font-semibold text-slate-600">pcs/hari</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-800 block mt-1">
                +{roiSimulation.pctGain}% Kapasitas Baru ({roiSimulation.newDailyOutput} pcs)
              </span>
            </div>

            <div className="bg-blue-50 border border-blue-200 p-3.5 rounded-xl">
              <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block mb-1">
                Potensi Tambahan Revenue CM
              </span>
              <div className="text-xl font-black text-blue-800">
                +{formatRupiah(roiSimulation.additionalDailyRevenue)}
              </div>
              <span className="text-[10px] font-bold text-blue-700 block mt-1">
                ≈ {formatRupiah(roiSimulation.additionalMonthlyRevenue)} / bln
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* Filter and Action Controls Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Search Box */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari stasiun operasi, style, akar masalah, kaizen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Filter Line */}
            <div className="flex items-center space-x-1 text-xs">
              <span className="text-slate-500 font-medium">Line:</span>
              <select
                value={selectedLineFilter}
                onChange={(e) => setSelectedLineFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="text-xs font-semibold px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Semua Line</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(id => (
                  <option key={id} value={id}>Line {id}</option>
                ))}
              </select>
            </div>

            {/* Filter Kategori */}
            <div className="flex items-center space-x-1 text-xs">
              <span className="text-slate-500 font-medium">Kategori:</span>
              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value as any)}
                className="text-xs font-semibold px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-[140px]"
              >
                <option value="all">Semua Kategori</option>
                {Object.entries(PE_CATEGORY_CONFIG).map(([key, cfg]) => (
                  <option key={key} value={key}>{cfg.shortLabel}</option>
                ))}
              </select>
            </div>

            {/* Filter Status */}
            <div className="flex items-center space-x-1 text-xs">
              <span className="text-slate-500 font-medium">Status:</span>
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value as any)}
                className="text-xs font-semibold px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Semua Status</option>
                <option value="implemented">Diterapkan</option>
                <option value="trial">Trial</option>
                <option value="evaluation">Evaluasi</option>
              </select>
            </div>

            {/* Clear Filter button if active */}
            {(selectedLineFilter !== 'all' || selectedCategoryFilter !== 'all' || selectedStatusFilter !== 'all' || searchQuery !== '') && (
              <button
                onClick={() => {
                  setSelectedLineFilter('all');
                  setSelectedCategoryFilter('all');
                  setSelectedStatusFilter('all');
                  setSearchQuery('');
                }}
                className="text-xs text-blue-600 hover:text-blue-800 font-bold px-2 py-1 hover:underline"
              >
                Reset Filter
              </button>
            )}

          </div>

        </div>
      </div>

      {/* Detail Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-100/80 text-slate-600 uppercase font-black tracking-wider text-[10px] border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Line & Style</th>
              <th className="py-3 px-4">Operasi Kritis & Kategori</th>
              <th className="py-3 px-4 text-center">SMV Std vs Aktual</th>
              <th className="py-3 px-4 text-center">Deviasi (Gap)</th>
              <th className="py-3 px-4">Temuan & Akar Masalah</th>
              <th className="py-3 px-4">Rekomendasi Kaizen PE</th>
              <th className="py-3 px-4 text-center">Potensi Saving</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredFindings.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-400">
                  <Wrench className="w-8 h-8 mx-auto mb-2 text-slate-300 stroke-1" />
                  <p className="font-bold text-sm text-slate-600">Tidak ada temuan rekayasa proses yang cocok</p>
                  <p className="text-xs text-slate-400 mt-1">Coba sesuaikan filter pencarian atau catat temuan baru dengan tombol di atas.</p>
                </td>
              </tr>
            ) : (
              filteredFindings.map((item) => {
                const catConfig = PE_CATEGORY_CONFIG[item.category] || {
                  label: item.category,
                  shortLabel: item.category,
                  color: 'text-slate-700',
                  bgColor: 'bg-slate-50',
                  borderColor: 'border-slate-200'
                };

                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    
                    {/* Line & Style */}
                    <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                      <div className="flex items-center space-x-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                        <span className="text-xs font-black">{item.lineName}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-semibold mt-0.5">
                        {item.styleName}
                      </div>
                      <div className="text-[9px] text-slate-400 mt-0.5">
                        {item.date}
                      </div>
                    </td>

                    {/* Operasi & Kategori */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 leading-tight">
                        {item.operationName}
                      </div>
                      <div className="mt-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${catConfig.bgColor} ${catConfig.color} ${catConfig.borderColor}`}>
                          {catConfig.shortLabel}
                        </span>
                      </div>
                    </td>

                    {/* SMV Std vs Aktual */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="text-[11px] text-slate-500">
                        Std: <span className="font-bold text-blue-700">{item.smvStandard.toFixed(2)} m</span> ({(item.smvStandard * 60).toFixed(0)}s)
                      </div>
                      <div className="text-xs font-bold text-red-600 mt-0.5">
                        Akt: <span>{item.smvActual.toFixed(2)} m</span> ({(item.smvActual * 60).toFixed(0)}s)
                      </div>
                    </td>

                    {/* Deviasi Gap */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className={`inline-flex flex-col items-center px-2 py-1 rounded-lg border font-black ${
                        item.severity === 'critical'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : item.severity === 'warning'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}>
                        <span className="text-xs">+{item.varianceSeconds} dtk</span>
                        <span className="text-[9px] font-bold">+{item.variancePercent.toFixed(1)}%</span>
                      </div>
                    </td>

                    {/* Temuan & Akar Masalah */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="text-[11px] text-slate-800 leading-relaxed font-medium line-clamp-2" title={item.findingDescription}>
                        {item.findingDescription}
                      </p>
                      <div className="text-[10px] text-slate-500 mt-1 line-clamp-1 italic" title={item.rootCause}>
                        <span className="font-bold text-slate-600 not-italic">Akar:</span> {item.rootCause}
                      </div>
                    </td>

                    {/* Rekomendasi Kaizen */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="text-[11px] text-blue-900 bg-blue-50/70 p-2 rounded-lg border border-blue-100 font-medium leading-relaxed" title={item.kaizenAction}>
                        <span className="font-bold text-blue-700">Kaizen:</span> {item.kaizenAction}
                      </div>
                    </td>

                    {/* Potensi Saving */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="text-xs font-black text-emerald-700">
                        -{item.potentialSavingSeconds} dtk
                      </div>
                      <div className="text-[10px] text-slate-500 font-semibold mt-0.5">
                        +{item.potentialOutputGainPcs} pcs/hari
                      </div>
                    </td>

                    {/* Status Dropdown/Badge */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <select
                        value={item.status}
                        onChange={(e) => onUpdateStatus(item.id, e.target.value as any)}
                        className={`text-[11px] font-bold px-2 py-1 rounded-lg border focus:outline-none cursor-pointer ${
                          item.status === 'implemented'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : item.status === 'trial'
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        <option value="implemented">✅ Selesai</option>
                        <option value="trial">🧪 Trial</option>
                        <option value="evaluation">📋 Evaluasi</option>
                      </select>
                      <div className="text-[9px] text-slate-400 mt-1 truncate max-w-[90px]" title={item.peInspector}>
                        {item.peInspector}
                      </div>
                    </td>

                    {/* Action Buttons */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => handleCopyFinding(item)}
                          className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-md transition-colors"
                          title="Salin Rincian Temuan"
                        >
                          {copiedId === item.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => onEdit(item)}
                          className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
                          title="Edit Temuan PE"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Hapus temuan PE untuk ${item.operationName} (${item.lineName})?`)) {
                              onDelete(item.id);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Hapus Temuan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Info & Verification */}
      <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>
            Diverifikasi oleh Tim Rekayasa Proses (PE & IE) PT Teratai Widjaja | Standar Waktu GSD/MODAPTS
          </span>
        </div>
        <span className="text-[11px] text-slate-400">
          Menampilkan {filteredFindings.length} dari total {findings.length} temuan time study
        </span>
      </div>

    </div>
  );
};
