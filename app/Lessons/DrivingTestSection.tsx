"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Poppins } from "next/font/google";
import { motion } from "framer-motion";
import Link from "next/link";
import AuthenticatedButton from "@/components/AuthenticatedButton";

// Fuente moderna y elegante
const poppins = Poppins({
  weight: ["400", "600", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
});

// Animación de entrada
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

// Interfaz para la colección
interface CollectionItem {
  _id: string;
  title: string;
  description: string;
  price: number;
  buttonLabel?: string;
  media?: string[];
}

const DrivingTestSection = () => {
  const [collections, setCollections] = useState<CollectionItem[]>([]);

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const response = await fetch("/api/collections");
        const data = await response.json();
        setCollections(data);
      } catch (error) {
        console.error("Error fetching collections:", error);
      }
    };

    fetchCollections();
  }, []);

  return (
    <section
      id="driving-test-section"
      className={`${poppins.variable} bg-gray-100 py-20 px-10`}
    >
      <motion.h2
        className="text-5xl font-extrabold text-center mb-16 leading-tight"
        initial="hidden"
        whileInView="visible"
        variants={fadeIn}
        viewport={{ once: true }}
      >
        <span className="text-[#27ae60]">DRIVING</span>{" "}
        <span className="text-black">TEST</span>
      </motion.h2>

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-2 items-start">
        <motion.div
          className="relative flex flex-col items-start"
          initial="hidden"
          whileInView="visible"
          variants={fadeIn}
          viewport={{ once: true }}
        >
          <div className="relative flex justify-center items-end">
            <div className="relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-500 group hover:brightness-105">
              <Image
                src="https://res.cloudinary.com/dzi2p0pqa/image/upload/v1761584688/esawuypoy3jxaiwov6bj.jpg"
                alt="Driving Test"
                width={430}
                height={320}
                className="rounded-2xl object-cover transition-all duration-500 group-hover:scale-110"
              />
            </div>
          </div>
        </motion.div>

        <motion.div
          className="space-y-6 flex flex-col justify-start w-[95%] mr-auto"
          initial="hidden"
          whileInView="visible"
          variants={fadeIn}
          viewport={{ once: true }}
        >
          <div className="hidden md:block text-left">
            <Link href="/Book-Now" passHref>
              <div className="bg-[#0056b3] text-white font-semibold px-6 py-2 w-fit self-start rounded-full shadow-lg shadow-gray-700 hover:shadow-black hover:bg-[#27ae60] hover:-translate-y-1 transition transform duration-300 ease-out cursor-pointer active:translate-y-1">
                Book Driving Test
              </div>
            </Link>
          </div>
          <h3 className="text-2xl font-bold text-black">
            We give the Road Test !!
          </h3>

          <p className="text-ms text-black text-xm leading-relaxed">
            Affordable Driving Traffic School is a Third Party Agency authorized
            by the Florida Department of Highway Safety and Motor Vehicles to
            issue the Road Test. There is no need to wait weeks to book an
            appointment at the DMV for testing. We have availability within a
            week to take your test with us.
          </p>

          <div className="bg-white p-6 rounded-xl shadow-md w-full">
            <h3 className="text-xl font-semibold text-[#27ae60]">
              This Service Includes:
            </h3>
            <ul className="list-disc list-inside text-black mt-3 space-y-2">
              <li>Vehicle for the Road Test</li>
              <li>Assistance with DMV test booking process</li>
            </ul>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md w-full">
            <h3 className="text-xl font-semibold text-[#0056b3]">
              You must bring:
            </h3>
            <ul className="list-disc list-inside text-black mt-3 space-y-2">
              <li>Learner&apos;s permit</li>
              <li>
                Required documentation (if under 18 year old, parent consent
                form)
              </li>
              <li>Immigration documents (if applicable)</li>
              <li>Glasses or contact lenses if required</li>
            </ul>
          </div>
        </motion.div>
      </div>

      {/* 📌 Sección de Cuadros de MongoDB */}
      <div className="max-w-7xl mx-auto mt-14 px-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {collections.map((item) => (
            <div
              key={item._id}
              className="p-6 bg-white rounded-xl shadow-md border border-gray-300 flex flex-col items-center"
            >
              <h3 className="text-lg text-black font-semibold text-center">
                {item.title}
              </h3>
              <p className="text-sm text-black text-center">
                {item.description}
              </p>
              <p className="text-xl font-bold text-[#27ae60] text-center mt-2">
                ${item.price}
              </p>
              <div className="flex justify-center w-full mt-3">
                <AuthenticatedButton
                  type="buy"
                  actionData={{
                    itemId: item._id,
                    title: item.title,
                    price: item.price,
                  }}
                  label={item.buttonLabel || "Add to Cart"}
                  className="w-full bg-[#27ae60] text-white font-semibold px-6 py-2 rounded-full shadow-lg hover:shadow-black hover:bg-[#0056b3] hover:-translate-y-1 transition duration-300"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DrivingTestSection;
