import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AuthModal from "@/components/auth/AuthModal";
import BookCarousel from "@/components/books/BookCarousel";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, User, MessageCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getBookById, getSellerContact } from "@/services/booksService";
import { Book } from "@/types/database";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const BookDetail = () => {
  const { bookId } = useParams<{ bookId: string }>();
  const { user } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [book, setBook] = useState<Book | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBookContact, setSelectedBookContact] = useState<{
    mobile: string;
    email: string;
    address: string;
  } | null>(null);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [loadingContact, setLoadingContact] = useState(false);

  useEffect(() => {
    const fetchBook = async () => {
      if (!bookId) return;
      try {
        const data = await getBookById(bookId);
        setBook(data);
      } catch (error) {
        console.error("Error fetching book:", error);
        toast.error("Failed to load book details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBook();
  }, [bookId]);

  const handleContact = async () => {
    if (!book) return;
    
    if (user) {
      setLoadingContact(true);
      try {
        const contact = await getSellerContact(book.id);
        if (contact) {
          setSelectedBookContact(contact);
          setContactDialogOpen(true);
        } else {
          toast.error("Could not retrieve seller contact");
        }
      } catch (error) {
        toast.error("Failed to get seller contact");
      } finally {
        setLoadingContact(false);
      }
    } else {
      setAuthOpen(true);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header onAuthClick={() => setAuthOpen(true)} />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header onAuthClick={() => setAuthOpen(true)} />
        <main className="flex-1 py-10">
          <div className="container-wide text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Book Not Found</h1>
            <p className="text-muted-foreground mb-6">The book you're looking for doesn't exist or has been removed.</p>
            <Link to="/books">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Books
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header onAuthClick={() => setAuthOpen(true)} />

      <main className="flex-1 py-8">
        <div className="container-wide max-w-4xl">
          <Link to="/books">
            <Button variant="ghost" size="sm" className="mb-6">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Books
            </Button>
          </Link>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Image Carousel */}
            <div>
              <BookCarousel
                images={book.image_urls || []}
                title={book.title}
              />
            </div>

            {/* Book Details */}
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-3">{book.title}</h1>

              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant={book.price ? "default" : "outline"}>
                  {book.price ? "For Sale" : "Exchange"}
                </Badge>
                {book.condition && (
                  <Badge variant="secondary">{book.condition}</Badge>
                )}
                {book.is_sold && (
                  <Badge variant="destructive">Sold</Badge>
                )}
              </div>

              {book.price && book.price > 0 && (
                <p className="text-3xl font-bold text-primary mb-4">₹{book.price}</p>
              )}

              {book.description && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
                  <p className="text-foreground whitespace-pre-wrap">{book.description}</p>
                </div>
              )}

              <Card className="mb-6">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{book.contributor_name || "Anonymous"}</p>
                      <p className="text-sm text-muted-foreground">Seller</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {!book.is_sold && (
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleContact}
                  disabled={loadingContact}
                >
                  {loadingContact ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <MessageCircle className="w-4 h-4 mr-2" />
                  )}
                  {user ? "Contact Seller" : "Login to Contact Seller"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />

      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        message="Login to contact the seller"
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
                <p className="font-medium text-foreground">{selectedBookContact.mobile || "Not provided"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Location</p>
                <p className="font-medium text-foreground">{selectedBookContact.address}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BookDetail;
