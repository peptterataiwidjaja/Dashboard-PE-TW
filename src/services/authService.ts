import { AuthUser, UserRole } from '../types';

export const AUTH_STORAGE_KEY = 'tw_auth_active_user_v1';

export const DEFAULT_PE_USER: AuthUser = {
  id: 'usr-pe-001',
  username: 'pe',
  name: 'Process Engineer (PE)',
  email: 'peptterataiwidjaja@gmail.com',
  role: 'PE',
  roleTitle: 'Process Engineering & Production Admin',
  department: 'Production & Process Engineering (PE)',
  canInputData: true,
  canPrintPdf: true,
  canEditDelete: true,
  canBackupRestore: true,
  lastLogin: new Date().toISOString()
};

export const DEFAULT_MONITOR_USER: AuthUser = {
  id: 'usr-mon-002',
  username: 'monitor',
  name: 'Akun Pemantau (Monitor Only)',
  email: 'monitor@terataiwidjaja.com',
  role: 'MONITOR',
  roleTitle: 'Executive Viewer / Monitoring Display',
  department: 'Operational Viewer & Management',
  canInputData: false,
  canPrintPdf: false,
  canEditDelete: false,
  canBackupRestore: false,
  lastLogin: new Date().toISOString()
};

/**
 * Mendapatkan pengguna aktif saat ini dari localStorage atau default ke Akun PE
 */
export function getStoredAuthUser(): AuthUser {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && (parsed.role === 'PE' || parsed.role === 'MONITOR')) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Gagal membaca sesi pengguna:', err);
  }
  // Default awal ke Akun PE dengan wewenang penuh
  return DEFAULT_PE_USER;
}

/**
 * Menyimpan sesi pengguna aktif ke localStorage
 */
export function saveAuthUser(user: AuthUser): void {
  try {
    const updated = {
      ...user,
      lastLogin: new Date().toISOString()
    };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Gagal menyimpan sesi pengguna:', err);
  }
}

/**
 * Otentikasi login berdasarkan username/email dan password/PIN
 */
export function loginWithCredentials(usernameOrEmail: string, passwordOrPin: string): AuthUser | null {
  const cleanUser = usernameOrEmail.trim().toLowerCase();
  const cleanPass = passwordOrPin.trim();

  // Cek Akun PE
  if (
    cleanUser === 'pe' || 
    cleanUser === 'peptterataiwidjaja@gmail.com' || 
    cleanUser === 'admin' ||
    cleanUser === 'pe@terataiwidjaja.com'
  ) {
    if (cleanPass === 'pe123' || cleanPass === '1234' || cleanPass === 'admin') {
      saveAuthUser(DEFAULT_PE_USER);
      return DEFAULT_PE_USER;
    }
  }

  // Cek Akun Monitor
  if (
    cleanUser === 'monitor' || 
    cleanUser === 'monitor@terataiwidjaja.com' ||
    cleanUser === 'viewer' ||
    cleanUser === 'tamu'
  ) {
    if (cleanPass === 'monitor123' || cleanPass === '0000' || cleanPass === '1234' || cleanPass === 'monitor') {
      saveAuthUser(DEFAULT_MONITOR_USER);
      return DEFAULT_MONITOR_USER;
    }
  }

  return null;
}

/**
 * Beralih akun cepat (Quick Role Switch)
 */
export function switchAccount(targetRole: UserRole): AuthUser {
  const user = targetRole === 'PE' ? DEFAULT_PE_USER : DEFAULT_MONITOR_USER;
  saveAuthUser(user);
  return user;
}

/**
 * Menghapus sesi login
 */
export function logoutAuthUser(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}
