import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Download, FileText, Image, File, Lock, 
  Eye, Calendar, User, HardDrive, Loader2, BookOpen, AlertTriangle,
  ExternalLink, CheckCircle2
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { formatFileSize } from "@/lib/fileCompression";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

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
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingUrl, setIsGeneratingUrl] = useState(true);
  const [previewError, setPreviewError] = useState(false);
  const [hasAdminPreviewed, setHasAdminPreviewed] = useState(false);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);
  
  // Load preferred viewer from localStorage
  const getPreferredViewer = () => {
    try {
      return localStorage.getItem('pdf-viewer-preference') === 'google';
    } catch {
      return false;
    }
  };
  const [useGoogleViewer, setUseGoogleViewer] = useState(getPreferredViewer);
  const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Auto-fallback timeout (10 seconds)
  const LOAD_TIMEOUT_MS = 10000;
  
  // Save viewer preference to localStorage
  const saveViewerPreference = (useGoogle: boolean) => {
    try {
      localStorage.setItem('pdf-viewer-preference', useGoogle ? 'google' : 'native');
    } catch {
      // Ignore storage errors
    }
  };
  
  // Reset state when modal opens/closes or material changes
  useEffect(() => {
    if (isOpen && material) {
      setIsLoading(true);
      setIsGeneratingUrl(true);
      setPreviewError(false);
      setHasAdminPreviewed(false);
      setSignedUrl(null);
      setUrlError(null);
      // Keep the user's preferred viewer choice from localStorage
      setUseGoogleViewer(getPreferredViewer());
      
      // Generate signed URL for preview
      generateSignedUrl();
    }
    
    // Cleanup timeout on unmount or modal close
    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = null;
      }
    };
  }, [isOpen, material?.id]);
  
  // Set up auto-fallback timeout when loading with native viewer
  useEffect(() => {
    // Only set timeout for native viewer when loading a PDF
    const isPdf = material?.file_type.toLowerCase() === 'pdf';
    
    if (isOpen && isPdf && isLoading && !isGeneratingUrl && signedUrl && !useGoogleViewer && !previewError) {
      // Clear any existing timeout
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
      
      // Set new timeout - auto-switch to Google Viewer after 10 seconds
      loadTimeoutRef.current = setTimeout(() => {
        if (isLoading && !previewError) {
          setIsLoading(true);
          setPreviewError(false);
          setUseGoogleViewer(true);
          saveViewerPreference(true);
        }
      }, LOAD_TIMEOUT_MS);
    }
    
    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = null;
      }
    };
  }, [isOpen, isLoading, isGeneratingUrl, signedUrl, useGoogleViewer, previewError, material?.file_type]);

  const generateSignedUrl = async () => {
    if (!material) return;
    
    // Determine which URL to use
    const urlToUse = isAdmin ? material.file_url : (material.preview_file_url || material.file_url);
    
    console.log('[Preview] Starting URL generation for:', {
      file_url: material.file_url,
      preview_file_url: material.preview_file_url,
      urlToUse,
      isAdmin,
      file_type: material.file_type
    });
    
    if (!urlToUse || urlToUse.trim() === '') {
      console.error('[Preview] No URL available');
      setUrlError('Preview URL not available');
      setIsLoading(false);
      setIsGeneratingUrl(false);
      return;
    }

    // Try to extract file path and generate a fresh signed URL
    try {
      let filePath: string | null = null;
      
      // Pattern 1: Direct storage path (userId/filename format - no http)
      // New upload format: userId/uuid.extension (e.g., "105a4f6b-8ddb.../75629823-....jpg")
      const isDirectPath = !urlToUse.startsWith('http') && urlToUse.includes('/');
      
      // Pattern 2: Just a filename without path separator (legacy)
      const isSimpleFilename = !urlToUse.startsWith('http') && !urlToUse.includes('/') && urlToUse.includes('.');
      
      if (isDirectPath) {
        // Direct storage path - use as-is
        filePath = urlToUse;
        console.log('[Preview] Using direct storage path:', filePath);
      } else if (isSimpleFilename) {
        // Simple filename - use as-is
        filePath = urlToUse;
        console.log('[Preview] Using simple filename:', filePath);
      } else if (urlToUse.startsWith('http')) {
        // Try multiple patterns to extract the path from URL
        
        // Pattern: /storage/v1/object/sign/materials/path OR /storage/v1/object/public/materials/path
        let match = urlToUse.match(/\/storage\/v1\/object\/(?:sign|public)\/materials\/([^?]+)/);
        if (match) {
          filePath = decodeURIComponent(match[1]);
          console.log('[Preview] Extracted from storage v1 URL:', filePath);
        }
        
        // Pattern: /object/sign/materials/path OR /object/public/materials/path  
        if (!filePath) {
          match = urlToUse.match(/\/object\/(?:sign|public)\/materials\/([^?]+)/);
          if (match) {
            filePath = decodeURIComponent(match[1]);
            console.log('[Preview] Extracted from object URL:', filePath);
          }
        }
        
        // Pattern: supabase.co/.../materials/path
        if (!filePath) {
          match = urlToUse.match(/supabase\.co[^/]*\/[^/]+\/materials\/([^?]+)/);
          if (match) {
            filePath = decodeURIComponent(match[1]);
            console.log('[Preview] Extracted from supabase URL:', filePath);
          }
        }
        
        // Generic pattern: anything after /materials/
        if (!filePath) {
          match = urlToUse.match(/\/materials\/([^?]+)/);
          if (match) {
            filePath = decodeURIComponent(match[1]);
            console.log('[Preview] Extracted from generic /materials/ pattern:', filePath);
          }
        }
      }
      
      // If we found a file path, generate a fresh signed URL
      if (filePath) {
        console.log('[Preview] Generating signed URL for path:', filePath);
        
        const { data, error } = await supabase.storage
          .from('materials')
          .createSignedUrl(filePath, 3600); // 1 hour expiry for preview
        
        if (!error && data?.signedUrl) {
          console.log('[Preview] Successfully generated signed URL');
          setSignedUrl(data.signedUrl);
          setIsGeneratingUrl(false);
          // Keep isLoading true - will be set to false by content load handlers
          // For PDFs: handleIframeLoad, For images: onLoad
          return;
        } else {
          console.error('[Preview] Failed to generate signed URL:', error?.message || error);
          // Don't give up yet - try fallbacks
        }
      }
      
      // Fallback 1: URL already has a token (valid signed URL)
      if (urlToUse.startsWith('http') && urlToUse.includes('token=')) {
        console.log('[Preview] Using existing signed URL as fallback');
        setSignedUrl(urlToUse);
        setIsGeneratingUrl(false);
        // Keep isLoading true for content handlers
        return;
      }
      
      // Fallback 2: Try using the HTTP URL directly (might be public)
      if (urlToUse.startsWith('http')) {
        console.log('[Preview] Using HTTP URL directly as last resort');
        setSignedUrl(urlToUse);
        setIsGeneratingUrl(false);
        // Keep isLoading true for content handlers
        return;
      }
      
      // Nothing worked - set error state
      console.error('[Preview] Could not generate preview URL for:', urlToUse);
      setUrlError('Could not generate preview URL. Try using "Open Document" button.');
      setIsLoading(false);
    } catch (err) {
      console.error('[Preview] Error generating signed URL:', err);
      // Fall back to original URL on any error
      if (urlToUse.startsWith('http')) {
        setSignedUrl(urlToUse);
      } else {
        setUrlError('Could not generate preview URL');
        setIsLoading(false);
      }
    } finally {
      setIsGeneratingUrl(false);
    }
  };

  // Helper function to open document with signed URL
  const handleOpenDocument = async () => {
    // If we already have a signed URL, use it
    if (signedUrl) {
      window.open(signedUrl, '_blank');
      return;
    }
    
    // Otherwise generate one on-the-fly
    const urlToUse = material?.file_url;
    if (!urlToUse) return;
    
    try {
      // Check if it's a direct path
      const isDirectPath = !urlToUse.startsWith('http') && urlToUse.includes('/');
      
      if (isDirectPath) {
        const { data } = await supabase.storage
          .from('materials')
          .createSignedUrl(urlToUse, 3600);
        if (data?.signedUrl) {
          window.open(data.signedUrl, '_blank');
          return;
        }
      }
      
      // Fallback to original URL
      window.open(urlToUse, '_blank');
    } catch {
      // Last resort - try opening original URL
      window.open(urlToUse, '_blank');
    }
  };

  // Skeleton component for loading state - includes fallback Open Document button
  const renderLoadingSkeleton = () => (
    <div className="space-y-3">
      {/* Always show Open Document fallback even while loading */}
      {material?.file_url && (
        <div className="flex items-center justify-between gap-2 p-3 bg-muted/50 rounded-lg border border-border">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="w-4 h-4" />
            <span>Can't wait? Open directly</span>
          </div>
          <Button 
            variant="default"
            size="sm"
            onClick={handleOpenDocument}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Open Document
          </Button>
        </div>
      )}
      
      <div className="aspect-[3/4] min-h-[500px] bg-muted rounded-lg overflow-hidden border border-border p-6 space-y-4">
        <div className="flex items-center justify-center mb-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
        <Skeleton className="h-4 w-3/4 mx-auto" />
        <Skeleton className="h-4 w-1/2 mx-auto" />
        <div className="space-y-3 mt-8">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
        </div>
        <div className="space-y-3 mt-6">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/4" />
        </div>
        <div className="text-center mt-6">
          <span className="text-sm text-muted-foreground">Preparing preview...</span>
        </div>
      </div>
    </div>
  );

  // Mark admin preview complete
  useEffect(() => {
    if (isAdmin && isOpen && !hasAdminPreviewed && material?.status === 'pending' && signedUrl) {
      const timer = setTimeout(() => {
        setHasAdminPreviewed(true);
        onAdminPreviewComplete?.(material.id);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isAdmin, isOpen, hasAdminPreviewed, material?.id, material?.status, onAdminPreviewComplete, signedUrl]);

  if (!material) return null;

  const isPdf = material.file_type.toLowerCase() === 'pdf';
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(material.file_type.toLowerCase());
  const isDocument = ['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'].includes(material.file_type.toLowerCase());
  const isZip = ['zip', 'rar', '7z'].includes(material.file_type.toLowerCase());
  
  const isLoggedIn = !!user;
  const previewLimit = material.preview_page_limit || 5;

  const handleIframeLoad = () => {
    setIsLoading(false);
    // Clear timeout on successful load
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = null;
    }
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setPreviewError(true);
    // Clear timeout on error
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = null;
    }
  };

  const renderNoUrlError = () => (
    <div className="aspect-[3/4] min-h-[400px] bg-muted rounded-lg flex flex-col items-center justify-center border border-border p-8">
      <AlertTriangle className="w-16 h-16 text-amber-500 mb-4" />
      <span className="text-lg font-medium text-foreground mb-2">Preview Not Available</span>
      <span className="text-sm text-muted-foreground text-center mb-4">
        {urlError || 'The preview file is not ready yet.'}
      </span>
      {/* Always show "Open Document" fallback button - use handleOpenDocument for proper URL generation */}
      {material.file_url && (
        <Button 
          variant="default"
          onClick={handleOpenDocument}
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Open Document
        </Button>
      )}
    </div>
  );

  const renderPdfPreview = () => {
    // Block if no URL
    if (!signedUrl || urlError) {
      return renderNoUrlError();
    }

    // Google Docs viewer URL
    const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(signedUrl)}&embedded=true`;
    
    // Determine which viewer to use
    const viewerUrl = useGoogleViewer ? googleViewerUrl : `${signedUrl}#toolbar=${isAdmin ? '1' : '0'}&navpanes=0&scrollbar=1`;
    
    return (
      <div className="space-y-3">
        {/* ALWAYS show Open Document button - users must never be blocked */}
        <div className="flex items-center justify-between gap-2 p-3 bg-muted/50 rounded-lg border border-border">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="w-4 h-4" />
            <span>Can't see the preview?</span>
          </div>
          <Button 
            variant="default"
            size="sm"
            onClick={() => window.open(signedUrl, '_blank')}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Open Document
          </Button>
        </div>

        {/* Preview iframe container */}
        <div className="relative w-full aspect-[3/4] min-h-[300px] sm:min-h-[500px] bg-muted rounded-lg overflow-hidden border border-border">
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
              <span className="text-sm text-muted-foreground">Loading preview...</span>
            </div>
          )}
          
          {previewError && !useGoogleViewer ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
              <FileText className="w-16 h-16 text-muted-foreground/40 mb-4" />
              <p className="text-muted-foreground mb-2">Native preview could not be loaded</p>
              <p className="text-xs text-muted-foreground/70 text-center mb-4">
                Try using Google Docs viewer instead
              </p>
              <div className="flex gap-2">
                <Button 
                  variant="default" 
                  size="sm"
                onClick={() => {
                  setPreviewError(false);
                  setIsLoading(true);
                  setUseGoogleViewer(true);
                  saveViewerPreference(true);
                }}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Try Google Viewer
                </Button>
              </div>
            </div>
          ) : previewError && useGoogleViewer ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
              <FileText className="w-16 h-16 text-muted-foreground/40 mb-4" />
              <p className="text-muted-foreground mb-2">Preview not available</p>
              <p className="text-xs text-muted-foreground/70 text-center mb-4">
                Use the "Open Document" button above to view the file
              </p>
            </div>
          ) : (
            <iframe
              src={viewerUrl}
              className="w-full h-full border-0"
              title={material.title}
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              style={{ border: 'none' }}
              sandbox="allow-scripts allow-same-origin allow-popups"
            />
          )}
          
          {/* Viewer toggle for admin */}
          {isAdmin && !previewError && signedUrl && (
            <div className="absolute top-2 right-2 z-10">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setIsLoading(true);
                  setPreviewError(false);
                  const newValue = !useGoogleViewer;
                  setUseGoogleViewer(newValue);
                  saveViewerPreference(newValue);
                }}
                className="text-xs opacity-80 hover:opacity-100"
              >
                {useGoogleViewer ? 'Native Viewer' : 'Google Viewer'}
              </Button>
            </div>
          )}
          
          {/* Preview limit overlay for non-admin users */}
          {!isAdmin && isLoggedIn && !previewError && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/95 to-transparent p-6 text-center pointer-events-none">
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
      </div>
    );
  };

  const renderImagePreview = () => {
    // Only use signed URL for images - raw file_url is just a path
    if (!signedUrl || urlError) {
      return renderNoUrlError();
    }
    
    return (
      <div className="space-y-3">
        {/* Open Image button for fallback */}
        <div className="flex items-center justify-between gap-2 p-3 bg-muted/50 rounded-lg border border-border">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Image className="w-4 h-4" />
            <span>Can't see the image?</span>
          </div>
          <Button 
            variant="default"
            size="sm"
            onClick={() => window.open(signedUrl, '_blank')}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Open Image
          </Button>
        </div>
        
        {/* Image preview container */}
        <div className="relative w-full min-h-[300px] sm:min-h-[500px] bg-muted rounded-lg overflow-hidden border border-border flex items-center justify-center">
          {/* Show loading state while image is loading */}
          {!previewError && (
            <div className={`absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10 transition-opacity duration-300 ${isLoading ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
              <span className="text-sm text-muted-foreground">Loading image...</span>
            </div>
          )}
          
          {previewError ? (
            <div className="flex flex-col items-center justify-center p-4">
              <Image className="w-16 h-16 text-muted-foreground/40 mb-4" />
              <p className="text-muted-foreground mb-2">Image preview not available</p>
              <p className="text-xs text-muted-foreground/70 text-center mb-4">
                Use the "Open Image" button above to view the file
              </p>
            </div>
          ) : (
            <img
              src={signedUrl}
              alt={material.title}
              className="max-w-full max-h-[600px] object-contain"
              onLoad={() => {
                setIsLoading(false);
                setPreviewError(false);
              }}
              onError={() => {
                setIsLoading(false);
                setPreviewError(true);
              }}
            />
          )}
        </div>
        
        {/* File info */}
        <p className="text-xs text-muted-foreground text-center">
          {material.file_type.toUpperCase()} • {material.file_size ? formatFileSize(material.file_size) : 'Unknown size'}
        </p>
      </div>
    );
  };

  const renderDocPreview = () => (
    <div className="aspect-[3/4] bg-muted rounded-lg flex flex-col items-center justify-center border border-border p-8">
      <File className="w-20 h-20 text-muted-foreground/40 mb-4" />
      <span className="text-lg font-medium text-foreground mb-2">
        {material.file_type.toUpperCase()} Document
      </span>
      <span className="text-sm text-muted-foreground text-center mb-2">
        Preview available for PDF files only.
      </span>
      <span className="text-xs text-muted-foreground">
        {material.file_size ? formatFileSize(material.file_size) : 'Unknown size'}
      </span>
    </div>
  );

  const renderZipPreview = () => (
    <div className="aspect-[3/4] bg-muted rounded-lg flex flex-col items-center justify-center border border-border p-8">
      <File className="w-20 h-20 text-muted-foreground/40 mb-4" />
      <span className="text-lg font-medium text-foreground mb-2">
        Archive File
      </span>
      <span className="text-sm text-muted-foreground text-center mb-2">
        Preview available for PDF files only.
      </span>
      <span className="text-xs text-muted-foreground">
        {material.file_size ? formatFileSize(material.file_size) : 'Unknown size'}
      </span>
      <p className="text-xs text-muted-foreground text-center mt-4">
        Contains study materials, notes, or resources
      </p>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 max-w-4xl w-[90vw] max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
        <DialogHeader className="shrink-0 border-b border-border p-4 pb-4">
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

        <ScrollArea className="flex-1 min-h-0 overflow-auto">
          <div className="p-4 space-y-6">
            {/* Preview Area - Show skeleton while generating URL */}
            {isGeneratingUrl ? renderLoadingSkeleton() : (
              isPdf ? renderPdfPreview() : 
              isImage ? renderImagePreview() : 
              isZip ? renderZipPreview() :
              renderDocPreview()
            )}

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
