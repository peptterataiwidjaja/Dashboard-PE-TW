import React from 'react';
import { LineData, DashboardSummary, MonthlyProductivityRecord, LineIncident } from '../types';
import { formatRupiah, formatPercent, formatNumber, formatMonthYearIndonesian } from '../utils/formatters';
import { CompanyLogo } from './CompanyLogo';

interface PdfReportTemplateProps {
  lines: LineData[];
  summary: DashboardSummary;
  monthlyRecap?: MonthlyProductivityRecord[];
  incidents?: LineIncident[];
  reportTitle?: string;
  reportMode?: 'daily' | 'monthly' | 'incidents';
  selectedDate?: string;
  selectedMonth?: string;
  supervisorName?: string;
  peName?: string;
  fmName?: string;
}

export const PdfReportTemplate: React.FC<PdfReportTemplateProps> = ({ 
  lines, 
  summary,
  monthlyRecap = [],
  incidents = [],
  reportTitle,
  reportMode = 'daily',
  selectedDate,
  selectedMonth,
  supervisorName = '',
  peName = '',
  fmName = ''
}) => {
  const printDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  // Filter records based on selected month (Bulan & Tahun) and optional date
  const displayedRecap = React.useMemo(() => {
    if (reportMode === 'daily' && selectedDate && selectedDate !== 'all') {
      return monthlyRecap.filter(r => r.date === selectedDate);
    }
    if (selectedMonth && selectedMonth !== 'all') {
      return monthlyRecap.filter(r => r.date && r.date.startsWith(selectedMonth));
    }
    return monthlyRecap;
  }, [monthlyRecap, reportMode, selectedDate, selectedMonth]);

  // Incidents for current view/date
  const relevantIncidents = React.useMemo(() => {
    if (reportMode === 'daily' && selectedDate && selectedDate !== 'all') {
      return incidents.filter(inc => inc.date === selectedDate);
    }
    if (selectedMonth && selectedMonth !== 'all') {
      return incidents.filter(inc => inc.date && inc.date.startsWith(selectedMonth));
    }
    return incidents;
  }, [incidents, reportMode, selectedDate, selectedMonth]);

  // Aggregate stats for displayed records
  const totalTargetDaily = displayedRecap.reduce((acc, r) => acc + (r.targetDailyPcs || r.targetOutputPcs || 0), 0);
  const totalActualDaily = displayedRecap.reduce((acc, r) => acc + (r.actualDailyPcs || r.actualOutputPcs || 0), 0);
  const avgEfficiency = displayedRecap.length > 0
    ? displayedRecap.reduce((acc, r) => acc + r.efficiencyPercent, 0) / displayedRecap.length
    : 0;
  const avgDefect = displayedRecap.length > 0
    ? displayedRecap.reduce((acc, r) => acc + r.defectPercent, 0) / displayedRecap.length
    : 0;

  // Indonesian Month-Year Label (e.g., "September 2026")
  const formattedMonth = selectedMonth ? formatMonthYearIndonesian(selectedMonth) : '';
  const monthUpper = formattedMonth ? formattedMonth.toUpperCase() : '';

  // Title calculation - clean and professional without hardcoded strings
  const calculatedTitle = reportTitle || (
    reportMode === 'daily'
      ? (selectedDate && selectedDate !== 'all'
          ? `LAPORAN PRODUKSI HARIAN SEWING PER TANGGAL ${formatDate(selectedDate)} ${monthUpper ? `(${monthUpper})` : ''}`
          : `LAPORAN PRODUKSI HARIAN SEWING ${monthUpper ? `- BULAN ${monthUpper}` : 'REKAP KESELURUHAN LINI'}`)
      : `LAPORAN REKAPITULASI PRODUKSI BULANAN SEWING ${monthUpper ? `- BULAN ${monthUpper}` : ''}`
  );

  return (
    <div 
      id="printable-pdf-report" 
      className="p-8 bg-white text-slate-900 border border-slate-200 rounded-xl w-full max-w-[1020px] mx-auto space-y-6 font-sans overflow-hidden"
    >
      {/* Report Header with PT Teratai Widjaja Logo */}
      <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
        <div className="flex items-center space-x-4">
          <CompanyLogo size="lg" showSubtitle={true} />
        </div>
        <div className="text-right text-xs text-slate-500">
          <div className="inline-block bg-slate-100 border border-slate-300 rounded px-2 py-0.5 text-[10px] font-mono font-bold text-slate-700 mb-1">
            No. Dokumen: TW/PRD-PE/FRM-{reportMode === 'daily' ? '08-D' : '08-M'} • Rev: 03
          </div>
          <p className="font-extrabold text-[#1a3478] text-sm tracking-wide uppercase">{calculatedTitle}</p>
          <p className="font-semibold text-slate-700 mt-0.5">Tanggal Cetak: {printDate}</p>
          <p className="text-[11px] text-blue-700 font-medium">Divisi Industrial Engineering (IE) & Sewing Quality Control</p>
        </div>
      </div>

      {/* Subheader Banner */}
      <div className="flex items-center justify-between border-l-4 border-red-600 pl-3 py-1 bg-slate-50 rounded-r-lg">
        <div>
          <h2 className="text-xs font-extrabold text-slate-900 uppercase">
            {reportMode === 'daily'
              ? (selectedDate && selectedDate !== 'all'
                  ? `Laporan Produksi Harian Tanggal: ${formatDate(selectedDate)} • Analisis Bottleneck & Tindakan Penyelesaian`
                  : `Laporan Produksi Harian Sewing ${formattedMonth ? `Bulan ${formattedMonth}` : ''} • Analisis Bottleneck & Tindakan Penyelesaian`)
              : `Laporan Rekapitulasi Bulanan Kinerja Line Sewing ${formattedMonth ? `Bulan ${formattedMonth}` : ''} • Pencapaian Target Order & SMV`}
          </h2>
          <p className="text-[10px] text-slate-500">
            Form Resmi Pemantauan Target, Pengurangan Sisa Order, Analisis Masalah & Pengesahan Manual Manajemen PT Teratai Widjaja
          </p>
        </div>
        <span className="text-[10px] font-bold px-2.5 py-1 bg-blue-100 text-blue-800 rounded">
          Status: Resmi Terbit
        </span>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-4 gap-3">
        <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">
            {reportMode === 'daily' ? 'Total Output Aktual Harian' : 'Total Output Terpenuhi'}
          </span>
          <span className="text-base font-black text-blue-700 block mt-1 font-mono">
            {totalActualDaily.toLocaleString('id-ID')} pcs
          </span>
          <span className="text-[10px] text-slate-500">
            Target: {totalTargetDaily.toLocaleString('id-ID')} pcs
          </span>
        </div>

        <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">Variansi Output</span>
          <span className={`text-base font-black block mt-1 font-mono ${
            (totalActualDaily - totalTargetDaily) >= 0 ? 'text-blue-700' : 'text-red-600'
          }`}>
            {(totalActualDaily - totalTargetDaily) >= 0 ? '+' : ''}
            {(totalActualDaily - totalTargetDaily).toLocaleString('id-ID')} pcs
          </span>
          <span className="text-[10px] text-slate-500">
            Pencapaian: {totalTargetDaily > 0 ? ((totalActualDaily / totalTargetDaily) * 100).toFixed(1) : 0}%
          </span>
        </div>

        <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">Rata-Rata Efisiensi Sewing</span>
          <span className={`text-base font-black block mt-1 font-mono ${
            avgEfficiency >= 75 ? 'text-blue-700' : 'text-amber-600'
          }`}>
            {formatPercent(avgEfficiency)}
          </span>
          <span className="text-[10px] text-slate-500">
            Standar Benchmark: ≥75,00%
          </span>
        </div>

        <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">Rata-rata Defect & Kendala</span>
          <span className={`text-base font-black block mt-1 font-mono ${
            avgDefect <= 2.0 ? 'text-blue-700' : 'text-red-600'
          }`}>
            {formatPercent(avgDefect)}
          </span>
          <span className="text-[10px] text-slate-500">
            {relevantIncidents.length} Lini Memerlukan Disposisi
          </span>
        </div>
      </div>

      {/* Section 1: TABEL DATA PRODUKSI */}
      <div>
        <div className="flex items-center space-x-2 mb-2 pb-1 border-b border-slate-200">
          <span className="w-2 h-2 rounded-full bg-blue-600"></span>
          <h3 className="text-xs font-bold uppercase text-slate-800 tracking-wider">
            1. Tabel Data Produksi & Output Sewing {reportMode === 'daily' 
              ? (selectedDate && selectedDate !== 'all' 
                  ? `Per Tanggal ${formatDate(selectedDate)}` 
                  : (formattedMonth ? `Harian (Bulan ${formattedMonth})` : 'Harian')) 
              : (formattedMonth ? `Bulanan (${formattedMonth})` : 'Bulanan')}
          </h3>
        </div>
        <div className="w-full overflow-hidden border border-slate-200 rounded-lg">
          <table className="w-full text-left text-[11px] border-collapse table-fixed">
            <thead>
              <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                <th className="p-1.5 border-r border-slate-200 text-center w-[7%]">Line</th>
                <th className="p-1.5 border-r border-slate-200 w-[10%]">Tanggal</th>
                <th className="p-1.5 border-r border-slate-200 w-[14%]">Model / Style</th>
                <th className="p-1.5 border-r border-slate-200 text-right w-[9%]">Target/Hr</th>
                <th className="p-1.5 border-r border-slate-200 text-right w-[9%]">Aktual/Hr</th>
                <th className="p-1.5 border-r border-slate-200 text-right w-[8%]">Deviasi</th>
                <th className="p-1.5 border-r border-slate-200 text-center w-[5%]">MP</th>
                <th className="p-1.5 border-r border-slate-200 text-right w-[7%]">SMV</th>
                <th className="p-1.5 border-r border-slate-200 text-right w-[8%]">Efisiensi</th>
                <th className="p-1.5 border-r border-slate-200 text-right w-[7%]">Defect</th>
                <th className="p-1.5 border-slate-200 w-[16%]">Catatan Operasional Lini</th>
              </tr>
            </thead>
            <tbody>
              {displayedRecap.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-slate-500 font-medium">
                    Belum ada rekaman data produksi sewing untuk tanggal {selectedDate && selectedDate !== 'all' ? formatDate(selectedDate) : 'yang dipilih'}.
                  </td>
                </tr>
              ) : (
                displayedRecap.map(r => {
                const targetDaily = r.targetDailyPcs || r.targetOutputPcs;
                const actualDaily = r.actualDailyPcs || r.actualOutputPcs;
                const deviasi = actualDaily - targetDaily;
                return (
                  <tr key={r.id} className="border-b border-slate-200 hover:bg-slate-50/50">
                    <td className="p-1.5 border-r border-slate-200 text-center font-bold text-slate-800">{r.lineName}</td>
                    <td className="p-1.5 border-r border-slate-200 text-slate-700 whitespace-nowrap">{formatDate(r.date)}</td>
                    <td className="p-1.5 border-r border-slate-200 font-semibold text-slate-800 break-words">{r.style}</td>
                    <td className="p-1.5 border-r border-slate-200 text-right font-mono">{targetDaily.toLocaleString('id-ID')}</td>
                    <td className="p-1.5 border-r border-slate-200 text-right font-mono font-bold text-slate-900">{actualDaily.toLocaleString('id-ID')}</td>
                    <td className={`p-1.5 border-r border-slate-200 text-right font-mono font-bold ${
                      deviasi >= 0 ? 'text-blue-700' : 'text-red-600'
                    }`}>
                      {deviasi >= 0 ? `+${deviasi}` : deviasi}
                    </td>
                    <td className="p-1.5 border-r border-slate-200 text-center font-mono">{r.manpower}</td>
                    <td className="p-1.5 border-r border-slate-200 text-right font-mono">{r.smvStandard}</td>
                    <td className={`p-1.5 border-r border-slate-200 text-right font-mono font-bold ${
                      r.efficiencyPercent >= 75 ? 'text-blue-700' : 'text-red-600'
                    }`}>
                      {formatPercent(r.efficiencyPercent)}
                    </td>
                    <td className={`p-1.5 border-r border-slate-200 text-right font-mono font-bold ${
                      r.defectPercent >= 3.0 ? 'text-red-600' : r.defectPercent >= 2.0 ? 'text-amber-600' : 'text-slate-700'
                    }`}>
                      {formatPercent(r.defectPercent)}
                    </td>
                    <td className="p-1.5 border-slate-200 text-[10px] text-slate-700 leading-tight break-words">
                      <span className="font-bold text-slate-900">[{r.analysisStatus?.toUpperCase() || 'OPTIMAL'}]</span> {r.analysisNote || r.note || 'Produksi stabil.'}
                    </td>
                  </tr>
                );
              }))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900">
                <td colSpan={3} className="p-1.5 border-r border-slate-200 text-center">TOTAL & RATA-RATA</td>
                <td className="p-1.5 border-r border-slate-200 text-right font-mono">{totalTargetDaily.toLocaleString('id-ID')}</td>
                <td className="p-1.5 border-r border-slate-200 text-right font-mono">{totalActualDaily.toLocaleString('id-ID')}</td>
                <td className={`p-1.5 border-r border-slate-200 text-right font-mono ${
                  (totalActualDaily - totalTargetDaily) >= 0 ? 'text-blue-700' : 'text-red-600'
                }`}>
                  {(totalActualDaily - totalTargetDaily) >= 0 ? '+' : ''}{(totalActualDaily - totalTargetDaily).toLocaleString('id-ID')}
                </td>
                <td colSpan={2} className="p-1.5 border-r border-slate-200"></td>
                <td className="p-1.5 border-r border-slate-200 text-right font-mono text-blue-700">{formatPercent(avgEfficiency)}</td>
                <td className="p-1.5 border-r border-slate-200 text-right font-mono">{formatPercent(avgDefect)}</td>
                <td className="p-1.5 border-slate-200"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* SECTION WAJIB DARI USER: ANALISIS SINGKAT MASALAH & TINDAKAN PERLU PENYELESAIANNYA (CAPA) */}
      <div className="p-3.5 bg-red-50/40 border-2 border-red-200 rounded-xl space-y-2.5">
        <div className="flex items-center justify-between pb-1.5 border-b border-red-200">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse"></span>
            <h3 className="text-xs font-black uppercase text-red-950 tracking-wider">
              2. ANALISIS SINGKAT MASALAH & TINDAKAN PERLU PENYELESAIANNYA (CAPA)
            </h3>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 bg-red-600 text-white rounded">
            Tindakan Preventif & Korektif
          </span>
        </div>

        <div className="w-full overflow-hidden border border-red-200 rounded-lg">
          <table className="w-full text-left text-[11px] border-collapse table-fixed bg-white">
            <thead>
              <tr className="bg-red-100/70 text-red-950 font-bold border-b border-red-200">
                <th className="p-1.5 border-r border-red-200 text-center w-[8%]">Line</th>
                <th className="p-1.5 border-r border-red-200 w-[14%]">Model / Style</th>
                <th className="p-1.5 border-r border-red-200 w-[30%]">Analisis Singkat Masalah (Root Cause / Bottleneck)</th>
                <th className="p-1.5 border-r border-red-200 w-[34%]">Tindakan Perlu Penyelesaiannya (Action Plan)</th>
                <th className="p-1.5 border-red-200 text-center w-[14%]">PIC & Target</th>
              </tr>
            </thead>
            <tbody>
              {relevantIncidents.length > 0 ? (
                relevantIncidents.map(inc => (
                  <tr key={inc.id} className="border-b border-slate-200">
                    <td className="p-1.5 border-r border-red-200 text-center font-bold text-slate-900">
                      {inc.lineName}
                      <span className={`block text-[9px] font-extrabold uppercase px-1 rounded mt-0.5 ${
                        inc.severity === 'critical' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {inc.severity === 'critical' ? 'Bottleneck' : 'Warning'}
                      </span>
                    </td>
                    <td className="p-1.5 border-r border-red-200 font-semibold text-slate-800 text-[10px] break-words">
                      {inc.style}
                      <span className="block text-[9px] text-red-600 font-mono">
                        Defisit: -{inc.deficitPcs} pcs
                      </span>
                    </td>
                    <td className="p-1.5 border-r border-red-200 text-[10px] text-slate-800 leading-tight break-words">
                      <p className="font-bold text-red-900 mb-0.5">{inc.title}</p>
                      <p className="text-slate-600">{inc.rootCause}</p>
                    </td>
                    <td className="p-1.5 border-r border-red-200 text-[10px] text-slate-800 leading-tight break-words">
                      <p className="font-bold text-blue-900 mb-0.5">Tindakan Cepat: {inc.correctiveAction}</p>
                      <p className="text-slate-600">Pencegahan (Preventif): {inc.preventiveAction}</p>
                    </td>
                    <td className="p-1.5 border-red-200 text-center text-[10px]">
                      <span className="font-bold text-slate-900 block">{inc.pic}</span>
                      <span className="text-[9px] text-slate-500 block mt-0.5">{inc.targetResolutionTime}</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-3 text-center text-xs text-slate-500">
                    Tidak ada insiden kritis atau bottleneck pada tanggal yang dipilih. Seluruh lini beroperasi on-track.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FORMAL 3-COLUMN SIGN-OFF & APPROVAL: SEMUA NAMA DIHILANGKAN UNTUK DIISI MANUAL */}
      <div className="pt-4 border-t-2 border-slate-800">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="font-extrabold text-xs text-slate-900 uppercase tracking-wide">
              Lembar Pengesahan & Otorisasi Manajemen PT Teratai Widjaja
            </p>
            <p className="text-[10px] text-slate-500">
              Nama pejabat penandatangan dikosongkan untuk diisi secara manual atau ditandatangani basah.
            </p>
          </div>
          <span className="text-[10px] font-mono font-bold text-slate-600 bg-slate-100 border border-slate-300 px-2 py-0.5 rounded">
            Dokumen Verifikasi Lapangan
          </span>
        </div>

        <div className="grid grid-cols-3 gap-4 text-xs">
          
          {/* KOLOM 1: DIBUAT OLEH (CHIEF LINE / SUPERVISOR SEWING) */}
          <div className="p-3 bg-slate-50 border border-slate-300 rounded-lg flex flex-col justify-between h-44">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase">1. Dibuat Oleh:</p>
              <p className="font-extrabold text-slate-900 text-xs mt-0.5">Supervisor Sewing / Chief Line</p>
              <p className="text-[10px] text-slate-500 mt-1">
                Melaporkan aktual harian & kendala lini produksi
              </p>
            </div>
            <div className="text-center pt-2">
              <div className="w-44 border-b border-slate-500 mx-auto"></div>
              <p className="font-bold text-slate-900 text-xs mt-1">
                {supervisorName || '( ......................................... )'}
              </p>
              <p className="text-[10px] text-slate-500">Chief Sewing Line • Tgl: {printDate}</p>
            </div>
          </div>

          {/* KOLOM 2: DIVERIFIKASI OLEH (PRODUCTION ENGINEER) */}
          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg flex flex-col justify-between h-44">
            <div>
              <p className="text-[10px] font-bold text-blue-800 uppercase">2. Diverifikasi Oleh:</p>
              <p className="font-extrabold text-blue-950 text-xs mt-0.5">Production Engineer (PE)</p>
              <p className="text-[10px] text-blue-900 mt-1">
                Validasi waktu baku SMV, layout alur & line balancing
              </p>
            </div>
            <div className="text-center pt-2">
              <div className="w-44 border-b border-blue-500 mx-auto"></div>
              <p className="font-bold text-blue-950 text-xs mt-1">
                {peName || '( ......................................... )'}
              </p>
              <p className="text-[10px] text-blue-700">Production Engineer (PE) • Tgl: {printDate}</p>
            </div>
          </div>

          {/* KOLOM 3: DISETUJUI OLEH (FACTORY MANAGER) */}
          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg flex flex-col justify-between h-44">
            <div>
              <p className="text-[10px] font-bold text-emerald-800 uppercase">3. Disetujui Oleh:</p>
              <p className="font-extrabold text-emerald-950 text-xs mt-0.5">Factory Manager (FM)</p>
              <p className="text-[10px] text-emerald-900 mt-1">
                Otorisasi disposisi perbaikan & kebijakan pabrik
              </p>
            </div>
            <div className="text-center pt-2">
              <div className="w-44 border-b border-emerald-500 mx-auto"></div>
              <p className="font-bold text-emerald-950 text-xs mt-1">
                {fmName || '( ......................................... )'}
              </p>
              <p className="text-[10px] text-emerald-700">Factory Manager • Tgl: {printDate}</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
