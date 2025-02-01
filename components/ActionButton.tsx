"use client";

import React from "react";

interface ActionButtonProps {
  type: "book" | "cart";
  id: string;
  label?: string; // Nuevo prop opcional para cambiar el texto del botón
}

const ActionButton: React.FC<ActionButtonProps> = ({ type, id, label }) => {
  const handleClick = () => {
    if (type === "cart") {
      console.log(`🛒 Adding item with ID: ${id} to cart`);
    } else {
      window.location.href = "/Book-Now";
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`font-bold text-lg py-3 px-6 rounded-full w-full transition-colors duration-300 ${
        type === "book"
          ? "bg-[#27ae60] hover:bg-[#0056b3] text-white"
          : "bg-[#0056b3] hover:bg-[#27ae60] text-white"
      }`}
    >
      {label || (type === "book" ? "Book Now" : "Add to Cart")}
    </button>
  );
};

export default ActionButton;
