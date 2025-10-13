import { getEntityMetadata, getEntityIdBySlugOrId } from "@/lib/seo-utils";
import { Metadata } from "next";

type Props = {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  // Convertir slug o ID a ID real
  const entityId = await getEntityIdBySlugOrId(id, 'onlinecourses');

  if (!entityId) {
    return {
      title: 'Online Driving Course',
      description: 'Complete your driving education online'
    };
  }

  return await getEntityMetadata(
    entityId,
    'onlinecourses',
    'Online Driving Course',
    'Complete your driving education online'
  );
}

export default function OnlineCourseLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
