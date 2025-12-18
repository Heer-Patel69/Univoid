import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AuthModal from "@/components/auth/AuthModal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, BookOpen, User, MapPin, MessageCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const mockBooks = [
  {
    id: 1,
    title: "Calculus: Early Transcendentals",
    author: "James Stewart",
    edition: "8th Edition",
    condition: "Good",
    price: 45,
    type: "For Sale",
    seller: "Alex Chen",
    location: "West Campus",
  },
  {
    id: 2,
    title: "Introduction to Algorithms",
    author: "Cormen, Leiserson, Rivest",
    edition: "3rd Edition",
    condition: "Like New",
    price: 0,
    type: "Exchange",
    seller: "Sarah Kim",
    location: "Library Building",
  },
  {
    id: 3,
    title: "Organic Chemistry",
    author: "Paula Bruice",
    edition: "7th Edition",
    condition: "Fair",
    price: 30,
    type: "For Sale",
    seller: "Mike Johnson",
    location: "Science Complex",
  },
  {
    id: 4,
    title: "Principles of Economics",
    author: "N. Gregory Mankiw",
    edition: "9th Edition",
    condition: "Good",
    price: 35,
    type: "For Sale",
    seller: "Emma Wilson",
    location: "Business School",
  },
  {
    id: 5,
    title: "Physics for Scientists",
    author: "Serway & Jewett",
    edition: "10th Edition",
    condition: "Like New",
    price: 0,
    type: "Exchange",
    seller: "David Lee",
    location: "Engineering Building",
  },
  {
    id: 6,
    title: "Psychology: Themes and Variations",
    author: "Wayne Weiten",
    edition: "11th Edition",
    condition: "Good",
    price: 25,
    type: "For Sale",
    seller: "Lisa Brown",
    location: "Arts Building",
  },
];

const Books = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const handleContact = () => {
    if (user) {
      // TODO: Show seller contact info
      console.log("Showing seller contact...");
    } else {
      setAuthMessage("Login to contact the seller");
      setAuthOpen(true);
    }
  };

  const handleListBook = () => {
    if (user) {
      navigate("/dashboard");
    } else {
      setAuthMessage("Login to list your books");
      setAuthOpen(true);
    }
  };

  const filteredBooks = mockBooks.filter(book =>
    book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header onAuthClick={() => setAuthOpen(true)} />
      
      <main className="flex-1 py-8">
        <div className="container-wide">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Book Exchange
            </h1>
            <p className="text-muted-foreground">
              Buy, sell, or exchange textbooks with other students
            </p>
          </div>

          {/* Search */}
          <div className="relative mb-8 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by title or author..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Books Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBooks.map((book) => (
              <Card key={book.id} className="hover:border-primary/30 transition-colors">
                <CardContent className="p-5">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-16 h-20 bg-accent rounded flex items-center justify-center">
                      <BookOpen className="w-8 h-8 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground text-sm line-clamp-2 mb-1">
                        {book.title}
                      </h3>
                      <p className="text-xs text-muted-foreground">{book.author}</p>
                      <p className="text-xs text-muted-foreground">{book.edition}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-4">
                    <Badge variant={book.type === "Exchange" ? "outline" : "default"} className="text-xs">
                      {book.type}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">{book.condition}</Badge>
                  </div>
                  
                  {book.price > 0 && (
                    <p className="text-lg font-semibold text-primary mt-3">${book.price}</p>
                  )}
                  
                  <div className="flex flex-col gap-1 mt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {book.seller}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {book.location}
                    </span>
                  </div>
                  
                  <Button 
                    className="w-full mt-4" 
                    size="sm"
                    onClick={handleContact}
                  >
                    <MessageCircle className="w-4 h-4 mr-1" />
                    Contact Seller
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredBooks.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No books found matching your search.</p>
            </div>
          )}

          {/* CTA */}
          <div className="mt-12 text-center p-8 bg-secondary/30 rounded-lg">
            <p className="text-muted-foreground mb-4">
              Have textbooks to sell or exchange?
            </p>
            <Button onClick={handleListBook}>
              List a book
            </Button>
          </div>
        </div>
      </main>

      <Footer />
      
      <AuthModal 
        isOpen={authOpen} 
        onClose={() => setAuthOpen(false)}
        message={authMessage}
      />
    </div>
  );
};

export default Books;