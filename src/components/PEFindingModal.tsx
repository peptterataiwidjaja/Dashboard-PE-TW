import React, { useState, useEffect } from 'react';
import { ProcessEngineeringFinding, PECategory } from '../types';
import { PE_CATEGORY_CONFIG } from '../data/peFindingsData';
import { X, CheckCircle, AlertTriangle, Wrench, Calculator } from 'lucide-react';

interface PEFindingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (finding: ProcessEngineeringFinding) => void;
  initialData: ProcessEngineeringFinding | null;
}

export const PEFindingModal: React.FC<PEFindingModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData
}) => {
  const [lineId, setLineId] = useState<number>(1);
  const [styleName, setStyleName] = useState('');
  const [operationName, setOperationName] = useState('');
  const [category, setCategory] = useState<PECategory>('motion_waste');
  const [smvStandard, setSmvStandard] = useState<number>(0.85);
  const [smvActual, setSmvActual] = useState<number>(1.25);
  const [findingDescription, setFindingDescription] = useState('');
  const [rootCause, setRootCause] = useState('');
  const [kaizenAction, setKaizenAction] = useState('');
  const [potentialSavingSeconds, setPotentialSavingSeconds] = useState<number>(20);
  const [potentialOutputGainPcs, setPotentialOutputGainPcs] = useState<number>(80);
  const [status, setStatus] = useState<'implemented' | 'trial' | 'evaluation'>('trial');
  const [peInspector, setPeInspector] = useState('Ir. Hendra Wijaya, S.T.');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (initialData) {
      setLineId(initialData.lineId);
      setStyleName(initialData.styleName);
      setOperationName(initialData.operationName);
      setCategory(initialData.category);
      setSmvStandard(initialData.smvStandard);
      setSmvActual(initialData.smvActual);
      setFindingDescription(initialData.findingDescription);
      setRootCause(initialData.rootCause);
      setKaizenAction(initialData.kaizenAction);
      setPotentialSavingSeconds(initialData.potentialSavingSeconds);
      setPotentialOutputGainPcs(initialData.potentialOutputGainPcs);
      setStatus(initialData.status);
      setPeInspector(initialData.peInspector);
      setDate(initialData.date);
      setNotes(initialData.notes || '');
    } else {
      setLineId(1);
      setStyleName('DELAMI H067');
      setOperationName('Pasang Kerah (Collar Attach)');
      setCategory('motion_waste');
      setSmvStandard(0.85);
      setSmvActual(1.25);
      setFindingDescription('');
      setRootCause('');
      setKaizenAction('');
      setPotentialSavingSeconds(20);
      setPotentialOutputGainPcs(80);
      setStatus('trial');
      setPeInspector('Ir. Hendra Wijaya, S.T.');
      setDate(new Date().toISOString().split('T')[0]);
      setNotes('');
    }
  }, [initialData, isOpen]);

  // Recalculate potential savings dynamically when SMVs change
  const varianceSec = Number(((smvActual - smvStandard) * 60).toFixed(1));
  const variancePct = smvStandard > 0 ? Number((((smvActual - smvStandard) / smvStandard) * 100).toFixed(1)) : 0;

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!styleName.trim() || !operationName.trim() || !findingDescription.trim()) {
      alert('Mohon lengkapi Nama Style, Operasi, dan Deskripsi Temuan.');
      return;
    }

    const severity = variancePct >= 40 ? 'critical' : variancePct >= 20 ? 'warning' : 'normal';

    const finding: ProcessEngineeringFinding = {
      id: initialData ? initialData.id : `pe-find-${Date.now()}`,
      date,
      lineId,
      lineName: `Line ${lineId}`,
      styleName: styleName.trim(),
      operationName: operationName.trim(),
      category,
      smvStandard: Number(smvStandard),
      smvActual: Number(smvActual),
      varianceSeconds: varianceSec,
      variancePercent: variancePct,
      severity,
      findingDescription: findingDescription.trim(),
      rootCause: rootCause.trim() || 'Dalam proses investigasi motion time study.',
      kaizenAction: kaizenAction.trim() || 'Perbaikan metode kerja standar dan verifikasi jig/folder.',
      potentialSavingSeconds: Number(potentialSavingSeconds),
      potentialOutputGainPcs: Number(potentialOutputGainPcs),
      status,
      peInspector: peInspector.trim(),
      verifiedDate: date,
      notes: notes.trim()
    };

    onSave(finding);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Wrench className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold">
                {initialData ? 'Edit Temuan Rekayasa Proses' : 'Catat Temuan Rekayasa Proses Baru (PE)'}
              </h3>
              <p className="text-xs text-slate-300">
                Dokumentasi Time Study, Diagnostik SMV, & Rencana Kaizen PT Teratai Widjaja
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          
          {/* Row 1: Line, Tanggal, Style */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Line Produksi <span className="text-red-500">*</span>
              </label>
              <select
                id="input-pe-line"
                value={lineId}
                onChange={(e) => setLineId(Number(e.target.value))}
                className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(id => (
                  <option key={id} value={id}>Line {id}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tanggal Observasi <span className="text-red-500">*</span>
              </label>
              <input
                id="input-pe-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Style Garment <span className="text-red-500">*</span>
              </label>
              <input
                id="input-pe-style"
                type="text"
                placeholder="Contoh: DELAMI H067"
                value={styleName}
                onChange={(e) => setStyleName(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Row 2: Operasi & Kategori Temuan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Stasiun / Operasi Sewing Kritis <span className="text-red-500">*</span>
              </label>
              <input
                id="input-pe-operation"
                type="text"
                placeholder="Contoh: Pasang Kerah (Collar Band Attach)"
                value={operationName}
                onChange={(e) => setOperationName(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kategori Temuan Rekayasa Proses <span className="text-red-500">*</span>
              </label>
              <select
                id="input-pe-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as PECategory)}
                className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white"
              >
                {Object.entries(PE_CATEGORY_CONFIG).map(([catKey, catVal]) => (
                  <option key={catKey} value={catKey}>{catVal.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 3: SMV Standar vs Aktual + Live Diagnostic Box */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
              <Calculator className="w-3.5 h-3.5 text-blue-600" />
              <span>Komparasi SMV & Deviasi Waktu Siklus (Time Study)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-center">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  SMV Standar Target (Menit)
                </label>
                <input
                  id="input-pe-smv-std"
                  type="number"
                  step="0.01"
                  min="0.05"
                  value={smvStandard}
                  onChange={(e) => setSmvStandard(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs font-bold px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-blue-700"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  ={(smvStandard * 60).toFixed(0)} detik
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  SMV Aktual Teramati (Menit)
                </label>
                <input
                  id="input-pe-smv-act"
                  type="number"
                  step="0.01"
                  min="0.05"
                  value={smvActual}
                  onChange={(e) => setSmvActual(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs font-bold px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-red-600"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  ={(smvActual * 60).toFixed(0)} detik
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Selisih Deviasi (Detik)
                </label>
                <div className={`text-xs font-black px-3 py-2 rounded-lg border flex items-center justify-between ${
                  varianceSec > 0 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}>
                  <span>{varianceSec > 0 ? `+${varianceSec} dtk` : `${varianceSec} dtk`}</span>
                  <span className="text-[10px] font-semibold">({variancePct > 0 ? `+${variancePct}%` : `${variancePct}%`})</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  {variancePct >= 40 ? '🔴 Kritis (>40%)' : variancePct >= 20 ? '🟡 Peringatan (>20%)' : '🟢 Normal'}
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Potensi Saving / Garment
                </label>
                <div className="flex items-center space-x-1">
                  <input
                    id="input-pe-saving"
                    type="number"
                    min="0"
                    value={potentialSavingSeconds}
                    onChange={(e) => setPotentialSavingSeconds(parseInt(e.target.value) || 0)}
                    className="w-full text-xs font-bold px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-emerald-700"
                  />
                  <span className="text-xs text-slate-500 font-bold">dtk</span>
                </div>
              </div>
            </div>
          </div>

          {/* Row 4: Deskripsi Temuan Lapangan & Akar Masalah */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Deskripsi Temuan Observasi Lapangan <span className="text-red-500">*</span>
              </label>
              <textarea
                id="input-pe-description"
                rows={3}
                placeholder="Jelaskan apa yang diobservasi (misal operator memotong benang manual, memutar badan, atau posisi bundle jauh)..."
                value={findingDescription}
                onChange={(e) => setFindingDescription(e.target.value)}
                className="w-full text-xs font-medium px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Analisis Akar Masalah (Root Cause) <span className="text-red-500">*</span>
              </label>
              <textarea
                id="input-pe-rootcause"
                rows={3}
                placeholder="Jelaskan penyebab utama teknis (misal guider hilang, pisau trimmer tumpul, interlining mengkerut, dll)..."
                value={rootCause}
                onChange={(e) => setRootCause(e.target.value)}
                className="w-full text-xs font-medium px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white leading-relaxed"
              />
            </div>
          </div>

          {/* Row 5: Rekomendasi Kaizen & Potensi Output */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Rekomendasi Kaizen / Rekayasa Proses <span className="text-red-500">*</span>
              </label>
              <textarea
                id="input-pe-kaizen"
                rows={3}
                placeholder="Rencana perbaikan: modifikasi attachment, rotasi operator, kalibrasi suhu fusing, extension tray..."
                value={kaizenAction}
                onChange={(e) => setKaizenAction(e.target.value)}
                className="w-full text-xs font-medium px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white leading-relaxed"
              />
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Potensi Kenaikan Output Harian (Pcs/Hari)
                </label>
                <input
                  id="input-pe-gain"
                  type="number"
                  min="0"
                  value={potentialOutputGainPcs}
                  onChange={(e) => setPotentialOutputGainPcs(parseInt(e.target.value) || 0)}
                  className="w-full text-xs font-bold px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white text-blue-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Status Implementasi & PIC PE
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    id="input-pe-status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full text-xs font-bold px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  >
                    <option value="implemented">✅ Diterapkan (Closed)</option>
                    <option value="trial">🧪 Uji Coba (Trial)</option>
                    <option value="evaluation">📋 Evaluasi (Open)</option>
                  </select>
                  <input
                    id="input-pe-inspector"
                    type="text"
                    placeholder="Nama Inspektur PE"
                    value={peInspector}
                    onChange={(e) => setPeInspector(e.target.value)}
                    className="w-full text-xs font-medium px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg text-xs font-bold bg-blue-700 hover:bg-blue-800 text-white shadow-sm transition-colors flex items-center space-x-1.5"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Simpan Temuan Rekayasa Proses</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
