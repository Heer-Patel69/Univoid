import { useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AuthModal from "@/components/auth/AuthModal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, Clock, ArrowRight } from "lucide-react";

const mockBlogs = [
  {
    id: 1,
    title: "How I Survived My First Year: Tips for Freshers",
    excerpt: "A comprehensive guide for incoming students covering everything from time management to making friends in a new environment.",
    author: "Alex Chen",
    authorLevel: 12,
    date: "2024-01-17",
    readTime: "5 min read",
    category: "Student Life",
  },
  {
    id: 2,
    title: "The Ultimate Guide to Effective Note-Taking",
    excerpt: "Discover different note-taking methods and find the one that works best for your learning style.",
    author: "Sarah Kim",
    authorLevel: 11,
    date: "2024-01-15",
    readTime: "8 min read",
    category: "Study Tips",
  },
  {
    id: 3,
    title: "Landing Your First Internship: What Really Matters",
    excerpt: "Real advice from students who've been through the process. What recruiters look for and how to stand out.",
    author: "Mike Johnson",
    authorLevel: 10,
    date: "2024-01-13",
    readTime: "6 min read",
    category: "Career",
  },
  {
    id: 4,
    title: "Budget-Friendly Meals Every Student Should Know",
    excerpt: "Quick, healthy, and cheap recipes that you can make in your dorm or apartment without fancy equipment.",
    author: "Emma Wilson",
    authorLevel: 8,
    date: "2024-01-11",
    readTime: "4 min read",
    category: "Student Life",
  },
  {
    id: 5,
    title: "Managing Stress During Exam Season",
    excerpt: "Practical strategies for staying calm and focused when the pressure is on. Mental health tips that actually work.",
    author: "David Lee",
    authorLevel: 9,
    date: "2024-01-09",
    readTime: "7 min read",
    category: "Wellness",
  },
  {
    id: 6,
    title: "Why Group Study Works (When Done Right)",
    excerpt: "The science behind collaborative learning and how to organize effective study sessions with peers.",
    author: "Lisa Brown",
    authorLevel: 7,
    date: "2024-01-07",
    readTime: "5 min read",
    category: "Study Tips",
  },
];

const Blogs = () => {
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header onAuthClick={() => setAuthOpen(true)} />
      
      <main className="flex-1 py-8">
        <div className="container-wide">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Student Blogs
            </h1>
            <p className="text-muted-foreground">
              Insights, experiences, and tips from fellow students
            </p>
          </div>

          {/* Blog List */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockBlogs.map((blog) => (
              <Card key={blog.id} className="hover:border-primary/30 transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="secondary" className="text-xs">{blog.category}</Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {blog.readTime}
                    </span>
                  </div>
                  
                  <h3 className="font-semibold text-foreground mb-2 line-clamp-2">
                    {blog.title}
                  </h3>
                  
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                    {blog.excerpt}
                  </p>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{blog.author}</p>
                        <p className="text-xs text-muted-foreground">Level {blog.authorLevel}</p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {blog.date}
                    </span>
                  </div>
                  
                  <Button variant="ghost" size="sm" className="w-full mt-4 flex items-center justify-center gap-1">
                    Read article <ArrowRight className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-12 text-center p-8 bg-secondary/30 rounded-lg">
            <p className="text-muted-foreground mb-4">
              Have something to share with fellow students?
            </p>
            <Button onClick={() => setAuthOpen(true)}>
              Write a blog post
            </Button>
          </div>
        </div>
      </main>

      <Footer />
      
      <AuthModal 
        isOpen={authOpen} 
        onClose={() => setAuthOpen(false)}
        message="Login to write blog posts"
      />
    </div>
  );
};

export default Blogs;