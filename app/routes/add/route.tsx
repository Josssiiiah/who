import {
  ActionFunctionArgs,
  json,
  LoaderFunctionArgs,
} from "@remix-run/cloudflare";
import { Form, useLoaderData } from "@remix-run/react";
import { drizzle } from "drizzle-orm/d1";
import { students, students } from "app/drizzle/schema.server";


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

// This function fetches students from D1 and images from R2
export async function loader({ request, context }: LoaderFunctionArgs) {
  // call this at the top of all your loaders that need auth and db
  const { db } = await doTheDbThing({ context });

  const resourceList = await db
    .select({
      id: students.id,
      name: students.name,
      category: students.category,
      description: students.description,
      image_url: students.image_url
    })
    .from(students)
    .orderBy(students.id);

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

export default function Add() {
  const { resourceList, imageList } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-gray-100 max-w-[1440px] px-12 flex flex-col items-center text-gray-800">
      <div className="flex pt-24">
        <h1 className="text-6xl font-bold">Add a new Student</h1>
      </div>
      <div className="flex flex-row items-center justify-center w-full">
        <div className="w-1/2 p-4">
          <h1 className="text-2xl text-center mb-4">Upload Image</h1>
          <Form method="post" encType="multipart/form-data" className="mt-6">
            <div className="flex flex-col items-center">
              <label className="mb-4">
                Upload Image: <input type="file" name="image" required />
              </label>
              <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded"
              >
                Upload
              </button>
            </div>
          </Form>
        </div>
        <div className="w-1/2 p-4">
          <h1 className="text-2xl text-center mb-4">Fill in Info</h1>
          <Form method="POST" className="mt-6">
            <div className="flex flex-col items-center">
              <label className="mb-4">
                Name:
                <input
                  type="text"
                  name="name"
                  required
                  className="border rounded px-2 py-1"
                />
              </label>
              <label className="mb-4">
                Category:
                <input
                  type="text"
                  name="category"
                  required
                  className="border rounded px-2 py-1"
                />
              </label>
              <label className="mb-4">
                Description:
                <input
                  type="text"
                  name="description"
                  required
                  className="border rounded px-2 py-1"
                />
              </label>

              <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded"
              >
                Add 
              </button>
            </div>
          </Form>
        </div>
      </div>
      <div className="pt-24 w-full max-w-4xl px-4">
        <h2 className="text-3xl pt-12 text-center font-semibold">
          Image Gallery
        </h2>

        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {imageList.map((url, index) => (
            <li key={index} className="w-full h-auto">
              <img
                src={url}
                alt={`Artwork ${index}`}
                className="w-full h-auto rounded-lg"
              />
            </li>
          ))}
        </ul>

        <h2 className="text-3xl pt-12 text-center font-semibold">Resources</h2>
        <ul className="list-disc list-inside mt-4">
          {resourceList.map((resource) => (
            <li key={resource.id}>{resource.name}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export async function action({ request, context }: ActionFunctionArgs) {
  const formData = await request.formData();
  const db = drizzle(context.cloudflare.env.DB);

  // Handle resource addition
  const name = formData.get("name");
  const category = formData.get("category");
  const description = formData.get("description");
  

  if (name) {
    await db
      .insert(students)
      .values({ name: name as string,
        category: category as string,

            
       })
      .execute();
    return json({ message: "Resource added" }, { status: 201 });
  }

  // Handle image upload
  const file = formData.get("image");
  if (file instanceof File) {
    // Prepare the payload for the S3 upload

    // write my own fie name system, then store this in db as newName : path/to/file in R2 bucket
    const fileName = file.name;
    const fileStream = file.stream();
    const fileType = file.type;

    // try {
    //   await S3.send(
    //     new PutObjectCommand({
    //       Bucket: "who-profile-pictures", // Specify your S3 bucket name
    //       Key: fileName,
    //       Body: fileStream,
    //       ContentType: fileType,
    //     })
    //   );
    //   return json(
    //     { message: "Image uploaded to S3 successfully" },
    //     { status: 201 }
    //   );
    // } catch (error) {
    //   console.error("Failed to upload to S3", error);
    //   return json({ message: "Failed to upload image" }, { status: 500 });
    // }
    try {
      const upload = new Upload({
        client: S3,
        params: {
          Bucket: "who-profile-pictures",
          Key: fileName,
          Body: fileStream,
          ContentType: fileType,
        },
      });

      upload.on("httpUploadProgress", (progress) => {
        console.log(`Uploaded ${progress.loaded} of ${progress.total} bytes`);
      });

      await upload.done();
      console.log("uploading asdfa");
      return json(
        { message: "Image uploaded to S3 successfully" },
        { status: 201 }
      );
    } catch (error) {
      console.error("Failed to upload to S3", error);
      return json({ message: "Failed to upload image" }, { status: 500 });
    }
  }

  return json({ message: "No operation performed" }, { status: 400 });
}
