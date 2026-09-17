import React, { useState, useEffect, useCallback } from 'react';
import { Navbar, NavTabType } from './components/Navbar';
import { KpiSummary } from './components/KpiSummary';
import { ChartsSection } from './components/ChartsSection';
import { DailyMatrixTable } from './components/DailyMatrixTable';
import { RevenueTable } from './components/RevenueTable';
import { MonthlyRecapView } from './components/MonthlyRecapView';
import { BankDataView } from './components/BankDataView';
import { BankDataModal } from './components/BankDataModal';
import { InputRecapModal } from './components/InputRecapModal';
import { GoogleSheetModal } from './components/GoogleSheetModal';
import { PdfPreviewModal } from './components/PdfPreviewModal';
import { LineIncidentModal } from './components/LineIncidentModal';
import { LineIssueNotificationBanner } from './components/LineIssueNotificationBanner';
import { StyleScheduleView } from './components/StyleScheduleView';
import { StyleScheduleModal } from './components/StyleScheduleModal';
import { UrgentPushNotificationModule } from './components/UrgentPushNotificationModule';
import { ProcessEngineeringFindingsSection } from './components/ProcessEngineeringFindingsSection';
import { PEFindingModal } from './components/PEFindingModal';
import { MonthlyPlanModal } from './components/MonthlyPlanModal';
import { RepairDefectView } from './components/RepairDefectView';
import { WorkScenarioView } from './components/WorkScenarioView';
import { LoginModal } from './components/LoginModal';
import { CompanyLogo } from './components/CompanyLogo';
import { INITIAL_LINES_DATA, computeSummary } from './data/defaultData';
import { INITIAL_MONTHLY_RECAP } from './data/monthlyRecapData';
import { INITIAL_BANK_DATA } from './data/bankData';
import { INITIAL_REPAIR_DEFECT_DATA } from './data/repairDefectData';
import { loadSavedPEFindings, savePEFindings } from './data/peFindingsData';
import { fetchGoogleSheetData } from './services/sheetService';
import { getStoredAuthUser, saveAuthUser } from './services/authService';
import { exportReportToPdf } from './utils/pdfExport';
import { detectLineIncidents, updateIncidentInStorage } from './utils/issueDetection';
import { 
  getCurrentYearMonth, 
  getPreviousMonth, 
  getNextMonth, 
  formatMonthYearIndonesian, 
  formatRupiah, 
  formatPercent 
} from './utils/formatters';
import { buildLinesFromMonthlyRecap } from './utils/monthDataHelper';
import { 
  loadSavedSchedules, 
  saveSchedules, 
  loadSavedUrgentNotifications, 
  saveUrgentNotifications, 
  detectScheduleOverlaps,
  sendBrowserPushNotification 
} from './utils/scheduleCalculations';
import { 
  LineData, 
  DataSourceState, 
  MonthlyProductivityRecord, 
  BankDataModel, 
  LineIncident,
  StyleScheduleRecord,
  ScheduleOverlapConflict,
  UrgentPushNotification,
  ProcessEngineeringFinding,
  RepairDefectRecord,
  AuthUser
} from './types';
import { 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  Sparkles, 
  FileSpreadsheet, 
  Download,
  Calendar,
  Layers,
  ArrowRight,
  ClipboardList,
  ShieldCheck,
  Plus,
  Database,
  BellRing,
  Zap,
  ChevronLeft,
  ChevronRight,
  Trash2,
  RotateCcw,
  HardDrive
} from 'lucide-react';
import { LocalBackupModal } from './components/LocalBackupModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { PWAInstallButton } from './components/PWAInstallButton';

