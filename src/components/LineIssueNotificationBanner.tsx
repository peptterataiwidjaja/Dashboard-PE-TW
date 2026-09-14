import React, { useState } from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  ChevronRight, 
  FileText, 
  Printer, 
  CheckCircle2, 
  X, 
  Bell,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { LineIncident } from '../types';

interface LineIssueNotificationBannerProps {
  incidents: LineIncident[];
  onOpenModal: () => void;
  onPrintPdf: () => void;
}

export const LineIssueNotificationBanner: React.FC<LineIssueNotificationBannerProps> = ({
  incidents,
  onOpenModal,
  onPrintPdf
}) => {
  const [isDismissed, setIsDismissed] = useState(false);

  if (incidents.length === 0 || isDismissed) {
    return null;
  }

  const criticalCount = incidents.filter(i => i.severity === 'critical').length;
  const warningCount = incidents.filter(i => i.severity === 'warning').length;
  const fullyApprovedCount = incidents.filter(i => i.peVerified && i.fmApproved).length;

  return (
    <div className="mb-5 rounded-2xl bg-linear-to-r from-red-50 via-amber-50 to-blue-50 border-2 border-red-300/80 p-4 sm:p-5 shadow-sm relative overflow-hidden transition-all">
      {/* Decorative corporate top border */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-red-600 via-amber-500 to-blue-700"></div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Left Side: Icon & Alert Description */}
        <div className="flex items-start space-x-3 sm:space-x-4">
          <div className="p-2.5 bg-red-600 text-white rounded-xl shadow-sm shrink-0 animate-pulse">
            <ShieldAlert className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-black uppercase tracking-wider bg-red-600 text-white">
                Peringatan Bottleneck & Hambatan Line
              </span>
              <span className="text-xs font-bold text-slate-800">
                Terdeteksi {incidents.length} Lini Memerlukan Tindakan Cepat
              </span>
              {criticalCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-100 text-red-700 border border-red-200">
                  {criticalCount} Kritis
                </span>
              )}
              {warningCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
                  {warningCount} Warning
                </span>
              )}
              {fullyApprovedCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{fullyApprovedCount}/{incidents.length} Disetujui PE & FM</span>
                </span>
              )}
            </div>

            {/* List of problematic lines */}
            <div className="flex flex-wrap gap-2 pt-1 text-xs">
              {incidents.map((inc) => (
                <div 
                  key={inc.id}
                  onClick={onOpenModal}
                  className="cursor-pointer group flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-white/90 border border-red-200 hover:border-red-400 hover:bg-white transition-colors text-slate-700 shadow-2xs"
                >
                  <span className={`w-2 h-2 rounded-full ${inc.severity === 'critical' ? 'bg-red-600' : 'bg-amber-500'}`}></span>
                  <span className="font-bold text-slate-900">{inc.lineName}</span>
                  <span className="text-slate-400">({inc.style}):</span>
                  <span className="text-red-700 font-semibold truncate max-w-[200px] sm:max-w-[260px]">
                    {inc.description}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-red-600 transition-colors" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto shrink-0">
          <button
            onClick={onOpenModal}
            className="px-3 py-2 rounded-xl text-xs font-bold text-red-700 bg-white hover:bg-red-50 border border-red-300 shadow-2xs transition-colors flex items-center justify-center space-x-1.5 active:scale-95"
          >
            <FileText className="w-4 h-4 text-red-600" />
            <span>Form Disposisi & CAPA</span>
          </button>

          <button
            onClick={onPrintPdf}
            className="px-3.5 py-2 rounded-xl text-xs font-extrabold text-white bg-[#1a3478] hover:bg-blue-900 shadow-sm shadow-blue-900/20 active:scale-95 transition-all flex items-center justify-center space-x-2"
          >
            <Printer className="w-4 h-4" />
            <span className="sm:hidden">Cetak Disetujui</span>
            <span className="hidden sm:inline">Cetak PDF Disetujui PE & FM</span>
          </button>

          <button
            onClick={() => setIsDismissed(true)}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-black/5 transition-colors self-end sm:self-center"
            title="Sembunyikan Sementara"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
