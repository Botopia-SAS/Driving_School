"use client";
import React from "react";

const Policypage = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center px-6 py-12">
      {/* Botón Back debajo del header */}
      <div className="w-full flex justify-start">
        <button
          onClick={() => window.close()}
          className="mt-20 ml-4 mb-4 flex items-center px-4 py-2 bg-white border-2 border-green-600 rounded-md text-green-600 font-semibold text-base shadow hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-400"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="mr-2"
          >
            <path
              d="M12.5 15L8 10L12.5 5"
              stroke="#27ae60"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back
        </button>
      </div>
      <div className="bg-white shadow-md rounded-lg p-8 max-w-4xl w-full border border-gray-300">
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
  );
};

export default Policypage;
