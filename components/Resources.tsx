"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

interface ResourceItem {
  title: string;
  image: string;
  href?: string;
}

const Resources = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  
  const resources: ResourceItem[] = [
    { title: "FAQ", image: "https://res.cloudinary.com/dzi2p0pqa/image/upload/v1761583791/izq0ey04l6fjdacb6fa2.png", href: "/FAQ" },
    { title: "FL Drivers License Check", image: "https://res.cloudinary.com/dzi2p0pqa/image/upload/v1761583880/xujgbmcz6mdn75n1metx.jpg", href: "https://services.flhsmv.gov/DLCheck/" },
    { title: "License & ID Requirements", image: "https://res.cloudinary.com/dzi2p0pqa/image/upload/v1761583926/k77vvyf6y31eswv8p3fq.jpg" },
    { title: "Florida DMV", image: "https://res.cloudinary.com/dzi2p0pqa/image/upload/v1761583962/aiftfbsg3x0k3dhojz1j.jpg", href: "https://www.flhsmv.gov/" },
    { title: "DMV Appointment", image: "https://res.cloudinary.com/dzi2p0pqa/image/upload/v1761583993/s7zpckvnonkg7e4xhe8l.jpg", href: "https://www.flhsmv.gov/locations/" },
    { title: "FL Drivers License Handbook (ENG)", image: "https://res.cloudinary.com/dzi2p0pqa/image/upload/v1761584045/ynxr2fjk7nmfz569vys7.jpg" },
    { title: "FL Manual De Manejo (ESP)", image: "https://res.cloudinary.com/dzi2p0pqa/image/upload/v1761584074/qqgidrtqyphs0sreytky.jpg" },
    { title: "Forms", image: "https://res.cloudinary.com/dzi2p0pqa/image/upload/v1761584106/zsiuw6xvhg0ldmxk7or9.jpg", href: "https://www.flhsmv.gov/forms/" },
  ];

  // Detectar si es móvil
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Inicializar desde la mitad
  useEffect(() => {
    if (isMobile) {
      setCurrentIndex(Math.floor(resources.length / 2) - 1);
    }
  }, [isMobile, resources.length]);

  // Funciones para manejar el deslizamiento táctil
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      // Deslizar a la izquierda - ir al siguiente
      setCurrentIndex((prevIndex) => {
        const nextIndex = prevIndex + 1;
        if (nextIndex >= resources.length) {
          return 0;
        }
        return nextIndex;
      });
    }

    if (isRightSwipe) {
      // Deslizar a la derecha - ir al anterior
      setCurrentIndex((prevIndex) => {
        const prevIndexCalc = prevIndex - 1;
        if (prevIndexCalc < 0) {
          return resources.length - 1;
        }
        return prevIndexCalc;
      });
    }
  };

  // Duplicar resources para efecto infinito SOLO en móvil
  const duplicatedResources = isMobile ? [...resources, ...resources] : resources;

  return (
    <div style={{overflowX: isMobile ? 'hidden' : 'visible', position: 'relative', width: '100%'}}>
      <section className="bg-white py-12">
        <h2 className="text-4xl font-extrabold text-center text-[#000000] mb-8">
          Resources
        </h2>
        <div className="max-w-6xl mx-auto px-4 md:px-6 pt-4" style={{maxWidth: '1500px'}}>
          
          {/* VISTA MÓVIL: Carousel deslizable */}
          {isMobile && (
            <div className="relative overflow-hidden md:hidden">
              <div 
                className="flex transition-transform duration-500 ease-in-out gap-4 justify-start px-12 cursor-grab active:cursor-grabbing"
                style={{
                  transform: `translateX(calc(50vw - 150px - ${(currentIndex * 150)}px))`,
                }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                {duplicatedResources.map((resource, index) => (
                  <div
                    key={`${resource.title}-${index}`}
                    className="min-w-[140px] max-w-[160px] h-[200px] bg-white rounded-2xl border border-[#e5e7eb] flex flex-col items-center justify-center text-center p-3 mx-1 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-2 hover:border-[#27ae60] group cursor-pointer select-none"
                    style={{ flex: '0 0 150px' }}
                  >
                    <div className="flex items-center justify-center h-18 w-18 mb-3 rounded-full bg-white transition-all duration-300 overflow-hidden" style={{height:'72px',width:'72px'}}>
                      <Image
                        src={resource.image}
                        alt={resource.title}
                        width={64}
                        height={64}
                        className="object-contain w-12 h-12"
                        draggable={false}
                      />
                    </div>
                    {resource.href ? (
                      <Link href={resource.href} scroll={true}>
                        <h3 className="text-base font-bold text-black group-hover:text-[#0056b3] transition-colors duration-300 mt-1">
                          {resource.title}
                        </h3>
                      </Link>
                    ) : (
                      <h3 className="text-base font-bold text-black group-hover:text-[#0056b3] transition-colors duration-300 mt-1">
                        {resource.title}
                      </h3>
                    )}
                  </div>
                ))}
              </div>
              
              {/* Indicadores de progreso solo en móvil */}
              <div className="flex justify-center mt-6 gap-2">
                {resources.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      index === currentIndex ? 'bg-[#27ae60] w-6' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* VISTA PC: Una sola fila, sin wrap, tamaño fluido con clamp */}
          {!isMobile && (
            <div className="hidden md:flex gap-6 flex-nowrap justify-center">
              {resources.map((resource, index) => (
                <div
                  key={index}
                  className="bg-white rounded-2xl border border-[#e5e7eb] flex flex-col items-center justify-center text-center p-3 mx-1 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-2 hover:border-[#27ae60] group cursor-pointer
                             w-[clamp(120px,9vw,180px)] h-[clamp(170px,14vw,200px)]"
                  style={{ flex: '0 0 auto' }}
                >
                  <div className="flex items-center justify-center mb-3 rounded-full bg-white transition-all duration-300 overflow-hidden
                                  h-[clamp(48px,4.8vw,72px)] w-[clamp(48px,4.8vw,72px)]">
                    <Image
                      src={resource.image}
                      alt={resource.title}
                      width={72}
                      height={72}
                      className="object-contain w-[clamp(36px,3.6vw,56px)] h-[clamp(36px,3.6vw,56px)]"
                    />
                  </div>
                  {resource.href ? (
                    <Link href={resource.href} scroll={true}>
                      <h3 className="text-base font-bold text-black group-hover:text-[#0056b3] transition-colors duration-300 mt-1">
                        {resource.title}
                      </h3>
                    </Link>
                  ) : (
                    <h3 className="text-base font-bold text-black group-hover:text-[#0056b3] transition-colors duration-300 mt-1">
                      {resource.title}
                    </h3>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Resources;
