"use client";

import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { ImageIcon, XIcon } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";

interface MentionUser {
  userId: string;
  firstName: string;
  lastName: string;
  imageUrl: string;
}

function PostForm() {
  const { user } = useUser();
  const [postContent, setPostContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Mention states
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const [mentionUsers, setMentionUsers] = useState<MentionUser[]>([]);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);

  // Fetch users for mentions
  useEffect(() => {
    if (showMentions) {
      fetch(`/api/users/search?q=${mentionSearch}`)
        .then((res) => res.json())
        .then((data) => setMentionUsers(data.users || []))
        .catch((err) => console.error("Failed to fetch users:", err));
    }
  }, [mentionSearch, showMentions]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart;
    
    setPostContent(value);
    setCursorPosition(cursorPos);

    // Check for @ mention
    const textBeforeCursor = value.substring(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      
      if (!textAfterAt.includes(" ") && !textAfterAt.includes("\n")) {
        setShowMentions(true);
        setMentionSearch(textAfterAt);
        setSelectedMentionIndex(0);
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }
  };

  const insertMention = (mentionUser: MentionUser) => {
    const textBeforeCursor = postContent.substring(0, cursorPosition);
    const textAfterCursor = postContent.substring(cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");

    // Insert mention with hidden userId
    const mention = `@${mentionUser.firstName} ${mentionUser.lastName}[${mentionUser.userId}]`;
    
    const newText =
      textBeforeCursor.substring(0, lastAtIndex) +
      mention + " " +
      textAfterCursor;

    setPostContent(newText);
    setShowMentions(false);
    setMentionSearch("");
    
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showMentions && mentionUsers.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedMentionIndex((prev) =>
          prev < mentionUsers.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedMentionIndex((prev) =>
          prev > 0 ? prev - 1 : mentionUsers.length - 1
        );
      } else if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        insertMention(mentionUsers[selectedMentionIndex]);
      } else if (e.key === "Escape") {
        setShowMentions(false);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!postContent.trim() && !selectedFile) {
      toast.error("Please write something or add an image");
      return;
    }

    setIsPosting(true);

    try {
      const formData = new FormData();
      formData.append("text", postContent);
      if (selectedFile) {
        formData.append("image", selectedFile);
      }

      const response = await fetch("/api/posts", {
        method: "POST",
        body: formData, // Send as FormData, not JSON
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create post");
      }

      toast.success("Post created successfully! 🎉");
      setPostContent("");
      setSelectedFile(null);
      setPreviewUrl(null);
      
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error: any) {
      console.error("Post creation error:", error);
      toast.error(error.message || "Failed to create post");
    } finally {
      setIsPosting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="card-modern p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-start space-x-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={user.imageUrl} />
            <AvatarFallback>
              {user.firstName?.charAt(0)}
              {user.lastName?.charAt(0)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={postContent}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              placeholder="What's on your mind? (Type @ to mention someone)"
              className="w-full min-h-[100px] p-3 bg-secondary border border-border rounded-lg 
                       focus:ring-2 focus:ring-primary focus:border-transparent 
                       resize-none outline-none"
              disabled={isPosting}
            />

            {/* Mention Suggestions Dropdown */}
            {showMentions && mentionUsers.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {mentionUsers.map((mentionUser, index) => (
                  <button
                    key={mentionUser.userId}
                    type="button"
                    onClick={() => insertMention(mentionUser)}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary transition-colors ${
                      index === selectedMentionIndex ? "bg-secondary" : ""
                    }`}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={mentionUser.imageUrl} />
                      <AvatarFallback>
                        {mentionUser.firstName?.charAt(0)}
                        {mentionUser.lastName?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                      <p className="text-sm font-semibold">
                        {mentionUser.firstName} {mentionUser.lastName}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Image Preview */}
        {previewUrl && (
          <div className="relative">
            <img
              src={previewUrl}
              alt="Preview"
              className="max-h-96 rounded-lg w-full object-cover"
            />
            <button
              type="button"
              onClick={removeImage}
              className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 
                       rounded-full transition-colors"
            >
              <XIcon className="h-5 w-5 text-white" />
            </button>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            disabled={isPosting}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center space-x-2 text-muted-foreground hover:text-primary transition-colors"
            disabled={isPosting}
          >
            <ImageIcon className="h-5 w-5" />
            <span className="text-sm">Add Image</span>
          </button>

          <Button
            type="submit"
            className="btn-primary"
            disabled={isPosting || (!postContent.trim() && !selectedFile)}
          >
            {isPosting ? "Posting..." : "Post"}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default PostForm;
