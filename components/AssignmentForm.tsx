"use client";

import { useState } from "react";
import { INSTRUMENT_GUIDES } from "@/lib/instrumentGuides";

export type AssignmentFormInitial = {
  title: string;
  instrument: string;
  guideType: string;
  targetGrade: number;
  description: string;
  dueDate: string | null;
  sheetMusicUrl: string | null;
};

type SavedAssignment = { id: string };

type Props = {
  /** Present => edit an existing assignment (PATCH). Absent => create one (POST). */
  assignmentId?: string;
  initial?: AssignmentFormInitial;
  submitLabel: string;
  onSaved: (assignment: SavedAssignment) => void;
};

function toDateInputValue(dueDate: string | null | undefined) {
  return dueDate ? dueDate.slice(0, 10) : "";
}

export default function AssignmentForm({ assignmentId, initial, submitLabel, onSaved }: Props) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [instrument, setInstrument] = useState(initial?.instrument ?? "");
  const [guideType, setGuideType] = useState(initial?.guideType ?? "recorder");
  const [targetGrade, setTargetGrade] = useState(String(initial?.targetGrade ?? 3));
  const [description, setDescription] = useState(initial?.description ?? "");
  const [dueDate, setDueDate] = useState(toDateInputValue(initial?.dueDate));
  const [sheetFile, setSheetFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload = {
        title,
        instrument,
        guideType,
        targetGrade: Number(targetGrade),
        description,
        dueDate: dueDate || null,
      };

      const res = await fetch(assignmentId ? `/api/assignments/${assignmentId}` : "/api/assignments", {
        method: assignmentId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const assignment = await res.json();
      if (!res.ok) {
        setError(assignment.error ?? "저장에 실패했어요.");
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
          setError(`과제는 저장됐지만 악보 업로드에 실패했어요: ${sheetError.error ?? ""}`);
          onSaved(assignment);
          return;
        }
      }

      onSaved(assignment);
    } catch {
      setError("네트워크 오류가 발생했어요.");
    } finally {
      setSaving(false);
    }
  }

  return (
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
        {initial?.sheetMusicUrl && (
          <span className="text-xs text-zinc-400">
            현재 악보가 등록되어 있어요. 새 파일을 선택하면 교체됩니다.
          </span>
        )}
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
        {saving ? "저장 중..." : submitLabel}
      </button>
    </form>
  );
}
