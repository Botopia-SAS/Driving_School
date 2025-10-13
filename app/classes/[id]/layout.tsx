import { getEntityMetadata, getEntityIdBySlugOrId } from "@/lib/seo-utils";
import { Metadata } from "next";

type Props = {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  // Convertir slug o ID a ID real
  const entityId = await getEntityIdBySlugOrId(id, 'DrivingClass');

  if (!entityId) {
    return {
      title: 'Driving Class',
      description: 'Professional driving classes and training'
    };
  }

  return await getEntityMetadata(
    entityId,
    'DrivingClass',
    'Driving Class',
    'Professional driving classes and training'
  );
}

export default function ClassLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
