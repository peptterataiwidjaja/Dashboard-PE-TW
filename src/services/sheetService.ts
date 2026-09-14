import { LineData, DailyRecord } from '../types';
import { INITIAL_LINES_DATA, DATE_LABELS } from '../data/defaultData';

export interface ParseResult {
  lines: LineData[];
  error?: string;
  source: 'google-sheets' | 'embedded-default';
}

function parseIndonesianNumber(val: any): number | null {
  if (val === null || val === undefined || val === '' || val === '#REF!') return null;
  if (typeof val === 'number') return isNaN(val) ? null : val;
  const str = String(val).trim()
    .replace(/^Rp\s?/, '')
    .replace(/\./g, '') // remove thousands dot
    .replace(/,/g, '.') // replace decimal comma
    .replace(/%/, '');
  const num = parseFloat(str);
  return isNaN(num) ? null : num;
}

export function parseSheetData(raw: any): LineData[] {
  // If raw is already structured LineData array
  if (Array.isArray(raw) && raw.length > 0 && raw[0].lineId && raw[0].daily) {
    return raw as LineData[];
  }

  // If raw is wrapped in { rawData: [...] } or is a 2D array:
  const rows: any[][] = Array.isArray(raw) 
    ? raw 
    : (raw && Array.isArray(raw.rawData) ? raw.rawData : []);

  if (!rows || rows.length < 5) {
    // Return default if cannot parse 2D array
    return INITIAL_LINES_DATA;
  }

  try {
    // Find header date row (contains 1, 2, 3...)
    let dateRowIdx = -1;
    for (let i = 0; i < Math.min(10, rows.length); i++) {
      const rowStr = rows[i].map(c => String(c).trim()).join(' ');
      if (rowStr.includes('TANGGAL') || (rows[i].includes(1) && rows[i].includes(2))) {
        dateRowIdx = i;
        break;
      }
    }

    if (dateRowIdx === -1) {
      return INITIAL_LINES_DATA;
    }

    const dateRow = rows[dateRowIdx];
    // Identify date column indices
    const dateColIndices: { colIdx: number; label: string }[] = [];
    for (let c = 0; c < dateRow.length; c++) {
      const cell = String(dateRow[c]).trim();
      if (cell && !isNaN(Number(cell))) {
        dateColIndices.push({ colIdx: c, label: `Tgl ${cell}` });
      }
    }

    // Now look for Lines: rows starting with Line 1, 3, 4, 5, 6, 7
    const parsedLines: LineData[] = [];
    let r = dateRowIdx + 1;

    while (r < rows.length) {
      const row = rows[r];
      // Check if this row is a Line start
      const lineCell = String(row[1] || '').trim();
      const lineNum = parseInt(lineCell, 10);

      if (!isNaN(lineNum) && [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].includes(lineNum)) {
        const overallAch = parseIndonesianNumber(row[2]) ?? 70.0;
        
        // Rows:
        // r: SMV TGT
        // r+1: SMV ACT
        // r+2: PENCAPAIAN
        const tgtRow = rows[r] || [];
        const actRow = rows[r + 1] || [];
        const achRow = rows[r + 2] || [];

        const daily: DailyRecord[] = DATE_LABELS.map((dLabel, idx) => {
          const colMapping = dateColIndices[idx];
          const col = colMapping ? colMapping.colIdx : (4 + idx);
          const tgt = parseIndonesianNumber(tgtRow[col]);
          const act = parseIndonesianNumber(actRow[col]);
          const ach = parseIndonesianNumber(achRow[col]);

          return {
            dateIndex: idx,
            dateLabel: dLabel,
            smvTarget: tgt,
            smvActual: act,
            pencapaian: ach
          };
        });

        // Find existing style/revenue from default as baseline
        const existingLine = INITIAL_LINES_DATA.find(l => l.lineId === lineNum);

        parsedLines.push({
          lineId: lineNum,
          lineName: `Line ${lineNum}`,
          overallAchievement: overallAch,
          style: existingLine?.style || `Style L${lineNum}`,
          cmRate: existingLine?.cmRate || 37000,
          actualRevenue: existingLine?.actualRevenue || 180000000,
          targetRevenue: existingLine?.targetRevenue || 190000000,
          varianceRevenue: existingLine?.varianceRevenue || -10000000,
          variancePercent: existingLine?.variancePercent || -5.2,
          daily
        });

        r += 3;
      } else {
        r++;
      }
    }

    if (parsedLines.length > 0) {
      return parsedLines;
    }
  } catch (e) {
    console.error('Error parsing sheet data:', e);
  }

  return INITIAL_LINES_DATA;
}

export async function fetchGoogleSheetData(appsScriptUrl: string): Promise<ParseResult> {
  if (!appsScriptUrl || !appsScriptUrl.startsWith('http')) {
    throw new Error('URL Google Apps Script tidak valid. Pastikan berawalan https://');
  }

  const response = await fetch(appsScriptUrl, {
    method: 'GET',
    headers: {
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Gagal mengambil data dari Google Apps Script (HTTP ${response.status})`);
  }

  const json = await response.json();
  const parsed = parseSheetData(json);
  return {
    lines: parsed,
    source: 'google-sheets'
  };
}
