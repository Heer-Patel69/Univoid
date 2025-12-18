import { useParams, Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Trophy, FileText, PenLine, Newspaper, BookOpen, ArrowLeft } from "lucide-react";

// Mock profile data
const mockProfile = {
  name: "Sarah Kim",
  level: 11,
  xp: 2180,
  globalRank: 2,
  stats: {
    materialsUploaded: 18,
    blogsWritten: 12,
    newsSubmitted: 3,
    booksListed: 5,
  },
  hasPhoto: false,
};

const Profile = () => {
  const { userId } = useParams();

  const statItems = [
    { label: "Materials", value: mockProfile.stats.materialsUploaded, icon: FileText },
    { label: "Blogs", value: mockProfile.stats.blogsWritten, icon: PenLine },
    { label: "News", value: mockProfile.stats.newsSubmitted, icon: Newspaper },
    { label: "Books", value: mockProfile.stats.booksListed, icon: BookOpen },
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
                <div className="w-24 h-24 bg-accent rounded-full flex items-center justify-center mb-4">
                  <User className="w-12 h-12 text-primary" />
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-1">{mockProfile.name}</h1>
                <p className="text-muted-foreground">Level {mockProfile.level}</p>
              </div>

              {/* XP and Rank */}
              <div className="flex justify-center gap-8 mb-8">
                <div className="text-center">
                  <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Trophy className="w-7 h-7 text-primary" />
                  </div>
                  <p className="text-xl font-bold text-foreground">#{mockProfile.globalRank}</p>
                  <p className="text-xs text-muted-foreground">Global Rank</p>
                </div>
                <div className="text-center">
                  <div className="w-14 h-14 bg-accent rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-lg font-bold text-primary">XP</span>
                  </div>
                  <p className="text-xl font-bold text-foreground">{mockProfile.xp.toLocaleString()}</p>
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