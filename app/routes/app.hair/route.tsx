import {
  ActionFunctionArgs,
  json,
  LoaderFunctionArgs,
} from "@remix-run/cloudflare";
import { Form, useLoaderData } from "@remix-run/react";
import { drizzle } from "drizzle-orm/d1";
import { test_table } from "app/drizzle/schema.server";

import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { doTheDbThing } from "lib/dbThing";

const S3 = new S3Client({
  region: "auto",
  endpoint: `https://bbe111b6726945b110b32ab037e4c232.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: "e74dc595a3b18668b5e9f6795929cf3c",
    secretAccessKey:
      "b3c68d4ced82ad17a964d22648266c0a0b6fc55d0cf8b5f775e1183b4616b065",
  },
});

// This function fetches test_table from D1 and images from R2
export async function loader({ request, context }: LoaderFunctionArgs) {
  // call this at the top of all your loaders that need auth and db
  const { db } = await doTheDbThing({ context });

  const resourceList = await db
    .select({
      id: test_table.id,
      title: test_table.title,
    })
    .from(test_table)
    .orderBy(test_table.id);

  const { Contents } = await S3.send(
    new ListObjectsV2Command({ Bucket: "who-profile-pictures" })
  );

  const imageList = await Promise.all(
    Contents?.map(async (file) => {
      if (file.Key) {
        return getSignedUrl(
          S3,
          new GetObjectCommand({
            Bucket: "who-profile-pictures",
            Key: file.Key,
          }),
          { expiresIn: 3600 }
        ); // Expires in 1 hour
      }
      return null;
    }) || []
  );

  console.log(
    await S3.send(new ListObjectsV2Command({ Bucket: "who-profile-pictures" }))
  );
  return json({
    resourceList,
    imageList: imageList.filter((url) => url !== null), // Pass the list of signed image URLs to the frontend
  });
}

interface StylistCardProps {
  name: string;
  description: string;
  link: string;
  image: string;
}

const StylistCard: React.FC<StylistCardProps> = ({
  name,
  description,
  link,
  image,
}) => (
  <div className="flex flex-col items-center bg-white rounded-lg p-6 shadow-sm text-center hover:shadow-md transition-shadow">
    <img
      src={image}
      alt={name}
      className="w-full h-48 object-cover rounded-md mb-4"
    />
    <h3 className="text-xl font-semibold mb-2">{name}</h3>
    <p className="text-gray-600 mb-4">{description}</p>
    <a href={link} className="text-blue-500 hover:underline">
      View Profile
    </a>
  </div>
);

export default function HaircutsBeautyServices() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center text-gray-800">
      <div className="flex flex-col px-6 space-y-6 text-center pt-24 md:pt-32">
        <h1 className="text-4xl font-bold leading-tight">
          Haircuts & Beauty Services
        </h1>
        <p>
          Discover talented student hairstylists offering a range of beauty
          services. Connect with them for a fresh new look right on campus.
        </p>
      </div>

      <div className="pt-24 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-4xl px-4">
        <StylistCard
          name="Alex Johnson"
          description="Experienced in modern haircuts and styling. Specializes in men's and women's cuts."
          link="/app/stylists/alex-johnson"
          image="/student.webp" // replace with the actual path to the generated images
        />
        <StylistCard
          name="Jamie Lee"
          description="Professional makeup artist and hairstylist. Perfect for events and everyday looks."
          link="/app/stylists/jamie-lee"
          image="/student2.webp" // replace with the actual path to the generated images
        />
        <StylistCard
          name="Taylor Smith"
          description="Expert in braiding, extensions, and natural hair care. Book your appointment today."
          link="/app/stylists/taylor-smith"
          image="/path/to/your/image3.jpg" // replace with the actual path to the generated images
        />
        <StylistCard
          name="Jordan Brown"
          description="Specializes in color treatments and creative hair designs. Transform your style with Jordan."
          link="/app/stylists/jordan-brown"
          image="/path/to/your/image4.jpg" // replace with the actual path to the generated images
        />
        <StylistCard
          name="Casey White"
          description="Offers a range of beauty services including facials and waxing. Pamper yourself with Casey."
          link="/app/stylists/casey-white"
          image="/path/to/your/image5.jpg" // replace with the actual path to the generated images
        />
        <StylistCard
          name="Morgan Taylor"
          description="Skilled in updos and formal event hairstyles. Look your best for any occasion."
          link="/app/stylists/morgan-taylor"
          image="/path/to/your/image6.jpg" // replace with the actual path to the generated images
        />
      </div>
    </div>
  );
}
