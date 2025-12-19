import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { FileText, Newspaper, BookOpen, Loader2 } from "lucide-react";
import DeleteButton from "@/components/common/DeleteButton";
import { 
  getUserMaterials, 
  getUserNews, 
  getUserBooks,
  deleteMaterial,
  deleteNews,
  deleteBook
} from "@/services/contentService";
import { Material, News, Book } from "@/types/database";
import { supabase } from "@/integrations/supabase/client";

interface UserContentManagerProps {
  userId: string;
}

const UserContentManager = ({ userId }: UserContentManagerProps) => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [news, setNews] = useState<News[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("materials");
  const isMounted = useRef(true);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchAllContent = useCallback(async () => {
    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Content fetch timeout')), 8000)
      );

      const fetchPromise = Promise.all([
        getUserMaterials(userId),
        getUserNews(userId),
        getUserBooks(userId),
      ]);

      const [mats, nws, bks] = await Promise.race([
        fetchPromise,
        timeoutPromise,
      ]) as Awaited<typeof fetchPromise>;

      if (isMounted.current) {
        setMaterials(mats);
        setNews(nws);
        setBooks(bks);
      }
    } catch (error) {
      console.error("Error fetching user content:", error);
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [userId]);

  useEffect(() => {
    isMounted.current = true;

    // Safety timeout
    const safetyTimeout = setTimeout(() => {
      if (isMounted.current && isLoading) {
        setIsLoading(false);
      }
    }, 10000);

    fetchAllContent();

    // Cleanup existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    // Single channel for all user content
    channelRef.current = supabase
      .channel(`user-content-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "materials", filter: `created_by=eq.${userId}` }, fetchAllContent)
      .on("postgres_changes", { event: "*", schema: "public", table: "news", filter: `created_by=eq.${userId}` }, fetchAllContent)
      .on("postgres_changes", { event: "*", schema: "public", table: "books", filter: `created_by=eq.${userId}` }, fetchAllContent)
      .subscribe();

    return () => {
      isMounted.current = false;
      clearTimeout(safetyTimeout);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [userId, fetchAllContent]);

  const handleDeleteMaterial = async (id: string) => {
    return deleteMaterial(id, userId);
  };

  const handleDeleteNews = async (id: string) => {
    return deleteNews(id, userId);
  };

  const handleDeleteBook = async (id: string) => {
    return deleteBook(id, userId);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const totalCount = materials.length + news.length + books.length;

  if (totalCount === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Your Content</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="materials" className="text-xs">
              <FileText className="w-3 h-3 mr-1" />
              {materials.length}
            </TabsTrigger>
            <TabsTrigger value="news" className="text-xs">
              <Newspaper className="w-3 h-3 mr-1" />
              {news.length}
            </TabsTrigger>
            <TabsTrigger value="books" className="text-xs">
              <BookOpen className="w-3 h-3 mr-1" />
              {books.length}
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[200px] mt-3">
            <TabsContent value="materials" className="mt-0 space-y-2">
              {materials.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No materials yet</p>
              ) : (
                materials.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary/50">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.file_type?.toUpperCase()}</p>
                    </div>
                    <DeleteButton onDelete={() => handleDeleteMaterial(item.id)} />
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="news" className="mt-0 space-y-2">
              {news.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No news yet</p>
              ) : (
                news.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary/50">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                      <Badge variant="secondary" className="text-xs">{item.status}</Badge>
                    </div>
                    <DeleteButton onDelete={() => handleDeleteNews(item.id)} />
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="books" className="mt-0 space-y-2">
              {books.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No books yet</p>
              ) : (
                books.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary/50">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                      <div className="flex gap-1">
                        {item.is_sold && <Badge variant="outline" className="text-xs">Sold</Badge>}
                        {item.price && <Badge variant="secondary" className="text-xs">₹{item.price}</Badge>}
                      </div>
                    </div>
                    <DeleteButton onDelete={() => handleDeleteBook(item.id)} />
                  </div>
                ))
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default UserContentManager;
