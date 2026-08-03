"use client";

import { useRef, useState } from "react";

export type FeedbackItem = {
  id: string;
  timestampSec: number;
  comment: string;
};

type Props = {
  videoSrc: string;
  feedbacks: FeedbackItem[];
  onAddFeedback: (timestampSec: number, comment: string) => Promise<void> | void;
  onDeleteFeedback?: (feedbackId: string) => Promise<void> | void;
  readOnly?: boolean;
};

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function VideoPlayerWithFeedback({
  videoSrc,
  feedbacks,
  onAddFeedback,
  onDeleteFeedback,
  readOnly = false,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [comment, setComment] = useState("");
  const [pendingTimestamp, setPendingTimestamp] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  function seekTo(seconds: number) {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      videoRef.current.play().catch(() => {});
    }
  }

  function markCurrentTime() {
    const time = videoRef.current?.currentTime ?? 0;
    videoRef.current?.pause();
    setPendingTimestamp(time);
  }

  async function submitFeedback() {
    if (pendingTimestamp === null || !comment.trim()) return;
    setSaving(true);
    try {
      await onAddFeedback(pendingTimestamp, comment.trim());
      setComment("");
      setPendingTimestamp(null);
    } finally {
      setSaving(false);
    }
  }

  const sorted = [...feedbacks].sort((a, b) => a.timestampSec - b.timestampSec);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <div>
        <video ref={videoRef} src={videoSrc} controls playsInline className="w-full rounded-xl bg-black" />
        {!readOnly && (
          <div className="mt-3 flex flex-col gap-2 rounded-lg border border-zinc-200 p-3 dark:border-zinc-700">
            {pendingTimestamp === null ? (
              <button
                onClick={markCurrentTime}
                className="self-start rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
              >
                현재 시점에 코멘트 추가
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <p className="text-sm text-zinc-500">
                  <strong>{formatTime(pendingTimestamp)}</strong> 지점에 코멘트를 남겨요.
                </p>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={2}
                  placeholder="예: 상반신 각도 주의, 박자가 빨라져요"
                  className="rounded-md border border-zinc-300 p-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                />
                <div className="flex gap-2">
                  <button
                    onClick={submitFeedback}
                    disabled={saving || !comment.trim()}
                    className="rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    저장
                  </button>
                  <button
                    onClick={() => {
                      setPendingTimestamp(null);
                      setComment("");
                    }}
                    className="rounded-full border border-zinc-300 px-4 py-1.5 text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
                  >
                    취소
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">타임스탬프 피드백</h3>
        {sorted.length === 0 && <p className="text-sm text-zinc-400">아직 남긴 코멘트가 없어요.</p>}
        <ul className="flex flex-col gap-2">
          {sorted.map((f) => (
            <li
              key={f.id}
              className="flex items-start justify-between gap-2 rounded-lg border border-zinc-200 p-2 text-sm dark:border-zinc-700"
            >
              <button onClick={() => seekTo(f.timestampSec)} className="flex-1 text-left">
                <span className="font-mono text-xs font-semibold text-emerald-600">
                  {formatTime(f.timestampSec)}
                </span>
                <p className="text-zinc-700 dark:text-zinc-200">{f.comment}</p>
              </button>
              {!readOnly && onDeleteFeedback && (
                <button
                  onClick={() => onDeleteFeedback(f.id)}
                  className="text-xs text-zinc-400 hover:text-red-500"
                  aria-label="코멘트 삭제"
                >
                  삭제
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
