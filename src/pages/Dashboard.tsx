import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  User, 
  Trophy, 
  Star,
  FileText,
  PenLine,
  Newspaper,
  BookOpen,
  ShoppingCart,
  Upload,
  Plus
} from "lucide-react";

// Mock user data - in real app, this would come from auth context
const mockUser = {
  name: "Alex Chen",
  email: "alex.chen@university.edu",
  level: 12,
  xp: 2450,
  xpToNextLevel: 3000,
  globalRank: 1,
  stats: {
    materialsUploaded: 24,
    blogsWritten: 8,
    newsSubmitted: 5,
    booksListed: 3,
    booksBought: 7,
  }
};

const topContributors = [
  { rank: 1, name: "Alex Chen", xp: 2450 },
  { rank: 2, name: "Sarah Kim", xp: 2180 },
  { rank: 3, name: "Mike Johnson", xp: 1950 },
  { rank: 4, name: "Emma Wilson", xp: 1720 },
  { rank: 5, name: "David Lee", xp: 1580 },
];

const Dashboard = () => {
  const xpProgress = (mockUser.xp / mockUser.xpToNextLevel) * 100;

  const statCards = [
    { label: "Materials Uploaded", value: mockUser.stats.materialsUploaded, icon: FileText },
    { label: "Blogs Written", value: mockUser.stats.blogsWritten, icon: PenLine },
    { label: "News Submitted", value: mockUser.stats.newsSubmitted, icon: Newspaper },
    { label: "Books Listed", value: mockUser.stats.booksListed, icon: BookOpen },
    { label: "Books Bought", value: mockUser.stats.booksBought, icon: ShoppingCart },
  ];

  const contributeActions = [
    { label: "Upload Material", icon: Upload, href: "/dashboard/upload-material" },
    { label: "Submit News", icon: Newspaper, href: "/dashboard/submit-news" },
    { label: "Write Blog", icon: PenLine, href: "/dashboard/write-blog" },
    { label: "List Book", icon: Plus, href: "/dashboard/list-book" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header onAuthClick={() => {}} isLoggedIn={true} />
      
      <main className="flex-1 py-8">
        <div className="container-wide">
          {/* User Header */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="w-10 h-10 text-primary" />
                  </div>
                </div>
                
                {/* User Info */}
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-foreground mb-1">{mockUser.name}</h1>
                  <p className="text-muted-foreground mb-4">Level {mockUser.level} • #{mockUser.globalRank} Global</p>
                  
                  {/* XP Progress */}
                  <div className="max-w-md">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">XP Progress</span>
                      <span className="font-medium text-primary">{mockUser.xp.toLocaleString()} / {mockUser.xpToNextLevel.toLocaleString()}</span>
                    </div>
                    <Progress value={xpProgress} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      {mockUser.xpToNextLevel - mockUser.xp} XP to Level {mockUser.level + 1}
                    </p>
                  </div>
                </div>

                {/* Rank Badge */}
                <div className="flex-shrink-0 text-center">
                  <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Trophy className="w-8 h-8 text-yellow-500" />
                  </div>
                  <p className="text-sm font-medium text-foreground">#{mockUser.globalRank}</p>
                  <p className="text-xs text-muted-foreground">Global Rank</p>
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
                    <Card key={action.label} className="hover:border-primary/50 transition-colors cursor-pointer">
                      <CardContent className="p-4 text-center">
                        <action.icon className="w-8 h-8 text-primary mx-auto mb-2" />
                        <p className="text-sm font-medium text-foreground">{action.label}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Leaderboard Preview */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Top Contributors</CardTitle>
                    <Link to="/leaderboard" className="text-sm text-primary hover:underline">
                      View all
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {topContributors.map((user) => (
                      <div 
                        key={user.rank} 
                        className={`flex items-center gap-3 p-2 rounded-lg ${
                          user.name === mockUser.name ? 'bg-primary/5 border border-primary/20' : ''
                        }`}
                      >
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                          user.rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                          user.rank === 2 ? 'bg-gray-100 text-gray-700' :
                          user.rank === 3 ? 'bg-amber-100 text-amber-700' :
                          'bg-secondary text-muted-foreground'
                        }`}>
                          {user.rank}
                        </span>
                        <span className="flex-1 text-sm font-medium text-foreground">{user.name}</span>
                        <span className="text-sm text-primary font-medium">{user.xp.toLocaleString()}</span>
                      </div>
                    ))}
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