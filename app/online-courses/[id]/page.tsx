"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useRouter, useParams } from "next/navigation";
import { FaArrowLeft } from "react-icons/fa";

interface Course {
  _id: string;
  image?: string;
  title: string;
  description: string;
  buttonLabel?: string;
  hasPrice?: boolean;
  price?: number;
  type?: string;
}

const OnlineCourseDetailPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [courseData, setCourseData] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourseDetail = async () => {
      try {
        const res = await fetch(`/api/online/${id}`);
        const data = await res.json();
        setCourseData(data);
      } catch (error) {
        console.error("❌ Error fetching course details:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchCourseDetail();
    }
  }, [id]);

  if (loading) {
    return (
      <section className="bg-gray-50 pt-[200px] pb-20 px-4 sm:px-6 md:px-12 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-gray-500 text-lg">Loading course details...</p>
        </div>
      </section>
    );
  }

  if (!courseData) {
    return (
      <section className="bg-gray-50 pt-[200px] pb-20 px-4 sm:px-6 md:px-12 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-gray-500 text-lg">Course not found.</p>
          <div className="text-center mt-6">
            <button
              onClick={() => router.push("/online-courses")}
              className="bg-[#0056b3] text-white font-semibold px-6 py-3 rounded-lg hover:bg-[#004494] transition"
            >
              Back to Online Courses
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-gray-50 pt-[200px] pb-20 px-4 sm:px-6 md:px-12 min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.push("/online-courses")}
          className="flex items-center gap-2 text-[#0056b3] hover:text-[#004494] font-semibold mb-6 transition"
        >
          <FaArrowLeft />
          Back to Online Courses
        </button>

        <motion.div
          className="bg-white rounded-xl shadow-2xl overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Image */}
          {courseData.image && (
            <div className="relative w-full h-96">
              <Image
                src={courseData.image}
                alt={courseData.title}
                fill
                className="object-cover"
              />
            </div>
          )}

          {/* Content */}
          <div className="p-10">
            <h1 className="text-4xl font-bold text-gray-900 mb-6">{courseData.title}</h1>

            {/* Description */}
            <p className="text-lg text-gray-700 leading-relaxed mb-6 whitespace-pre-line">
              {courseData.description}
            </p>

            {/* Price */}
            {courseData.hasPrice && courseData.price && (
              <div className="mb-6">
                <span className="text-2xl font-semibold text-green-600">
                  Price: ${courseData.price}
                </span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              {/* View Details Button */}
              <button
                onClick={() => router.push("/classes")}
                className="flex-1 border-2 border-[#0056b3] text-[#0056b3] font-semibold py-4 rounded-lg hover:bg-[#0056b3] hover:text-white transition text-center text-lg"
              >
                View Details
              </button>

              {/* Main Action Button */}
              <a
                href={
                  courseData.buttonLabel === "Start Course"
                    ? "https://home.uceusa.com/registration/StudentInfo.aspx?cid=3&host=adtrafficschool.com&pid=328&language=en&g=fac80251-e113-4906-8d99-c77d4e8cad51"
                    : "/locations"
                }
                target={courseData.buttonLabel === "Start Course" ? "_blank" : "_self"}
                rel="noopener noreferrer"
                className="flex-1 bg-[#0056b3] text-white font-semibold py-4 rounded-lg hover:bg-[#004494] transition text-center shadow-md text-lg"
              >
                {courseData.buttonLabel || "Start Course"}
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default OnlineCourseDetailPage;
