import { getEntityMetadata, getEntityIdBySlugOrId } from "@/lib/seo-utils";
import { Metadata } from "next";

type Props = {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  // Convertir slug o ID a ID real
  const entityId = await getEntityIdBySlugOrId(id, 'locations');

  if (!entityId) {
    return {
      title: 'Driving School Location',
      description: 'Find our driving school locations near you'
    };
  }

  return await getEntityMetadata(
    entityId,
    'locations',
    'Driving School Location',
    'Find our driving school locations near you'
  );
}

export default function LocationLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
