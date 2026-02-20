"use client";

import { IPostDocument } from "@/mongodb/models/post";
import { useUser } from "@clerk/nextjs";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Heart, MessageCircle, Repeat2, Send, Trash2, MoreHorizontal } from "lucide-react";
import Image from "next/image";
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

// Client-side time formatter to avoid hydration issues
function TimeAgo({ date }: { date: Date }) {
  const [timeAgo, setTimeAgo] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
      
      if (seconds < 60) return `${seconds}s ago`;
      if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
      if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
      if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
      return new Date(date).toLocaleDateString();
    };

    setTimeAgo(updateTime());
    const interval = setInterval(() => setTimeAgo(updateTime()), 60000); // Update every minute

    return () => clearInterval(interval);
  }, [date]);

  return <span suppressHydrationWarning>{timeAgo || "Just now"}</span>;
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
          headers: {
            "Content-Type": "application/json",
          },
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
    const confirmed = window.confirm("Are you sure you want to delete this post?");
    if (!confirmed) return;

    try {
      await deletePostAction(String(post._id));
      toast.success("Post deleted successfully!");
    } catch (error) {
      toast.error("Failed to delete post");
    }
  };

  const contentParts = post.text ? parsePostContent(post.text) : [];

  return (
    <div className="post-card space-y-4">
      {/* Post Header */}
      <div className="flex items-start justify-between">
        <Link 
          href={`/user/${post.user.userId}`}
          className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
        >
          <Avatar className="h-12 w-12 ring-2 ring-primary/20">
            <AvatarImage src={post.user.userImage} />
            <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white font-semibold">
              {post.user.firstName?.charAt(0)}
              {post.user.lastName?.charAt(0)}
            </AvatarFallback>
          </Avatar>

          <div>
            <div className="flex items-center space-x-2">
              <p className="font-semibold text-foreground hover:text-primary cursor-pointer transition-colors">
                {post.user.firstName} {post.user.lastName}
              </p>
              {isAuthor && (
                <Badge variant="secondary" className="text-xs">
                  Author
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              @{post.user.firstName?.toLowerCase() || "user"} • <TimeAgo date={new Date(post.createdAt)} />
            </p>
          </div>
        </Link>

        {isAuthor && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-card border-border">
              <DropdownMenuItem 
                onClick={handleDelete}
                className="text-destructive focus:text-destructive cursor-pointer"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Post
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Post Content with Mentions */}
      <div className="space-y-3">
        {post.text && (
          <p className="text-foreground whitespace-pre-wrap break-words">
            {contentParts.map((part, index) => {
              if (part.type === "mention") {
                return (
                  <Link
                    key={index}
                    href={`/user/${part.userId}`}
                    className="text-primary hover:underline font-semibold inline-block"
                    onClick={(e) => e.stopPropagation()}
                  >
                    @{part.content}
                  </Link>
                );
              }
              return <span key={index}>{part.content}</span>;
            })}
          </p>
        )}

        {post.imageUrl && (
          <div className="relative rounded-xl overflow-hidden border border-border group">
            <img
              src={post.imageUrl}
              alt="Post image"
              className="w-full object-cover hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}
      </div>

      {/* Post Stats */}
      <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t border-border">
        <span className="hover:underline cursor-pointer">
          {likes?.length || 0} likes
        </span>
        <span className="hover:underline cursor-pointer" onClick={toggleComments}>
          {post.comments?.length || 0} comments
        </span>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-around pt-2 border-t border-border">
        <Button
          variant="ghost"
          size="sm"
          className={`flex items-center space-x-1.5 transition-colors ${
            liked ? "text-red-500 hover:text-red-600" : "text-muted-foreground hover:text-primary"
          }`}
          onClick={handleLike}
        >
          <Heart className={`h-5 w-5 ${liked ? "fill-current" : ""}`} />
          <span className="text-sm">Like</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="flex items-center space-x-1.5 text-muted-foreground hover:text-primary"
          onClick={toggleComments}
        >
          <MessageCircle className="h-5 w-5" />
          <span className="text-sm">Comment</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="flex items-center space-x-1.5 text-muted-foreground hover:text-green-500"
        >
          <Repeat2 className="h-5 w-5" />
          <span className="text-sm">Repost</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="flex items-center space-x-1.5 text-muted-foreground hover:text-blue-500"
        >
          <Send className="h-5 w-5" />
          <span className="text-sm">Share</span>
        </Button>
      </div>

      {/* Comments Section */}
      {isCommentsOpen && (
        <div className="space-y-4 pt-4 border-t border-border animate-in slide-in-from-top-2">
          <CommentForm postId={String(post._id)} />
          <CommentFeed post={post} />
        </div>
      )}
    </div>
  );
}

export default Post;
