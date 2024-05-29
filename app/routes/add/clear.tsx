import React from "react";
import { ActionFunctionArgs, json } from "@remix-run/cloudflare";
import { useFetcher, Form } from "@remix-run/react";
import { drizzle } from "drizzle-orm/d1";
import { students } from "app/drizzle/schema.server";
import {
  S3Client,
  ListObjectsV2Command,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";

// AWS S3 client configuration
const S3 = new S3Client({
  region: "auto",
  endpoint: `https://bbe111b6726945b110b32ab037e4c232.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: "e74dc595a3b18668b5e9f6795929cf3c",
    secretAccessKey:
      "b3c68d4ced82ad17a964d22648266c0a0b6fc55d0cf8b5f775e1183b4616b065",
  },
});

// Action to clear the database and S3 bucket
export const action = async ({ context }: ActionFunctionArgs) => {
  console.log("Hello Hello");
  const db = drizzle(context.cloudflare.env.DB);

  try {
    // Clear the database
    await db.delete(students).execute();

    // List objects in the S3 bucket
    const { Contents } = await S3.send(
      new ListObjectsV2Command({ Bucket: "who-profile-pictures" })
    );

    if (Contents?.length) {
      // Prepare objects for deletion
      const deleteParams = {
        Bucket: "who-profile-pictures",
        Delete: {
          Objects: Contents.map((item) => ({ Key: item.Key })),
        },
      };

      // Delete objects from the S3 bucket
      await S3.send(new DeleteObjectsCommand(deleteParams));
    }

    return json(
      { message: "Database and S3 bucket cleared successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to clear database and S3 bucket", error);
    return json(
      { message: "Failed to clear database and S3 bucket" },
      { status: 500 }
    );
  }
};

// Component to render the clear button
export function ClearBoth() {
  const fetcher = useFetcher();

  const handleClear = () => {
    fetcher.submit(null, { method: "post" });
  };

  return (
    <div className="flex justify-center mt-4">
      <Form method="post" className="mt-6">
        <button
          onClick={handleClear}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          Clear Database and S3 Bucket
        </button>
      </Form>
    </div>
  );
}
