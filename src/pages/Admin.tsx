import { useState, useEffect, useCallback } from "react";
import { Navigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Check, X, FileText, Newspaper, PenLine, BookOpen, Loader2, Flag, Trash2, Eye } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getPendingContent, updateContentStatus, getAllPendingCounts } from "@/services/adminService";
import { getReports, updateReportStatus, deleteReportedContent, Report, ReportContentType } from "@/services/reportsService";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface PendingItem {
  id: string;
  title: string;
  created_by: string;
  created_at: string;
  contributor_name?: string;
  description?: string;
  content?: string;
  condition?: string;
  price?: number;
  file_type?: string;
}

const Admin = () => {
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const [materials, setMaterials] = useState<PendingItem[]>([]);
  const [news, setNews] = useState<PendingItem[]>([]);
  const [blogs, setBlogs] = useState<PendingItem[]>([]);
  const [books, setBooks] = useState<PendingItem[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [pendingCounts, setPendingCounts] = useState({ materials: 0, news: 0, blogs: 0, books: 0 });
  const [reportCount, setReportCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchPendingContent = useCallback(async () => {
    try {
      const [materialsData, newsData, blogsData, booksData, counts, reportsData] = await Promise.all([
        getPendingContent('materials'),
        getPendingContent('news'),
        getPendingContent('blogs'),
        getPendingContent('books'),
        getAllPendingCounts(),
        getReports('pending'),
      ]);
      setMaterials(materialsData as PendingItem[]);
      setNews(newsData as PendingItem[]);
      setBlogs(blogsData as PendingItem[]);
      setBooks(booksData as PendingItem[]);
      setPendingCounts(counts);
      setReports(reportsData);
      setReportCount(reportsData.length);
    } catch (error) {
      console.error('Error fetching pending content:', error);
      toast.error('Failed to load pending content');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user && isAdmin) {
      fetchPendingContent();

      // Real-time subscription for reports
      const channel = supabase
        .channel('admin-reports')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'reports',
          },
          () => {
            // Refetch reports on any change
            getReports('pending').then((data) => {
              setReports(data);
              setReportCount(data.length);
            });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, isAdmin, fetchPendingContent]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  const handleApprove = async (type: 'materials' | 'news' | 'blogs' | 'books', item: PendingItem) => {
    setProcessingId(item.id);
    const { error } = await updateContentStatus(type, item.id, 'approved', item.created_by);
    setProcessingId(null);

    if (error) {
      toast.error('Failed to approve: ' + error.message);
      return;
    }

    toast.success(`${type.slice(0, -1).charAt(0).toUpperCase() + type.slice(1, -1)} approved! XP awarded to contributor.`);
    
    // Remove from local state
    switch (type) {
      case 'materials':
        setMaterials(prev => prev.filter(m => m.id !== item.id));
        setPendingCounts(prev => ({ ...prev, materials: prev.materials - 1 }));
        break;
      case 'news':
        setNews(prev => prev.filter(n => n.id !== item.id));
        setPendingCounts(prev => ({ ...prev, news: prev.news - 1 }));
        break;
      case 'blogs':
        setBlogs(prev => prev.filter(b => b.id !== item.id));
        setPendingCounts(prev => ({ ...prev, blogs: prev.blogs - 1 }));
        break;
      case 'books':
        setBooks(prev => prev.filter(b => b.id !== item.id));
        setPendingCounts(prev => ({ ...prev, books: prev.books - 1 }));
        break;
    }
  };

  const handleReject = async (type: 'materials' | 'news' | 'blogs' | 'books', item: PendingItem) => {
    setProcessingId(item.id);
    const { error } = await updateContentStatus(type, item.id, 'rejected', item.created_by);
    setProcessingId(null);

    if (error) {
      toast.error('Failed to reject: ' + error.message);
      return;
    }

    toast.success(`${type.slice(0, -1).charAt(0).toUpperCase() + type.slice(1, -1)} rejected.`);
    
    // Remove from local state
    switch (type) {
      case 'materials':
        setMaterials(prev => prev.filter(m => m.id !== item.id));
        setPendingCounts(prev => ({ ...prev, materials: prev.materials - 1 }));
        break;
      case 'news':
        setNews(prev => prev.filter(n => n.id !== item.id));
        setPendingCounts(prev => ({ ...prev, news: prev.news - 1 }));
        break;
      case 'blogs':
        setBlogs(prev => prev.filter(b => b.id !== item.id));
        setPendingCounts(prev => ({ ...prev, blogs: prev.blogs - 1 }));
        break;
      case 'books':
        setBooks(prev => prev.filter(b => b.id !== item.id));
        setPendingCounts(prev => ({ ...prev, books: prev.books - 1 }));
        break;
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'MMM d, yyyy');
    } catch {
      return dateStr;
    }
  };

  const handleIgnoreReport = async (report: Report) => {
    setProcessingId(report.id);
    const { error } = await updateReportStatus(report.id, 'ignored');
    setProcessingId(null);

    if (error) {
      toast.error('Failed to ignore report: ' + error.message);
      return;
    }

    toast.success('Report ignored');
    setReports(prev => prev.filter(r => r.id !== report.id));
    setReportCount(prev => prev - 1);
  };

  const handleDeleteContent = async (report: Report) => {
    setProcessingId(report.id);
    
    // Delete the content
    const { error: deleteError } = await deleteReportedContent(
      report.content_type as ReportContentType,
      report.content_id
    );

    if (deleteError) {
      toast.error('Failed to delete content: ' + deleteError.message);
      setProcessingId(null);
      return;
    }

    // Mark report as resolved
    await updateReportStatus(report.id, 'resolved');
    setProcessingId(null);

    toast.success('Content deleted and report resolved');
    setReports(prev => prev.filter(r => r.id !== report.id));
    setReportCount(prev => prev - 1);
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
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
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
            <Card className={reportCount > 0 ? "border-destructive" : ""}>
              <CardContent className="p-4 flex items-center gap-3">
                <Flag className={`w-8 h-8 ${reportCount > 0 ? 'text-destructive' : 'text-primary'}`} />
                <div>
                  <p className="text-2xl font-bold text-foreground">{reportCount}</p>
                  <p className="text-xs text-muted-foreground">Reports</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Card>
            <Tabs defaultValue="materials">
              <CardHeader className="pb-0">
                <TabsList className="grid grid-cols-5 w-full max-w-lg">
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
                  <TabsTrigger value="reports" className="text-xs sm:text-sm">
                    Reports {reportCount > 0 && <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 text-xs">{reportCount}</Badge>}
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
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground hidden sm:table-cell">Type</th>
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground hidden md:table-cell">Submitter</th>
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground hidden md:table-cell">Date</th>
                            <th className="text-right p-3 text-sm font-medium text-muted-foreground">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {materials.map((item) => (
                            <tr key={item.id} className="border-b border-border last:border-0">
                              <td className="p-3 font-medium text-foreground">{item.title}</td>
                              <td className="p-3 text-muted-foreground hidden sm:table-cell uppercase">{item.file_type}</td>
                              <td className="p-3 text-muted-foreground hidden md:table-cell">{item.contributor_name}</td>
                              <td className="p-3 text-muted-foreground hidden md:table-cell">{formatDate(item.created_at)}</td>
                              <td className="p-3 text-right">
                                <div className="flex justify-end gap-2">
                                  <Button 
                                    variant="default" 
                                    size="sm" 
                                    onClick={() => handleApprove('materials', item)}
                                    disabled={processingId === item.id}
                                  >
                                    {processingId === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                  </Button>
                                  <Button 
                                    variant="destructive" 
                                    size="sm" 
                                    onClick={() => handleReject('materials', item)}
                                    disabled={processingId === item.id}
                                  >
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
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground hidden md:table-cell">Submitter</th>
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground hidden md:table-cell">Date</th>
                            <th className="text-right p-3 text-sm font-medium text-muted-foreground">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {news.map((item) => (
                            <tr key={item.id} className="border-b border-border last:border-0">
                              <td className="p-3 font-medium text-foreground">{item.title}</td>
                              <td className="p-3 text-muted-foreground hidden md:table-cell">{item.contributor_name}</td>
                              <td className="p-3 text-muted-foreground hidden md:table-cell">{formatDate(item.created_at)}</td>
                              <td className="p-3 text-right">
                                <div className="flex justify-end gap-2">
                                  <Button 
                                    variant="default" 
                                    size="sm" 
                                    onClick={() => handleApprove('news', item)}
                                    disabled={processingId === item.id}
                                  >
                                    {processingId === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                  </Button>
                                  <Button 
                                    variant="destructive" 
                                    size="sm" 
                                    onClick={() => handleReject('news', item)}
                                    disabled={processingId === item.id}
                                  >
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
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground hidden md:table-cell">Author</th>
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground hidden md:table-cell">Date</th>
                            <th className="text-right p-3 text-sm font-medium text-muted-foreground">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {blogs.map((item) => (
                            <tr key={item.id} className="border-b border-border last:border-0">
                              <td className="p-3 font-medium text-foreground">{item.title}</td>
                              <td className="p-3 text-muted-foreground hidden md:table-cell">{item.contributor_name}</td>
                              <td className="p-3 text-muted-foreground hidden md:table-cell">{formatDate(item.created_at)}</td>
                              <td className="p-3 text-right">
                                <div className="flex justify-end gap-2">
                                  <Button 
                                    variant="default" 
                                    size="sm" 
                                    onClick={() => handleApprove('blogs', item)}
                                    disabled={processingId === item.id}
                                  >
                                    {processingId === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                  </Button>
                                  <Button 
                                    variant="destructive" 
                                    size="sm" 
                                    onClick={() => handleReject('blogs', item)}
                                    disabled={processingId === item.id}
                                  >
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
                              <td className="p-3 text-muted-foreground hidden sm:table-cell">{item.condition || '-'}</td>
                              <td className="p-3 text-muted-foreground hidden sm:table-cell">{item.price ? `₹${item.price}` : 'Exchange'}</td>
                              <td className="p-3 text-muted-foreground hidden md:table-cell">{item.contributor_name}</td>
                              <td className="p-3 text-right">
                                <div className="flex justify-end gap-2">
                                  <Button 
                                    variant="default" 
                                    size="sm" 
                                    onClick={() => handleApprove('books', item)}
                                    disabled={processingId === item.id}
                                  >
                                    {processingId === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                  </Button>
                                  <Button 
                                    variant="destructive" 
                                    size="sm" 
                                    onClick={() => handleReject('books', item)}
                                    disabled={processingId === item.id}
                                  >
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

                {/* Reports Tab */}
                <TabsContent value="reports" className="mt-0">
                  {reports.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No pending reports</p>
                  ) : (
                    <div className="space-y-4">
                      {reports.map((report) => (
                        <Card key={report.id} className="border-border">
                          <CardContent className="p-4">
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                              <div className="space-y-2 flex-1">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    {report.content_type}
                                  </Badge>
                                  <span className="text-sm font-medium text-foreground">
                                    {report.content_title}
                                  </span>
                                </div>
                                
                                <div className="text-xs text-muted-foreground space-y-1">
                                  <p>
                                    <span className="font-medium">Reported user:</span> {report.reported_user_name}
                                  </p>
                                  <p>
                                    <span className="font-medium">Reported by:</span> {report.reporter_name}
                                  </p>
                                  <p>
                                    <span className="font-medium">Time:</span> {formatDate(report.created_at)}
                                  </p>
                                </div>

                                <div className="flex flex-wrap gap-1 mt-2">
                                  {report.reasons.map((reason, idx) => (
                                    <Badge key={idx} variant="secondary" className="text-xs">
                                      {reason}
                                    </Badge>
                                  ))}
                                </div>

                                {report.comment && (
                                  <p className="text-sm text-muted-foreground italic mt-2">
                                    "{report.comment}"
                                  </p>
                                )}
                              </div>

                              <div className="flex gap-2 md:flex-col">
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDeleteContent(report)}
                                  disabled={processingId === report.id}
                                  className="flex items-center gap-1"
                                >
                                  {processingId === report.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-4 h-4" />
                                  )}
                                  <span className="hidden sm:inline">Delete</span>
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleIgnoreReport(report)}
                                  disabled={processingId === report.id}
                                  className="flex items-center gap-1"
                                >
                                  <Eye className="w-4 h-4" />
                                  <span className="hidden sm:inline">Ignore</span>
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
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
