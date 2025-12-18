import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";
import AuthModal from "@/components/auth/AuthModal";
import MaterialPreviewModal from "@/components/materials/MaterialPreviewModal";
import MaterialThumbnail from "@/components/materials/MaterialThumbnail";
import ReportButton from "@/components/reports/ReportButton";
import MaterialFilters, { MaterialFiltersState, initialFilters } from "@/components/materials/MaterialFilters";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Eye, Calendar, User, BookOpen, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useVerification } from "@/hooks/useVerification";
import { getDownloadUrl } from "@/services/materialsService";
import { getMaterialsPaginated } from "@/services/paginatedService";
import { SectionLoader, EmptyState, LoadMoreButton } from "@/components/common/SectionLoader";
import { useOptimizedFetch } from "@/hooks/useOptimizedFetch";
import { Material } from "@/types/database";
import { format } from "date-fns";
import { toast } from "sonner";

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

  const fetchMaterials = useCallback(async () => {
    const result = await getMaterialsPaginated(0, 20);
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
      const result = await getMaterialsPaginated(0, 20, apiFilters);
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
      const result = await getMaterialsPaginated(nextPage, 20, apiFilters);
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
      const url = await getDownloadUrl(material.id);
      if (url) {
        window.open(url, '_blank');
      } else {
        toast.error('Download link not available');
      }
    } catch (error) {
      toast.error('Failed to get download link');
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

  const handlePreview = (material: Material) => {
    setPreviewMaterial(material);
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
              {/* Materials List */}
              <div className="space-y-4">
                {allMaterials.map((material) => (
                  <Card 
                    key={material.id} 
                    className="card-premium cursor-pointer group"
                    onClick={() => handlePreview(material)}
                  >
                    <CardContent className="p-5 md:p-6">
                      <div className="flex flex-col md:flex-row md:items-start gap-5">
                        {/* Thumbnail Preview */}
                        <MaterialThumbnail 
                          fileType={getFileTypeDisplay(material.file_type)}
                          title={material.title}
                          className="transition-transform group-hover:scale-[1.02]"
                        />
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                              {material.title}
                            </h3>
                            <Badge variant="secondary" className="text-xs font-medium uppercase">{material.file_type}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2 leading-relaxed">
                            {material.description || 'No description provided'}
                          </p>
                          {/* Material metadata */}
                          <div className="flex flex-wrap gap-2 mb-3">
                            {material.course && <Badge variant="outline" className="text-xs">{material.course}</Badge>}
                            {material.branch && <Badge variant="outline" className="text-xs">{material.branch}</Badge>}
                            {material.subject && <Badge variant="outline" className="text-xs">{material.subject}</Badge>}
                            {material.language && <Badge variant="outline" className="text-xs">{material.language}</Badge>}
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5" />
                              {material.contributor_name || 'Anonymous'}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5" />
                              {formatDate(material.created_at)}
                            </span>
                            {material.college && (
                              <span className="text-muted-foreground">{material.college}</span>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2 md:flex-shrink-0">
                          <ReportButton
                            contentType="materials"
                            contentId={material.id}
                            contentOwnerId={material.created_by}
                            contentTitle={material.title}
                          />
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex items-center gap-1.5"
                            onClick={(e) => { e.stopPropagation(); handlePreview(material); }}
                          >
                            <Eye className="w-4 h-4" />
                            Preview
                          </Button>
                          <Button 
                            size="sm" 
                            onClick={(e) => { e.stopPropagation(); handleDownload(material); }} 
                            className="flex items-center gap-1.5 shadow-premium-sm"
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
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
          downloads: 0,
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