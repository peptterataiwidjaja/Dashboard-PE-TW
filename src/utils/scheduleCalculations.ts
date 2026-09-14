import { StyleScheduleRecord, ScheduleOverlapConflict, UrgentPushNotification } from '../types';

export const SCHEDULES_STORAGE_KEY = 'tw_style_schedules_v1';
export const URGENT_NOTIFICATIONS_STORAGE_KEY = 'tw_urgent_notifications_v1';

// Format YYYY-MM-DD
export function formatDateYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Cek apakah tanggal adalah hari Minggu (Pabrik Libur)
 */
export function isSundayDate(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.getDay() === 0;
}

/**
 * Cek apakah tanggal adalah hari Sabtu (Masuk Setengah Hari)
 */
export function isSaturdayDate(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.getDay() === 6;
}

/**
 * Mendapatkan jam kerja standar hari:
 * - Minggu = 0 jam (Libur)
 * - Sabtu = setengah hari (standardHours / 2, e.g. 4 jam)
 * - Senin - Jumat = standardHours (e.g. 8 jam)
 */
export function getStandardWorkingHoursForDate(date: Date | string, standardHours: number = 8): number {
  if (isSundayDate(date)) return 0;
  if (isSaturdayDate(date)) return Math.max(1, Math.round(standardHours / 2));
  return standardHours;
}

export interface AutoScheduleResult {
  baseDailyMonFri: number; // Kapasitas murni tanpa buffer (8 jam)
  baseDailySaturday: number; // Kapasitas murni Sabtu (5 jam)
  targetDailyMonFri: number; // Target harian Senin-Jumat dengan buffer 10%
  targetDailySaturday: number; // Target harian Sabtu (5 jam) dengan buffer 10%
  effectiveSMV: number; // SMV standar + 10% buffer
  plannedEndDate: string; // Tanggal selesai terhitung otomatis
  totalWorkingDays: number;
  totalCalendarDays: number;
  totalRegularHours: number;
  dailyBreakdown: Array<{
    date: string;
    dayName: string;
    workingHours: number;
    targetQty: number;
    cumulativeQty: number;
  }>;
}

/**
 * Hitung otomatis target harian & durasi selesai jadwal style dari SMV:
 * - Jam kerja: Senin - Jumat = 8 jam (480 menit), Sabtu = 5 jam (300 menit), Minggu = 0 jam (Libur).
 * - Penambahan safety buffer 10% waktu terhadap target awal.
 * - Plot tanggal selesai langsung dari tanggal mulai.
 */
