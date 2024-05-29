import { Form, useFetcher } from "@remix-run/react";

const predefinedStudents = [
  {
    name: "alex-johnson",
    category: "Barber",
    description:
      "I'm Alex, your go-to barber for the freshest cuts and styles. Whether you're looking for a classic fade or something trendy and new, I've got you covered. I've been cutting hair since high school and love helping people look their best. Hit me up for a cut, and let's make you look sharp!",
    image: "/student.webp",
  },
  {
    name: "jamie-lee",
    category: "Stylist",
    description:
      "With five years of styling experience, I can help you find the perfect look for any occasion. From casual styles to special events, I'm here to make sure you feel confident and fabulous. Let's work together to bring out your best look. Book an appointment and let's get started!",
    image: "/jamie.jpeg",
  },
  {
    name: "taylor-smith",
    category: "Hairdresser",
    description:
      "I specialize in hair coloring and treatments. If you're thinking about changing up your hair color or need some TLC for your locks, I'm your person. I love experimenting with new colors and techniques to give you a unique and vibrant look. Let's make your hair goals a reality!",
    image: "/student2.webp",
  },
  {
    name: "jordan-brown",
    category: "Hairdresser",
    description:
      "I'm Jordan, and I'm passionate about hair coloring and treatments. From bold colors to subtle highlights, I love helping people find their perfect shade. I also offer a range of treatments to keep your hair healthy and shiny. Come see me, and let's transform your hair together!",
    image: "/student4.webp",
  },
  {
    name: "casey-white",
    category: "Hairdresser",
    description:
      "I'm Casey, your friendly hairdresser specializing in color and treatments. Whether you're going for a dramatic change or just a little touch-up, I'm here to help. I believe in making hair care fun and accessible for everyone. Let's get together and create a look you'll love!",
    image: "/student5.webp",
  },
  {
    name: "morgan-taylor",
    category: "Hairdresser",
    description:
      "I focus on hair coloring and treatments, and I love working with clients to find the perfect look. Whether you're looking for a bold new color or need some expert care for your hair, I'm here to help. Let's work together to keep your hair looking fabulous and healthy!",
    image: "/student7.webp",
  },
];

// Function to generate a unique name for the photo
const generateUniqueFileName = (originalName: string) => {
  const timestamp = Date.now();
  const extension = originalName.split(".").pop();
  return `profile-${timestamp}.${extension}`;
};

export function SeedAll() {
  const fetcher = useFetcher();

  const addAll = async () => {
    for (const student of predefinedStudents) {
      const formData = new FormData();
      formData.append("name", student.name);
      formData.append("category", student.category);
      formData.append("description", student.description);
      formData.append("fileName", generateUniqueFileName(student.image));

      // Fetch the image from the public folder and convert it to a blob
      const response = await fetch(student.image);
      const blob = await response.blob();
      const file = new File([blob], student!.image.split("/").pop()!, {
        type: blob.type,
      });

      formData.append("image", file);
      fetcher.submit(formData, {
        method: "post",
        encType: "multipart/form-data",
      });
    }
    console.log("Database Seeded");
  };

  return (
    <div>
      <Form method="post" encType="multipart/form-data" className="mt-6">
        <button
          type="button"
          onClick={addAll}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Seed
        </button>
      </Form>
    </div>
  );
}
