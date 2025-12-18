import { useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AuthModal from "@/components/auth/AuthModal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Medal, Award, User, ArrowRight, Crown } from "lucide-react";

const mockLeaderboard = [
  { rank: 1, name: "Alex Chen", xp: 2450, level: 12, materials: 24, blogs: 8, news: 5, userId: "alex-chen" },
  { rank: 2, name: "Sarah Kim", xp: 2180, level: 11, materials: 18, blogs: 12, news: 3, userId: "sarah-kim" },
  { rank: 3, name: "Mike Johnson", xp: 1950, level: 10, materials: 15, blogs: 6, news: 8, userId: "mike-johnson" },
  { rank: 4, name: "Emma Wilson", xp: 1720, level: 9, materials: 12, blogs: 10, news: 2, userId: "emma-wilson" },
  { rank: 5, name: "David Lee", xp: 1580, level: 9, materials: 10, blogs: 5, news: 6, userId: "david-lee" },
  { rank: 6, name: "Lisa Brown", xp: 1420, level: 8, materials: 8, blogs: 9, news: 1, userId: "lisa-brown" },
  { rank: 7, name: "James Taylor", xp: 1280, level: 7, materials: 11, blogs: 3, news: 4, userId: "james-taylor" },
  { rank: 8, name: "Anna Martinez", xp: 1150, level: 7, materials: 7, blogs: 7, news: 2, userId: "anna-martinez" },
  { rank: 9, name: "Chris Anderson", xp: 980, level: 6, materials: 6, blogs: 4, news: 3, userId: "chris-anderson" },
  { rank: 10, name: "Sofia Garcia", xp: 850, level: 5, materials: 5, blogs: 5, news: 1, userId: "sofia-garcia" },
];

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Crown className="w-5 h-5 text-warning" />;
    case 2:
      return <Medal className="w-5 h-5 text-muted-foreground" />;
    case 3:
      return <Award className="w-5 h-5 text-amber-600" />;
    default:
      return (
        <span className="w-5 h-5 flex items-center justify-center text-sm font-semibold text-muted-foreground">
          {rank}
        </span>
      );
  }
};

const getRankStyles = (rank: number) => {
  switch (rank) {
    case 1:
      return "bg-gradient-to-br from-warning/10 to-warning/5 border-warning/30";
    case 2:
      return "bg-gradient-to-br from-muted/50 to-muted/30 border-muted-foreground/20";
    case 3:
      return "bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/30";
    default:
      return "";
  }
};

