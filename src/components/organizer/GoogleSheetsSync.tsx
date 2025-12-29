import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { syncToGoogleSheets, extractSpreadsheetId, isValidSpreadsheetUrl } from "@/services/googleSheetsService";
import { FileSpreadsheet, RefreshCw, CheckCircle, ExternalLink, AlertCircle, Download } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";

interface GoogleSheetsSyncProps {
  eventId: string;
  eventTitle: string;
}

interface FormField {
  id: string;
  label: string;
  field_type: string;
  field_order: number;
}

interface RegistrationData {
  registration_id: string;
  created_at: string;
  payment_status: string;
  custom_data: Record<string, unknown> | null;
  full_name: string | null;
  email: string | null;
  mobile_number: string | null;
  college_name: string | null;
}

export function GoogleSheetsSync({ eventId, eventTitle }: GoogleSheetsSyncProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [spreadsheetUrl, setSpreadsheetUrl] = useState("");
  const [sheetName, setSheetName] = useState("Registrations");
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [autoSync, setAutoSync] = useState(false);

  // Load existing config
  const { data: config } = useQuery({
    queryKey: ["sheets-config", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_sheets_config")
        .select("*")
        .eq("event_id", eventId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch form fields for dynamic columns
  const { data: formFields } = useQuery({
    queryKey: ["form-fields", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_form_fields")
        .select("id, label, field_type, field_order")
        .eq("event_id", eventId)
        .order("field_order", { ascending: true });
      
      if (error) throw error;
      return data as FormField[];
    },
  });

  // Load config into state when fetched
  useEffect(() => {
    if (config) {
      setSpreadsheetUrl(`https://docs.google.com/spreadsheets/d/${config.spreadsheet_id}`);
      setSheetName(config.sheet_name);
      setAutoSync(config.auto_sync);
      if (config.last_sync_at) {
        setLastSync(new Date(config.last_sync_at));
      }
    }
  }, [config]);

  // Fetch registrations for CSV export using the RPC
  const { data: registrations } = useQuery({
    queryKey: ["registrations-export", eventId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_event_registrations_with_profiles", {
        p_event_id: eventId,
      });
      
      if (error) throw error;
      return data as RegistrationData[];
    },
  });

  // Save config mutation
  const saveConfigMutation = useMutation({
    mutationFn: async ({ spreadsheetId, sheetName, autoSync }: { spreadsheetId: string; sheetName: string; autoSync: boolean }) => {
      const { error } = await supabase
        .from("event_sheets_config")
        .upsert({
          event_id: eventId,
          spreadsheet_id: spreadsheetId,
          sheet_name: sheetName,
          auto_sync: autoSync,
        }, { onConflict: "event_id" });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sheets-config", eventId] });
      toast({
        title: "Settings Saved",
        description: autoSync ? "Auto-sync is now enabled" : "Settings updated",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      if (!isValidSpreadsheetUrl(spreadsheetUrl)) {
        throw new Error("Invalid Google Sheets URL");
      }
      const spreadsheetId = extractSpreadsheetId(spreadsheetUrl);
      if (!spreadsheetId) {
        throw new Error("Could not extract spreadsheet ID from URL");
      }
      
      // Save config first
      await saveConfigMutation.mutateAsync({ spreadsheetId, sheetName, autoSync });
      
      // Then sync
      return syncToGoogleSheets(eventId, spreadsheetId, sheetName);
    },
    onSuccess: (data) => {
      setLastSync(new Date());
      // Update last_sync_at in database
      const spreadsheetId = extractSpreadsheetId(spreadsheetUrl);
      if (spreadsheetId) {
        supabase
          .from("event_sheets_config")
          .update({ last_sync_at: new Date().toISOString() })
          .eq("event_id", eventId)
          .then();
      }
      toast({
        title: "Sync Complete!",
        description: data.message,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Sync Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAutoSyncToggle = async (enabled: boolean) => {
    setAutoSync(enabled);
    
    if (!spreadsheetUrl || !isValidSpreadsheetUrl(spreadsheetUrl)) {
      if (enabled) {
        toast({
          title: "Enter Sheet URL First",
          description: "Please enter a valid Google Sheets URL before enabling auto-sync",
          variant: "destructive",
        });
        setAutoSync(false);
        return;
      }
    }
    
    const spreadsheetId = extractSpreadsheetId(spreadsheetUrl);
    if (spreadsheetId) {
      await saveConfigMutation.mutateAsync({ spreadsheetId, sheetName, autoSync: enabled });
    }
  };

  const downloadCSV = () => {
    if (!registrations || registrations.length === 0) {
      toast({
        title: "No Data",
        description: "No registrations to export",
        variant: "destructive",
      });
      return;
    }

    // Build dynamic headers: fixed columns + form field labels
    const fixedHeaders = ["Timestamp", "Registration ID", "Full Name", "Email", "Mobile", "College", "Payment Status", "Club Member", "Club Name", "Club ID"];
    const dynamicHeaders = (formFields || []).map(f => f.label);
    const headers = [...fixedHeaders, ...dynamicHeaders];
    
    const rows = registrations.map((reg) => {
      const customData = reg.custom_data || {};
      
      // Fixed columns
      const fixedCols = [
        new Date(reg.created_at).toLocaleString(),
        reg.registration_id,
        reg.full_name || "",
        reg.email || "",
        reg.mobile_number || "",
        reg.college_name || "",
        reg.payment_status,
        customData._club_id ? "Yes" : "No",
        String(customData._club_name || ""),
        String(customData._club_membership_id || customData._membership_id || ""),
      ];
      
      // Dynamic form field columns
      const dynamicCols = (formFields || []).map(field => {
        const value = customData[field.id] || customData[field.label] || customData[field.label.toLowerCase()] || "";
        if (Array.isArray(value)) return value.join(", ");
        if (typeof value === "object") return JSON.stringify(value);
        return String(value);
      });
      
      return [...fixedCols, ...dynamicCols];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${eventTitle.replace(/[^a-z0-9]/gi, "_")}_registrations.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "CSV Downloaded",
      description: `Exported ${registrations.length} registrations with ${headers.length} columns`,
    });
  };

  return (
    <div className="space-y-4">
      {/* CSV Download Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Download className="w-5 h-5 text-blue-600" />
            CSV Export
          </CardTitle>
          <CardDescription>
            Download registrations as a CSV file
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={downloadCSV} variant="outline" className="w-full gap-2">
            <Download className="w-4 h-4" />
            Download CSV ({registrations?.length || 0} registrations)
          </Button>
        </CardContent>
      </Card>

      {/* Google Sheets Sync Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileSpreadsheet className="w-5 h-5 text-green-600" />
            Google Sheets Sync
          </CardTitle>
          <CardDescription>
            Export registrations to Google Sheets for easy management
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Make sure your Google Sheet is shared with the service account email. 
              Contact your admin for the service account email address.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="spreadsheet-url">Google Sheets URL</Label>
            <Input
              id="spreadsheet-url"
              placeholder="https://docs.google.com/spreadsheets/d/..."
              value={spreadsheetUrl}
              onChange={(e) => setSpreadsheetUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Paste the full URL of your Google Sheet
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sheet-name">Sheet Tab Name</Label>
            <Input
              id="sheet-name"
              placeholder="Registrations"
              value={sheetName}
              onChange={(e) => setSheetName(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              The name of the tab where data will be written
            </p>
          </div>

          {/* Auto-sync toggle */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="auto-sync" className="text-base">Auto-Sync</Label>
              <p className="text-xs text-muted-foreground">
                Automatically sync new registrations to Google Sheets
              </p>
            </div>
            <Switch
              id="auto-sync"
              checked={autoSync}
              onCheckedChange={handleAutoSyncToggle}
              disabled={saveConfigMutation.isPending}
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="text-xs text-muted-foreground">
              {lastSync && (
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-green-600" />
                  Last synced: {lastSync.toLocaleTimeString()}
                </span>
              )}
            </div>
            <Button
              onClick={() => syncMutation.mutate()}
              disabled={!spreadsheetUrl || syncMutation.isPending}
              className="gap-2"
            >
              {syncMutation.isPending ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Sync Now
            </Button>
          </div>

          <div className="pt-4 border-t">
            <h4 className="font-medium text-sm mb-2">Setup Instructions</h4>
            <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Create a new Google Sheet or open an existing one</li>
              <li>Share the sheet with the service account (ask admin for email)</li>
              <li>Copy the sheet URL and paste it above</li>
              <li>Enable auto-sync for automatic updates, or click "Sync Now"</li>
            </ol>
            <a 
              href="https://docs.google.com/spreadsheets/create" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary mt-2 hover:underline"
            >
              Create a new Google Sheet <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
