import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import connectDB from "@/mongodb/db";
import { User } from "@/mongodb/models/user";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Briefcase, Mail, Calendar, GraduationCap, Award, Star, Clock, Shield } from "lucide-react";
import CodingProfileBadges from "@/components/CodingProfileBadges";
import Link from "next/link";

interface UserProfilePageProps {
  params: Promise<{
    userId: string;
  }>;
}

async function UserProfilePage({ params }: UserProfilePageProps) {
  const { userId } = await params;
  const clerkUser = await currentUser();

  if (!clerkUser) {
    redirect("/");
  }

  await connectDB();

  const profileUser = await User.findOne({ userId: userId }).lean();

  if (!profileUser) {
    return (
      <div className="bg-background min-h-screen py-6">
        <div className="max-w-4xl mx-auto px-4">
          <div className="card-modern p-12 text-center">
            <h2 className="text-2xl font-bold mb-2">User not found</h2>
            <p className="text-muted-foreground">
              This user does not exist or has been removed.
            </p>
            <Link href="/">
              <Button className="btn-primary mt-4">Go Home</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const serializedUser = JSON.parse(JSON.stringify(profileUser));
  const isOwnProfile = clerkUser.id === profileUser.userId;

  return (
    <div className="bg-background min-h-screen py-6">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Header Card */}
            <div className="card-modern overflow-hidden">
              {/* Cover Image */}
              <div className="h-32 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20" />
              
              {/* Profile Info */}
              <div className="p-6 -mt-16">
                <div className="flex items-end justify-between mb-4">
                  <Avatar className="h-32 w-32 ring-4 ring-background">
                    <AvatarImage src={serializedUser.userImage} />
                    <AvatarFallback className="text-4xl bg-gradient-to-br from-primary to-accent text-white font-bold">
                      {serializedUser.firstName?.charAt(0)}
                      {serializedUser.lastName?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  
                  {isOwnProfile && (
                    <Link href="/settings">
                      <Button variant="outline">Edit Profile</Button>
                    </Link>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <h1 className="text-3xl font-bold mb-1">
                      {serializedUser.firstName} {serializedUser.lastName}
                    </h1>
                    <p className="text-muted-foreground">
                      @{serializedUser.firstName?.toLowerCase() || "user"}
                    </p>
                  </div>

                  {/* College Verification Badge - For Students */}
                  {serializedUser.userType === "student" && serializedUser.collegeVerification && serializedUser.collegeVerification.status === "approved" && (
                    <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <div>
                          <h3 className="font-semibold text-blue-900 dark:text-blue-100 text-sm">
                            Verified Student
                          </h3>
                          <p className="text-xs text-blue-700 dark:text-blue-300">
                            {serializedUser.collegeVerification.collegeName}
                            {serializedUser.collegeVerification.department && ` • ${serializedUser.collegeVerification.department}`}
                            {serializedUser.collegeVerification.graduationYear && ` • Class of ${serializedUser.collegeVerification.graduationYear}`}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Recommendations Badges - Visible to Everyone */}
                  {serializedUser.recommendations && serializedUser.recommendations.length > 0 && (
                    <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Star className="h-5 w-5 text-yellow-500" />
                        <h3 className="font-semibold text-green-900 dark:text-green-100">
                          Recommended by {serializedUser.recommendations.length} {serializedUser.recommendations.length === 1 ? 'Company' : 'Companies'}
                        </h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {serializedUser.recommendations.map((rec: any, idx: number) => (
                          <Badge 
                            key={idx} 
                            variant="outline" 
                            className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-300 dark:border-green-700"
                          >
                            <Award className="h-3 w-3 mr-1" />
                            ✓ {rec.companyName}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {serializedUser.bio && (
                    <p className="text-foreground leading-relaxed">
                      {serializedUser.bio}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground pt-2">
                    {serializedUser.location && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4" />
                        {serializedUser.location}
                      </div>
                    )}
                    {serializedUser.companyName && (
                      <div className="flex items-center gap-1.5">
                        <Briefcase className="h-4 w-4" />
                        {serializedUser.companyName}
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <Mail className="h-4 w-4" />
                      {serializedUser.email}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      Joined {new Date(serializedUser.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Upcoming Interviews Section */}
            {serializedUser.interviews && serializedUser.interviews.length > 0 && (
              <div className="card-modern p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-bold">Scheduled Interviews</h2>
                </div>
                <div className="space-y-3">
                  {serializedUser.interviews
                    .filter((interview: any) => interview.status === "SCHEDULED")
                    .sort((a: any, b: any) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
                    .map((interview: any, idx: number) => (
                      <div key={idx} className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                              {interview.companyName}
                            </h4>
                            <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300 mt-1">
                              <Clock className="h-3 w-3" />
                              {new Date(interview.scheduledAt).toLocaleDateString('en-US', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                            {interview.notes && (
                              <p className="text-sm text-muted-foreground mt-2">
                                {interview.notes}
                              </p>
                            )}
                          </div>
                          <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700">
                            Scheduled
                          </Badge>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Skills Section */}
            {serializedUser.skills && serializedUser.skills.length > 0 && (
              <div className="card-modern p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Award className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-bold">Skills</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {serializedUser.skills.map((skill: string, index: number) => (
                    <Badge key={index} variant="secondary" className="text-sm px-3 py-1">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Experience Section */}
            {serializedUser.experience && (
              <div className="card-modern p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Briefcase className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-bold">Experience</h2>
                </div>
                <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {serializedUser.experience}
                </p>
              </div>
            )}

            {/* Education Section */}
            {serializedUser.education && (
              <div className="card-modern p-6">
                <div className="flex items-center gap-2 mb-4">
                  <GraduationCap className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-bold">Education</h2>
                </div>
                <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {serializedUser.education}
                </p>
              </div>
            )}

            {/* Resume Section */}
            {serializedUser.resumeUrl && (
              <div className="card-modern p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Briefcase className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-bold">Resume</h2>
                </div>
                <a 
                  href={serializedUser.resumeUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  View Resume →
                </a>
              </div>
            )}
          </div>

          {/* Right Column - Coding Profiles & Stats */}
          <div className="lg:col-span-1 space-y-6">
            {/* Coding Profiles */}
            <CodingProfileBadges codingProfiles={serializedUser.codingProfiles} />

            {/* Additional Info Card */}
            <div className="card-modern p-6 space-y-4">
              <h3 className="font-bold text-lg">Profile Stats</h3>
              
              {serializedUser.userType && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Account Type</span>
                  <Badge variant="secondary" className="capitalize">
                    {serializedUser.userType}
                  </Badge>
                </div>
              )}

              {serializedUser.connections && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Connections</span>
                  <span className="font-bold">
                    {serializedUser.connections.length || 0}
                  </span>
                </div>
              )}

              {serializedUser.recommendations && serializedUser.recommendations.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Recommendations</span>
                  <span className="font-bold text-green-600">
                    {serializedUser.recommendations.length}
                  </span>
                </div>
              )}

              {serializedUser.interviews && serializedUser.interviews.filter((i: any) => i.status === "SCHEDULED").length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Upcoming Interviews</span>
                  <span className="font-bold text-blue-600">
                    {serializedUser.interviews.filter((i: any) => i.status === "SCHEDULED").length}
                  </span>
                </div>
              )}

              {serializedUser.companyWebsite && (
                <div className="pt-4 border-t border-border">
                  <span className="text-sm text-muted-foreground block mb-2">Company Website</span>
                  <a 
                    href={serializedUser.companyWebsite} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-sm break-all"
                  >
                    {serializedUser.companyWebsite}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserProfilePage;