export function calculateAutoScheduleFromSMV({
  orderQty,
  smv,
  manpower = 36,
  startDate,
  bufferPercent = 10,
  fiveDayWeek = false
}: {
  orderQty: number;
  smv: number;
  manpower?: number;
  startDate: string;
  bufferPercent?: number;
  fiveDayWeek?: boolean;
}): AutoScheduleResult {
  const safeSMV = Math.max(0.1, Number(smv) || 14.5);
  const safeMP = Math.max(1, Number(manpower) || 36);
  const safeOrder = Math.max(1, Number(orderQty) || 5000);
  const safeBuffer = Number(bufferPercent) || 10;
  
  // SMV dengan safety buffer 10% waktu (atau target efisiensi 90%)
  const effectiveSMV = safeSMV * (1 + safeBuffer / 100);

  // Kapasitas per hari kerja:
  // Senin - Jumat: 8 jam (480 menit)
  const baseDailyMonFri = Math.round((safeMP * 480) / safeSMV);
  const targetDailyMonFri = Math.round((safeMP * 480) / effectiveSMV);

  // Sabtu: 5 jam (300 menit) jika 6 hari, atau 0 jika 5 hari kerja
  const satHours = fiveDayWeek ? 0 : 5;
  const baseDailySaturday = satHours > 0 ? Math.round((safeMP * 300) / safeSMV) : 0;
  const targetDailySaturday = satHours > 0 ? Math.round((safeMP * 300) / effectiveSMV) : 0;

  // Proyeksikan tanggal selesai mulai dari startDate
  const start = new Date(startDate || formatDateYMD(new Date()));
  const curr = new Date(start);
  let accumulated = 0;
  let workingDaysCount = 0;
  let totalHours = 0;
  const breakdown: AutoScheduleResult['dailyBreakdown'] = [];

  const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  let loopCount = 0;
  while (accumulated < safeOrder && loopCount < 400) {
    const dayOfWeek = curr.getDay();
    const dateStr = formatDateYMD(curr);
    let dayTarget = 0;
    let dayHours = 0;

    if (dayOfWeek === 0) {
      // Minggu pabrik libur
      dayTarget = 0;
      dayHours = 0;
    } else if (dayOfWeek === 6) {
      // Sabtu: 5 jam reguler (atau 0 jika 5 hari)
      if (!fiveDayWeek && targetDailySaturday > 0) {
        dayHours = 5;
        dayTarget = Math.min(safeOrder - accumulated, targetDailySaturday);
        accumulated += dayTarget;
        workingDaysCount += 0.625; // Rasio 5/8 hari kerja
        totalHours += 5;
      }
    } else {
      // Senin s/d Jumat: 8 jam reguler
      dayHours = 8;
      dayTarget = Math.min(safeOrder - accumulated, targetDailyMonFri);
      accumulated += dayTarget;
      workingDaysCount += 1.0;
      totalHours += 8;
    }

    breakdown.push({
      date: dateStr,
      dayName: dayNames[dayOfWeek],
      workingHours: dayHours,
      targetQty: dayTarget,
      cumulativeQty: accumulated
    });

    if (accumulated >= safeOrder) {
      break;
    }

    curr.setDate(curr.getDate() + 1);
    loopCount++;
  }

  const plannedEndDate = formatDateYMD(curr);
  const totalCalendarDays = loopCount + 1;

  return {
    baseDailyMonFri,
    baseDailySaturday,
    targetDailyMonFri,
    targetDailySaturday,
    effectiveSMV: Number(effectiveSMV.toFixed(2)),
    plannedEndDate,
    totalWorkingDays: Math.ceil(workingDaysCount),
    totalCalendarDays,
    totalRegularHours: totalHours,
    dailyBreakdown: breakdown
  };
}

export interface WorkScenarioComparison {
  scheduleId: string;
  styleName: string;
  buyer: string;
  lineId: number;
  lineName: string;
  orderQty: number;
  smv: number;
  manpower: number;
  startDate: string;
  
  // Skenario 6 Hari Kerja (Standar: Sen-Jum 8 jam, Sab 5 jam = 45 jam/minggu)
  sixDay: {
    plannedEndDate: string;
    totalCalendarDays: number;
    totalWorkingDays: number;
    weeklyRegularHours: number;
    dailyTargetMonFri: number;
    dailyTargetSat: number;
  };

  // Skenario 5 Hari Kerja Tanpa Lembur Tambahan (Sabtu Libur = 40 jam/minggu)
  fiveDayWithoutOT: {
    plannedEndDate: string;
    delayCalendarDays: number; // Keterlambatan hari kalender
    totalCalendarDays: number;
    totalWorkingDays: number;
    lostWeeklyHours: number; // -5 jam / minggu
    deficitOutputPcs: number; // Output hilang tiap Sabtu
  };

  // Skenario 5 Hari Kerja DENGAN Lembur Kompensasi (Senin-Jumat +1 Jam OT/hari = 5 jam OT/minggu)
  fiveDayWithCompensationOT: {
    plannedEndDate: string;
    otHoursPerDay: number; // 1.0 jam/hari (17:00 - 18:00)
    totalWeeklyOTHours: number; // 5.0 jam/minggu
    totalOTHoursForOrder: number; // Jam lembur terakumulasi
    isDeliveredOnTime: boolean;
  };
}

/**
 * Mensimulasikan komparasi jadwal style jika pabrik menerapkan 5 hari kerja vs 6 hari kerja
 */
