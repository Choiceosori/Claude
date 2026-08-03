"use client";

import { useEffect, useState } from "react";

export type TeacherSessionInfo = { username: string; name: string };

/** undefined = still checking, null = not logged in */
export function useTeacherSession() {
  const [session, setSession] = useState<TeacherSessionInfo | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/teacher/me")
      .then(async (res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setSession({ username: data.username, name: data.name });
      })
      .catch(() => {
        if (!cancelled) setSession(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return session;
}
