import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Save, Camera, User, X, Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";


const SKILL_SUGGESTIONS = [
  "Python", "JavaScript", "React", "Node.js", "Java", "C++", "Machine Learning",
  "Data Science", "Web Development", "Mobile Development", "UI/UX Design",
  "Graphic Design", "Content Writing", "Marketing", "Finance", "Public Speaking"
];

const EditProfile = () => {
  const navigate = useNavigate();
  const { user, profile, isLoading: authLoading, updateProfile, uploadProfilePhoto } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [skillInput, setSkillInput] = useState("");
  
  const [form, setForm] = useState({
    full_name: "",
    college_name: "",
    course_stream: "",
    year_semester: "",
    mobile_number: "",
    bio: "",
    skills: [] as string[],
  });

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || "",
        college_name: profile.college_name || "",
        course_stream: profile.course_stream || "",
        year_semester: profile.year_semester || "",
        mobile_number: profile.mobile_number || "",
        bio: "",
        skills: [],
      });
      setPreviewUrl(profile.profile_photo_url || null);
    }
  }, [profile]);

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setIsUploadingPhoto(true);
    try {
      // Show preview immediately
      const reader = new FileReader();
      reader.onload = (e) => setPreviewUrl(e.target?.result as string);
      reader.readAsDataURL(file);

      // Upload (AuthContext handles compression internally)
      const { url, error } = await uploadProfilePhoto(file);
      
      if (error) {
        throw error;
      }
      
      if (url) {
        setPreviewUrl(url);
        toast.success("Photo updated!");
      }
    } catch (error: any) {
      console.error("Photo upload error:", error);
      toast.error("Failed to upload photo");
      setPreviewUrl(profile?.profile_photo_url || null);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const addSkill = (skill: string) => {
    const normalized = skill.trim();
    if (normalized && !form.skills.includes(normalized) && form.skills.length < 10) {
      setForm(prev => ({ ...prev, skills: [...prev.skills, normalized] }));
      setSkillInput("");
    }
  };

  const removeSkill = (skill: string) => {
    setForm(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skill) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.full_name.trim()) {
      toast.error("Name is required");
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: form.full_name.trim(),
          college_name: form.college_name.trim() || null,
          course_stream: form.course_stream.trim() || null,
          year_semester: form.year_semester.trim() || null,
          mobile_number: form.mobile_number.trim() || null,
        })
        .eq("id", user?.id);

      if (error) throw error;

      toast.success("Profile updated successfully!");
      navigate("/profile");
    } catch (error: any) {
      console.error("Save error:", error);
      toast.error(error.message || "Failed to save profile");
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    navigate("/");
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header onAuthClick={() => {}} />
      
      <main className="flex-1 py-8">
        <div className="container-wide max-w-xl">
          <Button variant="ghost" size="sm" className="mb-6" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>

          <Card>
            <CardHeader>
              <CardTitle>Edit Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Profile Photo */}
                <div className="flex flex-col items-center">
                  <div 
                    className="relative cursor-pointer group"
                    onClick={handlePhotoClick}
                  >
                    {previewUrl ? (
                      <img 
                        src={previewUrl} 
                        alt="Profile"
                        className="w-28 h-28 rounded-full object-cover border-4 border-primary/20"
                      />
                    ) : (
                      <div className="w-28 h-28 bg-accent rounded-full flex items-center justify-center border-4 border-primary/20">
                        <User className="w-12 h-12 text-muted-foreground" />
                      </div>
                    )}
                    
                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      {isUploadingPhoto ? (
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                      ) : (
                        <Camera className="w-6 h-6 text-white" />
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Click to change photo</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </div>

                {/* Name */}
                <div>
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input
                    id="full_name"
                    value={form.full_name}
                    onChange={(e) => setForm(prev => ({ ...prev, full_name: e.target.value }))}
                    placeholder="Your full name"
                    className="mt-1"
                    required
                  />
                </div>

                {/* College */}
                <div>
                  <Label htmlFor="college_name">College / University</Label>
                  <Input
                    id="college_name"
                    value={form.college_name}
                    onChange={(e) => setForm(prev => ({ ...prev, college_name: e.target.value }))}
                    placeholder="e.g. IIT Delhi"
                    className="mt-1"
                  />
                </div>

                {/* Course */}
                <div>
                  <Label htmlFor="course_stream">Course / Stream</Label>
                  <Input
                    id="course_stream"
                    value={form.course_stream}
                    onChange={(e) => setForm(prev => ({ ...prev, course_stream: e.target.value }))}
                    placeholder="e.g. B.Tech Computer Science"
                    className="mt-1"
                  />
                </div>

                {/* Year */}
                <div>
                  <Label htmlFor="year_semester">Year / Semester</Label>
                  <Input
                    id="year_semester"
                    value={form.year_semester}
                    onChange={(e) => setForm(prev => ({ ...prev, year_semester: e.target.value }))}
                    placeholder="e.g. 3rd Year"
                    className="mt-1"
                  />
                </div>

                {/* Mobile */}
                <div>
                  <Label htmlFor="mobile_number">Mobile Number</Label>
                  <Input
                    id="mobile_number"
                    value={form.mobile_number}
                    onChange={(e) => setForm(prev => ({ ...prev, mobile_number: e.target.value }))}
                    placeholder="e.g. +91 9876543210"
                    className="mt-1"
                  />
                </div>

                {/* Skills */}
                <div>
                  <Label>Skills (up to 10)</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      placeholder="Add a skill..."
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addSkill(skillInput);
                        }
                      }}
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="icon"
                      onClick={() => addSkill(skillInput)}
                      disabled={!skillInput.trim() || form.skills.length >= 10}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {form.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {form.skills.map((skill) => (
                        <Badge key={skill} variant="secondary" className="gap-1 pr-1">
                          {skill}
                          <button
                            type="button"
                            onClick={() => removeSkill(skill)}
                            className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}

                  {form.skills.length < 10 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {SKILL_SUGGESTIONS.filter(s => !form.skills.includes(s)).slice(0, 8).map((skill) => (
                        <Badge 
                          key={skill} 
                          variant="outline" 
                          className="cursor-pointer hover:bg-accent text-xs"
                          onClick={() => addSkill(skill)}
                        >
                          + {skill}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Submit */}
                <div className="flex gap-3 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => navigate(-1)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1" disabled={isSaving}>
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default EditProfile;
