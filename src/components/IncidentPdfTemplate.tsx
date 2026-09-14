import React from 'react';
import { LineIncident } from '../types';
import { formatPercent } from '../utils/formatters';
import { CompanyLogo } from './CompanyLogo';

interface IncidentPdfTemplateProps {
  incidents: LineIncident[];
  supervisorName?: string;
  peName?: string;
  fmName?: string;
}

export const IncidentPdfTemplate: React.FC<IncidentPdfTemplateProps> = ({ 
  incidents,
  supervisorName = '',
  peName = '',
  fmName = ''
}) => {
  const printDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div 
      id="printable-incident-report" 
      className="p-8 bg-white text-slate-900 border border-slate-300 rounded-xl w-full max-w-[1020px] mx-auto space-y-6 font-sans overflow-hidden"
    >
      {/* Official Factory Header */}
      <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
        <div className="flex items-center space-x-4">
          <CompanyLogo size="lg" showSubtitle={true} />
        </div>
        <div className="text-right text-xs text-slate-600">
          <div className="inline-block bg-red-100 border border-red-300 rounded px-2.5 py-0.5 text-[10px] font-mono font-black text-red-900 mb-1">
            FORM KHUSUS DISPOSISI • NO: TW/PRD-PE/FRM-08
          </div>
          <p className="font-extrabold text-[#1a3478] text-base tracking-wide uppercase">
            LEMBAR DISPOSISI HAMBATAN LINE & BOTTLENECK PRODUKSI
          </p>
          <p className="font-semibold text-slate-700 mt-0.5">Tanggal Penerbitan: {printDate}</p>
          <p className="text-[11px] text-red-700 font-bold">Wajib Ditandatangani Production Engineer & Factory Manager</p>
        </div>
      </div>

      {/* Purpose Banner */}
      <div className="border-l-4 border-red-600 pl-3 py-2 bg-red-50/50 rounded-r-lg flex items-center justify-between">
        <div>
          <h2 className="text-xs font-black text-red-950 uppercase">
            Formulir Tindakan Korektif & Penanganan Bottleneck Alur Sewing (CAPA)
          </h2>
          <p className="text-[10px] text-slate-600 mt-0.5">
            Digunakan untuk eskalasi kendala operasional, re-balancing layout, penyesuaian waktu baku SMV, dan izin perbantuan kerja / lembur.
          </p>
        </div>
        <div className="text-right">
          <span className="px-2.5 py-1 bg-red-600 text-white font-extrabold text-xs rounded">
            {incidents.length} Lini Membutuhkan Disposisi
          </span>
        </div>
      </div>

      {/* Main Table: Details of All Incidents */}
      <div className="space-y-4">
        {incidents.map((inc, idx) => (
          <div key={inc.id} className="border-2 border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
            
            {/* Top Bar of Box */}
            <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-5 h-5 rounded-full bg-[#1a3478] text-white font-mono font-bold text-xs flex items-center justify-center">
                  {idx + 1}
                </span>
                <span className="font-extrabold text-sm text-slate-900">{inc.lineName}</span>
                <span className="text-xs text-slate-600 font-semibold">• Style: {inc.style}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                  inc.severity === 'critical' ? 'bg-red-600 text-white' : 'bg-amber-500 text-white'
                }`}>
                  {inc.severity === 'critical' ? 'STATUS KRITIS' : 'STATUS PERINGATAN'}
                </span>
                <span className="text-xs font-mono font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                  Defisit: -{inc.deficitPcs} pcs/hari
                </span>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-4 grid grid-cols-3 gap-4 text-xs">
              
              {/* Col 1: Indikator & Deskripsi */}
              <div className="space-y-2 border-r border-slate-200 pr-3">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Indikator Kinerja</span>
                  <div className="mt-1 space-y-1 font-mono text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Target Harian:</span>
                      <span className="font-bold text-slate-800">{inc.targetDailyPcs} pcs</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Aktual Harian:</span>
                      <span className="font-black text-red-600">{inc.actualDailyPcs} pcs</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Efisiensi Sewing:</span>
                      <span className={`font-bold ${inc.efficiencyPercent < 65 ? 'text-red-600' : 'text-blue-700'}`}>
                        {formatPercent(inc.efficiencyPercent)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Tingkat Defect:</span>
                      <span className="font-bold text-red-600">{formatPercent(inc.defectPercent)}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Identifikasi Gejala</span>
                  <p className="text-[11px] text-slate-700 mt-0.5 leading-tight">{inc.description}</p>
                </div>
              </div>

              {/* Col 2: Akar Masalah (Root Cause) & Tindakan Cepat */}
              <div className="space-y-2 border-r border-slate-200 pr-3">
                <div>
                  <span className="text-[10px] font-bold uppercase text-red-700 block">Akar Masalah (Root Cause)</span>
                  <p className="text-[11px] text-slate-800 mt-0.5 leading-snug bg-slate-50 p-2 rounded border border-slate-200">
                    {inc.rootCause}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase text-blue-700 block">Tindakan Penanganan Cepat</span>
                  <p className="text-[11px] text-slate-800 mt-0.5 leading-snug bg-blue-50/50 p-2 rounded border border-blue-200">
                    {inc.correctiveAction}
                  </p>
                </div>
              </div>

              {/* Col 3: Rencana Pencegahan & PIC */}
              <div className="space-y-2">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">Tindakan Pencegahan (IE Plan)</span>
                  <p className="text-[11px] text-slate-700 mt-0.5 leading-snug bg-slate-50 p-2 rounded border border-slate-200">
                    {inc.preventiveAction}
                  </p>
                </div>

                <div className="pt-1 flex items-center justify-between text-[11px] bg-slate-50 p-2 rounded">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 block uppercase">PIC Lapangan</span>
                    <span className="font-extrabold text-slate-900">{inc.pic}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-500 block uppercase">Target Selesai</span>
                    <span className="font-semibold text-slate-800">{inc.targetResolutionTime}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Bottom Bar: Specific Sign-Off notes per incident */}
            <div className="bg-slate-50/80 px-4 py-2 border-t border-slate-200 grid grid-cols-2 gap-4 text-[11px]">
              <div>
                <span className="font-bold text-blue-900">Catatan Validasi Production Engineer:</span>
                <p className="text-slate-700 italic mt-0.5">"{inc.peNotes || 'Layout balancing dievaluasi & dipantau per jam.'}"</p>
              </div>
              <div>
                <span className="font-bold text-emerald-900">Instruksi Disposisi Factory Manager:</span>
                <p className="text-slate-700 italic mt-0.5">"{inc.fmNotes || 'Disetujui untuk perbantuan operator & penyesuaian target.'}"</p>
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* OFFICIAL FORM SIGNATURE SECTION: NAMA DIISI SECARA MANUAL */}
      <div className="pt-4 border-t-2 border-slate-800">
        <div className="grid grid-cols-3 gap-6 text-xs">
          
          {/* 1. SUPERVISOR SEWING */}
          <div className="p-4 bg-slate-50 border border-slate-300 rounded-xl flex flex-col justify-between h-48">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase">1. Dilaporkan Oleh:</p>
              <p className="font-extrabold text-slate-900 text-sm mt-0.5">Chief Sewing Line</p>
              <p className="text-[10px] text-slate-500 mt-1">Penanggung jawab operasional lini sewing</p>
            </div>
            <div className="text-center">
              <div className="w-40 border-b-2 border-slate-400 mx-auto"></div>
              <p className="font-extrabold text-slate-900 text-xs mt-1.5">
                {supervisorName || '( ......................................... )'}
              </p>
              <p className="text-[10px] text-slate-500">Chief Sewing Line • Tgl: {printDate}</p>
            </div>
          </div>

          {/* 2. PRODUCTION ENGINEER (PE) */}
          <div className="p-4 bg-blue-50/80 border border-blue-300 rounded-xl flex flex-col justify-between h-48">
            <div>
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold text-blue-800 uppercase">2. Diverifikasi Oleh:</p>
                <span className="text-[9px] font-black px-1.5 py-0.5 bg-blue-700 text-white rounded">
                  [TERVERIFIKASI]
                </span>
              </div>
              <p className="font-extrabold text-blue-950 text-sm mt-0.5">Production Engineer (PE)</p>
              <p className="text-[10px] text-blue-900 mt-1">Validasi SMV, Line Balancing & Studi Gerak</p>
            </div>
            <div className="text-center">
              <div className="w-40 border-b-2 border-blue-500 mx-auto"></div>
              <p className="font-extrabold text-blue-950 text-xs mt-1.5">
                {peName || '( ......................................... )'}
              </p>
              <p className="text-[10px] text-blue-800">Lead Production Engineer • Tgl: {printDate}</p>
            </div>
          </div>

          {/* 3. FACTORY MANAGER (FM) */}
          <div className="p-4 bg-emerald-50/80 border border-emerald-300 rounded-xl flex flex-col justify-between h-48">
            <div>
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold text-emerald-800 uppercase">3. Disetujui Oleh:</p>
                <span className="text-[9px] font-black px-1.5 py-0.5 bg-emerald-700 text-white rounded">
                  [DISETUJUI RESMI]
                </span>
              </div>
              <p className="font-extrabold text-emerald-950 text-sm mt-0.5">Factory Manager (FM)</p>
              <p className="text-[10px] text-emerald-900 mt-1">Otorisasi Disposisi & Kebijakan Pabrik</p>
            </div>
            <div className="text-center">
              <div className="w-40 border-b-2 border-emerald-500 mx-auto"></div>
              <p className="font-extrabold text-emerald-950 text-xs mt-1.5">
                {fmName || '( ......................................... )'}
              </p>
              <p className="text-[10px] text-emerald-800">Factory Manager • Tgl: {printDate}</p>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};
