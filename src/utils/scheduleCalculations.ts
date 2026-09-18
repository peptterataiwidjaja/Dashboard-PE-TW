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
 * - Minggu = 0 jam (Libur / Tidak ada jadwal sewing)
 * - Sabtu = 5 jam kerja saja (300 menit)
 * - Senin - Jumat = standardHours (e.g. 8 jam / 480 menit)
 */
export function getStandardWorkingHoursForDate(date: Date | string, standardHours: number = 8): number {
  if (isSundayDate(date)) return 0;
  if (isSaturdayDate(date)) return 5;
  return standardHours;
}

export interface ShiftBreakdown {
  slot1: { time: string; minutes: number; hours: number; targetPcs: number };
  break1: { time: string; minutes: number };
  slot2: { time: string; minutes: number; hours: number; targetPcs: number };
  break2: { time: string; minutes: number };
  slot3: { time: string; minutes: number; hours: number; targetPcs: number };
  totalNormalMinutes: number;
  totalNormalHours: number;
  totalNormalTarget: number;
  saturdayMinutes: number;
  saturdayHours: number;
  saturdayTarget: number;
}

export interface AutoScheduleResult {
  baseDailyMonFri: number; // Kapasitas 8 jam (480 menit)
  baseDailySaturday: number; // Kapasitas Sabtu 5 jam (300 menit)
  targetDailyMonFri: number; // Target harian Senin-Jumat (8 jam)
  targetDailySaturday: number; // Target harian Sabtu (5 jam)
  effectiveSMV: number; // Nilai SMV
  plannedEndDate: string; // Tanggal selesai terhitung otomatis
  totalWorkingDays: number;
  totalCalendarDays: number;
  totalRegularHours: number;
  shifts: ShiftBreakdown;
  dailyBreakdown: Array<{
    date: string;
    dayName: string;
    workingHours: number;
    targetQty: number;
    cumulativeQty: number;
  }>;
}

/**
 * Hitung rincian shift kerja normal:
 * - Jam kerja normal 8 jam/hari (480 menit):
 *   1. 07.30 - 12.00 (4.5 jam / 270 menit)
 *   2. Istirahat: 12.01 - 13.00 (60 menit)
 *   3. 13.01 - 15.30 (2.5 jam / 150 menit)
 *   4. Istirahat: 15.30 - 16.00 (30 menit)
 *   5. 16.01 - 18.00 (1.0 jam kerja reguler / 60 menit)
 * - Hari Sabtu: 5 jam (300 menit)
 * - Hari Minggu: 0 jam (Libur, loncat ke hari Senin)
 */
export function calculateShiftBreakdown(smv: number, manpower: number): ShiftBreakdown {
  const safeSMV = Math.max(0.1, Number(smv) || 14.5);
  const safeMP = Math.max(1, Number(manpower) || 36);

  // Menit kerja per slot
  const slot1Min = 270; // 07.30 - 12.00 = 4.5 jam
  const slot2Min = 150; // 13.01 - 15.30 = 2.5 jam
  const slot3Min = 60;  // 16.01 - 18.00 = 1.0 jam (melengkapi 8 jam normal)
  const satMin = 300;   // Sabtu = 5 jam

  const target1 = Math.round((safeMP * slot1Min) / safeSMV);
  const target2 = Math.round((safeMP * slot2Min) / safeSMV);
  const target3 = Math.round((safeMP * slot3Min) / safeSMV);
  const totalNormal = target1 + target2 + target3;
  const satTarget = Math.round((safeMP * satMin) / safeSMV);

  return {
    slot1: { time: '07.30 - 12.00', minutes: slot1Min, hours: 4.5, targetPcs: target1 },
    break1: { time: '12.01 - 13.00', minutes: 60 },
    slot2: { time: '13.01 - 15.30', minutes: slot2Min, hours: 2.5, targetPcs: target2 },
    break2: { time: '15.30 - 16.00', minutes: 30 },
    slot3: { time: '16.01 - 18.00', minutes: slot3Min, hours: 1.0, targetPcs: target3 },
    totalNormalMinutes: 480,
    totalNormalHours: 8.0,
    totalNormalTarget: totalNormal,
    saturdayMinutes: 300,
    saturdayHours: 5.0,
    saturdayTarget: satTarget
  };
}

/**
 * Hitung otomatis target harian & durasi selesai jadwal style dari SMV & Manpower:
 * - Jam kerja normal: 8 jam/hari (Senin-Jumat)
 * - Jam kerja Sabtu: 5 jam
 * - Hari Minggu: Libur / diloncat otomatis ke hari Senin
 * - Proyeksi hari selesai (plannedEndDate) dihitung otomatis tanpa lembur (OT)
 */
