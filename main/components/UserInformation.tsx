import { currentUser } from "@clerk/nextjs/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { IPostDocument } from "@/mongodb/models/post";
import { Badge } from "@/components/ui/badge";
import { MapPin, Briefcase, GraduationCap, Award, Calendar } from "lucide-react";
import connectDB from "@/mongodb/db";
import { User } from "@/mongodb/models/user";
import EditProfileDialog from "./EditProfileDialog";
import CodingProfileBadges from "./CodingProfileBadges";
import Link from "next/link";

async function UserInformation({ posts }: { posts?: IPostDocument[] }) {
  const user = await currentUser();
  if (!user) return null;

  await connectDB();
  const dbUser = await User.findByUserId(user.id);

  if (!dbUser) return null;

  const firstName = dbUser.firstName || user.firstName;
  const lastName = dbUser.lastName || user.lastName;
  const imageUrl = dbUser.userImage || user.imageUrl;

  // SAME LOGIC AS YOUR ORIGINAL FILE – so counts update again
  const userPosts =
    posts?.filter((post) => post.user.userId === user.id) || [];

  const userComments =
    posts?.flatMap(
      (post) =>
        post?.comments?.filter((comment) => comment.user.userId === user.id) ||
        []
    ) || [];

  const recommendations = dbUser.recommendations || [];
  const upcomingInterviews =
    dbUser.interviews?.filter(
      (interview: any) => interview.status === "SCHEDULED"
    ) || [];

  return (
    <div className="space-y-6">
      {/* Main Profile Card */}
      <div className="card-modern p-6 space-y-6">
        {/* Profile Header (clickable to full profile) */}
        <Link
          href={`/${user.id}`}
          className="block hover:opacity-80 transition-opacity cursor-pointer"
        >
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
            <h3 className="font-bold text-xl hover:text-primary transition-colors">
              {firstName} {lastName}
            </h3>
            <p className="text-sm text-muted-foreground">
              @{user.username || `${firstName?.toLowerCase()}`}
            </p>

            {dbUser.bio && (
              <p className="text-sm text-muted-foreground pt-2 line-clamp-3">
                {dbUser.bio}
              </p>
            )}

            {dbUser.location && (
              <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground pt-2">
                <MapPin className="h-4 w-4" />
                <span>{dbUser.location}</span>
              </div>
            )}
          </div>
        </Link>

        {/* Recommendation badge section */}
        {recommendations.length > 0 && (
          <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Award className="h-4 w-4 text-green-600" />
              <span className="text-xs font-semibold text-green-900 dark:text-green-100">
                Recommended by {recommendations.length}{" "}
                {recommendations.length === 1 ? "Company" : "Companies"}
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {recommendations.slice(0, 3).map((rec: any, idx: number) => (
                <Badge
                  key={idx}
                  variant="outline"
                  className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700 text-xs"
                >
                  ✓ {rec.companyName}
                </Badge>
              ))}
              {recommendations.length > 3 && (
                <Badge
                  variant="outline"
                  className="text-xs bg-green-50 text-green-700"
                >
                  +{recommendations.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Upcoming interviews badge */}
        {upcomingInterviews.length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <div className="flex items-center gap-2 justify-center">
              <Calendar className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-semibold text-blue-900 dark:text-blue-100">
                {upcomingInterviews.length} Upcoming Interview
                {upcomingInterviews.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        )}

        {/* Experience & Education Preview */}
        {(dbUser.experience || dbUser.education) && (
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

        {/* Stats – these now update again because they use `posts` prop */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">
              {userPosts.length}
            </p>
            <p className="text-xs text-muted-foreground">Posts</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-accent">
              {userComments.length}
            </p>
            <p className="text-xs text-muted-foreground">Comments</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">0</p>
            <p className="text-xs text-muted-foreground">Teams</p>
          </div>
        </div>

        {/* Skills Preview */}
        {dbUser.skills && dbUser.skills.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-border">
            <h4 className="text-sm font-semibold">Top Skills</h4>
            <div className="flex flex-wrap gap-2">
              {dbUser.skills.slice(0, 5).map((skill: string, i: number) => (
                <Badge key={i} variant="secondary">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Edit Profile Button */}
        <EditProfileDialog user={JSON.parse(JSON.stringify(dbUser))} />
      </div>

      {/* Coding Profiles Card - Separate Card Below */}
      {dbUser.codingProfiles && (
        <CodingProfileBadges
          codingProfiles={JSON.parse(JSON.stringify(dbUser.codingProfiles))}
        />
      )}
    </div>
  );
}

export default UserInformation;
