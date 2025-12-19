import { useParams, Link, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Trophy, FileText, Newspaper, BookOpen, ArrowLeft, Loader2, Pencil, Save, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ProfileData {
  id: string;
  full_name: string;
  profile_photo_url: string | null;
  total_xp: number;
  college_name?: string | null;
  course_stream?: string | null;
  year_semester?: string | null;
}

interface ContributionStats {
  materials: number;
  news: number;
  books: number;
}

const Profile = () => {
  const { userId } = useParams();
  const { user, profile, isLoading: authLoading } = useAuth();
  const [publicProfile, setPublicProfile] = useState<ProfileData | null>(null);
  const [stats, setStats] = useState<ContributionStats>({ materials: 0, news: 0, books: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Editable fields
  const [editForm, setEditForm] = useState({
    full_name: "",
    college_name: "",
    course_stream: "",
    year_semester: "",
  });

  const isOwnProfile = !userId || userId === user?.id;
  const targetUserId = isOwnProfile ? user?.id : userId;

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!targetUserId) {
        setIsLoading(false);
        return;
      }

      try {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, full_name, profile_photo_url, total_xp, college_name, course_stream, year_semester')
          .eq('id', targetUserId)
          .maybeSingle();

        if (profileData) {
          setPublicProfile(profileData);
          setEditForm({
            full_name: profileData.full_name || "",
            college_name: profileData.college_name || "",
            course_stream: profileData.course_stream || "",
            year_semester: profileData.year_semester || "",
          });
        }

        const [materialsRes, newsRes, booksRes] = await Promise.all([
          supabase.from('materials').select('id', { count: 'exact', head: true }).eq('created_by', targetUserId),
          supabase.from('news').select('id', { count: 'exact', head: true }).eq('created_by', targetUserId),
          supabase.from('books').select('id', { count: 'exact', head: true }).eq('created_by', targetUserId),
        ]);

        setStats({
          materials: materialsRes.count ?? 0,
          news: newsRes.count ?? 0,
          books: booksRes.count ?? 0,
        });
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, [targetUserId]);

  const handleSave = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editForm.full_name,
          college_name: editForm.college_name,
          course_stream: editForm.course_stream,
          year_semester: editForm.year_semester,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success("Profile updated successfully!");
      setIsEditing(false);
      
      // Update local state
      setPublicProfile(prev => prev ? { ...prev, ...editForm } : null);
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isOwnProfile && !user) {
    return <Navigate to="/" replace />;
  }

  const displayProfile = isOwnProfile ? profile : publicProfile;
  const xp = displayProfile?.total_xp ?? 0;
  const level = Math.floor(xp / 250) + 1;

  const statItems = [
    { label: "Materials", value: stats.materials, icon: FileText },
    { label: "News", value: stats.news, icon: Newspaper },
    { label: "Books", value: stats.books, icon: BookOpen },
  ];

  if (!displayProfile) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header onAuthClick={() => {}} />
        <main className="flex-1 py-8">
          <div className="container-wide max-w-2xl text-center py-16">
            <p className="text-muted-foreground">Profile not found.</p>
            <Link to="/leaderboard">
              <Button variant="outline" className="mt-4">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Leaderboard
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header onAuthClick={() => {}} />
      
      <main className="flex-1 py-8">
        <div className="container-wide max-w-2xl">
          <Link to="/leaderboard">
            <Button variant="ghost" size="sm" className="mb-6">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Leaderboard
            </Button>
          </Link>

          <Card>
            <CardContent className="p-8">
              {/* Header */}
              <div className="flex flex-col items-center text-center mb-8">
                {displayProfile?.profile_photo_url ? (
                  <img 
                    src={displayProfile.profile_photo_url} 
                    alt={displayProfile.full_name}
                    className="w-24 h-24 rounded-full object-cover mb-4"
                  />
                ) : (
                  <div className="w-24 h-24 bg-accent rounded-full flex items-center justify-center mb-4">
                    <User className="w-12 h-12 text-primary" />
                  </div>
                )}
                
                {isEditing ? (
                  <Input
                    value={editForm.full_name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, full_name: e.target.value }))}
                    className="text-center text-xl font-bold max-w-xs"
                    placeholder="Your name"
                  />
                ) : (
                  <h1 className="text-2xl font-bold text-foreground mb-1">{displayProfile?.full_name ?? 'User'}</h1>
                )}
                <p className="text-muted-foreground">Level {level}</p>
                
                {/* Edit Button */}
                {isOwnProfile && !isEditing && (
                  <Button variant="outline" size="sm" className="mt-4 gap-2" onClick={() => setIsEditing(true)}>
                    <Pencil className="w-4 h-4" />
                    Edit Profile
                  </Button>
                )}
              </div>

              {/* Editable Fields */}
              {isEditing && isOwnProfile && (
                <div className="space-y-4 mb-8 max-w-sm mx-auto">
                  <div>
                    <Label className="text-sm">College Name</Label>
                    <Input
                      value={editForm.college_name}
                      onChange={(e) => setEditForm(prev => ({ ...prev, college_name: e.target.value }))}
                      placeholder="Your college"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Course / Stream</Label>
                    <Input
                      value={editForm.course_stream}
                      onChange={(e) => setEditForm(prev => ({ ...prev, course_stream: e.target.value }))}
                      placeholder="e.g. B.Tech CSE"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Year / Semester</Label>
                    <Input
                      value={editForm.year_semester}
                      onChange={(e) => setEditForm(prev => ({ ...prev, year_semester: e.target.value }))}
                      placeholder="e.g. 3rd Year"
                      className="mt-1"
                    />
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" className="flex-1" onClick={() => setIsEditing(false)}>
                      <X className="w-4 h-4 mr-1" /> Cancel
                    </Button>
                    <Button className="flex-1" onClick={handleSave} disabled={isSaving}>
                      {isSaving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                      Save
                    </Button>
                  </div>
                </div>
              )}

              {/* Profile Info (when not editing) */}
              {!isEditing && publicProfile && (publicProfile.college_name || publicProfile.course_stream) && (
                <div className="text-center text-sm text-muted-foreground mb-8 space-y-1">
                  {publicProfile.college_name && <p>{publicProfile.college_name}</p>}
                  {publicProfile.course_stream && publicProfile.year_semester && (
                    <p>{publicProfile.course_stream} • {publicProfile.year_semester}</p>
                  )}
                </div>
              )}

              {/* XP and Rank */}
              <div className="flex justify-center gap-8 mb-8">
                <div className="text-center">
                  <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Trophy className="w-7 h-7 text-primary" />
                  </div>
                  <p className="text-xl font-bold text-foreground">Lvl {level}</p>
                  <p className="text-xs text-muted-foreground">Current Level</p>
                </div>
                <div className="text-center">
                  <div className="w-14 h-14 bg-accent rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-lg font-bold text-primary">XP</span>
                  </div>
                  <p className="text-xl font-bold text-foreground">{xp.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Total XP</p>
                </div>
              </div>

              {/* Contribution Stats */}
              <div>
                <h2 className="text-sm font-medium text-muted-foreground mb-4 text-center">Contributions</h2>
                <div className="grid grid-cols-3 gap-4">
                  {statItems.map((stat) => (
                    <div key={stat.label} className="text-center p-4 bg-secondary/50 rounded-lg">
                      <stat.icon className="w-5 h-5 text-primary mx-auto mb-2" />
                      <p className="text-xl font-bold text-foreground">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Profile;
