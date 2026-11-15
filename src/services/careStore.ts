import {
  INITIAL_RESIDENTS,
  type AppointmentItem,
  type CareNote,
  type CareTaskItem,
  type ComfortPreferences,
  type PrescriptionItem,
  type ResidentProfile,
  type SecurityLogEntry,
  type VitalReading,
  type WellnessDayPoint,
} from "../data/eldercareData";
import { deriveDisplayName, type FreebuffUser } from "../freebuffAuth";

/**
 * Device-local care store.
 *
 * Firebase/Firestore was replaced by Freebuff sign-in, so the shared care
 * circle now persists on this device instead of a cloud database. The exported
 * API mirrors the previous Firestore helpers so every existing call site keeps
 * working, and the App writes one authoritative snapshot after each change.
 */
const CARE_STATE_KEY = "kindred_care_state_v1";

export interface CareState {
  activeResidentId: string;
  residents: ResidentProfile[];
  updatedAt: string;
}

export function readCareState(): CareState | null {
  try {
    const raw = window.localStorage.getItem(CARE_STATE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CareState;
    if (!parsed || !Array.isArray(parsed.residents) || parsed.residents.length === 0) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveCareState(state: {
  activeResidentId: string;
  residents: ResidentProfile[];
}): void {
  try {
    const payload: CareState = {
      activeResidentId: state.activeResidentId,
      residents: state.residents,
      updatedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(CARE_STATE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage quota / privacy mode failures.
  }
}

export function clearCareState(): void {
  try {
    window.localStorage.removeItem(CARE_STATE_KEY);
  } catch {
    // Ignore storage errors.
  }
}

export function loadInitialCareState(): {
  residents: ResidentProfile[];
  activeResidentId: string;
} {
  const stored = readCareState();
  if (!stored) {
    return {
      residents: INITIAL_RESIDENTS,
      activeResidentId: INITIAL_RESIDENTS[0].id,
    };
  }
  const hasActive = stored.residents.some((r) => r.id === stored.activeResidentId);
  return {
    residents: stored.residents,
    activeResidentId: hasActive ? stored.activeResidentId : stored.residents[0].id,
  };
}

function mutateResident(
  residentId: string,
  updater: (resident: ResidentProfile) => ResidentProfile
): void {
  const state = readCareState();
  if (!state) return;
  const nextResidents = state.residents.map((resident) =>
    resident.id === residentId ? updater(resident) : resident
  );
  saveCareState({ activeResidentId: state.activeResidentId, residents: nextResidents });
}

function mutateState(updater: (state: CareState) => CareState): void {
  const state = readCareState();
  if (!state) return;
  saveCareState(updater(state));
}

export async function ensureCaregiverProfile(
  user: FreebuffUser,
  _activeResidentId: string
): Promise<void> {
  // Freebuff sessions are already established by the auth module.
  void user;
}

export async function seedInitialResidentsIfEmpty(
  _uid: string
): Promise<ResidentProfile[]> {
  return readCareState()?.residents ?? [...INITIAL_RESIDENTS];
}

export async function persistLastActiveResident(
  _uid: string,
  residentId: string
): Promise<void> {
  mutateState((state) => ({ ...state, activeResidentId: residentId }));
}

export async function persistAddTask(
  _uid: string,
  residentId: string,
  task: CareTaskItem
): Promise<void> {
  mutateResident(residentId, (resident) => ({
    ...resident,
    tasks: [...resident.tasks, task],
  }));
}

export async function persistTaskCompleted(
  _uid: string,
  residentId: string,
  taskId: string,
  completed: boolean,
  wellnessHistory: WellnessDayPoint[]
): Promise<void> {
  mutateResident(residentId, (resident) => ({
    ...resident,
    tasks: resident.tasks.map((task) =>
      task.id === taskId ? { ...task, completed } : task
    ),
    wellnessHistory,
  }));
}

export async function persistHydration(
  _uid: string,
  residentId: string,
  hydrationGlasses: number,
  wellnessHistory: WellnessDayPoint[],
  hydrationTarget?: number
): Promise<void> {
  mutateResident(residentId, (resident) => ({
    ...resident,
    hydrationGlasses,
    wellnessHistory,
    ...(typeof hydrationTarget === "number" ? { hydrationTarget } : {}),
  }));
}

export async function persistHydrationTarget(
  _uid: string,
  residentId: string,
  hydrationTarget: number,
  wellnessHistory: WellnessDayPoint[]
): Promise<void> {
  mutateResident(residentId, (resident) => ({
    ...resident,
    hydrationTarget,
    wellnessHistory,
  }));
}

export async function persistWellnessHistory(
  _uid: string,
  residentId: string,
  wellnessHistory: WellnessDayPoint[]
): Promise<void> {
  mutateResident(residentId, (resident) => ({ ...resident, wellnessHistory }));
}

export async function persistAddNote(
  _uid: string,
  residentId: string,
  note: CareNote
): Promise<void> {
  mutateResident(residentId, (resident) => ({
    ...resident,
    notes: [note, ...resident.notes],
  }));
}

export async function persistAddSecurityLog(
  _uid: string,
  residentId: string,
  log: SecurityLogEntry
): Promise<void> {
  mutateResident(residentId, (resident) => ({
    ...resident,
    securityLogs: [log, ...resident.securityLogs],
  }));
}

export async function persistResolveSecurityLog(
  _uid: string,
  residentId: string,
  logId: string,
  resolvedBy: string
): Promise<void> {
  mutateResident(residentId, (resident) => ({
    ...resident,
    securityLogs: resident.securityLogs.map((log) =>
      log.id === logId ? { ...log, status: "Resolved", resolvedBy } : log
    ),
  }));
}

export async function persistStatusLevel(
  _uid: string,
  residentId: string,
  statusLevel: "Calm" | "Active" | "Resting"
): Promise<void> {
  mutateResident(residentId, (resident) => ({ ...resident, statusLevel }));
}

export async function persistAddVital(
  _uid: string,
  residentId: string,
  vital: VitalReading
): Promise<void> {
  mutateResident(residentId, (resident) => ({
    ...resident,
    vitals: [vital, ...resident.vitals].slice(0, 6),
  }));
}

export async function persistMedicalFlags(
  _uid: string,
  residentId: string,
  allergies: string[],
  conditions: string[]
): Promise<void> {
  mutateResident(residentId, (resident) => ({
    ...resident,
    allergies,
    conditions,
  }));
}

export async function persistToggleRefill(
  _uid: string,
  residentId: string,
  rxId: string,
  refillRequested: boolean
): Promise<void> {
  mutateResident(residentId, (resident) => ({
    ...resident,
    prescriptions: resident.prescriptions.map((rx) =>
      rx.id === rxId ? { ...rx, refillRequested } : rx
    ),
  }));
}

export async function persistAddPrescription(
  _uid: string,
  residentId: string,
  rx: PrescriptionItem
): Promise<void> {
  mutateResident(residentId, (resident) => ({
    ...resident,
    prescriptions: [...resident.prescriptions, rx],
  }));
}

export async function persistAddAppointment(
  _uid: string,
  residentId: string,
  apt: AppointmentItem
): Promise<void> {
  mutateResident(residentId, (resident) => ({
    ...resident,
    appointments: [...resident.appointments, apt],
  }));
}

export async function persistComfortPreferences(
  _uid: string,
  residentId: string,
  comfortPreferences: ComfortPreferences
): Promise<void> {
  mutateResident(residentId, (resident) => ({ ...resident, comfortPreferences }));
}

export async function persistCreateResident(
  _uid: string,
  resident: ResidentProfile
): Promise<void> {
  mutateState((state) => ({
    ...state,
    activeResidentId: resident.id,
    residents: [resident, ...state.residents.filter((r) => r.id !== resident.id)],
  }));
}

/** Caregiver display name for locally created notes and logs. */
export function caregiverDisplayName(user: FreebuffUser | null): string {
  if (!user) return "Caregiver";
  return (
    user.displayName?.split(" ")[0] ||
    deriveDisplayName(user.email || "") ||
    "Caregiver"
  );
}
