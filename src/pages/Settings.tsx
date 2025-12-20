import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Bell, 
  Shield, 
  User, 
  Trash2, 
  Eye, 
  EyeOff,
  Loader2,
  AlertTriangle
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationPreferences } from "@/components/dashboard/NotificationPreferences";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const Settings = () => {
  const navigate = useNavigate();
  const { user, profile, isLoading, signOut } = useAuth();
  const [privacySettings, setPrivacySettings] = useState({
    showProfile: true,
    showOnLeaderboard: true,
    showActivityStatus: false,
  });
  const [isDeleting, setIsDeleting] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    navigate("/");
    return null;
  }

  const handlePrivacyChange = (key: keyof typeof privacySettings, value: boolean) => {
    setPrivacySettings(prev => ({ ...prev, [key]: value }));
    toast.success("Privacy settings updated");
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      // Mark profile as disabled instead of actual deletion
      const { error } = await supabase
        .from('profiles')
        .update({ is_disabled: true })
        .eq('id', user.id);

      if (error) throw error;

      toast.success("Account disabled. Contact support to restore.");
      await signOut();
      navigate("/");
    } catch (error: any) {
      console.error("Delete account error:", error);
      toast.error("Failed to delete account");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header onAuthClick={() => {}} />

      <main className="flex-1 py-8">
        <div className="container-wide max-w-3xl">
          <Button variant="ghost" size="sm" className="mb-6" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Dashboard
          </Button>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground">Settings</h1>
            <p className="text-muted-foreground mt-1">
              Manage your account preferences and privacy
            </p>
          </div>

          <Tabs defaultValue="notifications" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 h-auto p-1">
              <TabsTrigger value="notifications" className="flex items-center gap-2 py-3">
                <Bell className="w-4 h-4" />
                <span className="hidden sm:inline">Notifications</span>
              </TabsTrigger>
              <TabsTrigger value="privacy" className="flex items-center gap-2 py-3">
                <Shield className="w-4 h-4" />
                <span className="hidden sm:inline">Privacy</span>
              </TabsTrigger>
              <TabsTrigger value="account" className="flex items-center gap-2 py-3">
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Account</span>
              </TabsTrigger>
            </TabsList>

            {/* Notifications Tab */}
            <TabsContent value="notifications" className="space-y-6">
              <NotificationPreferences />
            </TabsContent>

            {/* Privacy Tab */}
            <TabsContent value="privacy" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Privacy Settings
                  </CardTitle>
                  <CardDescription>
                    Control who can see your information and activity
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-muted/50">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-md bg-primary/10 text-primary">
                        <Eye className="h-4 w-4" />
                      </div>
                      <div className="space-y-0.5">
                        <Label className="font-medium">Public Profile</Label>
                        <p className="text-sm text-muted-foreground">
                          Allow others to view your profile page
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={privacySettings.showProfile}
                      onCheckedChange={(checked) => handlePrivacyChange('showProfile', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-muted/50">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-md bg-primary/10 text-primary">
                        <User className="h-4 w-4" />
                      </div>
                      <div className="space-y-0.5">
                        <Label className="font-medium">Show on Leaderboard</Label>
                        <p className="text-sm text-muted-foreground">
                          Display your name on the public leaderboard
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={privacySettings.showOnLeaderboard}
                      onCheckedChange={(checked) => handlePrivacyChange('showOnLeaderboard', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-muted/50">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-md bg-primary/10 text-primary">
                        <EyeOff className="h-4 w-4" />
                      </div>
                      <div className="space-y-0.5">
                        <Label className="font-medium">Activity Status</Label>
                        <p className="text-sm text-muted-foreground">
                          Show when you're online to other users
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={privacySettings.showActivityStatus}
                      onCheckedChange={(checked) => handlePrivacyChange('showActivityStatus', checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Account Tab */}
            <TabsContent value="account" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Account Information
                  </CardTitle>
                  <CardDescription>
                    Your account details and management options
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Email Address</Label>
                      <Input value={user.email || ''} disabled className="bg-muted" />
                      <p className="text-xs text-muted-foreground">
                        Email cannot be changed. Contact support for assistance.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Full Name</Label>
                      <div className="flex gap-2">
                        <Input value={profile?.full_name || ''} disabled className="bg-muted" />
                        <Button variant="outline" onClick={() => navigate('/edit-profile')}>
                          Edit
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Member Since</Label>
                      <Input 
                        value={profile?.created_at 
                          ? new Date(profile.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })
                          : 'Unknown'
                        } 
                        disabled 
                        className="bg-muted" 
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Danger Zone */}
              <Card className="border-destructive/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-5 w-5" />
                    Danger Zone
                  </CardTitle>
                  <CardDescription>
                    Irreversible actions. Please proceed with caution.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between gap-4 p-4 rounded-lg border border-destructive/30 bg-destructive/5">
                    <div>
                      <p className="font-medium text-destructive">Delete Account</p>
                      <p className="text-sm text-muted-foreground">
                        Permanently disable your account and remove your data
                      </p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. Your account will be permanently disabled
                            and you will lose access to all your data, materials, and event registrations.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDeleteAccount}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={isDeleting}
                          >
                            {isDeleting ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4 mr-2" />
                            )}
                            Delete Account
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Settings;