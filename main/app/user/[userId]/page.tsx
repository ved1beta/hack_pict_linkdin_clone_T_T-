import connectDB from "@/mongodb/db";
import { User } from "@/mongodb/models/user";
import { Followers } from "@/mongodb/models/followers";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Briefcase, GraduationCap, Mail } from "lucide-react";
import { notFound } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import FollowButton from "@/components/FollowButton";

async function UserProfilePage({ params }: { params: { userId: string } }) {
  await connectDB();
  
  const dbUser = await (User as any).findByUserId(params.userId);
  
  if (!dbUser) {
    notFound();
  }

  const loggedInUser = await currentUser();
  const isOwnProfile = loggedInUser?.id === params.userId;
  
  let isFollowing = false;
  if (loggedInUser && !isOwnProfile) {
    const follow = await Followers.findOne({ 
      follower: loggedInUser.id, 
      following: params.userId 
    });
    isFollowing = !!follow;
  }

  return (
    <div className="bg-background min-h-screen py-6">
      <div className="max-w-4xl mx-auto px-4">
        <div className="card-modern overflow-hidden">
          {/* Cover Image */}
          <div className="h-48 bg-gradient-to-r from-primary/20 to-accent/20 relative">
            {/* You could add a cover image here if the model supported it */}
          </div>

          <div className="px-8 pb-8">
            {/* Header with Avatar */}
            <div className="relative flex justify-between items-end -mt-16 mb-6">
              <Avatar className="h-32 w-32 ring-4 ring-background">
                <AvatarImage src={dbUser.userImage} />
                <AvatarFallback className="text-4xl font-bold bg-gradient-to-br from-primary to-accent text-white">
                  {dbUser.firstName.charAt(0)}
                  {dbUser.lastName.charAt(0)}
                </AvatarFallback>
              </Avatar>

              <div className="flex gap-3 mb-2">
                {!isOwnProfile && loggedInUser && (
                  <FollowButton 
                    targetUserId={dbUser.userId} 
                    initialIsFollowing={isFollowing}
                  />
                )}
                <Button variant="outline">
                  <Mail className="mr-2 h-4 w-4" />
                  Message
                </Button>
              </div>
            </div>

            {/* Basic Info */}
            <div className="space-y-4 mb-8">
              <div>
                <h1 className="text-3xl font-bold">
                  {dbUser.firstName} {dbUser.lastName}
                </h1>
                <p className="text-muted-foreground text-lg">
                  {dbUser.bio || "No bio available"}
                </p>
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {dbUser.location && (
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {dbUser.location}
                  </div>
                )}
                {dbUser.companyName && (
                  <div className="flex items-center">
                    <Briefcase className="h-4 w-4 mr-1" />
                    {dbUser.companyName}
                  </div>
                )}
                <div className="flex items-center">
                  <span className="font-semibold text-foreground mr-1">500+</span> connections
                </div>
              </div>
            </div>

            {/* About */}
            {dbUser.bio && (
              <div className="mb-8">
                <h2 className="text-xl font-bold mb-3">About</h2>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {dbUser.bio}
                </p>
              </div>
            )}

            {/* Experience */}
            {dbUser.experience && (
              <div className="mb-8">
                <h2 className="text-xl font-bold mb-3">Experience</h2>
                <div className="bg-secondary/30 p-4 rounded-xl">
                  <div className="flex gap-4">
                    <div className="bg-background p-2 rounded-lg h-fit">
                      <Briefcase className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="whitespace-pre-wrap">{dbUser.experience}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Education */}
            {dbUser.education && (
              <div className="mb-8">
                <h2 className="text-xl font-bold mb-3">Education</h2>
                <div className="bg-secondary/30 p-4 rounded-xl">
                  <div className="flex gap-4">
                    <div className="bg-background p-2 rounded-lg h-fit">
                      <GraduationCap className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="whitespace-pre-wrap">{dbUser.education}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Skills */}
            {dbUser.skills && dbUser.skills.length > 0 && (
              <div>
                <h2 className="text-xl font-bold mb-3">Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {dbUser.skills.map((skill: string, i: number) => (
                    <Badge key={i} variant="secondary" className="text-sm py-1 px-3">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserProfilePage;
