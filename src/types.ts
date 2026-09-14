export interface DailyRecord {
  dateIndex: number;
  dateLabel: string;
  smvTarget: number | null;
  smvActual: number | null;
  pencapaian: number | null; // in percentage e.g. 102.03
}

export interface LineData {
  lineId: number;
  lineName: string;
  overallAchievement: number; // e.g. 72.41
  style: string;
  cmRate: number; // CM (Cut & Make) e.g. 37000
  actualRevenue: number;
  targetRevenue: number;
  varianceRevenue: number;
  variancePercent: number;
  daily: DailyRecord[];
}

export interface DashboardSummary {
  totalActualRevenue: number;
  totalTargetRevenue: number;
  netRevenueVariance: number;
  overallVariancePercent: number;
  avgLineAchievement: number;
  avgSmv: number;
  activeLinesCount: number;
  bestLine: { lineId: number; achievement: number };
  lowestLine: { lineId: number; achievement: number };
}

// Model & Target Reference (Bank Data Master)
export interface BankDataModel {
  id: string;
  modelCode: string; // Nama Model / Style
  buyer: string; // Buyer / Customer
  smvStandard: number; // SMV Standar (menit)
  targetDailyPcs: number; // Target Output per Hari (pcs/hari)
  targetTotalPcs: number; // Target Total Order / PO (pcs)
  manpowerStandard: number; // Standar Operator (orang)
  workingHoursStandard: number; // Standar Jam Kerja (jam)
  cmRate: number; // Tarif CM (Rp/pcs)
  targetEfficiency: number; // Target Efisiensi Standar (%)
  description?: string; // Spesifikasi / Catatan Kritis
  updatedAt?: string;
}

// Rekap Lembar Kerja Produksi Harian / Periodik
export interface MonthlyProductivityRecord {
  id: string;
  lineId: number;
  lineName: string;
  date: string; // Tanggal masukan (YYYY-MM-DD)
  style: string; // Model / Style Garment
  modelId?: string; // Relasi ke Bank Data
  styleScheduleId?: string; // Relasi ke Jadwal / Perencanaan Bulanan Style Schedule
  targetDailyPcs: number; // Target per Hari (pcs)
  actualDailyPcs: number; // Aktual per Hari (pcs)
  targetOutputPcs: number; // Target Total Akumulasi (pcs)
  actualOutputPcs: number; // Aktual Total Akumulasi (pcs)
  manpower: number; // Jumlah operator (MP)
  workingHours: number; // Jam kerja (jam)
  smvStandard: number; // Waktu standar (menit)
  efficiencyPercent: number; // Efisiensi %
  productivityPcsPerOp: number; // Output per operator (pcs/op)
  defectPercent: number; // Tingkat reject / defect %
  cmRate?: number; // Tarif CM per pcs mengikuti data style
  analysisStatus: 'optimal' | 'warning' | 'critical'; // Status Evaluasi Analisis
  analysisNote: string; // Kolom Analisis Produksi & Bottleneck
  note?: string; // Catatan operasional opsional
}

// Model Insiden / Hambatan Line & Disposisi Persetujuan PE dan FM
export interface LineIncident {
  id: string;
  lineId: number;
  lineName: string;
  date: string;
  style: string;
  severity: 'critical' | 'warning';
  issueType: 'bottleneck' | 'material_delay' | 'machine_breakdown' | 'high_defect' | 'efficiency_drop' | 'target_shortfall';
  title: string;
  description: string;
  targetDailyPcs: number;
  actualDailyPcs: number;
  deficitPcs: number;
  efficiencyPercent: number;
  defectPercent: number;
  rootCause: string;
  correctiveAction: string;
  preventiveAction: string;
  pic: string;
  targetResolutionTime: string;
  status: 'open' | 'in_progress' | 'resolved';
  // Persetujuan Production Engineer (PE)
  peVerified: boolean;
  peName: string;
  peNotes: string;
  peSignatureDate?: string;
  // Persetujuan Factory Manager (FM)
  fmApproved: boolean;
  fmName: string;
  fmNotes: string;
  fmSignatureDate?: string;
}

// Jadwal Style Sewing, Sisa Target, dan Perhitungan Lembur (OT)
export interface StyleScheduleRecord {
  id: string;
  lineId: number; // 1 to 10
  lineName: string; // e.g. "Line 1"
  styleName: string; // e.g. "DELAMI H067"
  buyer: string; // e.g. "DELAMI"
  modelId?: string; // Relasi opsional ke Bank Data Model
  orderQty: number; // Total Target Order / PO (pcs)
  dailyTargetQty: number; // Target per Hari (pcs/hari)
  actualQty: number; // Aktual tercapai sampai saat ini (pcs)
  startDate: string; // Format YYYY-MM-DD
  plannedEndDate: string; // Format YYYY-MM-DD
  standardWorkingHours: number; // Jam kerja reguler (e.g. 7 atau 8 jam)
  manpower: number; // Jumlah operator sewing
  smv: number; // Waktu standar (SMV)
  // Perhitungan otomatis Sisa & OT
  remainingQty: number; // sisa pcs = Math.max(0, orderQty - actualQty)
  needsOT: boolean; // sisa > 0
  otHoursNeeded: number; // jam lembur yang dibutuhkan
  otHoursPerDay: number; // kapasitas jam lembur per hari (default 2 atau 2.5 jam)
  otDaysNeeded: number; // hari lembur yang dibutuhkan
  otEndDate: string; // estimasi tanggal selesai lembur (YYYY-MM-DD)
  status: 'planning' | 'running' | 'overtime' | 'completed';
  notes?: string;
  updatedAt?: string;
}

