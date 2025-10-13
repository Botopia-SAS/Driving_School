"use client";

import React from "react";
import { useRouter } from "next/navigation";

const TrafficCourses = () => {
  const router = useRouter();

  const courses = [
    {
      title: "Live Classroom",
      details: [
        "Learn with Professional Instruction",
        "Course for first-time drivers",
        "Advanced driving improvement",
        "Insurance discounts for seniors",
        "And more!",
      ],
      buttonText: "View Courses",
      link: "/classes",
    },
    {
      title: "Online Learning",
      details: [
        "Learn from the Comfort of Your Home",
        "Course for first-time drivers",
        "Advanced driving improvement",
        "Insurance discounts for seniors",
        "And more!",
      ],
      buttonText: "View Online Courses",
      link: "/online-courses",
    },
  ];

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  return (
    <section
      className="bg-cover bg-center py-12 relative"
      style={{ backgroundImage: "url('/C1.jpg')" }}
    >
      {/* Capa oscura para mejorar contraste */}
      <div className="absolute inset-0 bg-black bg-opacity-35 z-0"></div>
      <div className="relative z-10 max-w-6xl mx-auto px-6" style={{maxWidth: '1500px'}}>
        <h2 className="text-5xl sm:text-6xl font-extrabold text-center leading-tight mb-12" style={{letterSpacing: '1px'}}>
          <span className="text-[#27ae60]">TRAFFIC </span>
          <span className="text-white">COURSES</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-16">
          {courses.map((course, index) => (
            <div
              key={index}
              className="bg-black bg-opacity-50 shadow-lg p-6 transform transition-transform duration-300 hover:-translate-y-2"
              style={{
                borderBottomLeftRadius: "15px",
                borderBottomRightRadius: "15px",
              }}
            >
              <h3 className="text-2xl font-bold text-white mb-4 text-center">
                {course.title}
              </h3>
              <ul className="text-gray-300 text-center mb-6 space-y-2">
                {course.details.map((detail, i) => (
                  <li key={i}>{detail}</li>
                ))}
              </ul>
              <button
                onClick={() => handleNavigation(course.link)}
                className="bg-[#27ae60] hover:bg-[#0056b3] text-white font-bold text-lg py-3 px-6 rounded-full transition-colors duration-300 mx-auto"
                style={{
                  display: "block",
                  width: "auto",
                  whiteSpace: "nowrap",
                }}
              >
                {course.buttonText}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrafficCourses;
