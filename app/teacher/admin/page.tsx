"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTeacherSession } from "@/lib/useTeacherSession";
import TeacherHeader from "@/components/TeacherHeader";

type TeacherRow = {
  id: string;
  username: string;
  name: string;
  role: "ADMIN" | "TEACHER";
  createdAt: string;
};

export default function AdminPage() {
  const session = useTeacherSession();
  const router = useRouter();
  const [teachers, setTeachers] = useState<TeacherRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const loadTeachers = useCallback(() => {
    fetch("/api/admin/teachers")
      .then((r) => r.json())
      .then(setTeachers)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (session === null) router.push("/teacher/login");
    else if (session && session.role !== "ADMIN") router.push("/teacher");
  }, [session, router]);

  useEffect(() => {
    if (session?.role === "ADMIN") loadTeachers();
  }, [session, loadTeachers]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/admin/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "계정 생성에 실패했어요.");
        return;
      }
      setUsername("");
      setPassword("");
      setName("");
      loadTeachers();
    } catch {
      setError("네트워크 오류가 발생했어요.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, teacherName: string) {
    if (!confirm(`${teacherName} 계정을 삭제할까요?`)) return;
    const res = await fetch(`/api/admin/teachers/${id}`, { method: "DELETE" });
    if (res.ok) loadTeachers();
  }

  if (session === undefined || !session || session.role !== "ADMIN") {
    return <div className="p-8 text-center text-zinc-400">불러오는 중...</div>;
  }

  return (
    <div>
      <TeacherHeader session={session} />
      <div className="mx-auto max-w-2xl px-4 py-6">
        <Link href="/teacher" className="mb-4 inline-block text-sm text-zinc-400 hover:text-zinc-600">
          ← 대시보드로
        </Link>
        <h1 className="mb-1 text-xl font-bold text-zinc-900 dark:text-zinc-50">계정 관리</h1>
        <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
          전체 관리자 계정은 하나만 존재하며, 교사 계정은 이 페이지에서 관리자만 생성·삭제할 수 있어요.
        </p>

        <form
          onSubmit={handleCreate}
          className="mb-8 flex flex-col gap-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
        >
          <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">새 교사 계정 만들기</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="flex flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-300">
              아이디
              <input
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="rounded-md border border-zinc-300 p-2 dark:border-zinc-700 dark:bg-zinc-900"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-300">
              비밀번호 (8자 이상)
              <input
                required
                type="password"
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-md border border-zinc-300 p-2 dark:border-zinc-700 dark:bg-zinc-900"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-300">
              이름
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-md border border-zinc-300 p-2 dark:border-zinc-700 dark:bg-zinc-900"
              />
            </label>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="self-start rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {saving ? "생성 중..." : "계정 만들기"}
          </button>
        </form>

        <h2 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-200">전체 계정</h2>
        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
              <tr>
                <th className="px-3 py-2">아이디</th>
                <th className="px-3 py-2">이름</th>
                <th className="px-3 py-2">권한</th>
                <th className="px-3 py-2">생성일</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {teachers.map((t) => (
                <tr key={t.id} className="border-t border-zinc-100 dark:border-zinc-800">
                  <td className="px-3 py-2">{t.username}</td>
                  <td className="px-3 py-2">{t.name}</td>
                  <td className="px-3 py-2">
                    {t.role === "ADMIN" ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                        전체 관리자
                      </span>
                    ) : (
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                        교사
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2">{new Date(t.createdAt).toLocaleDateString("ko-KR")}</td>
                  <td className="px-3 py-2">
                    {t.role !== "ADMIN" && (
                      <button
                        onClick={() => handleDelete(t.id, t.name)}
                        className="text-xs text-zinc-400 hover:text-red-500"
                      >
                        삭제
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {teachers.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="px-3 py-4 text-center text-zinc-400">
                    계정이 없어요.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
