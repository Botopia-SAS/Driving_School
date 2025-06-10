"use client";
import Hero from "@/components/Hero";
import Body from "@/components/Body";
import Learn from "@/components/Learn";
import DrivingLessons from "@/components/DrivingLessons";
import TrafficCourses from "@/components/TrafficCourses";
import Resources from "@/components/Resources";
import AreasWeServe from "@/components/AreasWeServe";
import AuthRedirector from "./components/AuthRedirector";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthContext";

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && (user as any).type === "instructor") {
      router.replace("/myschedule");
    }
  }, [user, router]);

  return (
    <>
      <AuthRedirector />
      <div>
        <Hero />
        <Body />
        <Learn />
        <DrivingLessons category="General" />
        <TrafficCourses />
        <Resources />
        <AreasWeServe />
      </div>
    </>
  );
}
