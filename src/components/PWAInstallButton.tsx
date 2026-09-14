import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, CheckCircle, Info, X, Share2, PlusSquare } from 'lucide-react';

interface PWAInstallButtonProps {
  compact?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [showAndroidGuide, setShowAndroidGuide] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running in standalone Android/PWA mode
  if (isInstalled) {
    if (compact) return null;
    return (
      <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
        <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span className="text-[11px]">Terpasang di Perangkat</span>
      </div>
    );
  }

  // 1. Android / Chrome direct install via beforeinstallprompt
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className={`inline-flex items-center justify-center space-x-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-2xs active:scale-95 transition-all text-xs ${
          compact ? 'px-2.5 py-1' : 'px-3 py-1.5'
        }`}
        title="Pasang aplikasi di perangkat Android"
      >
        <Smartphone className="w-3.5 h-3.5" />
        <span>Instal di Android</span>
      </button>
    );
  }

  // 2. iOS Guide fallback
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className={`inline-flex items-center justify-center space-x-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-bold transition-all text-xs active:scale-95 ${
            compact ? 'px-2 py-1 text-[11px]' : 'px-2.5 py-1.5'
          }`}
          title="Pasang di iPhone / iPad"
        >
          <Download className="w-3.5 h-3.5 text-slate-600" />
          <span>Pasang di iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
            <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl border border-slate-200 text-slate-900">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold">Pasang di iPhone / iPad</h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="py-4 space-y-3 text-xs text-slate-600">
                <div className="flex items-start space-x-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">1</span>
                  <p>Buka menu <strong>Share / Bagikan</strong> (<Share2 className="w-3 h-3 inline mx-0.5" />) di Safari.</p>
                </div>
                <div className="flex items-start space-x-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">2</span>
                  <p>Gulir ke bawah dan ketuk <strong>Tambah ke Layar Utama</strong> (<PlusSquare className="w-3 h-3 inline mx-0.5" />).</p>
                </div>
                <div className="flex items-start space-x-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">3</span>
                  <p>Aplikasi akan terpasang sebagai aplikasi mandiri yang bekerja offline tanpa cloud.</p>
                </div>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl text-xs transition"
              >
                Mengerti
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // 3. Android Guide fallback if prompt not yet captured in browser iframe
  return (
    <>
      <button
        onClick={() => setShowAndroidGuide(true)}
        className={`inline-flex items-center justify-center space-x-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-2xs active:scale-95 transition-all text-xs ${
          compact ? 'px-2.5 py-1' : 'px-3 py-1.5'
        }`}
        title="Petunjuk pasang di Android"
      >
        <Smartphone className="w-3.5 h-3.5" />
        <span>Instal di Android</span>
      </button>

      {showAndroidGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl border border-slate-200 text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Smartphone className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold">Pasang Aplikasi di Android</h3>
              </div>
              <button
                onClick={() => setShowAndroidGuide(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="py-4 space-y-3 text-xs text-slate-600">
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl text-blue-900">
                <p className="font-bold text-[11px] mb-1 text-blue-800">100% Offline &amp; Tanpa Cloud</p>
                <p className="text-[11px] leading-relaxed">
                  Semua rekaman produksi, bank data model, dan kalkulasi SMV tersimpan mandiri di perangkat Android Anda.
                </p>
              </div>

              <div className="flex items-start space-x-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">1</span>
                <p>Buka tautan aplikasi di <strong>Google Chrome</strong> atau browser ponsel Android Anda.</p>
              </div>
              <div className="flex items-start space-x-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">2</span>
                <p>Ketuk tombol <strong>⋮ (titik tiga)</strong> di sudut kanan atas browser.</p>
              </div>
              <div className="flex items-start space-x-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">3</span>
                <p>Pilih <strong>"Instal aplikasi"</strong> atau <strong>"Tambahkan ke Layar Utama"</strong>.</p>
              </div>
            </div>
            <button
              onClick={() => setShowAndroidGuide(false)}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition"
            >
              Tutup Petunjuk
            </button>
          </div>
        </div>
      )}
    </>
  );
};
