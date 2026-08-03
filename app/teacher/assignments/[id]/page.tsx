"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useTeacherSession } from "@/lib/useTeacherSession";
import TeacherHeader from "@/components/TeacherHeader";

type Assignment = {
  id: string;
  title: string;
  instrument: string;
  targetGrade: number;
  description: string;
  dueDate: string | null;
  sheetMusicUrl: string | null;
};

type SubmissionRow = {
  id: string;
  status: "SUBMITTED" | "PASSED" | "NEEDS_PRACTICE";
  score: number | null;
  submittedAt: string;
  student: { grade: number; classNo: number; number: number; name: string };
};

const STATUS_LABEL: Record<SubmissionRow["status"], string> = {
  SUBMITTED: "채점 대기중",
  PASSED: "통과",
  NEEDS_PRACTICE: "연습 필요",
};

export default function AssignmentDetailPage() {
  const params = useParams<{ id: string }>();
  const session = useTeacherSession();
  const router = useRouter();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session === null) router.push("/teacher/login");
  }, [session, router]);

  useEffect(() => {
    if (!session) return;
    Promise.all([
      fetch(`/api/assignments/${params.id}`).then((r) => r.json()),
      fetch(`/api/submissions?assignmentId=${params.id}`).then((r) => r.json()),
    ])
      .then(([a, s]) => {
        setAssignment(a);
        setSubmissions(s);
      })
      .finally(() => setLoading(false));
  }, [session, params.id]);

  async function handleDelete() {
    if (!confirm("이 과제를 삭제할까요? 제출된 영상도 함께 삭제됩니다.")) return;
    await fetch(`/api/assignments/${params.id}`, { method: "DELETE" });
    router.push("/teacher");
  }

  if (session === undefined || loading) return <div className="p-8 text-center text-zinc-400">불러오는 중...</div>;
  if (!session) return null;
  if (!assignment) return <div className="p-8 text-center text-red-600">과제를 찾을 수 없어요.</div>;

  return (
    <div>
      <TeacherHeader session={session} />
      <div className="mx-auto max-w-3xl px-4 py-6">
        <Link href="/teacher" className="mb-4 inline-block text-sm text-zinc-400 hover:text-zinc-600">
          ← 과제 목록으로
        </Link>
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">{assignment.title}</h1>
            <p className="text-sm text-zinc-500">
              {assignment.instrument} · {assignment.targetGrade}학년
              {assignment.dueDate ? ` · 기한 ${new Date(assignment.dueDate).toLocaleDateString("ko-KR")}` : ""}
            </p>
            {assignment.description && (
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">{assignment.description}</p>
            )}
            {!assignment.sheetMusicUrl && (
              <p className="mt-2 text-xs text-amber-600">악보가 등록되지 않았어요.</p>
            )}
          </div>
          <button
            onClick={handleDelete}
            className="shrink-0 rounded-full border border-red-200 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/30"
          >
            과제 삭제
          </button>
        </div>

        <h2 className="mb-3 text-lg font-semibold text-zinc-800 dark:text-zinc-100">제출물 ({submissions.length}건)</h2>
        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
              <tr>
                <th className="px-3 py-2">학생</th>
                <th className="px-3 py-2">상태</th>
                <th className="px-3 py-2">점수</th>
                <th className="px-3 py-2">제출일</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {submissions.map((s) => (
                <tr key={s.id} className="border-t border-zinc-100 dark:border-zinc-800">
                  <td className="px-3 py-2">
                    {s.student.grade}-{s.student.classNo}-{s.student.number} {s.student.name}
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
              {submissions.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-4 text-center text-zinc-400">
                    아직 제출된 영상이 없어요.
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
