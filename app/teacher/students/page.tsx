"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTeacherSession } from "@/lib/useTeacherSession";
import TeacherHeader from "@/components/TeacherHeader";
import { BADGE_EMOJI, BadgeTier } from "@/lib/badges";

type StudentRow = {
  id: string;
  grade: number;
  classNo: number;
  number: number;
  name: string;
  passedSongs: number;
  badgeTier: BadgeTier;
  submissionCount: number;
};

export default function StudentManagementPage() {
  const session = useTeacherSession();
  const router = useRouter();
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [grade, setGrade] = useState("");
  const [classNo, setClassNo] = useState("");
  const [number, setNumber] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const loadStudents = useCallback(() => {
    fetch("/api/students")
      .then((r) => r.json())
      .then(setStudents)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (session === null) router.push("/teacher/login");
  }, [session, router]);

  useEffect(() => {
    if (session) loadStudents();
  }, [session, loadStudents]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grade: Number(grade), classNo: Number(classNo), number: Number(number), name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "학생 추가에 실패했어요.");
        return;
      }
      setGrade("");
      setClassNo("");
      setNumber("");
      setName("");
      loadStudents();
    } catch {
      setError("네트워크 오류가 발생했어요.");
    } finally {
      setSaving(false);
    }
  }

  if (session === undefined) return <div className="p-8 text-center text-zinc-400">불러오는 중...</div>;
  if (!session) return null;

  return (
    <div>
      <TeacherHeader session={session} />
      <div className="mx-auto max-w-2xl px-4 py-6">
        <Link href="/teacher" className="mb-4 inline-block text-sm text-zinc-400 hover:text-zinc-600">
          ← 대시보드로
        </Link>
        <h1 className="mb-1 text-xl font-bold text-zinc-900 dark:text-zinc-50">학생 관리</h1>
        <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
          학생은 보통 본인이 직접 학년/반/번호/이름을 입력해 등록되지만, 여기서 미리 추가하거나
          정보를 수정·삭제할 수도 있어요.
        </p>

        <form
          onSubmit={handleAdd}
          className="mb-8 flex flex-col gap-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
        >
          <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">학생 추가</h2>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            <label className="flex flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-300">
              학년
              <input
                required
                type="number"
                min={1}
                max={6}
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="rounded-md border border-zinc-300 p-2 dark:border-zinc-700 dark:bg-zinc-900"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-300">
              반
              <input
                required
                type="number"
                min={1}
                value={classNo}
                onChange={(e) => setClassNo(e.target.value)}
                className="rounded-md border border-zinc-300 p-2 dark:border-zinc-700 dark:bg-zinc-900"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-300">
              번호
              <input
                required
                type="number"
                min={1}
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                className="rounded-md border border-zinc-300 p-2 dark:border-zinc-700 dark:bg-zinc-900"
              />
            </label>
            <label className="col-span-3 flex flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-300 sm:col-span-1">
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
            {saving ? "추가 중..." : "학생 추가"}
          </button>
        </form>

        <h2 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-200">전체 학생 ({students.length}명)</h2>
        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
              <tr>
                <th className="px-3 py-2">학년/반/번호</th>
                <th className="px-3 py-2">이름</th>
                <th className="px-3 py-2">통과곡</th>
                <th className="px-3 py-2">배지</th>
                <th className="px-3 py-2">제출 횟수</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id} className="border-t border-zinc-100 dark:border-zinc-800">
                  <td className="px-3 py-2">
                    <Link href={`/teacher/students/${s.id}`} className="text-emerald-600 hover:underline">
                      {s.grade}-{s.classNo}-{s.number}
                    </Link>
                  </td>
                  <td className="px-3 py-2">
                    <Link href={`/teacher/students/${s.id}`} className="hover:underline">
                      {s.name}
                    </Link>
                  </td>
                  <td className="px-3 py-2">{s.passedSongs}곡</td>
                  <td className="px-3 py-2">{BADGE_EMOJI[s.badgeTier]}</td>
                  <td className="px-3 py-2">{s.submissionCount}</td>
                </tr>
              ))}
              {students.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="px-3 py-4 text-center text-zinc-400">
                    등록된 학생이 없어요.
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
