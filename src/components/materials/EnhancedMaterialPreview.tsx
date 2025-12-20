import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Download, FileText, Image, File, Lock, ChevronLeft, ChevronRight, 
  Eye, Calendar, User, HardDrive, Loader2, BookOpen, AlertTriangle
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { formatFileSize } from "@/lib/fileCompression";
import { format } from "date-fns";

interface MaterialData {
  id: string;
  title: string;
  description?: string;
  file_url: string;
  file_type: string;
  file_size?: number;
  subject?: string;
  branch?: string;
  course?: string;
  college?: string;
  language?: string;
  downloads_count: number;
  views_count: number;
  likes_count: number;
  created_at: string;
  contributor_name?: string;
  status: string;
  thumbnail_url?: string;
}

interface EnhancedMaterialPreviewProps {
  material: MaterialData | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload: () => void;
  isAdmin?: boolean;
}

// Simulated page content for Amazon-style preview
const PreviewPage = ({ pageNum, isLocked, title }: { pageNum: number; isLocked: boolean; title: string }) => {
  if (isLocked) {
    return (
      <div className="aspect-[3/4] bg-muted/50 rounded-lg flex flex-col items-center justify-center border border-dashed border-border relative overflow-hidden">
        <div className="absolute inset-0 backdrop-blur-md bg-background/60" />
        <div className="relative z-10 text-center p-6">
          <Lock className="w-12 h-12 text-muted-foreground mb-4 mx-auto" />
          <p className="text-sm text-muted-foreground font-medium">Page {pageNum}</p>
          <p className="text-xs text-muted-foreground mt-2">Login to view more</p>
        </div>
      </div>
    );
  }

  return (
    <div className="aspect-[3/4] bg-card rounded-lg border border-border shadow-sm overflow-hidden">
      <div className="h-full p-4 flex flex-col">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
          <FileText className="w-4 h-4 text-primary" />
          <span className="text-xs font-medium text-muted-foreground truncate">{title}</span>
        </div>
        <div className="flex-1 space-y-2">
          {/* Simulated text lines */}
          {[...Array(12)].map((_, i) => (
            <div 
              key={i} 
              className="h-2 bg-muted-foreground/10 rounded" 
              style={{ width: `${Math.random() * 30 + 70}%` }}
            />
          ))}
        </div>
        <div className="text-center pt-2 border-t border-border mt-auto">
          <span className="text-xs text-muted-foreground">Page {pageNum}</span>
        </div>
      </div>
    </div>
  );
};

