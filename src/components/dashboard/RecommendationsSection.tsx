import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Code, Briefcase, Lightbulb, Calendar } from "lucide-react";
import { Profile } from "@/types/database";

interface RecommendationsSectionProps {
  profile: Profile | null;
}

const RecommendationsSection = ({ profile }: RecommendationsSectionProps) => {
  // Generate recommendations based on user profile
  const getRecommendations = () => {
    const recommendations = [];
    const interests = profile?.interests || [];
    const branch = profile?.branch?.toLowerCase() || "";
    const city = profile?.city?.toLowerCase() || "";

    // Branch-based recommendations
    if (branch.includes("computer") || branch.includes("cse") || branch.includes("it")) {
      recommendations.push({
        title: "Coding Hackathons",
        description: "Participate in coding competitions and win prizes",
        icon: Code,
        href: "/events?category=hackathon",
        color: "text-blue-500",
        bgColor: "bg-blue-500/10",
      });
    }

    // Interest-based recommendations
    if (interests.includes("Startups") || interests.includes("Hackathons")) {
      recommendations.push({
        title: "Startup Incubation Talks",
        description: "Learn from successful founders and mentors",
        icon: Lightbulb,
        href: "/events?category=workshop",
        color: "text-orange-500",
        bgColor: "bg-orange-500/10",
      });
    }

    if (interests.includes("Internships")) {
      recommendations.push({
        title: "Career Opportunities",
        description: "Find internships matching your skills",
        icon: Briefcase,
        href: "/tasks",
        color: "text-purple-500",
        bgColor: "bg-purple-500/10",
      });
    }

    // Location-based (if available)
    if (city) {
      recommendations.push({
        title: `Events in ${profile?.city}`,
        description: "Discover local meetups and workshops",
        icon: Calendar,
        href: "/events",
        color: "text-green-500",
        bgColor: "bg-green-500/10",
      });
    }

    // Default recommendations if none matched
    if (recommendations.length === 0) {
      recommendations.push(
        {
          title: "Explore Events",
          description: "Discover workshops, hackathons, and more",
          icon: Calendar,
          href: "/events",
          color: "text-blue-500",
          bgColor: "bg-blue-500/10",
        },
        {
          title: "Task Plaza",
          description: "Find tasks and earn while learning",
          icon: Briefcase,
          href: "/tasks",
          color: "text-purple-500",
          bgColor: "bg-purple-500/10",
        }
      );
    }

    return recommendations.slice(0, 4);
  };

  const recommendations = getRecommendations();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-yellow-500" />
          Recommended for you
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {recommendations.map((rec, index) => (
            <Link
              key={index}
              to={rec.href}
              className="flex items-center gap-4 p-3 rounded-xl hover:bg-secondary/50 transition-all group"
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${rec.bgColor} group-hover:scale-110 transition-transform`}
              >
                <rec.icon className={`w-5 h-5 ${rec.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-sm">{rec.title}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {rec.description}
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </Link>
          ))}
        </div>

        <Link to="/events">
          <Button variant="outline" className="w-full mt-4" size="sm">
            Explore All Events
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
};

export default RecommendationsSection;
