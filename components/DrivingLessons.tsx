"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();

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

  const handleRedirect = (lesson: Lesson) => {
    const buttonText = lesson.buttonLabel?.toLowerCase();
    if (buttonText === "book") {
      router.push("/Book-Now");
    } else if (buttonText === "details") {
      router.push("/Lessons");
    }
  };

  return (
    <section className="bg-white py-16">
      {/* Título con separación */}
      <div className="h-[64px] flex items-center justify-center mb-12">
        {category === "General" && (
          <h2 className="text-5xl font-extrabold text-center text-[#222] leading-tight">
            <span className="text-[#0056b3]">OUR </span>DRIVING{" "}
            <span className="text-[#27ae60]">LESSONS</span>
          </h2>
        )}
      </div>

      {/* Contenedor de tarjetas responsive */}
      <div className="px-6 sm:px-10 lg:px-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-12 gap-y-16 justify-items-center">
          {lessons.map((lesson) => (
            <div
              key={lesson._id}
              className="w-[280px] h-[340px] bg-white rounded-xl shadow-lg overflow-hidden flex flex-col items-center px-6 py-5 transform transition-transform duration-300 hover:-translate-y-2 border-4 border-[#0056b3]"
            >
              {/* Imagen ajustada al centro */}
              {lesson.media && lesson.media.length > 0 && (
                <div className="w-20 h-20 relative mb-2">
                  <Image
                    src={lesson.media[0]}
                    alt={lesson.title}
                    layout="fill"
                    objectFit="contain"
                  />
                </div>
              )}

              {/* Contenido interno alineado */}
              <div className="flex flex-col flex-grow w-full">
                <h3 className="text-lg font-bold text-black text-center mb-1">
                  {lesson.title}
                </h3>

                {/* Descripción con altura fija */}
                <p className="text-sm text-black text-center min-h-[36px]">
                  {lesson.description}
                </p>

                {/* Precio y botón alineados correctamente */}
                <div className="mt-auto flex flex-col items-center">
                  <p className="text-xl font-bold text-[#0056b3] text-center mt-2">
                    ${lesson.price}
                  </p>

                  {/* Botón según el tipo de lección */}
                  {lesson.buttonLabel?.toLowerCase() === "book" || lesson.buttonLabel?.toLowerCase() === "details" ? (
                    <button
                      onClick={() => handleRedirect(lesson)}
                      className="w-full bg-[#27ae60] text-white font-bold text-sm py-2 px-4 rounded-full shadow-md hover:bg-[#0056b3] transition duration-300 ease-in-out mt-3"
                    >
                      {lesson.buttonLabel}
                    </button>
                  ) : (
                    <AuthenticatedButton
                      type="buy"
                      actionData={{
                        itemId: lesson._id,
                        title: lesson.title,
                        price: lesson.price,
                      }}
                      label={lesson.buttonLabel || "Add to Cart"}
                      className="w-full bg-[#0056b3] text-white font-bold text-sm py-2 px-4 rounded-full shadow-md hover:bg-[#27ae60] transition duration-300 ease-in-out mt-3"
                    />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DrivingLessons;