"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import AuthenticatedButton from "@/components/AuthenticatedButton";

interface Lesson {
  _id: string;
  title: string;
  description: string;
  price: number;
  buttonLabel?: string;
  media?: string[];
  type: "buy" | "book";
}

const DrivingLessons = ({ category }: { category: string }) => {
  const [lessons, setLessons] = useState<Lesson[]>([]);

  useEffect(() => {
    const fetchLessons = async () => {
      try {
        const response = await fetch(`/api/products?category=${category}`);
        const data = await response.json();
        setLessons(data);
      } catch (error) {
        console.error("Error fetching lessons:", error);
      }
    };

    fetchLessons();
  }, [category]);

  return (
    <section className="bg-white py-6 px-4">
      <div className="max-w-6xl mx-auto" style={{maxWidth: '1500px'}}>
        <h2 className="text-4xl sm:text-5xl font-extrabold text-center text-[#000000] leading-tight mb-10 py-2">
          <span className="text-[#27ae60]">OUR</span>{" "}
          <span className="text-[#000000]">DRIVING</span>{" "}
          <span className="text-[#0056b3]">LESSONS</span>
        </h2>
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-10 gap-y-14 justify-items-center">
            {lessons.map((lesson) => {
              const isBooking = lesson.buttonLabel?.toLowerCase().includes("book");
              return (
                <div
                  key={lesson._id}
                  className="relative w-[320px] min-h-[420px] bg-white rounded-2xl border-2 border-[#0056b3] shadow-lg flex flex-col items-center px-7 py-10 group transition-transform duration-300 hover:-translate-y-3 hover:shadow-2xl"
                >
                  {/* Banda Best Seller */}
                  {lesson.title?.toLowerCase().includes("pack") && (
                    <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#27ae60] text-white text-xs font-bold px-4 py-1 rounded-full shadow z-20 border-2 border-white">Best Seller</span>
                  )}
                  {/* Imagen/Icono circular */}
                  <div className="w-24 h-24 mb-6 flex items-center justify-center rounded-full border-4 border-[#0056b3] bg-white overflow-hidden shadow-sm">
                    {lesson.media && lesson.media.length > 0 ? (
                      <Image
                        src={lesson.media[0]}
                        alt={lesson.title}
                        width={80}
                        height={80}
                        className="object-contain w-full h-full"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-100 flex items-center justify-center rounded-full text-3xl text-[#0056b3] font-bold">
                        {lesson.title.charAt(0)}
                      </div>
                    )}
                  </div>
                  {/* Título */}
                  <h3 className="text-2xl font-extrabold text-[#0056b3] text-center mb-2 tracking-wide uppercase">
                    {lesson.title}
                  </h3>
                  {/* Precio destacado */}
                  <div className="text-3xl font-extrabold text-[#27ae60] text-center mb-3">
                    ${lesson.price}
                  </div>
                  {/* Descripción */}
                  <p className="text-base text-gray-700 text-center leading-relaxed mb-7 min-h-[60px]">
                    {lesson.description}
                  </p>
                  {/* Botón ancho */}
                  <button
                    type="button"
                    className="w-full bg-[#0056b3] text-white font-extrabold text-base py-3 px-6 rounded-full shadow-md hover:bg-[#27ae60] hover:shadow-lg transition-all duration-200 active:scale-95 border-none mt-auto"
                    onClick={() => {}}
                  >
                    {lesson.buttonLabel || (isBooking ? "Book now!" : "Add to Cart")}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default DrivingLessons;