export default function EnhancedMaterialPreview({
  material,
  isOpen,
  onClose,
  onDownload,
  isAdmin = false,
}: EnhancedMaterialPreviewProps) {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  if (!material) return null;

  const isBook = ['pdf', 'epub', 'mobi'].includes(material.file_type.toLowerCase());
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(material.file_type.toLowerCase());
  
  // Preview pages calculation (Amazon-style: first 15%)
  const totalPages = 50; // Simulated - would come from actual document
  const previewPages = isAdmin ? totalPages : Math.max(3, Math.ceil(totalPages * 0.15));
  const isLoggedIn = !!user;

  const canViewPage = (pageNum: number) => {
    if (isAdmin) return true;
    if (!isLoggedIn) return pageNum <= 2;
    return pageNum <= previewPages;
  };

  const handlePrevPage = () => {
    setCurrentPage(p => Math.max(1, p - 1));
  };

  const handleNextPage = () => {
    if (canViewPage(currentPage + 1) || isAdmin) {
      setCurrentPage(p => Math.min(totalPages, p + 1));
    }
  };

  const renderImagePreview = () => (
    <div className="aspect-video bg-muted rounded-lg overflow-hidden border border-border">
      {material.thumbnail_url || material.file_url ? (
        <img 
          src={material.thumbnail_url || material.file_url}
          alt={material.title}
          className="w-full h-full object-contain"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Image className="w-16 h-16 text-muted-foreground/40" />
        </div>
      )}
    </div>
  );

  const renderBookPreview = () => (
    <div className="space-y-4">
      {/* Page viewer */}
      <div className="relative">
        <PreviewPage 
          pageNum={currentPage} 
          isLocked={!canViewPage(currentPage)} 
          title={material.title}
        />
        
        {/* Navigation arrows */}
        <Button
          variant="outline"
          size="icon"
          className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full shadow-lg"
          onClick={handlePrevPage}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full shadow-lg"
          onClick={handleNextPage}
          disabled={currentPage >= totalPages || (!canViewPage(currentPage + 1) && !isAdmin)}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Page indicator */}
      <div className="flex items-center justify-center gap-4">
        <span className="text-sm text-muted-foreground">
          Page {currentPage} of {totalPages}
        </span>
        {!isAdmin && !isLoggedIn && (
          <Badge variant="secondary" className="bg-amber-500/20 text-amber-700">
            <Lock className="w-3 h-3 mr-1" />
            Login to see {previewPages} pages
          </Badge>
        )}
        {!isAdmin && isLoggedIn && currentPage >= previewPages && (
          <Badge variant="secondary" className="bg-primary/20 text-primary">
            Preview limit reached
          </Badge>
        )}
      </div>

      {/* Page thumbnails */}
      <ScrollArea className="w-full">
        <div className="flex gap-2 pb-2">
          {[...Array(Math.min(10, totalPages))].map((_, i) => (
            <button
              key={i}
              onClick={() => canViewPage(i + 1) && setCurrentPage(i + 1)}
              disabled={!canViewPage(i + 1) && !isAdmin}
              className={`shrink-0 w-12 h-16 rounded border transition-all ${
                currentPage === i + 1 
                  ? 'border-primary ring-2 ring-primary/20' 
                  : canViewPage(i + 1) || isAdmin
                    ? 'border-border hover:border-primary/50'
                    : 'border-border opacity-50 cursor-not-allowed'
              }`}
            >
              <div className="w-full h-full bg-muted rounded-sm flex items-center justify-center">
                {canViewPage(i + 1) || isAdmin ? (
                  <span className="text-[10px] text-muted-foreground">{i + 1}</span>
                ) : (
                  <Lock className="w-3 h-3 text-muted-foreground" />
                )}
              </div>
            </button>
          ))}
          {totalPages > 10 && (
            <div className="shrink-0 w-12 h-16 flex items-center justify-center text-muted-foreground">
              ...
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );

  const renderDocPreview = () => (
    <div className="aspect-[3/4] bg-muted rounded-lg flex flex-col items-center justify-center border border-border">
      <File className="w-16 h-16 text-muted-foreground/40 mb-3" />
      <span className="text-sm text-muted-foreground">{material.file_type.toUpperCase()} Document</span>
      <span className="text-xs text-muted-foreground mt-1">
        {material.file_size ? formatFileSize(material.file_size) : 'Unknown size'}
      </span>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0 border-b border-border pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-xl font-semibold text-foreground mb-2 line-clamp-2">
                {material.title}
              </DialogTitle>
              <div className="flex flex-wrap items-center gap-2">
                {material.subject && <Badge variant="secondary">{material.subject}</Badge>}
                {material.branch && <Badge variant="outline">{material.branch}</Badge>}
                <Badge variant="outline" className="uppercase">{material.file_type}</Badge>
                {material.status === 'pending' && (
                  <Badge variant="secondary" className="bg-amber-500/20 text-amber-700">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Pending Review
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-auto">
          <div className="p-6 space-y-6">
            {/* Preview Area */}
            {isImage ? renderImagePreview() : isBook ? renderBookPreview() : renderDocPreview()}

            {/* Description */}
            {material.description && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {material.description}
              </p>
            )}

            {/* Meta Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {material.contributor_name && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="w-4 h-4" />
                  <span className="truncate">{material.contributor_name}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>{format(new Date(material.created_at), 'MMM dd, yyyy')}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Download className="w-4 h-4" />
                <span>{material.downloads_count} downloads</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Eye className="w-4 h-4" />
                <span>{material.views_count} views</span>
              </div>
            </div>

            {/* File Info */}
            <div className="flex flex-wrap items-center gap-4 text-sm p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-muted-foreground" />
                <span>{material.file_size ? formatFileSize(material.file_size) : 'Unknown'}</span>
              </div>
              {material.language && (
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-muted-foreground" />
                  <span>{material.language}</span>
                </div>
              )}
              {material.college && (
                <span className="text-muted-foreground truncate max-w-[200px]">
                  {material.college}
                </span>
              )}
            </div>
          </div>
        </ScrollArea>

        {/* Actions */}
        <div className="shrink-0 flex gap-3 p-6 pt-4 border-t border-border">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Close
          </Button>
          {isAdmin || material.status === 'approved' ? (
            <Button className="flex-1" onClick={onDownload} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Download
            </Button>
          ) : (
            <Button className="flex-1" disabled>
              <Lock className="w-4 h-4 mr-2" />
              Pending Approval
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
