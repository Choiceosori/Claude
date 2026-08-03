"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTeacherSession } from "@/lib/useTeacherSession";
import TeacherHeader from "@/components/TeacherHeader";
import { INSTRUMENT_GUIDES } from "@/lib/instrumentGuides";

export default function NewAssignmentPage() {
  const session = useTeacherSession();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [instrument, setInstrument] = useState("");
  const [guideType, setGuideType] = useState("recorder");
  const [targetGrade, setTargetGrade] = useState("3");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [sheetFile, setSheetFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (session === null) router.push("/teacher/login");
  }, [session, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          instrument,
          guideType,
          targetGrade: Number(targetGrade),
          description,
          dueDate: dueDate || null,
        }),
      });
      const assignment = await res.json();
      if (!res.ok) {
        setError(assignment.error ?? "과제 생성에 실패했어요.");
        return;
      }

      if (sheetFile) {
        const formData = new FormData();
        formData.append("file", sheetFile);
        const sheetRes = await fetch(`/api/assignments/${assignment.id}/sheet-music`, {
          method: "POST",
          body: formData,
        });
        if (!sheetRes.ok) {
          const sheetError = await sheetRes.json();
          setError(`과제는 생성됐지만 악보 업로드에 실패했어요: ${sheetError.error ?? ""}`);
          router.push(`/teacher/assignments/${assignment.id}`);
          return;
        }
      }

      router.push(`/teacher/assignments/${assignment.id}`);
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
      <div className="mx-auto max-w-xl px-4 py-6">
        <Link href="/teacher" className="mb-4 inline-block text-sm text-zinc-400 hover:text-zinc-600">
          ← 과제 목록으로
        </Link>
        <h1 className="mb-4 text-xl font-bold text-zinc-900 dark:text-zinc-50">새 과제 만들기</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-300">
            곡 제목
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-md border border-zinc-300 p-2 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-300">
            악기
            <input
              required
              value={instrument}
              onChange={(e) => setInstrument(e.target.value)}
              placeholder="예: 리코더"
              className="rounded-md border border-zinc-300 p-2 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-300">
            자세 가이드 유형
            <select
              value={guideType}
              onChange={(e) => setGuideType(e.target.value)}
              className="rounded-md border border-zinc-300 p-2 dark:border-zinc-700 dark:bg-zinc-900"
            >
              {Object.entries(INSTRUMENT_GUIDES).map(([key, g]) => (
                <option key={key} value={key}>
                  {g.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-300">
            대상 학년
            <select
              value={targetGrade}
              onChange={(e) => setTargetGrade(e.target.value)}
              className="rounded-md border border-zinc-300 p-2 dark:border-zinc-700 dark:bg-zinc-900"
            >
              {[1, 2, 3, 4, 5, 6].map((g) => (
                <option key={g} value={g}>
                  {g}학년
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-300">
            안내 사항
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="rounded-md border border-zinc-300 p-2 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-300">
            제출 기한
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="rounded-md border border-zinc-300 p-2 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-300">
            악보 파일 (PNG/JPEG/WEBP/PDF)
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,application/pdf"
              onChange={(e) => setSheetFile(e.target.files?.[0] ?? null)}
              className="text-sm"
            />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {saving ? "저장 중..." : "과제 만들기"}
          </button>
        </form>
      </div>
    </div>
  );
}
