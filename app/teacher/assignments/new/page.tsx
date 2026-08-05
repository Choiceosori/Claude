"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTeacherSession } from "@/lib/useTeacherSession";
import TeacherHeader from "@/components/TeacherHeader";
import AssignmentForm from "@/components/AssignmentForm";

export default function NewAssignmentPage() {
  const session = useTeacherSession();
  const router = useRouter();

  useEffect(() => {
    if (session === null) router.push("/teacher/login");
  }, [session, router]);

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
        <AssignmentForm
          submitLabel="과제 만들기"
          onSaved={(assignment) => router.push(`/teacher/assignments/${assignment.id}`)}
        />
      </div>
    </div>
  );
}
