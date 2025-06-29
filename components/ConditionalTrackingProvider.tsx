"use client";
import { usePathname } from "next/navigation";
import TrackingProvider from "@/components/TrackingProvider";

export default function ConditionalTrackingProvider() {
  const pathname = usePathname() || "";
  const isTeacherRoute = pathname.startsWith("/myschedule") || pathname.startsWith("/mystudents");
  if (isTeacherRoute) return null;
  return <TrackingProvider />;
} 