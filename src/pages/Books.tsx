import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AuthModal from "@/components/auth/AuthModal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, BookOpen, User, MessageCircle, Loader2, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getBooks, getSellerContact } from "@/services/booksService";
import { Book } from "@/types/database";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const Books = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBookContact, setSelectedBookContact] = useState<{
    mobile: string;
    email: string;
    address: string;
  } | null>(null);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [loadingContact, setLoadingContact] = useState(false);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const data = await getBooks();
        // Filter out sold books
        setBooks(data.filter(book => !book.is_sold));
      } catch (error) {
        console.error('Error fetching books:', error);
        toast.error('Failed to load books');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBooks();
  }, []);

  const handleContact = async (book: Book) => {
    if (user) {
      setLoadingContact(true);
      try {
        const contact = await getSellerContact(book.id);
        if (contact) {
          setSelectedBookContact(contact);
          setContactDialogOpen(true);
        } else {
          toast.error('Could not retrieve seller contact');
        }
      } catch (error) {
        toast.error('Failed to get seller contact');
      } finally {
        setLoadingContact(false);
      }
    } else {
      setAuthMessage("Login to contact the seller");
      setAuthOpen(true);
    }
  };

  const handleListBook = () => {
    if (user) {
      navigate("/list-book");
    } else {
      setAuthMessage("Login to list your books");
      setAuthOpen(true);
    }
  };

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (book.description?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header onAuthClick={() => setAuthOpen(true)} />
      
      <main className="flex-1 py-10 md:py-14">
        <div className="container-wide">
          {/* Header */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-accent-foreground" />
              </div>
              <div>
                <h1 className="font-display text-2xl md:text-3xl text-foreground">
                  Book Exchange
                </h1>
                <p className="text-muted-foreground">
                  Buy, sell, or exchange textbooks with other students
                </p>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-8 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by title or description..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Books Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBooks.map((book) => (
                  <Card key={book.id} className="card-premium overflow-hidden group">
                    {book.image_urls && book.image_urls.length > 0 ? (
                      <div className="relative overflow-hidden">
                        <img
                          src={book.image_urls[0]}
                          alt={book.title}
                          className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-32 bg-accent flex items-center justify-center">
                        <BookOpen className="w-12 h-12 text-primary" />
                      </div>
                    )}
                    <CardContent className="p-5">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground text-sm line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                          {book.title}
                        </h3>
                        {book.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{book.description}</p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 mt-3">
                        <Badge variant={book.price ? "default" : "outline"} className="text-xs">
                          {book.price ? 'For Sale' : 'Exchange'}
                        </Badge>
                        {book.condition && (
                          <Badge variant="secondary" className="text-xs">{book.condition}</Badge>
                        )}
                      </div>
                      
                      {book.price && book.price > 0 && (
                        <p className="text-lg font-semibold text-primary mt-3">₹{book.price}</p>
                      )}
                      
                      <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                        <User className="w-3 h-3" />
                        <span>{book.contributor_name || 'Anonymous'}</span>
                      </div>
                      
                      <Button 
                        className="w-full mt-4" 
                        size="sm"
                        onClick={() => handleContact(book)}
                        disabled={loadingContact}
                      >
                        {loadingContact ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-1" />
                        ) : (
                          <MessageCircle className="w-4 h-4 mr-1" />
                        )}
                        Contact Seller
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredBooks.length === 0 && !isLoading && (
                <div className="text-center py-16">
                  <p className="text-muted-foreground">
                    {books.length === 0 ? 'No books have been listed yet. Be the first to list one!' : 'No books found matching your search.'}
                  </p>
                </div>
              )}
            </>
          )}

          {/* CTA */}
          <Card className="mt-12 border-0 bg-secondary/50">
            <CardContent className="p-8 text-center">
              <h3 className="font-display text-xl text-foreground mb-3">Have textbooks to sell or exchange?</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                List your books and connect with fellow students looking for study materials.
              </p>
              <Button onClick={handleListBook} className="shadow-premium-sm">
                List a book
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
        message={authMessage}
      />

      {/* Contact Dialog */}
      <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Seller Contact Information</DialogTitle>
          </DialogHeader>
          {selectedBookContact && (
            <div className="space-y-4 py-4">
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium text-foreground">{selectedBookContact.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Mobile</p>
                <p className="font-medium text-foreground">{selectedBookContact.mobile}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="font-medium text-foreground">{selectedBookContact.address}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Books;