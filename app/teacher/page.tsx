"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTeacherSession } from "@/lib/useTeacherSession";
import TeacherHeader from "@/components/TeacherHeader";
import { BADGE_EMOJI, BadgeTier } from "@/lib/badges";

type Assignment = {
  id: string;
  title: string;
  instrument: string;
  targetGrade: number;
  dueDate: string | null;
  _count: { submissions: number };
};

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

export default function TeacherDashboardPage() {
  const session = useTeacherSession();
  const router = useRouter();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session === null) router.push("/teacher/login");
  }, [session, router]);

  useEffect(() => {
    if (!session) return;
    Promise.all([
      fetch("/api/assignments").then((r) => r.json()),
      fetch("/api/students").then((r) => r.json()),
    ])
      .then(([a, s]) => {
        setAssignments(a);
        setStudents(s);
      })
      .finally(() => setLoading(false));
  }, [session]);

  if (session === undefined) return <div className="p-8 text-center text-zinc-400">불러오는 중...</div>;
  if (!session) return null;

  const totalStudents = students.length;
  const submittedStudents = students.filter((s) => s.submissionCount > 0).length;

  return (
    <div>
      <TeacherHeader session={session} />
      <div className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-6">
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-zinc-200 p-4 text-center dark:border-zinc-800">
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{assignments.length}</p>
            <p className="text-xs text-zinc-500">등록된 과제</p>
          </div>
          <div className="rounded-xl border border-zinc-200 p-4 text-center dark:border-zinc-800">
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{totalStudents}</p>
            <p className="text-xs text-zinc-500">참여 학생</p>
          </div>
          <div className="rounded-xl border border-zinc-200 p-4 text-center dark:border-zinc-800">
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {totalStudents ? Math.round((submittedStudents / totalStudents) * 100) : 0}%
            </p>
            <p className="text-xs text-zinc-500">제출률</p>
          </div>
        </div>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">과제 목록</h2>
            <Link
              href="/teacher/assignments/new"
              className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              + 새 과제 만들기
            </Link>
          </div>
          {loading && <p className="text-sm text-zinc-400">불러오는 중...</p>}
          <ul className="flex flex-col gap-2">
            {assignments.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/teacher/assignments/${a.id}`}
                  className="flex items-center justify-between rounded-xl border border-zinc-200 p-4 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
                >
                  <div>
                    <p className="font-semibold text-zinc-800 dark:text-zinc-100">{a.title}</p>
                    <p className="text-sm text-zinc-500">
                      {a.instrument} · {a.targetGrade}학년
                      {a.dueDate ? ` · 기한 ${new Date(a.dueDate).toLocaleDateString("ko-KR")}` : ""}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-zinc-500">제출 {a._count.submissions}건</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-zinc-800 dark:text-zinc-100">학생별 성취 현황</h2>
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
                      {s.grade}-{s.classNo}-{s.number}
                    </td>
                    <td className="px-3 py-2">{s.name}</td>
                    <td className="px-3 py-2">{s.passedSongs}곡</td>
                    <td className="px-3 py-2">{BADGE_EMOJI[s.badgeTier]}</td>
                    <td className="px-3 py-2">{s.submissionCount}</td>
                  </tr>
                ))}
                {students.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="px-3 py-4 text-center text-zinc-400">
                      아직 참여한 학생이 없어요.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
