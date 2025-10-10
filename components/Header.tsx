"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import CartIcon from "./CartIcon";
import { useAuth } from "@/components/AuthContext";
import LoginModal from "@/components/LoginModal";
import { useCart } from "@/app/context/CartContext";
import LoadingSpinner from "./common/LoadingSpinner";
import UserDropdown from "./UserDropdown";

const Header = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [isHome, setIsHome] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const { user, setUser } = useAuth();
  const { clearCart } = useCart();
  const [showTeacherLoading, setShowTeacherLoading] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("(561) 969-0150");

  // Cargar número de teléfono desde la base de datos
  useEffect(() => {
    fetch("/api/phones")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setPhoneNumber(data.data.phoneNumber);
        }
      })
      .catch((err) => console.error("Error loading phone:", err));
  }, []);

  useEffect(() => {
    setIsHome(pathname === "/"); // Se actualiza correctamente en cada cambio de ruta
  }, [pathname]);

  // Scroll detection for home page
  useEffect(() => {
          const handleScroll = () => {
        if (isHome) {
          setIsScrolled(window.scrollY > 850);
        }
      };

    if (isHome) {
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [isHome]);

  useEffect(() => {
    if (user) {
      // User logged in
    }
  }, [user]);

  // Estado para controlar si el menú móvil está abierto
  const [isOpen, setIsOpen] = useState(false);

  // Links de navegación (para desktop y mobile)
  const navItems = [
    { name: "Home", href: "/" },
    { name: "Lessons", href: "/Lessons" },
    //{ name: "Packages", href: "/driving-lessons" },
    { name: "Classes", href: "/Classes" },
    { name: "Online Courses", href: "/OnlineCourses" },
    { name: "Driving Test", href: "/driving_test" },
    { name: "FAQ", href: "/FAQ" },
    { name: "Location", href: "/Location" },
  ];

  // Links para estudiantes
  const studentNavItems = [
    { name: "My Courses", href: "/Students" },
    { name: "My Schedule", href: "/myagenda" },
  ];

  // New teacher links for center navigation
  const teacherNavItems = [
    { name: "My Schedule", href: "/myschedule" },
    { name: "My Students", href: "/mystudents" },
  ];

  // Helper to check if estamos en sección de profesor
  const isTeacherSection = typeof pathname === "string" && (pathname.startsWith("/myschedule") || pathname.startsWith("/mystudents"));

  const hideAuthButtons = typeof pathname === "string" && pathname.startsWith("/complete-profile");

  useEffect(() => {
    if (showTeacherLoading && typeof pathname === 'string' && pathname.startsWith("/myschedule")) {
      setShowTeacherLoading(false);
    }
  }, [pathname, showTeacherLoading]);

  return (
    <header className={`fixed top-0 left-0 w-full z-50 px-4 ${isTeacherSection ? 'bg-gradient-to-br from-[#e8f6ef] via-[#f0f6ff] to-[#eafaf1]' : 'bg-transparent'}`}>
      {/* Top Row with Phone and Login */}
      <div className={`${isTeacherSection ? 'bg-gradient-to-br from-[#e8f6ef] via-[#f0f6ff] to-[#eafaf1]' : 'bg-transparent'} flex lg:justify-center gap-4 items-center py-2 text-sm font-sans relative`}>
        <Link
          href="/contact"
          className={`hidden lg:flex ${isHome ? (isScrolled ? "text-[#0056b3]" : "text-white") : "text-[#0056b3]"} font-semibold underline cursor-pointer`}
        >
          Phone: <strong className="font-semibold">{phoneNumber}</strong>
        </Link>
        {/* 🛒 Carrito de Compras con color dinámico */}
        <div>
          <CartIcon
            color={` ${isHome ? (isScrolled ? "blue" : "white") : "black"}`}
          />
        </div>
        {/* Botones Login y Sign In FIJOS en la esquina superior derecha */}
        <div className="fixed right-10 top-0 2xl:top-2 flex items-end z-50 mt-0">
          {user ? (
            <div className="relative flex flex-col items-center">
              <button
                onClick={() => setShowMenu((v) => !v)}
                className="focus:outline-none mt-0 2xl:mt-6"
              >
                {user.photo ? (
                  <Image
                    src={user.photo}
                    alt="User profile"
                    width={40}
                    height={40}
                    className="rounded-full border-2 border-white shadow-lg"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-700 flex items-center justify-center text-white text-xl font-bold border-2 border-white shadow-lg">
                    {(user.name?.[0] || 'U').toUpperCase()}
                  </div>
                )}
              </button>
              {/* Ocultar nombre del usuario para todas las resoluciones */}
              <span className="hidden">
                {user.name}
              </span>
              {showMenu && (
                <UserDropdown onClose={() => setShowMenu(false)} />
              )}
            </div>
          ) : (
            !hideAuthButtons && (
              <div className="flex gap-4">
                <button
                  className="bg-[#0056b3] text-white font-semibold px-6 py-2 rounded-full shadow-lg shadow-gray-700 hover:shadow-black hover:bg-[#27ae60] hover:-translate-y-1 transition transform duration-300 ease-out cursor-pointer active:translate-y-1"
                  onClick={() => setShowLogin(true)}
                >
                  Login
                </button>
                <button
                  className="bg-[#f39c12] text-white font-semibold px-6 py-2 rounded-full shadow-lg shadow-gray-700 hover:shadow-black hover:bg-[#e67e22] hover:-translate-y-1 transition transform duration-300 ease-out cursor-pointer active:translate-y-1"
                  onClick={() => setShowRegister(true)}
                >
                  Sign Up
                </button>
              </div>
            )
          )}
        </div>
      </div>

      {/* Bottom Row with Logo and Navigation */}
      <div className="relative max-w-7xl mx-auto px-6 py-2 flex items-center justify-between rounded-full bg-white/30 backdrop-blur-lg shadow-lg mt-0 2xl:mt-3">
        {/* Logo */}
        <div className="flex-shrink-0">
          <Link href="/">
            <Image
              src="/DV-removebg-preview.png"
              alt="Logo"
              width={70}
              height={70}
              className="
          object-contain
          w-12 h-12      /* tamaño base en móvil */
          sm:w-16 sm:h-16 /* aumenta en pantallas ≥640px */
        "
            />
          </Link>
        </div>

        {/* Menú Hamburguesa (sólo visible en móvil) */}
        <button
          className="block lg:hidden focus:outline-none"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle Menu"
        >
          <div className="w-6 h-1 bg-gray-800 mb-1" />
          <div className="w-6 h-1 bg-gray-800 mb-1" />
          <div className="w-6 h-1 bg-gray-800" />
        </button>

        {/* Centered Teacher Navigation (Desktop only) */}
        {isTeacherSection && (
          <nav className="hidden lg:flex space-x-8 mx-auto">
            {teacherNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`font-semibold text-base transition ${pathname === item.href
                  ? "text-[#27ae60] font-bold"
                  : "text-blue-800 hover:text-green-600"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        )}
        {/* Centered Student Navigation (Desktop only) */}
        {typeof pathname === "string" && pathname.startsWith("/Students") && !isTeacherSection && (
          <nav className="hidden lg:flex space-x-8 mx-auto">
            {studentNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`font-semibold text-base transition ${pathname === item.href
                  ? "text-[#27ae60] font-bold"
                  : "text-blue-800 hover:text-green-600"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        )}
        {/* Navegación Desktop */}
        {!isTeacherSection && typeof pathname === "string" && !pathname.startsWith("/Students") && (
          <nav className="hidden lg:flex space-x-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`font-medium transition ${pathname === item.href
                  ? "text-[#27ae60] font-bold"
                  : "text-[#000000] hover:text-[#0056b3]"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        )}

        {/* Botón Book Now (sólo en desktop) */}
        {!isTeacherSection && typeof pathname === "string" && !pathname.startsWith("/Students") && (
          <div className="hidden lg:block text-left">
            <Link href="/Book-Now" passHref>
              <div className="bg-[#27ae60] text-white font-semibold px-6 py-2 w-fit self-start rounded-full shadow-lg  shadow-gray-700 hover:shadow-black hover:bg-[#0056b3] hover:-translate-y-1 transition transform duration-300 ease-out cursor-pointer active:translate-y-1">
                Book Now
              </div>
            </Link>
          </div>
        )}

        {/* Navegación Móvil (Dropdown) */}
        {isOpen && (
          <div className="absolute top-full right-0  z-50">
            <div
              className="max-w-4xl  px-6 py-4
                  bg-white/90 backdrop-blur-lg shadow-lg  rounded-lg
                  
                  lg:hidden flex flex-col items-center space-y-4"
            >
              {/* Links de navegación en modo móvil */}
              <nav className="flex flex-col items-center space-y-3">
                {/* Teacher links first in mobile, only if in teacher section */}
                {isTeacherSection && teacherNavItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`font-semibold text-base transition ${pathname === item.href
                      ? "text-[#27ae60] font-bold"
                      : "text-blue-800 hover:text-green-600"
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
                {/* Main nav items */}
                {!isTeacherSection && navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)} // Cerrar al hacer clic
                    className={`font-medium transition ${pathname === item.href
                        ? "text-[#27ae60] font-bold"
                        : "text-black hover:text-gray-200"
                      }`}
                  >
                    {item.name}
                  </Link>
                ))}
              </nav>

              {/* Botón Book Now en móvil */}
              <div className="text-left">
                <Link href="/Book-Now" passHref>
                  <div className="bg-[#27ae60] text-white font-semibold px-6 py-2 w-fit self-start rounded-full shadow-lg hover:bg-[#0056b3] hover:-translate-y-1 transition transform duration-300 ease-out cursor-pointer active:translate-y-1">
                    Book Now
                  </div>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Al final del header, renderiza los modales */}
      <LoginModal 
        open={showLogin} 
        onClose={() => setShowLogin(false)} 
        initialMode="login"
        onLoginSuccess={(user) => {
          clearCart();
          localStorage.removeItem("cart");
          setUser(user);
          if (user && user.type === 'instructor') {
            setShowTeacherLoading(true);
            router.replace("/myschedule");
          }
        }} 
      />
      <LoginModal 
        open={showRegister} 
        onClose={() => setShowRegister(false)} 
        initialMode="register"
        onLoginSuccess={(user) => {
          clearCart();
          localStorage.removeItem("cart");
          setUser(user);
          if (user && user.type === 'instructor') {
            setShowTeacherLoading(true);
            router.replace("/myschedule");
          }
        }} 
      />
      {showTeacherLoading && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/80">
          <LoadingSpinner />
        </div>
      )}
    </header>
  );
};

export default Header;
