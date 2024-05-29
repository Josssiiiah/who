import {
  ActionFunctionArgs,
  json,
  LoaderFunctionArgs,
} from "@remix-run/cloudflare";
import { Form, useLoaderData } from "@remix-run/react";
import { drizzle } from "drizzle-orm/d1";
import { students } from "app/drizzle/schema.server";
import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
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

export async function loader({ request, context }: LoaderFunctionArgs) {
  const { db } = await doTheDbThing({ context });

  const studentList = await db
    .select({
      id: students.id,
      name: students.name,
      category: students.category,
      description: students.description,
      image_url: students.image_url,
    })
    .from(students)
    .orderBy(students.id);

  const filteredStudentList = studentList.filter(
    (student) =>
      student.category === "Stylist" ||
      student.category === "Barber" ||
      student.category === "Hairdresser"
  );

  const signedStudentList = await Promise.all(
    filteredStudentList.map(async (student) => {
      if (student.image_url) {
        const signedUrl = await getSignedUrl(
          S3,
          new GetObjectCommand({
            Bucket: "who-profile-pictures",
            Key: student.image_url,
          }),
          { expiresIn: 3600 }
        );
        return { ...student, image_url: signedUrl };
      }
      return student;
    })
  );

  return json({
    studentList: signedStudentList,
  });
}

const capitalizeName = (name: string) => {
  return name
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const truncateDescription = (description: string, maxLength: number) => {
  if (description.length <= maxLength) {
    return description;
  }
  return description.slice(0, maxLength) + "...";
};

interface StylistCardProps {
  name: string;
  category: string;
  description: string;
  image: string;
  link: string;
}

const StylistCard: React.FC<StylistCardProps> = ({
  name,
  category,
  description,
  image,
  link,
}) => (
  <div className="flex flex-col border-2 border-gray-300 items-center bg-white rounded-lg shadow-sm text-left hover:shadow-md hover:scale-105 transform transition-transform duration-700">
    <a href={link} className="text-blue-500">
      {/* Not using object-cover, gonna have to resize on the server after upload  */}
      <img src={image} alt={name} className="w-full h-48 rounded-md mb-4" />
      <div className="p-6">
        <p className="text-gray-600 mb-2">{category}</p>
        <h3 className="text-black text-xl font-semibold mb-2">
          {capitalizeName(name)}
        </h3>

        <p className="text-gray-600 mb-4">
          {truncateDescription(description, 60)}
        </p>
      </div>{" "}
    </a>
  </div>
);

export default function HaircutsBeautyServices() {
  const { studentList } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen flex flex-col max-w-4xl mx-auto items-center text-gray-800">
      <div className="flex flex-col px-6 space-y-6 text-center pt-24 md:pt-32">
        <h1 className="text-4xl sm:text-6xl font-bold leading-tight">
          Haircuts & Beauty Services
        </h1>
        <p className="font-semi sm:text-xl">
          Discover talented student hairstylists offering a range of beauty
          services. Connect with them for a fresh new look right on campus.
        </p>
      </div>

      <div className="pt-16 grid grid-cols-2 lg:grid-cols-3 gap-6 w-full  px-4">
        {studentList.map((student) => (
          <StylistCard
            key={student.id}
            name={capitalizeName(student.name!.replace(/-/g, " "))}
            category={student.category!}
            description={student.description!}
            image={student.image_url!}
            link={`/app/stylists/${student.name}`}
          />
        ))}
      </div>
    </div>
  );
}