export function simulateFiveDayVsSixDayScenario(schedule: StyleScheduleRecord): WorkScenarioComparison {
  const smv = schedule.smv || 14.5;
  const manpower = schedule.manpower || 36;
  const orderQty = schedule.orderQty || 5000;
  const startDate = schedule.startDate || formatDateYMD(new Date());

  // 1. Skenario 6 Hari (Standar)
  const sixDayRes = calculateAutoScheduleFromSMV({
    orderQty,
    smv,
    manpower,
    startDate,
    bufferPercent: 10,
    fiveDayWeek: false
  });

  // 2. Skenario 5 Hari (Sabtu Libur)
  const fiveDayRes = calculateAutoScheduleFromSMV({
    orderQty,
    smv,
    manpower,
    startDate,
    bufferPercent: 10,
    fiveDayWeek: true
  });

  const delayCalendarDays = Math.max(0, fiveDayRes.totalCalendarDays - sixDayRes.totalCalendarDays);
  const lostOutputSaturday = sixDayRes.targetDailySaturday;

  // 3. Skenario 5 Hari dengan Kompensasi Lembur:
  // Untuk mengejar 5 jam Sabtu yang hilang, line lembur 1 jam setiap Senin s/d Jumat (5 jam/minggu).
  // Kecepatan lembur: output per jam lembur = (manpower * 60) / effectiveSMV
  const hourlyOutput = (manpower * 60) / sixDayRes.effectiveSMV;
  const totalWeeks = Math.max(1, Math.ceil(sixDayRes.totalWorkingDays / 5.6));
  const totalWeeklyOTHours = 5.0; // 1 jam/hari x 5 hari
  const totalOTHoursForOrder = Math.round(totalWeeks * totalWeeklyOTHours);

  return {
    scheduleId: schedule.id,
    styleName: schedule.styleName,
    buyer: schedule.buyer,
    lineId: schedule.lineId,
    lineName: schedule.lineName,
    orderQty,
    smv,
    manpower,
    startDate,
    sixDay: {
      plannedEndDate: sixDayRes.plannedEndDate,
      totalCalendarDays: sixDayRes.totalCalendarDays,
      totalWorkingDays: sixDayRes.totalWorkingDays,
      weeklyRegularHours: 45,
      dailyTargetMonFri: sixDayRes.targetDailyMonFri,
      dailyTargetSat: sixDayRes.targetDailySaturday
    },
    fiveDayWithoutOT: {
      plannedEndDate: fiveDayRes.plannedEndDate,
      delayCalendarDays,
      totalCalendarDays: fiveDayRes.totalCalendarDays,
      totalWorkingDays: fiveDayRes.totalWorkingDays,
      lostWeeklyHours: 5,
      deficitOutputPcs: lostOutputSaturday
    },
    fiveDayWithCompensationOT: {
      plannedEndDate: sixDayRes.plannedEndDate, // Sama dengan skenario 6 hari karena terkejar lembur
      otHoursPerDay: 1.0,
      totalWeeklyOTHours: 5.0,
      totalOTHoursForOrder,
      isDeliveredOnTime: true
    }
  };
}

/**
 * Tambah hari kerja pada kalender:
 * - Setiap hari Minggu: LIBUR (0 hari kerja)
 * - Setiap hari Sabtu: MASUK SETENGAH HARI (0.5 hari kerja)
 * - Senin s/d Jumat: 1.0 hari kerja normal
 */
export function addWorkingDays(startDateStr: string, daysToAdd: number): string {
  if (daysToAdd <= 0) return startDateStr;
  const curr = new Date(startDateStr);
  let accumulated = 0;
  
  while (accumulated < daysToAdd) {
    curr.setDate(curr.getDate() + 1);
    const dayOfWeek = curr.getDay();
    if (dayOfWeek === 0) {
      // Minggu = Libur
      continue;
    } else if (dayOfWeek === 6) {
      // Sabtu = Masuk Setengah Hari (0.5 hari)
      accumulated += 0.5;
    } else {
      // Senin - Jumat = 1.0 hari kerja penuh
      accumulated += 1.0;
    }
  }
  return formatDateYMD(curr);
}

