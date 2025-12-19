import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";
import AuthModal from "@/components/auth/AuthModal";
import MaterialPreviewModal from "@/components/materials/MaterialPreviewModal";
import MaterialCard from "@/components/materials/MaterialCard";
import MaterialFilters, { MaterialFiltersState, initialFilters } from "@/components/materials/MaterialFilters";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useVerification } from "@/hooks/useVerification";
import { getDownloadUrl } from "@/services/materialsService";
import { getMaterialsPaginated } from "@/services/paginatedService";
import { SectionLoader, EmptyState, LoadMoreButton } from "@/components/common/SectionLoader";
import { useOptimizedFetch } from "@/hooks/useOptimizedFetch";
import { Material } from "@/types/database";
import { format } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const Materials = () => {
  const { user } = useAuth();
  const { canDownload } = useVerification();
  const navigate = useNavigate();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const [filters, setFilters] = useState<MaterialFiltersState>(initialFilters);
  const [previewMaterial, setPreviewMaterial] = useState<Material | null>(null);
  const [page, setPage] = useState(0);
  const [allMaterials, setAllMaterials] = useState<Material[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  const [likingIds, setLikingIds] = useState<Set<string>>(new Set());

  const fetchMaterials = useCallback(async () => {
    const result = await getMaterialsPaginated(0, 15); // Reduced from 18 to 15 for faster loading
    setAllMaterials(result.data);
    setHasMore(result.hasMore);
    return result.data;
  }, []);

  const { isLoading } = useOptimizedFetch({
    fetchFn: fetchMaterials,
    defaultValue: [] as Material[],
    timeoutMs: 8000,
    cacheKey: 'materials-page-0',
  });

  const applyFilters = async (newFilters: MaterialFiltersState) => {
    setFilters(newFilters);
    setIsFiltering(true);
    setPage(0);
    try {
      const apiFilters = {
        search: newFilters.search || undefined,
        course: newFilters.course || undefined,
        branch: newFilters.branch || undefined,
        subject: newFilters.subject || undefined,
        language: newFilters.language || undefined,
        college: newFilters.college || undefined,
      };
      const result = await getMaterialsPaginated(0, 15, apiFilters);
      setAllMaterials(result.data);
      setHasMore(result.hasMore);
    } catch (error) {
      toast.error('Failed to filter materials');
    } finally {
      setIsFiltering(false);
    }
  };

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const apiFilters = {
        search: filters.search || undefined,
        course: filters.course || undefined,
        branch: filters.branch || undefined,
        subject: filters.subject || undefined,
        language: filters.language || undefined,
        college: filters.college || undefined,
      };
      const result = await getMaterialsPaginated(nextPage, 15, apiFilters);
      setAllMaterials(prev => [...prev, ...result.data]);
      setHasMore(result.hasMore);
      setPage(nextPage);
    } catch (error) {
      toast.error('Failed to load more materials');
    } finally {
      setLoadingMore(false);
    }
  };

  const handleDownload = async (material: Material) => {
    if (!user) {
      setAuthMessage("Sign in to download study materials");
      setAuthOpen(true);
      return;
    }
    if (!canDownload) {
      toast.error("Please verify your account to download materials");
      return;
    }
    try {
      // Increment download count
      await supabase.rpc('increment_material_downloads', { material_id: material.id });
      
      const url = await getDownloadUrl(material.id);
      if (url) {
        window.open(url, '_blank');
        // Update local state
        setAllMaterials(prev => prev.map(m => 
          m.id === material.id 
            ? { ...m, downloads_count: (m.downloads_count || 0) + 1 }
            : m
        ));
      } else {
        toast.error('Download link not available');
      }
    } catch (error) {
      toast.error('Failed to get download link');
    }
  };

  const handleLike = async (material: Material) => {
    if (!user) {
      setAuthMessage("Sign in to like materials");
      setAuthOpen(true);
      return;
    }

    if (likingIds.has(material.id)) return;
    
    setLikingIds(prev => new Set(prev).add(material.id));
    
    try {
      const { data: newLikeState, error } = await supabase.rpc('toggle_material_like', {
        p_material_id: material.id,
      });
      
      if (error) throw error;
      
      setAllMaterials(prev => prev.map(m => 
        m.id === material.id 
          ? { 
              ...m, 
              user_has_liked: newLikeState,
              likes_count: newLikeState 
                ? (m.likes_count || 0) + 1 
                : Math.max(0, (m.likes_count || 0) - 1)
            }
          : m
      ));
    } catch (error) {
      toast.error('Failed to update like');
    } finally {
      setLikingIds(prev => {
        const next = new Set(prev);
        next.delete(material.id);
        return next;
      });
    }
  };

  const handleShare = async (material: Material) => {
    const url = `${window.location.origin}/materials?id=${material.id}`;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: material.title,
          text: `Check out this study material: ${material.title}`,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard');
      }
      
      await supabase.rpc('increment_material_shares', { material_id: material.id });
      setAllMaterials(prev => prev.map(m => 
        m.id === material.id 
          ? { ...m, shares_count: (m.shares_count || 0) + 1 }
          : m
      ));
    } catch (error) {
      // User cancelled share or error
    }
  };

  const handleUpload = () => {
    if (user) {
      navigate("/upload-material");
    } else {
      setAuthMessage("Sign in to upload study materials");
      setAuthOpen(true);
    }
  };

  const handlePreview = async (material: Material) => {
    setPreviewMaterial(material);
    // Increment view count
    await supabase.rpc('increment_material_views', { material_id: material.id });
    setAllMaterials(prev => prev.map(m => 
      m.id === material.id 
        ? { ...m, views_count: (m.views_count || 0) + 1 }
        : m
    ));
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'MMM d, yyyy');
    } catch {
      return dateStr;
    }
  };

  const getFileTypeDisplay = (fileType: string): "pdf" | "image" | "doc" | "other" => {
    const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    const docTypes = ['doc', 'docx', 'txt', 'rtf'];
    
    if (fileType === 'pdf') return 'pdf';
    if (imageTypes.includes(fileType.toLowerCase())) return 'image';
    if (docTypes.includes(fileType.toLowerCase())) return 'doc';
    return 'other';
  };

  return (
    <div className="min-h-screen flex flex-col bg-background pb-20 md:pb-0">
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
                  Study Materials
                </h1>
                <p className="text-muted-foreground">
                  Notes, past papers, and resources shared by students
                </p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <MaterialFilters 
            filters={filters} 
            onFiltersChange={applyFilters}
            onClearFilters={() => applyFilters(initialFilters)}
          />

          {/* Content */}
          {isLoading || isFiltering ? (
            <SectionLoader size="lg" className="py-16" />
          ) : allMaterials.length === 0 ? (
            <EmptyState 
              message="No materials found. Try adjusting your filters or be the first to contribute!"
              action={
                <Button onClick={handleUpload} className="shadow-premium-sm">
                  Upload materials <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              }
            />
          ) : (
            <>
              {/* Materials Grid - 3 cols desktop, 2 tablet, 1 mobile */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {allMaterials.map((material) => (
                  <MaterialCard
                    key={material.id}
                    material={material}
                    onPreview={handlePreview}
                    onDownload={handleDownload}
                    onLike={handleLike}
                    onShare={handleShare}
                    isLiking={likingIds.has(material.id)}
                  />
                ))}
              </div>

              {/* Load More */}
              <LoadMoreButton 
                onClick={loadMore}
                isLoading={loadingMore}
                hasMore={hasMore}
              />
            </>
          )}

          {/* CTA */}
          <Card className="mt-12 border-0 bg-secondary/50">
            <CardContent className="p-8 text-center">
              <h3 className="font-display text-xl text-foreground mb-3">Have study materials to share?</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Help fellow students by uploading your notes, past papers, or study guides.
              </p>
              <Button onClick={handleUpload} className="shadow-premium-sm">
                Upload materials
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
      <BottomNav />
      
      <AuthModal 
        isOpen={authOpen} 
        onClose={() => setAuthOpen(false)}
        message={authMessage}
      />

      <MaterialPreviewModal
        material={previewMaterial ? {
          id: parseInt(previewMaterial.id.substring(0, 8), 16),
          title: previewMaterial.title,
          subject: previewMaterial.subject || 'Study Material',
          type: previewMaterial.file_type.toUpperCase(),
          fileType: getFileTypeDisplay(previewMaterial.file_type),
          downloads: previewMaterial.downloads_count || 0,
          date: formatDate(previewMaterial.created_at),
          preview: previewMaterial.description || 'No description provided',
          contributor: previewMaterial.contributor_name || 'Anonymous',
        } : null}
        isOpen={!!previewMaterial}
        onClose={() => setPreviewMaterial(null)}
        onDownload={() => {
          if (previewMaterial) {
            handleDownload(previewMaterial);
          }
          setPreviewMaterial(null);
        }}
      />
    </div>
  );
};

export default Materials;