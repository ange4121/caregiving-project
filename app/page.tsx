import HomeView from "@/components/site/HomeView";
import { lessonCards } from "@/lib/home";
import { listLessonIds, loadManifest } from "@/lib/lesson/load";
import { FEATURED_LESSON_ID, HELPER_VIDEO_EMBED } from "@/lib/site";

export default async function Home() {
  const manifests = (
    await Promise.all((await listLessonIds()).map(loadManifest))
  ).filter((m) => m !== null);
  return (
    <HomeView
      cards={lessonCards(manifests, FEATURED_LESSON_ID)}
      helperVideoEmbed={HELPER_VIDEO_EMBED}
    />
  );
}
