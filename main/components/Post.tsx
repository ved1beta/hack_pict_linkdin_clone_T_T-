"use client";

import { IPostDocument } from "@/mongodb/models/post";
import { useUser } from "@clerk/nextjs";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Heart, MessageCircle, Repeat2, Send, Trash2, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import CommentFeed from "./CommentFeed";
import CommentForm from "./CommentForm";
import { toast } from "sonner";
import deletePostAction from "@/actions/deletePostAction";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import React from "react";

// Helper function to parse mentions
function parsePostContent(content: string) {
  const mentionRegex = /@([^[]+)\[([^\]]+)\]/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        type: "text",
        content: content.substring(lastIndex, match.index),
      });
    }

    parts.push({
      type: "mention",
      content: match[1].trim(),
      userId: match[2],
    });

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push({
      type: "text",
      content: content.substring(lastIndex),
    });
  }

  return parts;
}

// Client-side time formatter
function TimeAgo({ date }: { date: Date }) {
  const [timeAgo, setTimeAgo] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
      
      if (seconds < 60) return `${seconds}s`;
      if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
      if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
      if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
      return new Date(date).toLocaleDateString();
    };

    setTimeAgo(updateTime());
    const interval = setInterval(() => setTimeAgo(updateTime()), 60000);

    return () => clearInterval(interval);
  }, [date]);

  return <span suppressHydrationWarning>{timeAgo || "now"}</span>;
}

function Post({ post }: { post: IPostDocument }) {
  const { user } = useUser();
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(post.likes || []);

  const isAuthor = user?.id === post.user.userId;

  useEffect(() => {
    if (user?.id && post.likes?.includes(user.id)) {
      setLiked(true);
    }
  }, [post, user]);

  const toggleComments = () => {
    setIsCommentsOpen(!isCommentsOpen);
  };

  const handleLike = async () => {
    if (!user?.id) {
      toast.error("Please sign in to like posts");
      return;
    }

    const originalLiked = liked;
    const originalLikes = likes;

    const newLikes = liked
      ? likes?.filter((like: string) => like !== user.id)
      : [...(likes ?? []), user.id];

    setLiked(!liked);
    setLikes(newLikes);

    try {
      const response = await fetch(
        `/api/posts/${post._id}/${liked ? "unlike" : "like"}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id }),
        }
      );

      if (!response.ok) {
        setLiked(originalLiked);
        setLikes(originalLikes);
        toast.error("Failed to like post");
      }
    } catch (error) {
      setLiked(originalLiked);
      setLikes(originalLikes);
      toast.error("Failed to like post");
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm("Delete this post?");
    if (!confirmed) return;

    try {
      await deletePostAction(String(post._id));
      toast.success("Post deleted");
    } catch (error) {
      toast.error("Failed to delete");
    }
  };

  const contentParts = post.text ? parsePostContent(post.text) : [];

  return (
    <div className="bg-card rounded-xl border border-white/5 p-4 sm:p-5 hover:border-white/10 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <Link 
          href={`/user/${post.user.userId}`}
          className="flex items-center gap-3 group"
        >
          <Avatar className="h-10 w-10 ring-2 ring-white/5 group-hover:ring-primary/20 transition-all">
            <AvatarImage src={post.user.userImage} />
            <AvatarFallback className="bg-secondary text-xs">
              {post.user.firstName?.charAt(0)}
            </AvatarFallback>
          </Avatar>

          <div className="leading-tight">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm group-hover:text-primary transition-colors">
                {post.user.firstName} {post.user.lastName}
              </span>
              {isAuthor && (
                <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 border-primary/20 text-primary/80">
                  You
                </Badge>
              )}
            </div>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <span>@{post.user.firstName?.toLowerCase()}</span>
              <span>·</span>
              <TimeAgo date={new Date(post.createdAt)} />
            </span>
          </div>
        </Link>

        {isAuthor && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-muted-foreground hover:text-foreground">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover border-white/10">
              <DropdownMenuItem onClick={handleDelete} className="text-red-400 focus:text-red-400 focus:bg-red-400/10 cursor-pointer">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Content */}
      <div className="space-y-3 mb-4 pl-[3.25rem]"> {/* Indent content to align with text, not avatar */}
        {post.text && (
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words text-foreground/90">
            {contentParts.map((part, index) => {
              if (part.type === "mention") {
                return (
                  <Link
                    key={index}
                    href={`/user/${part.userId}`}
                    className="text-primary hover:underline font-medium"
                    onClick={(e) => e.stopPropagation()}
                  >
                    @{part.content}
                  </Link>
                );
              }
              return <React.Fragment key={index}>{part.content}</React.Fragment>;
            })}
          </p>
        )}

        {post.imageUrl && (
          <div className="relative rounded-lg overflow-hidden border border-white/5 bg-secondary/30 mt-2">
            <img
              src={post.imageUrl}
              alt="Post attachment"
              className="w-full object-cover max-h-[500px]"
              loading="lazy"
            />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pl-[3.25rem]">
        <div className="flex items-center gap-4 sm:gap-6">
          <button 
            onClick={handleLike}
            className={`group flex items-center gap-1.5 text-xs font-medium transition-colors ${
              liked ? "text-rose-500" : "text-muted-foreground hover:text-rose-500"
            }`}
          >
            <div className={`p-1.5 rounded-full group-hover:bg-rose-500/10 transition-colors ${liked ? "bg-rose-500/10" : ""}`}>
              <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
            </div>
            <span>{likes?.length || 0}</span>
          </button>

          <button 
            onClick={toggleComments}
            className="group flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-blue-400 transition-colors"
          >
            <div className="p-1.5 rounded-full group-hover:bg-blue-400/10 transition-colors">
              <MessageCircle className="h-4 w-4" />
            </div>
            <span>{post.comments?.length || 0}</span>
          </button>

          <button className="group flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-green-400 transition-colors">
            <div className="p-1.5 rounded-full group-hover:bg-green-400/10 transition-colors">
              <Repeat2 className="h-4 w-4" />
            </div>
          </button>
        </div>

        <button className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-full hover:bg-white/5">
          <Send className="h-4 w-4" />
        </button>
      </div>

      {/* Comments */}
      {isCommentsOpen && (
        <div className="mt-4 pl-[3.25rem] pt-4 border-t border-white/5 animate-in slide-in-from-top-1">
          <CommentForm postId={String(post._id)} />
          <div className="mt-4">
            <CommentFeed post={post} />
          </div>
        </div>
      )}
    </div>
  );
}

export default Post;
