export function formatRupiah(value: number): string {
  const isNegative = value < 0;
  const absVal = Math.abs(value);
  const formatted = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(absVal);

  return isNegative ? `-${formatted}` : formatted;
}

export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return '-';
  return `${value.toFixed(2).replace('.', ',')}%`;
}

export function formatNumber(value: number | null | undefined, decimals = 2): string {
  if (value === null || value === undefined || isNaN(value)) return '-';
  return value.toFixed(decimals).replace('.', ',');
}

export function getAchievementColor(percent: number | null | undefined): {
  bg: string;
  text: string;
  border: string;
  dot: string;
  label: string;
} {
  if (percent === null || percent === undefined) {
    return {
      bg: 'bg-slate-50',
      text: 'text-slate-500',
      border: 'border-slate-200',
      dot: 'bg-slate-400',
      label: 'N/A'
    };
  }
  if (percent >= 80) {
    return {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      dot: 'bg-emerald-500',
      label: 'Optimal (≥80%)'
    };
  }
  if (percent >= 70) {
    return {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
      dot: 'bg-blue-500',
      label: 'Standar (70-79%)'
    };
  }
  return {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
    label: 'Perlu Perhatian (<70%)'
  };
}

export const INDONESIAN_MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export function formatMonthYearIndonesian(yearMonth: string): string {
  if (!yearMonth || !yearMonth.includes('-')) return yearMonth;
  const [year, monthStr] = yearMonth.split('-');
  const monthIdx = parseInt(monthStr, 10) - 1;
  const monthName = INDONESIAN_MONTH_NAMES[monthIdx] || monthStr;
  return `${monthName} ${year}`;
}

export function formatIndonesianFullDate(dateStr: string): string {
  if (!dateStr || !dateStr.includes('-')) return dateStr;
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const y = parts[0];
    const mIdx = parseInt(parts[1], 10) - 1;
    const d = parts[2];
    const monthName = INDONESIAN_MONTH_NAMES[mIdx] || parts[1];
    return `${d} ${monthName} ${y}`;
  }
  return dateStr;
}

export function getCurrentYearMonth(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function getPreviousMonth(yearMonth: string): string {
  if (!yearMonth || !yearMonth.includes('-')) return yearMonth;
  const [yStr, mStr] = yearMonth.split('-');
  let y = parseInt(yStr, 10);
  let m = parseInt(mStr, 10) - 1;
  if (m < 1) {
    m = 12;
    y -= 1;
  }
  return `${y}-${String(m).padStart(2, '0')}`;
}

export function getNextMonth(yearMonth: string): string {
  if (!yearMonth || !yearMonth.includes('-')) return yearMonth;
  const [yStr, mStr] = yearMonth.split('-');
  let y = parseInt(yStr, 10);
  let m = parseInt(mStr, 10) + 1;
  if (m > 12) {
    m = 1;
    y += 1;
  }
  return `${y}-${String(m).padStart(2, '0')}`;
}

export function generateDateLabelsForMonth(yearMonth: string): string[] {
  if (!yearMonth || !yearMonth.includes('-')) return [];
  const [yStr, mStr] = yearMonth.split('-');
  const y = parseInt(yStr, 10);
  const m = parseInt(mStr, 10);
  const daysInMonth = new Date(y, m, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, i) => `Tgl ${i + 1}`);
}
