"use server";

import { Post, IPostBase } from "@/mongodb/models/post";
import { IUser } from "@/types/user";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { uploadToCloudinary } from "@/lib/uploadToCloudinary";

export default async function createPostAction(formData: FormData) {
  const user = await currentUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const postInput = formData.get("postInput") as string;
  const image = formData.get("image") as File;
  let imageUrl: string | undefined;

  if (!postInput) {
    throw new Error("Post input is required");
  }

  // define user
  const userDB: IUser = {
    userId: user.id,
    userImage: user.imageUrl,
    firstName: user.firstName || "",
    lastName: user.lastName || "",
  };

  // upload image if there is one
  try {
    if (image.size > 0) {
      console.log("Uploading image to Cloudinary...", image);
      // Upload to Cloudinary
      imageUrl = await uploadToCloudinary(image);
      console.log("Image uploaded successfully:", imageUrl);
    }

    const body: IPostBase = {
      user: userDB,
      text: postInput,
      imageUrl: imageUrl,
    };

    await Post.create(body);
  } catch (error: any) {
    throw new Error("Failed to create post", error);
  }

  // revalidate path to "/" - home page
  revalidatePath("/");
}