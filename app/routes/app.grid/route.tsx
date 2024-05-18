import React from 'react';
import { FaCut, FaBook, FaPaintBrush, FaGuitar, FaLaptopCode, FaShoppingBag, FaBreadSlice } from 'react-icons/fa';
import { Link } from "@remix-run/react";
import { Button } from '~/components/ui/button';

interface CategoryCardProps {
  icon: React.ReactNode;
  title: string;
  link: string;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ icon, title, link }) => (
  <Link to={link} className="flex flex-col items-center bg-white rounded-lg p-6 shadow-sm text-center hover:shadow-md transition-shadow">
    <div className="text-4xl text-gray-600 mb-4">
      {icon}
    </div>
    <h3 className="text-xl font-semibold">{title}</h3>
  </Link>
);

export default function Grid() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center text-gray-800">


      <div className="pt-24 grid grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-4xl px-4">
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
