import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, User, ArrowRight, Building, BookOpen, Calendar, Phone, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  message?: string;
}

const AuthModal = ({ isOpen, onClose, onSuccess, message }: AuthModalProps) => {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [isLoading, setIsLoading] = useState(false);
  
  // Login fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Registration fields
  const [fullName, setFullName] = useState("");
  const [collegeName, setCollegeName] = useState("");
  const [courseStream, setCourseStream] = useState("");
  const [yearSemester, setYearSemester] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");

  const { signIn, signUp } = useAuth();
  const { toast } = useToast();

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setFullName("");
    setCollegeName("");
    setCourseStream("");
    setYearSemester("");
    setMobileNumber("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === "login") {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: "Sign in failed",
            description: error.message === "Invalid login credentials" 
              ? "Invalid email or password. Please try again."
              : error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Welcome back!",
            description: "You have successfully signed in.",
          });
          resetForm();
          onSuccess?.();
          onClose();
        }
      } else {
        // Validation
        if (password.length < 6) {
          toast({
            title: "Password too short",
            description: "Password must be at least 6 characters.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        const { error } = await signUp({
          email,
          password,
          full_name: fullName,
          college_name: collegeName,
          course_stream: courseStream,
          year_semester: yearSemester,
          mobile_number: mobileNumber || undefined,
        });

        if (error) {
          const errorMessage = error.message.includes("already registered")
            ? "This email is already registered. Please sign in instead."
            : error.message;
          toast({
            title: "Registration failed",
            description: errorMessage,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Welcome to UniVoid!",
            description: "Your account has been created successfully.",
          });
          resetForm();
          onSuccess?.();
          onClose();
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-0 shadow-premium-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-primary px-6 py-8 text-center">
          <div className="w-14 h-14 bg-primary-foreground/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-primary-foreground font-bold text-xl">U</span>
          </div>
          <DialogTitle className="text-xl font-display font-semibold text-primary-foreground mb-2">
            {mode === "login" ? "Welcome back" : "Join UniVoid"}
          </DialogTitle>
          {message && (
            <p className="text-primary-foreground/80 text-sm">{message}</p>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-3">
            {mode === "register" && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="fullName" className="text-sm font-medium text-foreground">Full name *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      id="fullName" 
                      placeholder="Enter your full name" 
                      className="pl-10 h-10"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="collegeName" className="text-sm font-medium text-foreground">College name *</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      id="collegeName" 
                      placeholder="Enter your college name" 
                      className="pl-10 h-10"
                      value={collegeName}
                      onChange={(e) => setCollegeName(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="courseStream" className="text-sm font-medium text-foreground">Course / Stream *</Label>
                  <div className="relative">
                    <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      id="courseStream" 
                      placeholder="e.g. B.Tech CSE, BA Economics" 
                      className="pl-10 h-10"
                      value={courseStream}
                      onChange={(e) => setCourseStream(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="yearSemester" className="text-sm font-medium text-foreground">Year / Semester *</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      id="yearSemester" 
                      placeholder="e.g. 3rd Year, 5th Semester" 
                      className="pl-10 h-10"
                      value={yearSemester}
                      onChange={(e) => setYearSemester(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="mobileNumber" className="text-sm font-medium text-foreground">Mobile number (optional)</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      id="mobileNumber" 
                      type="tel"
                      placeholder="Your phone number" 
                      className="pl-10 h-10"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </>
            )}
            
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-foreground">Email *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="you@university.edu" 
                  className="pl-10 h-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium text-foreground">Password *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••" 
                  className="pl-10 h-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  disabled={isLoading}
                />
              </div>
              {mode === "register" && (
                <p className="text-xs text-muted-foreground">At least 6 characters</p>
              )}
            </div>
          </div>

          <Button type="submit" className="w-full h-11 font-medium shadow-premium-sm" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {mode === "login" ? "Signing in..." : "Creating account..."}
              </>
            ) : (
              <>
                {mode === "login" ? "Sign in" : "Create account"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-background px-3 text-muted-foreground">
                {mode === "login" ? "New to UniVoid?" : "Already have an account?"}
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            className="w-full h-10 font-medium text-muted-foreground hover:text-foreground"
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              resetForm();
            }}
            disabled={isLoading}
          >
            {mode === "login" ? "Create an account" : "Sign in instead"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
