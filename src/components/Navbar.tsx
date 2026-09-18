import React from 'react';
import { 
  FileSpreadsheet, 
  FileText,
  Download, 
  RefreshCw, 
  Activity, 
  Layers, 
  SlidersHorizontal,
  CheckCircle2, 
  AlertCircle,
  ClipboardList,
  Database,
  Plus,
  ShieldAlert,
  ShieldCheck,
  Bell,
  BellRing,
  Calendar,
  Zap,
  ChevronLeft,
  ChevronRight,
  HardDrive
} from 'lucide-react';
import { DataSourceState, LineIncident, AuthUser } from '../types';
import { CompanyLogo } from './CompanyLogo';
import { formatMonthYearIndonesian, getPreviousMonth, getNextMonth } from '../utils/formatters';
import { PWAInstallButton } from './PWAInstallButton';

export type NavTabType = 'overview' | 'style-schedule' | 'scenario-analysis' | 'monthly-recap' | 'repair-defect' | 'bank-data' | 'daily-smv' | 'revenue' | 'data-matrix';

interface NavbarProps {
  dataSource: DataSourceState;
  onOpenSheetModal: () => void;
  onExportPdf: () => void;
  onManualRefresh: () => void;
  isExporting: boolean;
  activeTab: NavTabType;
  onTabChange: (tab: NavTabType) => void;
  onOpenInputModal?: () => void;
  onOpenBankDataModal?: () => void;
  onOpenMonthlyPlanModal?: () => void;
  incidents?: LineIncident[];
  onOpenIncidentModal?: () => void;
  unreadPushCount?: number;
  onOpenPushModal?: () => void;
  overlapCount?: number;
  repairCriticalCount?: number;
  selectedMonth?: string;
  onMonthChange?: (month: string) => void;
  onOpenBackupModal?: () => void;
  currentUser?: AuthUser;
  onOpenLoginModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  dataSource,
  onOpenSheetModal,
  onExportPdf,
  onManualRefresh,
  isExporting,
  activeTab,
  onTabChange,
  onOpenInputModal,
  onOpenBankDataModal,
  onOpenMonthlyPlanModal,
  incidents = [],
  onOpenIncidentModal,
  unreadPushCount = 0,
  onOpenPushModal,
  overlapCount = 0,
  repairCriticalCount = 0,
  selectedMonth,
  onMonthChange,
  onOpenBackupModal,
  currentUser,
  onOpenLoginModal
}) => {
  const criticalCount = incidents.filter(i => i.severity === 'critical').length;
  const pendingApprovalCount = incidents.filter(i => !i.peVerified || !i.fmApproved).length;

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-2xs">
      {/* Top corporate accent strip: Blue & Red */}
      <div className="h-1.5 w-full bg-linear-to-r from-blue-700 via-blue-600 via-50% to-red-600"></div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-20 gap-2">
          
          {/* Logo PT Teratai Widjaja */}
          <div className="flex items-center space-x-2 sm:space-x-3 cursor-pointer shrink-0" onClick={() => onTabChange('overview')}>
            <CompanyLogo size="md" showSubtitle={true} />
          </div>

          {/* Center Month Selector */}
          {selectedMonth && onMonthChange && (
            <div className="flex items-center bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl px-1.5 sm:px-2.5 py-1 sm:py-1.5 transition-all shadow-2xs">
              <button
                id="btn-navbar-prev-month"
                type="button"
                onClick={() => onMonthChange(getPreviousMonth(selectedMonth))}
                className="p-1 hover:bg-white rounded-lg text-slate-600 hover:text-blue-700 transition-all active:scale-90"
                title="Bulan Sebelumnya"
                aria-label="Bulan Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center space-x-1 sm:space-x-2 px-1 sm:px-2">
                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 shrink-0" />
                <div className="flex flex-col items-start">
                  <span className="hidden sm:inline text-[10px] font-semibold text-slate-600 uppercase tracking-wider">
                    Bulan & Tahun
                  </span>
                  <input
                    id="input-navbar-month"
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => e.target.value && onMonthChange(e.target.value)}
                    className="text-xs sm:text-sm font-black text-slate-900 bg-transparent border-0 p-0 focus:ring-0 cursor-pointer"
                    title="Pilih Bulan & Tahun Dashboard"
                  />
                </div>
              </div>

              <button
                id="btn-navbar-next-month"
                type="button"
                onClick={() => onMonthChange(getNextMonth(selectedMonth))}
                className="p-1 hover:bg-white rounded-lg text-slate-600 hover:text-blue-700 transition-all active:scale-90"
                title="Bulan Berikutnya"
                aria-label="Bulan Berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
            {/* NOTIFIKASI LONCENG SAJA (Bell Icon Only) */}
            {onOpenPushModal && (
              <button
                id="btn-bell-notifications"
                onClick={onOpenPushModal}
                className="relative p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl text-slate-700 hover:text-blue-700 hover:bg-slate-100 transition-all border border-slate-200 shadow-2xs active:scale-95"
                title="Pemberitahuan & Kendala Produksi"
                aria-label="Pemberitahuan"
              >
                <Bell className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${unreadPushCount > 0 ? 'text-amber-500 fill-amber-500/20' : 'text-slate-600'}`} />
                {unreadPushCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] sm:min-w-[18px] h-[16px] sm:h-[18px] px-1 rounded-full bg-red-600 text-white text-[9px] sm:text-[10px] font-black flex items-center justify-center shadow-xs ring-2 ring-white animate-in zoom-in duration-150">
                    {unreadPushCount > 9 ? '9+' : unreadPushCount}
                  </span>
                )}
              </button>
            )}

            {/* NOTIFIKASI KENDALA LINE & BOTTLENECK BUTTON */}
            {incidents.length > 0 && onOpenIncidentModal && (
              <button
                id="btn-incident-alerts"
                onClick={onOpenIncidentModal}
                className={`relative inline-flex items-center space-x-1 sm:space-x-1.5 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs font-black transition-all shadow-2xs ${
                  criticalCount > 0
                    ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
                    : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                }`}
                title="Peringatan Hambatan Line / Bottleneck - Klik untuk Persetujuan PE & FM"
              >
                <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">
                  {incidents.length} Kendala Line
                </span>
                <span className="sm:hidden font-mono">{incidents.length}</span>
                {pendingApprovalCount > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                )}
              </button>
            )}

            {/* PWA Install Button for Android */}
            <PWAInstallButton compact={true} />

            {/* Cadangan & Pulihkan Data Lokal (No Cloud) */}
            {onOpenBackupModal && (
              <button
                id="btn-navbar-backup"
                onClick={onOpenBackupModal}
                className="inline-flex items-center space-x-1 sm:space-x-1.5 p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-slate-700 hover:text-blue-700 hover:bg-slate-100 border border-slate-200 transition-colors text-xs font-semibold"
                title="Cadangkan & Pulihkan Data Lokal (Offline Tanpa Cloud)"
              >
                <HardDrive className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
                <span className="hidden xl:inline">Cadangan Lokal</span>
              </button>
            )}

            {/* Manual Refresh */}
            <button
              id="btn-refresh-data"
              onClick={onManualRefresh}
              disabled={dataSource.status === 'syncing'}
              className="p-1.5 sm:p-2 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 transition-colors"
              title="Segarkan Data Real-Time"
            >
              <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${dataSource.status === 'syncing' ? 'animate-spin text-blue-600' : ''}`} />
            </button>

            {/* 2 ACCESS SECURITY BADGE & LOGIN SWITCHER */}
            {onOpenLoginModal && (
              <button
                id="btn-navbar-auth-security"
                onClick={onOpenLoginModal}
                className={`inline-flex items-center space-x-1 sm:space-x-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs font-bold transition-all border shadow-2xs active:scale-95 cursor-pointer ${
                  currentUser?.role === 'PE'
                    ? 'bg-blue-50 hover:bg-blue-100 text-blue-900 border-blue-300'
                    : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
                }`}
                title={
                  currentUser?.role === 'PE'
                    ? 'Hak Akses: Akun PE (Akses Penuh & Input). Klik untuk berganti akun'
                    : 'Hak Akses: Akun Monitor (Hanya Memantau). Klik untuk login akun PE'
                }
              >
                <ShieldCheck className={`w-3.5 h-3.5 ${currentUser?.role === 'PE' ? 'text-blue-700' : 'text-amber-600'}`} />
                <span className="hidden md:inline">
                  {currentUser?.role === 'PE' ? 'Akun PE (Input)' : 'Akun Monitor'}
                </span>
                <span className="md:hidden font-bold text-[10px]">
                  {currentUser?.role === 'PE' ? 'PE' : 'Pantau'}
                </span>
              </button>
            )}

            {/* Preview & Cetak PDF Button */}
            <button
              id="btn-export-pdf"
              onClick={onExportPdf}
              disabled={isExporting}
              className={`inline-flex items-center space-x-1 sm:space-x-1.5 px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer ${
                activeTab === 'repair-defect'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200'
              }`}
              title={
                activeTab === 'repair-defect'
                  ? 'Buka Pratinjau & Cetak Laporan Rekapitulasi Repair Harian'
                  : 'Buka Pratinjau Dokumen PDF Sebelum Dicetak atau Diunduh'
              }
            >
              <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">
                {activeTab === 'repair-defect' ? 'Cetak Rekap Repair' : 'Preview PDF'}
              </span>
              <span className="sm:hidden">
                {activeTab === 'repair-defect' ? 'Repair' : 'PDF'}
              </span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs with Edge-to-Edge Touch Scrolling on Mobile */}
        <div className="flex items-center space-x-1 sm:space-x-2 border-t border-slate-100 py-1.5 sm:py-2 -mx-3 px-3 sm:mx-0 sm:px-0 overflow-x-auto no-scrollbar touch-pan-x">
          <button
            id="tab-overview"
            onClick={() => onTabChange('overview')}
            className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs sm:text-sm font-bold whitespace-nowrap transition-all active:scale-95 ${
              activeTab === 'overview'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span className="sm:hidden">Ikhtisar</span>
            <span className="hidden sm:inline">Ikhtisar & KPI</span>
          </button>

          {/* TAB: JADWAL STYLE SEWING */}
          <button
            id="tab-style-schedule"
            onClick={() => onTabChange('style-schedule')}
            className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center space-x-1 sm:space-x-1.5 active:scale-95 ${
              activeTab === 'style-schedule'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span className="sm:hidden">Jadwal Style</span>
            <span className="hidden sm:inline">Jadwal Style Sewing</span>
            {overlapCount > 0 ? (
              <span className="inline-flex items-center px-1.5 py-0.2 rounded-full bg-red-600 text-white text-[9px] font-black animate-pulse">
                ⚡ {overlapCount}
              </span>
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            )}
          </button>

          {/* TAB BARU: ANALISIS SKENARIO 5 HARI KERJA & OT */}
          <button
            id="tab-scenario-analysis"
            onClick={() => onTabChange('scenario-analysis')}
            className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center space-x-1 sm:space-x-1.5 active:scale-95 ${
              activeTab === 'scenario-analysis'
                ? 'bg-blue-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="sm:hidden">Skenario 5 Hari</span>
            <span className="hidden sm:inline">Skenario 5 vs 6 Hari & OT</span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
          </button>

          <button
            id="tab-monthly-recap"
            onClick={() => onTabChange('monthly-recap')}
            className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center space-x-1 sm:space-x-1.5 active:scale-95 ${
              activeTab === 'monthly-recap'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span className="sm:hidden">Rekap Harian</span>
            <span className="hidden sm:inline">Rekap Harian & Analisis</span>
            <span className={`w-1.5 h-1.5 rounded-full ${activeTab === 'monthly-recap' ? 'bg-red-400' : 'bg-red-500'}`}></span>
          </button>

          {/* TAB BARU: REPAIR & DEFECT PER LINE (FISHBONE ANALISIS) */}
          <button
            id="tab-repair-defect"
            onClick={() => onTabChange('repair-defect')}
            className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center space-x-1 sm:space-x-1.5 active:scale-95 ${
              activeTab === 'repair-defect'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span className="sm:hidden">Repair & Defect</span>
            <span className="hidden sm:inline">Repair & Defect (Fishbone)</span>
            {repairCriticalCount > 0 ? (
              <span className="inline-flex items-center px-1.5 py-0.2 rounded-full bg-red-800 text-white text-[9px] font-black animate-pulse">
                ≥10% ({repairCriticalCount})
              </span>
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            )}
          </button>

          <button
            id="tab-bank-data"
            onClick={() => onTabChange('bank-data')}
            className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center space-x-1 sm:space-x-1.5 active:scale-95 ${
              activeTab === 'bank-data'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span className="sm:hidden">Bank Data</span>
            <span className="hidden sm:inline">Bank Data Model & Target</span>
          </button>

          <button
            id="tab-daily-smv"
            onClick={() => onTabChange('daily-smv')}
            className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs sm:text-sm font-bold whitespace-nowrap transition-all active:scale-95 ${
              activeTab === 'daily-smv'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span className="sm:hidden">Tren SMV</span>
            <span className="hidden sm:inline">Analisis Tren SMV</span>
          </button>

          <button
            id="tab-revenue"
            onClick={() => onTabChange('revenue')}
            className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs sm:text-sm font-bold whitespace-nowrap transition-all active:scale-95 ${
              activeTab === 'revenue'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span className="sm:hidden">Revenue</span>
            <span className="hidden sm:inline">Kinerja Revenue</span>
          </button>

          <button
            id="tab-matrix"
            onClick={() => onTabChange('data-matrix')}
            className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs sm:text-sm font-bold whitespace-nowrap transition-all active:scale-95 ${
              activeTab === 'data-matrix'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span className="sm:hidden">Matriks SMV</span>
            <span className="hidden sm:inline">Matriks Lengkap SMV</span>
          </button>
        </div>
      </div>
    </header>
  );
};
