import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Eye, 
  Lock, 
  User, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  FileText, 
  PlusCircle, 
  ShieldAlert,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { AuthUser, UserRole } from '../types';
import { loginWithCredentials, DEFAULT_PE_USER, DEFAULT_MONITOR_USER } from '../services/authService';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser;
  onLoginSuccess?: (user: AuthUser) => void;
  onSelectUser?: (user: AuthUser) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLoginSuccess,
  onSelectUser
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'quick' | 'manual'>('quick');

  if (!isOpen) return null;

  const notifySuccess = (user: AuthUser) => {
    if (typeof onLoginSuccess === 'function') {
      onLoginSuccess(user);
    }
    if (typeof onSelectUser === 'function') {
      onSelectUser(user);
    }
    onClose();
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const user = loginWithCredentials(username, password);
    if (user) {
      notifySuccess(user);
    } else {
      setErrorMsg('Username atau Password/PIN salah. Gunakan kredensial resmi PT Teratai Widjaja.');
    }
  };

  const handleQuickLogin = (role: UserRole) => {
    const user = role === 'PE' ? DEFAULT_PE_USER : DEFAULT_MONITOR_USER;
    notifySuccess(user);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden text-slate-900">
        
        {/* Header */}
        <div className="px-6 py-4 bg-[#1a3478] text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-blue-200">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Keamanan &amp; Hak Akses Akun</h3>
              <p className="text-xs text-blue-200">PT Teratai Widjaja — Garment Production System</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1 rounded-lg transition"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active User Status Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-2.5 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">Sesi Aktif Saat Ini:</span>
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
              currentUser.role === 'PE' 
                ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                : 'bg-amber-100 text-amber-800 border border-amber-200'
            }`}>
              {currentUser.role === 'PE' ? '🛡️ Akun PE (Full Access)' : '👁️ Akun Monitor (Hanya Pantau)'}
            </span>
            <span className="font-bold text-slate-800">{currentUser.name}</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">

          {/* Mode Switch Tabs */}
          <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => { setActiveTab('quick'); setErrorMsg(null); }}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'quick' ? 'bg-white text-[#1a3478] shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pilih Akses Cepat (1-Sentuhan)
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('manual'); setErrorMsg(null); }}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'manual' ? 'bg-white text-[#1a3478] shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Masuk dengan Password / PIN
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2 text-xs text-rose-700 font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {activeTab === 'quick' ? (
            <div className="space-y-3.5">
              <p className="text-xs text-slate-500">
                Pilih profil akun yang sesuai dengan tugas Anda. Pada sistem offline ini, Anda dapat beralih peran secara instan:
              </p>

              {/* Akun PE Card */}
              <div 
                onClick={() => handleQuickLogin('PE')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  currentUser.role === 'PE'
                    ? 'border-blue-600 bg-blue-50/50 shadow-xs'
                    : 'border-slate-200 hover:border-blue-400 bg-white hover:bg-blue-50/20'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-extrabold text-[#1a3478]">Akun PE (Process Engineering)</h4>
                        <span className="px-1.5 py-0.2 rounded-xs bg-blue-600 text-white text-[9px] font-black uppercase">
                          Wewenang Penuh
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium mt-0.5">
                        pe@terataiwidjaja.com (Password/PIN: 1234 atau pe123)
                      </p>
                      
                      <div className="mt-2.5 flex flex-wrap gap-1.5 text-[10px]">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold flex items-center space-x-1">
                          <PlusCircle className="w-3 h-3" />
                          <span>Input &amp; Edit Data</span>
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-bold flex items-center space-x-1">
                          <FileText className="w-3 h-3" />
                          <span>Cetak / Print PDF</span>
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 font-bold flex items-center space-x-1">
                          <ShieldCheck className="w-3 h-3" />
                          <span>Akses Semua Fitur</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="shrink-0 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition"
                  >
                    Pilih PE
                  </button>
                </div>
              </div>

              {/* Akun Monitor Card */}
              <div 
                onClick={() => handleQuickLogin('MONITOR')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  currentUser.role === 'MONITOR'
                    ? 'border-amber-600 bg-amber-50/50 shadow-xs'
                    : 'border-slate-200 hover:border-amber-400 bg-white hover:bg-amber-50/20'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <Eye className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-extrabold text-amber-900">Akun Monitor (Monitoring Sahaja)</h4>
                        <span className="px-1.5 py-0.2 rounded-xs bg-amber-500 text-white text-[9px] font-black uppercase">
                          Pantau Sahaja
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium mt-0.5">
                        monitor@terataiwidjaja.com (Password/PIN: 0000 atau monitor123)
                      </p>

                      <div className="mt-2.5 flex flex-wrap gap-1.5 text-[10px]">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-300 font-medium flex items-center space-x-1">
                          <Eye className="w-3 h-3" />
                          <span>Lihat Grafik &amp; Kalender</span>
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 font-bold flex items-center space-x-1">
                          <X className="w-3 h-3" />
                          <span>Tanpa Akses Print PDF</span>
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 font-bold flex items-center space-x-1">
                          <X className="w-3 h-3" />
                          <span>Tanpa Akses Input Data</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="shrink-0 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs transition"
                  >
                    Pilih Monitor
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Username atau Email</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="Contoh: pe atau monitor"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Password atau 4-Digit PIN</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    placeholder="PIN: 1234 (PE) atau 0000 (Monitor)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 leading-relaxed">
                <span className="font-bold text-slate-800 block mb-0.5">Petunjuk Akses Akun:</span>
                • <strong>Akun PE:</strong> User <code className="bg-white px-1 border rounded">pe</code> / PIN <code className="bg-white px-1 border rounded">1234</code> (Wewenang Penuh)<br/>
                • <strong>Akun Monitor:</strong> User <code className="bg-white px-1 border rounded">monitor</code> / PIN <code className="bg-white px-1 border rounded">0000</code> (Pantau Saja, No Print, No Input)
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#1a3478] hover:bg-blue-900 text-white font-bold rounded-xl text-xs transition shadow-xs flex items-center justify-center space-x-2"
              >
                <Lock className="w-4 h-4" />
                <span>Masuk Sekarang</span>
              </button>
            </form>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
