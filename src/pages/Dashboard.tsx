import { Link, Navigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { 
  User, 
  Trophy, 
  FileText,
  PenLine,
  Newspaper,
  BookOpen,
  ShoppingCart,
  Upload,
  Plus,
  Loader2
} from "lucide-react";

const Dashboard = () => {
  const { user, profile, isLoading } = useAuth();
  const { stats, isLoading: statsLoading } = useDashboardStats(user?.id);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect to home if not authenticated
  if (!user) {
    return <Navigate to="/" replace />;
  }

  const xp = profile?.total_xp ?? 0;
  const level = Math.floor(xp / 250) + 1;
  const xpInCurrentLevel = xp % 250;
  const xpToNextLevel = 250;
  const xpProgress = (xpInCurrentLevel / xpToNextLevel) * 100;

  const statCards = [
    { label: "Materials Uploaded", value: stats.materialsCount, icon: FileText },
    { label: "Blogs Written", value: stats.blogsCount, icon: PenLine },
    { label: "News Submitted", value: stats.newsCount, icon: Newspaper },
    { label: "Books Listed", value: stats.booksCount, icon: BookOpen },
  ];

  const contributeActions = [
    { label: "Upload Material", icon: Upload, href: "/upload-material" },
    { label: "Submit News", icon: Newspaper, href: "/submit-news" },
    { label: "Write Blog", icon: PenLine, href: "/write-blog" },
    { label: "List Book", icon: Plus, href: "/list-book" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header onAuthClick={() => {}} />
      
      <main className="flex-1 py-8">
        <div className="container-wide">
          {/* User Header */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {profile?.profile_photo_url ? (
                    <img 
                      src={profile.profile_photo_url} 
                      alt={profile.full_name}
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="w-10 h-10 text-primary" />
                    </div>
                  )}
                </div>
                
                {/* User Info */}
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-foreground mb-1">{profile?.full_name ?? 'User'}</h1>
                  <p className="text-muted-foreground mb-4">Level {level} • {profile?.college_name}</p>
                  
                  {/* XP Progress */}
                  <div className="max-w-md">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">XP Progress</span>
                      <span className="font-medium text-primary">{xpInCurrentLevel} / {xpToNextLevel}</span>
                    </div>
                    <Progress value={xpProgress} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      {xpToNextLevel - xpInCurrentLevel} XP to Level {level + 1}
                    </p>
                  </div>
                </div>

                {/* XP & Rank Badge */}
                <div className="flex-shrink-0 text-center">
                  <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Trophy className="w-8 h-8 text-yellow-500" />
                  </div>
                  <p className="text-sm font-medium text-foreground">{xp} XP</p>
                  <p className="text-xs text-muted-foreground">
                    {stats.globalRank ? `#${stats.globalRank} Global` : 'Total XP'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Contribution Stats */}
              <section>
                <h2 className="text-lg font-semibold text-foreground mb-4">Your Contributions</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {statCards.map((stat) => (
                    <Card key={stat.label}>
                      <CardContent className="p-4 text-center">
                        <stat.icon className="w-6 h-6 text-primary mx-auto mb-2" />
                        <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>

              {/* Contribute Section */}
              <section>
                <h2 className="text-lg font-semibold text-foreground mb-4">Contribute</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {contributeActions.map((action) => (
                    <Link key={action.label} to={action.href}>
                      <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                        <CardContent className="p-4 text-center">
                          <action.icon className="w-8 h-8 text-primary mx-auto mb-2" />
                          <p className="text-sm font-medium text-foreground">{action.label}</p>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </section>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Links */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Quick Links</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <Link to="/leaderboard">
                      <Button variant="ghost" size="sm" className="w-full justify-start">
                        <Trophy className="w-4 h-4 mr-2" />
                        View Leaderboard
                      </Button>
                    </Link>
                    <Link to="/materials">
                      <Button variant="ghost" size="sm" className="w-full justify-start">
                        <FileText className="w-4 h-4 mr-2" />
                        Browse Materials
                      </Button>
                    </Link>
                    <Link to="/blogs">
                      <Button variant="ghost" size="sm" className="w-full justify-start">
                        <PenLine className="w-4 h-4 mr-2" />
                        Read Blogs
                      </Button>
                    </Link>
                    <Link to="/books">
                      <Button variant="ghost" size="sm" className="w-full justify-start">
                        <BookOpen className="w-4 h-4 mr-2" />
                        Book Exchange
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;