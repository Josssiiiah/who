import React from "react";
import {
  FaCut,
  FaBook,
  FaPaintBrush,
  FaGuitar,
  FaLaptopCode,
  FaShoppingBag,
  FaBreadSlice,
} from "react-icons/fa";
import { Link } from "@remix-run/react";
import { Button } from "~/components/ui/button";

import { useNavigate } from "@remix-run/react";

interface CategoryCardProps {
  icon: React.ReactNode;
  title: string;
  link: string;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ icon, title, link }) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(link);
  };

  return (
    <div
      onClick={handleCardClick}
      className="flex flex-col items-center border border-black bg-white rounded-lg p-6 sm:px-4 sm:py-36 shadow-sm text-center hover:shadow-2xl transition-shadow cursor-pointer"
    >
      <div className="text-4xl text-gray-600 mb-4">{icon}</div>
      <h3 className="text-xl font-semibold">{title}</h3>
    </div>
  );
};

export default function Grid() {
  return (
    <div className="min-h-screen flex flex-col items-center text-gray-800">
      <div className="pt-24 grid grid-cols-2 lg:grid-cols-3 gap-6 w-full px-4">
        <CategoryCard
          icon={<FaCut />}
          title="Haircuts & Beauty Services"
          link="/app/hair"
        />
        <CategoryCard
          icon={<FaBook />}
          title="Tutoring & Academic Help"
          link="/app/tutoring"
        />
        <CategoryCard
          icon={<FaPaintBrush />}
          title="Artwork & Design"
          link="/app/art"
        />
        <CategoryCard
          icon={<FaBreadSlice />}
          title="Food & Coooking"
          link="/app/music"
        />
        <CategoryCard
          icon={<FaLaptopCode />}
          title="Tech Support & Coding"
          link="/app/tech"
        />
        <CategoryCard
          icon={<FaShoppingBag />}
          title="Errands & Odd Jobs"
          link="/app/errands"
        />
      </div>
    </div>
  );
}
