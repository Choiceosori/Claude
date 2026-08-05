"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useTeacherSession } from "@/lib/useTeacherSession";
import TeacherHeader from "@/components/TeacherHeader";
import AssignmentForm, { AssignmentFormInitial } from "@/components/AssignmentForm";

export default function EditAssignmentPage() {
  const params = useParams<{ id: string }>();
  const session = useTeacherSession();
  const router = useRouter();
  const [assignment, setAssignment] = useState<AssignmentFormInitial | null>(null);

  useEffect(() => {
    if (session === null) router.push("/teacher/login");
  }, [session, router]);

  useEffect(() => {
    if (!session) return;
    fetch(`/api/assignments/${params.id}`)
      .then((r) => r.json())
      .then(setAssignment);
  }, [session, params.id]);

  if (session === undefined || !assignment) {
    return <div className="p-8 text-center text-zinc-400">불러오는 중...</div>;
  }
  if (!session) return null;

  return (
    <div>
      <TeacherHeader session={session} />
      <div className="mx-auto max-w-xl px-4 py-6">
        <Link href={`/teacher/assignments/${params.id}`} className="mb-4 inline-block text-sm text-zinc-400 hover:text-zinc-600">
          ← 과제 상세로
        </Link>
        <h1 className="mb-4 text-xl font-bold text-zinc-900 dark:text-zinc-50">과제 수정</h1>
        <AssignmentForm
          assignmentId={params.id}
          initial={assignment}
          submitLabel="저장하기"
          onSaved={() => router.push(`/teacher/assignments/${params.id}`)}
        />
      </div>
    </div>
  );
}
