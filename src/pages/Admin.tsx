import { useState, useEffect, useCallback } from "react";
import { Navigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Check, X, FileText, Newspaper, PenLine, BookOpen, Loader2, 
  Flag, Trash2, Eye, Users, Shield, AlertTriangle 
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { 
  getPendingContent, 
  updateContentStatus, 
  getAllPendingCounts,
  getAllContent,
  getAllUsers,
  getContentCounts,
  adminDeleteMaterial,
  adminDeleteBlog,
  adminDeleteNews,
  adminDeleteBook,
  adminDeleteUser,
} from "@/services/adminService";
import { getReports, updateReportStatus, deleteReportedContent, Report, ReportContentType } from "@/services/reportsService";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
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

interface ContentItem {
  id: string;
  title: string;
  created_by: string;
  created_at: string;
  status: string;
  contributor_name?: string;
  description?: string;
  content?: string;
  condition?: string;
  price?: number;
  file_type?: string;
}

interface UserItem {
  id: string;
  full_name: string;
  email: string;
  college_name: string;
  course_stream: string;
  year_semester: string;
  total_xp: number;
  created_at: string;
  profile_photo_url?: string;
}

const Admin = () => {
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  
  // Content state
  const [allMaterials, setAllMaterials] = useState<ContentItem[]>([]);
  const [allBlogs, setAllBlogs] = useState<ContentItem[]>([]);
  const [allNews, setAllNews] = useState<ContentItem[]>([]);
  const [allBooks, setAllBooks] = useState<ContentItem[]>([]);
  const [allUsers, setAllUsers] = useState<UserItem[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  
  // Counts
  const [counts, setCounts] = useState({ materials: 0, blogs: 0, news: 0, books: 0, users: 0 });
  const [pendingCounts, setPendingCounts] = useState({ materials: 0, blogs: 0, news: 0, books: 0 });
  const [reportCount, setReportCount] = useState(0);
  
  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: string; id: string; title: string } | null>(null);

  const fetchAllData = useCallback(async () => {
    try {
      const [
        materialsData,
        blogsData,
        newsData,
        booksData,
        usersData,
        reportsData,
        contentCounts,
        pendingCountsData,
      ] = await Promise.all([
        getAllContent('materials'),
        getAllContent('blogs'),
        getAllContent('news'),
        getAllContent('books'),
        getAllUsers(),
        getReports('pending'),
        getContentCounts(),
        getAllPendingCounts(),
      ]);
      
      setAllMaterials(materialsData as ContentItem[]);
      setAllBlogs(blogsData as ContentItem[]);
      setAllNews(newsData as ContentItem[]);
      setAllBooks(booksData as ContentItem[]);
      setAllUsers(usersData as UserItem[]);
      setReports(reportsData);
      setCounts(contentCounts);
      setPendingCounts(pendingCountsData);
      setReportCount(reportsData.length);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user && isAdmin) {
      fetchAllData();

      // Real-time subscriptions for all tables
      const channels = [
        supabase.channel('admin-materials')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'materials' }, () => {
            getAllContent('materials').then(data => setAllMaterials(data as ContentItem[]));
            getContentCounts().then(setCounts);
          })
          .subscribe(),
        
        supabase.channel('admin-blogs')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'blogs' }, () => {
            getAllContent('blogs').then(data => setAllBlogs(data as ContentItem[]));
            getContentCounts().then(setCounts);
          })
          .subscribe(),
        
        supabase.channel('admin-news')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'news' }, () => {
            getAllContent('news').then(data => setAllNews(data as ContentItem[]));
            getContentCounts().then(setCounts);
          })
          .subscribe(),
        
        supabase.channel('admin-books')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'books' }, () => {
            getAllContent('books').then(data => setAllBooks(data as ContentItem[]));
            getContentCounts().then(setCounts);
          })
          .subscribe(),
        
        supabase.channel('admin-users')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
            getAllUsers().then(data => setAllUsers(data as UserItem[]));
            getContentCounts().then(setCounts);
          })
          .subscribe(),
        
        supabase.channel('admin-reports')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () => {
            getReports('pending').then(data => {
              setReports(data);
              setReportCount(data.length);
            });
          })
          .subscribe(),
      ];

      return () => {
        channels.forEach(channel => supabase.removeChannel(channel));
      };
    }
  }, [user, isAdmin, fetchAllData]);

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

  const handleDeleteContent = async (type: string, id: string) => {
    setProcessingId(id);
    let error: Error | null = null;

    switch (type) {
      case 'materials':
        ({ error } = await adminDeleteMaterial(id));
        break;
      case 'blogs':
        ({ error } = await adminDeleteBlog(id));
        break;
      case 'news':
        ({ error } = await adminDeleteNews(id));
        break;
      case 'books':
        ({ error } = await adminDeleteBook(id));
        break;
      case 'users':
        ({ error } = await adminDeleteUser(id));
        break;
    }

    setProcessingId(null);
    setDeleteConfirm(null);

    if (error) {
      toast.error(`Failed to delete: ${error.message}`);
      return;
    }

    toast.success(`${type.slice(0, -1).charAt(0).toUpperCase() + type.slice(1, -1)} deleted successfully`);
  };

  const handleApprove = async (type: 'materials' | 'news' | 'blogs' | 'books', item: ContentItem) => {
    setProcessingId(item.id);
    const { error } = await updateContentStatus(type, item.id, 'approved', item.created_by);
    setProcessingId(null);

    if (error) {
      toast.error('Failed to approve: ' + error.message);
      return;
    }

    toast.success('Content approved! XP awarded to contributor.');
    setPendingCounts(prev => ({ ...prev, [type]: prev[type as keyof typeof prev] - 1 }));
  };

  const handleReject = async (type: 'materials' | 'news' | 'blogs' | 'books', item: ContentItem) => {
    setProcessingId(item.id);
    const { error } = await updateContentStatus(type, item.id, 'rejected', item.created_by);
    setProcessingId(null);

    if (error) {
      toast.error('Failed to reject: ' + error.message);
      return;
    }

    toast.success('Content rejected.');
    setPendingCounts(prev => ({ ...prev, [type]: prev[type as keyof typeof prev] - 1 }));
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

  const handleDeleteReportedContent = async (report: Report) => {
    setProcessingId(report.id);
    
    const { error: deleteError } = await deleteReportedContent(
      report.content_type as ReportContentType,
      report.content_id
    );

    if (deleteError) {
      toast.error('Failed to delete content: ' + deleteError.message);
      setProcessingId(null);
      return;
    }

    await updateReportStatus(report.id, 'resolved');
    setProcessingId(null);

    toast.success('Content deleted and report resolved');
    setReports(prev => prev.filter(r => r.id !== report.id));
    setReportCount(prev => prev - 1);
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'MMM d, yyyy');
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="default" className="bg-green-500/20 text-green-600 border-green-500/30">Approved</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30">Pending</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const renderContentTable = (items: ContentItem[], type: 'materials' | 'blogs' | 'news' | 'books') => {
    if (items.length === 0) {
      return <p className="text-muted-foreground text-center py-8">No {type} found</p>;
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-3 text-sm font-medium text-muted-foreground">Title</th>
              <th className="text-left p-3 text-sm font-medium text-muted-foreground hidden sm:table-cell">Status</th>
              <th className="text-left p-3 text-sm font-medium text-muted-foreground hidden md:table-cell">Creator</th>
              <th className="text-left p-3 text-sm font-medium text-muted-foreground hidden md:table-cell">Date</th>
              <th className="text-right p-3 text-sm font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                <td className="p-3 font-medium text-foreground max-w-xs truncate">{item.title}</td>
                <td className="p-3 hidden sm:table-cell">{getStatusBadge(item.status)}</td>
                <td className="p-3 text-muted-foreground hidden md:table-cell">{item.contributor_name}</td>
                <td className="p-3 text-muted-foreground hidden md:table-cell">{formatDate(item.created_at)}</td>
                <td className="p-3 text-right">
                  <div className="flex justify-end gap-2">
                    {item.status === 'pending' && (
                      <>
                        <Button 
                          variant="default" 
                          size="sm" 
                          onClick={() => handleApprove(type, item)}
                          disabled={processingId === item.id}
                        >
                          {processingId === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleReject(type, item)}
                          disabled={processingId === item.id}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => setDeleteConfirm({ type, id: item.id, title: item.title })}
                      disabled={processingId === item.id}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderUsersTable = () => {
    if (allUsers.length === 0) {
      return <p className="text-muted-foreground text-center py-8">No users found</p>;
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-3 text-sm font-medium text-muted-foreground">Name</th>
              <th className="text-left p-3 text-sm font-medium text-muted-foreground hidden sm:table-cell">Email</th>
              <th className="text-left p-3 text-sm font-medium text-muted-foreground hidden md:table-cell">College</th>
              <th className="text-left p-3 text-sm font-medium text-muted-foreground hidden md:table-cell">XP</th>
              <th className="text-left p-3 text-sm font-medium text-muted-foreground hidden lg:table-cell">Joined</th>
              <th className="text-right p-3 text-sm font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {allUsers.map((userItem) => (
              <tr key={userItem.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                <td className="p-3 font-medium text-foreground">{userItem.full_name}</td>
                <td className="p-3 text-muted-foreground hidden sm:table-cell">{userItem.email}</td>
                <td className="p-3 text-muted-foreground hidden md:table-cell max-w-xs truncate">{userItem.college_name}</td>
                <td className="p-3 text-muted-foreground hidden md:table-cell">{userItem.total_xp}</td>
                <td className="p-3 text-muted-foreground hidden lg:table-cell">{formatDate(userItem.created_at)}</td>
                <td className="p-3 text-right">
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => setDeleteConfirm({ type: 'users', id: userItem.id, title: userItem.full_name })}
                    disabled={processingId === userItem.id || userItem.id === user?.id}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderReportsTab = () => {
    if (reports.length === 0) {
      return <p className="text-muted-foreground text-center py-8">No pending reports</p>;
    }

    return (
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
                    <p><span className="font-medium">Reported user:</span> {report.reported_user_name}</p>
                    <p><span className="font-medium">Reported by:</span> {report.reporter_name}</p>
                    <p><span className="font-medium">Time:</span> {formatDate(report.created_at)}</p>
                  </div>

                  <div className="flex flex-wrap gap-1 mt-2">
                    {report.reasons.map((reason, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {reason}
                      </Badge>
                    ))}
                  </div>

                  {report.comment && (
                    <p className="text-sm text-muted-foreground italic mt-2">"{report.comment}"</p>
                  )}
                </div>

                <div className="flex gap-2 md:flex-col">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteReportedContent(report)}
                    disabled={processingId === report.id}
                    className="flex items-center gap-1"
                  >
                    {processingId === report.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
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
    );
  };

  const totalPending = pendingCounts.materials + pendingCounts.blogs + pendingCounts.news + pendingCounts.books;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header onAuthClick={() => {}} />
      
      <main className="flex-1 py-8">
        <div className="container-wide">
          {/* Header */}
          <div className="mb-8 flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                Admin Panel
              </h1>
              <p className="text-muted-foreground">
                Full administrative control over all content
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <FileText className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold text-foreground">{counts.materials}</p>
                  <p className="text-xs text-muted-foreground">Materials</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <PenLine className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold text-foreground">{counts.blogs}</p>
                  <p className="text-xs text-muted-foreground">Blogs</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <Newspaper className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold text-foreground">{counts.news}</p>
                  <p className="text-xs text-muted-foreground">News</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <BookOpen className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold text-foreground">{counts.books}</p>
                  <p className="text-xs text-muted-foreground">Books</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <Users className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold text-foreground">{counts.users}</p>
                  <p className="text-xs text-muted-foreground">Users</p>
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

          {/* Pending Alert */}
          {totalPending > 0 && (
            <Card className="mb-6 border-yellow-500/30 bg-yellow-500/5">
              <CardContent className="p-4 flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <p className="text-sm text-foreground">
                  <span className="font-medium">{totalPending} items</span> pending approval
                </p>
              </CardContent>
            </Card>
          )}

          {/* Content Tabs */}
          <Card>
            <Tabs defaultValue="materials">
              <CardHeader className="pb-0">
                <TabsList className="flex flex-wrap h-auto gap-1">
                  <TabsTrigger value="materials" className="text-xs sm:text-sm">
                    Materials
                  </TabsTrigger>
                  <TabsTrigger value="blogs" className="text-xs sm:text-sm">
                    Blogs
                  </TabsTrigger>
                  <TabsTrigger value="news" className="text-xs sm:text-sm">
                    News
                  </TabsTrigger>
                  <TabsTrigger value="books" className="text-xs sm:text-sm">
                    Books
                  </TabsTrigger>
                  <TabsTrigger value="users" className="text-xs sm:text-sm">
                    Users
                  </TabsTrigger>
                  <TabsTrigger value="reports" className="text-xs sm:text-sm">
                    Reports {reportCount > 0 && <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 text-xs">{reportCount}</Badge>}
                  </TabsTrigger>
                </TabsList>
              </CardHeader>

              <CardContent className="pt-6">
                <TabsContent value="materials" className="mt-0">
                  {renderContentTable(allMaterials, 'materials')}
                </TabsContent>

                <TabsContent value="blogs" className="mt-0">
                  {renderContentTable(allBlogs, 'blogs')}
                </TabsContent>

                <TabsContent value="news" className="mt-0">
                  {renderContentTable(allNews, 'news')}
                </TabsContent>

                <TabsContent value="books" className="mt-0">
                  {renderContentTable(allBooks, 'books')}
                </TabsContent>

                <TabsContent value="users" className="mt-0">
                  {renderUsersTable()}
                </TabsContent>

                <TabsContent value="reports" className="mt-0">
                  {renderReportsTab()}
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>
      </main>

      <Footer />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteConfirm?.type.slice(0, -1)}?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteConfirm?.title}"? This action cannot be undone.
              {deleteConfirm?.type === 'users' && (
                <span className="block mt-2 text-destructive font-medium">
                  Warning: This will also delete all content created by this user.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && handleDeleteContent(deleteConfirm.type, deleteConfirm.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Admin;
