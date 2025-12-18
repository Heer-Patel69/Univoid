import { useState } from "react";
import { Navigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Check, X, Eye, FileText, Newspaper, PenLine, BookOpen, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

// Mock pending items
const mockPendingMaterials = [
  { id: 1, title: "Linear Algebra Complete Notes", subject: "Mathematics", submitter: "John Doe", date: "2024-01-18" },
  { id: 2, title: "Machine Learning Cheat Sheet", subject: "Computer Science", submitter: "Jane Smith", date: "2024-01-17" },
];

const mockPendingNews = [
  { id: 1, title: "New Lab Equipment Arrived", category: "Campus", submitter: "Mike Wilson", date: "2024-01-18" },
  { id: 2, title: "Sports Day Announcement", category: "Events", submitter: "Sarah Brown", date: "2024-01-17" },
];

const mockPendingBlogs = [
  { id: 1, title: "My Exchange Semester Experience", category: "Student Life", author: "Emma Davis", date: "2024-01-18" },
];

const mockPendingBooks = [
  { id: 1, title: "Database Systems Concepts", condition: "Good", price: 40, seller: "Chris Lee", date: "2024-01-18" },
  { id: 2, title: "Operating Systems", condition: "Like New", price: 50, seller: "Anna Kim", date: "2024-01-17" },
];

const Admin = () => {
  const { user, isAdmin, isLoading } = useAuth();
  const [materials, setMaterials] = useState(mockPendingMaterials);
  const [news, setNews] = useState(mockPendingNews);
  const [blogs, setBlogs] = useState(mockPendingBlogs);
  const [books, setBooks] = useState(mockPendingBooks);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect if not admin
  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  const handleApprove = (type: string, id: number) => {
    switch (type) {
      case 'materials':
        setMaterials(materials.filter(m => m.id !== id));
        break;
      case 'news':
        setNews(news.filter(n => n.id !== id));
        break;
      case 'blogs':
        setBlogs(blogs.filter(b => b.id !== id));
        break;
      case 'books':
        setBooks(books.filter(b => b.id !== id));
        break;
    }
  };

  const handleReject = (type: string, id: number) => {
    handleApprove(type, id); // Same removal logic for demo
  };

  const pendingCounts = {
    materials: materials.length,
    news: news.length,
    blogs: blogs.length,
    books: books.length,
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header onAuthClick={() => {}} />
      
      <main className="flex-1 py-8">
        <div className="container-wide">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground">
              Review and approve pending submissions
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <FileText className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold text-foreground">{pendingCounts.materials}</p>
                  <p className="text-xs text-muted-foreground">Pending Materials</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <Newspaper className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold text-foreground">{pendingCounts.news}</p>
                  <p className="text-xs text-muted-foreground">Pending News</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <PenLine className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold text-foreground">{pendingCounts.blogs}</p>
                  <p className="text-xs text-muted-foreground">Pending Blogs</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <BookOpen className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold text-foreground">{pendingCounts.books}</p>
                  <p className="text-xs text-muted-foreground">Pending Books</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Card>
            <Tabs defaultValue="materials">
              <CardHeader className="pb-0">
                <TabsList className="grid grid-cols-4 w-full max-w-md">
                  <TabsTrigger value="materials" className="text-xs sm:text-sm">
                    Materials {pendingCounts.materials > 0 && <Badge className="ml-1 h-5 w-5 p-0 text-xs">{pendingCounts.materials}</Badge>}
                  </TabsTrigger>
                  <TabsTrigger value="news" className="text-xs sm:text-sm">
                    News {pendingCounts.news > 0 && <Badge className="ml-1 h-5 w-5 p-0 text-xs">{pendingCounts.news}</Badge>}
                  </TabsTrigger>
                  <TabsTrigger value="blogs" className="text-xs sm:text-sm">
                    Blogs {pendingCounts.blogs > 0 && <Badge className="ml-1 h-5 w-5 p-0 text-xs">{pendingCounts.blogs}</Badge>}
                  </TabsTrigger>
                  <TabsTrigger value="books" className="text-xs sm:text-sm">
                    Books {pendingCounts.books > 0 && <Badge className="ml-1 h-5 w-5 p-0 text-xs">{pendingCounts.books}</Badge>}
                  </TabsTrigger>
                </TabsList>
              </CardHeader>

              <CardContent className="pt-6">
                {/* Materials Tab */}
                <TabsContent value="materials" className="mt-0">
                  {materials.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No pending materials</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground">Title</th>
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground hidden sm:table-cell">Subject</th>
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground hidden md:table-cell">Submitter</th>
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground hidden md:table-cell">Date</th>
                            <th className="text-right p-3 text-sm font-medium text-muted-foreground">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {materials.map((item) => (
                            <tr key={item.id} className="border-b border-border last:border-0">
                              <td className="p-3 font-medium text-foreground">{item.title}</td>
                              <td className="p-3 text-muted-foreground hidden sm:table-cell">{item.subject}</td>
                              <td className="p-3 text-muted-foreground hidden md:table-cell">{item.submitter}</td>
                              <td className="p-3 text-muted-foreground hidden md:table-cell">{item.date}</td>
                              <td className="p-3 text-right">
                                <div className="flex justify-end gap-2">
                                  <Button variant="outline" size="sm"><Eye className="w-4 h-4" /></Button>
                                  <Button variant="default" size="sm" onClick={() => handleApprove('materials', item.id)}>
                                    <Check className="w-4 h-4" />
                                  </Button>
                                  <Button variant="destructive" size="sm" onClick={() => handleReject('materials', item.id)}>
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </TabsContent>

                {/* News Tab */}
                <TabsContent value="news" className="mt-0">
                  {news.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No pending news</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground">Title</th>
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground hidden sm:table-cell">Category</th>
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground hidden md:table-cell">Submitter</th>
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground hidden md:table-cell">Date</th>
                            <th className="text-right p-3 text-sm font-medium text-muted-foreground">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {news.map((item) => (
                            <tr key={item.id} className="border-b border-border last:border-0">
                              <td className="p-3 font-medium text-foreground">{item.title}</td>
                              <td className="p-3 text-muted-foreground hidden sm:table-cell">{item.category}</td>
                              <td className="p-3 text-muted-foreground hidden md:table-cell">{item.submitter}</td>
                              <td className="p-3 text-muted-foreground hidden md:table-cell">{item.date}</td>
                              <td className="p-3 text-right">
                                <div className="flex justify-end gap-2">
                                  <Button variant="outline" size="sm"><Eye className="w-4 h-4" /></Button>
                                  <Button variant="default" size="sm" onClick={() => handleApprove('news', item.id)}>
                                    <Check className="w-4 h-4" />
                                  </Button>
                                  <Button variant="destructive" size="sm" onClick={() => handleReject('news', item.id)}>
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </TabsContent>

                {/* Blogs Tab */}
                <TabsContent value="blogs" className="mt-0">
                  {blogs.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No pending blogs</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground">Title</th>
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground hidden sm:table-cell">Category</th>
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground hidden md:table-cell">Author</th>
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground hidden md:table-cell">Date</th>
                            <th className="text-right p-3 text-sm font-medium text-muted-foreground">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {blogs.map((item) => (
                            <tr key={item.id} className="border-b border-border last:border-0">
                              <td className="p-3 font-medium text-foreground">{item.title}</td>
                              <td className="p-3 text-muted-foreground hidden sm:table-cell">{item.category}</td>
                              <td className="p-3 text-muted-foreground hidden md:table-cell">{item.author}</td>
                              <td className="p-3 text-muted-foreground hidden md:table-cell">{item.date}</td>
                              <td className="p-3 text-right">
                                <div className="flex justify-end gap-2">
                                  <Button variant="outline" size="sm"><Eye className="w-4 h-4" /></Button>
                                  <Button variant="default" size="sm" onClick={() => handleApprove('blogs', item.id)}>
                                    <Check className="w-4 h-4" />
                                  </Button>
                                  <Button variant="destructive" size="sm" onClick={() => handleReject('blogs', item.id)}>
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </TabsContent>

                {/* Books Tab */}
                <TabsContent value="books" className="mt-0">
                  {books.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No pending books</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground">Title</th>
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground hidden sm:table-cell">Condition</th>
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground hidden sm:table-cell">Price</th>
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground hidden md:table-cell">Seller</th>
                            <th className="text-right p-3 text-sm font-medium text-muted-foreground">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {books.map((item) => (
                            <tr key={item.id} className="border-b border-border last:border-0">
                              <td className="p-3 font-medium text-foreground">{item.title}</td>
                              <td className="p-3 text-muted-foreground hidden sm:table-cell">{item.condition}</td>
                              <td className="p-3 text-muted-foreground hidden sm:table-cell">${item.price}</td>
                              <td className="p-3 text-muted-foreground hidden md:table-cell">{item.seller}</td>
                              <td className="p-3 text-right">
                                <div className="flex justify-end gap-2">
                                  <Button variant="outline" size="sm"><Eye className="w-4 h-4" /></Button>
                                  <Button variant="default" size="sm" onClick={() => handleApprove('books', item.id)}>
                                    <Check className="w-4 h-4" />
                                  </Button>
                                  <Button variant="destructive" size="sm" onClick={() => handleReject('books', item.id)}>
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Admin;