const Leaderboard = () => {
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header onAuthClick={() => setAuthOpen(true)} />
      
      <main className="flex-1 py-10 md:py-14">
        <div className="container-wide">
          {/* Header */}
          <div className="mb-10 text-center">
            <div className="w-16 h-16 bg-warning/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8 text-warning" />
            </div>
            <h1 className="font-display text-2xl md:text-3xl text-foreground mb-2">
              Leaderboard
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              Top contributors making UniVoid better for everyone
            </p>
          </div>

          {/* Top 3 Podium */}
          <div className="grid md:grid-cols-3 gap-4 mb-10">
            {/* Second Place */}
            <div className="order-2 md:order-1 md:mt-8">
              <Card className={`${getRankStyles(2)} border transition-all hover:shadow-premium-md`}>
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Medal className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <Link to={`/profile/${mockLeaderboard[1].userId}`} className="hover:text-primary transition-colors">
                    <h3 className="font-semibold text-foreground mb-1">{mockLeaderboard[1].name}</h3>
                  </Link>
                  <p className="text-sm text-muted-foreground mb-3">Level {mockLeaderboard[1].level}</p>
                  <p className="text-2xl font-bold text-primary">{mockLeaderboard[1].xp.toLocaleString()} XP</p>
                  <div className="flex justify-center gap-4 mt-4 text-xs text-muted-foreground">
                    <span>{mockLeaderboard[1].materials} materials</span>
                    <span>{mockLeaderboard[1].blogs} blogs</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* First Place */}
            <div className="order-1 md:order-2">
              <Card className={`${getRankStyles(1)} border transition-all hover:shadow-premium-lg`}>
                <CardContent className="p-6 text-center">
                  <div className="w-20 h-20 bg-warning/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Crown className="w-10 h-10 text-warning" />
                  </div>
                  <Link to={`/profile/${mockLeaderboard[0].userId}`} className="hover:text-primary transition-colors">
                    <h3 className="font-semibold text-lg text-foreground mb-1">{mockLeaderboard[0].name}</h3>
                  </Link>
                  <p className="text-sm text-muted-foreground mb-3">Level {mockLeaderboard[0].level}</p>
                  <p className="text-3xl font-bold text-warning">{mockLeaderboard[0].xp.toLocaleString()} XP</p>
                  <div className="flex justify-center gap-4 mt-4 text-xs text-muted-foreground">
                    <span>{mockLeaderboard[0].materials} materials</span>
                    <span>{mockLeaderboard[0].blogs} blogs</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Third Place */}
            <div className="order-3 md:mt-12">
              <Card className={`${getRankStyles(3)} border transition-all hover:shadow-premium-md`}>
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Award className="w-8 h-8 text-amber-600" />
                  </div>
                  <Link to={`/profile/${mockLeaderboard[2].userId}`} className="hover:text-primary transition-colors">
                    <h3 className="font-semibold text-foreground mb-1">{mockLeaderboard[2].name}</h3>
                  </Link>
                  <p className="text-sm text-muted-foreground mb-3">Level {mockLeaderboard[2].level}</p>
                  <p className="text-2xl font-bold text-amber-600">{mockLeaderboard[2].xp.toLocaleString()} XP</p>
                  <div className="flex justify-center gap-4 mt-4 text-xs text-muted-foreground">
                    <span>{mockLeaderboard[2].materials} materials</span>
                    <span>{mockLeaderboard[2].blogs} blogs</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Full Leaderboard Table */}
          <Card className="shadow-premium-sm">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Rank</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">User</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden sm:table-cell">Level</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Materials</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Blogs</th>
                      <th className="text-right p-4 text-sm font-medium text-muted-foreground">XP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockLeaderboard.map((user) => (
                      <tr 
                        key={user.rank} 
                        className={`border-b border-border/50 last:border-0 hover:bg-secondary/30 transition-colors ${
                          user.rank <= 3 ? 'bg-accent/30' : ''
                        }`}
                      >
                        <td className="p-4">
                          <div className="flex items-center">
                            {getRankIcon(user.rank)}
                          </div>
                        </td>
                        <td className="p-4">
                          <Link to={`/profile/${user.userId}`} className="flex items-center gap-3 hover:text-primary transition-colors">
                            <div className="w-9 h-9 bg-secondary rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 text-muted-foreground" />
                            </div>
                            <span className="font-medium text-foreground">{user.name}</span>
                          </Link>
                        </td>
                        <td className="p-4 text-muted-foreground hidden sm:table-cell">Level {user.level}</td>
                        <td className="p-4 text-muted-foreground hidden md:table-cell">{user.materials}</td>
                        <td className="p-4 text-muted-foreground hidden md:table-cell">{user.blogs}</td>
                        <td className="p-4 text-right font-semibold text-primary">{user.xp.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <Card className="mt-12 border-0 bg-secondary/50">
            <CardContent className="p-8 text-center">
              <h3 className="font-display text-xl text-foreground mb-3">Want to climb the leaderboard?</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Start contributing study materials, write blogs, or share news. Every approved contribution earns you XP.
              </p>
              <Button onClick={() => setAuthOpen(true)} className="shadow-premium-sm">
                Start contributing
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
      
      <AuthModal 
        isOpen={authOpen} 
        onClose={() => setAuthOpen(false)}
        message="Sign in to track your progress and climb the leaderboard"
      />
    </div>
  );
};

export default Leaderboard;
