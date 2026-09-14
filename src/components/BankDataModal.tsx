import React, { useState, useEffect } from 'react';
import { X, Save, Database, Sparkles, Tag, DollarSign, Clock, Users } from 'lucide-react';
import { BankDataModel } from '../types';

interface BankDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (model: BankDataModel) => void;
  initialData?: BankDataModel | null;
}

export const BankDataModal: React.FC<BankDataModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData
}) => {
  const [formData, setFormData] = useState<Omit<BankDataModel, 'id' | 'updatedAt'>>({
    modelCode: '',
    buyer: '',
    smvStandard: 25.0,
    targetDailyPcs: 450,
    targetTotalPcs: 5000,
    manpowerStandard: 40,
    workingHoursStandard: 8,
    cmRate: 35000,
    targetEfficiency: 75.0,
    description: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        modelCode: initialData.modelCode,
        buyer: initialData.buyer,
        smvStandard: initialData.smvStandard,
        targetDailyPcs: initialData.targetDailyPcs,
        targetTotalPcs: initialData.targetTotalPcs,
        manpowerStandard: initialData.manpowerStandard,
        workingHoursStandard: initialData.workingHoursStandard,
        cmRate: initialData.cmRate,
        targetEfficiency: initialData.targetEfficiency,
        description: initialData.description || ''
      });
    } else {
      setFormData({
        modelCode: '',
        buyer: 'Delami Brands',
        smvStandard: 25.5,
        targetDailyPcs: 450,
        targetTotalPcs: 5000,
        manpowerStandard: 40,
        workingHoursStandard: 8,
        cmRate: 35000,
        targetEfficiency: 75.0,
        description: ''
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.modelCode.trim()) return;

    const record: BankDataModel = {
      id: initialData ? initialData.id : `bank-${Date.now()}`,
      ...formData,
      updatedAt: new Date().toISOString().split('T')[0]
    };

    onSave(record);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150">
        
        {/* Accent Strip */}
        <div className="h-1.5 w-full bg-linear-to-r from-blue-700 via-blue-600 to-red-600"></div>

        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {initialData ? 'Edit Master Model & Target' : 'Tambah ke Bank Data Model & Target'}
              </h3>
              <p className="text-xs text-slate-500">
                PT Teratai Widjaja • Database Standar Produksi Sewing (IE)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          
          {/* Row 1: Model Code & Buyer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kode / Nama Model Garment
              </label>
              <input
                type="text"
                value={formData.modelCode}
                onChange={(e) => setFormData(prev => ({ ...prev, modelCode: e.target.value.toUpperCase() }))}
                placeholder="Misal: DELAMI H200, IPBO TOGA"
                className="w-full text-xs font-bold px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Buyer / Customer
              </label>
              <input
                type="text"
                value={formData.buyer}
                onChange={(e) => setFormData(prev => ({ ...prev, buyer: e.target.value }))}
                placeholder="Misal: Delami, UII, IPB, Export"
                className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
              />
            </div>
          </div>

          {/* Row 2: Target Daily & Target Total */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <div>
              <label className="block text-xs font-bold text-blue-900 mb-1">
                Target Output per Hari (Pcs/Hari)
              </label>
              <input
                type="number"
                min={1}
                value={formData.targetDailyPcs}
                onChange={(e) => setFormData(prev => ({ ...prev, targetDailyPcs: Number(e.target.value) }))}
                className="w-full text-xs font-mono font-bold px-3 py-2 bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
              />
              <span className="text-[10px] text-slate-400">Kapasitas harian lini standar</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Target Total PO / Order (Pcs)
              </label>
              <input
                type="number"
                min={1}
                value={formData.targetTotalPcs}
                onChange={(e) => setFormData(prev => ({ ...prev, targetTotalPcs: Number(e.target.value) }))}
                className="w-full text-xs font-mono font-bold px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
              />
              <span className="text-[10px] text-slate-400">Total kuota order produksi</span>
            </div>
          </div>

          {/* Row 3: SMV, Manpower, Jam Kerja */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                SMV Standar (Menit)
              </label>
              <input
                type="number"
                step="0.01"
                min={0.1}
                value={formData.smvStandard}
                onChange={(e) => setFormData(prev => ({ ...prev, smvStandard: Number(e.target.value) }))}
                className="w-full text-xs font-mono font-bold px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-blue-700"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Standar Manpower
              </label>
              <input
                type="number"
                min={1}
                value={formData.manpowerStandard}
                onChange={(e) => setFormData(prev => ({ ...prev, manpowerStandard: Number(e.target.value) }))}
                className="w-full text-xs font-mono px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
              />
              <span className="text-[10px] text-slate-400">Orang/Line</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Jam Kerja Standar
              </label>
              <input
                type="number"
                min={1}
                value={formData.workingHoursStandard}
                onChange={(e) => setFormData(prev => ({ ...prev, workingHoursStandard: Number(e.target.value) }))}
                className="w-full text-xs font-mono px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
              />
              <span className="text-[10px] text-slate-400">Jam/Hari</span>
            </div>
          </div>

          {/* Row 4: CM Rate & Target Efisiensi */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                CM Rate (Rp/Pcs)
              </label>
              <input
                type="number"
                step="500"
                min={0}
                value={formData.cmRate}
                onChange={(e) => setFormData(prev => ({ ...prev, cmRate: Number(e.target.value) }))}
                className="w-full text-xs font-mono font-bold px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Target Efisiensi (%)
              </label>
              <input
                type="number"
                step="0.5"
                min={10}
                max={100}
                value={formData.targetEfficiency}
                onChange={(e) => setFormData(prev => ({ ...prev, targetEfficiency: Number(e.target.value) }))}
                className="w-full text-xs font-mono font-bold px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-blue-700"
                required
              />
            </div>
          </div>

          {/* Row 5: Deskripsi / Catatan Teknis */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Spesifikasi / Catatan Khusus Proses Sewing
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Misal: Bahan stretch spandex, stasiun obras butuh perhatian, kerah bordir khusus"
              className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* Submit Action */}
          <div className="pt-3 flex justify-end space-x-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all shadow-sm shadow-blue-200 flex items-center space-x-1.5 active:scale-95"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Simpan ke Bank Data</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
