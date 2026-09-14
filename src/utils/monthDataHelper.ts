import { LineData, DailyRecord, MonthlyProductivityRecord, BankDataModel } from '../types';

/**
 * Membangun struktur LineData (matriks harian, revenue, dan pencapaian)
 * secara dinamis dari rekapitulasi harian (MonthlyProductivityRecord) untuk bulan yang dipilih.
 */
export function buildLinesFromMonthlyRecap(
  recordsForMonth: MonthlyProductivityRecord[],
  bankModels: BankDataModel[],
  selectedMonth: string
): LineData[] {
  if (!recordsForMonth || recordsForMonth.length === 0) {
    return [];
  }

  const [yearStr, monthStr] = selectedMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const daysInMonth = new Date(year, month, 0).getDate();

  // Kelompokkan records per lineId
  const lineGroups = new Map<number, MonthlyProductivityRecord[]>();
  for (const rec of recordsForMonth) {
    const list = lineGroups.get(rec.lineId) || [];
    list.push(rec);
    lineGroups.set(rec.lineId, list);
  }

  const resultLines: LineData[] = [];

  for (const [lineId, recs] of lineGroups.entries()) {
    // Urutkan berdasarkan tanggal menaik
    recs.sort((a, b) => a.date.localeCompare(b.date));

    const lineName = recs[0]?.lineName || `Line ${lineId}`;
    const latestStyle = recs[recs.length - 1]?.style || 'Unknown Style';

    // Helper untuk mencari CM Rate spesifik berdasarkan style data
    const getCmRateForStyle = (styleName: string, modelId?: string, explicitCmRate?: number): number => {
      if (explicitCmRate && explicitCmRate > 0) return explicitCmRate;
      const clean = styleName.trim().toLowerCase();
      const matchedBank = bankModels.find(
        bm => bm.modelCode.trim().toLowerCase() === clean ||
              clean.includes(bm.modelCode.trim().toLowerCase()) ||
              (modelId && bm.id === modelId)
      );
      return matchedBank?.cmRate || 37000;
    };

    // CM Rate untuk style utama lini ini
    const cmRate = getCmRateForStyle(latestStyle, recs[recs.length - 1]?.modelId, recs[recs.length - 1]?.cmRate);

    let sumTargetPcs = 0;
    let sumActualPcs = 0;
    let sumActualRevenue = 0;
    let sumTargetRevenue = 0;

    // Buat matriks harian untuk setiap tanggal dalam bulan ini
    const daily: DailyRecord[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dayStr = String(day).padStart(2, '0');
      const targetDate = `${selectedMonth}-${dayStr}`;
      const rec = recs.find(r => r.date === targetDate);

      if (rec) {
        sumTargetPcs += rec.targetDailyPcs || 0;
        sumActualPcs += rec.actualDailyPcs || 0;

        // Analisis revenue dan tarif CM mengikuti data style pada tanggal tersebut
        const itemCmRate = getCmRateForStyle(rec.style || latestStyle, rec.modelId, rec.cmRate);
        sumActualRevenue += (rec.actualDailyPcs || 0) * itemCmRate;
        sumTargetRevenue += (rec.targetDailyPcs || 0) * itemCmRate;

        // Hitung aktual SMV dari menit kerja riil dibagi jumlah output riil
        const totalMinutes = (rec.manpower || 40) * (rec.workingHours || 8) * 60;
        const actualSmv = rec.actualDailyPcs > 0 
          ? Number((totalMinutes / rec.actualDailyPcs).toFixed(2))
          : null;

        daily.push({
          dateIndex: day,
          dateLabel: `Tgl ${day}`,
          smvTarget: rec.smvStandard || null,
          smvActual: actualSmv,
          pencapaian: rec.efficiencyPercent || null
        });
      } else {
        daily.push({
          dateIndex: day,
          dateLabel: `Tgl ${day}`,
          smvTarget: null,
          smvActual: null,
          pencapaian: null
        });
      }
    }

    const actualRevenue = sumActualRevenue > 0 ? sumActualRevenue : sumActualPcs * cmRate;
    const targetRevenue = sumTargetRevenue > 0 ? sumTargetRevenue : sumTargetPcs * cmRate;
    const varianceRevenue = actualRevenue - targetRevenue;
    const variancePercent = targetRevenue > 0 ? (varianceRevenue / targetRevenue) * 100 : 0;
    const overallAchievement = sumTargetPcs > 0 
      ? Number(((sumActualPcs / sumTargetPcs) * 100).toFixed(2)) 
      : 0;

    resultLines.push({
      lineId,
      lineName,
      style: latestStyle,
      cmRate,
      overallAchievement,
      actualRevenue,
      targetRevenue,
      varianceRevenue,
      variancePercent,
      daily
    });
  }

  // Urutkan Line 1, Line 2, Line 3, dst
  resultLines.sort((a, b) => a.lineId - b.lineId);
  return resultLines;
}
