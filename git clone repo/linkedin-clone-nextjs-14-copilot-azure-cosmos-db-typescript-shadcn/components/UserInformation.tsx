import { currentUser } from "@clerk/nextjs/server";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { IPostDocument } from "@/mongodb/models/post";
import { Badge } from "./ui/badge";
import { MapPin, Briefcase } from "lucide-react";

async function UserInformation({ posts }: { posts?: IPostDocument[] }) {
  const user = await currentUser();

  const firstName = user?.firstName;
  const lastName = user?.lastName;
  const imageUrl = user?.imageUrl;

  const userPosts = posts?.filter(
    (post) => post.user.userId === user?.id
  ) || [];

  const userComments = posts?.flatMap(
    (post) =>
      post?.comments?.filter((comment) => comment.user.userId === user?.id) ||
      []
  ) || [];

  return (
    <div className="card-modern p-6 space-y-6">
      {/* Profile Header */}
      <div className="relative">
        {/* Background gradient */}
        <div className="h-20 bg-gradient-to-r from-primary/20 to-accent/20 rounded-t-xl absolute -top-6 -left-6 -right-6" />
        
        {/* Avatar */}
        <div className="relative pt-8 flex justify-center">
          <Avatar className="h-20 w-20 ring-4 ring-background">
            <AvatarImage src={imageUrl} />
            <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-xl font-bold">
              {firstName?.charAt(0)}
              {lastName?.charAt(0)}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* User Info */}
      <div className="text-center space-y-2">
        <h3 className="font-bold text-xl">
          {firstName} {lastName}
        </h3>
        <p className="text-sm text-muted-foreground">
          @{user?.username || `${firstName?.toLowerCase()}`}
        </p>
        
        <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>Location</span>
        </div>

        <p className="text-sm text-muted-foreground pt-2">
          UI, UX Designer and Web Developer
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
        <div className="text-center">
          <p className="text-2xl font-bold text-primary">{userPosts.length}</p>
          <p className="text-xs text-muted-foreground">Posts</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-accent">{userComments.length}</p>
          <p className="text-xs text-muted-foreground">Comments</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-primary">0</p>
          <p className="text-xs text-muted-foreground">Teams</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-2 pt-4 border-t border-border">
        <div className="flex items-center justify-between text-sm hover:bg-secondary p-2 rounded-lg cursor-pointer transition-colors">
          <span className="text-muted-foreground">Profile views</span>
          <span className="font-semibold">124</span>
        </div>
        <div className="flex items-center justify-between text-sm hover:bg-secondary p-2 rounded-lg cursor-pointer transition-colors">
          <span className="text-muted-foreground">Post impressions</span>
          <span className="font-semibold">1.2k</span>
        </div>
      </div>

      {/* Skills Preview */}
      <div className="space-y-3 pt-4 border-t border-border">
        <h4 className="text-sm font-semibold">Top Skills</h4>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">React</Badge>
          <Badge variant="secondary">TypeScript</Badge>
          <Badge variant="secondary">Node.js</Badge>
        </div>
      </div>
    </div>
  );
}

export default UserInformation;