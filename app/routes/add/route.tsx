import {
  ActionFunctionArgs,
  json,
  LoaderFunctionArgs,
} from "@remix-run/cloudflare";
import { Form, useFetcher, useLoaderData } from "@remix-run/react";
import { drizzle } from "drizzle-orm/d1";
import { students } from "app/drizzle/schema.server";

import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { SeedAll } from "./seed";

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { doTheDbThing } from "lib/dbThing";
import React, { useState } from "react";

const S3 = new S3Client({
  region: "auto",
  endpoint: `https://bbe111b6726945b110b32ab037e4c232.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: "e74dc595a3b18668b5e9f6795929cf3c",
    secretAccessKey:
      "b3c68d4ced82ad17a964d22648266c0a0b6fc55d0cf8b5f775e1183b4616b065",
  },
});

// Function to generate a unique name for the photo
const generateUniqueFileName = (originalName: string) => {
  const timestamp = Date.now();
  const extension = originalName.split(".").pop();
  return `profile-${timestamp}.${extension}`;
};

// This function fetches students from D1 and images from R2
export async function loader({ request, context }: LoaderFunctionArgs) {
  const { db } = await doTheDbThing({ context });

  const resourceList = await db
    .select({
      id: students.id,
      name: students.name,
      category: students.category,
      description: students.description,
      image_url: students.image_url,
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

  return json({
    resourceList,
    imageList: imageList.filter((url) => url !== null), // Pass the list of signed image URLs to the frontend
  });
}

export default function Add() {
  const { resourceList, imageList } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();

  const [fileName, setFileName] = useState<string>("");
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    description: "",
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(generateUniqueFileName(file.name));
    }
  };

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-100 max-w-[1440px] px-12 flex flex-col items-center text-gray-800">
      <div className="flex pt-24">
        <h1 className="text-6xl font-bold">Add a new Student</h1>
      </div>
      <div className="w-full max-w-4xl p-4">
        <Form method="post" encType="multipart/form-data" className="mt-6">
          <div className="flex flex-col items-center mb-6">
            <label className="mb-4">
              Upload Image:
              <input
                type="file"
                name="image"
                required
                onChange={handleFileChange}
              />
            </label>
          </div>
          <div className="flex flex-col items-center mb-4">
            <label className="mb-2">
              Name:
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="border rounded px-2 py-1"
              />
            </label>
          </div>
          <div className="flex flex-col items-center mb-4">
            <label className="mb-2">
              Category:
              <input
                type="text"
                name="category"
                required
                value={formData.category}
                onChange={handleChange}
                className="border rounded px-2 py-1"
              />
            </label>
          </div>
          <div className="flex flex-col items-center mb-4">
            <label className="mb-2">
              Description:
              <textarea
                name="description"
                required
                value={formData.description}
                onChange={handleChange}
                className="border rounded px-2 py-1"
              />
            </label>
          </div>
          <input type="hidden" name="fileName" value={fileName} />
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
          >
            Add
          </button>
        </Form>
      </div>
      <SeedAll />
      <div className="flex justify-center mt-4">
        <fetcher.Form method="post">
          <input type="hidden" name="actionType" value="clear" />
          <button
            type="submit"
            className="bg-red-500 text-white px-4 py-2 rounded"
          >
            Clear
          </button>
        </fetcher.Form>
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
            <li key={resource.id}>
              {resource.name} <br />
              {resource.image_url}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export async function action({ request, context }: ActionFunctionArgs) {
  const db = drizzle(context.cloudflare.env.DB);
  const formData = await request.formData();

  // Check the action type
  const actionType = formData.get("actionType");

  if (actionType === "clear") {
    try {
      // Clear the database
      await db.delete(students).execute();

      // Clear the S3 bucket
      const listObjects = await S3.send(
        new ListObjectsV2Command({ Bucket: "who-profile-pictures" })
      );

      if (listObjects.Contents && listObjects.Contents.length > 0) {
        const objectsToDelete = listObjects.Contents.map((item) => ({
          Key: item.Key,
        }));

        await S3.send(
          new DeleteObjectsCommand({
            Bucket: "who-profile-pictures",
            Delete: { Objects: objectsToDelete },
          })
        );
      }

      console.log("Database and S3 bucket cleared successfully")
      return json({ message: "Database and S3 bucket cleared successfully" }, { status: 200 });
    } catch (error) {
      console.error("Failed to clear database and S3 bucket", error);
      return json({ message: "Failed to clear database and S3 bucket" }, { status: 500 });
    }
  }

  // Handle resource addition
  const name = formData.get("name");
  const category = formData.get("category");
  const description = formData.get("description");
  const fileName = formData.get("fileName");
  const file = formData.get("image");

  if (file instanceof File) {
    try {
      const fileStream = file.stream();
      const fileType = file.type;

      const upload = new Upload({
        client: S3,
        params: {
          Bucket: "who-profile-pictures",
          Key: fileName as string,
          Body: fileStream,
          ContentType: fileType,
        },
      });
 
      await upload.done();
   
      const imageUrl = fileName;

      await db
        .insert(students)
        .values({
          name: name as string,
          category: category as string,
          description: description as string,
          image_url: imageUrl as string,
        })
        .execute();

      console.log("Uploaded")
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
