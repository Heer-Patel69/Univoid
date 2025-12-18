import { useParams, Link, Navigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Trophy, FileText, PenLine, Newspaper, BookOpen, ArrowLeft, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Profile = () => {
  const { userId } = useParams();
  const { user, profile, isLoading } = useAuth();

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // If viewing own profile and not logged in, redirect
  const isOwnProfile = !userId || userId === user?.id;
  if (isOwnProfile && !user) {
    return <Navigate to="/" replace />;
  }

  // For own profile, use auth context data
  const displayProfile = isOwnProfile ? profile : null;
  const xp = displayProfile?.total_xp ?? 0;
  const level = Math.floor(xp / 250) + 1;

  const statItems = [
    { label: "Materials", value: 0, icon: FileText },
    { label: "Blogs", value: 0, icon: PenLine },
    { label: "News", value: 0, icon: Newspaper },
    { label: "Books", value: 0, icon: BookOpen },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header onAuthClick={() => {}} />
      
      <main className="flex-1 py-8">
        <div className="container-wide max-w-2xl">
          {/* Back Button */}
          <Link to="/leaderboard">
            <Button variant="ghost" size="sm" className="mb-6">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Leaderboard
            </Button>
          </Link>

          {/* Profile Card */}
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
                <h1 className="text-2xl font-bold text-foreground mb-1">{displayProfile?.full_name ?? 'User'}</h1>
                <p className="text-muted-foreground">Level {level}</p>
                {displayProfile?.college_name && (
                  <p className="text-sm text-muted-foreground mt-1">{displayProfile.college_name}</p>
                )}
              </div>

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
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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