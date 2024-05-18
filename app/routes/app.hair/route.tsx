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

const imageList = [
  "image1.jpg", // replace with your image URLs
  "image2.jpg",
  "image3.jpg",
  "image4.jpg",
  "image5.jpg",
  "image6.jpg",
];

const resourceList = [
  { id: 1, title: "Resource 1" }, // replace with your resources
  { id: 2, title: "Resource 2" },
];

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
          link="/stylists/alex-johnson"
          image="/student.webp" // replace with the actual path to the generated images
        />
        <StylistCard
          name="Jamie Lee"
          description="Professional makeup artist and hairstylist. Perfect for events and everyday looks."
          link="/stylists/jamie-lee"
          image="/student2.webp" // replace with the actual path to the generated images
        />
        <StylistCard
          name="Taylor Smith"
          description="Expert in braiding, extensions, and natural hair care. Book your appointment today."
          link="/stylists/taylor-smith"
          image="/path/to/your/image3.jpg" // replace with the actual path to the generated images
        />
        <StylistCard
          name="Jordan Brown"
          description="Specializes in color treatments and creative hair designs. Transform your style with Jordan."
          link="/stylists/jordan-brown"
          image="/path/to/your/image4.jpg" // replace with the actual path to the generated images
        />
        <StylistCard
          name="Casey White"
          description="Offers a range of beauty services including facials and waxing. Pamper yourself with Casey."
          link="/stylists/casey-white"
          image="/path/to/your/image5.jpg" // replace with the actual path to the generated images
        />
        <StylistCard
          name="Morgan Taylor"
          description="Skilled in updos and formal event hairstyles. Look your best for any occasion."
          link="/stylists/morgan-taylor"
          image="/path/to/your/image6.jpg" // replace with the actual path to the generated images
        />
      </div>

      {/* <div className="pt-24 w-full max-w-4xl px-4">
          <h2 className="text-3xl pt-12 text-center font-semibold">Image Gallery</h2>
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
          <Form method="post" encType="multipart/form-data" className="mt-6">
            <div className="flex flex-col items-center">
              <label className="mb-4">
                Upload Image: <input type="file" name="image" required />
              </label>
              <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Upload</button>
            </div>
          </Form>
          <h2 className="text-3xl pt-12 text-center font-semibold">Resources</h2>
          <ul className="list-disc list-inside mt-4">
            {resourceList.map((resource) => (
              <li key={resource.id}>
                {resource.title}
              </li>
            ))}
          </ul>
          <Form method="POST" className="mt-6">
            <div className="flex flex-col items-center">
              <label className="mb-4">
                Title: <input type="text" name="title" required className="border rounded px-2 py-1" />
              </label>
              <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Add Resource</button>
            </div>
          </Form>
        </div> */}
    </div>
  );
}

export async function action({ request, context }: ActionFunctionArgs) {
  const formData = await request.formData();
  const db = drizzle(context.cloudflare.env.DB);

  // Handle resource addition
  const title = formData.get("title");
  if (title) {
    await db
      .insert(test_table)
      .values({ title: title as string })
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
