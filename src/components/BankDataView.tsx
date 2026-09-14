import React, { useState, useMemo } from 'react';
import { 
  Database, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Tag, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  Users,
  Layers,
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { BankDataModel } from '../types';
import { formatRupiah, formatNumber, formatPercent } from '../utils/formatters';

interface BankDataViewProps {
  models: BankDataModel[];
  onAddNew: () => void;
  onEdit: (model: BankDataModel) => void;
  onDelete: (id: string) => void;
  onUseModelInInput: (model: BankDataModel) => void;
  canInputData?: boolean;
  canEditDelete?: boolean;
}

export const BankDataView: React.FC<BankDataViewProps> = ({
  models,
  onAddNew,
  onEdit,
  onDelete,
  onUseModelInInput,
  canInputData = true,
  canEditDelete = true
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileViewMode, setMobileViewMode] = useState<'card' | 'table'>('card');

  const filteredModels = useMemo(() => {
    if (!searchQuery.trim()) return models;
    const q = searchQuery.toLowerCase();
    return models.filter(m => 
      m.modelCode.toLowerCase().includes(q) || 
      m.buyer.toLowerCase().includes(q) ||
      (m.description && m.description.toLowerCase().includes(q))
    );
  }, [models, searchQuery]);

  // Aggregate stats
  const stats = useMemo(() => {
    const totalModels = models.length;
    const avgSmv = totalModels > 0 
      ? models.reduce((acc, m) => acc + m.smvStandard, 0) / totalModels 
      : 0;
    const totalDailyCapacity = models.reduce((acc, m) => acc + m.targetDailyPcs, 0);
    const avgEfficiency = totalModels > 0
      ? models.reduce((acc, m) => acc + m.targetEfficiency, 0) / totalModels
      : 0;

    return { totalModels, avgSmv, totalDailyCapacity, avgEfficiency };
  }, [models]);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* Top Header Card */}
      <div className="bg-white p-3.5 sm:p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-blue-700 shrink-0"></span>
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
              BANK DATA MODEL & TARGET STANDAR
            </h2>
            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              Industrial Engineering (IE)
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-1">
            Master database spesifikasi model pakaian, target kapasitas harian (pcs/hari), SMV standar, dan alokasi operator
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full md:w-auto">
          {/* Search Input */}
          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari model atau buyer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {canInputData ? (
            <button
              onClick={onAddNew}
              className="inline-flex items-center justify-center space-x-1.5 px-3.5 py-2 sm:py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm shadow-blue-200 active:scale-95 shrink-0 w-full sm:w-auto cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Tambah Model Baru</span>
            </button>
          ) : (
            <span className="px-3.5 py-2 sm:py-1.5 bg-slate-100 text-slate-500 rounded-lg text-xs font-semibold border border-slate-200 shrink-0">
              🔒 Mode Pantau (Read-Only)
            </span>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600"></div>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Total Model di Bank Data
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 font-mono">
              {stats.totalModels} <span className="text-xs font-normal text-slate-500">Style Terdaftar</span>
            </span>
            <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-400">Database aktif PT Teratai Widjaja</p>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600"></div>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Rata-rata SMV Standar
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-blue-700 font-mono">
              {formatNumber(stats.avgSmv, 2)} <span className="text-xs font-normal text-slate-500">Menit/Pcs</span>
            </span>
            <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-400">Basis perhitungan efisiensi lini</p>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-red-600"></div>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Kapasitas Harian Komposit
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 font-mono">
              {stats.totalDailyCapacity.toLocaleString('id-ID')} <span className="text-xs font-normal text-slate-500">Pcs/Hari</span>
            </span>
            <span className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-400">Total akumulasi target semua model</p>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600"></div>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Target Efisiensi Standar
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-blue-700 font-mono">
              {formatPercent(stats.avgEfficiency)}
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              Benchmark IE
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-400">Standar minimal operasional sewing</p>
        </div>
      </div>

      {/* Main Table & Mobile Cards */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-3.5 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Daftar Model, Target & Standar SMV
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500">
              Menampilkan {filteredModels.length} data spesifikasi model siap pakai
            </p>
          </div>

          <div className="flex items-center justify-between sm:justify-end space-x-2">
            {/* Mobile View Toggle (Card vs Table) */}
            <div className="inline-flex sm:hidden items-center bg-slate-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setMobileViewMode('card')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                  mobileViewMode === 'card'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Kartu
              </button>
              <button
                type="button"
                onClick={() => setMobileViewMode('table')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                  mobileViewMode === 'table'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Tabel
              </button>
            </div>

            <span className="text-xs text-blue-700 font-semibold hidden sm:inline">
              Klik "Pakai" untuk mengisi form input secara otomatis
            </span>
          </div>
        </div>

        {/* MOBILE CARD VIEW (Active on mobile when mobileViewMode === 'card') */}
        <div className={`p-3 space-y-3 sm:hidden ${mobileViewMode === 'card' ? 'block' : 'hidden'}`}>
          {filteredModels.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Tidak ada data model yang sesuai pencarian.
            </div>
          ) : (
            filteredModels.map((m) => (
              <div key={m.id} className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                      <span className="text-xs font-bold text-slate-900">{m.modelCode}</span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium">{m.buyer}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                    Eff {formatPercent(m.targetEfficiency)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] bg-white p-2.5 rounded-lg border border-slate-100">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Target/Hari:</span>
                    <span className="font-bold text-blue-700 font-mono">{m.targetDailyPcs.toLocaleString('id-ID')} pcs</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Target Total:</span>
                    <span className="font-bold text-slate-800 font-mono">{m.targetTotalPcs.toLocaleString('id-ID')} pcs</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">SMV Standar:</span>
                    <span className="font-bold text-slate-800 font-mono">{formatNumber(m.smvStandard, 2)} mnt</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Manpower / CM:</span>
                    <span className="font-bold text-slate-800 font-mono">{m.manpowerStandard} org • {formatRupiah(m.cmRate)}</span>
                  </div>
                </div>

                {m.description && (
                  <p className="text-[11px] text-slate-500 italic bg-white/50 px-2 py-1 rounded">
                    {m.description}
                  </p>
                )}

                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                  <button
                    onClick={() => onUseModelInInput(m)}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-bold transition-colors active:scale-95"
                  >
                    Gunakan Model
                  </button>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => onEdit(m)}
                      className="p-1.5 rounded text-slate-600 hover:text-blue-600 hover:bg-white transition-colors"
                      title="Edit Model"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(m.id)}
                      className="p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-white transition-colors"
                      title="Hapus Model"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* FULL TABLE VIEW (Desktop always, mobile when mobileViewMode === 'table') */}
        <div className={`overflow-x-auto w-full ${mobileViewMode === 'table' ? 'block' : 'hidden sm:block'}`}>
          <table className="min-w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                <th className="px-3.5 py-3 min-w-[160px]">Kode Model / Style</th>
                <th className="px-3.5 py-3 min-w-[120px]">Buyer / Klien</th>
                <th className="px-3.5 py-3 text-right min-w-[95px]">Target/Hari</th>
                <th className="px-3.5 py-3 text-right min-w-[95px]">Target Total</th>
                <th className="px-3.5 py-3 text-right min-w-[85px]">SMV (Menit)</th>
                <th className="px-3.5 py-3 text-center min-w-[70px]">Manpower</th>
                <th className="px-3.5 py-3 text-right min-w-[95px]">CM Rate (Rp)</th>
                <th className="px-3.5 py-3 text-right min-w-[90px]">Target Efisiensi</th>
                <th className="px-3.5 py-3 min-w-[180px]">Spesifikasi / Catatan</th>
                <th className="px-3.5 py-3 text-center min-w-[110px]">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredModels.map((m) => (
                <tr key={m.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-3.5 py-3 font-bold text-slate-900">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                      <span>{m.modelCode}</span>
                    </div>
                  </td>
                  <td className="px-3.5 py-3 text-slate-600 font-medium">
                    {m.buyer}
                  </td>
                  <td className="px-3.5 py-3 text-right font-mono font-bold text-blue-700">
                    {m.targetDailyPcs.toLocaleString('id-ID')} pcs
                  </td>
                  <td className="px-3.5 py-3 text-right font-mono text-slate-700">
                    {m.targetTotalPcs.toLocaleString('id-ID')} pcs
                  </td>
                  <td className="px-3.5 py-3 text-right font-mono font-bold text-slate-800">
                    {formatNumber(m.smvStandard, 2)}
                  </td>
                  <td className="px-3.5 py-3 text-center font-mono text-slate-700">
                    {m.manpowerStandard} org
                  </td>
                  <td className="px-3.5 py-3 text-right font-mono text-slate-800">
                    {formatRupiah(m.cmRate)}
                  </td>
                  <td className="px-3.5 py-3 text-right font-mono font-bold text-blue-700">
                    {formatPercent(m.targetEfficiency)}
                  </td>
                  <td className="px-3.5 py-3 text-slate-500 text-[11px]">
                    {m.description || '-'}
                  </td>
                  <td className="px-3.5 py-3 text-center">
                    <div className="flex items-center justify-center space-x-1.5">
                      <button
                        onClick={() => onUseModelInInput(m)}
                        className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded text-[11px] font-bold transition-colors cursor-pointer"
                        title="Gunakan model ini pada form input"
                      >
                        Pakai
                      </button>
                      {canEditDelete && (
                        <>
                          <button
                            onClick={() => onEdit(m)}
                            className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                            title="Edit Model"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDelete(m.id)}
                            className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Hapus Model"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
