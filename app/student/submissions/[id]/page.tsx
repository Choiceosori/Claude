"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useStudentSession } from "@/lib/useStudentSession";
import VideoPlayerWithFeedback from "@/components/VideoPlayerWithFeedback";

type SubmissionDetail = {
  id: string;
  status: "SUBMITTED" | "PASSED" | "NEEDS_PRACTICE";
  score: number | null;
  assignment: { title: string; instrument: string };
  feedbacks: { id: string; timestampSec: number; comment: string }[];
};

const STATUS_LABEL: Record<SubmissionDetail["status"], string> = {
  SUBMITTED: "채점 대기중이에요",
  PASSED: "통과했어요! 🎉",
  NEEDS_PRACTICE: "조금 더 연습이 필요해요",
};

export default function StudentSubmissionPage() {
  const params = useParams<{ id: string }>();
  const { session } = useStudentSession();
  const [submission, setSubmission] = useState<SubmissionDetail | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!session) return;

    fetch(`/api/submissions/${params.id}`)
      .then(async (res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(setSubmission)
      .catch(() => setError("제출물을 불러오지 못했어요."));
  }, [session, params.id]);

  if (session === undefined) return <div className="p-8 text-center text-zinc-400">불러오는 중...</div>;
  if (!session) {
    return (
      <div className="p-8 text-center">
        <Link href="/student" className="text-emerald-600 underline">
          내 정보 입력하러 가기
        </Link>
      </div>
    );
  }
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;
  if (!submission) return <div className="p-8 text-center text-zinc-400">불러오는 중...</div>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <Link href="/student" className="mb-4 inline-block text-sm text-zinc-400 hover:text-zinc-600">
        ← 과제 목록으로
      </Link>
      <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
        {submission.assignment.title} <span className="text-base font-normal text-zinc-400">({submission.assignment.instrument})</span>
      </h1>
      <p className="mb-4 mt-1 text-sm font-medium text-zinc-600 dark:text-zinc-300">
        {STATUS_LABEL[submission.status]}
        {submission.score !== null ? ` · ${submission.score}점` : ""}
      </p>
      <VideoPlayerWithFeedback
        videoSrc={`/api/media/submissions/${submission.id}`}
        feedbacks={submission.feedbacks}
        onAddFeedback={() => {}}
        readOnly
      />
    </div>
  );
}
