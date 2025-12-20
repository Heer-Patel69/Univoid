import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, GraduationCap } from "lucide-react";

const DEGREE_OPTIONS = [
  "B.Tech",
  "B.Sc",
  "B.Com",
  "B.A",
  "BBA",
  "BCA",
  "M.Tech",
  "M.Sc",
  "MBA",
  "MCA",
  "Ph.D",
  "Other",
];

const YEAR_OPTIONS = [
  { value: "1", label: "1st Year" },
  { value: "2", label: "2nd Year" },
  { value: "3", label: "3rd Year" },
  { value: "4", label: "4th Year" },
  { value: "5", label: "5th Year" },
];

const INTEREST_OPTIONS = [
  "Hackathons",
  "Internships",
  "Startups",
  "Coding",
  "Design",
  "AI/ML",
  "Web Dev",
  "Mobile Dev",
  "Data Science",
  "Blockchain",
  "Gaming",
  "Research",
];

const Onboarding = () => {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || "",
    college_name: profile?.college_name || "",
    degree: "",
    branch: profile?.course_stream || "",
    current_year: "",
    city: "",
    state: "",
    interests: [] as string[],
  });

  const progress = calculateProgress();

  function calculateProgress() {
    const fields = [
      formData.full_name,
      formData.college_name,
      formData.degree,
      formData.branch,
      formData.current_year,
      formData.city,
      formData.state,
    ];
    const filledFields = fields.filter((f) => f && f.trim() !== "").length;
    const interestFilled = formData.interests.length > 0 ? 1 : 0;
    return ((filledFields + interestFilled) / 8) * 100;
  }

  const toggleInterest = (interest: string) => {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  const isFormValid = () => {
    return (
      formData.full_name.trim() !== "" &&
      formData.college_name.trim() !== "" &&
      formData.degree !== "" &&
      formData.branch.trim() !== "" &&
      formData.current_year !== "" &&
      formData.city.trim() !== "" &&
      formData.state.trim() !== "" &&
      formData.interests.length > 0
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid()) {
      toast({
        title: "Incomplete Form",
        description: "Please fill all fields before continuing.",
        variant: "destructive",
      });
      return;
    }

    if (!user) return;

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name,
          college_name: formData.college_name,
          degree: formData.degree,
          branch: formData.branch,
          course_stream: formData.branch, // Keep backward compat
          current_year: parseInt(formData.current_year),
          year_semester: `Year ${formData.current_year}`, // Keep backward compat
          city: formData.city,
          state: formData.state,
          interests: formData.interests,
          profile_complete: true,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Welcome to UniVoid! 🎉",
        description: "Your profile is all set. Let's explore!",
      });

      // Refresh profile in context
      if (refreshProfile) {
        await refreshProfile();
      }

      navigate("/dashboard", { replace: true });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save profile",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        {/* Progress Bar */}
        <div className="px-6 pt-6">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2 text-center">
            {Math.round(progress)}% Complete
          </p>
        </div>

        <CardHeader className="text-center pb-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
          <p className="text-muted-foreground text-sm mt-2">
            Tell us about yourself to personalize your experience
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Identity Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Identity</h3>
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                  placeholder="Your full name"
                  required
                />
              </div>
            </div>

            {/* Academic Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Academic</h3>

              <div className="space-y-2">
                <Label htmlFor="college_name">College Name *</Label>
                <Input
                  id="college_name"
                  value={formData.college_name}
                  onChange={(e) =>
                    setFormData({ ...formData, college_name: e.target.value })
                  }
                  placeholder="e.g. IIT Delhi"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Degree *</Label>
                  <Select
                    value={formData.degree}
                    onValueChange={(value) =>
                      setFormData({ ...formData, degree: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select degree" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEGREE_OPTIONS.map((deg) => (
                        <SelectItem key={deg} value={deg}>
                          {deg}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Current Year *</Label>
                  <Select
                    value={formData.current_year}
                    onValueChange={(value) =>
                      setFormData({ ...formData, current_year: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {YEAR_OPTIONS.map((yr) => (
                        <SelectItem key={yr.value} value={yr.value}>
                          {yr.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="branch">Branch / Stream *</Label>
                <Input
                  id="branch"
                  value={formData.branch}
                  onChange={(e) =>
                    setFormData({ ...formData, branch: e.target.value })
                  }
                  placeholder="e.g. Computer Science"
                  required
                />
              </div>
            </div>

            {/* Location Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Location</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    placeholder="e.g. Mumbai"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) =>
                      setFormData({ ...formData, state: e.target.value })
                    }
                    placeholder="e.g. Maharashtra"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Interests Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">
                Interests *
              </h3>
              <p className="text-xs text-muted-foreground">
                Select at least one interest
              </p>
              <div className="flex flex-wrap gap-2">
                {INTEREST_OPTIONS.map((interest) => (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-all ${
                      formData.interests.includes(interest)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card text-foreground border-border hover:border-primary/50"
                    }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold"
              disabled={!isFormValid() || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save & Continue"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Onboarding;