export function calculateAutoScheduleFromSMV({
  orderQty,
  smv,
  manpower = 36,
  startDate,
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
  
  const shifts = calculateShiftBreakdown(safeSMV, safeMP);
  const targetDailyMonFri = shifts.totalNormalTarget;
  const targetDailySaturday = fiveDayWeek ? 0 : shifts.saturdayTarget;

  // Cek tanggal mulai: jika hari Minggu, otomatis loncat ke hari Senin
  const start = new Date(startDate || formatDateYMD(new Date()));
  if (start.getDay() === 0) {
    start.setDate(start.getDate() + 1); // Loncat ke hari Senin!
  }

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
      // Minggu = Libur / Otomatis loncat ke hari berikutnya
      curr.setDate(curr.getDate() + 1);
      loopCount++;
      continue;
    } else if (dayOfWeek === 6) {
      // Sabtu: 5 jam
      if (!fiveDayWeek && targetDailySaturday > 0) {
        dayHours = 5;
        dayTarget = Math.min(safeOrder - accumulated, targetDailySaturday);
        accumulated += dayTarget;
        workingDaysCount += 5 / 8;
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

    if (dayHours > 0) {
      breakdown.push({
        date: dateStr,
        dayName: dayNames[dayOfWeek],
        workingHours: dayHours,
        targetQty: dayTarget,
        cumulativeQty: accumulated
      });
    }

    if (accumulated >= safeOrder) {
      break;
    }

    curr.setDate(curr.getDate() + 1);
    loopCount++;
  }

  const plannedEndDate = formatDateYMD(curr);
  const totalCalendarDays = loopCount + 1;

  return {
    baseDailyMonFri: targetDailyMonFri,
    baseDailySaturday: targetDailySaturday,
    targetDailyMonFri,
    targetDailySaturday,
    effectiveSMV: safeSMV,
    plannedEndDate,
    totalWorkingDays: Math.ceil(workingDaysCount),
    totalCalendarDays,
    totalRegularHours: totalHours,
    shifts,
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
 * - Setiap hari Minggu: LIBUR / TIDAK ADA JADWAL SEWING (0 jam)
 * - Setiap hari Sabtu: HANYA BERLAKU 5 JAM KERJA (5/8 = 0.625 hari kerja)
 * - Senin s/d Jumat: 8 jam kerja normal (1.0 hari kerja)
 */
export function addWorkingDays(startDateStr: string, daysToAdd: number): string {
  if (daysToAdd <= 0) return startDateStr;
  const curr = new Date(startDateStr);
  let accumulated = 0;
  
  while (accumulated < daysToAdd) {
    curr.setDate(curr.getDate() + 1);
    const dayOfWeek = curr.getDay();
    if (dayOfWeek === 0) {
      // Minggu = Libur (Tidak ada jadwal sewing)
      continue;
    } else if (dayOfWeek === 6) {
      // Sabtu = 5 jam kerja saja (5/8 hari)
      accumulated += 5 / 8;
    } else {
      // Senin - Jumat = 8 jam kerja penuh (1.0 hari)
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

// Deteksi Otomatis Potensi Tumpang Tindih (Overlap) Style pada Kategori Line
// Input rekap harian mengurangi sisa target produksi sehingga overlap terupdate otomatis
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

  // Periksa setiap line
  for (const lineIdStr of Object.keys(byLine)) {
    const lineId = Number(lineIdStr);
    const lineSchedules = byLine[lineId];

    for (let i = 0; i < lineSchedules.length; i++) {
      for (let j = i + 1; j < lineSchedules.length; j++) {
        const s1 = lineSchedules[i];
        const s2 = lineSchedules[j];

        // Jika salah satu sudah selesai penuh (sisa = 0), tidak ada konflik tumpang tindih
        if (s1.remainingQty <= 0 || s2.remainingQty <= 0) {
          continue;
        }

        // Tentukan rentang tumpang tindih tanggal kalender
        const startOverlap = s1.startDate > s2.startDate ? s1.startDate : s2.startDate;
        const endOverlap = s1.plannedEndDate < s2.plannedEndDate ? s1.plannedEndDate : s2.plannedEndDate;

        if (startOverlap <= endOverlap) {
          let currDate = new Date(startOverlap);
          const endDate = new Date(endOverlap);

          while (currDate <= endDate) {
            // Lewati hari Minggu karena pabrik libur
            if (currDate.getDay() !== 0) {
              const dateStr = formatDateYMD(currDate);
              const conflictId = `overlap-${lineId}-${s1.id}-${s2.id}-${dateStr}`;

              if (!conflicts.some(c => c.id === conflictId)) {
                conflicts.push({
                  id: conflictId,
                  lineId,
                  lineName: s1.lineName || `Line ${lineId}`,
                  date: dateStr,
                  previousStyle: {
                    id: s1.id,
                    styleName: s1.styleName,
                    buyer: s1.buyer,
                    remainingQty: s1.remainingQty,
                    otHours: 0,
                    otPeriod: 'Shift 07.30 - 18.00'
                  },
                  incomingStyle: {
                    id: s2.id,
                    styleName: s2.styleName,
                    buyer: s2.buyer,
                    orderQty: s2.orderQty,
                    dailyTargetQty: s2.dailyTargetQty,
                    regularPeriod: 'Shift 07.30 - 18.00'
                  },
                  severity: (s1.remainingQty > 500 || s2.remainingQty > 500) ? 'critical' : 'warning',
                  recommendation: `Line ${lineId} teralokasi untuk 2 style bersamaan (${s1.styleName} sisa target: ${s1.remainingQty.toLocaleString()} pcs & ${s2.styleName} target: ${s2.orderQty.toLocaleString()} pcs) pada tanggal ${dateStr}. Sesuaikan jadwal mulai atau pisahkan ke line sewing lain.`
                });
              }
            }

            currDate.setDate(currDate.getDate() + 1);
          }
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
