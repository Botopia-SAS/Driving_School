"use client";

import React, { useEffect, useState } from "react";
import BackButton from "../../components/BackButton";
import { useHeaderOffset } from "../../hooks/useHeaderOffset";

const Policypage = () => {
  const [isMobile, setIsMobile] = useState(false);
  const top = useHeaderOffset(96, 16);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "scrollRestoration" in window.history
    ) {
      window.history.scrollRestoration = "manual";
    }

    // Detectar mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <>
      <style jsx>{`
        .mobile-back-button {
          position: fixed !important;
          bottom: 24px !important;
          left: 24px !important;
          z-index: 9999 !important;
          display: block !important;
        }

        .desktop-back-button {
          display: none !important;
        }

        @media (min-width: 768px) {
          .mobile-back-button {
            display: none !important;
          }

          .desktop-back-button {
            display: block !important;
          }
        }
      `}</style>

      <div className="min-h-screen bg-gray-100 relative">
        {/* Botón Back para mobile - Fuera del flujo principal */}
        <div className="mobile-back-button">
          <BackButton className="px-3 py-2 text-base rounded-md shadow-lg" />
        </div>

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start gap-4 md:gap-6 pt-40 px-4 pb-20">
          {/* Botón Back para desktop - Sticky */}
          <div
            className="desktop-back-button sticky self-start shrink-0 z-40"
            style={{ top: `${top}px` }}
          >
            <BackButton className="px-4 py-2 text-base rounded-md" />
          </div>

          {/* Documento de Privacy Policy */}
          <div className="bg-white shadow-md rounded-lg p-8 w-full max-w-5xl border border-gray-300 text-black mb-20 md:mb-8">
        <h1 className="text-5xl font-extrabold text-[#222] leading-tight">
          <span className="text-[#27ae60]">PRIVACY</span>
          <span className="text-black"> POLICY</span>
        </h1>

        {/* 📌 SECCIÓN: What is Collected */}
        <section className="mb-8 mt-4">
          <h2 className="text-xl font-bold text-black">What is Collected</h2>
          <p className="text-black mt-2">
            Affordable Driving Traffic School collects your personal information
            when you use the website and communicate by email or phone. This
            information can include your name, contact information, phone
            numbers, and payment information.
          </p>
          <p className="text-black mt-2">
            We may also collect non-personal information such as usage data (IP
            address, browser version, operating system) which may be released in
            anonymous form.
          </p>
          <p className="text-black mt-2">
            Any credit card details are processed securely in a PCI compliant
            payment gateway using a secure HTTPS internet connection.
          </p>
          <p className="text-black mt-2">
            Like most websites, Affordable Driving Traffic School uses cookies
            to store a user&apos;s website preferences. If you do not wish to
            have cookies placed on your computer, you should set your browser to
            refuse cookies before using our website, with the drawback that
            certain features will not function properly without the aid of
            cookies.
          </p>
        </section>

        {/* 📌 SECCIÓN: How it is used */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-black">How it is used</h2>
          <p className="text-black mt-2">
            The personal information that is collected to provide is for
            billing, identification, authentication, service improvement,
            research and website development.
          </p>
          <p className="text-black mt-2">
            Affordable Driving Traffic School will not share your personal
            information to anyone except to provide the requested services,
            develop our products, protect our rights, assist with a lawful
            investigation, comply with the law, or to contact you.
          </p>
          <p className="text-black mt-2">
            Some third party service providers such as website hosts, payment
            service providers and backup service providers may have access to
            personal information held by us that a) need to know that
            information in order to process it on behalf of Affordable Driving
            Traffic School or to provide services available at the Affordable
            Driving Traffic School website and b) have agreed not to disclose it
            to others.
          </p>
          <p className="text-black mt-2">
            Aggregated non-personal data is collected by Affordable Driving
            Traffic School may be shared with third parties in order to improve
            the Affordable Driving Traffic School website.
          </p>
        </section>

        {/* 📌 SECCIÓN: Social Media */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-black">Social Media</h2>
          <p className="text-black mt-2">
            Affordable Driving Traffic School may tag you in a photo on Social
            Media or include your Facebook profile photo if you leave a
            testimonial. You can request for your photo to not be displayed or
            shared.
          </p>
        </section>

        {/* 📌 SECCIÓN: Business Transfers */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-black">Business Transfers</h2>
          <p className="text-black mt-2">
            If Affordable Driving Traffic School was acquired, user information
            would be one of the assets transferred. Any acquirer may continue to
            use your personal information as set forth in this policy.
          </p>
        </section>

        {/* 📌 SECCIÓN: Privacy Policy Changes */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-black">
            Privacy Policy Changes
          </h2>
          <p className="text-black mt-2">
            Although most changes are likely to be minor, Affordable Driving
            Traffic School may change its Privacy Policy from time to time, and
            at Affordable Driving Traffic School sole discretion. We encourage
            users to frequently check this page for any changes to its Privacy
            Policy. Your continued use of this site after any change in this
            Privacy Policy will constitute your acceptance of such change.
          </p>
        </section>

        {/* 📌 SECCIÓN: Questions or Complaints */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-black">
            Questions or Complaints
          </h2>
          <p className="text-black mt-2">
            Your privacy is taken seriously. You can contact us at{" "}
            <a
              href="mailto:info@drivingschoolpalmbeach.com"
              className="text-[#0056b3] hover:underline"
            >
              info@drivingschoolpalmbeach.com
            </a>{" "}
            for any concerns regarding your personal information.
          </p>
        </section>
          </div>
        </div>
      </div>
    </>
  );
};

export default Policypage;
