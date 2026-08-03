import { setSessionCookie, clearSessionCookie, readSessionCookie } from "./session";

const SESSION_COOKIE = "musicrecord_student_session";

export type StudentSession = {
  studentId: string;
  grade: number;
  classNo: number;
  number: number;
  name: string;
};

/** No password — identifying by grade/class/number/name is enough to bind this browser to the DB record. */
export async function createStudentSession(session: StudentSession) {
  await setSessionCookie(SESSION_COOKIE, session);
}

export async function destroyStudentSession() {
  await clearSessionCookie(SESSION_COOKIE);
}

export async function getStudentSession(): Promise<StudentSession | null> {
  const payload = await readSessionCookie(SESSION_COOKIE);
  if (
    typeof payload?.studentId === "string" &&
    typeof payload?.grade === "number" &&
    typeof payload?.classNo === "number" &&
    typeof payload?.number === "number" &&
    typeof payload?.name === "string"
  ) {
    return {
      studentId: payload.studentId,
      grade: payload.grade,
      classNo: payload.classNo,
      number: payload.number,
      name: payload.name,
    };
  }
  return null;
}
