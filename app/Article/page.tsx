"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

const ArticlesPage = () => {
  const [phoneNumber, setPhoneNumber] = useState("561 735 1615");

  // Cargar número de teléfono desde la base de datos
  useEffect(() => {
    fetch("/api/phones")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setPhoneNumber(data.data.displayNumber);
        }
      })
      .catch((err) => console.error("Error loading phone:", err));
  }, []);

  // Simulación de artículos obtenidos dinámicamente
  const articles = [
    {
      id: 1,
      title: "Information for Nervous Drivers and Parents",
      author: "Nelson",
      category: "Driving Lessons",
      image: "/Articulos/Article1.png",
      link: "/Article/Information-for-Nervous-Drivers-and-Parents",
      contact: phoneNumber,
      email: "info@drivingschoolpalmbeach.com",
    },
    // Puedes agregar más artículos aquí
  ];

  return (
    <section className="bg-white min-h-screen pt-40 px-6 md:px-12 lg:px-24">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-black mb-8 text-center">Recent Articles</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lista de artículos */}
          <div className="lg:col-span-2 space-y-6">
            {articles.map((article) => (
              <div
                key={article.id}
                className="flex flex-col md:flex-row bg-white shadow-md rounded-xl overflow-hidden p-6 hover:shadow-lg transition-shadow duration-300"
              >
                <div className="w-full md:w-24 h-24 flex-shrink-0 flex justify-center md:justify-start">
                  <Image
                    src={article.image}
                    alt={article.title}
                    width={96}
                    height={96}
                    className="rounded-lg object-cover"
                  />
                </div>
                <div className="md:ml-6 flex flex-col justify-center mt-4 md:mt-0 text-center md:text-left">
                  <span className="bg-gray-300 text-black px-3 py-1 rounded-full text-sm font-semibold w-fit mx-auto md:mx-0 mb-2">
                    {article.category}
                  </span>
                  <Link href={article.link} className="text-xl font-bold text-[#0056b3] hover:underline">
                    {article.title}
                  </Link>
                  <p className="text-gray-600 text-sm">By {article.author}</p>
                  <p className="text-gray-500 text-sm mt-2">
                    📞 {article.contact} | ✉️ {article.email}
                  </p>
                </div>
              </div>
            ))}
          </div>
          {/* Categorías */}
          <aside className="bg-gray-100 p-6 rounded-xl shadow-md h-fit text-center">
            <h2 className="text-2xl font-bold text-black mb-4">Categories</h2>
            <div className="space-y-3">
              <button className="w-full bg-gray-300 text-black px-4 py-2 rounded-md hover:bg-gray-400 transition">
                All Categories
              </button>
              <button className="w-full bg-gray-300 text-black px-4 py-2 rounded-md hover:bg-gray-400 transition">
                Driving Lessons
              </button>
              {/* Agregar más categorías si es necesario */}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
};

export default ArticlesPage;
