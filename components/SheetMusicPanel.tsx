type Props = {
  assignmentId: string;
  sheetMusicUrl: string | null;
  title: string;
};

export default function SheetMusicPanel({ assignmentId, sheetMusicUrl, title }: Props) {
  if (!sheetMusicUrl) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-xl bg-zinc-100 p-6 text-center dark:bg-zinc-800">
        <p className="text-lg font-semibold text-zinc-700 dark:text-zinc-200">{title}</p>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">등록된 악보가 없어요. 선생님께 문의해 보세요.</p>
      </div>
    );
  }

  const src = `/api/media/sheet-music/${assignmentId}`;
  const isPdf = sheetMusicUrl.toLowerCase().endsWith(".pdf");

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-xl bg-white dark:bg-zinc-900">
      <div className="shrink-0 border-b border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">
        {title} 악보
      </div>
      <div className="flex-1 overflow-auto p-2">
        {isPdf ? (
          <embed src={src} type="application/pdf" className="h-full min-h-100 w-full" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={`${title} 악보`} className="mx-auto max-w-full" />
        )}
      </div>
    </div>
  );
}
