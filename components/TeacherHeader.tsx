"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { TeacherSessionInfo } from "@/lib/useTeacherSession";

export default function TeacherHeader({ session }: { session: TeacherSessionInfo }) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/teacher/logout", { method: "POST" });
    router.push("/teacher/login");
  }

  return (
    <header className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
      <Link href="/teacher" className="font-bold text-zinc-800 dark:text-zinc-100">
        🎵 MusicRecord 교사용
      </Link>
      <div className="flex items-center gap-3 text-sm">
        <Link
          href="/teacher/students"
          className="rounded-full border border-zinc-300 px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          학생 관리
        </Link>
        {session.role === "ADMIN" && (
          <Link
            href="/teacher/admin"
            className="rounded-full border border-zinc-300 px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            계정 관리
          </Link>
        )}
        <span className="text-zinc-500 dark:text-zinc-400">{session.name} 선생님</span>
        <button
          onClick={handleLogout}
          className="rounded-full border border-zinc-300 px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          로그아웃
        </button>
      </div>
    </header>
  );
}
