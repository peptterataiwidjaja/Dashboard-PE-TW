import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  ExternalLink, 
  Play, 
  RotateCcw, 
  AlertCircle, 
  CheckCircle2, 
  Code2, 
  HelpCircle,
  Clock
} from 'lucide-react';
import { DataSourceState } from '../types';
import { APPS_SCRIPT_TEMPLATE } from '../data/defaultData';

interface GoogleSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  dataSource: DataSourceState;
  onConnect: (url: string) => Promise<void>;
  onResetDefault: () => void;
  onIntervalChange: (intervalSec: number) => void;
}

export const GoogleSheetModal: React.FC<GoogleSheetModalProps> = ({
  isOpen,
  onClose,
  dataSource,
  onConnect,
  onResetDefault,
  onIntervalChange
}) => {
  const [urlInput, setUrlInput] = useState(dataSource.appsScriptUrl || '');
  const [copied, setCopied] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(APPS_SCRIPT_TEMPLATE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleTestAndConnect = async () => {
    setLocalError(null);
    if (!urlInput.trim()) {
      setLocalError('Silakan masukkan URL Web App Google Apps Script Anda.');
      return;
    }
    if (!urlInput.startsWith('https://script.google.com/macros/s/')) {
      setLocalError('Format URL biasanya berawalan https://script.google.com/macros/s/.../exec');
      // Still attempt to connect if the user knows what they are doing
    }
    setIsConnecting(true);
    try {
      await onConnect(urlInput.trim());
      onClose();
    } catch (e: any) {
      setLocalError(e.message || 'Gagal menyambung ke Google Apps Script.');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Integrasi Sumber Google Sheet via Apps Script
              </h2>
              <p className="text-xs text-slate-500">
                Hubungkan lembar kerja Google Sheets Anda secara langsung untuk data real-time
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          
          {/* Status Banner */}
          <div className={`p-3.5 rounded-xl border flex items-start space-x-3 text-xs ${
            dataSource.isLive 
              ? 'bg-blue-50/60 border-blue-200 text-blue-800' 
              : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}>
            {dataSource.isLive ? (
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            ) : (
              <HelpCircle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <p className="font-semibold">
                Status Sumber: {dataSource.isLive ? 'Terhubung ke Google Apps Script (Live)' : 'Menggunakan Data Bawaan (Offline/Lokal)'}
              </p>
              {dataSource.lastSyncTime && (
                <p className="text-[11px] text-slate-500">
                  Sinkronisasi terakhir: {new Date(dataSource.lastSyncTime).toLocaleTimeString('id-ID')}
                </p>
              )}
            </div>
          </div>

          {/* Step-by-step Setup Guide */}
          <div className="space-y-2 text-xs">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
              Langkah Singkat Pengaturan:
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-slate-600 pl-1 leading-relaxed">
              <li>Buka Google Sheets data SMV Anda, lalu pilih <strong>Extensions &gt; Apps Script</strong>.</li>
              <li>Salin kode di bawah ini, tempelkan ke editor script, lalu klik ikon <strong>Save (Simpan)</strong>.</li>
              <li>Klik <strong>Deploy &gt; New deployment</strong>, pilih tipe <strong>Web app</strong>.</li>
              <li>Set <strong>Who has access</strong> menjadi <strong>Anyone</strong>, lalu klik <strong>Deploy</strong>.</li>
              <li>Salin URL Web App yang dihasilkan (berakhiran <code>/exec</code>) dan tempel pada kolom input berikut.</li>
            </ol>
          </div>

          {/* Apps Script Code snippet */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-700">Kode Apps Script (Code.gs):</span>
              <button
                id="btn-copy-code"
                onClick={handleCopyCode}
                className="inline-flex items-center space-x-1 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600">Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin Kode</span>
                  </>
                )}
              </button>
            </div>
            <pre className="bg-slate-900 text-slate-200 p-3.5 rounded-xl text-[11px] font-mono overflow-x-auto max-h-36 leading-tight border border-slate-800">
              {APPS_SCRIPT_TEMPLATE}
            </pre>
          </div>

          {/* Web App URL Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              URL Web App Google Apps Script
            </label>
            <div className="flex space-x-2">
              <input
                id="input-apps-script-url"
                type="url"
                placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="flex-1 text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-slate-800"
              />
              <button
                id="btn-connect-sheet"
                onClick={handleTestAndConnect}
                disabled={isConnecting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all disabled:opacity-50 shrink-0"
              >
                <Play className="w-3.5 h-3.5" />
                <span>{isConnecting ? 'Menghubungkan...' : 'Hubungkan'}</span>
              </button>
            </div>
            {localError && (
              <div className="flex items-center space-x-1.5 text-xs text-rose-600 mt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{localError}</span>
              </div>
            )}
          </div>

          {/* Auto-refresh interval config */}
          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-700 font-medium">Interval Sinkronisasi Real-Time:</span>
            </div>
            <select
              id="select-sync-interval"
              value={dataSource.autoSyncInterval}
              onChange={(e) => onIntervalChange(Number(e.target.value))}
              className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={0}>Manual (Klik tombol refresh)</option>
              <option value={30}>Setiap 30 Detik</option>
              <option value={60}>Setiap 1 Menit</option>
              <option value={300}>Setiap 5 Menit</option>
            </select>
          </div>

          {/* Reset to Default */}
          <div className="pt-2 flex justify-between items-center text-xs">
            <button
              id="btn-reset-default"
              onClick={() => {
                onResetDefault();
                setUrlInput('');
                setLocalError(null);
                onClose();
              }}
              className="text-slate-500 hover:text-slate-800 inline-flex items-center space-x-1 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Gunakan Kembali Data Bawaan (Default Data)</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors"
            >
              Tutup
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
