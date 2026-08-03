"use client";

import { useCallback, useEffect, useState } from "react";

export type StudentSessionInfo = {
  studentId: string;
  grade: number;
  classNo: number;
  number: number;
  name: string;
};

/** undefined = still checking, null = not identified yet */
export function useStudentSession() {
  const [session, setSession] = useState<StudentSessionInfo | null | undefined>(undefined);

  const refresh = useCallback(() => {
    fetch("/api/students/me")
      .then(async (res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        setSession({
          studentId: data.studentId,
          grade: data.grade,
          classNo: data.classNo,
          number: data.number,
          name: data.name,
        });
      })
      .catch(() => setSession(null));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { session, refresh };
}
