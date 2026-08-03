import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-10 px-4 py-16">
      <div className="text-center">
        <p className="text-sm font-medium text-emerald-600">학교장 인증제 · 1인 1악기</p>
        <h1 className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50 sm:text-4xl">
          🎵 MusicRecord
        </h1>
        <p className="mt-3 max-w-md text-zinc-500 dark:text-zinc-400">
          악기 연주를 녹화해서 제출하고, 선생님의 피드백을 받아보세요.
        </p>
      </div>

      <div className="grid w-full max-w-2xl gap-4 sm:grid-cols-2">
        <Link
          href="/student"
          className="flex flex-col items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-8 text-center transition hover:border-emerald-400 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
        >
          <span className="text-4xl">🎻</span>
          <span className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">학생으로 시작하기</span>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">과제곡 확인, 연주 녹화 및 제출</span>
        </Link>

        <Link
          href="/teacher"
          className="flex flex-col items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-8 text-center transition hover:border-emerald-400 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
        >
          <span className="text-4xl">🧑‍🏫</span>
          <span className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">교사로 시작하기</span>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">과제 관리 및 제출물 평가·피드백</span>
        </Link>
      </div>
    </main>
  );
}
