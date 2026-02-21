"use client";

import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { ImageIcon, X, Send } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import React from "react";

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

  const handleSubmit = async () => {
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

      toast.success("Post created successfully!");
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
    <div className="bg-card rounded-xl border border-white/5 p-4 sm:p-5 mb-6 hover:border-white/10 transition-colors">
      <div className="flex gap-4">
        <Avatar className="h-10 w-10 ring-2 ring-white/5 hidden sm:block">
          <AvatarImage src={user.imageUrl} />
          <AvatarFallback>
            {user.firstName?.charAt(0)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-3">
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={postContent}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              placeholder="What's on your mind?..."
              className="w-full min-h-[80px] bg-transparent border-none p-0 
                       placeholder:text-muted-foreground/50 text-foreground resize-none 
                       focus:ring-0 text-base leading-relaxed"
              disabled={isPosting}
            />

            {/* Mention Suggestions */}
            {showMentions && mentionUsers.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-popover border border-white/10 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                {mentionUsers.map((mentionUser, index) => (
                  <button
                    key={mentionUser.userId}
                    type="button"
                    onClick={() => insertMention(mentionUser)}
                    className={`w-full flex items-center gap-3 px-4 py-2 hover:bg-white/5 transition-colors ${
                      index === selectedMentionIndex ? "bg-white/5" : ""
                    }`}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={mentionUser.imageUrl} />
                      <AvatarFallback>{mentionUser.firstName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                      <p className="text-sm font-medium">
                        {mentionUser.firstName} {mentionUser.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">@{mentionUser.firstName?.toLowerCase()}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Image Preview */}
          {previewUrl && (
            <div className="relative rounded-lg overflow-hidden border border-white/5 bg-secondary/30 inline-block">
              <img
                src={previewUrl}
                alt="Preview"
                className="max-h-60 w-auto object-cover"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 
                         rounded-full transition-colors text-white backdrop-blur-sm"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-white/5">
            <div className="flex items-center gap-2">
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
                className="p-2 rounded-full text-primary hover:bg-primary/10 transition-colors"
                title="Add Image"
                disabled={isPosting}
              >
                <ImageIcon className="h-5 w-5" />
              </button>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={isPosting || (!postContent.trim() && !selectedFile)}
              className="bg-primary hover:bg-primary/90 text-white rounded-full px-5 h-9 text-sm font-medium"
            >
              {isPosting ? "Posting..." : (
                <>
                  Post <Send className="h-3.5 w-3.5 ml-2 opacity-70" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PostForm;
