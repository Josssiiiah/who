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

  "/barber1.png",
  "/barber2.png",
  "/barber3.png",
  "/barber4.png",
  "/barber5.png"

];

const capitalizeName = (name: string) => {
  return name
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export default function Name() {
  const { studentInfo } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  if (!studentInfo) {
    console.log("no studentInfo :(");
    return <div>No student information found</div>;
  }

  const formattedName = capitalizeName(studentInfo.name!.replace(/-/g, " "));

  return (
    <div className="bg-gray-100 w-full min-h-full flex flex-col items-center ">
      <div className="w-full bg-white rounded-lg">
        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 h-48 flex justify-center relative">
          <div className="absolute top-16 bg-gradient-to-r from-purple-500 to-indigo-600 p-1 rounded-full">
            <img
              src={studentInfo.signedUrl}
              alt={formattedName}
              className="w-60 h-60 rounded-full border-4 border-white bg-white"
            />
          </div>
        </div>

        <div className="relative pt-24 pb-8 px-8">
          <button
            onClick={() => navigate("/app/hair")}
            className="absolute top-0 left-4 mt-4 ml-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-8 py-2 rounded"
          >
            Back
          </button>
          <div className="text-center pt-10">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
              {formattedName}
            </h1>

            <p className="pt-4 text-center sm:text-left text-gray-600">
              {studentInfo.description}
            </p>
          </div>
        </div>
        <div className="pt-8 pb-8 px-8">
          <h2 className="text-xl font-semibold text-gray-800">Gallery</h2>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4">
            {clientPhotos.map((photo, index) => (
              <div
                key={index}
                className="relative w-full pb-[75%] overflow-hidden"
              >
                <img
                  src={photo}
                  alt={`Client ${index + 1}`}
                  className="absolute top-0 left-0 w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
