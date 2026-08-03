export type StudentIdentity = {
  id: string;
  grade: number;
  classNo: number;
  number: number;
  name: string;
};

const STORAGE_KEY = "musicrecord_student";

export function loadStudentIdentity(): StudentIdentity | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      typeof parsed?.id === "string" &&
      typeof parsed?.grade === "number" &&
      typeof parsed?.classNo === "number" &&
      typeof parsed?.number === "number" &&
      typeof parsed?.name === "string"
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveStudentIdentity(identity: StudentIdentity) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
}

export function clearStudentIdentity() {
  window.localStorage.removeItem(STORAGE_KEY);
}
