import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PracticePlayer from "@/components/practice/PracticePlayer";
import { listLessonIds, loadManifest } from "@/lib/lesson/load";

// Lessons are static files; every lesson page is built ahead of time.
export const dynamicParams = false;

export async function generateStaticParams() {
  return (await listLessonIds()).map((id) => ({ id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/l/[id]">): Promise<Metadata> {
  const { id } = await params;
  const manifest = await loadManifest(id);
  return { title: manifest ? `小练习 · ${manifest.title_en}` : "小练习" };
}

export default async function LessonPage({ params }: PageProps<"/l/[id]">) {
  const { id } = await params;
  const manifest = await loadManifest(id);
  if (!manifest) notFound();
  return <PracticePlayer manifest={manifest} assetBase={`/lessons/${id}`} />;
}
