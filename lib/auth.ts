import { setSessionCookie, clearSessionCookie, readSessionCookie } from "./session";

const SESSION_COOKIE = "musicrecord_teacher_session";

export type TeacherRole = "ADMIN" | "TEACHER";

export type TeacherSession = {
  teacherId: string;
  username: string;
  name: string;
  role: TeacherRole;
};

export async function createTeacherSession(session: TeacherSession) {
  await setSessionCookie(SESSION_COOKIE, session);
}

export async function destroyTeacherSession() {
  await clearSessionCookie(SESSION_COOKIE);
}

export async function getTeacherSession(): Promise<TeacherSession | null> {
  const payload = await readSessionCookie(SESSION_COOKIE);
  if (
    typeof payload?.teacherId === "string" &&
    typeof payload?.username === "string" &&
    typeof payload?.name === "string" &&
    (payload?.role === "ADMIN" || payload?.role === "TEACHER")
  ) {
    return {
      teacherId: payload.teacherId,
      username: payload.username,
      name: payload.name,
      role: payload.role,
    };
  }
  return null;
}

export async function requireTeacherSession(): Promise<TeacherSession> {
  const session = await getTeacherSession();
  if (!session) {
    throw new AuthError("교사 로그인이 필요합니다.");
  }
  return session;
}

export class AuthError extends Error {}
