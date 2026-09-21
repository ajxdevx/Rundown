import { cookies } from "next/headers";
import ProjectsPage from "@/components/ProjectsPage";
import {
  parseProjectsViewMode,
  PROJECTS_VIEW_COOKIE,
} from "@/lib/projectsView";

export default async function Page() {
  const cookieStore = await cookies();
  const initialViewMode = parseProjectsViewMode(
    cookieStore.get(PROJECTS_VIEW_COOKIE)?.value,
  );

  return <ProjectsPage initialViewMode={initialViewMode} />;
}