// Model Konflik Tumpang Tindih (Overlap) Hari OT dengan Style Baru
export interface ScheduleOverlapConflict {
  id: string;
  lineId: number;
  lineName: string;
  date: string; // Tanggal terjadinya tumpang tindih (YYYY-MM-DD)
  previousStyle: {
    id: string;
    styleName: string;
    buyer: string;
    remainingQty: number;
    otHours: number;
    otPeriod: string; // e.g. "17:00 - 19:30"
  };
  incomingStyle: {
    id: string;
    styleName: string;
    buyer: string;
    orderQty: number;
    dailyTargetQty: number;
    regularPeriod: string; // e.g. "08:00 - 17:00"
  };
  severity: 'critical' | 'warning';
  recommendation: string;
}

// Modul Notifikasi Push & Pengingat Tugas
export type NotificationLifecycleStatus = 'baru' | 'follow_up' | 'proses_perbaikan' | 'selesai';

export interface UrgentPushNotification {
  id: string;
  timestamp: string;
  title: string;
  message: string;
  type: 'overlap' | 'ot_critical' | 'bottleneck' | 'urgent_update';
  lineId?: number;
  lineName?: string;
  styleName?: string;
  severity: 'critical' | 'warning' | 'info';
  read: boolean;
  actionUrl?: string;

  // Status Alur Penanganan & Rekam Tanggal
  status?: NotificationLifecycleStatus; // 'baru' | 'follow_up' | 'proses_perbaikan' | 'selesai'
  followUpDate?: string; // Tanggal ditindaklanjuti / di-follow up
  followUpNote?: string; // Catatan follow up
  processDate?: string; // Tanggal mulai proses perbaikan
  processNote?: string; // Catatan proses perbaikan
  completedDate?: string; // Tanggal selesai perbaikan
  completedNote?: string; // Catatan selesai
  picName?: string; // PIC Penanggung jawab
}

export interface DataSourceState {
  isLive: boolean;
  appsScriptUrl: string;
  lastSyncTime: string | null;
  autoSyncInterval: number; // in seconds, 0 = disabled
  status: 'idle' | 'syncing' | 'connected' | 'error';
  errorMessage?: string;
}

// Analisis Temuan Rekayasa Proses & Diagnostik SMV
export type PECategory = 
  | 'motion_waste' 
  | 'attachment_tooling' 
  | 'workstation_ergonomics' 
  | 'material_interlining' 
  | 'operator_skill' 
  | 'machine_tension';

export interface ProcessEngineeringFinding {
  id: string;
  date: string; // YYYY-MM-DD
  lineId: number;
  lineName: string;
  styleName: string;
  operationName: string;
  category: PECategory;
  smvStandard: number; // SMV standar (menit)
  smvActual: number; // SMV teramati PE (menit)
  varianceSeconds: number; // Selisih detik
  variancePercent: number; // Persentase deviasi (%)
  severity: 'critical' | 'warning' | 'normal';
  findingDescription: string;
  rootCause: string;
  kaizenAction: string;
  potentialSavingSeconds: number; // Penghematan detik per garment
  potentialOutputGainPcs: number; // Potensi kenaikan output harian (pcs/hari)
  status: 'implemented' | 'trial' | 'evaluation';
  peInspector: string;
  verifiedDate?: string;
  notes?: string;
}

// Analisis Fishbone (Ishikawa Diagram 6M)
export interface FishboneBranch {
  category: 'man' | 'machine' | 'material' | 'method' | 'measurement' | 'milieu';
  categoryLabel: string;
  causes: string[];
}

export interface FishboneAnalysis {
  effect: string; // Masalah utama / akibat (e.g. Tingkat Repair 12.5% di Line 2)
  branches: FishboneBranch[];
  primaryRootCause: string; // Akar masalah utama
  correctiveAction: string; // Tindakan perbaikan segera
  preventiveAction: string; // Tindakan pencegahan preventif
}

// Rincian Jenis Defect Sewing
export interface DefectBreakdown {
  brokenStitch: number; // Jahitan loncat / putus
  puckering: number; // Jahitan kerut / bergelombang
  brokenNeedle: number; // Jarum patah & tusukan jarum
  oilStains: number; // Noda minyak mesin / kotoran
  shading: number; // Belang warna kain antar panel
  measurementMismatch: number; // Ukuran tidak sesuai toleransi spek
  openSeam: number; // Jahitan terbuka / lolos obras
  other: number; // Lain-lain
}

// Data Repair / Defect per Line
export interface RepairDefectRecord {
  id: string;
  lineId: number;
  lineName: string;
  date: string; // YYYY-MM-DD
  style: string;
  totalCheckedPcs: number; // Total output diperiksa QC
  totalRepairPcs: number; // Total pakaian defect / perlu perbaikan
  repairPercent: number; // (totalRepairPcs / totalCheckedPcs) * 100
  isCritical10Percent: boolean; // repairPercent >= 10.0 -> Kolom bar merah
  defects: DefectBreakdown;
  fishbone: FishboneAnalysis;
  picName: string; // Nama PIC pengawas (dikosongkan / manual)
  verifiedBy: string; // Verifikator (dikosongkan / manual)
  notes?: string;
  updatedAt?: string;
}

// Keamanan & Akses Akun Pengguna
export type UserRole = 'PE' | 'MONITOR';

export interface AuthUser {
  id: string;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  roleTitle: string;
  department: string;
  canInputData: boolean; // Akun PE = true, Akun Monitor = false
  canPrintPdf: boolean;  // Akun PE = true, Akun Monitor = false
  canEditDelete: boolean;// Akun PE = true, Akun Monitor = false
  canBackupRestore: boolean; // Akun PE = true, Akun Monitor = false (bisa ekspor saja)
  lastLogin?: string;
}



