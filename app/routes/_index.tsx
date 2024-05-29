import { Form, useActionData, useLoaderData, useNavigate } from "@remix-run/react";
import { json, LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { doTheDbThing } from "lib/dbThing";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Link } from "@remix-run/react";
import { signups } from "~/drizzle/schema.server";
import { useToast } from "~/components/ui/use-toast"


import { FaCut, FaBook, FaPaintBrush, FaUtensils, FaLaptopCode, FaTasks } from "react-icons/fa";
import { useEffect } from "react";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
}) => (
  <div className="flex items-center bg-white rounded-lg p-4 shadow-sm">
    <div className="text-3xl text-gray-600 mr-4">{icon}</div>
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
  const actionData = useActionData<typeof action>();
  const { toast } = useToast();

  useEffect(() => {
    if (actionData && 'success' in actionData) {
      toast({
        title: "Success",
        description: "Successfully joined the waitlist!",
      });
    } else if (actionData && 'error' in actionData) {
      toast({
        title: "Error",
        description: actionData.error,
      });
    }
  }, [actionData, toast]);

  return (
    <div className="min-h-screen bg-gray-100 px-6 sm:px-12 flex flex-col items-center text-gray-800">
      <div className="flex flex-col space-y-8 items-center text-center pt-36 md:pt-40">
      <h1 className="text-4xl py-2 md:text-7xl font-bold bg-gradient-to-r from-black to-gray-400 bg-clip-text text-transparent">
          Connecting the <br />
          Stanford gig economy
        </h1>
        <p className="md:text-xl">
          Discover opportunities, from haircuts to homework, within Stanford's
          entrepreneurial network.
        </p>
        <Form method="post" className="flex flex-row gap-6">
          <Input className="sm:w-96 h-12" type="email" name="email" placeholder="Enter your email" required />
          <Button className="h-12" type="submit">
            Join the Waitlist!
          </Button>
        </Form>
      </div>
      {/* <Button className="w-72 h-12" onClick={handleButtonClick}>
        <Link to="/app/grid" className="px-4 py-2 rounded">
          Launch
        </Link>
      </Button> */}

      <div className="flex flex-col sm:flex-row gap-2 mt-20 sm:mt-18 border-4 rounded-xl border-black">
        <div className="flex-1">
          <img
            className="w-full h-auto rounded-lg"
            src="/main1.png"
            alt="Main Image 1"
          />
        </div>
        <div className="flex-1">
          <img
            className="w-full h-auto rounded-lg"
            src="/main2.png"
            alt="Main Image 2"
          />
        </div>
      </div>
      <div className="pt-24 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mb-20 gap-6 w-full max-w-6xl px-4">
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
  <FeatureCard
    icon={<FaUtensils />}
    title="Food & Cooking"
    description="Looking for homemade meals or cooking lessons? Connect with student chefs and culinary enthusiasts."
  />
  <FeatureCard
    icon={<FaLaptopCode />}
    title="Tech Support & Coding"
    description="Need help with tech issues or coding projects? Find tech-savvy students to assist you."
  />
  <FeatureCard
    icon={<FaTasks />}
    title="Errands & Odd Jobs"
    description="Need a hand with errands or small tasks? Discover students offering various services to help you out."
  />
</div>
    </div>
  );
}


// Action function to handle form submissions
export async function action({ request, context }: ActionFunctionArgs) {
  const { db } = await doTheDbThing({ context });


  const formData = await request.formData();
  const email = formData.get("email");

  if (typeof email !== "string" || !email.includes("@")) {
    return json({ error: "Invalid email address" }, { status: 400 });
  }

  await db.insert(signups).values({ email }).execute();

  return json({ success: true });
}
