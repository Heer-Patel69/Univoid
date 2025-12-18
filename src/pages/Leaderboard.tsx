import { useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AuthModal from "@/components/auth/AuthModal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Medal, Award, User } from "lucide-react";

const mockLeaderboard = [
  { rank: 1, name: "Alex Chen", xp: 2450, level: 12, materials: 24, blogs: 8, news: 5 },
  { rank: 2, name: "Sarah Kim", xp: 2180, level: 11, materials: 18, blogs: 12, news: 3 },
  { rank: 3, name: "Mike Johnson", xp: 1950, level: 10, materials: 15, blogs: 6, news: 8 },
  { rank: 4, name: "Emma Wilson", xp: 1720, level: 9, materials: 12, blogs: 10, news: 2 },
  { rank: 5, name: "David Lee", xp: 1580, level: 9, materials: 10, blogs: 5, news: 6 },
  { rank: 6, name: "Lisa Brown", xp: 1420, level: 8, materials: 8, blogs: 9, news: 1 },
  { rank: 7, name: "James Taylor", xp: 1280, level: 7, materials: 11, blogs: 3, news: 4 },
  { rank: 8, name: "Anna Martinez", xp: 1150, level: 7, materials: 7, blogs: 7, news: 2 },
  { rank: 9, name: "Chris Anderson", xp: 980, level: 6, materials: 6, blogs: 4, news: 3 },
  { rank: 10, name: "Sofia Garcia", xp: 850, level: 5, materials: 5, blogs: 5, news: 1 },
];

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Trophy className="w-5 h-5 text-yellow-500" />;
    case 2:
      return <Medal className="w-5 h-5 text-gray-400" />;
    case 3:
      return <Award className="w-5 h-5 text-amber-600" />;
    default:
      return (
        <span className="w-5 h-5 flex items-center justify-center text-sm font-medium text-muted-foreground">
          {rank}
        </span>
      );
  }
};

const Leaderboard = () => {
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header onAuthClick={() => setAuthOpen(true)} />
      
      <main className="flex-1 py-8">
        <div className="container-wide">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Leaderboard
            </h1>
            <p className="text-muted-foreground">
              Top contributors making UniVoid better for everyone
            </p>
          </div>

          {/* Top 3 Cards */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            {mockLeaderboard.slice(0, 3).map((user) => (
              <Card 
                key={user.rank} 
                className={`${user.rank === 1 ? 'border-yellow-500/50 bg-yellow-50/30 dark:bg-yellow-950/10' : ''}`}
              >
                <CardContent className="p-6 text-center">
                  <div className="flex justify-center mb-4">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                      user.rank === 1 ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                      user.rank === 2 ? 'bg-gray-100 dark:bg-gray-800' :
                      'bg-amber-100 dark:bg-amber-900/30'
                    }`}>
                      {getRankIcon(user.rank)}
                    </div>
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">{user.name}</h3>
                  <p className="text-sm text-muted-foreground mb-3">Level {user.level}</p>
                  <p className="text-2xl font-bold text-primary">{user.xp.toLocaleString()} XP</p>
                  <div className="flex justify-center gap-4 mt-4 text-xs text-muted-foreground">
                    <span>{user.materials} materials</span>
                    <span>{user.blogs} blogs</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Full Leaderboard */}
          <Card>
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
                      <tr key={user.rank} className="border-b border-border last:border-0 hover:bg-secondary/30">
                        <td className="p-4">
                          <div className="flex items-center">
                            {getRankIcon(user.rank)}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 text-primary" />
                            </div>
                            <span className="font-medium text-foreground">{user.name}</span>
                          </div>
                        </td>
                        <td className="p-4 text-muted-foreground hidden sm:table-cell">{user.level}</td>
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
          <div className="mt-12 text-center p-8 bg-secondary/30 rounded-lg">
            <p className="text-muted-foreground mb-4">
              Want to see your name on the leaderboard?
            </p>
            <Button onClick={() => setAuthOpen(true)}>
              Join and start contributing
            </Button>
          </div>
        </div>
      </main>

      <Footer />
      
      <AuthModal 
        isOpen={authOpen} 
        onClose={() => setAuthOpen(false)}
        message="Login to track your progress and climb the leaderboard"
      />
    </div>
  );
};

export default Leaderboard;