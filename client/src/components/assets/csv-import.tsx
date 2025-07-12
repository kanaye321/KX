import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  UploadIcon,
  FileTextIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  XIcon,
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import {
  parseCSV,
  convertCSVToAssets,
  CSVAsset,
} from "@/lib/csv-import";
import { apiRequestWithJson, queryClient } from "@/lib/queryClient";
import {
  useToast
} from "@/hooks/use-toast";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Progress
} from "@/components/ui/progress";

export default function CSVImport() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedAssets, setParsedAssets] = useState<CSVAsset[] | null>(null);
  const [importStatus, setImportStatus] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");
  const [importProgress, setImportProgress] = useState(0);
  const [importSummary, setImportSummary] = useState<{
    total: number;
    successful: number;
    failed: number;
    errors: string[];
  } | null>(null);

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!e.target.files || e.target.files.length === 0) {
      setSelectedFile(null);
      setParsedAssets(null);
      setParseError(null);
      return;
    }

    const file = e.target.files[0];
    setSelectedFile(file);
    setParseError(null);
    setParsedAssets(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const csvContent = e.target?.result as string;
        const assets = parseCSV(csvContent);
        setParsedAssets(assets);
      } catch (error) {
        console.error("CSV parse error:", error);
        setParseError((error as Error).message);
      }
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    if (!parsedAssets) return;

    const assetsToImport = convertCSVToAssets(parsedAssets);
    if (!Array.isArray(assetsToImport) || assetsToImport.length === 0) {
      toast({
        title: "Import failed",
        description: "Assets must be an array.",
        variant: "destructive",
      });
      return;
    }

    importMutation.mutate(assetsToImport);
  };

  const importMutation = useMutation({
    mutationFn: async (assets: CSVAsset[]) => {
      setImportStatus("uploading");
      setImportProgress(0);

      const data = await apiRequestWithJson<{
        total: number;
        successful: number;
        failed: number;
        errors: string[];
      }>("POST", "/api/assets/import", { assets });

      setImportProgress(100);
      return data;
    },
    onSuccess: (data) => {
      setImportStatus("success");
      setImportSummary(data);
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });

      toast({
        title: "Import successful",
        description: `${data.successful} assets imported successfully.`,
      });
    },
    onError: (error) => {
      setImportStatus("error");
      toast({
        title: "Import failed",
        description: (error as Error).message || "Failed to import assets",
        variant: "destructive",
      });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Import Assets from CSV</CardTitle>
        <CardDescription>
          Upload a CSV file with asset data to bulk import assets.
          <br />
          Required columns: <strong>knoxId, serialNumber</strong>
          <br />
          Optional columns: assetTag, ipAddress, macAddress, osType, name, category
        </CardDescription>
      </CardHeader>
      <CardContent>
        {parseError && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{parseError}</AlertDescription>
          </Alert>
        )}

        {importSummary && (
          <Alert
            variant={importSummary.failed === 0 ? "default" : "destructive"}
            className="mb-4"
          >
            <div className="flex items-start gap-4">
              {importSummary.failed === 0 ? (
                <CheckCircleIcon className="h-5 w-5 mt-0.5 text-green-500" />
              ) : (
                <AlertTriangleIcon className="h-5 w-5 mt-0.5 text-red-500" />
              )}
              <div>
                <AlertTitle className="text-base">
                  Import {importSummary.failed === 0 ? "Completed" : "Completed with Errors"}
                </AlertTitle>
                <AlertDescription className="text-sm">
                  <p>Total records processed: {importSummary.total}</p>
                  <p>Successfully imported: {importSummary.successful}</p>
                  <p>Failed to import: {importSummary.failed}</p>
                </AlertDescription>
              </div>
            </div>
          </Alert>
        )}

        {importSummary?.errors?.length > 0 && (
          <div className="mb-4">
            <h4 className="font-medium text-sm mb-1">Error Details:</h4>
            <div className="max-h-[150px] overflow-auto border p-2 rounded text-xs bg-gray-50">
              <ul className="list-disc pl-4 space-y-1">
                {importSummary.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv"
              className="hidden"
            />
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              <UploadIcon className="mr-2 h-4 w-4" />
              Select CSV File
            </Button>
            {selectedFile && (
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded border">
                <FileTextIcon className="h-4 w-4 text-gray-500" />
                <span className="text-sm truncate max-w-[250px]">
                  {selectedFile.name}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => {
                    setSelectedFile(null);
                    setParsedAssets(null);
                    setParseError(null);
                    setImportSummary(null);
                    setImportProgress(0);
                  }}
                >
                  <XIcon className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedFile(null);
                setParsedAssets(null);
                setParseError(null);
                setImportSummary(null);
                setImportProgress(0);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={
                importStatus === "uploading" ||
                importStatus === "success" ||
                !parsedAssets
              }
            >
              {importStatus === "uploading" ? "Importing..." : "Import Assets"}
            </Button>
          </div>
        </div>

        <Progress value={importProgress} className="mt-4" />
      </CardContent>
    </Card>
  );
}
