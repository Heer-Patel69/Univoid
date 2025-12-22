import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import AuthModal from "@/components/auth/AuthModal";
import BookCarousel from "@/components/books/BookCarousel";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Loader2, ArrowLeft, MessageSquare } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getBookById, getSellerContact } from "@/services/booksService";
import { Book } from "@/types/database";
import { toast } from "sonner";
import PageBreadcrumb from "@/components/common/PageBreadcrumb";
import { openWhatsAppContact, getListingType } from "@/lib/whatsappContact";
import { getDisplayCategory } from "@/lib/bookCategorizer";

const BookDetail = () => {
  const { bookId } = useParams<{ bookId: string }>();
  const { user } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [book, setBook] = useState<Book | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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

  const handleWhatsAppContact = async () => {
    if (!book) return;
    
    if (!user) {
      setAuthOpen(true);
      return;
    }

    setLoadingContact(true);
    try {
      const contact = await getSellerContact(book.id);
      if (contact && contact.mobile && contact.mobile !== '••••••••••') {
        openWhatsAppContact({
          bookName: book.title,
          price: book.price,
          listingType: getListingType(book.listing_type, book.price),
          sellerMobile: contact.mobile,
        });
      } else {
        toast.error("Seller's WhatsApp number is not available");
      }
    } catch (error) {
      toast.error("Failed to get seller contact");
    } finally {
      setLoadingContact(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="py-10">
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
      </div>
    );
  }

  const listingType = getListingType(book.listing_type, book.price);
  const listingLabels: Record<string, string> = {
    sell: 'For Sale',
    rent: 'For Rent',
    donate: 'Free (Donate)',
    exchange: 'Exchange',
  };
  const listingLabel = listingLabels[listingType] || 'For Sale';

  return (
    <div className="py-8">
      <div className="container-wide max-w-4xl">
        <PageBreadcrumb 
          items={[
            { label: "Books", href: "/books" },
            { label: book.title }
          ]} 
        />

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
                {listingLabel}
              </Badge>
              {book.condition && (
                <Badge variant="secondary">{book.condition}</Badge>
              )}
              <Badge variant="outline">{getDisplayCategory(book.category)}</Badge>
              {(book.is_sold || (book as any).book_status === 'sold') && (
                <Badge variant="destructive">Sold Out</Badge>
              )}
              {(book as any).book_status === 'rented' && (
                <Badge className="bg-yellow-500">Rented</Badge>
              )}
            </div>

            {book.price && book.price > 0 && (
              <p className="text-3xl font-bold text-primary mb-4">
                ₹{book.price}{listingType === 'rent' ? '/month' : ''}
              </p>
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

            {/* Hide contact button for sold/rented books */}
            {!book.is_sold && (book as any).book_status !== 'sold' && (book as any).book_status !== 'rented' ? (
              <Button
                className="w-full bg-green-600 hover:bg-green-700"
                size="lg"
                onClick={handleWhatsAppContact}
                disabled={loadingContact}
              >
                {loadingContact ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <MessageSquare className="w-4 h-4 mr-2" />
                )}
                {user ? "Contact on WhatsApp" : "Login to Contact Seller"}
              </Button>
            ) : (
              <div className="p-4 bg-secondary rounded-lg text-center">
                <Badge variant="destructive" className="text-sm px-4 py-1.5">
                  {(book as any).book_status === 'rented' ? 'Currently Rented' : 'Sold Out'}
                </Badge>
                <p className="text-sm text-muted-foreground mt-2">
                  This book is no longer available
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        message="Login to contact the seller"
      />
    </div>
  );
};

export default BookDetail;
