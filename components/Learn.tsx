"use client";

import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

const Learn = () => {
  const features = [
    {
      image: "https://res.cloudinary.com/dzi2p0pqa/image/upload/v1761583538/rcz2hje8xk4w3vatlc9f.jpg",
      title: "Experienced Instructors",
      description:
        "Our instructors are certified and have over 25 years of teaching experience in Palm Beach County. They stay up-to-date with the latest driving techniques.",
    },
    {
      image: "https://res.cloudinary.com/dzi2p0pqa/image/upload/v1761583587/ml4qh1qd9yeqw6jm51xs.jpg",
      title: "Affordable Prices",
      description:
        "We offer competitive rates for our driving lessons, and our multi-lesson driving test offer discounts. Save up to $330!",
    },
    {
      image: "https://res.cloudinary.com/dzi2p0pqa/image/upload/v1761583615/gi7kw8zmkwyobglrinc2.jpg",
      title: "Easy Bookings",
      description:
        "Booking and payment are quick and stress-free with our online booking system. Choose your instructor, date, and service, and you're ready to go!",
    },
    {
      image: "https://res.cloudinary.com/dzi2p0pqa/image/upload/v1761583339/fuecggpioplxcelatams.jpg",
      title: "Certified Traffic Courses",
      description:
        "We offer accredited Florida Traffic Courses, including the required First-Time Driver course and various Ticket and Driving Improvement Courses.",
    },
    {
      image: "https://res.cloudinary.com/dzi2p0pqa/image/upload/v1761583429/lmvmde9qakdjskyspl89.jpg",
      title: "Personalized Driving Lessons",
      description:
        "We tailor lessons for beginners, teenagers, and experienced drivers. Each lesson is customized for the student's experience.",
    },
    {
      image: "https://res.cloudinary.com/dzi2p0pqa/image/upload/v1761583461/nwcxb2pol2i4fkhijo6o.jpg",
      title: "Online Learning Options",
      description:
        "We offer flexible learning options, including online Traffic Courses and DVD versions of our 4hr Basic Driving Improvement Course.",
    },
  ];

  return (
    <section className="bg-white pt-8 pb-4">
      {/* Título con margen superior para mejor separación */}
      <h2 className="text-5xl text-center font-extrabold text-[#000000] leading-tight mb-4">
        <span className="text-[#27ae60]">WHY </span> LEARN WITH{" "}
        <span className="text-[#0056b3]">US?</span>
      </h2>

      {/* Swiper Carrusel */}
      <div className="max-w-6xl mx-auto px-4 relative flex flex-col items-center" style={{maxWidth: '1500px'}}>
        <div className="relative w-full flex items-center" style={{minHeight: '320px'}}>
          <Swiper
            modules={[Pagination, Autoplay, Navigation]}
            spaceBetween={20}
            slidesPerView={1}
            breakpoints={{
              640: { slidesPerView: 1 },
              768: { slidesPerView: 2 },
              1024: { slidesPerView: 3 },
            }}
            pagination={{ clickable: true, el: '.swiper-pagination-custom' }}
            autoplay={{ delay: 3000, disableOnInteraction: false }}
            navigation={{
              nextEl: ".swiper-button-next-custom",
              prevEl: ".swiper-button-prev-custom",
            }}
            loop
            className="w-full"
          >
            {features.map((feature, index) => (
              <SwiperSlide key={index}>
                <div className="relative rounded-lg overflow-hidden shadow-xl group transition-transform transform hover:scale-105">
                  {/* Imagen de fondo */}
                  <div
                    className="w-full h-56 sm:h-64 md:h-72 lg:h-80 bg-cover bg-center"
                    style={{
                      backgroundImage: `url(${feature.image})`,
                    }}
                  ></div>

                  {/* Superposición negra con animación de opacidad */}
                  <div className="absolute inset-0 bg-black bg-opacity-60 flex flex-col justify-center items-center text-center text-white p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <h3 className="text-lg font-bold">{feature.title}</h3>
                    <p className="text-sm mt-2">{feature.description}</p>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Flechas minimalistas SIEMPRE visibles y más cerca del carrusel, ahora con SVG centrado */}
          <div className="swiper-button-prev-custom z-20 absolute -left-4 top-1/2 -translate-y-1/2 bg-white shadow-md w-10 h-10 flex items-center justify-center rounded-full cursor-pointer hover:bg-[#27ae60] transition border border-[#0056b3]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
              <path d="M15.5 19L9.5 12L15.5 5" stroke="#0056b3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="swiper-button-next-custom z-20 absolute -right-4 top-1/2 -translate-y-1/2 bg-white shadow-md w-10 h-10 flex items-center justify-center rounded-full cursor-pointer hover:bg-[#27ae60] transition border border-[#0056b3]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
              <path d="M8.5 5L14.5 12L8.5 19" stroke="#0056b3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
        {/* Paginación personalizada debajo del carrusel */}
        <div className="swiper-pagination-custom flex justify-center mt-8 mb-2 w-full"></div>
      </div>
    </section>
  );
};

export default Learn;
