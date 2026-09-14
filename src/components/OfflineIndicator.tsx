import React, { useState } from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { HardDrive, Wifi, WifiOff, X, ShieldCheck } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  if (!isOnline) {
    return (
      <div className="fixed bottom-4 left-4 z-40 flex items-center space-x-2.5 rounded-xl bg-amber-600/95 backdrop-blur-md px-3.5 py-2 text-xs font-semibold text-white shadow-xl border border-amber-400/40 animate-in slide-in-from-bottom-3 duration-200">
        <WifiOff className="w-4 h-4 text-amber-100 shrink-0" />
        <div>
          <p className="leading-tight">Mode Offline Aktif</p>
          <p className="text-[10px] text-amber-100 font-normal">Aplikasi &amp; data lokal tetap berfungsi penuh tanpa koneksi internet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 z-40 hidden sm:flex items-center space-x-2 rounded-xl bg-slate-900/90 backdrop-blur-md px-3 py-1.5 text-[11px] font-medium text-slate-200 shadow-lg border border-slate-700/60">
      <HardDrive className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
      <span>Penyimpanan Lokal Mandiri (Tanpa Cloud)</span>
      <button 
        onClick={() => setIsDismissed(true)}
        className="ml-1 text-slate-400 hover:text-white p-0.5"
        title="Tutup info"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
};
