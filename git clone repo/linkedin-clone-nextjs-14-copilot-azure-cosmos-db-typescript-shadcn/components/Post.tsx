"use client";

import { IPostDocument } from "@/mongodb/models/post";
import { useUser } from "@clerk/nextjs";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import ReactTimeago from "react-timeago";
import { Heart, MessageCircle, Repeat2, Send, Trash2, MoreHorizontal } from "lucide-react";
import Image from "next/image";
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
      await deletePostAction(post._id as string);
      toast.success("Post deleted successfully!");
    } catch (error) {
      toast.error("Failed to delete post");
    }
  };

  return (
    <div className="post-card space-y-4">
      {/* Post Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
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
              @{post.user.firstName?.toLowerCase() || "user"} •{" "}
              <ReactTimeago date={new Date(post.createdAt)} />
            </p>
          </div>
        </div>

        {/* Delete Menu (Only for author) */}
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

      {/* Post Content */}
      <div className="space-y-3">
        {post.text && (
          <p className="text-foreground whitespace-pre-wrap break-words">
            {post.text}
          </p>
        )}

        {post.imageUrl && (
          <div className="relative rounded-xl overflow-hidden border border-border group">
            <Image
              src={post.imageUrl}
              alt="Post image"
              width={800}
              height={400}
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
          <CommentForm postId={post._id as string} />
          <CommentFeed post={post} />
        </div>
      )}
    </div>
  );
}

export default Post;