import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { X, ImagePlus, Loader2 } from "lucide-react";
import { compressImage, validateImageFile, CompressedImage } from "@/lib/imageCompression";
import { toast } from "sonner";

interface BookImageUploadProps {
  images: CompressedImage[];
  onImagesChange: (images: CompressedImage[]) => void;
  maxImages?: number;
}

const BookImageUpload = ({ images, onImagesChange, maxImages = 3 }: BookImageUploadProps) => {
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remainingSlots = maxImages - images.length;
    if (remainingSlots <= 0) {
      toast.error(`You can upload maximum ${maxImages} images only`);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    // Show warning if trying to add too many
    if (files.length > remainingSlots) {
      toast.warning(`Only ${remainingSlots} more image(s) can be added. Max ${maxImages} allowed.`);
    }

    const filesToProcess = files.slice(0, remainingSlots);
    setIsCompressing(true);

    try {
      const newImages: CompressedImage[] = [];

      for (const file of filesToProcess) {
        const error = validateImageFile(file);
        if (error) {
          toast.error(`${file.name}: ${error}`);
          continue;
        }

        const compressed = await compressImage(file);
        newImages.push(compressed);
      }

      if (newImages.length > 0) {
        onImagesChange([...images, ...newImages]);
        toast.success(`${newImages.length} image(s) added`);
      }
    } catch (error) {
      toast.error("Failed to process images");
    } finally {
      setIsCompressing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {images.length}/{maxImages} images
        </span>
        {images.length < maxImages && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isCompressing}
          >
            {isCompressing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <ImagePlus className="w-4 h-4 mr-2" />
            )}
            Add Image
          </Button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {images.length > 0 ? (
        <div className="grid grid-cols-3 gap-3">
          {images.map((img, index) => (
            <div
              key={index}
              className="relative aspect-square rounded-lg overflow-hidden border border-border group"
            >
              <img
                src={img.preview}
                alt={`Book image ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-1 right-1 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
              {index === 0 && (
                <span className="absolute bottom-1 left-1 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
                  Cover
                </span>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
        >
          <ImagePlus className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            Click to add photos (max {maxImages} images)
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            JPG, PNG, WebP • First image will be the cover
          </p>
        </div>
      )}
    </div>
  );
};

export default BookImageUpload;
