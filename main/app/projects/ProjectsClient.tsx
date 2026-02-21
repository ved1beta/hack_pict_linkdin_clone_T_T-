"use client";

import { useState, useEffect } from "react";
import {
  FolderGit2,
  Plus,
  ExternalLink,
  Github,
  Users,
  Pencil,
  Trash2,
  X,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

interface TeamMember {
  userId: string;
  userName: string;
  userImage?: string;
  role?: string;
  taggedAt: string;
}

interface Project {
  _id: string;
  title: string;
  synopsis: string;
  gitRepo?: string;
  weblinks: string[];
  createdBy: string;
  teamMembers: TeamMember[];
  createdAt: string;
}

interface ProjectsClientProps {
  initialProjects: Project[];
  currentUserId: string;
}

export default function ProjectsClient({
  initialProjects,
  currentUserId,
}: ProjectsClientProps) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [taggingProjectId, setTaggingProjectId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title: "",
    synopsis: "",
    gitRepo: "",
    weblinks: "",
    teamMembers: [] as TeamMember[],
  });

  const resetForm = () => {
    setForm({
      title: "",
      synopsis: "",
      gitRepo: "",
      weblinks: "",
      teamMembers: [],
    });
    setEditingId(null);
    setShowModal(false);
  };

  const loadProjects = async () => {
    const res = await fetch("/api/projects");
    if (res.ok) {
      const data = await res.json();
      setProjects(data.projects);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const weblinks = form.weblinks
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      const payload = {
        title: form.title,
        synopsis: form.synopsis,
        gitRepo: form.gitRepo || undefined,
        weblinks,
        teamMembers: form.teamMembers,
      };

      if (editingId) {
        const res = await fetch(`/api/projects/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to update");
        toast.success("Project updated!");
      } else {
        const res = await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to create");
        toast.success("Project created!");
      }
      await loadProjects();
      resetForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this project?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Project deleted");
      await loadProjects();
    } catch (err) {
      toast.error("Failed to delete");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (p: Project) => {
    setForm({
      title: p.title,
      synopsis: p.synopsis,
      gitRepo: p.gitRepo || "",
      weblinks: (p.weblinks || []).join("\n"),
      teamMembers: p.teamMembers || [],
    });
    setEditingId(p._id);
    setShowModal(true);
  };

  const searchUsers = async () => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
    if (res.ok) {
      const data = await res.json();
      setSearchResults(data.users || []);
    }
  };

  useEffect(() => {
    const t = setTimeout(searchUsers, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const addTaggedMember = (user: any) => {
    const name = `${user.firstName || ""} ${user.lastName || ""}`.trim();
    if (form.teamMembers.some((m) => m.userId === user.userId)) return;
    setForm((prev) => ({
      ...prev,
      teamMembers: [
        ...prev.teamMembers,
        {
          userId: user.userId,
          userName: name || user.userId,
          userImage: user.imageUrl,
          taggedAt: new Date().toISOString(),
        },
      ],
    }));
    setSearchQuery("");
    setSearchResults([]);
  };

  const removeTaggedMember = (userId: string) => {
    setForm((prev) => ({
      ...prev,
      teamMembers: prev.teamMembers.filter((m) => m.userId !== userId),
    }));
  };

  const tagMemberInProject = async (projectId: string, user: any) => {
    const name = `${user.firstName || ""} ${user.lastName || ""}`.trim();
    try {
      const res = await fetch(`/api/projects/${projectId}/tag`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.userId,
          userName: name || user.userId,
          userImage: user.imageUrl,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to tag");
      }
      toast.success(`Tagged ${name}`);
      await loadProjects();
      setTaggingProjectId(null);
      setSearchQuery("");
      setSearchResults([]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to tag");
    }
  };

  const untagMember = async (projectId: string, userId: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/tag?userId=${userId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to remove");
      toast.success("Member removed");
      await loadProjects();
    } catch (err) {
      toast.error("Failed to remove");
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FolderGit2 className="h-8 w-8 text-primary" />
            My Projects
          </h1>
          <p className="text-muted-foreground mt-1">
            Upload projects, add synopsis, and tag team members
          </p>
        </div>
        <Button
          className="btn-primary"
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
        >
          <Plus className="h-5 w-5 mr-2" />
          New Project
        </Button>
      </div>

      {projects.length === 0 ? (
        <div className="card-modern p-12 text-center">
          <FolderGit2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Create a project to showcase your work, add a synopsis, Git repo or weblinks, and tag your team members.
          </p>
          <Button
            className="btn-primary"
            onClick={() => setShowModal(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Project
          </Button>
        </div>
      ) : (
        <div className="grid gap-6">
          {projects.map((p) => (
            <div
              key={p._id}
              className="card-modern p-6 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold mb-2">{p.title}</h2>
                  <p className="text-muted-foreground text-sm whitespace-pre-wrap mb-4">
                    {p.synopsis}
                  </p>
                  <div className="flex flex-wrap gap-3 text-sm">
                    {p.gitRepo && (
                      <a
                        href={p.gitRepo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        <Github className="h-4 w-4" />
                        Git Repo
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    {(p.weblinks || []).map((link, i) => (
                      <a
                        key={i}
                        href={link.startsWith("http") ? link : `https://${link}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        Link {i + 1}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 mt-4">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Team:</span>
                    <div className="flex flex-wrap gap-2">
                      {(p.teamMembers || []).map((m) => (
                        <div
                          key={m.userId}
                          className="flex items-center gap-1.5 bg-secondary rounded-full pl-1 pr-2 py-0.5"
                        >
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={m.userImage} />
                            <AvatarFallback className="text-[10px]">
                              {m.userName.slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs">{m.userName}</span>
                          {p.createdBy === currentUserId && (
                            <button
                              onClick={() => untagMember(p._id, m.userId)}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      ))}
                      {p.createdBy === currentUserId && (
                        <div className="relative">
                          {taggingProjectId === p._id ? (
                            <div className="absolute left-0 top-8 z-10 w-64 bg-card border rounded-lg shadow-lg p-2">
                              <Input
                                placeholder="Search users..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="mb-2"
                              />
                              <div className="max-h-40 overflow-y-auto space-y-1">
                                {searchResults.map((u) => (
                                  <button
                                    key={u.userId}
                                    onClick={() => tagMemberInProject(p._id, u)}
                                    className="w-full flex items-center gap-2 p-2 hover:bg-secondary rounded text-left"
                                  >
                                    <Avatar className="h-6 w-6">
                                      <AvatarImage src={u.imageUrl} />
                                      <AvatarFallback className="text-xs">
                                        {(u.firstName?.[0] || "") + (u.lastName?.[0] || "")}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm">
                                      {u.firstName} {u.lastName}
                                    </span>
                                  </button>
                                ))}
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="w-full mt-2"
                                onClick={() => setTaggingProjectId(null)}
                              >
                                Close
                              </Button>
                            </div>
                          ) : null}
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 text-xs"
                            onClick={() => setTaggingProjectId(taggingProjectId === p._id ? null : p._id)}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Tag
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {p.createdBy === currentUserId && (
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(p)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(p._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => resetForm()}
        >
          <div
            className="bg-card rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-6">
              {editingId ? "Edit Project" : "New Project"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Project name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Synopsis</label>
                <textarea
                  value={form.synopsis}
                  onChange={(e) => setForm((f) => ({ ...f, synopsis: e.target.value }))}
                  placeholder="Brief description of the project..."
                  className="w-full px-3 py-2 border rounded-md bg-background min-h-[100px]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Git Repo URL (optional)</label>
                <Input
                  value={form.gitRepo}
                  onChange={(e) => setForm((f) => ({ ...f, gitRepo: e.target.value }))}
                  placeholder="https://github.com/..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Web Links (one per line, optional)</label>
                <textarea
                  value={form.weblinks}
                  onChange={(e) => setForm((f) => ({ ...f, weblinks: e.target.value }))}
                  placeholder="https://demo.com"
                  className="w-full px-3 py-2 border rounded-md bg-background min-h-[60px]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tag Team Members</label>
                <div className="flex gap-2 mb-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users to tag..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                    {searchResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-card border rounded-lg shadow-lg max-h-40 overflow-y-auto z-10">
                        {searchResults.map((u) => (
                          <button
                            key={u.userId}
                            type="button"
                            onClick={() => addTaggedMember(u)}
                            className="w-full flex items-center gap-2 p-2 hover:bg-secondary rounded text-left"
                          >
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={u.imageUrl} />
                              <AvatarFallback className="text-xs">
                                {(u.firstName?.[0] || "") + (u.lastName?.[0] || "")}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">
                              {u.firstName} {u.lastName}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {form.teamMembers.map((m) => (
                    <div
                      key={m.userId}
                      className="flex items-center gap-1.5 bg-secondary rounded-full pl-1 pr-2 py-0.5"
                    >
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={m.userImage} />
                        <AvatarFallback className="text-[10px]">
                          {m.userName.slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs">{m.userName}</span>
                      <button
                        type="button"
                        onClick={() => removeTaggedMember(m.userId)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="btn-primary">
                  {loading ? "Saving..." : editingId ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
