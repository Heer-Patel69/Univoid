import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, useOutletContext } from "react-router-dom";
import { Helmet } from "react-helmet";
import { Search, MapPin, GraduationCap, Calendar, ExternalLink, Sparkles, CheckCircle2, Bell, BellOff, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { BottomNav } from "@/components/layout/BottomNav";
import { useRealtimeScholarships } from "@/hooks/useRealtimeScholarships";
import { useAuth } from "@/contexts/AuthContext";
import { format, differenceInDays } from "date-fns";
import { toast } from "sonner";
import { scholarshipRemindersService } from "@/services/scholarshipRemindersService";

interface LayoutContext {
  onAuthClick?: () => void;
}

const INDIAN_STATES = [
  "All States", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Jammu and Kashmir"
];

const COURSE_LEVELS = ["All Courses", "UG", "PG", "Diploma"];

export default function Scholarships() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const context = useOutletContext<LayoutContext>();
  
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState<string>(profile?.state || "All States");
  const [courseFilter, setCourseFilter] = useState<string>("All Courses");
  const [userReminders, setUserReminders] = useState<Set<string>>(new Set());
  const [loadingReminders, setLoadingReminders] = useState<Set<string>>(new Set());

  // Fetch user's existing reminders
  useEffect(() => {
    if (user) {
      scholarshipRemindersService.getUserReminders(user.id)
        .then(ids => setUserReminders(new Set(ids)))
        .catch(console.error);
    }
  }, [user]);

  const handleToggleReminder = async (scholarshipId: string, scholarshipTitle: string) => {
    if (!user) {
      context?.onAuthClick?.();
      return;
    }

    setLoadingReminders(prev => new Set(prev).add(scholarshipId));
    
    try {
      const hasReminder = userReminders.has(scholarshipId);
      const newState = await scholarshipRemindersService.toggleReminder(scholarshipId, hasReminder);
      
      setUserReminders(prev => {
        const newSet = new Set(prev);
        if (newState) {
          newSet.add(scholarshipId);
          toast.success(`Reminder set for "${scholarshipTitle}"`, {
            description: "You'll be notified 7 days before the deadline."
          });
        } else {
          newSet.delete(scholarshipId);
          toast.success("Reminder removed");
        }
        return newSet;
      });
    } catch (error) {
      console.error("Error toggling reminder:", error);
      toast.error("Failed to update reminder");
    } finally {
      setLoadingReminders(prev => {
        const newSet = new Set(prev);
        newSet.delete(scholarshipId);
        return newSet;
      });
    }
  };

  const filters = {
    search: search || undefined,
    state: stateFilter !== "All States" ? stateFilter : undefined,
    course: courseFilter !== "All Courses" ? courseFilter : undefined,
  };

  const { scholarships, isLoading, isRealtime } = useRealtimeScholarships(filters);

  // Auto-set state from profile
  useEffect(() => {
    if (profile?.state && stateFilter === "All States") {
      setStateFilter(profile.state);
    }
  }, [profile?.state]);

  const getDeadlineBadge = (deadline: string | null) => {
    if (!deadline) {
      return <Badge variant="outline" className="text-muted-foreground">Check Source</Badge>;
    }
    
    const daysLeft = differenceInDays(new Date(deadline), new Date());
    
    if (daysLeft < 0) {
      return <Badge variant="destructive">Expired</Badge>;
    } else if (daysLeft <= 3) {
      return <Badge variant="destructive" className="animate-pulse">🔥 {daysLeft} days left!</Badge>;
    } else if (daysLeft <= 7) {
      return <Badge variant="secondary" className="bg-amber-500/20 text-amber-700">⏰ {daysLeft} days left</Badge>;
    }
    return <Badge variant="outline">{format(new Date(deadline), "dd MMM yyyy")}</Badge>;
  };

  return (
    <>
      <Helmet>
        <title>India Scholarships 2024-25 | UniVoid</title>
        <meta name="description" content="Find verified scholarships for Indian students. State-wise, course-wise personalized scholarship opportunities from government and trusted sources." />
      </Helmet>

      <div className="pb-20 md:pb-0">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <GraduationCap className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">India Scholarships</h1>
              {isRealtime && (
                <Badge variant="secondary" className="animate-pulse bg-green-500/20 text-green-700">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Live
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              Verified scholarships for Indian students. Updated in real-time.
            </p>
          </div>

          {/* Filters */}
          <div className="bg-card border rounded-lg p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search scholarships..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={stateFilter} onValueChange={setStateFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <MapPin className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Select State" />
                </SelectTrigger>
                <SelectContent>
                  {INDIAN_STATES.map(state => (
                    <SelectItem key={state} value={state}>{state}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={courseFilter} onValueChange={setCourseFilter}>
                <SelectTrigger className="w-full md:w-40">
                  <GraduationCap className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Course Level" />
                </SelectTrigger>
                <SelectContent>
                  {COURSE_LEVELS.map(level => (
                    <SelectItem key={level} value={level}>{level}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {stateFilter !== "All States" && (
              <p className="text-sm text-muted-foreground mt-3 flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Showing scholarships for <strong>{stateFilter}</strong> + All India
              </p>
            )}
          </div>

          {/* Results */}
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full mb-4" />
                    <div className="flex gap-2">
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-6 w-20" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : scholarships.length === 0 ? (
            <div className="text-center py-16">
              <GraduationCap className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No scholarships found</h3>
              <p className="text-muted-foreground">
                Try adjusting your filters or check back later for new opportunities.
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                Found {scholarships.length} scholarship{scholarships.length !== 1 ? 's' : ''}
              </p>
              
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {scholarships.map((scholarship) => (
                  <Card 
                    key={scholarship.id} 
                    className="flex flex-col hover:shadow-lg transition-shadow cursor-pointer group"
                    onClick={() => navigate(`/scholarships/${scholarship.id}`)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-lg line-clamp-2">{scholarship.title}</CardTitle>
                        {scholarship.official_source && (
                          <Badge variant="secondary" className="shrink-0 bg-green-500/20 text-green-700">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="text-xs">
                        Source: {scholarship.source_name}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="flex-1 flex flex-col">
                      <p className="text-sm text-muted-foreground line-clamp-3 mb-4 flex-1">
                        {scholarship.description || "Click to view details on the official source."}
                      </p>
                      
                      <div className="space-y-3">
                        {/* Location */}
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {scholarship.is_all_india 
                              ? "All India" 
                              : scholarship.eligible_states.slice(0, 2).join(", ") + 
                                (scholarship.eligible_states.length > 2 ? ` +${scholarship.eligible_states.length - 2}` : "")}
                          </span>
                        </div>

                        {/* Courses */}
                        {scholarship.eligible_courses.length > 0 && (
                          <div className="flex items-center gap-2 text-sm">
                            <GraduationCap className="h-4 w-4 text-muted-foreground" />
                            <span>{scholarship.eligible_courses.join(", ")}</span>
                          </div>
                        )}

                        {/* Deadline */}
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {getDeadlineBadge(scholarship.deadline)}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="mt-4 pt-4 border-t space-y-2" onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-2">
                          {scholarship.application_link ? (
                            <Button asChild className="flex-1">
                              <a href={scholarship.application_link} target="_blank" rel="noopener noreferrer">
                                Apply Now <ExternalLink className="h-4 w-4 ml-2" />
                              </a>
                            </Button>
                          ) : scholarship.source_url ? (
                            <Button variant="outline" asChild className="flex-1">
                              <a href={scholarship.source_url} target="_blank" rel="noopener noreferrer">
                                View Source <ExternalLink className="h-4 w-4 ml-2" />
                              </a>
                            </Button>
                          ) : (
                            <Button variant="secondary" className="flex-1" onClick={() => navigate(`/scholarships/${scholarship.id}`)}>
                              View Details
                            </Button>
                          )}
                          
                          {/* Reminder Button */}
                          <Button
                            variant={userReminders.has(scholarship.id) ? "secondary" : "outline"}
                            size="icon"
                            onClick={() => handleToggleReminder(scholarship.id, scholarship.title)}
                            disabled={loadingReminders.has(scholarship.id)}
                            title={userReminders.has(scholarship.id) ? "Remove reminder" : "Set deadline reminder"}
                          >
                            {loadingReminders.has(scholarship.id) ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : userReminders.has(scholarship.id) ? (
                              <BellOff className="h-4 w-4" />
                            ) : (
                              <Bell className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        
                        {userReminders.has(scholarship.id) && (
                          <p className="text-xs text-muted-foreground text-center">
                            🔔 Reminder set - 7 days before deadline
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <BottomNav />
    </>
  );
}
