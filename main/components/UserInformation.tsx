import { currentUser } from "@clerk/nextjs/server";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { IPostDocument } from "@/mongodb/models/post";
import { Badge } from "./ui/badge";
import { MapPin, Briefcase, GraduationCap } from "lucide-react";
import connectDB from "@/mongodb/db";
import { User } from "@/mongodb/models/user";
import EditProfileDialog from "./EditProfileDialog";

async function UserInformation({ posts }: { posts?: IPostDocument[] }) {
  const user = await currentUser();
  if (!user) return null;

  await connectDB();
  const dbUser = await User.findByUserId(user.id);

  const firstName = dbUser?.firstName || user.firstName;
  const lastName = dbUser?.lastName || user.lastName;
  const imageUrl = dbUser?.userImage || user.imageUrl;

  const userPosts = posts?.filter(
    (post) => post.user.userId === user.id
  ) || [];

  const userComments = posts?.flatMap(
    (post) =>
      post?.comments?.filter((comment) => comment.user.userId === user.id) ||
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
          @{user.username || `${firstName?.toLowerCase()}`}
        </p>
        
        {dbUser?.bio && (
          <p className="text-sm text-muted-foreground pt-2 line-clamp-3">
            {dbUser.bio}
          </p>
        )}

        {dbUser?.location && (
          <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground pt-2">
            <MapPin className="h-4 w-4" />
            <span>{dbUser.location}</span>
          </div>
        )}
      </div>

      {/* Experience & Education Preview */}
      {(dbUser?.experience || dbUser?.education) && (
        <div className="space-y-3 pt-4 border-t border-border text-left">
          {dbUser.experience && (
            <div className="space-y-1">
              <div className="flex items-center text-sm font-semibold">
                <Briefcase className="h-4 w-4 mr-2 text-primary" />
                Experience
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2 pl-6 whitespace-pre-wrap">
                {dbUser.experience}
              </p>
            </div>
          )}
          
          {dbUser.education && (
            <div className="space-y-1">
              <div className="flex items-center text-sm font-semibold">
                <GraduationCap className="h-4 w-4 mr-2 text-primary" />
                Education
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2 pl-6 whitespace-pre-wrap">
                {dbUser.education}
              </p>
            </div>
          )}
        </div>
      )}

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

      {/* Skills Preview */}
      {dbUser?.skills && dbUser.skills.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-border">
          <h4 className="text-sm font-semibold">Top Skills</h4>
          <div className="flex flex-wrap gap-2">
            {dbUser.skills.slice(0, 5).map((skill, i) => (
              <Badge key={i} variant="secondary">{skill}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Edit Profile Button */}
      {dbUser && (
        <EditProfileDialog user={JSON.parse(JSON.stringify(dbUser))} />
      )}
    </div>
  );
}

export default UserInformation;