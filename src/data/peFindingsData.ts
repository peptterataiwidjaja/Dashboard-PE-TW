import { ProcessEngineeringFinding, PECategory } from '../types';

const PE_FINDINGS_STORAGE_KEY = 'tw_pe_findings_v1';

export const PE_CATEGORY_CONFIG: Record<PECategory, { label: string; shortLabel: string; color: string; bgColor: string; borderColor: string; icon: string }> = {
  motion_waste: {
    label: 'Pemborosan Gerakan (Motion Waste)',
    shortLabel: 'Motion Waste',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    icon: 'Activity'
  },
  attachment_tooling: {
    label: 'Perkakas & Corong (Attachment / Tooling)',
    shortLabel: 'Tooling / Corong',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    icon: 'Wrench'
  },
  workstation_ergonomics: {
    label: 'Ergonomi & Tata Letak Stasiun (Workstation Layout)',
    shortLabel: 'Ergonomi Stasiun',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    icon: 'Layers'
  },
  material_interlining: {
    label: 'Karakteristik Bahan & Interlining (Material Issue)',
    shortLabel: 'Bahan / Fusing',
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    icon: 'Scissors'
  },
  operator_skill: {
    label: 'Keterampilan Operator & Bottleneck (Skill Balance)',
    shortLabel: 'Skill / Bottleneck',
    color: 'text-rose-700',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-200',
    icon: 'Users'
  },
  machine_tension: {
    label: 'Kecepatan Mesin & Tegangan Benang (RPM / Tension)',
    shortLabel: 'Mesin / Tension',
    color: 'text-cyan-700',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-200',
    icon: 'Cpu'
  }
};

export const INITIAL_PE_FINDINGS: ProcessEngineeringFinding[] = [];

export function loadSavedPEFindings(): ProcessEngineeringFinding[] {
  try {
    const raw = localStorage.getItem(PE_FINDINGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error loading PE findings:', err);
  }
  return INITIAL_PE_FINDINGS;
}

export function savePEFindings(findings: ProcessEngineeringFinding[]) {
  try {
    localStorage.setItem(PE_FINDINGS_STORAGE_KEY, JSON.stringify(findings));
  } catch (err) {
    console.error('Error saving PE findings:', err);
  }
}
