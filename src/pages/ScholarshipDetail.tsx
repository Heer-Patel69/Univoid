import { useParams, useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/layout/BottomNav";
import { Helmet } from "react-helmet";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, MapPin, GraduationCap, Calendar, ExternalLink, CheckCircle2, AlertCircle, Bell, BellOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format, differenceInDays } from "date-fns";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import AuthModal from "@/components/auth/AuthModal";
import PageBreadcrumb from "@/components/common/PageBreadcrumb";
import { scholarshipsService } from "@/services/scholarshipsService";
import { scholarshipRemindersService } from "@/services/scholarshipRemindersService";
import { useAuth } from "@/contexts/AuthContext";

export default function ScholarshipDetail() {
  const { scholarshipId } = useParams<{ scholarshipId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [hasReminder, setHasReminder] = useState(false);
  const [loadingReminder, setLoadingReminder] = useState(false);

  const { data: scholarship, isLoading, error } = useQuery({
    queryKey: ["scholarship", scholarshipId],
    queryFn: () => scholarshipsService.getScholarshipById(scholarshipId!),
    enabled: !!scholarshipId,
  });

  // Check if user has reminder set
  useEffect(() => {
    if (user && scholarshipId) {
      scholarshipRemindersService.getUserReminders(user.id)
        .then(ids => setHasReminder(ids.includes(scholarshipId)))
        .catch(console.error);
    }
  }, [user, scholarshipId]);

  const handleToggleReminder = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    if (!scholarshipId || !scholarship) return;

    setLoadingReminder(true);
    try {
      const newState = await scholarshipRemindersService.toggleReminder(scholarshipId, hasReminder);
      setHasReminder(newState);
      toast.success(newState ? "Reminder set!" : "Reminder removed");
    } catch (err) {
      toast.error("Failed to update reminder");
    } finally {
      setLoadingReminder(false);
    }
  };

  const getDeadlineInfo = (deadline: string | null) => {
    if (!deadline) return { text: "Check source for deadline", variant: "outline" as const, urgent: false };
    
    const daysLeft = differenceInDays(new Date(deadline), new Date());
    
    if (daysLeft < 0) {
      return { text: "Deadline passed", variant: "destructive" as const, urgent: false };
    } else if (daysLeft <= 3) {
      return { text: `🔥 Only ${daysLeft} days left!`, variant: "destructive" as const, urgent: true };
    } else if (daysLeft <= 7) {
      return { text: `⏰ ${daysLeft} days remaining`, variant: "secondary" as const, urgent: true };
    }
    return { text: format(new Date(deadline), "dd MMMM yyyy"), variant: "outline" as const, urgent: false };
  };

  // Not found state
  if (!isLoading && !scholarship) {
    return (
      <>
        <Helmet>
          <title>Scholarship Not Found | UniVoid</title>
        </Helmet>
        <div className="min-h-screen bg-background pb-20 md:pb-0">
          <div className="container mx-auto px-4 py-16 text-center">
            <AlertCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold mb-2">Scholarship Not Found</h1>
            <p className="text-muted-foreground mb-6">
              This scholarship may have been removed or the link is invalid.
            </p>
            <Button onClick={() => navigate("/scholarships")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Browse All Scholarships
            </Button>
          </div>
        </div>
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      </>
    );
  }

  const deadlineInfo = scholarship ? getDeadlineInfo(scholarship.deadline) : null;

  return (
    <>
      <Helmet>
        <title>{scholarship?.title || "Scholarship Details"} | UniVoid</title>
        <meta name="description" content={scholarship?.description || "View scholarship details and apply"} />
      </Helmet>

      <div className="min-h-screen bg-background pb-20 md:pb-0">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <PageBreadcrumb 
            items={[
              { label: "Scholarships", href: "/scholarships" },
              { label: scholarship?.title || "Loading..." }
            ]} 
          />

          {isLoading ? (
            <Card>
              <CardContent className="p-6 space-y-4">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-32 w-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-10 w-32" />
                  <Skeleton className="h-10 w-32" />
                </div>
              </CardContent>
            </Card>
          ) : scholarship ? (
            <div className="space-y-6">
              {/* Main Card */}
              <Card>
                <CardContent className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <h1 className="text-2xl md:text-3xl font-bold mb-2">{scholarship.title}</h1>
                      <p className="text-muted-foreground">
                        Source: {scholarship.source_name}
                        {scholarship.source_domain && ` (${scholarship.source_domain})`}
                      </p>
                    </div>
                    {scholarship.official_source && (
                      <Badge variant="secondary" className="bg-green-500/20 text-green-700 shrink-0">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>

                  {/* Description */}
                  <div className="prose prose-sm dark:prose-invert max-w-none mb-6">
                    <p className="text-foreground/80 leading-relaxed">
                      {scholarship.description || "No detailed description available. Please visit the official source for complete information."}
                    </p>
                  </div>

                  {/* Info Grid */}
                  <div className="grid gap-4 md:grid-cols-2 mb-6">
                    {/* Eligibility - States */}
                    <div className="bg-muted/50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold">Eligible States</h3>
                      </div>
                      <p className="text-sm">
                        {scholarship.is_all_india 
                          ? "All India (Open to students from any state)"
                          : scholarship.eligible_states?.length > 0
                            ? scholarship.eligible_states.join(", ")
                            : "Check source for eligibility"}
                      </p>
                    </div>

                    {/* Eligibility - Courses */}
                    <div className="bg-muted/50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <GraduationCap className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold">Eligible Courses</h3>
                      </div>
                      <p className="text-sm">
                        {scholarship.eligible_courses?.length > 0
                          ? scholarship.eligible_courses.join(", ")
                          : "Check source for eligible courses"}
                      </p>
                    </div>

                    {/* Categories */}
                    {scholarship.eligible_categories?.length > 0 && (
                      <div className="bg-muted/50 rounded-lg p-4">
                        <h3 className="font-semibold mb-2">Eligible Categories</h3>
                        <p className="text-sm">{scholarship.eligible_categories.join(", ")}</p>
                      </div>
                    )}

                    {/* Deadline */}
                    <div className="bg-muted/50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold">Deadline</h3>
                      </div>
                      <Badge variant={deadlineInfo?.variant} className={deadlineInfo?.urgent ? "animate-pulse" : ""}>
                        {deadlineInfo?.text}
                      </Badge>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3">
                    {scholarship.application_link ? (
                      <Button asChild size="lg">
                        <a href={scholarship.application_link} target="_blank" rel="noopener noreferrer">
                          Apply Now <ExternalLink className="h-4 w-4 ml-2" />
                        </a>
                      </Button>
                    ) : scholarship.source_url ? (
                      <Button asChild size="lg">
                        <a href={scholarship.source_url} target="_blank" rel="noopener noreferrer">
                          View Official Source <ExternalLink className="h-4 w-4 ml-2" />
                        </a>
                      </Button>
                    ) : (
                      <Button variant="outline" size="lg" disabled>
                        No Link Available
                      </Button>
                    )}

                    <Button 
                      variant={hasReminder ? "secondary" : "outline"} 
                      size="lg"
                      onClick={handleToggleReminder}
                      disabled={loadingReminder}
                    >
                      {loadingReminder ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : hasReminder ? (
                        <BellOff className="h-4 w-4 mr-2" />
                      ) : (
                        <Bell className="h-4 w-4 mr-2" />
                      )}
                      {hasReminder ? "Remove Reminder" : "Set Deadline Reminder"}
                    </Button>
                  </div>

                  {hasReminder && (
                    <p className="text-sm text-muted-foreground mt-3">
                      🔔 You'll be notified 7 days before the deadline
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Important Notice */}
              <Card className="border-amber-500/30 bg-amber-500/5">
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-amber-700 dark:text-amber-500">Important</h3>
                      <p className="text-sm text-muted-foreground">
                        Always verify scholarship details on the official source before applying. 
                        UniVoid aggregates information but cannot guarantee accuracy of third-party content.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : null}
        </div>
      </div>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      <BottomNav />
    </>
  );
}