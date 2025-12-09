"use client";

import { useUser } from "@clerk/nextjs";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { ImageIcon, XIcon } from "lucide-react";
import { useRef, useState } from "react";
import createPostAction from "@/actions/createPostAction";
import { toast } from "sonner";

function PostForm() {
  const ref = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useUser();

  const [preview, setPreview] = useState<string | null>(null);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
    }
  };

  const handlePostAction = async (formData: FormData) => {
    const formDataCopy = formData;
    ref.current?.reset();

    const text = formDataCopy.get("postInput") as string;

    if (!text.trim()) {
      toast.error("Please write something before posting!");
      return;
    }

    setPreview(null);

    try {
      await createPostAction(formDataCopy);
      toast.success("Post created successfully! 🎉");
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error("Failed to create post. Please try again.");
    }
  };

  return (
    <div className="card-modern p-5 space-y-4">
      <form
        ref={ref}
        action={(formData) => {
          handlePostAction(formData);
        }}
        className="space-y-4"
      >
        {/* Input Section */}
        <div className="flex items-start space-x-3">
          <Avatar className="h-12 w-12 ring-2 ring-primary/20">
            <AvatarImage src={user?.imageUrl} />
            <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white font-semibold">
              {user?.firstName?.charAt(0)}
              {user?.lastName?.charAt(0)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <textarea
              name="postInput"
              placeholder="What's on your mind?"
              className="w-full bg-secondary border border-border rounded-2xl px-4 py-3
                       focus:ring-2 focus:ring-primary focus:border-transparent
                       transition-all duration-200 outline-none resize-none
                       min-h-[80px] text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* Image Preview */}
        {preview && (
          <div className="relative">
            <img
              src={preview}
              alt="Preview"
              className="w-full rounded-xl max-h-96 object-cover border border-border"
            />
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="absolute top-2 right-2 rounded-full"
              onClick={() => {
                setPreview(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = "";
                }
              }}
            >
              <XIcon className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center space-x-2">
            <input
              ref={fileInputRef}
              type="file"
              name="image"
              accept="image/*"
              hidden
              onChange={handleImageChange}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-primary hover:bg-primary/10"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageIcon className="h-5 w-5 mr-2" />
              Add Image
            </Button>
          </div>

          <Button
            type="submit"
            className="btn-primary px-6"
          >
            Post
          </Button>
        </div>
      </form>
    </div>
  );
}

export default PostForm;