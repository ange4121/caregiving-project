import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ShareForm from "@/components/share/ShareForm";
import PrototypeBanner from "@/components/site/PrototypeBanner";
import { listLessonIds, loadManifest } from "@/lib/lesson/load";

export const dynamicParams = false;

export async function generateStaticParams() {
  return (await listLessonIds()).map((id) => ({ id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/share/[id]">): Promise<Metadata> {
  const { id } = await params;
  const manifest = await loadManifest(id);
  return { title: manifest ? `Send: ${manifest.title_en}` : "Send a lesson" };
}

export default async function SharePage({ params }: PageProps<"/share/[id]">) {
  const { id } = await params;
  const manifest = await loadManifest(id);
  if (!manifest) notFound();
  return (
    <div className="min-h-dvh bg-cream text-navy">
      <PrototypeBanner />
      <ShareForm
        manifest={manifest}
        stillSrc={`/lessons/${id}/${manifest.steps[0].still}`}
      />
    </div>
  );
}
