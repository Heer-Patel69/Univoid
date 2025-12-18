import { useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useVerification } from "@/hooks/useVerification";
import VerificationBanner from "@/components/common/VerificationBanner";
import { uploadMaterial } from "@/services/materialsService";
import { toast } from "sonner";
import { ArrowLeft, Upload, Loader2, FileText, CheckCircle, AlertTriangle } from "lucide-react";
import { COURSE_OPTIONS, BRANCH_OPTIONS, LANGUAGE_OPTIONS } from "@/constants/materialOptions";

const UploadMaterial = () => {
  const { user } = useAuth();
  const { isVerified, canUpload } = useVerification();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);

  // New fields
  const [course, setCourse] = useState("");
  const [customCourse, setCustomCourse] = useState("");
  const [branch, setBranch] = useState("");
  const [customBranch, setCustomBranch] = useState("");
  const [subject, setSubject] = useState("");
  const [language, setLanguage] = useState("");
  const [customLanguage, setCustomLanguage] = useState("");
  const [college, setCollege] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Check if it's a video file
      const videoExtensions = ['mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'webm'];
      const ext = selectedFile.name.split('.').pop()?.toLowerCase() || '';
      if (videoExtensions.includes(ext)) {
        toast.error("Video files are not allowed");
        return;
      }
      // Check file size (max 10MB for cloud optimization)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB for optimal performance");
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canUpload) {
      toast.error("Please verify your account to upload materials");
      return;
    }
    
    if (!file) {
      toast.error("Please select a file to upload");
      return;
    }

    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    // Validate required fields
    const finalCourse = course === 'Other' ? customCourse : course;
    const finalBranch = branch === 'Other' ? customBranch : branch;
    const finalLanguage = language === 'Other' ? customLanguage : language;

    if (!finalCourse || !finalBranch || !subject || !finalLanguage || !college) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);

    const { id, error } = await uploadMaterial(
      file, 
      title, 
      description, 
      user.id,
      {
        onProgress: (progress) => setUploadProgress(progress),
        course: finalCourse,
        branch: finalBranch,
        subject,
        language: finalLanguage,
        college,
      }
    );

    setIsSubmitting(false);

    if (error) {
      toast.error(error.message);
      setUploadProgress(0);
      return;
    }

    setIsSuccess(true);
    toast.success("Material uploaded successfully!");
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header onAuthClick={() => {}} />
        <main className="flex-1 py-8">
          <div className="container-wide max-w-lg">
            <Card>
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-foreground mb-2">Upload Successful!</h2>
                <p className="text-muted-foreground mb-6">
                  Your material is now live and available for others to access!
                </p>
                <div className="flex gap-3 justify-center">
                  <Button variant="outline" onClick={() => { 
                    setIsSuccess(false); 
                    setTitle(""); 
                    setDescription(""); 
                    setFile(null); 
                    setUploadProgress(0);
                    setCourse("");
                    setCustomCourse("");
                    setBranch("");
                    setCustomBranch("");
                    setSubject("");
                    setLanguage("");
                    setCustomLanguage("");
                    setCollege("");
                  }}>
                    Upload Another
                  </Button>
                  <Link to="/dashboard">
                    <Button>Go to Dashboard</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header onAuthClick={() => {}} />
      
      <main className="flex-1 py-8">
        <div className="container-wide max-w-lg">
          <Link to="/dashboard">
            <Button variant="ghost" size="sm" className="mb-6">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Dashboard
            </Button>
          </Link>

          <VerificationBanner />

          {!canUpload && (
            <Card className="mb-6 border-warning bg-warning/10">
              <CardContent className="p-4 flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-warning" />
                <p className="text-sm text-warning-foreground">
                  You need to verify your email or phone to upload materials.
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Upload Study Material
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Calculus II Complete Notes"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    disabled={isSubmitting || !canUpload}
                  />
                </div>

                {/* Course */}
                <div className="space-y-2">
                  <Label>Course *</Label>
                  <Select value={course} onValueChange={setCourse} disabled={isSubmitting || !canUpload}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select course" />
                    </SelectTrigger>
                    <SelectContent>
                      {COURSE_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {course === 'Other' && (
                    <Input
                      placeholder="Enter course name"
                      value={customCourse}
                      onChange={(e) => setCustomCourse(e.target.value)}
                      required
                      disabled={isSubmitting || !canUpload}
                    />
                  )}
                </div>

                {/* Branch */}
                <div className="space-y-2">
                  <Label>Branch *</Label>
                  <Select value={branch} onValueChange={setBranch} disabled={isSubmitting || !canUpload}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {BRANCH_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {branch === 'Other' && (
                    <Input
                      placeholder="Enter branch name"
                      value={customBranch}
                      onChange={(e) => setCustomBranch(e.target.value)}
                      required
                      disabled={isSubmitting || !canUpload}
                    />
                  )}
                </div>

                {/* Subject */}
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject *</Label>
                  <Input
                    id="subject"
                    placeholder="e.g., Data Structures, Physics"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                    disabled={isSubmitting || !canUpload}
                  />
                </div>

                {/* Language */}
                <div className="space-y-2">
                  <Label>Language *</Label>
                  <Select value={language} onValueChange={setLanguage} disabled={isSubmitting || !canUpload}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGE_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {language === 'Other' && (
                    <Input
                      placeholder="Enter language"
                      value={customLanguage}
                      onChange={(e) => setCustomLanguage(e.target.value)}
                      required
                      disabled={isSubmitting || !canUpload}
                    />
                  )}
                </div>

                {/* College */}
                <div className="space-y-2">
                  <Label htmlFor="college">College *</Label>
                  <Input
                    id="college"
                    placeholder="e.g., ABC Engineering College"
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    required
                    disabled={isSubmitting || !canUpload}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of the material..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    disabled={isSubmitting || !canUpload}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="file">File *</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                    <input
                      id="file"
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.md,.jpg,.jpeg,.png"
                      onChange={handleFileChange}
                      disabled={isSubmitting || !canUpload}
                    />
                    <label htmlFor="file" className={`cursor-pointer ${(isSubmitting || !canUpload) ? 'pointer-events-none' : ''}`}>
                      {file ? (
                        <div className="flex items-center justify-center gap-2">
                          <FileText className="w-5 h-5 text-primary" />
                          <span className="text-foreground font-medium">{file.name}</span>
                          <span className="text-muted-foreground text-sm">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-muted-foreground">Click to select a file</p>
                          <p className="text-xs text-muted-foreground mt-1">PDF, DOC, PPT, images (max 10MB, NO videos)</p>
                        </>
                      )}
                    </label>
                  </div>
                </div>

                {/* Upload Progress */}
                {isSubmitting && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Uploading...</span>
                      <span className="font-medium text-primary">{Math.round(uploadProgress)}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={isSubmitting || !canUpload}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Material
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default UploadMaterial;