export default function App() {
  const [lines, setLines] = useState<LineData[]>(INITIAL_LINES_DATA);
  const [activeTab, setActiveTab] = useState<NavTabType>('overview');
  
  // 2 Akses Keamanan: Akun PE (Full Input) & Akun Monitoring (Read-Only)
  const [currentUser, setCurrentUser] = useState<AuthUser>(() => getStoredAuthUser());
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const [isSheetModalOpen, setIsSheetModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isPdfPreviewOpen, setIsPdfPreviewOpen] = useState(false);
  const [pdfPreviewType, setPdfPreviewType] = useState<'productivity' | 'incidents' | 'repair'>('productivity');
  const [pdfInitialDate, setPdfInitialDate] = useState<string | undefined>(undefined);

  // Bank Data Manual Style Scheduling & Overtime (OT) State
  const [styleSchedules, setStyleSchedules] = useState<StyleScheduleRecord[]>(() => {
    return loadSavedSchedules();
  });
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<StyleScheduleRecord | null>(null);

  // Urgent Push Notifications State
  const [urgentNotifications, setUrgentNotifications] = useState<UrgentPushNotification[]>(() => {
    return loadSavedUrgentNotifications();
  });
  const [isPushModalOpen, setIsPushModalOpen] = useState(false);

  // Process Engineering Findings & SMV Diagnostics State
  const [peFindings, setPeFindings] = useState<ProcessEngineeringFinding[]>(() => {
    return loadSavedPEFindings();
  });
  const [isPEModalOpen, setIsPEModalOpen] = useState(false);
  const [editingPEFinding, setEditingPEFinding] = useState<ProcessEngineeringFinding | null>(null);

  // Repair & Defect Records State with LocalStorage Persistence
  const [repairRecords, setRepairRecords] = useState<RepairDefectRecord[]>(() => {
    const saved = localStorage.getItem('tw_repair_defect_records_v1');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed parsing saved repair records:', e);
      }
    }
    return INITIAL_REPAIR_DEFECT_DATA;
  });

  // Bank Data Master State (Model, Target, SMV Standar) with local storage persistence
  const [bankDataModels, setBankDataModels] = useState<BankDataModel[]>(() => {
    const saved = localStorage.getItem('tw_bank_data_models');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed parsing saved bank data:', e);
      }
    }
    return INITIAL_BANK_DATA;
  });

  const [isBankDataModalOpen, setIsBankDataModalOpen] = useState(false);
  const [editingBankModel, setEditingBankModel] = useState<BankDataModel | null>(null);
  const [preselectedBankModel, setPreselectedBankModel] = useState<BankDataModel | null>(null);

  // Daily Productivity Recap State with local storage persistence
  const [monthlyRecap, setMonthlyRecap] = useState<MonthlyProductivityRecord[]>(() => {
    const saved = localStorage.getItem('smv_monthly_recap_records_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed parsing saved monthly recap:', e);
      }
    }
    return INITIAL_MONTHLY_RECAP;
  });

  // Modal input state for Rekap Harian
  const [isInputModalOpen, setIsInputModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MonthlyProductivityRecord | null>(null);

  // Selected Month Filter State (format: "YYYY-MM")
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const saved = localStorage.getItem('tw_selected_dashboard_month');
    if (saved && /^\d{4}-\d{2}$/.test(saved)) {
      return saved;
    }
    return getCurrentYearMonth();
  });

  useEffect(() => {
    localStorage.setItem('tw_selected_dashboard_month', selectedMonth);
  }, [selectedMonth]);

  // Filter monthly recap records for the selected month
  const filteredMonthlyRecap = React.useMemo(() => {
    return monthlyRecap.filter(r => r.date && r.date.startsWith(selectedMonth));
  }, [monthlyRecap, selectedMonth]);

  // Filter repair & defect records for the selected month
  const filteredRepairRecords = React.useMemo(() => {
    return repairRecords.filter(r => !r.date || r.date.startsWith(selectedMonth));
  }, [repairRecords, selectedMonth]);

  // Filter style schedules active in the selected month
  const filteredStyleSchedules = React.useMemo(() => {
    return styleSchedules.filter(s => {
      if (!s.startDate && !s.endDate) return true;
      const startM = s.startDate ? s.startDate.substring(0, 7) : '';
      const endM = s.endDate ? s.endDate.substring(0, 7) : '';
      return startM === selectedMonth || endM === selectedMonth || 
             (s.startDate <= `${selectedMonth}-31` && s.endDate >= `${selectedMonth}-01`);
    });
  }, [styleSchedules, selectedMonth]);

  // Live Overlap Conflicts calculation for current month schedules
  const scheduleConflicts = React.useMemo(() => {
    return detectScheduleOverlaps(filteredStyleSchedules);
  }, [filteredStyleSchedules]);

  // Dynamically compute LineData structure for dashboard tables & charts based on selected month
  const activeLines = React.useMemo(() => {
    const derived = buildLinesFromMonthlyRecap(filteredMonthlyRecap, bankDataModels, selectedMonth);
    if (derived.length > 0) return derived;
    // If lines was imported via Google Sheet or manually and monthly recap is empty
    if (lines.length > 0 && monthlyRecap.length === 0) {
      return lines;
    }
    return [];
  }, [filteredMonthlyRecap, bankDataModels, selectedMonth, lines, monthlyRecap.length]);

  // Line Incidents & Bottleneck Notifications state (filtered by active month records)
  const [incidents, setIncidents] = useState<LineIncident[]>(() => {
    return detectLineIncidents(filteredMonthlyRecap, activeLines);
  });
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);

  // Perencanaan Bulanan Modal State
  const [isMonthlyPlanModalOpen, setIsMonthlyPlanModalOpen] = useState(false);

  // Sync detected incidents when filtered records change
  useEffect(() => {
    setIncidents(detectLineIncidents(filteredMonthlyRecap, activeLines));
  }, [filteredMonthlyRecap, activeLines]);

  const handleUpdateIncident = (updated: LineIncident) => {
    updateIncidentInStorage(updated);
    setIncidents(prev => prev.map(i => i.id === updated.id ? updated : i));
    showToast('success', `Status disposisi & persetujuan ${updated.lineName} diperbarui.`);
  };

  // Notification Toast
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Google Apps Script source configuration
  const [dataSource, setDataSource] = useState<DataSourceState>(() => {
    const savedUrl = localStorage.getItem('smv_apps_script_url') || '';
    return {
      isLive: false,
      appsScriptUrl: savedUrl,
      lastSyncTime: null,
      autoSyncInterval: 0,
      status: 'idle'
    };
  });

  const summary = computeSummary(activeLines);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(prev => prev?.message === message ? null : prev);
    }, 4500);
  };

  // Sync with Google Apps Script
  const handleConnectSheet = async (url: string) => {
    setDataSource(prev => ({ ...prev, status: 'syncing' }));
    try {
      const result = await fetchGoogleSheetData(url);
      setLines(result.lines);
      localStorage.setItem('smv_apps_script_url', url);
      setDataSource({
        isLive: true,
        appsScriptUrl: url,
        lastSyncTime: new Date().toISOString(),
        autoSyncInterval: dataSource.autoSyncInterval,
        status: 'connected'
      });
      showToast('success', 'Berhasil terhubung ke Google Sheet melalui Apps Script!');
    } catch (err: any) {
      setDataSource(prev => ({
        ...prev,
        status: 'error',
        errorMessage: err.message
      }));
      showToast('error', err.message || 'Gagal menyambung ke Google Apps Script.');
      throw err;
    }
  };

  // Kosongkan semua data (Reset all records & local storage)
  const handleClearAllData = () => {
    setLines([]);
    setMonthlyRecap([]);
    setBankDataModels([]);
    setStyleSchedules([]);
    setRepairRecords([]);
    setPeFindings([]);
    setUrgentNotifications([]);
    localStorage.removeItem('smv_apps_script_url');
    localStorage.removeItem('smv_monthly_recap_records_v2');
    localStorage.removeItem('tw_bank_data_models');
    localStorage.removeItem('tw_style_schedules_v1');
    localStorage.removeItem('tw_repair_defect_records_v1');
    localStorage.removeItem('tw_pe_findings_v1');
    localStorage.removeItem('tw_urgent_notifications_v1');
    setDataSource({
      isLive: false,
      appsScriptUrl: '',
      lastSyncTime: null,
      autoSyncInterval: 0,
      status: 'idle'
    });
    showToast('info', 'Semua data telah dikosongkan. Dashboard siap untuk pengisian data baru.');
  };

  // Reset to default preloaded dataset (now empty by default)
  const handleResetDefault = () => {
    handleClearAllData();
  };

  // Cadangan & Pemulihan Data Lokal (No Cloud) State & Handler
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);

  const handleRestoreData = (restored: {
    monthlyRecap?: MonthlyProductivityRecord[];
    bankDataModels?: BankDataModel[];
    repairRecords?: RepairDefectRecord[];
    styleSchedules?: StyleScheduleRecord[];
    peFindings?: ProcessEngineeringFinding[];
    urgentNotifications?: UrgentPushNotification[];
    selectedMonth?: string;
  }) => {
    if (restored.monthlyRecap) {
      setMonthlyRecap(restored.monthlyRecap);
      localStorage.setItem('smv_monthly_recap_records_v2', JSON.stringify(restored.monthlyRecap));
    }
    if (restored.bankDataModels) {
      setBankDataModels(restored.bankDataModels);
      localStorage.setItem('tw_bank_data_models', JSON.stringify(restored.bankDataModels));
    }
    if (restored.repairRecords) {
      setRepairRecords(restored.repairRecords);
      localStorage.setItem('tw_repair_defect_records_v1', JSON.stringify(restored.repairRecords));
    }
    if (restored.styleSchedules) {
      setStyleSchedules(restored.styleSchedules);
      localStorage.setItem('tw_style_schedules_v1', JSON.stringify(restored.styleSchedules));
    }
    if (restored.peFindings) {
      setPeFindings(restored.peFindings);
      localStorage.setItem('tw_pe_findings_v1', JSON.stringify(restored.peFindings));
    }
    if (restored.urgentNotifications) {
      setUrgentNotifications(restored.urgentNotifications);
      localStorage.setItem('tw_urgent_notifications_v1', JSON.stringify(restored.urgentNotifications));
    }
    if (restored.selectedMonth) {
      setSelectedMonth(restored.selectedMonth);
      localStorage.setItem('tw_selected_dashboard_month', restored.selectedMonth);
    }
    showToast('success', 'Data lokal berhasil dipulihkan secara penuh tanpa cloud.');
  };

  // Manual Refresh
  const handleManualRefresh = useCallback(async () => {
    if (dataSource.appsScriptUrl && dataSource.isLive) {
      setDataSource(prev => ({ ...prev, status: 'syncing' }));
      try {
        const result = await fetchGoogleSheetData(dataSource.appsScriptUrl);
        setLines(result.lines);
        setDataSource(prev => ({
          ...prev,
          lastSyncTime: new Date().toISOString(),
          status: 'connected'
        }));
        showToast('success', 'Data Google Sheet berhasil diperbarui secara real-time.');
      } catch (err: any) {
        setDataSource(prev => ({ ...prev, status: 'error' }));
        showToast('error', 'Gagal memperbarui: ' + err.message);
      }
    } else {
      showToast('info', 'Data saat ini menggunakan dataset lokal bawaan.');
    }
  }, [dataSource.appsScriptUrl, dataSource.isLive]);

  // Auto-sync polling timer
  useEffect(() => {
    if (dataSource.autoSyncInterval > 0 && dataSource.isLive && dataSource.appsScriptUrl) {
      const interval = setInterval(() => {
        handleManualRefresh();
      }, dataSource.autoSyncInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [dataSource.autoSyncInterval, dataSource.isLive, dataSource.appsScriptUrl, handleManualRefresh]);

  // Target Reduction: Kurangi sisa target perencanaan ketika input aktual harian masuk
  const handleUpdateScheduleActual = useCallback((scheduleId: string, additionalPcs: number) => {
    setStyleSchedules(prev => {
      const updated = prev.map(s => {
        if (s.id === scheduleId) {
          const newActual = (s.actualQty || 0) + additionalPcs;
          const newRemaining = Math.max(0, s.orderQty - newActual);
          return {
            ...s,
            actualQty: newActual,
            remainingQty: newRemaining,
            status: (newActual >= s.orderQty ? 'completed' : 'running') as any
          };
        }
        return s;
      });
      saveSchedules(updated);
      return updated;
    });
  }, []);

  // Save / Update monthly recap record with automatic target reduction
  const handleSaveRecapRecord = (record: MonthlyProductivityRecord) => {
    setMonthlyRecap(prev => {
      const exists = prev.some(r => r.id === record.id);
      let updated: MonthlyProductivityRecord[];
      if (exists) {
        updated = prev.map(r => r.id === record.id ? record : r);
      } else {
        updated = [record, ...prev];
      }
      localStorage.setItem('smv_monthly_recap_records_v2', JSON.stringify(updated));
      return updated;
    });

    // Otomatis kurangi dari sisa target order jika ada jadwal yang cocok
    setStyleSchedules(prev => {
      const matching = prev.find(s => 
        (record.styleScheduleId && s.id === record.styleScheduleId) || 
        (s.lineId === record.lineId && s.styleName.toLowerCase() === record.style.toLowerCase())
      );
      if (matching) {
        const updated = prev.map(s => {
          if (s.id === matching.id) {
            const newActual = s.actualQty + (record.actualDailyPcs || 0);
            const newRemaining = Math.max(0, s.orderQty - newActual);
            return {
              ...s,
              actualQty: newActual,
              remainingQty: newRemaining,
              status: (newActual >= s.orderQty ? 'completed' : 'running') as any
            };
          }
          return s;
        });
        saveSchedules(updated);
        showToast('success', `Data produksi ${record.lineName} (${record.style}) disimpan! Target order ${matching.styleName} berkurang sisa ${Math.max(0, matching.orderQty - (matching.actualQty + record.actualDailyPcs))} pcs.`);
        return updated;
      }
      showToast('success', `Data produksi ${record.lineName} (${record.style}) berhasil disimpan!`);
      return prev;
    });
  };

  // Simpan Perencanaan Bulanan (Model, Target Order, Target Harian, SMV, Mulai Kapan)
  const handleSaveMonthlyPlan = (planData: StyleScheduleRecord) => {
    setStyleSchedules(prev => {
      const exists = prev.some(s => s.id === planData.id);
      let updated: StyleScheduleRecord[];
      if (exists) {
        updated = prev.map(s => s.id === planData.id ? planData : s);
      } else {
        updated = [planData, ...prev];
      }
      saveSchedules(updated);
      return updated;
    });
    showToast('success', `Perencanaan bulanan model ${planData.styleName} berhasil dibuat. Input harian otomatis akan mengurangi target.`);
  };

  // Repair & Defect Handlers
  const handleSaveRepairRecord = (record: RepairDefectRecord) => {
    setRepairRecords(prev => {
      const exists = prev.some(r => r.id === record.id);
      let updated: RepairDefectRecord[];
      if (exists) {
        updated = prev.map(r => r.id === record.id ? record : r);
      } else {
        updated = [record, ...prev];
      }
      localStorage.setItem('tw_repair_defect_records_v1', JSON.stringify(updated));
      return updated;
    });
    showToast('success', `Data defect/repair ${record.lineName} (${record.style}) berhasil disimpan.`);
  };

  const handleDeleteRepairRecord = (id: string) => {
    setRepairRecords(prev => {
      const updated = prev.filter(r => r.id !== id);
      localStorage.setItem('tw_repair_defect_records_v1', JSON.stringify(updated));
      return updated;
    });
    showToast('info', 'Data repair/defect berhasil dihapus.');
  };

  // Delete monthly recap record
  const handleDeleteRecapRecord = (id: string) => {
    setMonthlyRecap(prev => {
      const updated = prev.filter(r => r.id !== id);
      localStorage.setItem('smv_monthly_recap_records_v2', JSON.stringify(updated));
      return updated;
    });
    showToast('info', 'Rekaman rekap harian berhasil dihapus.');
  };

  // Save / Update Bank Data model
  const handleSaveBankData = (model: BankDataModel) => {
    setBankDataModels(prev => {
      const exists = prev.some(m => m.id === model.id);
      let updated: BankDataModel[];
      if (exists) {
        updated = prev.map(m => m.id === model.id ? model : m);
      } else {
        updated = [model, ...prev];
      }
      localStorage.setItem('tw_bank_data_models', JSON.stringify(updated));
      return updated;
    });
    showToast('success', `Model ${model.modelCode} berhasil disimpan ke Bank Data!`);
  };

  // Delete Bank Data model
  const handleDeleteBankData = (id: string) => {
    setBankDataModels(prev => {
      const updated = prev.filter(m => m.id !== id);
      localStorage.setItem('tw_bank_data_models', JSON.stringify(updated));
      return updated;
    });
    showToast('info', 'Model di Bank Data berhasil dihapus.');
  };

  // Use Model in Input Form
  const handleUseModelInInput = (model: BankDataModel) => {
    setPreselectedBankModel(model);
    setEditingRecord(null);
    setIsInputModalOpen(true);
  };

  // Save Style Schedule Record
  const handleSaveSchedule = (record: StyleScheduleRecord) => {
    setStyleSchedules(prev => {
      const exists = prev.some(s => s.id === record.id);
      let updated: StyleScheduleRecord[];
      if (exists) {
        updated = prev.map(s => s.id === record.id ? record : s);
      } else {
        updated = [record, ...prev];
      }
      saveSchedules(updated);

      // Check if this newly saved schedule creates an overlap conflict on this line
      const lineConflicts = detectScheduleOverlaps(updated).filter(c => c.lineId === record.lineId);
      if (lineConflicts.length > 0) {
        const notif: UrgentPushNotification = {
          id: `urgent-overlap-${Date.now()}`,
          timestamp: new Date().toISOString(),
          title: `🚨 TUMPANG TINDIH TERDETEKSI DI ${record.lineName}`,
          message: `Style ${record.styleName} bertabrakan dengan jadwal shift/lembur style lain di ${record.lineName}. Silakan sesuaikan alokasi jam kerja.`,
          type: 'overlap',
          lineId: record.lineId,
          lineName: record.lineName,
          styleName: record.styleName,
          severity: 'critical',
          read: false
        };
        setUrgentNotifications(prevNotifs => {
          const updatedNotifs = [notif, ...prevNotifs];
          saveUrgentNotifications(updatedNotifs);
          return updatedNotifs;
        });
        sendBrowserPushNotification(notif.title, notif.message);
      }

      return updated;
    });
    showToast('success', `Jadwal & kalkulasi OT untuk ${record.styleName} (${record.lineName}) berhasil disimpan.`);
  };

  // Delete Style Schedule Record
  const handleDeleteSchedule = (id: string) => {
    setStyleSchedules(prev => {
      const updated = prev.filter(s => s.id !== id);
      saveSchedules(updated);
      return updated;
    });
    showToast('info', 'Alokasi style berhasil dihapus dari jadwal.');
  };

  // Process Engineering Finding Handlers
  const handleSavePEFinding = (finding: ProcessEngineeringFinding) => {
    setPeFindings(prev => {
      const exists = prev.some(f => f.id === finding.id);
      let updated: ProcessEngineeringFinding[];
      if (exists) {
        updated = prev.map(f => f.id === finding.id ? finding : f);
      } else {
        updated = [finding, ...prev];
      }
      savePEFindings(updated);
      return updated;
    });
    showToast('success', `Temuan PE & Diagnostik SMV (${finding.operationName} - ${finding.lineName}) berhasil disimpan.`);
  };

  const handleDeletePEFinding = (id: string) => {
    setPeFindings(prev => {
      const updated = prev.filter(f => f.id !== id);
      savePEFindings(updated);
      return updated;
    });
    showToast('info', 'Temuan rekayasa proses berhasil dihapus.');
  };

  const handleUpdatePEStatus = (id: string, newStatus: 'implemented' | 'trial' | 'evaluation') => {
    setPeFindings(prev => {
      const updated = prev.map(f => f.id === id ? { ...f, status: newStatus } : f);
      savePEFindings(updated);
      return updated;
    });
    showToast('success', 'Status implementasi Kaizen berhasil diperbarui.');
  };

  // Export to PDF / Preview PDF
  const handleExportPdf = (type: 'productivity' | 'incidents' | 'repair' = 'productivity', initialDate?: string) => {
    setPdfPreviewType(type);
    setPdfInitialDate(initialDate);
    setIsPdfPreviewOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      
      {/* Top Navigation */}
      <Navbar
        dataSource={dataSource}
        onOpenSheetModal={() => setIsSheetModalOpen(true)}
        onExportPdf={() => handleExportPdf(activeTab === 'repair-defect' ? 'repair' : 'productivity')}
        onManualRefresh={handleManualRefresh}
        isExporting={isExporting}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
        onOpenInputModal={() => {
          setEditingRecord(null);
          setPreselectedBankModel(null);
          setIsInputModalOpen(true);
        }}
        onOpenBankDataModal={() => {
          setEditingBankModel(null);
          setIsBankDataModalOpen(true);
        }}
        onOpenMonthlyPlanModal={() => setIsMonthlyPlanModalOpen(true)}
        incidents={incidents}
        onOpenIncidentModal={() => setIsIncidentModalOpen(true)}
        unreadPushCount={urgentNotifications.filter(n => !n.read).length}
        onOpenPushModal={() => setIsPushModalOpen(true)}
        overlapCount={scheduleConflicts.length}
        repairCriticalCount={filteredRepairRecords.filter(r => r.repairPercent >= 10.0).length}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
        currentUser={currentUser}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
      />

      {/* Floating Notification Toast */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 max-w-md animate-in slide-in-from-bottom-5 duration-200">
          <div className={`p-4 rounded-xl shadow-lg border flex items-center space-x-3 text-xs font-semibold ${
            notification.type === 'success' 
              ? 'bg-white border-emerald-300 text-emerald-800' 
              : notification.type === 'error' 
                ? 'bg-white border-red-300 text-red-800' 
                : 'bg-white border-blue-300 text-blue-800'
          }`}>
            {notification.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
            {notification.type === 'error' && <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />}
            {notification.type === 'info' && <Info className="w-5 h-5 text-blue-600 shrink-0" />}
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-3.5 sm:py-6 space-y-4 sm:space-y-6">
        
        {/* Global Month Selection & Period Bar */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Periode Aktif:
                </span>
                <span className="text-sm sm:text-base font-extrabold text-blue-800">
                  {formatMonthYearIndonesian(selectedMonth)}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                  {selectedMonth}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {filteredMonthlyRecap.length > 0 
                  ? `Menampilkan ${filteredMonthlyRecap.length} data rekaman produksi pada bulan ini.`
                  : 'Data saat ini kosong untuk bulan ini. Dashboard siap untuk pengisian data baru.'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 flex-wrap sm:flex-nowrap">
            <button
              onClick={() => setSelectedMonth(getPreviousMonth(selectedMonth))}
              className="px-2.5 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors flex items-center space-x-1 active:scale-95"
              title="Bulan Sebelumnya"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Bulan Lalu</span>
            </button>
            
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => e.target.value && setSelectedMonth(e.target.value)}
                className="text-xs font-bold text-slate-800 bg-transparent border-0 p-0 focus:ring-0 cursor-pointer"
                title="Pilih Bulan Tertentu"
              />
            </div>

            <button
              onClick={() => setSelectedMonth(getNextMonth(selectedMonth))}
              className="px-2.5 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors flex items-center space-x-1 active:scale-95"
              title="Bulan Berikutnya"
            >
              <span className="hidden sm:inline">Bulan Depan</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setIsBackupModalOpen(true)}
              className="px-2.5 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg transition-colors flex items-center space-x-1 active:scale-95 ml-auto sm:ml-2"
              title="Cadangkan & Pulihkan Data Lokal (Offline Tanpa Cloud)"
            >
              <HardDrive className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Cadangan Offline</span>
            </button>

            <button
              onClick={handleClearAllData}
              className="px-2.5 py-1.5 text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg transition-colors flex items-center space-x-1 active:scale-95"
              title="Kosongkan Semua Data"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Kosongkan Data</span>
            </button>
          </div>
        </div>

        {/* Dynamic Tab Views */}
        {activeTab === 'overview' && (
          <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-150">
            {/* Subheader / PT Teratai Widjaja Context Bar - Hanya Muncul di Tab Overview */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center space-x-2.5 sm:space-x-3">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse shrink-0"></span>
                <div>
                  <div className="flex items-center space-x-1.5 sm:space-x-2">
                    <h2 className="text-xs sm:text-sm font-extrabold text-[#1a3478] tracking-tight uppercase">
                      PT TERATAI WIDJAJA
                    </h2>
                    <span className="text-slate-300">•</span>
                    <span className="text-[11px] sm:text-xs font-bold text-blue-700">
                      Sewing Production & Quality
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                    Monitoring Aktual per Hari, Target Harian, Kolom Analisis Bottleneck & Bank Data Model
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 text-xs w-full sm:w-auto">
                <button
                  onClick={() => {
                    setEditingBankModel(null);
                    setIsBankDataModalOpen(true);
                  }}
                  className="inline-flex items-center justify-center space-x-1.5 px-2.5 sm:px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg font-bold shadow-2xs active:scale-95 transition-all"
                >
                  <Database className="w-3.5 h-3.5 text-blue-700" />
                  <span>+ Bank Data</span>
                </button>
                <button
                  onClick={() => {
                    setEditingRecord(null);
                    setPreselectedBankModel(null);
                    setIsInputModalOpen(true);
                  }}
                  className="inline-flex items-center justify-center space-x-1.5 px-2.5 sm:px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold shadow-2xs active:scale-95 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="sm:hidden">+ Masukan Data</span>
                  <span className="hidden sm:inline">+ Masukan Data Harian</span>
                </button>
                <button
                  onClick={() => setIsSheetModalOpen(true)}
                  className="col-span-2 sm:col-auto text-blue-700 hover:text-blue-800 font-semibold inline-flex items-center justify-center space-x-1 hover:underline py-1 sm:py-0 sm:ml-2"
                >
                  <span>{dataSource.isLive ? 'Pengaturan Sheet' : 'Hubungkan Sheet'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* KPI Cards Grid */}
            <KpiSummary summary={summary} />

            {/* Quick Action Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {/* Daily Output & Analysis Highlight Card */}
              <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="h-1 w-full bg-linear-to-r from-blue-700 to-red-600 absolute top-0 left-0"></div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                      <ClipboardList className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Rekapitulasi Aktual per Hari & Kolom Analisis
                      </h3>
                      <p className="text-xs text-slate-500">
                        {filteredMonthlyRecap.length} data masukan harian periode {formatMonthYearIndonesian(selectedMonth)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('monthly-recap')}
                    className="w-full sm:w-auto px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-bold transition-colors inline-flex items-center justify-center space-x-1 shrink-0 active:scale-95"
                  >
                    <span>Buka Rekap Harian</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Bank Data Highlight Card */}
              <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="h-1 w-full bg-blue-600 absolute top-0 left-0"></div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                      <Database className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Bank Data Model & Target Standar
                      </h3>
                      <p className="text-xs text-slate-500">
                        {bankDataModels.length} spesifikasi model & target kapasitas Industrial Engineering (IE)
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('bank-data')}
                    className="w-full sm:w-auto px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold transition-colors inline-flex items-center justify-center space-x-1 shrink-0 active:scale-95"
                  >
                    <span>Kelola Bank Data</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Style Schedule & OT Highlight Card */}
              <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden md:col-span-2">
                <div className={`h-1 w-full absolute top-0 left-0 ${scheduleConflicts.length > 0 ? 'bg-red-600' : 'bg-emerald-600'}`}></div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${scheduleConflicts.length > 0 ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-blue-700'}`}>
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm font-bold text-slate-900">
                          Bank Data Manual Style & Kalender Lembur (OT)
                        </h3>
                        {scheduleConflicts.length > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black animate-pulse">
                            ⚡ {scheduleConflicts.length} Hari Overlap
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">
                        {filteredStyleSchedules.length} alokasi style sewing dengan kalkulasi sisa target otomatis & visualisasi tumpang tindih per Line
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => {
                        setEditingSchedule(null);
                        setIsScheduleModalOpen(true);
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-lg text-xs font-bold transition-colors text-center active:scale-95"
                    >
                      + Input Style
                    </button>
                    <button
                      onClick={() => setActiveTab('style-schedule')}
                      className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition-colors inline-flex items-center justify-center space-x-1 shrink-0 shadow-2xs active:scale-95"
                    >
                      <span>Buka Kalender</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Charts */}
            <ChartsSection lines={activeLines} selectedMonth={selectedMonth} />

            {/* Concise Revenue Table in Overview */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-800">
                  Ringkasan Kinerja Revenue & Style Garment ({formatMonthYearIndonesian(selectedMonth)})
                </h3>
                <button
                  onClick={() => setActiveTab('revenue')}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                >
                  <span>Lihat Selengkapnya</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <RevenueTable lines={activeLines} summary={summary} selectedMonth={selectedMonth} />
            </div>
          </div>
        )}

        {/* Tab: BANK DATA MANUAL STYLE & KALENDER HARIAN OT */}
        {activeTab === 'style-schedule' && (
          <StyleScheduleView
            schedules={filteredStyleSchedules}
            conflicts={scheduleConflicts}
            urgentNotifications={urgentNotifications}
            bankDataModels={bankDataModels}
            onAddNew={() => {
              setEditingSchedule(null);
              setIsScheduleModalOpen(true);
            }}
            onEdit={(record) => {
              setEditingSchedule(record);
              setIsScheduleModalOpen(true);
            }}
            onDelete={handleDeleteSchedule}
            onOpenPushModal={() => setIsPushModalOpen(true)}
            onNavigateScenario={() => setActiveTab('scenario-analysis')}
            canInputData={currentUser.canInputData}
          />
        )}

        {/* Tab: SKENARIO 5 HARI VS 6 HARI KERJA & ANALISIS LEMBUR */}
        {activeTab === 'scenario-analysis' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <WorkScenarioView
              schedules={filteredStyleSchedules}
              onNavigateSchedule={() => setActiveTab('style-schedule')}
              onOpenPdfReport={() => handleExportPdf('productivity')}
            />
          </div>
        )}

        {/* Tab: REKAP HARIAN & ANALISIS */}
        {activeTab === 'monthly-recap' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <MonthlyRecapView
              records={filteredMonthlyRecap}
              onAddNew={() => {
                setEditingRecord(null);
                setPreselectedBankModel(null);
                setIsInputModalOpen(true);
              }}
              onEdit={(record) => {
                setEditingRecord(record);
                setIsInputModalOpen(true);
              }}
              onDelete={handleDeleteRecapRecord}
              onExportPdf={handleExportPdf}
              onOpenBankData={() => setActiveTab('bank-data')}
              onOpenIncidentModal={() => setIsIncidentModalOpen(true)}
              incidentsCount={incidents.length}
              styleSchedules={filteredStyleSchedules}
              onOpenMonthlyPlan={() => setIsMonthlyPlanModalOpen(true)}
              selectedMonth={selectedMonth}
              onMonthChange={setSelectedMonth}
              canInputData={currentUser.canInputData}
              canEditDelete={currentUser.canEditDelete}
            />
          </div>
        )}

        {/* Tab: REPAIR & DEFECT PER LINE (FISHBONE OTOMATIS) */}
        {activeTab === 'repair-defect' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <RepairDefectView
              records={filteredRepairRecords}
              onSaveRecord={handleSaveRepairRecord}
              onDeleteRecord={handleDeleteRepairRecord}
              onOpenPdfReport={handleExportPdf}
              canInputData={currentUser.canInputData}
              canEditDelete={currentUser.canEditDelete}
            />
          </div>
        )}

        {/* Tab: BANK DATA MODEL & TARGET */}
        {activeTab === 'bank-data' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <BankDataView
              models={bankDataModels}
              onAddNew={() => {
                setEditingBankModel(null);
                setIsBankDataModalOpen(true);
              }}
              onEdit={(model) => {
                setEditingBankModel(model);
                setIsBankDataModalOpen(true);
              }}
              onDelete={handleDeleteBankData}
              onUseModelInInput={handleUseModelInInput}
              canInputData={currentUser.canInputData}
              canEditDelete={currentUser.canEditDelete}
            />
          </div>
        )}

        {activeTab === 'daily-smv' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* NOTIFIKASI KENDALA LINE & BOTTLENECK BANNER - Khusus Tab Analisis SMV */}
            <LineIssueNotificationBanner
              incidents={incidents}
              onOpenModal={() => setIsIncidentModalOpen(true)}
              onPrintPdf={() => handleExportPdf('incidents')}
            />

            <ChartsSection lines={activeLines} selectedMonth={selectedMonth} />
            <DailyMatrixTable lines={activeLines} selectedMonth={selectedMonth} />
            
            {/* Analisis Tren Temuan Rekayasa Proses & Diagnostik SMV */}
            <ProcessEngineeringFindingsSection
              findings={peFindings}
              onAddNew={() => {
                setEditingPEFinding(null);
                setIsPEModalOpen(true);
              }}
              onEdit={(finding) => {
                setEditingPEFinding(finding);
                setIsPEModalOpen(true);
              }}
              onDelete={handleDeletePEFinding}
              onUpdateStatus={handleUpdatePEStatus}
            />
          </div>
        )}

        {activeTab === 'revenue' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <RevenueTable lines={activeLines} summary={summary} selectedMonth={selectedMonth} />
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <h4 className="text-sm font-bold text-slate-900 mb-2">
                Analisis Kinerja Keuangan PT Teratai Widjaja — {formatMonthYearIndonesian(selectedMonth)}
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {summary.activeLinesCount > 0 ? (
                  `Dari total target anggaran ${formatRupiah(summary.totalTargetRevenue)}, realisasi revenue mencapai ${formatRupiah(summary.totalActualRevenue)} dengan selisih variansi ${formatRupiah(summary.netRevenueVariance)} (${formatPercent(summary.overallVariancePercent)}). Rata-rata pencapaian per line ${formatPercent(summary.avgLineAchievement)}.`
                ) : (
                  `Belum ada data transaksi revenue sewing line pada periode ${formatMonthYearIndonesian(selectedMonth)}. Data saat ini bersih/kosong. Silakan tambahkan masukan data harian atau hubungkan Google Sheet untuk menghasilkan kalkulasi keuangan otomatis.`
                )}
              </p>
            </div>
          </div>
        )}

        {activeTab === 'data-matrix' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <DailyMatrixTable lines={activeLines} selectedMonth={selectedMonth} />
          </div>
        )}

      </main>

      {/* Clean Minimalist Footer */}
      <footer className="mt-auto bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-[#1a3478]">PT TERATAI WIDJAJA</span>
            <span>•</span>
            <span>Garment Manufacturer Production & Quality Management</span>
          </div>
          <div className="flex items-center space-x-3 text-slate-400">
            <span>Sistem Terintegrasi Google Apps Script</span>
            <span>•</span>
            <button 
              onClick={() => setIsSheetModalOpen(true)}
              className="text-blue-600 hover:underline"
            >
              Panduan Apps Script
            </button>
          </div>
        </div>
      </footer>

      {/* Google Sheet Apps Script Modal */}
      <GoogleSheetModal
        isOpen={isSheetModalOpen}
        onClose={() => setIsSheetModalOpen(false)}
        dataSource={dataSource}
        onConnect={handleConnectSheet}
        onResetDefault={handleResetDefault}
        onIntervalChange={(sec) => setDataSource(prev => ({ ...prev, autoSyncInterval: sec }))}
      />

      {/* Bank Data Model Modal */}
      <BankDataModal
        isOpen={isBankDataModalOpen}
        onClose={() => {
          setIsBankDataModalOpen(false);
          setEditingBankModel(null);
        }}
        onSave={handleSaveBankData}
        initialData={editingBankModel}
      />

      {/* Input Data Rekap Modal (Dengan target reduction otomatis) */}
      <InputRecapModal
        isOpen={isInputModalOpen}
        onClose={() => {
          setIsInputModalOpen(false);
          setEditingRecord(null);
          setPreselectedBankModel(null);
        }}
        onSave={handleSaveRecapRecord}
        initialData={editingRecord}
        bankDataModels={bankDataModels}
        preselectedModel={preselectedBankModel}
        styleSchedules={filteredStyleSchedules}
        onUpdateScheduleActual={handleUpdateScheduleActual}
        defaultMonth={selectedMonth}
        canInputData={currentUser.canInputData}
      />

      {/* Modal Input Perencanaan Bulanan (Model, Target Order, Target Harian, SMV, Mulai Kapan) */}
      <MonthlyPlanModal
        isOpen={isMonthlyPlanModalOpen}
        onClose={() => setIsMonthlyPlanModalOpen(false)}
        onSave={handleSaveMonthlyPlan}
        bankDataModels={bankDataModels}
      />

      {/* Line Incident & Bottleneck Approval Modal (PE & FM) */}
      <LineIncidentModal
        isOpen={isIncidentModalOpen}
        onClose={() => setIsIncidentModalOpen(false)}
        incidents={incidents}
        onUpdateIncident={handleUpdateIncident}
        onPrintReport={() => handleExportPdf('incidents')}
      />

      {/* Pratinjau Dokumen PDF Sebelum Dicetak atau Diunduh */}
      <PdfPreviewModal
        isOpen={isPdfPreviewOpen}
        onClose={() => {
          setIsPdfPreviewOpen(false);
          setPdfInitialDate(undefined);
        }}
        lines={activeLines}
        summary={summary}
        monthlyRecap={monthlyRecap}
        repairRecords={repairRecords}
        incidents={incidents}
        initialReportType={pdfPreviewType}
        initialSelectedMonth={selectedMonth}
        initialSelectedDate={pdfInitialDate}
        canPrintPdf={currentUser.canPrintPdf}
      />

      {/* Modal Input Bank Data Manual Style & Jadwal OT */}
      <StyleScheduleModal
        isOpen={isScheduleModalOpen}
        onClose={() => {
          setIsScheduleModalOpen(false);
          setEditingSchedule(null);
        }}
        onSave={handleSaveSchedule}
        initialData={editingSchedule}
        bankDataModels={bankDataModels}
        existingSchedules={styleSchedules}
      />

      {/* Modul Notifikasi Push Pembaruan Status Proyek Mendesak */}
      <UrgentPushNotificationModule
        isOpen={isPushModalOpen}
        onClose={() => setIsPushModalOpen(false)}
        notifications={urgentNotifications}
        onUpdateNotifications={(updated) => setUrgentNotifications(updated)}
        onNavigateToLine={(lineId) => {
          setActiveTab('style-schedule');
        }}
      />

      {/* Modal Input & Edit Temuan Rekayasa Proses (PE) */}
      <PEFindingModal
        isOpen={isPEModalOpen}
        onClose={() => {
          setIsPEModalOpen(false);
          setEditingPEFinding(null);
        }}
        onSave={handleSavePEFinding}
        initialData={editingPEFinding}
      />

      {/* Modal Cadangkan & Pulihkan Data Lokal (100% Offline Tanpa Cloud) */}
      <LocalBackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        monthlyRecap={monthlyRecap}
        bankDataModels={bankDataModels}
        repairRecords={repairRecords}
        styleSchedules={styleSchedules}
        peFindings={peFindings}
        urgentNotifications={urgentNotifications}
        selectedMonth={selectedMonth}
        onRestoreData={handleRestoreData}
      />

      {/* Modal Autentikasi 2 Akses (Akun PE vs Akun Pemantau) */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        currentUser={currentUser}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          saveAuthUser(user);
          showToast('success', `Berhasil beralih ke: ${user.name} (${user.role === 'PE' ? 'Akses Penuh Input & Edit' : 'Akses Monitoring Sahaja'})`);
        }}
        onSelectUser={(user) => {
          setCurrentUser(user);
          saveAuthUser(user);
          showToast('success', `Berhasil beralih ke: ${user.name} (${user.role === 'PE' ? 'Akses Penuh Input & Edit' : 'Akses Monitoring Sahaja'})`);
        }}
      />

      {/* Indikator Status Koneksi & Penyimpanan Perangkat Lokal */}
      <OfflineIndicator />

    </div>
  );
}
