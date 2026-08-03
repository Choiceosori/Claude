"use client";

import { useState } from "react";
import { saveStudentIdentity, StudentIdentity } from "@/lib/studentIdentity";

export default function StudentIdentityForm({ onIdentified }: { onIdentified: (identity: StudentIdentity) => void }) {
  const [grade, setGrade] = useState("");
  const [classNo, setClassNo] = useState("");
  const [number, setNumber] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grade: Number(grade),
          classNo: Number(classNo),
          number: Number(number),
          name,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "정보를 확인해 주세요.");
        return;
      }
      const identity: StudentIdentity = {
        id: data.id,
        grade: data.grade,
        classNo: data.classNo,
        number: data.number,
        name: data.name,
      };
      saveStudentIdentity(identity);
      onIdentified(identity);
    } catch {
      setError("네트워크 오류가 발생했어요. 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-sm flex-col gap-4">
      <h1 className="text-center text-xl font-bold text-zinc-800 dark:text-zinc-100">내 정보 입력</h1>
      <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
        학년, 반, 번호, 이름을 입력하면 나의 연주 기록을 확인할 수 있어요.
      </p>
      <div className="grid grid-cols-3 gap-2">
        <label className="flex flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-300">
          학년
          <input
            required
            type="number"
            min={1}
            max={6}
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            className="rounded-md border border-zinc-300 p-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-300">
          반
          <input
            required
            type="number"
            min={1}
            value={classNo}
            onChange={(e) => setClassNo(e.target.value)}
            className="rounded-md border border-zinc-300 p-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-300">
          번호
          <input
            required
            type="number"
            min={1}
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            className="rounded-md border border-zinc-300 p-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-300">
        이름
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-md border border-zinc-300 p-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        {loading ? "확인 중..." : "시작하기"}
      </button>
    </form>
  );
}
