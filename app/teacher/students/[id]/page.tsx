"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useTeacherSession } from "@/lib/useTeacherSession";
import TeacherHeader from "@/components/TeacherHeader";
import { BADGE_EMOJI, BadgeTier } from "@/lib/badges";

type SubmissionRow = {
  id: string;
  status: "SUBMITTED" | "PASSED" | "NEEDS_PRACTICE";
  score: number | null;
  submittedAt: string;
  assignment: { title: string; instrument: string };
};

type StudentDetail = {
  id: string;
  grade: number;
  classNo: number;
  number: number;
  name: string;
  passedSongs: number;
  badgeTier: BadgeTier;
  submissions: SubmissionRow[];
};

const STATUS_LABEL: Record<SubmissionRow["status"], string> = {
  SUBMITTED: "채점 대기중",
  PASSED: "통과",
  NEEDS_PRACTICE: "연습 필요",
};

export default function StudentDetailPage() {
  const params = useParams<{ id: string }>();
  const session = useTeacherSession();
  const router = useRouter();
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [notFound, setNotFound] = useState(false);

  const [grade, setGrade] = useState("");
  const [classNo, setClassNo] = useState("");
  const [number, setNumber] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(() => {
    fetch(`/api/students/${params.id}`)
      .then(async (res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data: StudentDetail) => {
        setStudent(data);
        setGrade(String(data.grade));
        setClassNo(String(data.classNo));
        setNumber(String(data.number));
        setName(data.name);
      })
      .catch(() => setNotFound(true));
  }, [params.id]);

  useEffect(() => {
    if (session === null) router.push("/teacher/login");
  }, [session, router]);

  useEffect(() => {
    if (session) load();
  }, [session, load]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaved(false);
    setSaving(true);
    try {
      const res = await fetch(`/api/students/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grade: Number(grade), classNo: Number(classNo), number: Number(number), name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "저장에 실패했어요.");
        return;
      }
      setSaved(true);
      load();
    } catch {
      setError("네트워크 오류가 발생했어요.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!student) return;
    if (!confirm(`${student.name} 학생을 삭제할까요? 제출한 영상과 피드백도 함께 삭제됩니다.`)) return;
    await fetch(`/api/students/${params.id}`, { method: "DELETE" });
    router.push("/teacher/students");
  }

  if (session === undefined) return <div className="p-8 text-center text-zinc-400">불러오는 중...</div>;
  if (!session) return null;
  if (notFound) return <div className="p-8 text-center text-red-600">학생을 찾을 수 없어요.</div>;
  if (!student) return <div className="p-8 text-center text-zinc-400">불러오는 중...</div>;

  return (
    <div>
      <TeacherHeader session={session} />
      <div className="mx-auto max-w-2xl px-4 py-6">
        <Link href="/teacher/students" className="mb-4 inline-block text-sm text-zinc-400 hover:text-zinc-600">
          ← 학생 관리로
        </Link>

        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">{student.name}</h1>
            <p className="text-sm text-zinc-500">
              {student.grade}학년 {student.classNo}반 {student.number}번 · {student.passedSongs}곡 통과{" "}
              {BADGE_EMOJI[student.badgeTier]}
            </p>
          </div>
          <button
            onClick={handleDelete}
            className="shrink-0 rounded-full border border-red-200 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/30"
          >
            학생 삭제
          </button>
        </div>

        <form
          onSubmit={handleSave}
          className="mb-8 flex flex-col gap-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
        >
          <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">정보 수정</h2>
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
          {saved && !error && <p className="text-sm text-emerald-600">저장했어요.</p>}
          <button
            type="submit"
            disabled={saving}
            className="self-start rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {saving ? "저장 중..." : "저장하기"}
          </button>
        </form>

        <h2 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-200">
          제출 기록 ({student.submissions.length}건)
        </h2>
        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
              <tr>
                <th className="px-3 py-2">과제곡</th>
                <th className="px-3 py-2">상태</th>
                <th className="px-3 py-2">점수</th>
                <th className="px-3 py-2">제출일</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {student.submissions.map((s) => (
                <tr key={s.id} className="border-t border-zinc-100 dark:border-zinc-800">
                  <td className="px-3 py-2">
                    {s.assignment.title} <span className="text-zinc-400">({s.assignment.instrument})</span>
                  </td>
                  <td className="px-3 py-2">{STATUS_LABEL[s.status]}</td>
                  <td className="px-3 py-2">{s.score ?? "-"}</td>
                  <td className="px-3 py-2">{new Date(s.submittedAt).toLocaleString("ko-KR")}</td>
                  <td className="px-3 py-2">
                    <Link href={`/teacher/submissions/${s.id}`} className="text-emerald-600 underline">
                      평가하기
                    </Link>
                  </td>
                </tr>
              ))}
              {student.submissions.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-4 text-center text-zinc-400">
                    아직 제출한 영상이 없어요.
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
