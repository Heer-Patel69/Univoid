import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Book, Loader2, AlertTriangle } from "lucide-react";
import { Book as BookType } from "@/types/database";
import { updateBookStatus } from "@/services/booksService";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface MyBooksSectionProps {
  books: BookType[];
  isLoading: boolean;
  onRefresh: () => void;
}

type BookStatus = 'available' | 'sold' | 'rented';

const getStatusBadge = (status: BookStatus, listingType?: string | null) => {
  switch (status) {
    case 'sold':
      return <Badge variant="destructive">Sold Out</Badge>;
    case 'rented':
      return <Badge className="bg-yellow-500 hover:bg-yellow-600">Rented</Badge>;
    case 'available':
    default:
      return <Badge className="bg-green-600 hover:bg-green-700">Available</Badge>;
  }
};

const getPrice = (book: BookType) => {
  if (book.listing_type === 'donate') return 'Free';
  if (book.listing_type === 'exchange') return 'Exchange';
  if (book.price) {
    return `₹${book.price}${book.listing_type === 'rent' ? '/mo' : ''}`;
  }
  return 'N/A';
};

const MyBooksSection = ({ books, isLoading, onRefresh }: MyBooksSectionProps) => {
  const [selectedBook, setSelectedBook] = useState<BookType | null>(null);
  const [newStatus, setNewStatus] = useState<BookStatus | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async () => {
    if (!selectedBook || !newStatus) return;
    
    setIsUpdating(true);
    const { error } = await updateBookStatus(selectedBook.id, newStatus);
    setIsUpdating(false);
    
    if (error) {
      toast.error("Failed to update book status");
    } else {
      toast.success(`Book marked as ${newStatus}`);
      onRefresh();
    }
    
    setSelectedBook(null);
    setNewStatus(null);
  };

  const openStatusDialog = (book: BookType, status: BookStatus) => {
    setSelectedBook(book);
    setNewStatus(status);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (books.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Book className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium text-foreground mb-2">No books listed</h3>
          <p className="text-muted-foreground mb-4">
            Start by listing your first book for sale, rent, or exchange
          </p>
          <Link to="/sell-book">
            <Button>List a Book</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-4">
        {books.map((book) => {
          const status = (book as any).book_status as BookStatus || 'available';
          const isAvailable = status === 'available';
          
          return (
            <Card key={book.id} className={!isAvailable ? "opacity-75" : ""}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  {/* Book Cover */}
                  <div className="w-20 h-28 flex-shrink-0 bg-secondary rounded overflow-hidden">
                    {book.image_urls && book.image_urls.length > 0 ? (
                      <img
                        src={book.image_urls[0]}
                        alt={book.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Book className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  
                  {/* Book Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-medium text-foreground truncate">{book.title}</h3>
                      {getStatusBadge(status, book.listing_type)}
                    </div>
                    
                    <p className="text-lg font-bold text-primary mb-3">
                      {getPrice(book)}
                    </p>
                    
                    {/* Actions for available books */}
                    {isAvailable && (
                      <div className="flex flex-wrap gap-2">
                        {book.listing_type === 'rent' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-yellow-600 border-yellow-600 hover:bg-yellow-50"
                            onClick={() => openStatusDialog(book, 'rented')}
                          >
                            Mark as Rented
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive border-destructive hover:bg-destructive/10"
                            onClick={() => openStatusDialog(book, 'sold')}
                          >
                            Mark as Sold
                          </Button>
                        )}
                      </div>
                    )}
                    
                    {!isAvailable && (
                      <p className="text-xs text-muted-foreground">
                        This book is no longer available to buyers
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Caution Dialog for marking as sold/rented */}
      <AlertDialog open={!!selectedBook} onOpenChange={() => setSelectedBook(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              Confirm Status Change
            </AlertDialogTitle>
            <AlertDialogDescription className="text-left">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 my-4">
                <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                  ⚠️ Please mark this book as <strong>{newStatus?.toUpperCase()}</strong> only if it has been successfully {newStatus === 'sold' ? 'sold' : 'rented'} via WhatsApp.
                </p>
                <p className="text-yellow-700 dark:text-yellow-300 text-sm mt-2">
                  Once marked, buyers will no longer be able to contact you for this book.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleStatusChange}
              disabled={isUpdating}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                `Yes, Mark as ${newStatus === 'sold' ? 'Sold' : 'Rented'}`
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default MyBooksSection;
