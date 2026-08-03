import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SESSION_COOKIE = "musicrecord_teacher_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 14; // 14 days

function getSecretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET is not set");
  }
  return new TextEncoder().encode(secret);
}

export type TeacherSession = {
  teacherId: string;
  username: string;
  name: string;
};

export async function createTeacherSession(session: TeacherSession) {
  const token = await new SignJWT(session)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSecretKey());

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function destroyTeacherSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getTeacherSession(): Promise<TeacherSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (
      typeof payload.teacherId === "string" &&
      typeof payload.username === "string" &&
      typeof payload.name === "string"
    ) {
      return {
        teacherId: payload.teacherId,
        username: payload.username,
        name: payload.name,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function requireTeacherSession(): Promise<TeacherSession> {
  const session = await getTeacherSession();
  if (!session) {
    throw new AuthError("교사 로그인이 필요합니다.");
  }
  return session;
}

export class AuthError extends Error {}
