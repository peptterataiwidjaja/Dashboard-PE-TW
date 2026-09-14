import { RepairDefectRecord, FishboneAnalysis, DefectBreakdown } from '../types';

export const REPAIR_DEFECT_STORAGE_KEY = 'tw_repair_defect_records_v1';

export function generateAutomaticFishbone(
  lineName: string,
  style: string,
  repairPercent: number,
  defects: DefectBreakdown
): FishboneAnalysis {
  const effect = `Tingkat Repair / Defect ${repairPercent.toFixed(1)}% pada ${lineName} (${style})`;

  // Temukan jenis defect tertinggi
  const defectEntries = Object.entries(defects) as [keyof DefectBreakdown, number][];
  defectEntries.sort((a, b) => b[1] - a[1]);
  const highestDefect = defectEntries[0] || ['brokenStitch', 0];

  let primaryRootCause = '';
  let correctiveAction = '';
  let preventiveAction = '';

  const manCauses: string[] = [];
  const machineCauses: string[] = [];
  const materialCauses: string[] = [];
  const methodCauses: string[] = [];
  const measurementCauses: string[] = [];
  const milieuCauses: string[] = [];

  if (highestDefect[0] === 'puckering') {
    primaryRootCause = 'Tegangan benang (thread tension) jarum & looper terlalu kencang untuk karakteristik kain tipis/stretch.';
    correctiveAction = 'Setel ulang tension disc mesin jahit lockstitch dan gunakan jarum nomor lebih kecil (No. 9-11).';
    preventiveAction = 'Buatkan standar tension check sheet per style dan kalibrasi pengatur langkah kain (feed dog differential).';
    
    manCauses.push('Operator menarik kain terlalu kencang saat mendorong ke needle plate');
    manCauses.push('Kurang sosialisasi handling bahan berkerut halus');
    machineCauses.push('Tegangan benang atas & sekoci tidak sinkron');
    machineCauses.push('Tekanan presser foot terlalu berat');
    materialCauses.push('Karakteristik kain licin dengan elastisitas arah pakan tinggi');
    materialCauses.push('Penyusutan benang jahit berbeda dengan kain setelah steam');
    methodCauses.push('Kecepatan jahit RPM tidak konstan di tikungan sambungan');
    methodCauses.push('Urutan penjahitan panel tidak menggunakan guide folder');
    measurementCauses.push('Pemeriksaan kerut di end-line belum menggunakan lampu meja miring');
    measurementCauses.push('Toleransi visual kerutan belum disepakati QC dan PE');
    milieuCauses.push('Suhu ruang pressing terlalu lembap menyebabkan kain mengembang');
    milieuCauses.push('Pencahayaan stasiun assembly kurang terang');
  } else if (highestDefect[0] === 'brokenStitch') {
    primaryRootCause = 'Jarum aus/tumpul dan clearance antara jarum dengan rotating hook terlalu renggang (>0.1mm).';
    correctiveAction = 'Ganti jarum baru Organ Needle DBx1 dan re-setting timing looper/hook clearance ke 0.05mm.';
    preventiveAction = 'Terapkan program TPM jarum ganti berkala per 8 jam kerja dan pelumasan otomatis hook.';

    manCauses.push('Operator terlambat menyadari benang loncat sebelum bundle selesai');
    manCauses.push('Pemasangan jarum miring/tidak sampai mentok di needle bar');
    machineCauses.push('Needle plate berlubang tergores tusukan jarum');
    machineCauses.push('Tension spring penegang benang kendor');
    materialCauses.push('Kualitas benang jahit berbulu dan mudah putus');
    materialCauses.push('Ketebalan kain sambungan bertumpuk 4 lapis');
    methodCauses.push('Handling bundle terlalu kasar sehingga benang tersangkut spool stand');
    methodCauses.push('Tidak dilakukan uji jahit potongan perca di awal shift');
    measurementCauses.push('QC in-line hanya memeriksa 5 pcs per bundle 20 pcs');
    measurementCauses.push('Uji tarik sambungan seam strength belum teratur');
    milieuCauses.push('Debu serabut kain menumpuk di area rotary hook');
    milieuCauses.push('Getaran meja mesin jahit berlebih');
  } else if (highestDefect[0] === 'measurementMismatch') {
    primaryRootCause = 'Variasi tarikan operator saat hemming dan kelonggaran pola potongan dari meja cutting.';
    correctiveAction = 'Pasang pembatas magnetik (magnetic edge guide) dan lakukan audit pengukuran 100% pada lot ini.';
    preventiveAction = 'Sinkronisasi toleransi pola pola master CAD dengan divisi marker & cutting inspection.';

    manCauses.push('Operator memotong kelebihan kain tanpa acuan garis kapur');
    manCauses.push('Perbedaan gaya tarikan antar shift operator');
    machineCauses.push('Meja mesin miring menyebabkan bahan tertarik ke bawah');
    machineCauses.push('Kaki penekan (presser foot) aus sebelah');
    materialCauses.push('Penyusutan kain (shrinkage) tidak seragam antar rol');
    materialCauses.push('Relaksasi kain setelah cutting kurang dari 24 jam');
    methodCauses.push('Pola jahit tidak menggunakan pin penahan di titik temu');
    methodCauses.push('SOP pengukuran garment tidak dibentangkan rata di meja ukur');
    measurementCauses.push('Pita meteran kain melar / belum terkalibrasi');
    measurementCauses.push('Cara ukur titik acuan kerung leher berbeda antar pemeriksa');
    milieuCauses.push('Meja ukur QC bergelombang dan sempit');
    milieuCauses.push('Suhu ruangan cutting fluktuatif');
  } else if (highestDefect[0] === 'oilStains') {
    primaryRootCause = 'Kelebihan oli pelumas pada needle bar bushing dan kebocoran seal wadah oli mesin obras.';
    correctiveAction = 'Bersihkan oil sump mesin, lap needle bar, dan hilangkan noda menggunakan cairan spot remover spray.';
    preventiveAction = 'Ganti gasket seal oli yang retak dan batasi volume isi oli di bawah level MAX.';

    manCauses.push('Operator meletakkan garment jadi di atas meja dekat bak oli');
    manCauses.push('Tangan operator terkena oli saat mengganti sekoci');
    machineCauses.push('Seal needle bar aus sehingga oli merembes menetes ke kain');
    machineCauses.push('Sistem hisap oli balik (suction pump) tersumbat serabut');
    materialCauses.push('Warna kain terang (putih/krem) sangat rentan noda');
    materialCauses.push('Bahan penolak oli belum diaplikasikan pada kain');
    methodCauses.push('Kain garment tidak dimasukkan ke dalam kantong pembungkus');
    methodCauses.push('Proses pembersihan mesin tidak terjadwal sebelum kerja');
    measurementCauses.push('Inspeksi noda minyak baru terdeteksi di bagian packing');
    measurementCauses.push('Belum ada lampu UV untuk deteksi noda oli transparan');
    milieuCauses.push('Lantai lorong produksi berdebu oli mesin');
    milieuCauses.push('Penempatan pelumas cadangan terbuka');
  } else {
    primaryRootCause = 'Kombinasi ketidaksesuaian setting mesin dengan variasi gramasi kain interlining.';
    correctiveAction = 'Lakukan re-balancing settingan mesin dan pendampingan teknis oleh tim PE & mekanik.';
    preventiveAction = 'Audit berkala parameter proses dan perketat inspeksi in-line QC setiap 2 jam.';

    manCauses.push('Operator butuh adaptasi teknik penjahitan model baru');
    manCauses.push('Fokus operator menurun pada jam lembur');
    machineCauses.push('Perlu penyetelan berkala jarum dan feed dog');
    machineCauses.push('Kecepatan motor servo belum dibatasi untuk proses kritis');
    materialCauses.push('Karakteristik serat kain mudah rontok');
    materialCauses.push('Lapisan interlining kaku');
    methodCauses.push('Visual instruction sheet belum terpampang di stasiun');
    methodCauses.push('Prosedur penanganan cacat (re-work) belum rapi');
    measurementCauses.push('Toleransi batas cacat minor vs mayor belum dipahami');
    measurementCauses.push('Pencatatan defect belum real-time');
    milieuCauses.push('Sirkulasi udara gerah di area tengah lini');
    milieuCauses.push('Pencahayaan spot kurang fokus');
  }

  return {
    effect,
    primaryRootCause,
    correctiveAction,
    preventiveAction,
    branches: [
      { category: 'man', categoryLabel: '1. Man (Manusia / Operator)', causes: manCauses },
      { category: 'machine', categoryLabel: '2. Machine (Mesin Jahit & Peralatan)', causes: machineCauses },
      { category: 'material', categoryLabel: '3. Material (Kain, Benang, Interlining)', causes: materialCauses },
      { category: 'method', categoryLabel: '4. Method (Metode Kerja & SOP)', causes: methodCauses },
      { category: 'measurement', categoryLabel: '5. Measurement (Pengukuran & QC)', causes: measurementCauses },
      { category: 'milieu', categoryLabel: '6. Milieu (Lingkungan & Ergonomi)', causes: milieuCauses }
    ]
  };
}

export const INITIAL_REPAIR_DEFECT_RECORDS: RepairDefectRecord[] = [];

export const INITIAL_REPAIR_DEFECT_DATA = INITIAL_REPAIR_DEFECT_RECORDS;

export function loadSavedRepairDefects(): RepairDefectRecord[] {
  try {
    const raw = localStorage.getItem(REPAIR_DEFECT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error loading repair defects:', err);
  }
  return INITIAL_REPAIR_DEFECT_RECORDS;
}

export function saveRepairDefects(records: RepairDefectRecord[]) {
  try {
    localStorage.setItem(REPAIR_DEFECT_STORAGE_KEY, JSON.stringify(records));
  } catch (err) {
    console.error('Error saving repair defects:', err);
  }
}
