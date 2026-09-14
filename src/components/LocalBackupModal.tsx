import React, { useRef, useState } from 'react';
import { Download, Upload, HardDrive, ShieldCheck, Check, AlertCircle, X, Smartphone, RefreshCw } from 'lucide-react';
import { 
  BankDataModel, 
  MonthlyProductivityRecord, 
  RepairDefectRecord, 
  StyleScheduleRecord, 
  ProcessEngineeringFinding, 
  UrgentPushNotification 
} from '../types';

interface LocalBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  monthlyRecap: MonthlyProductivityRecord[];
  bankDataModels: BankDataModel[];
  repairRecords: RepairDefectRecord[];
  styleSchedules: StyleScheduleRecord[];
  peFindings: ProcessEngineeringFinding[];
  urgentNotifications: UrgentPushNotification[];
  selectedMonth: string;
  onRestoreData: (restored: {
    monthlyRecap?: MonthlyProductivityRecord[];
    bankDataModels?: BankDataModel[];
    repairRecords?: RepairDefectRecord[];
    styleSchedules?: StyleScheduleRecord[];
    peFindings?: ProcessEngineeringFinding[];
    urgentNotifications?: UrgentPushNotification[];
    selectedMonth?: string;
  }) => void;
}

export const LocalBackupModal: React.FC<LocalBackupModalProps> = ({
  isOpen,
  onClose,
  monthlyRecap,
  bankDataModels,
  repairRecords,
  styleSchedules,
  peFindings,
  urgentNotifications,
  selectedMonth,
  onRestoreData
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!isOpen) return null;

  const totalRecords = monthlyRecap.length + bankDataModels.length + repairRecords.length + styleSchedules.length + peFindings.length;

  const handleExportBackup = () => {
    try {
      const backupPayload = {
        app: 'PT Teratai Widjaja Produksi & SMV',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        selectedMonth,
        data: {
          monthlyRecap,
          bankDataModels,
          repairRecords,
          styleSchedules,
          peFindings,
          urgentNotifications
        }
      };

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupPayload, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `TW-Produksi-Backup-${selectedMonth || 'Data'}-${new Date().toISOString().slice(0,10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      setNotification({
        type: 'success',
        message: 'File cadangan berhasil diunduh ke memori perangkat Android Anda.'
      });
    } catch (err) {
      console.error('Export backup error:', err);
      setNotification({
        type: 'error',
        message: 'Gagal membuat file cadangan.'
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        if (!parsed || (!parsed.data && !parsed.monthlyRecap)) {
          throw new Error('Format file cadangan tidak valid.');
        }

        const dataToRestore = parsed.data || parsed;
        onRestoreData({
          monthlyRecap: Array.isArray(dataToRestore.monthlyRecap) ? dataToRestore.monthlyRecap : undefined,
          bankDataModels: Array.isArray(dataToRestore.bankDataModels) ? dataToRestore.bankDataModels : undefined,
          repairRecords: Array.isArray(dataToRestore.repairRecords) ? dataToRestore.repairRecords : undefined,
          styleSchedules: Array.isArray(dataToRestore.styleSchedules) ? dataToRestore.styleSchedules : undefined,
          peFindings: Array.isArray(dataToRestore.peFindings) ? dataToRestore.peFindings : undefined,
          urgentNotifications: Array.isArray(dataToRestore.urgentNotifications) ? dataToRestore.urgentNotifications : undefined,
          selectedMonth: parsed.selectedMonth || undefined,
        });

        setNotification({
          type: 'success',
          message: 'Data berhasil dipulihkan secara offline dari file cadangan.'
        });
      } catch (err: any) {
        console.error('Restore backup error:', err);
        setNotification({
          type: 'error',
          message: err.message || 'Gagal membaca file cadangan. Pastikan file JSON valid.'
        });
      }
    };
    reader.readAsText(file);
    // reset input
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden text-slate-900">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-300">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Cadangkan &amp; Pulihkan Data Lokal</h3>
              <p className="text-xs text-slate-400">100% Offline di Android — Tanpa Ketergantungan Cloud</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {notification && (
            <div className={`p-3 rounded-xl flex items-center space-x-2.5 text-xs font-semibold ${
              notification.type === 'success' 
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}>
              {notification.type === 'success' ? (
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{notification.message}</span>
            </div>
          )}

          {/* Device storage info badge */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start space-x-3">
            <Smartphone className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-700 leading-relaxed">
              <span className="font-bold text-slate-900 block mb-0.5">Penyimpanan Terisolasi di Perangkat Anda</span>
              Semua input data harian, bank target model, jadwal alokasi sewing, dan temuan perbaikan disimpan langsung pada memori browser / aplikasi di Android Anda ({totalRecords} entri tersimpan saat ini).
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Export Card */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-400 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-2 text-blue-700 font-bold text-xs mb-1.5">
                  <Download className="w-4 h-4" />
                  <span>Cadangkan ke File (.json)</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
                  Unduh seluruh database produksi saat ini menjadi berkas arsip yang aman disimpan di ponsel atau dikirim via WhatsApp/Email.
                </p>
              </div>
              <button
                type="button"
                onClick={handleExportBackup}
                className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition active:scale-95 flex items-center justify-center space-x-1.5 shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh File Cadangan</span>
              </button>
            </div>

            {/* Import Card */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white hover:border-emerald-400 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-2 text-emerald-700 font-bold text-xs mb-1.5">
                  <Upload className="w-4 h-4" />
                  <span>Pulihkan dari File (.json)</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
                  Pindahkan data dari ponsel lain atau pulihkan rekaman arsip tanpa perlu koneksi internet atau server cloud.
                </p>
              </div>
              <input 
                ref={fileInputRef}
                type="file" 
                accept=".json,application/json" 
                onChange={handleFileSelect}
                className="hidden" 
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition active:scale-95 flex items-center justify-center space-x-1.5 shadow-2xs"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Pilih Berkas Cadangan</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition"
          >
            Selesai
          </button>
        </div>

      </div>
    </div>
  );
};
