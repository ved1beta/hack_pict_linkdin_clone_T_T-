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
      <div className="bg-card rounded-xl border border-white/5 overflow-hidden">
        {/* Profile Header */}
        <Link
          href={`/${user.id}`}
          className="block hover:opacity-95 transition-opacity cursor-pointer group relative"
        >
          {/* Background gradient */}
          <div className="h-24 bg-gradient-to-r from-blue-600/20 via-violet-600/20 to-primary/20" />

          {/* Avatar */}
          <div className="absolute top-12 left-0 right-0 flex justify-center">
            <Avatar className="h-20 w-20 ring-4 ring-card shadow-xl">
              <AvatarImage src={imageUrl} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-xl font-bold">
                {firstName?.charAt(0)}
                {lastName?.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* User Info */}
          <div className="mt-10 px-6 pb-6 text-center space-y-1">
            <h3 className="font-bold text-lg group-hover:text-primary transition-colors">
              {firstName} {lastName}
            </h3>
            <p className="text-sm text-muted-foreground">
              @{user.username || `${firstName?.toLowerCase()}`}
            </p>

            {dbUser.bio && (
              <p className="text-sm text-foreground/80 pt-3 line-clamp-2 leading-relaxed">
                {dbUser.bio}
              </p>
            )}

            {dbUser.location && (
              <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground pt-2">
                <MapPin className="h-3.5 w-3.5" />
                <span>{dbUser.location}</span>
              </div>
            )}
          </div>
        </Link>

        {/* Stats */}
        <div className="grid grid-cols-3 border-t border-white/5 divide-x divide-white/5 py-3">
          <div className="text-center px-2">
            <p className="text-lg font-bold text-foreground">
              {userPosts.length}
            </p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Posts</p>
          </div>
          <div className="text-center px-2">
            <p className="text-lg font-bold text-foreground">
              {userComments.length}
            </p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Comments</p>
          </div>
          <div className="text-center px-2">
            <p className="text-lg font-bold text-foreground">0</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Teams</p>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-5 space-y-5 border-t border-white/5">
          {/* Recommendations Badge */}
          {recommendations.length > 0 && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1.5">
                <Award className="h-4 w-4 text-emerald-500" />
                <span className="text-xs font-semibold text-emerald-400">
                  Recommended by {recommendations.length} {recommendations.length === 1 ? "Company" : "Companies"}
                </span>
              </div>
            </div>
          )}

          {/* Upcoming Interviews Badge */}
          {upcomingInterviews.length > 0 && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-1.5">
                <Calendar className="h-4 w-4 text-blue-500" />
                <span className="text-xs font-semibold text-blue-400">
                  {upcomingInterviews.length} Upcoming Interview{upcomingInterviews.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          )}

          {/* Details */}
          {(dbUser.experience || dbUser.education) && (
            <div className="space-y-4">
              {dbUser.experience && (
                <div className="flex gap-3 text-left">
                  <div className="mt-0.5 p-1.5 bg-secondary rounded-lg h-fit">
                    <Briefcase className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Experience</p>
                    <p className="text-sm text-foreground/90 line-clamp-2">{dbUser.experience}</p>
                  </div>
                </div>
              )}

              {dbUser.education && (
                <div className="flex gap-3 text-left">
                  <div className="mt-0.5 p-1.5 bg-secondary rounded-lg h-fit">
                    <GraduationCap className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Education</p>
                    <p className="text-sm text-foreground/90 line-clamp-2">{dbUser.education}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Skills */}
          {dbUser.skills && dbUser.skills.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Top Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {dbUser.skills.slice(0, 5).map((skill: string, i: number) => (
                  <Badge key={i} variant="secondary" className="bg-secondary/50 hover:bg-secondary font-normal text-xs px-2.5 py-0.5 border-transparent">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <EditProfileDialog user={JSON.parse(JSON.stringify(dbUser))} />
        </div>
      </div>

      {/* Coding Profiles - Separate Component */}
      {dbUser.codingProfiles && (
        <CodingProfileBadges
          codingProfiles={JSON.parse(JSON.stringify(dbUser.codingProfiles))}
        />
      )}
    </div>
  );
}

export default UserInformation;
