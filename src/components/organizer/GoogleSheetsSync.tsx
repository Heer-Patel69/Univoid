import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { syncToGoogleSheets, extractSpreadsheetId, isValidSpreadsheetUrl } from "@/services/googleSheetsService";
import { FileSpreadsheet, RefreshCw, CheckCircle, ExternalLink, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface GoogleSheetsSyncProps {
  eventId: string;
  eventTitle: string;
}

export function GoogleSheetsSync({ eventId, eventTitle }: GoogleSheetsSyncProps) {
  const { toast } = useToast();
  const [spreadsheetUrl, setSpreadsheetUrl] = useState("");
  const [sheetName, setSheetName] = useState("Registrations");
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const syncMutation = useMutation({
    mutationFn: async () => {
      if (!isValidSpreadsheetUrl(spreadsheetUrl)) {
        throw new Error("Invalid Google Sheets URL");
      }
      const spreadsheetId = extractSpreadsheetId(spreadsheetUrl);
      if (!spreadsheetId) {
        throw new Error("Could not extract spreadsheet ID from URL");
      }
      return syncToGoogleSheets(eventId, spreadsheetId, sheetName);
    },
    onSuccess: (data) => {
      setLastSync(new Date());
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

  return (
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
            <li>Click "Sync Now" to export registrations</li>
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
  );
}