// Hitung metrik jadwal, sisa, dan lembur (OT)
export function calculateScheduleMetrics(
  base: Omit<StyleScheduleRecord, 'remainingQty' | 'needsOT' | 'otHoursNeeded' | 'otDaysNeeded' | 'otEndDate' | 'status'> & {
    remainingQty?: number;
    needsOT?: boolean;
    otHoursNeeded?: number;
    otDaysNeeded?: number;
    otEndDate?: string;
    status?: 'planning' | 'running' | 'overtime' | 'completed';
  }
): StyleScheduleRecord {
  const orderQty = Number(base.orderQty) || 0;
  const actualQty = Number(base.actualQty) || 0;
  const dailyTargetQty = Number(base.dailyTargetQty) || 500;
  const standardWorkingHours = Number(base.standardWorkingHours) || 8;
  const otHoursPerDay = Number(base.otHoursPerDay) || 2;
  const remainingQty = Math.max(0, orderQty - actualQty);

  // Kapasitas output per jam reguler
  const ratePerHour = dailyTargetQty > 0 && standardWorkingHours > 0 
    ? dailyTargetQty / standardWorkingHours 
    : 60;

  // Jam lembur yang dibutuhkan untuk menutup sisa target
  const otHoursNeeded = remainingQty > 0 
    ? Number((remainingQty / ratePerHour).toFixed(1))
    : 0;

  // Hari lembur yang dibutuhkan (asumsi lembur reguler 2 jam / hari)
  const otDaysNeeded = otHoursNeeded > 0
    ? Math.max(1, Math.ceil(otHoursNeeded / otHoursPerDay))
    : 0;

  // Tanggal selesai lembur
  const otEndDate = otDaysNeeded > 0
    ? addWorkingDays(base.plannedEndDate, otDaysNeeded)
    : base.plannedEndDate;

  // Status otomatis
  let status: 'planning' | 'running' | 'overtime' | 'completed' = base.status || 'running';
  const todayStr = formatDateYMD(new Date());

  if (remainingQty === 0 && actualQty >= orderQty) {
    status = 'completed';
  } else if (todayStr > base.plannedEndDate && remainingQty > 0) {
    status = 'overtime';
  } else if (todayStr >= base.startDate && todayStr <= base.plannedEndDate) {
    status = 'running';
  } else if (todayStr < base.startDate) {
    status = 'planning';
  }

  return {
    ...base,
    remainingQty,
    needsOT: remainingQty > 0,
    otHoursNeeded,
    otHoursPerDay,
    otDaysNeeded,
    otEndDate,
    status,
    updatedAt: new Date().toISOString()
  };
}

