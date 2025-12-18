import { Link, Navigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import UserContentManager from "@/components/dashboard/UserContentManager";
import { AnimatedCounter } from "@/components/common/AnimatedCounter";
import { calculateLevel, getLevelProgress } from "@/types/database";
import { 
  User, 
  Trophy, 
  FileText,
  PenLine,
  Newspaper,
  BookOpen,
  Upload,
  Plus,
  Loader2,
  ArrowRight,
  Crown,
  Medal,
  Award
} from "lucide-react";

const Dashboard = () => {
  const { user, profile, isLoading } = useAuth();
  const { stats } = useDashboardStats(user?.id);
  const { leaderboard } = useLeaderboard(5);

  // Redirect to home if not authenticated (but only after loading is done)
  if (!isLoading && !user) {
    return <Navigate to="/" replace />;
  }

  // Show minimal loading indicator inline, not blocking
  const showLoadingOverlay = isLoading && !user;

  const xp = profile?.total_xp ?? 0;
  const level = calculateLevel(xp);
  const levelProgress = getLevelProgress(xp);
  const xpProgress = (levelProgress.current / levelProgress.max) * 100;

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-4 h-4 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-4 h-4 text-gray-400" />;
    if (rank === 3) return <Award className="w-4 h-4 text-amber-600" />;
    return <span className="text-xs font-medium text-muted-foreground">#{rank}</span>;
  };

  const statCards = [
    { label: "Materials Uploaded", value: stats.materialsCount, icon: FileText },
    { label: "Blogs Written", value: stats.blogsCount, icon: PenLine },
    { label: "News Submitted", value: stats.newsCount, icon: Newspaper },
    { label: "Books Listed", value: stats.booksCount, icon: BookOpen },
  ];

  const contributeActions = [
    { label: "Upload Material", icon: Upload, href: "/upload-material" },
    { label: "Submit News", icon: Newspaper, href: "/submit-news" },
    { label: "Write Blog", icon: PenLine, href: "/submit-blog" },
    { label: "List Book", icon: Plus, href: "/sell-book" },
  ];

  if (showLoadingOverlay) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

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
                      <span className="font-medium text-primary">
                        <AnimatedCounter value={levelProgress.current} duration={800} /> / {levelProgress.max}
                      </span>
                    </div>
                    <Progress value={xpProgress} className="h-2 transition-all duration-500" />
                    <p className="text-xs text-muted-foreground mt-1">
                      {levelProgress.max - levelProgress.current} XP to Level {levelProgress.nextLevel}
                    </p>
                  </div>
                </div>

                {/* XP & Rank Badge */}
                <div className="flex-shrink-0 text-center">
                  <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-2 transition-transform hover:scale-110">
                    <Trophy className="w-8 h-8 text-yellow-500" />
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    <AnimatedCounter value={xp} duration={1000} /> XP
                  </p>
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
              {/* Leaderboard Preview */}
              <Card className="overflow-hidden">
                <CardHeader className="pb-3 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-yellow-500" />
                      Leaderboard
                    </CardTitle>
                    <Link to="/leaderboard" className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
                      View all <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="pt-3">
                  <div className="space-y-2">
                    {leaderboard.length > 0 ? leaderboard.slice(0, 5).map((leader, index) => (
                      <div 
                        key={leader.id} 
                        className={`flex items-center gap-3 p-2.5 rounded-lg transition-all duration-200 hover:scale-[1.02] ${
                          user?.id === leader.id 
                            ? 'bg-primary/10 border border-primary/20' 
                            : 'bg-secondary/50'
                        }`}
                      >
                        <div className="w-6 h-6 rounded-full flex items-center justify-center bg-background">
                          {getRankIcon(index + 1)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {leader.full_name}
                            {user?.id === leader.id && <span className="text-xs text-primary ml-1">(You)</span>}
                          </p>
                          <p className="text-xs text-muted-foreground">Level {leader.level}</p>
                        </div>
                        <span className="text-xs font-semibold text-primary">{leader.total_xp} XP</span>
                      </div>
                    )) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Be the first to earn XP!
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Links */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Quick Links</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <Link to="/materials">
                      <Button variant="ghost" size="sm" className="w-full justify-start transition-transform hover:translate-x-1">
                        <FileText className="w-4 h-4 mr-2" />
                        Browse Materials
                      </Button>
                    </Link>
                    <Link to="/blogs">
                      <Button variant="ghost" size="sm" className="w-full justify-start transition-transform hover:translate-x-1">
                        <PenLine className="w-4 h-4 mr-2" />
                        Read Blogs
                      </Button>
                    </Link>
                    <Link to="/books">
                      <Button variant="ghost" size="sm" className="w-full justify-start transition-transform hover:translate-x-1">
                        <BookOpen className="w-4 h-4 mr-2" />
                        Book Exchange
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* User Content Manager */}
              <UserContentManager userId={user.id} />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;