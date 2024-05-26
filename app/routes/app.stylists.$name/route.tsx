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
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { doTheDbThing } from "lib/dbThing";
import React, { useState } from "react";
import { toast } from "~/components/ui/use-toast";

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

const predefinedStudents = [
  {
    name: "alex-johnson",
    category: "Barber",
    description: "Hey there! I'm Alex, your go-to barber for the freshest cuts and styles. Whether you're looking for a classic fade or something trendy and new, I've got you covered. I've been cutting hair since high school and love helping people look their best. Hit me up for a cut, and let's make you look sharp!",
    image: "/student.webp",
  },
  {
    name: "jamie-lee",
    category: "Stylist",
    description: "Hi, I'm Jamie! With five years of styling experience, I can help you find the perfect look for any occasion. From casual styles to special events, I'm here to make sure you feel confident and fabulous. Let's work together to bring out your best look. Book an appointment and let's get started!",
    image: "/student2.webp",
  },
  {
    name: "taylor-smith",
    category: "Hairdresser",
    description: "Hey! I'm Taylor, and I specialize in hair coloring and treatments. If you're thinking about changing up your hair color or need some TLC for your locks, I'm your person. I love experimenting with new colors and techniques to give you a unique and vibrant look. Let's make your hair goals a reality!",
    image: "/student3.webp",
  },
  {
    name: "jordan-brown",
    category: "Hairdresser",
    description: "What's up? I'm Jordan, and I'm passionate about hair coloring and treatments. From bold colors to subtle highlights, I love helping people find their perfect shade. I also offer a range of treatments to keep your hair healthy and shiny. Come see me, and let's transform your hair together!",
    image: "/student4.webp",
  },
  {
    name: "casey-white",
    category: "Hairdresser",
    description: "Hey there! I'm Casey, your friendly hairdresser specializing in color and treatments. Whether you're going for a dramatic change or just a little touch-up, I'm here to help. I believe in making hair care fun and accessible for everyone. Let's get together and create a look you'll love!",
    image: "/student5.webp",
  },
  {
    name: "morgan-taylor",
    category: "Hairdresser",
    description: "Hi, I'm Morgan! I focus on hair coloring and treatments, and I love working with clients to find the perfect look. Whether you're looking for a bold new color or need some expert care for your hair, I'm here to help. Let's work together to keep your hair looking fabulous and healthy!",
    image: "/student6.webp",
  },
];

export default function Add() {
  const { resourceList, imageList } = useLoaderData<typeof loader>();
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

  const addAll = async () => {
    for (const student of predefinedStudents) {
      const formData = new FormData();
      formData.append("name", student.name);
      formData.append("category", student.category);
      formData.append("description", student.description);

      // Fetch the image file from the public folder
      const response = await fetch(student.image);
      const blob = await response.blob();
      const file = new File([blob], generateUniqueFileName(student.image), { type: blob.type });
      formData.append("image", file);
      formData.append("fileName", file.name);

      const result = await fetch(window.location.pathname, {
        method: "POST",
        body: formData,
      });

      if (!result.ok) {
        console.error("Failed to add student:", student.name);
      } else {
        toast({
          title: "Success",
          description: `Student ${student.name.replace(/-/g, ' ')} added successfully.`,
        });
      }
    }
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
          <button
            type="button"
            onClick={addAll}
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            Add All
          </button>
        </Form>
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
              {resource.name}
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

  // Handle resource addition
  const name = formData.get("name");
  const category = formData.get("category");
  const description = formData.get("description");
  const fileName = formData.get("fileName");
  const file = formData.get("image");

  console.log("INFO: ", fileName);

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
      console.log("Upload complete");

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
