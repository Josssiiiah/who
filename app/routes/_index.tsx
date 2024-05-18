import { Link } from "@remix-run/react";
import { Button } from "~/components/ui/button";
import { useNavigate } from "@remix-run/react";

import { FaRegFileAlt, FaFilePdf, FaPen, FaCut, FaBook, FaPaintBrush } from 'react-icons/fa';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => (
  <div className="flex items-center bg-white rounded-lg p-4 shadow-sm">
    <div className="text-3xl text-gray-600 mr-4">
      {icon}
    </div>
    <div>
      <h3 className="text-xl font-semibold mb-1">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  </div>
);

export default function Index() {
  const navigate = useNavigate();

  const handleButtonClick = () => {
    navigate("/app/grid");
  };


  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center text-gray-800">
      <div className="flex flex-col px-4 space-y-6 text-center pt-48 md:pt-64">
        <h1 className="text-3xl font-bold"> Connecting the <br />Stanford gig economy </h1>
        <p>From haircuts to homework help, graphic design to guitar lessons, 
        find or post opportunities tailored to your needs. </p>
        <Button onClick={handleButtonClick}>
          <Link
            to="/app/grid"
            className="px-4 py-2 rounded"
          >
            Launch
          </Link>
        </Button>
      </div>

      <div className="pt-24 space-y-4 w-full max-w-md">
        <FeatureCard 
          icon={<FaCut />} 
          title="Haircuts & Beauty Services" 
          description="Offering or looking for a fresh haircut or beauty services? Connect with talented individuals on campus." 
        />
        <FeatureCard 
          icon={<FaBook />} 
          title="Tutoring & Academic Help" 
          description="Need help with your studies or want to offer tutoring services? Find the right match here." 
        />
        <FeatureCard 
          icon={<FaPaintBrush />} 
          title="Artwork & Design" 
          description="Whether you're an artist or need some creative work done, discover or provide artistic services." 
        />
      </div>
    </div>
  );
}
