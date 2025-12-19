import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Eye, 
  Download, 
  Heart, 
  Share2, 
  ChevronDown, 
  ChevronUp,
  User,
  Building
} from 'lucide-react';
import { Material } from '@/types/database';
import MaterialThumbnail from './MaterialThumbnail';
import ReportButton from '@/components/reports/ReportButton';
import { cn } from '@/lib/utils';

interface MaterialCardProps {
  material: Material;
  onPreview: (material: Material) => void;
  onDownload: (material: Material) => void;
  onLike: (material: Material) => void;
  onShare: (material: Material) => void;
  isLiking?: boolean;
}

const MaterialCard = ({ 
  material, 
  onPreview, 
  onDownload, 
  onLike, 
  onShare,
  isLiking 
}: MaterialCardProps) => {
  const [showDescription, setShowDescription] = useState(false);

  const getFileTypeDisplay = (fileType: string): "pdf" | "image" | "doc" | "other" => {
    const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    const docTypes = ['doc', 'docx', 'txt', 'rtf', 'ppt', 'pptx'];
    
    if (fileType === 'pdf') return 'pdf';
    if (imageTypes.includes(fileType.toLowerCase())) return 'image';
    if (docTypes.includes(fileType.toLowerCase())) return 'doc';
    return 'other';
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <Card className="group overflow-hidden h-full flex flex-col hover:shadow-univoid-hover transition-all duration-200 hover:-translate-y-1">
      <CardContent className="p-0 flex flex-col h-full">
        {/* Clickable area for preview */}
        <div 
          className="p-5 pb-0 cursor-pointer flex-1"
          onClick={() => onPreview(material)}
        >
          {/* Thumbnail */}
          <div className="flex gap-4">
            <MaterialThumbnail 
              fileType={getFileTypeDisplay(material.file_type)}
              title={material.title}
              thumbnailUrl={material.thumbnail_url || undefined}
              className="w-20 h-24 flex-shrink-0 transition-transform group-hover:scale-[1.02]"
            />
            
            <div className="flex-1 min-w-0">
              {/* Title - max 2 lines */}
              <h3 className="font-bold text-foreground line-clamp-2 mb-2 transition-colors text-sm leading-tight">
                {material.title}
              </h3>
              
              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 mb-2">
                {material.course && (
                  <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                    {material.course}
                  </Badge>
                )}
                {material.subject && (
                  <Badge variant="outline" className="text-[10px] px-2 py-0.5">
                    {material.subject}
                  </Badge>
                )}
                {material.language && (
                  <Badge variant="outline" className="text-[10px] px-2 py-0.5">
                    {material.language}
                  </Badge>
                )}
              </div>
              
              {/* Uploader info */}
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {material.contributor_name || 'Anonymous'}
                </span>
                {material.college && (
                  <span className="flex items-center gap-1 truncate">
                    <Building className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{material.college}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Expandable description */}
          {material.description && (
            <div className="mt-3">
              <button
                type="button"
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDescription(!showDescription);
                }}
              >
                {showDescription ? (
                  <>
                    <ChevronUp className="w-3 h-3" />
                    Hide description
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3 h-3" />
                    Show description
                  </>
                )}
              </button>
              {showDescription && (
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  {material.description}
                </p>
              )}
            </div>
          )}
        </div>
        
        {/* Engagement & Actions */}
        <div className="px-5 pb-5 pt-4 mt-auto border-t-2 border-foreground/10">
          {/* Engagement stats */}
          <div className="flex items-center gap-4 text-[11px] text-muted-foreground mb-3">
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {formatNumber(material.views_count || 0)}
            </span>
            <span className="flex items-center gap-1">
              <Download className="w-3 h-3" />
              {formatNumber(material.downloads_count || 0)}
            </span>
            <span className="flex items-center gap-1">
              <Heart className={cn("w-3 h-3", material.user_has_liked && "fill-red-500 text-red-500")} />
              {formatNumber(material.likes_count || 0)}
            </span>
          </div>
          
          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 px-2 rounded-full",
                material.user_has_liked && "text-red-500 hover:text-red-600"
              )}
              onClick={(e) => {
                e.stopPropagation();
                onLike(material);
              }}
              disabled={isLiking}
            >
              <Heart className={cn("w-4 h-4", material.user_has_liked && "fill-current")} />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 rounded-full"
              onClick={(e) => {
                e.stopPropagation();
                onShare(material);
              }}
            >
              <Share2 className="w-4 h-4" />
            </Button>
            
            <div className="flex-1" />
            
            <ReportButton
              contentType="materials"
              contentId={material.id}
              contentOwnerId={material.created_by}
              contentTitle={material.title}
            />
            
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onPreview(material);
              }}
            >
              <Eye className="w-3.5 h-3.5 mr-1" />
              Preview
            </Button>
            
            <Button
              size="sm"
              className="h-8 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onDownload(material);
              }}
            >
              <Download className="w-3.5 h-3.5 mr-1" />
              Download
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MaterialCard;