// Deteksi Konflik Tumpang Tindih (Overlap) Style Baru vs Sisa OT Style Lama pada Kategori Line
export function detectScheduleOverlaps(schedules: StyleScheduleRecord[]): ScheduleOverlapConflict[] {
  const conflicts: ScheduleOverlapConflict[] = [];

  // Kelompokkan berdasarkan Line
  const byLine: { [lineId: number]: StyleScheduleRecord[] } = {};
  for (const item of schedules) {
    if (!byLine[item.lineId]) {
      byLine[item.lineId] = [];
    }
    byLine[item.lineId].push(item);
  }

  // Periksa urutan kronologis per line
  for (const lineIdStr of Object.keys(byLine)) {
    const lineId = Number(lineIdStr);
    const lineSchedules = byLine[lineId].sort((a, b) => a.startDate.localeCompare(b.startDate));

    for (let i = 0; i < lineSchedules.length - 1; i++) {
      const prev = lineSchedules[i];
      const next = lineSchedules[i + 1];

      // Jika style sebelumnya masih memiliki sisa dan jadwal OT melampaui atau sama dengan start date style baru
      if (prev.needsOT && prev.otDaysNeeded > 0 && prev.otEndDate >= next.startDate) {
        
        // Loop setiap hari overlap dari next.startDate hingga prev.otEndDate
        let currDate = new Date(next.startDate);
        const otEnd = new Date(prev.otEndDate);

        while (currDate <= otEnd) {
          const dateStr = formatDateYMD(currDate);
          
          conflicts.push({
            id: `overlap-${prev.id}-${next.id}-${dateStr}`,
            lineId: prev.lineId,
            lineName: prev.lineName,
            date: dateStr,
            previousStyle: {
              id: prev.id,
              styleName: prev.styleName,
              buyer: prev.buyer,
              remainingQty: prev.remainingQty,
              otHours: prev.otHoursPerDay,
              otPeriod: '17:00 - 19:30 (Jam Lembur)'
            },
            incomingStyle: {
              id: next.id,
              styleName: next.styleName,
              buyer: next.buyer,
              orderQty: next.orderQty,
              dailyTargetQty: next.dailyTargetQty,
              regularPeriod: '08:00 - 17:00 (Shift Reguler)'
            },
            severity: prev.remainingQty > 500 ? 'critical' : 'warning',
            recommendation: `Alokasikan mesin sewing utama untuk ${next.styleName} pada shift reguler (08:00-17:00). Lanjutkan sisa ${prev.remainingQty} pcs ${prev.styleName} di jam lembur (17:00-19:30) dengan tim operator khusus agar tidak terjadi kemacetan setup.`
          });

          // Maju 1 hari
          currDate.setDate(currDate.getDate() + 1);
        }
      }
    }
  }

  return conflicts;
}

// Data Bawaan Jadwal Style Sewing & Overtime
export const INITIAL_STYLE_SCHEDULES: StyleScheduleRecord[] = [];

// Helper penyimpanan lokal
export function loadSavedSchedules(): StyleScheduleRecord[] {
  try {
    const raw = localStorage.getItem(SCHEDULES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(item => calculateScheduleMetrics(item));
      }
    }
  } catch (e) {
    console.error('Failed loading saved schedules:', e);
  }
  return INITIAL_STYLE_SCHEDULES;
}

export function saveSchedules(schedules: StyleScheduleRecord[]) {
  try {
    localStorage.setItem(SCHEDULES_STORAGE_KEY, JSON.stringify(schedules));
  } catch (e) {
    console.error('Failed saving schedules:', e);
  }
}

// Notifikasi Push Storage & Web Notification API
export function loadSavedUrgentNotifications(): UrgentPushNotification[] {
  try {
    const raw = localStorage.getItem(URGENT_NOTIFICATIONS_STORAGE_KEY);
    if (raw) {
      const parsed: UrgentPushNotification[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(item => ({
          ...item,
          status: item.status || 'baru',
          followUpDate: item.followUpDate || undefined,
          processDate: item.processDate || undefined,
          completedDate: item.completedDate || undefined
        }));
      }
    }
  } catch (e) {
    console.error('Failed loading urgent notifications:', e);
  }
  
  return [];
}

export function saveUrgentNotifications(notifications: UrgentPushNotification[]) {
  try {
    localStorage.setItem(URGENT_NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
  } catch (e) {
    console.error('Failed saving urgent notifications:', e);
  }
}

// Web Push Notification Helper
export async function requestBrowserNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('Browser ini tidak mendukung Push Notification API.');
    return 'denied';
  }
  try {
    return await Notification.requestPermission();
  } catch (e) {
    console.error('Error requesting notification permission:', e);
    return 'denied';
  }
}

export function sendBrowserPushNotification(title: string, body: string, iconUrl?: string) {
  if (!('Notification' in window)) {
    return false;
  }
  if (Notification.permission === 'granted') {
    try {
      const notif = new Notification(title, {
        body,
        icon: iconUrl || '/favicon.ico',
        badge: '/favicon.ico',
        vibrate: [200, 100, 200]
      } as any);
      
      notif.onclick = () => {
        window.focus();
        notif.close();
      };
      return true;
    } catch (e) {
      console.warn('Direct notification error (possibly iframe sandbox constraint):', e);
      return false;
    }
  }
  return false;
}
