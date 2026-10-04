const STORAGE_KEY = "preppilot_student_id";

export function getStoredStudentId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch (e) {
    console.error("Error reading localStorage:", e);
    return null;
  }
}

export function setStoredStudentId(id: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch (e) {
    console.error("Error writing to localStorage:", e);
  }
}

export function clearStoredStudentId(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error("Error removing from localStorage:", e);
  }
}
