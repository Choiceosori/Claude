"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import PostureGuideOverlay from "./PostureGuideOverlay";
import SheetMusicPanel from "./SheetMusicPanel";
import { InstrumentGuide } from "@/lib/instrumentGuides";

type Stage = "loading" | "error" | "idle" | "recording" | "preview";

type Props = {
  guide: InstrumentGuide;
  assignmentId: string;
  assignmentTitle: string;
  instrument: string;
  sheetMusicUrl: string | null;
  submitting: boolean;
  submitError: string | null;
  onSubmit: (blob: Blob, mimeType: string) => void;
};

const CANDIDATE_MIME_TYPES = [
  "video/webm;codecs=vp9,opus",
  "video/webm;codecs=vp8,opus",
  "video/webm",
  "video/mp4",
];

function pickSupportedMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "video/webm";
  for (const type of CANDIDATE_MIME_TYPES) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return "";
}

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function CameraRecorder({
  guide,
  assignmentId,
  assignmentTitle,
  instrument,
  sheetMusicUrl,
  submitting,
  submitError,
  onSubmit,
}: Props) {
  const [stage, setStage] = useState<Stage>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [videoDeviceId, setVideoDeviceId] = useState<string>("");
  const [audioDeviceId, setAudioDeviceId] = useState<string>("");
  const [elapsed, setElapsed] = useState(0);
  const [recordedUrl, setRecordedUrl] = useState<string>("");

  const liveVideoRef = useRef<HTMLVideoElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordedBlobRef = useRef<Blob | null>(null);
  const mimeTypeRef = useRef<string>("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const startCamera = useCallback(
    async (constraints: { videoId?: string; audioId?: string }) => {
      stopStream();
      setStage("loading");
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: constraints.videoId
            ? { deviceId: { exact: constraints.videoId } }
            : { facingMode: "user" },
          audio: constraints.audioId ? { deviceId: { exact: constraints.audioId } } : true,
        });
        streamRef.current = stream;
        if (liveVideoRef.current) {
          liveVideoRef.current.srcObject = stream;
        }

        const devices = await navigator.mediaDevices.enumerateDevices();
        setVideoDevices(devices.filter((d) => d.kind === "videoinput"));
        setAudioDevices(devices.filter((d) => d.kind === "audioinput"));

        const activeVideoTrack = stream.getVideoTracks()[0];
        const activeAudioTrack = stream.getAudioTracks()[0];
        setVideoDeviceId(activeVideoTrack?.getSettings().deviceId ?? "");
        setAudioDeviceId(activeAudioTrack?.getSettings().deviceId ?? "");

        setStage("idle");
      } catch {
        setErrorMessage("카메라와 마이크를 사용할 수 없어요. 브라우저 권한을 확인해 주세요.");
        setStage("error");
      }
    },
    [stopStream]
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- kicks off async getUserMedia; state updates happen after the await
    startCamera({});
    return () => {
      stopStream();
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function switchCamera() {
    if (videoDevices.length < 2) return;
    const currentIndex = videoDevices.findIndex((d) => d.deviceId === videoDeviceId);
    const next = videoDevices[(currentIndex + 1) % videoDevices.length];
    startCamera({ videoId: next.deviceId, audioId: audioDeviceId });
  }

  function changeMic(deviceId: string) {
    startCamera({ videoId: videoDeviceId, audioId: deviceId });
  }

  function startRecording() {
    const stream = streamRef.current;
    if (!stream) return;

    const mimeType = pickSupportedMimeType();
    mimeTypeRef.current = mimeType || "video/webm";
    chunksRef.current = [];

    const recorder = mimeType
      ? new MediaRecorder(stream, { mimeType })
      : new MediaRecorder(stream);

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeTypeRef.current });
      recordedBlobRef.current = blob;
      setRecordedUrl(URL.createObjectURL(blob));
      setStage("preview");
      if (timerRef.current) clearInterval(timerRef.current);
    };

    mediaRecorderRef.current = recorder;
    recorder.start();
    setElapsed(0);
    setStage("recording");
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
  }

  function reRecord() {
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setRecordedUrl("");
    recordedBlobRef.current = null;
    setElapsed(0);
    setStage("idle");
    if (!streamRef.current) startCamera({ videoId: videoDeviceId, audioId: audioDeviceId });
    else if (liveVideoRef.current) liveVideoRef.current.srcObject = streamRef.current;
  }

  function handleSubmit() {
    if (recordedBlobRef.current) {
      onSubmit(recordedBlobRef.current, mimeTypeRef.current);
    }
  }

  if (stage === "loading") {
    return (
      <div className="flex h-96 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 dark:bg-zinc-800">
        카메라를 준비하고 있어요...
      </div>
    );
  }

  if (stage === "error") {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3 rounded-xl bg-red-50 p-6 text-center text-red-700 dark:bg-red-950/30 dark:text-red-300">
        <p>{errorMessage}</p>
        <button
          onClick={() => startCamera({})}
          className="rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (stage === "preview") {
    return (
      <div className="flex flex-col gap-4">
        <video
          ref={previewVideoRef}
          src={recordedUrl}
          controls
          playsInline
          className="mx-auto w-full max-w-md rounded-xl bg-black"
        />
        {submitError && <p className="text-center text-sm text-red-600">{submitError}</p>}
        <div className="flex justify-center gap-3">
          <button
            onClick={reRecord}
            disabled={submitting}
            className="rounded-full border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            다시 녹화하기
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {submitting ? "제출 중..." : "제출하기"}
          </button>
        </div>
      </div>
    );
  }

  const isRecording = stage === "recording";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between rounded-lg bg-zinc-900 px-4 py-2 text-white">
        <div className="text-sm">
          <span className="font-semibold">{instrument}</span>
          <span className="mx-2 text-zinc-400">·</span>
          <span>{assignmentTitle}</span>
        </div>
        {isRecording && (
          <div className="flex items-center gap-2 text-sm font-mono">
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
            {formatTime(elapsed)}
          </div>
        )}
      </div>

      {isRecording ? (
        <div className="relative grid gap-3 sm:grid-cols-[1fr_auto]">
          <div className="h-[70vh] max-h-160">
            <SheetMusicPanel assignmentId={assignmentId} sheetMusicUrl={sheetMusicUrl} title={assignmentTitle} />
          </div>
          <div className="relative h-32 w-44 shrink-0 self-start overflow-hidden rounded-lg border-2 border-red-500 sm:h-40 sm:w-56">
            <video ref={liveVideoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
          </div>
        </div>
      ) : (
        <div className="relative mx-auto aspect-[3/4] w-full max-w-md overflow-hidden rounded-xl bg-black sm:aspect-video sm:max-w-2xl">
          <video ref={liveVideoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
          <PostureGuideOverlay guide={guide} />
        </div>
      )}

      <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">{guide.framing}</p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {!isRecording && (
          <>
            <button
              onClick={switchCamera}
              disabled={videoDevices.length < 2}
              className="rounded-full border border-zinc-300 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              카메라 전환
            </button>
            {audioDevices.length > 1 && (
              <select
                value={audioDeviceId}
                onChange={(e) => changeMic(e.target.value)}
                className="rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
              >
                {audioDevices.map((d) => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label || "마이크"}
                  </option>
                ))}
              </select>
            )}
          </>
        )}

        {isRecording ? (
          <button
            onClick={stopRecording}
            className="rounded-full bg-red-600 px-6 py-3 text-sm font-semibold text-white hover:bg-red-700"
          >
            녹화 중지
          </button>
        ) : (
          <button
            onClick={startRecording}
            className="rounded-full bg-red-600 px-6 py-3 text-sm font-semibold text-white hover:bg-red-700"
          >
            ● 녹화 시작
          </button>
        )}
      </div>
    </div>
  );
}
