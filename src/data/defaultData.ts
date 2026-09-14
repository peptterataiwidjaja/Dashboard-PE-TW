import { LineData, DashboardSummary } from '../types';

export const DATE_LABELS: string[] = [
  'Tgl 1', 'Tgl 2', 'Tgl 3', 'Tgl 4', 'Tgl 5', 'Tgl 6', 'Tgl 7',
  'Tgl 9', 'Tgl 10', 'Tgl 11', 'Tgl 13', 'Tgl 14', 'Tgl 15 (A)',
  'Tgl 15 (B)', 'Tgl 15 (C)', 'Tgl 15 (D)', 'Tgl 15 (E)', 'Tgl 16',
  'Tgl 17', 'Tgl 18', 'Tgl 20'
];

export const INITIAL_LINES_DATA: LineData[] = [];

export function computeSummary(lines: LineData[]): DashboardSummary {
  const totalActual = lines.reduce((acc, curr) => acc + (curr.actualRevenue || 0), 0);
  const totalTarget = lines.reduce((acc, curr) => acc + (curr.targetRevenue || 0), 0);
  const netVariance = totalActual - totalTarget;
  const overallVariancePercent = totalTarget > 0 ? (netVariance / totalTarget) * 100 : 0;
  const avgLineAchievement = lines.length > 0 
    ? lines.reduce((acc, curr) => acc + (curr.overallAchievement || 0), 0) / lines.length
    : 0;

  let sortedByAch = [...lines].filter(l => l.overallAchievement > 0).sort((a, b) => b.overallAchievement - a.overallAchievement);
  const bestLine = sortedByAch.length > 0 
    ? { lineId: sortedByAch[0].lineId, achievement: sortedByAch[0].overallAchievement }
    : { lineId: 0, achievement: 0 };
  const lowestLine = sortedByAch.length > 0 
    ? { lineId: sortedByAch[sortedByAch.length - 1].lineId, achievement: sortedByAch[sortedByAch.length - 1].overallAchievement }
    : { lineId: 0, achievement: 0 };

  let avgSmv = 0;
  if (lines.length > 0) {
    const allSmvs: number[] = [];
    lines.forEach(l => {
      l.daily?.forEach(d => {
        if (d.smvActual && d.smvActual > 0) allSmvs.push(d.smvActual);
      });
    });
    if (allSmvs.length > 0) {
      avgSmv = Number((allSmvs.reduce((a, b) => a + b, 0) / allSmvs.length).toFixed(2));
    }
  }

  return {
    totalActualRevenue: totalActual,
    totalTargetRevenue: totalTarget,
    netRevenueVariance: netVariance,
    overallVariancePercent,
    avgLineAchievement: Number(avgLineAchievement.toFixed(2)),
    avgSmv,
    activeLinesCount: lines.length,
    bestLine,
    lowestLine,
  };
}

export const APPS_SCRIPT_TEMPLATE = `/**
 * Google Apps Script untuk menghubungkan Google Sheet ke Dashboard SMV & Revenue
 * 
 * CARA PAKAI:
 * 1. Di Google Sheets Anda, buka menu "Extensions" > "Apps Script".
 * 2. Hapus isi default di editor, lalu paste kode di bawah ini.
 * 3. Klik "Deploy" (Terapkan) > "New deployment" (Penerapan Baru).
 * 4. Pilih type "Web app" (Aplikasi Web).
 * 5. Set "Execute as" = "Me", dan "Who has access" = "Anyone" (Siapa saja).
 * 6. Klik "Deploy" dan salin URL Web App (berakhiran /exec).
 * 7. Masukkan URL tersebut di menu "Sumber Google Sheet" di Dashboard.
 */

function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    // Mendukung pembacaan sheet khusus jika diberikan parameter ?sheet=REKAP BULANAN
    const sheetName = (e && e.parameter && e.parameter.sheet) ? e.parameter.sheet : null;
    const targetSheet = sheetName ? ss.getSheetByName(sheetName) : (ss.getSheetByName("REKAP BULANAN") || ss.getActiveSheet());
    const sheet = targetSheet || ss.getActiveSheet();
    const data = sheet.getDataRange().getValues();
    
    // Kembalikan data dalam format JSON
    const response = {
      status: "success",
      sheetName: sheet.getName(),
      timestamp: new Date().toISOString(),
      rowCount: data.length,
      rawData: data
    };
    
    return ContentService
      .createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    const errorResponse = {
      status: "error",
      message: err.toString()
    };
    return ContentService
      .createTextOutput(JSON.stringify(errorResponse))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
`;
