import { LineIncident, MonthlyProductivityRecord, LineData } from '../types';

const INCIDENTS_STORAGE_KEY = 'tw_line_incidents_v2';

export const DEFAULT_PE_NAME = '';
export const DEFAULT_FM_NAME = '';

/**
 * Mendeteksi secara otomatis hambatan & masalah di line produksi
 * (Bottleneck, defect tinggi, efisiensi drop, atau defisit target)
 */
export function detectLineIncidents(
  monthlyRecap: MonthlyProductivityRecord[],
  lines: LineData[]
): LineIncident[] {
  const existingSaved = loadSavedIncidents();
  const existingMap = new Map(existingSaved.map(item => [item.id, item]));

  const detected: LineIncident[] = [];

  // 1. Analisis dari Rekap Harian
  for (const record of monthlyRecap) {
    const targetDaily = record.targetDailyPcs || record.targetOutputPcs || 0;
    const actualDaily = record.actualDailyPcs || record.actualOutputPcs || 0;
    const deficit = targetDaily - actualDaily;
    const achRatio = targetDaily > 0 ? (actualDaily / targetDaily) * 100 : 100;

    const isCritical = 
      record.analysisStatus === 'critical' || 
      record.defectPercent >= 3.0 || 
      record.efficiencyPercent < 60 || 
      achRatio < 80;

    const isWarning = 
      record.analysisStatus === 'warning' || 
      record.defectPercent >= 2.0 || 
      record.efficiencyPercent < 70 || 
      achRatio < 90;

    if (isCritical || isWarning) {
      const incidentId = `inc-${record.id}`;
      const saved = existingMap.get(incidentId);

      let issueType: LineIncident['issueType'] = 'bottleneck';
      let title = `Bottleneck & Defisit Output ${record.lineName}`;
      let rootCause = 'Ketidakseimbangan beban kerja antar stasiun sewing dan keterlambatan pasokan komponen.';
      let correctiveAction = 'Re-balancing stasiun kerja, penambahan 1 helper bantuan, serta pemantauan siklus per jam.';
      let preventiveAction = 'Evaluasi SMV standar pra-produksi bersama tim IE dan pelatihan operator di stasiun kritis.';
      let pic = 'Chief Line & Leader QC';

      if (record.defectPercent >= 2.5) {
        issueType = 'high_defect';
        title = `Tingkat Defect Tinggi (${record.defectPercent.toFixed(1)}%) di ${record.lineName}`;
        rootCause = 'Jarum tumpul / settingan tension benang obras kurang stabil dan operator belum terbiasa dengan karakteristik bahan.';
        correctiveAction = 'Pemeriksaan dan kalibrasi mesin jahit/obras oleh mekanik, ganti jarum, serta briefing QC end-line.';
        preventiveAction = 'Quality check berkala tiap 2 jam dan inspeksi bahan sebelum masuk line sewing.';
        pic = 'Leader QC Sewing & Mekanik';
      } else if (record.efficiencyPercent < 65) {
        issueType = 'efficiency_drop';
        title = `Efisiensi Drop (${record.efficiencyPercent.toFixed(1)}%) di ${record.lineName}`;
        rootCause = 'Waktu siklus (cycle time) melebihi SMV standar pada operasi kritis (pemasangan kerah / lengan).';
        correctiveAction = 'Pendampingan langsung oleh Production Engineer (PE) untuk optimalisasi motion & penataan bundel.';
        preventiveAction = 'Penyesuaian layout line sewing dan pelatihan operator dengan metode kerja standar IE.';
        pic = 'Production Engineer & Supervisor';
      } else if (record.analysisNote.toLowerCase().includes('supply') || record.analysisNote.toLowerCase().includes('interlining')) {
        issueType = 'material_delay';
        title = `Keterlambatan Pasokan Material di ${record.lineName}`;
        rootCause = 'Keterlambatan suplai komponen interlining/aksesoris dari bagian cutting/persiapan.';
        correctiveAction = 'Eskalasi ke Supervisor Cutting & PPIC untuk prioritas pasokan batch berikutnya.';
        preventiveAction = 'Buffer stock minimal 2 jam kerja sebelum line produksi berjalan.';
        pic = 'PPIC & Supervisor Cutting';
      }

      const incident: LineIncident = {
        id: incidentId,
        lineId: record.lineId,
        lineName: record.lineName,
        date: record.date || new Date().toISOString().split('T')[0],
        style: record.style,
        severity: isCritical ? 'critical' : 'warning',
        issueType,
        title: saved?.title || title,
        description: saved?.description || record.analysisNote || `${record.lineName} mengalami defisit ${deficit > 0 ? deficit : 0} pcs/hari dengan efisiensi ${record.efficiencyPercent}%.`,
        targetDailyPcs: targetDaily,
        actualDailyPcs: actualDaily,
        deficitPcs: Math.max(0, deficit),
        efficiencyPercent: record.efficiencyPercent,
        defectPercent: record.defectPercent,
        rootCause: saved?.rootCause || rootCause,
        correctiveAction: saved?.correctiveAction || correctiveAction,
        preventiveAction: saved?.preventiveAction || preventiveAction,
        pic: saved?.pic || pic,
        targetResolutionTime: saved?.targetResolutionTime || 'Hari ini (Shift 1 & 2)',
        status: saved?.status || (isCritical ? 'open' : 'in_progress'),
        peVerified: saved?.peVerified ?? false,
        peName: saved?.peName || DEFAULT_PE_NAME,
        peNotes: saved?.peNotes || (isCritical ? 'Perlu tindakan re-balancing layout sewing & perbantuan 1 operator di stasiun obras.' : 'Monitoring ketat output per jam oleh IE Team.'),
        peSignatureDate: saved?.peSignatureDate,
        fmApproved: saved?.fmApproved ?? false,
        fmName: saved?.fmName || DEFAULT_FM_NAME,
        fmNotes: saved?.fmNotes || (isCritical ? 'Disetujui lembur 1.5 jam & koordinasi dengan bagian cutting untuk pasokan bahan.' : 'Disetujui untuk tindakan perbaikan operasional segera.'),
        fmSignatureDate: saved?.fmSignatureDate
      };

      detected.push(incident);
    }
  }

  // Simpan hasil gabungan ke localStorage agar status verifikasi PE & FM tidak hilang
  saveIncidents(detected);
  return detected;
}

export function loadSavedIncidents(): LineIncident[] {
  try {
    const raw = localStorage.getItem(INCIDENTS_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error loading incidents:', err);
  }
  return [];
}

export function saveIncidents(incidents: LineIncident[]) {
  try {
    localStorage.setItem(INCIDENTS_STORAGE_KEY, JSON.stringify(incidents));
  } catch (err) {
    console.error('Error saving incidents:', err);
  }
}

export function updateIncidentInStorage(updatedIncident: LineIncident): LineIncident[] {
  const current = loadSavedIncidents();
  const index = current.findIndex(i => i.id === updatedIncident.id);
  let updatedList: LineIncident[];
  if (index >= 0) {
    updatedList = current.map(i => i.id === updatedIncident.id ? updatedIncident : i);
  } else {
    updatedList = [...current, updatedIncident];
  }
  saveIncidents(updatedList);
  return updatedList;
}

