import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AuthModal from "@/components/auth/AuthModal";
import MaterialPreviewModal from "@/components/materials/MaterialPreviewModal";
import MaterialThumbnail from "@/components/materials/MaterialThumbnail";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Download, Eye, Calendar, User, BookOpen, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface Material {
  id: number;
  title: string;
  subject: string;
  type: string;
  fileType: "pdf" | "image" | "doc" | "other";
  downloads: number;
  date: string;
  preview: string;
  contributor: string;
  thumbnailUrl?: string;
}

const mockMaterials: Material[] = [
  { id: 1, title: "Calculus II Complete Notes", subject: "Mathematics", type: "Notes", fileType: "pdf", downloads: 234, date: "2024-01-15", preview: "Comprehensive notes covering integration techniques, series, and sequences. Includes worked examples and practice problems for each topic.", contributor: "Sarah Ahmed" },
  { id: 2, title: "Organic Chemistry Past Papers 2023", subject: "Chemistry", type: "Past Paper", fileType: "pdf", downloads: 189, date: "2024-01-12", preview: "Collection of past examination papers with marking schemes. Covers reactions, mechanisms, and synthesis problems.", contributor: "Ali Hassan" },
  { id: 3, title: "Data Structures & Algorithms Summary", subject: "Computer Science", type: "Notes", fileType: "doc", downloads: 312, date: "2024-01-10", preview: "Quick reference guide for common data structures and algorithm complexity. Perfect for interview preparation.", contributor: "Fatima Khan" },
  { id: 4, title: "Microeconomics Cheat Sheet", subject: "Economics", type: "Cheat Sheet", fileType: "image", downloads: 156, date: "2024-01-08", preview: "One-page summary of key microeconomics concepts and formulas. Covers supply, demand, elasticity, and market structures.", contributor: "Omar Malik" },
  { id: 5, title: "Physics Lab Report Template", subject: "Physics", type: "Template", fileType: "doc", downloads: 98, date: "2024-01-05", preview: "Standard lab report template with examples and formatting guidelines. Includes sections for methodology, results, and analysis.", contributor: "Ayesha Rahman" },
  { id: 6, title: "Introduction to Psychology Notes", subject: "Psychology", type: "Notes", fileType: "pdf", downloads: 201, date: "2024-01-03", preview: "Lecture notes covering foundational psychology concepts including cognition, behavior, and development theories.", contributor: "Hassan Ali" },
];

const Materials = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [previewMaterial, setPreviewMaterial] = useState<Material | null>(null);

  const handleDownload = () => {
    if (user) {
      // TODO: Implement actual download
      console.log("Downloading...");
    } else {
      setAuthMessage("Sign in to download study materials");
      setAuthOpen(true);
    }
  };

  const handleUpload = () => {
    if (user) {
      navigate("/dashboard");
    } else {
      setAuthMessage("Sign in to upload study materials");
      setAuthOpen(true);
    }
  };

  const handlePreview = (material: Material) => {
    setPreviewMaterial(material);
  };

  const filteredMaterials = mockMaterials.filter(material =>
    material.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    material.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
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

          {/* Search */}
          <div className="relative mb-8 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by title or subject..."
              className="pl-10 h-11"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Materials List */}
          <div className="space-y-4">
            {filteredMaterials.map((material) => (
              <Card 
                key={material.id} 
                className="card-premium cursor-pointer group"
                onClick={() => handlePreview(material)}
              >
                <CardContent className="p-5 md:p-6">
                  <div className="flex flex-col md:flex-row md:items-start gap-5">
                    {/* Thumbnail Preview */}
                    <MaterialThumbnail 
                      fileType={material.fileType}
                      title={material.title}
                      thumbnailUrl={material.thumbnailUrl}
                      className="transition-transform group-hover:scale-[1.02]"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                          {material.title}
                        </h3>
                        <Badge variant="secondary" className="text-xs font-medium">{material.type}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2 leading-relaxed">
                        {material.preview}
                      </p>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                        <Badge variant="outline" className="font-normal">{material.subject}</Badge>
                        <span className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5" />
                          {material.contributor}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Download className="w-3.5 h-3.5" />
                          {material.downloads} downloads
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {material.date}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2 md:flex-shrink-0">
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
                        onClick={(e) => { e.stopPropagation(); handleDownload(); }} 
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

          {filteredMaterials.length === 0 && (
            <div className="text-center py-16">
              <p className="text-muted-foreground">No materials found matching your search.</p>
            </div>
          )}

          {/* CTA */}
          <Card className="mt-12 border-0 bg-secondary/50">
            <CardContent className="p-8 text-center">
              <h3 className="font-display text-xl text-foreground mb-3">Have study materials to share?</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Help fellow students by uploading your notes, past papers, or study guides. Earn XP for every approved contribution.
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
      
      <AuthModal 
        isOpen={authOpen} 
        onClose={() => setAuthOpen(false)}
        message={authMessage}
      />

      <MaterialPreviewModal
        material={previewMaterial}
        isOpen={!!previewMaterial}
        onClose={() => setPreviewMaterial(null)}
        onDownload={() => {
          setPreviewMaterial(null);
          handleDownload();
        }}
      />
    </div>
  );
};

export default Materials;
