"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import AnimatedCounter from "./AnimatedCounter";

const Hero = () => {
  return (
    <section className="relative min-h-[100vh] flex items-center justify-start px-4 sm:px-6 md:px-12 pt-20 sm:pt-16 md:pt-8 lg:pt-0 overflow-hidden">
      {/* Imagen de fondo para móvil - Cloudinary optimizada */}
      <Image
        src="https://res.cloudinary.com/dzi2p0pqa/image/upload/f_auto,q_auto,w_1080/v1761582232/p9kxi89spkqsfsjc2yfj.jpg"
        alt="Affordable Driving School - Professional driving instruction in Palm Beach County"
        fill
        priority
        quality={85}
        sizes="(max-width: 640px) 100vw, 0vw"
        className="object-cover object-center sm:hidden"
        placeholder="blur"
        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAKAAoDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlbaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD3+iiigD//2Q=="
      />

      {/* Imagen de fondo para desktop - Cloudinary optimizada */}
      <Image
        src="https://res.cloudinary.com/dzi2p0pqa/image/upload/f_auto,q_auto,w_1920/v1761582177/rxcp45fmxz7e0uec2qyv.jpg"
        alt="Professional driving lessons with modern vehicles - Affordable Driving School"
        fill
        priority
        quality={85}
        sizes="(min-width: 641px) 100vw, 0vw"
        className="object-cover object-center hidden sm:block"
        placeholder="blur"
        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAKAAoDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlbaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD3+iiigD//2Q=="
      />

      {/* Fondo degradado oscuro para resaltar el texto */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/50 via-black/30 to-transparent z-10" />

      {/* Contenido principal */}
      <div className="relative max-w-6xl mx-auto flex flex-col items-start text-left w-full z-20 py-4 sm:py-6 md:py-8 lg:py-10" style={{maxWidth: '1500px'}}>
        {/* Hero Text Mejorado */}
        <div className="w-full max-w-xl mb-6 sm:mb-8 mt-4 sm:mt-8 md:mt-12 lg:mt-16">
          <div className="px-4 sm:px-6 md:px-8 py-6 sm:py-8 md:py-10 rounded-xl shadow-2xl animate-fade-in-up">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-tight mb-4 sm:mb-6 drop-shadow-2xl transition-all duration-500">
              <span className="block bg-gradient-to-r from-[#4CAF50] via-[#43e97b] to-[#38f9d7] bg-clip-text text-transparent animate-gradient-x">Learn To Drive</span>
              <span className="block mt-1 sm:mt-2">Safely For Life</span>
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-white/90 font-medium mb-0 w-full max-w-xl drop-shadow-lg transition-all duration-500">
              Affordable Driving School offers professional <br className="hidden md:block" />
              Behind the Wheel Driving Lessons and Traffic <br className="hidden md:block" />
              School Courses in Palm Beach County.
            </p>
          </div>
        </div>
        {/* 📌 Contenedor de estadísticas (igual que antes) */}
        <div className="bg-white/30 backdrop-blur-sm shadow-lg rounded-lg px-4 sm:px-6 md:px-8 py-3 sm:py-4 mb-6 sm:mb-8 md:mb-12 w-full max-w-xl">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 text-center">
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-black">
                <AnimatedCounter 
                  end={9000} 
                  duration={2500}
                  className="text-2xl sm:text-3xl md:text-4xl font-bold text-black"
                />
                <span className="text-[#4CAF50]">+</span>
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-black">Students</p>
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-black">
                <AnimatedCounter 
                  end={5000} 
                  duration={2200}
                  className="text-2xl sm:text-3xl md:text-4xl font-bold text-black"
                />
                <span className="text-[#4CAF50]">+</span>
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-black">Lessons</p>
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-black">
                <AnimatedCounter 
                  end={30} 
                  duration={1800}
                  className="text-2xl sm:text-3xl md:text-4xl font-bold text-black"
                />
                <span className="text-[#4CAF50]">+</span>
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-black">Years of Experience</p>
            </div>
          </div>
        </div>
        {/* 📌 Botones */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full max-w-xl mb-8 sm:mb-12 md:mb-16">
          <Link
            href="/driving-lessons"
            className="bg-[#4CAF50] text-white text-base sm:text-lg md:text-xl px-4 sm:px-6 py-3 sm:py-4 rounded-full border-white hover:bg-[#0056b3] text-center transition-all shadow-lg hover:shadow-xl"
          >
            Book Driving Lessons
          </Link>
          <Link
            href="/classes"
            className="bg-[#4CAF50] text-white text-base sm:text-lg md:text-xl px-4 sm:px-6 py-3 sm:py-4 rounded-full border-white hover:bg-[#0056b3] text-center transition-all shadow-lg hover:shadow-xl"
          >
            Book a Traffic Ticket Class
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Hero;
