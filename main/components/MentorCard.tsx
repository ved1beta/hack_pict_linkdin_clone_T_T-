"use client";

import { Avatar, AvatarFallback } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { MessageCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface MentorCardProps {
  mentor: {
    _id: string;
    name: string;
    icon: string;
    description: string;
    experience: string;
    type: string;
    specialty: string;
  };
  currentUserId: string;
}

function MentorCard({ mentor, currentUserId }: MentorCardProps) {
  const [connecting, setConnecting] = useState(false);

  const handleConnect = async () => {
    setConnecting(true);

    // Simulate API call
    setTimeout(() => {
      toast.success(`Connected with ${mentor.name}! 🎉`);
      setConnecting(false);
    }, 1000);
  };

  return (
    <div className="card-modern p-6 space-y-4 hover:border-primary/50 transition-all">
      {/* Header */}
      <div className="flex flex-col items-center text-center space-y-3">
        <Avatar className="h-16 w-16 ring-2 ring-primary/20">
          <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-2xl">
            {mentor.icon}
          </AvatarFallback>
        </Avatar>

        <div>
          <h3 className="text-lg font-bold">{mentor.name}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {mentor.description}
          </p>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-2">
        <Badge variant="secondary" className="w-full justify-center">
          {mentor.experience}
        </Badge>
        <div className="text-xs text-center text-muted-foreground">
          <span className="font-semibold text-primary">Specialty:</span> {mentor.specialty}
        </div>
      </div>

      {/* Action Button */}
      <Button
        onClick={handleConnect}
        disabled={connecting}
        className="btn-primary w-full"
      >
        {connecting ? (
          "Connecting..."
        ) : (
          <>
            <MessageCircle className="h-4 w-4 mr-2" />
            Connect
          </>
        )}
      </Button>
    </div>
  );
}

export default MentorCard;
