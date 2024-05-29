import { json, LoaderFunctionArgs } from "@remix-run/cloudflare";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { eq } from "drizzle-orm";
import { doTheDbThing } from "lib/dbThing";
import { students } from "~/drizzle/schema.server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const S3 = new S3Client({
  region: "auto",
  endpoint: `https://bbe111b6726945b110b32ab037e4c232.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: "e74dc595a3b18668b5e9f6795929cf3c",
    secretAccessKey:
      "b3c68d4ced82ad17a964d22648266c0a0b6fc55d0cf8b5f775e1183b4616b065",
  },
});

export async function loader({ params, context }: LoaderFunctionArgs) {
  const { db } = await doTheDbThing({ context } as any);
  const name = params.name;

  if (!name) {
    throw new Response("Name parameter is missing", { status: 400 });
  }

  const studentInfo = await db
    .select({
      id: students.id,
      name: students.name,
      category: students.category,
      description: students.description,
      image_url: students.image_url,
    })
    .from(students)
    .where(eq(students.name, name))
    .all();

  if (studentInfo.length === 0) {
    throw new Response("Student not found", { status: 404 });
  }

  const student = studentInfo[0];

  const signedUrl = await getSignedUrl(
    S3,
    new GetObjectCommand({
      Bucket: "who-profile-pictures",
      Key: student.image_url!,
    }),
    { expiresIn: 3600 }
  );

  return json({ studentInfo: { ...student, signedUrl } });
}

const clientPhotos = [
  "/image1.png",
  "/image2.png",
  "/image3.png",
  "/student.webp",
  "/student2.webp",
];

export default function Name() {
  const { studentInfo } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  if (!studentInfo) {
    console.log("no studentInfo :(");
    return <div>No student information found</div>;
  }

  const formattedName = studentInfo.name!.replace(/-/g, " ");

  return (
    <div className="bg-gray-100 sm:py-10 min-h-full flex flex-col items-center ">
      <div className="w-full max-w-4xl bg-white shadow-lg rounded-lg">
        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 h-48 flex justify-center relative">
          <div className="absolute top-24 bg-gradient-to-r from-purple-500 to-indigo-600 p-1 rounded-full">
            <img
              src={studentInfo.signedUrl}
              alt={formattedName}
              className="w-44 h-44 rounded-full border-4 border-white bg-white"
            />
          </div>
        </div>

        <div className="relative pt-16 pb-8 px-8">
          <button
            onClick={() => navigate("/app/hair")}
            className="absolute top-0 left-0 mt-4 ml-4 bg-blue-500 text-white px-4 py-2 rounded"
          >
            Back
          </button>
          <div className="text-center pt-10">
            
            <h1 className="text-3xl font-bold text-gray-900">
              {formattedName}
            </h1>
            <div className="mt-6">
              <p className="mt-2 text-gray-600">{studentInfo.description}</p>
            </div>
          </div>
        </div>
        <div className="pt-8 pb-8 px-8">
          <h2 className="text-xl font-semibold text-gray-800">Gallery</h2>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4">
            {clientPhotos.map((photo, index) => (
              <img
                key={index}
                src={photo}
                alt={`Client ${index + 1}`}
                className="w-full h-auto rounded-lg shadow-md"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
