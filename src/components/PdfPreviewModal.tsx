import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  Download, 
  Printer, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  Layers,
  ChevronLeft,
  ChevronRight,
  Calendar,
  User,
  Sliders,
  Filter
} from 'lucide-react';
import { LineData, DashboardSummary, MonthlyProductivityRecord, LineIncident } from '../types';
import { formatMonthYearIndonesian, formatIndonesianFullDate, getCurrentYearMonth, getPreviousMonth, getNextMonth } from '../utils/formatters';
import { PdfReportTemplate } from './PdfReportTemplate';
import { IncidentPdfTemplate } from './IncidentPdfTemplate';
import { exportReportToPdf } from '../utils/pdfExport';

interface PdfPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  lines: LineData[];
  summary: DashboardSummary;
  monthlyRecap: MonthlyProductivityRecord[];
  incidents: LineIncident[];
  initialReportType?: 'productivity' | 'incidents';
  initialSelectedMonth?: string;
  canPrintPdf?: boolean;
}

export const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({
  isOpen,
  onClose,
  lines,
  summary,
  monthlyRecap,
  incidents,
  initialReportType = 'productivity',
  initialSelectedMonth,
  canPrintPdf = true
}) => {
  const [reportMode, setReportMode] = useState<'daily' | 'monthly' | 'incidents'>(
    initialReportType === 'incidents' ? 'incidents' : 'daily'
  );
  
  // Available months for reports
  const availableMonths = useMemo(() => {
    const months = Array.from(new Set(monthlyRecap.map(r => r.date ? r.date.substring(0, 7) : null).filter(Boolean))) as string[];
    months.sort().reverse();
    if (months.length > 0) return months;
    if (initialSelectedMonth) return [initialSelectedMonth];
    return [getCurrentYearMonth()];
  }, [monthlyRecap, initialSelectedMonth]);

  // Selected Month (Bulan & Tahun) - used for both Daily and Monthly reports
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    return initialSelectedMonth || (availableMonths.length > 0 ? availableMonths[0] : getCurrentYearMonth());
  });

  // Filter records belonging to selected month
  const monthRecords = useMemo(() => {
    if (!selectedMonth) return monthlyRecap;
    return monthlyRecap.filter(r => r.date && r.date.startsWith(selectedMonth));
  }, [monthlyRecap, selectedMonth]);

  // Available dates specifically within the selected month (sorted chronologically)
  const monthDates = useMemo(() => {
    return Array.from(new Set(monthRecords.map(r => r.date).filter(Boolean))).sort();
  }, [monthRecords]);

  // Record counts per day
  const dateCounts = useMemo(() => {
    const map = new Map<string, number>();
    monthRecords.forEach(r => {
      if (r.date) {
        map.set(r.date, (map.get(r.date) || 0) + 1);
      }
    });
    return map;
  }, [monthRecords]);

  // Default selected date to 'all' (shows all daily records in the chosen month)
  const [selectedDate, setSelectedDate] = useState<string>('all');

  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isExporting, setIsExporting] = useState(false);
  const [showSignOptions, setShowSignOptions] = useState(false);

  // Sync selectedMonth when initialSelectedMonth changes or modal opens
  useEffect(() => {
    if (initialSelectedMonth) {
      setSelectedMonth(initialSelectedMonth);
      setSelectedDate('all');
    }
  }, [initialSelectedMonth, isOpen]);

  // Manual Name inputs (Default empty string per user request: "untuk semua nama dihilangkan sehingga akan disi manual")
  const [supervisorName, setSupervisorName] = useState<string>('');
  const [peName, setPeName] = useState<string>('');
  const [fmName, setFmName] = useState<string>('');

  // Sync initial report type and mobile responsive zoom when opening
  React.useEffect(() => {
    if (isOpen) {
      if (initialReportType === 'incidents') {
        setReportMode('incidents');
      } else {
        setReportMode('daily');
      }
      if (typeof window !== 'undefined' && window.innerWidth < 640) {
        setZoomLevel(45);
      } else {
        setZoomLevel(100);
      }
    }
  }, [isOpen, initialReportType]);

  if (!isOpen) return null;

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 15, 140));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 15, 60));
  };

  const handleResetZoom = () => {
    setZoomLevel(100);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    if (!canPrintPdf) {
      alert('Perhatian: Akun Monitor hanya memiliki akses memantau. Silakan login sebagai Akun PE untuk mengunduh atau mencetak dokumen resmi PDF.');
      return;
    }
    setIsExporting(true);
    try {
      const elementId = reportMode === 'incidents' ? 'printable-incident-report' : 'printable-pdf-report';
      const filename = reportMode === 'incidents'
        ? `Laporan_Disposisi_Hambatan_Line_${Date.now()}.pdf`
        : reportMode === 'daily'
          ? `Laporan_Produksi_Harian_${selectedDate}_${Date.now()}.pdf`
          : `Laporan_Rekapitulasi_Bulanan_${selectedMonth}_${Date.now()}.pdf`;

      await exportReportToPdf(elementId, filename);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Gagal membuat file PDF secara otomatis. Membuka dialog cetak browser sebagai alternatif...');
      window.print();
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/85 backdrop-blur-sm flex flex-col animate-in fade-in duration-150 pdf-preview-modal-backdrop">
      
      {/* Top Toolbar */}
      <div className="bg-slate-900 border-b border-slate-800 text-white px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 shadow-md z-10 pdf-preview-toolbar">
        
        {/* Left: Document Info */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 shadow-sm">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold tracking-tight">Cetak & Pratinjau Dokumen PDF</h3>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-mono font-bold border border-blue-400/30">
                A4 Landscape
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Laporan harian per tanggal, laporan bulanan, dan nama penandatangan manual
            </p>
          </div>
        </div>

        {/* Center: Mode Switcher (Harian per tanggal vs Bulanan vs Disposisi) */}
        <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs w-full sm:w-auto">
          <button
            onClick={() => setReportMode('daily')}
            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
              reportMode === 'daily'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Laporan Harian</span>
          </button>

          <button
            onClick={() => setReportMode('monthly')}
            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
              reportMode === 'monthly'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Laporan Bulanan</span>
          </button>

          <button
            onClick={() => setReportMode('incidents')}
            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
              reportMode === 'incidents'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
            <span>Disposisi Hambatan ({incidents.length})</span>
          </button>
        </div>

        {/* Right: Zoom Controls & Action Buttons */}
        <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto space-x-2 sm:space-x-3">
          
          {/* Zoom Buttons */}
          <div className="flex items-center bg-slate-800 rounded-lg border border-slate-700 text-xs text-slate-300 px-1 py-0.5">
            <button
              onClick={handleZoomOut}
              className="p-1 sm:p-1.5 hover:text-white rounded hover:bg-slate-700 transition-colors cursor-pointer"
              title="Perkecil (-)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={handleResetZoom}
              className="px-1.5 sm:px-2 font-mono text-[10px] sm:text-[11px] font-bold hover:text-white cursor-pointer"
              title="Reset ke 100%"
            >
              {zoomLevel}%
            </button>
            <button
              onClick={handleZoomIn}
              className="p-1 sm:p-1.5 hover:text-white rounded hover:bg-slate-700 transition-colors cursor-pointer"
              title="Perbesar (+)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center space-x-1.5">
            {/* Toggle Isi Nama Manual */}
            <button
              onClick={() => setShowSignOptions(!showSignOptions)}
              className={`inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                showSignOptions ? 'bg-amber-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
              title="Isi nama penandatangan manual"
            >
              <User className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Nama Manual</span>
            </button>

            {/* Cetak Sekarang (Print Dialog) */}
            <button
              onClick={handlePrint}
              className="inline-flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 rounded-xl text-xs font-bold transition-colors active:scale-95 cursor-pointer"
              title="Cetak dokumen langsung menggunakan printer browser"
            >
              <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-300" />
              <span className="hidden sm:inline">Cetak</span>
            </button>

            {/* Unduh File PDF */}
            <button
              onClick={handleDownload}
              disabled={isExporting}
              className="inline-flex items-center space-x-1.5 px-3 sm:px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-900/40 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              title="Download dokumen sebagai file PDF"
            >
              <Download className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isExporting ? 'animate-bounce' : ''}`} />
              <span className="sm:hidden">{isExporting ? 'Proses...' : 'Unduh'}</span>
              <span className="hidden sm:inline">{isExporting ? 'Memproses PDF...' : 'Unduh PDF'}</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors ml-1 cursor-pointer"
              title="Tutup Pratinjau"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

        </div>

      </div>

      {/* Filter / Customization Sub-bar */}
      <div className="bg-slate-900/95 border-b border-slate-800/80 px-4 sm:px-6 py-2.5 text-xs text-slate-300 flex flex-col gap-2.5 no-print">
        
        {/* Tier 1: Bulan & Tahun Filter for Daily & Monthly Reports */}
        {(reportMode === 'daily' || reportMode === 'monthly') ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <span className="text-slate-400 font-bold flex items-center space-x-1.5 shrink-0">
                <Calendar className={`w-3.5 h-3.5 ${reportMode === 'daily' ? 'text-blue-400' : 'text-emerald-400'}`} />
                <span>Bulan & Tahun:</span>
              </span>

              {/* Month Navigation Prev / Next */}
              <div className="flex items-center space-x-1 bg-slate-800 border border-slate-700 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMonth(getPreviousMonth(selectedMonth));
                    setSelectedDate('all');
                  }}
                  className="p-1 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="Bulan Sebelumnya"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => {
                    if (e.target.value) {
                      setSelectedMonth(e.target.value);
                      setSelectedDate('all');
                    }
                  }}
                  className="px-2 py-0.5 bg-transparent border-0 text-xs font-bold text-white focus:outline-none focus:ring-0 cursor-pointer"
                  title="Pilih Bulan & Tahun Laporan"
                />
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMonth(getNextMonth(selectedMonth));
                    setSelectedDate('all');
                  }}
                  className="p-1 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="Bulan Berikutnya"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Dropdown if multiple months available */}
              {availableMonths.length > 1 && (
                <select
                  value={selectedMonth}
                  onChange={(e) => {
                    setSelectedMonth(e.target.value);
                    setSelectedDate('all');
                  }}
                  className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs font-bold text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  {availableMonths.map(m => (
                    <option key={m} value={m}>
                      {formatMonthYearIndonesian(m)}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <span className={`text-[11px] px-2.5 py-1 rounded-lg font-medium shrink-0 ${
                reportMode === 'daily' 
                  ? 'text-blue-300 bg-blue-950/70 border border-blue-800' 
                  : 'text-emerald-300 bg-emerald-950/70 border border-emerald-800'
              }`}>
                {reportMode === 'daily'
                  ? `Rekap Periode: ${formatMonthYearIndonesian(selectedMonth)} • Total ${monthRecords.length} Data Lini`
                  : `Laporan Rekapitulasi Bulanan: ${formatMonthYearIndonesian(selectedMonth)} • Total ${monthRecords.length} Data Lini`}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-2 text-xs text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
            <span className="font-semibold">
              Formulir Khusus Disposisi Hambatan Line Sewing & Tindakan Penyelesaian (CAPA)
            </span>
            <span className="text-[11px] px-2 py-0.5 bg-red-950/80 border border-red-800 text-red-300 rounded font-mono font-bold">
              {incidents.length} kasus memerlukan disposisi
            </span>
          </div>
        )}

        {/* Tier 2: Dedicated "Pilihan Per Hari Data" for Laporan Harian */}
        {reportMode === 'daily' && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
            <div className="flex items-center space-x-1.5 shrink-0">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
              <span className="text-xs font-bold text-slate-200">Pilihan Per Hari Data:</span>
            </div>

            {/* Quick buttons per day */}
            <div className="flex items-center flex-wrap gap-1.5">
              {/* Button: Semua Hari */}
              <button
                type="button"
                onClick={() => setSelectedDate('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                  selectedDate === 'all'
                    ? 'bg-blue-600 text-white shadow ring-2 ring-blue-400/60'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                }`}
                title="Tampilkan semua rekap harian dalam bulan ini"
              >
                <span>Semua Hari</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                  selectedDate === 'all' ? 'bg-blue-700 text-blue-100' : 'bg-slate-700 text-slate-400'
                }`}>
                  {monthRecords.length}
                </span>
              </button>

              {/* Day Pills for each recorded date in this month */}
              {monthDates.map(d => {
                const dayNum = d.split('-')[2] || d;
                const count = dateCounts.get(d) || 0;
                const isSelected = selectedDate === d;
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setSelectedDate(d)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white font-bold shadow ring-2 ring-blue-400/80'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                    }`}
                    title={`Pilih Laporan Harian Tanggal ${formatIndonesianFullDate(d)} (${count} lini sewing)`}
                  >
                    <span>Tgl {dayNum}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                      isSelected ? 'bg-blue-700 text-blue-100 font-bold' : 'bg-slate-700 text-slate-400'
                    }`}>
                      {count} lini
                    </span>
                  </button>
                );
              })}

              {/* Date picker input if user wants to select any date manually */}
              <div className="flex items-center space-x-1 pl-1.5 border-l border-slate-700">
                <span className="text-[11px] text-slate-400 hidden sm:inline">Pilih Kalender:</span>
                <input
                  type="date"
                  value={selectedDate === 'all' ? '' : selectedDate}
                  onChange={(e) => {
                    if (e.target.value) {
                      setSelectedDate(e.target.value);
                      const m = e.target.value.substring(0, 7);
                      if (m !== selectedMonth) {
                        setSelectedMonth(m);
                      }
                    } else {
                      setSelectedDate('all');
                    }
                  }}
                  className="px-2 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                  title="Pilih tanggal spesifik dari kalender"
                />
              </div>
            </div>

            {/* Active Date Indicator info */}
            <div className="ml-auto text-[11px] text-slate-400 flex items-center space-x-1">
              {selectedDate === 'all' ? (
                <span className="text-blue-300 font-medium">
                  Menampilkan rekap harian semua tanggal ({monthRecords.length} lini)
                </span>
              ) : (
                <span className="text-emerald-300 font-medium flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 inline" />
                  <span>Aktif: <strong>{formatIndonesianFullDate(selectedDate)}</strong> ({monthRecords.filter(r => r.date === selectedDate).length} Lini)</span>
                </span>
              )}
            </div>
          </div>
        )}

        {/* Quick status of manual signatures */}
        <div className="flex items-center space-x-2 text-[11px] text-slate-400">
          <span>Status Nama Penandatangan:</span>
          <span className={`px-2 py-0.5 rounded font-bold ${
            supervisorName || peName || fmName ? 'bg-amber-900/60 text-amber-300 border border-amber-700' : 'bg-slate-800 text-slate-400'
          }`}>
            {supervisorName || peName || fmName ? 'Telah Diisi Manual' : 'Kosong (Untuk Tanda Tangan Basah)'}
          </span>
        </div>
      </div>

      {/* Collapsible Manual Signatures Setup Bar */}
      {showSignOptions && (
        <div className="bg-slate-800/90 border-b border-slate-700 px-6 py-3 text-xs animate-in slide-in-from-top-2 duration-150 no-print">
          <div className="flex items-center justify-between mb-2">
            <span className="font-extrabold text-white text-xs uppercase tracking-wide flex items-center space-x-1.5">
              <User className="w-4 h-4 text-amber-400" />
              <span>Input Manual Nama Pejabat Penandatangan:</span>
            </span>
            <span className="text-[11px] text-slate-400">
              *Bila dikosongkan, PDF akan menampilkan garis kosong <code>( ............................. )</code>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                1. Supervisor Sewing / Chief Line
              </label>
              <input
                type="text"
                placeholder="Kosong untuk tanda tangan basah..."
                value={supervisorName}
                onChange={(e) => setSupervisorName(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                2. Production Engineer (PE)
              </label>
              <input
                type="text"
                placeholder="Kosong untuk tanda tangan basah..."
                value={peName}
                onChange={(e) => setPeName(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                3. Factory Manager (FM)
              </label>
              <input
                type="text"
                placeholder="Kosong untuk tanda tangan basah..."
                value={fmName}
                onChange={(e) => setFmName(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Preview Canvas (Paper Workspace) */}
      <div className="flex-1 overflow-auto p-2 sm:p-6 lg:p-8 bg-slate-950/80 flex justify-center items-start min-h-0 w-full">
        <div 
          className="transition-transform duration-150 origin-top flex flex-col items-center pdf-preview-paper w-full max-w-[1040px]"
          style={{ 
            transform: `scale(${zoomLevel / 100})`,
            transformOrigin: 'top center'
          }}
        >
          {reportMode === 'incidents' ? (
            <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-300 w-full max-w-[1040px]">
              <IncidentPdfTemplate
                incidents={incidents}
                supervisorName={supervisorName}
                peName={peName}
                fmName={fmName}
              />
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-300 w-full max-w-[1040px]">
              <PdfReportTemplate
                lines={lines}
                summary={summary}
                monthlyRecap={monthlyRecap}
                incidents={incidents}
                reportMode={reportMode}
                selectedDate={selectedDate}
                selectedMonth={selectedMonth}
                supervisorName={supervisorName}
                peName={peName}
                fmName={fmName}
              />
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
