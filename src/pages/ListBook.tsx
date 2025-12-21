import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { createBook } from "@/services/booksService";
import { toast } from "sonner";
import { ArrowLeft, BookOpen, Loader2, CheckCircle } from "lucide-react";
import BookImageUpload from "@/components/books/BookImageUpload";
import BookScanner from "@/components/books/BookScanner";
import { CompressedImage } from "@/lib/imageCompression";

const MAX_BOOK_IMAGES = 3;

const ListBook = () => {
  const { user, profile, isLoading } = useAuth();
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [description, setDescription] = useState("");
  const [condition, setCondition] = useState("");
  const [price, setPrice] = useState("");
  const [images, setImages] = useState<CompressedImage[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Handle book scanned from ISBN
  const handleBookScanned = (bookInfo: { title: string; author?: string }) => {
    setTitle(bookInfo.title);
    if (bookInfo.author) {
      setAuthor(bookInfo.author);
    }
  };

  // Check if form is valid for submission
  const isFormValid = title.trim().length > 0 && images.length > 0;

  // Route protection is handled by ProtectedRoute wrapper
  // Additional check for profile since we need it for seller info
  if (!user || !profile) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error("Please enter a book title");
      return;
    }

    if (images.length === 0) {
      toast.error("Please add at least one image");
      return;
    }

    setIsSubmitting(true);

    // Combine author into description if provided
    const fullDescription = author 
      ? `Author: ${author}${description ? '\n' + description : ''}`
      : description;

    const { id, error } = await createBook({
      title,
      description: fullDescription || undefined,
      author: author || undefined,
      condition: condition || undefined,
      price: price ? parseFloat(price) : undefined,
      seller_email: profile.email,
      seller_mobile: profile.mobile_number || '',
      seller_address: profile.college_name,
      created_by: user.id,
      images: images.map(img => img.file),
    });

    setIsSubmitting(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    setIsSuccess(true);
    toast.success("Book listed successfully!");
  };

  if (isSuccess) {
    return (
      <main className="flex-1 py-8">
        <div className="container-wide max-w-lg">
          <Card>
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">Book Listed!</h2>
              <p className="text-muted-foreground mb-6">
                Your book is now live in the book exchange!
              </p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={() => { setIsSuccess(false); setTitle(""); setAuthor(""); setDescription(""); setCondition(""); setPrice(""); setImages([]); }}>
                  List Another
                </Button>
                <Link to="/dashboard">
                  <Button>Go to Dashboard</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 py-8">
        <div className="container-wide max-w-lg">
          <Link to="/dashboard">
            <Button variant="ghost" size="sm" className="mb-6">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Dashboard
            </Button>
          </Link>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                List a Book
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Book Photos * (max 3)</Label>
                    <span className="text-xs text-muted-foreground">{images.length}/3</span>
                  </div>
                  <BookImageUpload
                    images={images}
                    onImagesChange={setImages}
                    maxImages={MAX_BOOK_IMAGES}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="title">Book Title *</Label>
                    <BookScanner onBookScanned={handleBookScanned} />
                  </div>
                  <Input
                    id="title"
                    placeholder="e.g., Calculus: Early Transcendentals"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Tip: Use "Scan ISBN" to auto-fill book details
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="author">Author</Label>
                  <Input
                    id="author"
                    placeholder="e.g., James Stewart"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Additional Details</Label>
                  <Textarea
                    id="description"
                    placeholder="Author, edition, subject, etc..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="condition">Condition</Label>
                    <Select value={condition} onValueChange={setCondition}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Like New">Like New</SelectItem>
                        <SelectItem value="Good">Good</SelectItem>
                        <SelectItem value="Fair">Fair</SelectItem>
                        <SelectItem value="Poor">Poor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price">Price (₹)</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      placeholder="0 for exchange"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                    />
                  </div>
                </div>

                <div className="p-4 bg-secondary/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">Contact Info:</strong> Your email ({profile.email}) and location ({profile.college_name}) will be shared with interested buyers.
                  </p>
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting || !isFormValid}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <BookOpen className="w-4 h-4 mr-2" />
                      List Book
                    </>
                  )}
                </Button>
                {!isFormValid && (
                  <p className="text-xs text-muted-foreground text-center">
                    Add at least 1 photo and enter a book title to continue
                  </p>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ListBook;