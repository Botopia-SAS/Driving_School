"use client";

import React, { useEffect, useState } from "react";
import { FaChevronDown } from "react-icons/fa";

interface FAQItemProps {
  question: string;
  answer: string;
}

interface FAQSectionData {
  label: string;
  questions: FAQItemProps[];
}

interface FAQSections {
  [key: string]: FAQSectionData;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-gray-300 py-3">
      <button
        className="flex justify-between items-center w-full text-left font-semibold text-lg text-black"
        onClick={() => setIsOpen(!isOpen)}
      >
        {question}
        <FaChevronDown className={`transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
      </button>
      {isOpen && (
        <p className="mt-2 text-gray-600" dangerouslySetInnerHTML={{ __html: answer }} />
      )}
    </div>
  );
};

const FAQSection = ({ title, faqs }: { title: string; faqs: FAQItemProps[] }) => {
  return (
    <section className="max-w-4xl mx-auto py-12 px-6">
      <h2 className="text-3xl font-extrabold text-center mb-6 text-black">{title}</h2>
      <div className="bg-white p-6 rounded-lg shadow-lg space-y-4">
        {faqs.map((faq, index) => (
          <FAQItem key={index} {...faq} />
        ))}
      </div>
    </section>
  );
};

const FAQPage = () => {
  const [faqSections, setFaqSections] = useState<FAQSections>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/faq")
      .then(res => res.json())
      .then(data => {
        setFaqSections(data || {});
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="text-center py-20">Loading...</div>;

  // Filter out sections with empty questions arrays
  const sectionsWithContent = Object.entries(faqSections).filter(
    ([, sectionData]) => sectionData.questions && sectionData.questions.length > 0
  );

  return (
    <div className="min-h-screen bg-gray-100 pt-40 pb-20">
      <h1 className="text-4xl font-extrabold text-center mb-2">
        <span className="text-blue-600">Frequently</span>{" "}
        <span className="text-black">Asked</span>{" "}
        <span className="text-green-600">Questions</span>
      </h1>
      
      {sectionsWithContent.map(([sectionKey, sectionData], index) => (
        <div key={sectionKey}>
          <FAQSection title={sectionData.label} faqs={sectionData.questions} />
          {index < sectionsWithContent.length - 1 && <div className="py-4" />}
        </div>
      ))}
    </div>
  );
};

export default FAQPage;
