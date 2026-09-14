import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  X, 
  Check, 
  Clock, 
  AlertTriangle, 
  Send, 
  CheckCircle2, 
  Plus, 
  Calendar, 
  Wrench, 
  Search, 
  Trash2, 
  ArrowRight, 
  UserCheck, 
  RotateCcw,
  Sparkles,
  Info,
  ChevronRight
} from 'lucide-react';
import { UrgentPushNotification, NotificationLifecycleStatus } from '../types';
import { 
  requestBrowserNotificationPermission, 
  sendBrowserPushNotification,
  saveUrgentNotifications 
} from '../utils/scheduleCalculations';

interface UrgentPushNotificationModuleProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: UrgentPushNotification[];
  onUpdateNotifications: (updated: UrgentPushNotification[]) => void;
  onNavigateToLine?: (lineId: number) => void;
}

export const UrgentPushNotificationModule: React.FC<UrgentPushNotificationModuleProps> = ({
  isOpen,
  onClose,
  notifications,
  onUpdateNotifications,
  onNavigateToLine
}) => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [activeFilter, setActiveFilter] = useState<'all' | NotificationLifecycleStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingNotifId, setEditingNotifId] = useState<string | null>(null);

  // Form State untuk Input Manual
  const [newTitle, setNewTitle] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [newLineId, setNewLineId] = useState<number>(1);
  const [newSeverity, setNewSeverity] = useState<'critical' | 'warning' | 'info'>('warning');
  const [newStatus, setNewStatus] = useState<NotificationLifecycleStatus>('baru');
  const [newPic, setNewPic] = useState('Tim Produksi');

  // Form State untuk Modal Edit Tanggal & Status
  const [editStatus, setEditStatus] = useState<NotificationLifecycleStatus>('baru');
  const [editFollowUpDate, setEditFollowUpDate] = useState('');
  const [editFollowUpNote, setEditFollowUpNote] = useState('');
  const [editProcessDate, setEditProcessDate] = useState('');
  const [editProcessNote, setEditProcessNote] = useState('');
  const [editCompletedDate, setEditCompletedDate] = useState('');
  const [editCompletedNote, setEditCompletedNote] = useState('');
  const [editPic, setEditPic] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    const result = await requestBrowserNotificationPermission();
    setPermission(result);
    if (result === 'granted') {
      sendBrowserPushNotification(
        '🔔 Notifikasi Aktif - PT Teratai Widjaja',
        'Pemberitahuan kendala & pembaruan status lini produksi akan dikirim otomatis.'
      );
    }
  };

  const handleMarkAsRead = (id: string) => {
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    onUpdateNotifications(updated);
    saveUrgentNotifications(updated);
  };

  const handleMarkAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    onUpdateNotifications(updated);
    saveUrgentNotifications(updated);
  };

  const handleDeleteNotif = (id: string) => {
    const updated = notifications.filter(n => n.id !== id);
    onUpdateNotifications(updated);
    saveUrgentNotifications(updated);
  };

  // Quick Action Update Status
  const handleQuickAdvanceStatus = (id: string, targetStatus: NotificationLifecycleStatus) => {
    const updated = notifications.map(n => {
      if (n.id !== id) return n;

      const item: UrgentPushNotification = {
        ...n,
        status: targetStatus,
        read: true
      };

      if (targetStatus === 'follow_up' && !item.followUpDate) {
        item.followUpDate = todayStr;
        item.followUpNote = item.followUpNote || 'Sudah dikoordinasikan dengan supervisor line.';
      } else if (targetStatus === 'proses_perbaikan') {
        if (!item.followUpDate) item.followUpDate = todayStr;
        item.processDate = todayStr;
        item.processNote = item.processNote || 'Sedang dalam penanganan teknis & perbaikan.';
      } else if (targetStatus === 'selesai') {
        if (!item.followUpDate) item.followUpDate = item.followUpDate || todayStr;
        if (!item.processDate) item.processDate = item.processDate || todayStr;
        item.completedDate = todayStr;
        item.completedNote = item.completedNote || 'Selesai ditangani dan diverifikasi normal.';
      }

      return item;
    });

    onUpdateNotifications(updated);
    saveUrgentNotifications(updated);
  };

  // Submit Tambah Manual Notifikasi
  const handleSaveManualNotif = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newMessage.trim()) return;

    const notifItem: UrgentPushNotification = {
      id: `notif-manual-${Date.now()}`,
      timestamp: new Date().toISOString(),
      title: newTitle.trim(),
      message: newMessage.trim(),
      type: newSeverity === 'critical' ? 'bottleneck' : 'urgent_update',
      lineId: newLineId,
      lineName: `Line ${newLineId}`,
      severity: newSeverity,
      read: false,
      status: newStatus,
      picName: newPic.trim() || 'Tim Produksi'
    };

    if (newStatus === 'follow_up') {
      notifItem.followUpDate = todayStr;
      notifItem.followUpNote = 'Input langsung tahap follow up.';
    } else if (newStatus === 'proses_perbaikan') {
      notifItem.followUpDate = todayStr;
      notifItem.processDate = todayStr;
      notifItem.processNote = 'Input langsung proses perbaikan.';
    } else if (newStatus === 'selesai') {
      notifItem.followUpDate = todayStr;
      notifItem.processDate = todayStr;
      notifItem.completedDate = todayStr;
      notifItem.completedNote = 'Input langsung selesai.';
    }

    const updated = [notifItem, ...notifications];
    onUpdateNotifications(updated);
    saveUrgentNotifications(updated);

    // Kirim push ke browser
    sendBrowserPushNotification(newTitle, newMessage);

    // Reset Form
    setNewTitle('');
    setNewMessage('');
    setShowAddForm(false);
  };

  // Buka dialog edit detail tanggal & status
  const handleOpenEditDetail = (n: UrgentPushNotification) => {
    setEditingNotifId(n.id);
    setEditStatus(n.status || 'baru');
    setEditFollowUpDate(n.followUpDate || todayStr);
    setEditFollowUpNote(n.followUpNote || '');
    setEditProcessDate(n.processDate || todayStr);
    setEditProcessNote(n.processNote || '');
    setEditCompletedDate(n.completedDate || todayStr);
    setEditCompletedNote(n.completedNote || '');
    setEditPic(n.picName || '');
  };

  // Simpan hasil edit status & tanggal manual
  const handleSaveEditDetail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNotifId) return;

    const updated = notifications.map(n => {
      if (n.id !== editingNotifId) return n;
      return {
        ...n,
        status: editStatus,
        followUpDate: (editStatus === 'follow_up' || editStatus === 'proses_perbaikan' || editStatus === 'selesai') ? editFollowUpDate : undefined,
        followUpNote: editFollowUpNote.trim() || undefined,
        processDate: (editStatus === 'proses_perbaikan' || editStatus === 'selesai') ? editProcessDate : undefined,
        processNote: editProcessNote.trim() || undefined,
        completedDate: editStatus === 'selesai' ? editCompletedDate : undefined,
        completedNote: editCompletedNote.trim() || undefined,
        picName: editPic.trim() || n.picName
      };
    });

    onUpdateNotifications(updated);
    saveUrgentNotifications(updated);
    setEditingNotifId(null);
  };

  // Filtered Notifications
  const filteredNotifications = notifications.filter(n => {
    const currentStatus = n.status || 'baru';
    const matchFilter = activeFilter === 'all' || currentStatus === activeFilter;
    const matchSearch = searchQuery === '' || 
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (n.lineName && n.lineName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (n.picName && n.picName.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchFilter && matchSearch;
  });

  const unreadCount = notifications.filter(n => !n.read).length;
  const countBaru = notifications.filter(n => (n.status || 'baru') === 'baru').length;
  const countFollowUp = notifications.filter(n => n.status === 'follow_up').length;
  const countProses = notifications.filter(n => n.status === 'proses_perbaikan').length;
  const countSelesai = notifications.filter(n => n.status === 'selesai').length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6">
        
        {/* Header Bersih & Modern */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-xs">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold tracking-tight">
                  Pusat Pemberitahuan & Tindak Lanjut
                </h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black">
                    {unreadCount} Baru
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300">
                Pemantauan kendala sewing, tindak lanjut tim, dan progres perbaikan
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Browser Permission Sub-bar */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-2 text-slate-600 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Notifikasi Browser:</span>
            {permission === 'granted' ? (
              <span className="font-bold text-emerald-700">Aktif</span>
            ) : (
              <span className="font-bold text-amber-700">Belum diaktifkan</span>
            )}
          </div>
          {permission !== 'granted' && (
            <button
              onClick={handleRequestPermission}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center space-x-1"
            >
              <span>Aktifkan Notifikasi di Peramban</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Tabs & Quick Action Bar */}
        <div className="p-4 sm:px-6 bg-white border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          {/* Status Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                activeFilter === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua ({notifications.length})
            </button>

            <button
              onClick={() => setActiveFilter('baru')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center space-x-1 ${
                activeFilter === 'baru'
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
              }`}
            >
              <span>Baru</span>
              <span className="text-[10px] px-1 py-0.2 bg-white/20 rounded-full font-black">{countBaru}</span>
            </button>

            <button
              onClick={() => setActiveFilter('follow_up')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center space-x-1 ${
                activeFilter === 'follow_up'
                  ? 'bg-amber-500 text-white'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              <span>Follow Up</span>
              <span className="text-[10px] px-1 py-0.2 bg-white/20 rounded-full font-black">{countFollowUp}</span>
            </button>

            <button
              onClick={() => setActiveFilter('proses_perbaikan')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center space-x-1 ${
                activeFilter === 'proses_perbaikan'
                  ? 'bg-orange-600 text-white'
                  : 'bg-orange-50 text-orange-800 hover:bg-orange-100 border border-orange-200'
              }`}
            >
              <span>Perbaikan</span>
              <span className="text-[10px] px-1 py-0.2 bg-white/20 rounded-full font-black">{countProses}</span>
            </button>

            <button
              onClick={() => setActiveFilter('selesai')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center space-x-1 ${
                activeFilter === 'selesai'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              <span>Selesai</span>
              <span className="text-[10px] px-1 py-0.2 bg-white/20 rounded-full font-black">{countSelesai}</span>
            </button>
          </div>

          {/* Tombol Tambah Manual & Tandai Dibaca */}
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-2xs transition-colors flex items-center space-x-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showAddForm ? 'Tutup Form' : '+ Catat Notif'}</span>
            </button>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 hover:underline px-2 py-1"
                title="Tandai semua sudah dibaca"
              >
                Sudah Dibaca
              </button>
            )}
          </div>

        </div>

        {/* Input Manual Notifikasi Form (Collapsible) */}
        {showAddForm && (
          <form onSubmit={handleSaveManualNotif} className="p-5 bg-blue-50/70 border-b border-blue-200 space-y-3.5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-blue-950 flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>Input Manual Pemberitahuan / Kendala Baru</span>
              </h4>
              <span className="text-[11px] text-blue-600 font-medium">Tanggal: {todayStr}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Judul Ringkas *</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Contoh: Pisau trimmer tumpul di Line 4"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Line Produksi</label>
                <select
                  value={newLineId}
                  onChange={(e) => setNewLineId(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(id => (
                    <option key={id} value={id}>Line {id}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="text-xs">
              <label className="block font-bold text-slate-700 mb-1">Isi Keterangan Masalah / Instruksi *</label>
              <textarea
                rows={2}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Jelaskan kendala secara singkat, penyebab, atau kebutuhan lembur..."
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tingkat Prioritas</label>
                <select
                  value={newSeverity}
                  onChange={(e) => setNewSeverity(e.target.value as any)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="critical">🔴 Mendesak (Kritis)</option>
                  <option value="warning">🟡 Perhatian</option>
                  <option value="info">🔵 Informasi Biasa</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Status Awal</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as any)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="baru">🔵 Baru (Menunggu)</option>
                  <option value="follow_up">🟡 Langsung Follow Up</option>
                  <option value="proses_perbaikan">🟠 Sedang Perbaikan</option>
                  <option value="selesai">🟢 Sudah Selesai</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">PIC / Petugas</label>
                <input
                  type="text"
                  value={newPic}
                  onChange={(e) => setNewPic(e.target.value)}
                  placeholder="Nama PIC (contoh: Hendra)"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 font-medium text-slate-900 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 font-semibold"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-2xs inline-flex items-center space-x-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Simpan Notifikasi</span>
              </button>
            </div>
          </form>
        )}

        {/* Modal Mini: Edit Status & Tanggal Manual */}
        {editingNotifId && (
          <div className="p-5 bg-amber-50/90 border-b border-amber-200 animate-in fade-in duration-150 text-xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-amber-950 flex items-center space-x-1.5">
                <Calendar className="w-4 h-4 text-amber-700" />
                <span>Pembaruan Status & Riwayat Tanggal Penanganan</span>
              </h4>
              <button
                onClick={() => setEditingNotifId(null)}
                className="text-amber-800 hover:text-amber-950 text-xs font-bold"
              >
                ✕ Batal
              </button>
            </div>

            <form onSubmit={handleSaveEditDetail} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pilih Status Penanganan:</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as NotificationLifecycleStatus)}
                    className="w-full bg-white border border-amber-300 rounded-lg px-3 py-1.5 font-bold text-slate-900 focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="baru">🔵 Baru (Belum Ditindaklanjuti)</option>
                    <option value="follow_up">🟡 Sudah Di-Follow Up</option>
                    <option value="proses_perbaikan">🟠 Dalam Proses Perbaikan</option>
                    <option value="selesai">🟢 Selesai / Teratasi</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama PIC Penanggung Jawab:</label>
                  <input
                    type="text"
                    value={editPic}
                    onChange={(e) => setEditPic(e.target.value)}
                    placeholder="Contoh: Dimas Aditya (IE) / Teknisi Mesin"
                    className="w-full bg-white border border-amber-300 rounded-lg px-3 py-1.5 text-slate-900 focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Tanggal & Catatan Follow Up */}
              {(editStatus === 'follow_up' || editStatus === 'proses_perbaikan' || editStatus === 'selesai') && (
                <div className="p-3 bg-white rounded-lg border border-amber-200 grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700">Tanggal Follow Up:</label>
                    <input
                      type="date"
                      value={editFollowUpDate}
                      onChange={(e) => setEditFollowUpDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-md px-2 py-1 font-bold text-slate-900"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700">Catatan Tindak Lanjut:</label>
                    <input
                      type="text"
                      value={editFollowUpNote}
                      onChange={(e) => setEditFollowUpNote(e.target.value)}
                      placeholder="Contoh: Sudah diperiksa supervisor line & koordinasi part..."
                      className="w-full bg-slate-50 border border-slate-300 rounded-md px-2 py-1 text-slate-900"
                    />
                  </div>
                </div>
              )}

              {/* Tanggal & Catatan Proses Perbaikan */}
              {(editStatus === 'proses_perbaikan' || editStatus === 'selesai') && (
                <div className="p-3 bg-white rounded-lg border border-orange-200 grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700">Tanggal Mulai Perbaikan:</label>
                    <input
                      type="date"
                      value={editProcessDate}
                      onChange={(e) => setEditProcessDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-md px-2 py-1 font-bold text-slate-900"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700">Catatan Proses Perbaikan:</label>
                    <input
                      type="text"
                      value={editProcessNote}
                      onChange={(e) => setEditProcessNote(e.target.value)}
                      placeholder="Contoh: Penggantian sparepart jarum / folder hemming baru..."
                      className="w-full bg-slate-50 border border-slate-300 rounded-md px-2 py-1 text-slate-900"
                    />
                  </div>
                </div>
              )}

              {/* Tanggal & Catatan Selesai */}
              {editStatus === 'selesai' && (
                <div className="p-3 bg-white rounded-lg border border-emerald-200 grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700">Tanggal Selesai:</label>
                    <input
                      type="date"
                      value={editCompletedDate}
                      onChange={(e) => setEditCompletedDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-md px-2 py-1 font-bold text-emerald-800"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700">Catatan Penyelesaian:</label>
                    <input
                      type="text"
                      value={editCompletedNote}
                      onChange={(e) => setEditCompletedNote(e.target.value)}
                      placeholder="Contoh: Sudah diuji jahit 20 pcs dan hasil memenuhi spek..."
                      className="w-full bg-slate-50 border border-slate-300 rounded-md px-2 py-1 text-slate-900"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => setEditingNotifId(null)}
                  className="px-3 py-1 text-slate-600 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold shadow-2xs"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Content Body: Daftar Kartu Notifikasi */}
        <div className="p-4 sm:p-6 space-y-3.5 max-h-[60vh] overflow-y-auto bg-slate-50/50">
          
          {filteredNotifications.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <CheckCircle2 className="w-9 h-9 mx-auto text-emerald-500 mb-2" />
              <p className="font-bold text-sm text-slate-700">Tidak ada notifikasi pada kategori ini</p>
              <p className="text-slate-400 mt-0.5">Semua proses berjalan lancar atau belum ada catatan baru.</p>
            </div>
          ) : (
            filteredNotifications.map((n) => {
              const currentStatus = n.status || 'baru';

              return (
                <div
                  key={n.id}
                  className={`p-4 rounded-xl border transition-all text-xs bg-white shadow-2xs ${
                    !n.read 
                      ? n.severity === 'critical'
                        ? 'border-red-300 ring-1 ring-red-200'
                        : 'border-amber-300 ring-1 ring-amber-200'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    
                    {/* Info Utama */}
                    <div className="flex items-start space-x-3 flex-1">
                      {/* Icon Indicator */}
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        n.severity === 'critical'
                          ? 'bg-red-100 text-red-600 font-black'
                          : n.severity === 'warning'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {currentStatus === 'selesai' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : currentStatus === 'proses_perbaikan' ? (
                          <Wrench className="w-4 h-4 text-orange-600" />
                        ) : currentStatus === 'follow_up' ? (
                          <UserCheck className="w-4 h-4 text-amber-600" />
                        ) : (
                          <AlertTriangle className="w-4 h-4" />
                        )}
                      </div>

                      {/* Detail Text */}
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          
                          {/* Status Badge */}
                          {currentStatus === 'baru' && (
                            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-black border border-blue-200">
                              🔵 Baru
                            </span>
                          )}
                          {currentStatus === 'follow_up' && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-black border border-amber-300">
                              🟡 Di-Follow Up
                            </span>
                          )}
                          {currentStatus === 'proses_perbaikan' && (
                            <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-900 text-[10px] font-black border border-orange-300">
                              🟠 Proses Perbaikan
                            </span>
                          )}
                          {currentStatus === 'selesai' && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-black border border-emerald-300">
                              🟢 Selesai
                            </span>
                          )}

                          {/* Line Badge */}
                          {n.lineName && (
                            <span className="px-2 py-0.5 rounded-md bg-slate-800 text-white text-[10px] font-bold">
                              {n.lineName}
                            </span>
                          )}

                          {/* Style Name */}
                          {n.styleName && (
                            <span className="text-[11px] text-slate-500 font-semibold">
                              ({n.styleName})
                            </span>
                          )}

                          {!n.read && (
                            <span className="w-2 h-2 rounded-full bg-red-600 inline-block animate-pulse"></span>
                          )}
                        </div>

                        {/* Title & Message */}
                        <h4 className="font-bold text-slate-900 text-sm leading-snug">
                          {n.title}
                        </h4>
                        <p className="text-slate-600 text-xs leading-relaxed">
                          {n.message}
                        </p>

                        {/* Riwayat Tanggal & Tahapan Penanganan */}
                        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] space-y-1">
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-500">
                            <span>📅 Dibuat: <strong className="text-slate-700">{new Date(n.timestamp).toLocaleDateString('id-ID')}</strong></span>
                            {n.followUpDate && (
                              <span>🔍 Follow Up: <strong className="text-amber-800">{n.followUpDate}</strong></span>
                            )}
                            {n.processDate && (
                              <span>⚙️ Proses: <strong className="text-orange-800">{n.processDate}</strong></span>
                            )}
                            {n.completedDate && (
                              <span>✅ Selesai: <strong className="text-emerald-800">{n.completedDate}</strong></span>
                            )}
                            {n.picName && (
                              <span>👤 PIC: <strong className="text-slate-700">{n.picName}</strong></span>
                            )}
                          </div>

                          {/* Catatan spesifik bila ada */}
                          {n.completedNote && (
                            <div className="text-emerald-800 font-medium">
                              Ket. Selesai: {n.completedNote}
                            </div>
                          )}
                          {!n.completedNote && n.processNote && (
                            <div className="text-orange-800 font-medium">
                              Ket. Proses: {n.processNote}
                            </div>
                          )}
                          {!n.completedNote && !n.processNote && n.followUpNote && (
                            <div className="text-amber-800 font-medium">
                              Ket. Follow Up: {n.followUpNote}
                            </div>
                          )}
                        </div>

                      </div>
                    </div>

                    {/* Action Buttons Column */}
                    <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-1.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      
                      {/* Step Advancement Buttons */}
                      {currentStatus === 'baru' && (
                        <button
                          onClick={() => handleQuickAdvanceStatus(n.id, 'follow_up')}
                          className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-lg text-[11px] font-bold transition-colors flex items-center space-x-1"
                          title="Tandai sudah di-follow up hari ini"
                        >
                          <UserCheck className="w-3.5 h-3.5 text-amber-700" />
                          <span>Follow Up</span>
                        </button>
                      )}

                      {currentStatus === 'follow_up' && (
                        <button
                          onClick={() => handleQuickAdvanceStatus(n.id, 'proses_perbaikan')}
                          className="px-2.5 py-1 bg-orange-100 hover:bg-orange-200 text-orange-900 border border-orange-300 rounded-lg text-[11px] font-bold transition-colors flex items-center space-x-1"
                          title="Tandai proses perbaikan dimulai hari ini"
                        >
                          <Wrench className="w-3.5 h-3.5 text-orange-700" />
                          <span>Mulai Perbaikan</span>
                        </button>
                      )}

                      {currentStatus === 'proses_perbaikan' && (
                        <button
                          onClick={() => handleQuickAdvanceStatus(n.id, 'selesai')}
                          className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300 rounded-lg text-[11px] font-bold transition-colors flex items-center space-x-1"
                          title="Tandai sudah selesai dan normal hari ini"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Selesai</span>
                        </button>
                      )}

                      {/* Edit Tanggal & Status Manual */}
                      <button
                        onClick={() => handleOpenEditDetail(n)}
                        className="text-[11px] font-semibold text-blue-700 hover:text-blue-900 hover:underline px-1 py-0.5"
                      >
                        Ubah Tanggal
                      </button>

                      <div className="flex items-center space-x-1 pt-1">
                        {!n.read && (
                          <button
                            onClick={() => handleMarkAsRead(n.id)}
                            className="p-1 text-slate-400 hover:text-emerald-700 rounded-md hover:bg-slate-100"
                            title="Tandai sudah dibaca"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (confirm(`Hapus notifikasi "${n.title}"?`)) {
                              handleDeleteNotif(n.id);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-red-600 rounded-md hover:bg-slate-100"
                          title="Hapus notifikasi"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                    </div>

                  </div>
                </div>
              );
            })
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Menampilkan {filteredNotifications.length} notifikasi</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
