"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useStudentSession } from "@/lib/useStudentSession";
import StudentIdentityForm from "@/components/StudentIdentityForm";
import BadgeDisplay from "@/components/BadgeDisplay";

type Assignment = {
  id: string;
  title: string;
  instrument: string;
  targetGrade: number;
  description: string;
  dueDate: string | null;
};

type SubmissionSummary = {
  id: string;
  assignmentId: string;
  status: "SUBMITTED" | "PASSED" | "NEEDS_PRACTICE";
  score: number | null;
  submittedAt: string;
};

type StudentDetail = {
  passedSongs: number;
  submissions: SubmissionSummary[];
};

const STATUS_LABEL: Record<SubmissionSummary["status"], string> = {
  SUBMITTED: "채점 대기중",
  PASSED: "통과",
  NEEDS_PRACTICE: "연습이 더 필요해요",
};

const STATUS_STYLE: Record<SubmissionSummary["status"], string> = {
  SUBMITTED: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
  PASSED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  NEEDS_PRACTICE: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
};

export default function StudentDashboardPage() {
  const { session, refresh } = useStudentSession();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [detail, setDetail] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(false);

  const loadDashboard = useCallback(async (grade: number, studentId: string) => {
    setLoading(true);
    try {
      const [assignmentsRes, detailRes] = await Promise.all([
        fetch(`/api/assignments?grade=${grade}`),
        fetch(`/api/students/${studentId}`),
      ]);
      const [assignmentsData, detailData] = await Promise.all([assignmentsRes.json(), detailRes.json()]);
      setAssignments(assignmentsData);
      setDetail(detailData);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- kicks off an async fetch; state updates happen after it resolves
    if (session) loadDashboard(session.grade, session.studentId);
  }, [session, loadDashboard]);

  async function handleChangeIdentity() {
    await fetch("/api/students/logout", { method: "POST" });
    setAssignments([]);
    setDetail(null);
    refresh();
  }

  if (session === undefined) {
    return <div className="p-8 text-center text-zinc-400">불러오는 중...</div>;
  }

  if (!session) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <StudentIdentityForm onIdentified={refresh} />
      </div>
    );
  }

  const latestSubmissionByAssignment = new Map<string, SubmissionSummary>();
  for (const s of detail?.submissions ?? []) {
    const existing = latestSubmissionByAssignment.get(s.assignmentId);
    if (!existing || new Date(s.submittedAt) > new Date(existing.submittedAt)) {
      latestSubmissionByAssignment.set(s.assignmentId, s);
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {session.grade}학년 {session.classNo}반 {session.number}번
          </p>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{session.name}님, 안녕하세요!</h1>
        </div>
        <button
          onClick={handleChangeIdentity}
          className="rounded-full border border-zinc-300 px-3 py-1.5 text-xs text-zinc-500 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          정보 변경
        </button>
      </div>

      {detail && <BadgeDisplay passedSongs={detail.passedSongs} />}

      <div>
        <h2 className="mb-3 text-lg font-semibold text-zinc-800 dark:text-zinc-100">1인 1악기 과제곡</h2>
        {loading && <p className="text-sm text-zinc-400">불러오는 중...</p>}
        {!loading && assignments.length === 0 && (
          <p className="text-sm text-zinc-400">아직 등록된 과제가 없어요.</p>
        )}
        <ul className="flex flex-col gap-3">
          {assignments.map((a) => {
            const submission = latestSubmissionByAssignment.get(a.id);
            return (
              <li
                key={a.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
              >
                <div>
                  <p className="font-semibold text-zinc-800 dark:text-zinc-100">{a.title}</p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">{a.instrument}</p>
                  {submission && (
                    <span
                      className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[submission.status]}`}
                    >
                      {STATUS_LABEL[submission.status]}
                      {submission.score !== null ? ` · ${submission.score}점` : ""}
                    </span>
                  )}
                </div>
                <div className="flex shrink-0 flex-col gap-2">
                  {submission && (
                    <Link
                      href={`/student/submissions/${submission.id}`}
                      className="rounded-full border border-zinc-300 px-3 py-1.5 text-center text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                    >
                      다시보기
                    </Link>
                  )}
                  <Link
                    href={`/student/assignments/${a.id}/record`}
                    className="rounded-full bg-emerald-600 px-3 py-1.5 text-center text-xs font-semibold text-white hover:bg-emerald-700"
                  >
                    {submission ? "다시 촬영" : "촬영하기"}
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
