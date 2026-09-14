import { MonthlyProductivityRecord } from '../types';

export const INITIAL_MONTHLY_RECAP: MonthlyProductivityRecord[] = [];

export function calculateEfficiency(
  actualOutputPcs: number, 
  smvStandard: number, 
  manpower: number, 
  workingHours: number
): number {
  if (manpower <= 0 || workingHours <= 0) return 0;
  const availableMinutes = manpower * workingHours * 60;
  const earnedMinutes = actualOutputPcs * smvStandard;
  return Number(((earnedMinutes / availableMinutes) * 100).toFixed(2));
}

export function calculateProductivityPerOp(
  actualOutputPcs: number, 
  manpower: number
): number {
  if (manpower <= 0) return 0;
  return Number((actualOutputPcs / manpower).toFixed(1));
}

export function generateSmartAnalysis(
  actualDaily: number,
  targetDaily: number,
  efficiency: number,
  defectRate: number
): { status: 'optimal' | 'warning' | 'critical'; text: string } {
  const diff = actualDaily - targetDaily;
  const percentAchieved = targetDaily > 0 ? (actualDaily / targetDaily) * 100 : 0;

  if (percentAchieved >= 98 && efficiency >= 73 && defectRate <= 2.0) {
    return {
      status: 'optimal',
      text: `Performa optimal (${percentAchieved.toFixed(1)}%). Output harian ${diff >= 0 ? `+${diff}` : `${diff}`} pcs. Efisiensi ${efficiency.toFixed(1)}% & reject aman ${defectRate}%.`
    };
  } else if (percentAchieved < 85 || efficiency < 65 || defectRate > 2.8) {
    return {
      status: 'critical',
      text: `Kritis: Capaian harian ${percentAchieved.toFixed(1)}% (Defisit ${diff} pcs). Efisiensi rendah ${efficiency.toFixed(1)}% / Defect ${defectRate}%. Perlu audit bottleneck & re-balancing operator.`
    };
  } else {
    return {
      status: 'warning',
      text: `Perlu perhatian: Capaian harian ${percentAchieved.toFixed(1)}% (Defisit ${diff} pcs). Periksa supply potongan & sinkronisasi stasiun kerja.`
    };
  }
}
