"use client";

import { IJobDocument } from "@/mongodb/models/job";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import {
  MapPin,
  Briefcase,
  DollarSign,
  Users,
  X,
  Heart,
  Sparkles,
} from "lucide-react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { useState } from "react";

interface SwipeCardProps {
  job: IJobDocument;
  onSwipe: (direction: "left" | "right", jobId: string) => void;
  isTop: boolean;
}

export default function SwipeCard({ job, onSwipe, isTop }: SwipeCardProps) {
  const [exitDirection, setExitDirection] = useState<"left" | "right" | null>(null);
  
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5]);
  
  // Swipe indicators
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [-100, 0], [1, 0]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    const threshold = 100;
    if (info.offset.x > threshold) {
      setExitDirection("right");
      onSwipe("right", job._id.toString());
    } else if (info.offset.x < -threshold) {
      setExitDirection("left");
      onSwipe("left", job._id.toString());
    }
  };

  const handleButtonSwipe = (direction: "left" | "right") => {
    setExitDirection(direction);
    onSwipe(direction, job._id.toString());
  };

  return (
    <motion.div
      className="absolute w-full max-w-xl mx-auto cursor-grab active:cursor-grabbing"
      style={{ x, rotate, opacity }}
      drag={isTop ? "x" : false}
      dragElastic={0.8}
      onDragEnd={handleDragEnd}
      initial={{ scale: isTop ? 1 : 0.95, opacity: isTop ? 1 : 0.7 }}
      animate={{
        scale: isTop ? 1 : 0.95,
        opacity: isTop ? 1 : 0.7,
        y: isTop ? 0 : 10,
      }}
      exit={{
        x: exitDirection === "right" ? 300 : exitDirection === "left" ? -300 : 0,
        opacity: 0,
        transition: { duration: 0.3 },
      }}
      whileDrag={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <div className="relative bg-gradient-to-br from-card via-card to-secondary rounded-3xl border border-border overflow-hidden shadow-2xl">
        {/* Swipe Indicators */}
        <motion.div
          className="absolute top-8 right-8 z-20 bg-emerald-500/90 text-white px-6 py-2 rounded-xl 
                     font-bold text-2xl rotate-12 border-4 border-emerald-400"
          style={{ opacity: likeOpacity }}
        >
          APPLY
        </motion.div>
        <motion.div
          className="absolute top-8 left-8 z-20 bg-rose-500/90 text-white px-6 py-2 rounded-xl 
                     font-bold text-2xl -rotate-12 border-4 border-rose-400"
          style={{ opacity: nopeOpacity }}
        >
          SKIP
        </motion.div>

        {/* Card Header with gradient */}
        <div className="relative h-40 bg-gradient-to-br from-primary/30 via-accent/20 to-primary/10 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-card to-transparent" />
          
          {/* Company Logo */}
          <div className="absolute bottom-0 left-6 transform translate-y-1/2">
            <Avatar className="h-24 w-24 ring-4 ring-card shadow-xl">
              <AvatarImage src={job.companyLogo || job.recruiterImage} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-3xl font-bold">
                {job.companyName.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </div>
          
          {/* Job Type Badge */}
          <div className="absolute top-4 right-4">
            <Badge className="bg-primary/80 text-white border-0 px-4 py-1.5 text-sm font-semibold backdrop-blur-sm">
              {job.jobType}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="pt-16 px-6 pb-6 space-y-5">
          {/* Title & Company */}
          <div>
            <h2 className="text-2xl font-bold text-foreground leading-tight">
              {job.title}
            </h2>
            <p className="text-lg text-primary font-semibold mt-1">
              {job.companyName}
            </p>
          </div>

          {/* Job Details Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 bg-secondary/50 rounded-xl px-4 py-3">
              <MapPin className="h-5 w-5 text-primary" />
              <span className="text-sm text-foreground truncate">{job.location}</span>
            </div>
            <div className="flex items-center gap-2 bg-secondary/50 rounded-xl px-4 py-3">
              <Briefcase className="h-5 w-5 text-accent" />
              <span className="text-sm text-foreground capitalize">{job.experienceLevel}</span>
            </div>
            {job.salary && (
              <div className="flex items-center gap-2 bg-secondary/50 rounded-xl px-4 py-3">
                <DollarSign className="h-5 w-5 text-emerald-400" />
                <span className="text-sm text-foreground">{job.salary}</span>
              </div>
            )}
            <div className="flex items-center gap-2 bg-secondary/50 rounded-xl px-4 py-3">
              <Users className="h-5 w-5 text-amber-400" />
              <span className="text-sm text-foreground">{job.applications?.length || 0} applied</span>
            </div>
          </div>

          {/* Description */}
          <div className="bg-secondary/30 rounded-xl p-4">
            <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
              {job.description}
            </p>
          </div>

          {/* Skills */}
          {job.skills && job.skills.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4" />
                <span>Required Skills</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {job.skills.slice(0, 4).map((skill, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="bg-primary/10 text-primary border-primary/20 px-3 py-1"
                  >
                    {skill}
                  </Badge>
                ))}
                {job.skills.length > 4 && (
                  <Badge variant="secondary" className="bg-secondary text-muted-foreground">
                    +{job.skills.length - 4}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {isTop && (
            <div className="flex items-center justify-center gap-6 pt-4">
              <motion.button
                onClick={() => handleButtonSwipe("left")}
                className="p-5 rounded-full bg-rose-500/10 border-2 border-rose-500/50 
                         text-rose-500 hover:bg-rose-500 hover:text-white 
                         transition-all duration-300 group shadow-lg shadow-rose-500/20"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <X className="h-8 w-8" />
              </motion.button>
              
              <motion.button
                onClick={() => handleButtonSwipe("right")}
                className="p-5 rounded-full bg-emerald-500/10 border-2 border-emerald-500/50 
                         text-emerald-500 hover:bg-emerald-500 hover:text-white 
                         transition-all duration-300 group shadow-lg shadow-emerald-500/20"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Heart className="h-8 w-8" />
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

