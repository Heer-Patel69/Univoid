import { useState, useCallback, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Download, FileText, Image, File, Lock, ChevronLeft, ChevronRight, 
  Eye, Calendar, User, HardDrive, Loader2, BookOpen, AlertTriangle,
  ExternalLink, CheckCircle2
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
  preview_file_url?: string;
  preview_page_limit?: number;
  preview_ready?: boolean;
  admin_previewed?: boolean;
}

interface EnhancedMaterialPreviewProps {
  material: MaterialData | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload: () => void;
  isAdmin?: boolean;
  onAdminPreviewComplete?: (materialId: string) => void;
}

export default function EnhancedMaterialPreview({
  material,
  isOpen,
  onClose,
  onDownload,
  isAdmin = false,
  onAdminPreviewComplete,
}: EnhancedMaterialPreviewProps) {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [previewError, setPreviewError] = useState(false);
  const [hasAdminPreviewed, setHasAdminPreviewed] = useState(false);
  
  if (!material) return null;

  const isPdf = material.file_type.toLowerCase() === 'pdf';
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(material.file_type.toLowerCase());
  const isDocument = ['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'].includes(material.file_type.toLowerCase());
  const isZip = ['zip', 'rar', '7z'].includes(material.file_type.toLowerCase());
  
  const isLoggedIn = !!user;
  const previewLimit = material.preview_page_limit || 5;
  
  // Determine which URL to use for preview
  const previewUrl = isAdmin ? material.file_url : (material.preview_file_url || material.file_url);
  
  // Mark admin preview complete
  useEffect(() => {
    if (isAdmin && isOpen && !hasAdminPreviewed && material.status === 'pending') {
      const timer = setTimeout(() => {
        setHasAdminPreviewed(true);
        onAdminPreviewComplete?.(material.id);
      }, 2000); // Admin must view for at least 2 seconds
      return () => clearTimeout(timer);
    }
  }, [isAdmin, isOpen, hasAdminPreviewed, material.id, material.status, onAdminPreviewComplete]);

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setPreviewError(true);
  };

  const renderPdfPreview = () => {
    // For PDF files, use embedded viewer
    const embedUrl = isAdmin 
      ? `${material.file_url}#toolbar=1&navpanes=1&scrollbar=1`
      : `${previewUrl}#toolbar=0&navpanes=0&scrollbar=1&page=1`;
    
    return (
      <div className="relative w-full aspect-[3/4] min-h-[500px] bg-muted rounded-lg overflow-hidden border border-border">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}
        
        {previewError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <FileText className="w-16 h-16 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground">Preview unavailable</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-4"
              onClick={() => window.open(material.file_url, '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open in new tab
            </Button>
          </div>
        ) : (
          <iframe
            src={embedUrl}
            className="w-full h-full"
            title={material.title}
            onLoad={handleIframeLoad}
            onError={handleIframeError}
          />
        )}
        
        {/* Preview limit overlay for non-admin users */}
        {!isAdmin && isLoggedIn && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/95 to-transparent p-6 text-center">
            <Badge variant="secondary" className="mb-2 bg-primary/20 text-primary">
              <Eye className="w-3 h-3 mr-1" />
              Preview: First {previewLimit} pages
            </Badge>
            <p className="text-xs text-muted-foreground">
              Download to view the complete document
            </p>
          </div>
        )}
        
        {/* Login prompt for non-logged-in users */}
        {!isLoggedIn && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/90 backdrop-blur-sm">
            <Lock className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">Login Required</p>
            <p className="text-sm text-muted-foreground mb-4">
              Sign in to preview this material
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderImagePreview = () => (
    <div className="aspect-video bg-muted rounded-lg overflow-hidden border border-border relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}
      
      <img 
        src={material.thumbnail_url || material.file_url}
        alt={material.title}
        className="w-full h-full object-contain"
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setPreviewError(true);
        }}
      />
      
      {!isLoggedIn && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
          <Lock className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium">Login to view</p>
        </div>
      )}
    </div>
  );

  const renderDocPreview = () => (
    <div className="aspect-[3/4] bg-muted rounded-lg flex flex-col items-center justify-center border border-border p-8">
      <File className="w-20 h-20 text-muted-foreground/40 mb-4" />
      <span className="text-lg font-medium text-foreground mb-2">
        {material.file_type.toUpperCase()} Document
      </span>
      <span className="text-sm text-muted-foreground mb-4">
        {material.file_size ? formatFileSize(material.file_size) : 'Unknown size'}
      </span>
      
      {isAdmin && (
        <Button 
          variant="outline"
          onClick={() => window.open(material.file_url, '_blank')}
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Open Full Document
        </Button>
      )}
      
      {!isAdmin && !isLoggedIn && (
        <div className="text-center mt-4">
          <Lock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Login to download</p>
        </div>
      )}
    </div>
  );

  const renderZipPreview = () => (
    <div className="aspect-[3/4] bg-muted rounded-lg flex flex-col items-center justify-center border border-border p-8">
      <File className="w-20 h-20 text-muted-foreground/40 mb-4" />
      <span className="text-lg font-medium text-foreground mb-2">
        Archive File
      </span>
      <span className="text-sm text-muted-foreground mb-4">
        {material.file_size ? formatFileSize(material.file_size) : 'Unknown size'}
      </span>
      <p className="text-xs text-muted-foreground text-center mb-4">
        Contains study materials, notes, or resources
      </p>
      
      {isAdmin && (
        <Badge variant="secondary" className="bg-green-500/20 text-green-700">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Admin: Full download allowed
        </Badge>
      )}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
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
                {isAdmin && (
                  <Badge variant="secondary" className="bg-purple-500/20 text-purple-700">
                    <Eye className="w-3 h-3 mr-1" />
                    Admin View (Full Access)
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-auto">
          <div className="p-4 space-y-6">
            {/* Preview Area */}
            {isPdf ? renderPdfPreview() : 
             isImage ? renderImagePreview() : 
             isZip ? renderZipPreview() :
             renderDocPreview()}

            {/* Admin Preview Status */}
            {isAdmin && material.status === 'pending' && (
              <div className={`flex items-center gap-2 p-3 rounded-lg ${
                hasAdminPreviewed ? 'bg-green-500/10 text-green-700' : 'bg-amber-500/10 text-amber-700'
              }`}>
                {hasAdminPreviewed ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-sm font-medium">Preview completed - Ready to approve</span>
                  </>
                ) : (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm font-medium">Viewing preview... (required before approval)</span>
                  </>
                )}
              </div>
            )}

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
        <div className="shrink-0 flex gap-3 p-4 pt-4 border-t border-border">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Close
          </Button>
          {isAdmin || material.status === 'approved' ? (
            <Button 
              className="flex-1" 
              onClick={onDownload} 
              disabled={isAdmin && material.status === 'pending' && !hasAdminPreviewed}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              {isAdmin ? 'Download Full File' : 'Download'}
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
