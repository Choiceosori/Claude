"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useTeacherSession } from "@/lib/useTeacherSession";
import TeacherHeader from "@/components/TeacherHeader";
import VideoPlayerWithFeedback, { FeedbackItem } from "@/components/VideoPlayerWithFeedback";

type SubmissionStatus = "SUBMITTED" | "PASSED" | "NEEDS_PRACTICE";

type SubmissionDetail = {
  id: string;
  status: SubmissionStatus;
  score: number | null;
  assignment: { id: string; title: string; instrument: string };
  student: { grade: number; classNo: number; number: number; name: string };
  feedbacks: FeedbackItem[];
};

const STATUS_OPTIONS: { value: SubmissionStatus; label: string; style: string }[] = [
  { value: "SUBMITTED", label: "대기중", style: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200" },
  { value: "PASSED", label: "통과", style: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" },
  { value: "NEEDS_PRACTICE", label: "연습 필요", style: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300" },
];

export default function TeacherSubmissionReviewPage() {
  const params = useParams<{ id: string }>();
  const session = useTeacherSession();
  const router = useRouter();
  const [submission, setSubmission] = useState<SubmissionDetail | null>(null);
  const [scoreInput, setScoreInput] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (session === null) router.push("/teacher/login");
  }, [session, router]);

  function load() {
    fetch(`/api/submissions/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        setSubmission(data);
        setScoreInput(data.score ?? "");
      });
  }

  useEffect(() => {
    if (session) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, params.id]);

  async function updateStatus(status: SubmissionStatus) {
    setSaving(true);
    try {
      await fetch(`/api/submissions/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      load();
    } finally {
      setSaving(false);
    }
  }

  async function saveScore() {
    setSaving(true);
    try {
      await fetch(`/api/submissions/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score: scoreInput === "" ? null : Number(scoreInput) }),
      });
      load();
    } finally {
      setSaving(false);
    }
  }

  async function addFeedback(timestampSec: number, comment: string) {
    await fetch(`/api/submissions/${params.id}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ timestampSec, comment }),
    });
    load();
  }

  async function deleteFeedback(feedbackId: string) {
    await fetch(`/api/submissions/${params.id}/feedback?feedbackId=${feedbackId}`, { method: "DELETE" });
    load();
  }

  if (session === undefined || !submission) return <div className="p-8 text-center text-zinc-400">불러오는 중...</div>;
  if (!session) return null;

  return (
    <div>
      <TeacherHeader session={session} />
      <div className="mx-auto max-w-4xl px-4 py-6">
        <Link
          href={`/teacher/assignments/${submission.assignment.id}`}
          className="mb-4 inline-block text-sm text-zinc-400 hover:text-zinc-600"
        >
          ← 제출물 목록으로
        </Link>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
              {submission.assignment.title} ({submission.assignment.instrument})
            </h1>
            <p className="text-sm text-zinc-500">
              {submission.student.grade}학년 {submission.student.classNo}반 {submission.student.number}번{" "}
              {submission.student.name}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              max={100}
              value={scoreInput}
              onChange={(e) => setScoreInput(e.target.value)}
              placeholder="점수"
              className="w-20 rounded-md border border-zinc-300 p-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
            <button
              onClick={saveScore}
              disabled={saving}
              className="rounded-full border border-zinc-300 px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              점수 저장
            </button>
          </div>
        </div>

        <div className="mb-4 flex gap-2">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => updateStatus(opt.value)}
              disabled={saving}
              className={`rounded-full px-4 py-1.5 text-sm font-medium disabled:opacity-50 ${
                submission.status === opt.value ? opt.style : "bg-transparent text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <VideoPlayerWithFeedback
          videoSrc={`/api/media/submissions/${submission.id}`}
          feedbacks={submission.feedbacks}
          onAddFeedback={addFeedback}
          onDeleteFeedback={deleteFeedback}
        />
      </div>
    </div>
  );
}
