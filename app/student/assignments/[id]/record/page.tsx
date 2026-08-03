"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { loadStudentIdentity, StudentIdentity } from "@/lib/studentIdentity";
import { getInstrumentGuide } from "@/lib/instrumentGuides";
import CameraRecorder from "@/components/CameraRecorder";

type Assignment = {
  id: string;
  title: string;
  instrument: string;
  guideType: string;
  description: string;
  sheetMusicUrl: string | null;
};

export default function RecordPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [identity, setIdentity] = useState<StudentIdentity | null | undefined>(undefined);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loadError, setLoadError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    const stored = loadStudentIdentity();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage is only available client-side
    setIdentity(stored);
    if (!stored) return;

    fetch(`/api/assignments/${params.id}`)
      .then(async (res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(setAssignment)
      .catch(() => setLoadError("과제를 불러오지 못했어요."));
  }, [params.id]);

  async function handleSubmit(blob: Blob, mimeType: string) {
    if (!identity || !assignment) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const formData = new FormData();
      formData.append("studentId", identity.id);
      formData.append("assignmentId", assignment.id);
      const ext = mimeType.includes("mp4") ? "mp4" : "webm";
      formData.append("video", blob, `recording.${ext}`);

      const res = await fetch("/api/submissions", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error ?? "제출에 실패했어요. 다시 시도해 주세요.");
        return;
      }
      router.push(`/student/submissions/${data.id}`);
    } catch {
      setSubmitError("네트워크 오류로 제출에 실패했어요.");
    } finally {
      setSubmitting(false);
    }
  }

  if (identity === undefined) {
    return <div className="p-8 text-center text-zinc-400">불러오는 중...</div>;
  }

  if (!identity) {
    return (
      <div className="p-8 text-center">
        <p className="mb-4 text-zinc-600 dark:text-zinc-300">먼저 내 정보를 입력해 주세요.</p>
        <Link href="/student" className="text-emerald-600 underline">
          내 정보 입력하러 가기
        </Link>
      </div>
    );
  }

  if (loadError) {
    return <div className="p-8 text-center text-red-600">{loadError}</div>;
  }

  if (!assignment) {
    return <div className="p-8 text-center text-zinc-400">과제를 불러오는 중...</div>;
  }

  const guide = getInstrumentGuide(assignment.guideType);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <Link href="/student" className="mb-4 inline-block text-sm text-zinc-400 hover:text-zinc-600">
        ← 과제 목록으로
      </Link>
      <CameraRecorder
        guide={guide}
        assignmentId={assignment.id}
        assignmentTitle={assignment.title}
        instrument={assignment.instrument}
        sheetMusicUrl={assignment.sheetMusicUrl}
        submitting={submitting}
        submitError={submitError}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
