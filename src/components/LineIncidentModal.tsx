import React, { useState } from 'react';
import { 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  Printer, 
  Download, 
  FileText, 
  UserCheck, 
  Clock, 
  Layers, 
  ArrowRight,
  Info,
  Edit3
} from 'lucide-react';
import { LineIncident } from '../types';
import { formatPercent } from '../utils/formatters';

interface LineIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  incidents: LineIncident[];
  onUpdateIncident: (incident: LineIncident) => void;
  onPrintReport: () => void;
}

export const LineIncidentModal: React.FC<LineIncidentModalProps> = ({
  isOpen,
  onClose,
  incidents,
  onUpdateIncident,
  onPrintReport
}) => {
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>(
    incidents[0]?.id || ''
  );

  const activeIncident = incidents.find(i => i.id === selectedIncidentId) || incidents[0];

  // Local state for editing active incident
  const [formData, setFormData] = useState<LineIncident | null>(activeIncident || null);

  React.useEffect(() => {
    if (activeIncident) {
      setFormData(activeIncident);
    }
  }, [activeIncident?.id]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (formData) {
      onUpdateIncident(formData);
    }
  };

  const togglePeVerification = () => {
    if (!formData) return;
    const isNowVerified = !formData.peVerified;
    const updated: LineIncident = {
      ...formData,
      peVerified: isNowVerified,
      peSignatureDate: isNowVerified ? new Date().toISOString().split('T')[0] : undefined
    };
    setFormData(updated);
    onUpdateIncident(updated);
  };

  const toggleFmApproval = () => {
    if (!formData) return;
    const isNowApproved = !formData.fmApproved;
    const updated: LineIncident = {
      ...formData,
      fmApproved: isNowApproved,
      fmSignatureDate: isNowApproved ? new Date().toISOString().split('T')[0] : undefined
    };
    setFormData(updated);
    onUpdateIncident(updated);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-linear-to-r from-red-600 via-red-700 to-[#1a3478] text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/10 rounded-lg backdrop-blur-xs">
              <ShieldAlert className="w-6 h-6 text-yellow-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight uppercase">
                  Lembar Disposisi & Persetujuan Hambatan Line (CAPA)
                </h3>
                <span className="text-[10px] px-2 py-0.5 bg-yellow-400 text-slate-900 font-extrabold rounded-full">
                  Dokumen No. TW/PRD-PE/FRM-08
                </span>
              </div>
              <p className="text-xs text-red-100 mt-0.5">
                Verifikasi Tindakan Penanganan Bottleneck oleh Production Engineer & Persetujuan Factory Manager
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Sidebar List & Detail Editor */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          
          {/* Left Column: Incidents List */}
          <div className="w-full md:w-72 bg-slate-50 border-r border-slate-200 p-3 overflow-y-auto space-y-2 shrink-0">
            <div className="px-2 py-1 flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
              <span>Lini Bermasalah ({incidents.length})</span>
            </div>

            {incidents.map(inc => {
              const isSelected = inc.id === selectedIncidentId;
              const isApproved = inc.peVerified && inc.fmApproved;

              return (
                <button
                  key={inc.id}
                  onClick={() => {
                    setSelectedIncidentId(inc.id);
                  }}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-white border-blue-600 shadow-sm ring-1 ring-blue-600'
                      : 'bg-white/70 border-slate-200 hover:bg-white text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-extrabold text-xs text-slate-900">{inc.lineName}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      inc.severity === 'critical'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {inc.severity === 'critical' ? 'Kritis' : 'Warning'}
                    </span>
                  </div>
                  <p className="text-[11px] font-medium text-slate-600 truncate">{inc.style}</p>
                  <div className="mt-2 flex items-center justify-between text-[10px]">
                    <span className="text-slate-500">
                      Defisit: <b className="text-red-600 font-mono">-{inc.deficitPcs} pcs</b>
                    </span>
                    <span className={`font-semibold flex items-center space-x-0.5 ${
                      isApproved ? 'text-emerald-600' : 'text-slate-400'
                    }`}>
                      {isApproved ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      <span>{isApproved ? 'Disetujui' : 'Menunggu'}</span>
                    </span>
                  </div>
                </button>
              );
            })}

            {incidents.length === 0 && (
              <div className="p-4 text-center text-xs text-slate-500">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="font-semibold text-slate-700">Semua Lini Optimal</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Tidak terdeteksi bottleneck maupun defect kritis saat ini.</p>
              </div>
            )}
          </div>

          {/* Right Column: Active Incident Details & Approval Sign-offs */}
          {formData ? (
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-5">
              
              {/* Top Banner of Selected Issue */}
              <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                formData.severity === 'critical' 
                  ? 'bg-red-50/60 border-red-200 text-red-950' 
                  : 'bg-amber-50/60 border-amber-200 text-amber-950'
              }`}>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 text-xs font-black rounded uppercase ${
                      formData.severity === 'critical' ? 'bg-red-600 text-white' : 'bg-amber-500 text-white'
                    }`}>
                      {formData.severity === 'critical' ? 'Bottleneck Kritis' : 'Peringatan Operasional'}
                    </span>
                    <h4 className="font-black text-sm text-slate-900">{formData.lineName} • {formData.style}</h4>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {formData.description}
                  </p>
                </div>

                <div className="flex items-center space-x-4 bg-white px-3 py-2 rounded-lg border border-slate-200 text-center shrink-0">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Defisit Output</span>
                    <span className="text-xs font-black text-red-600 font-mono">-{formData.deficitPcs} pcs/hari</span>
                  </div>
                  <div className="w-px h-6 bg-slate-200"></div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Efisiensi</span>
                    <span className="text-xs font-black text-blue-700 font-mono">{formatPercent(formData.efficiencyPercent)}</span>
                  </div>
                  <div className="w-px h-6 bg-slate-200"></div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Defect</span>
                    <span className="text-xs font-black text-red-600 font-mono">{formatPercent(formData.defectPercent)}</span>
                  </div>
                </div>
              </div>

              {/* Form Input: Akar Masalah (Root Cause) & Tindakan Korektif (CAPA) */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-700 uppercase">
                  <Edit3 className="w-4 h-4 text-blue-600" />
                  <span>Analisis & Rencana Tindakan Perbaikan (CAPA)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Akar Masalah (Root Cause)
                    </label>
                    <textarea
                      rows={2}
                      value={formData.rootCause}
                      onChange={(e) => setFormData(prev => prev ? ({ ...prev, rootCause: e.target.value }) : null)}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                      placeholder="Analisis penyebab bottleneck (Man, Machine, Material, Method)..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tindakan Penanganan Cepat (Immediate Action)
                    </label>
                    <textarea
                      rows={2}
                      value={formData.correctiveAction}
                      onChange={(e) => setFormData(prev => prev ? ({ ...prev, correctiveAction: e.target.value }) : null)}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                      placeholder="Tindakan segera untuk mengatasi macetnya output..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tindakan Pencegahan Jangka Panjang
                    </label>
                    <input
                      type="text"
                      value={formData.preventiveAction}
                      onChange={(e) => setFormData(prev => prev ? ({ ...prev, preventiveAction: e.target.value }) : null)}
                      className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500"
                      placeholder="Pencegahan agar tidak terulang..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      PIC / Penanggung Jawab Lapangan
                    </label>
                    <input
                      type="text"
                      value={formData.pic}
                      onChange={(e) => setFormData(prev => prev ? ({ ...prev, pic: e.target.value }) : null)}
                      className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* DUAL APPROVAL SECTION: PRODUCTION ENGINEER (PE) & FACTORY MANAGER (FM) */}
              <div className="pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <UserCheck className="w-4 h-4 text-[#1a3478]" />
                    <h5 className="text-xs font-black uppercase text-slate-900 tracking-wide">
                      Otorisasi & Lembar Persetujuan Manajemen
                    </h5>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Kedua pihak wajib memvalidasi sebelum PDF dicetak resmi
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* BOX 1: VERIFIKASI PRODUCTION ENGINEER (PE) */}
                  <div className={`p-4 rounded-xl border transition-all ${
                    formData.peVerified 
                      ? 'bg-blue-50/80 border-blue-300 ring-1 ring-blue-300' 
                      : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                        <span className="text-xs font-extrabold text-[#1a3478] uppercase">
                          1. Production Engineer (PE)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={togglePeVerification}
                        className={`text-xs px-2.5 py-1 rounded-md font-bold transition-all flex items-center space-x-1 ${
                          formData.peVerified
                            ? 'bg-blue-600 text-white shadow-2xs'
                            : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{formData.peVerified ? 'Terverifikasi' : 'Klik Verifikasi PE'}</span>
                      </button>
                    </div>

                    <div className="space-y-2 mt-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Nama PE</label>
                        <input
                          type="text"
                          value={formData.peName}
                          onChange={(e) => setFormData(prev => prev ? ({ ...prev, peName: e.target.value }) : null)}
                          className="w-full text-xs p-1.5 bg-white rounded border border-slate-300 font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">
                          Catatan Rekomendasi Teknis / Balancing PE
                        </label>
                        <textarea
                          rows={2}
                          value={formData.peNotes}
                          onChange={(e) => setFormData(prev => prev ? ({ ...prev, peNotes: e.target.value }) : null)}
                          className="w-full text-xs p-2 bg-white rounded border border-slate-300"
                          placeholder="Catatan teknis SMV, waktu siklus & re-balancing..."
                        />
                      </div>
                      {formData.peVerified && (
                        <p className="text-[10px] text-blue-700 font-medium flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Diverifikasi pada: {formData.peSignatureDate || new Date().toISOString().split('T')[0]}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* BOX 2: PERSETUJUAN FACTORY MANAGER (FM) */}
                  <div className={`p-4 rounded-xl border transition-all ${
                    formData.fmApproved 
                      ? 'bg-emerald-50/80 border-emerald-300 ring-1 ring-emerald-300' 
                      : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                        <span className="text-xs font-extrabold text-emerald-900 uppercase">
                          2. Factory Manager (FM)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={toggleFmApproval}
                        className={`text-xs px-2.5 py-1 rounded-md font-bold transition-all flex items-center space-x-1 ${
                          formData.fmApproved
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{formData.fmApproved ? 'Disetujui' : 'Klik Setujui FM'}</span>
                      </button>
                    </div>

                    <div className="space-y-2 mt-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Nama Factory Manager</label>
                        <input
                          type="text"
                          value={formData.fmName}
                          onChange={(e) => setFormData(prev => prev ? ({ ...prev, fmName: e.target.value }) : null)}
                          className="w-full text-xs p-1.5 bg-white rounded border border-slate-300 font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">
                          Catatan Keputusan & Otorisasi Disposisi FM
                        </label>
                        <textarea
                          rows={2}
                          value={formData.fmNotes}
                          onChange={(e) => setFormData(prev => prev ? ({ ...prev, fmNotes: e.target.value }) : null)}
                          className="w-full text-xs p-2 bg-white rounded border border-slate-300"
                          placeholder="Disposisi lembur, persetujuan alokasi operator / penggantian kain..."
                        />
                      </div>
                      {formData.fmApproved && (
                        <p className="text-[10px] text-emerald-700 font-medium flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Disetujui pada: {formData.fmSignatureDate || new Date().toISOString().split('T')[0]}</span>
                        </p>
                      )}
                    </div>
                  </div>

                </div>
              </div>

            </div>
          ) : (
            <div className="flex-1 p-8 text-center text-slate-400 flex items-center justify-center">
              Pilih lini dari daftar di sebelah kiri.
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2 text-xs text-slate-600">
            <span className="w-2 h-2 rounded-full bg-red-600"></span>
            <span>
              Status Dokumen: {formData?.peVerified && formData?.fmApproved 
                ? <strong className="text-emerald-700 font-bold">Lengkap Disetujui PE & FM</strong>
                : <strong className="text-amber-700 font-bold">Menunggu Persetujuan Lengkap</strong>}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleSave}
              className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-bold transition-colors"
            >
              Simpan Perubahan
            </button>
            <button
              onClick={() => {
                handleSave();
                onPrintReport();
              }}
              className="px-4 py-2 bg-[#1a3478] hover:bg-blue-900 text-white rounded-lg text-xs font-extrabold flex items-center space-x-1.5 shadow-md shadow-blue-900/20 active:scale-95 transition-all"
            >
              <Printer className="w-4 h-4 text-white" />
              <span>Cetak / Ekspor PDF Disetujui (PE & FM)</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
