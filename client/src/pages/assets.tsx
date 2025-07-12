import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AssetTable from "@/components/assets/asset-table";
import AssetForm from "@/components/assets/asset-form";
import { PlusIcon, SearchIcon, FileDownIcon, UploadIcon, FileIcon, AlertTriangleIcon, CheckCircleIcon, XCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { downloadCSV } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Asset, AssetCategories, AssetStatus } from "@shared/schema";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Assets() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [assetToEdit, setAssetToEdit] = useState<Asset | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState<{
    total: number;
    successful: number;
    failed: number;
    errors: string[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { data: assets, isLoading } = useQuery<Asset[]>({
    queryKey: ['/api/assets'],
  });

  const createAssetMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/assets', data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      setIsAddDialogOpen(false);
      toast({
        title: "Asset created",
        description: "The asset has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create asset",
        variant: "destructive",
      });
    }
  });
  
  const updateAssetMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiRequest('PATCH', `/api/assets/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      setAssetToEdit(null);
      toast({
        title: "Asset updated",
        description: "The asset has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update asset",
        variant: "destructive",
      });
    }
  });

  // Cleanup Knox IDs mutation
  const cleanupKnoxMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/assets/cleanup-knox');
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/assets'] });
      toast({
        title: "Knox IDs Cleaned Up",
        description: `${data.count || 0} assets were updated to remove Knox IDs from assets that are not checked out.`
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to clean up Knox IDs",
        variant: "destructive"
      });
    }
  });
  
  // Import assets mutation
  const importAssetsMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/assets/import', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Import failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/assets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      
      setImportResults({
        total: data.total || 0,
        successful: data.successful || 0,
        failed: data.failed || 0,
        errors: data.errors || []
      });
      
      setIsImporting(false);
      setImportProgress(100);
    },
    onError: (error) => {
      toast({
        title: "Import failed",
        description: error.message || "Failed to import assets",
        variant: "destructive"
      });
      setIsImporting(false);
      setImportProgress(0);
    }
  });

  const filteredAssets = assets ? assets.filter(asset => 
    asset.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    asset.assetTag.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (asset.serialNumber && asset.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()))
  ) : [];

  const handleExport = () => {
    if (assets && assets.length > 0) {
      // Transform asset data for export with the requested fields
      const exportData = assets.map(asset => ({
        id: asset.id,
        assetTag: asset.assetTag,
        name: asset.name,
        knoxId: asset.knoxId || 'N/A',  // Knox ID (assigned to)
        ipAddress: asset.ipAddress || 'N/A',
        macAddress: asset.macAddress || 'N/A',
        serialNumber: asset.serialNumber || 'N/A',
        osType: asset.osType || 'N/A',
        status: asset.status,
        category: asset.category,
        purchaseDate: asset.purchaseDate || 'N/A',
      }));
      
      downloadCSV(exportData, 'assets-export.csv');
      toast({
        title: "Export successful",
        description: "Assets data has been exported to CSV",
      });
    } else {
      toast({
        title: "Export failed",
        description: "No data to export",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">Assets</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">Manage your inventory assets</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Add Asset
          </Button>
          <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
            <UploadIcon className="mr-2 h-4 w-4" />
            Import Assets
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative max-w-md w-full">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search assets..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <FileDownIcon className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <AssetTable 
        assets={filteredAssets} 
        isLoading={isLoading}
        onEdit={(asset) => setAssetToEdit(asset)}
      />

      {/* Add Asset Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Asset</DialogTitle>
          </DialogHeader>
          <AssetForm 
            onSubmit={(data) => createAssetMutation.mutate(data)} 
            isLoading={createAssetMutation.isPending}
          />
        </DialogContent>
      </Dialog>
      
      {/* Edit Asset Dialog */}
      <Dialog open={!!assetToEdit} onOpenChange={(open) => !open && setAssetToEdit(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Asset</DialogTitle>
          </DialogHeader>
          {assetToEdit && (
            <AssetForm 
              defaultValues={assetToEdit}
              onSubmit={(data) => updateAssetMutation.mutate({ id: assetToEdit.id, data })} 
              isLoading={updateAssetMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
      
      {/* Import Assets Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsImportDialogOpen(false);
          setImportResults(null);
          setImportProgress(0);
        }
      }}>
        <DialogContent className="sm:max-w-[600px] dark:bg-gray-900 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="dark:text-gray-100">Import Assets</DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              Upload a CSV or Excel file to import assets in bulk. 
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <Tabs defaultValue="upload" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="upload">Upload File</TabsTrigger>
                <TabsTrigger value="template">Download Template</TabsTrigger>
              </TabsList>
              
              <TabsContent value="upload" className="space-y-4 pt-4">
                {!importResults ? (
                  <>
                    <div className="grid w-full max-w-sm items-center gap-1.5 mx-auto">
                      <label 
                        htmlFor="file-upload" 
                        className="cursor-pointer text-center p-8 border-2 border-dashed rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors dark:border-gray-600"
                      >
                        <FileIcon className="h-12 w-12 mx-auto mb-2 text-gray-400 dark:text-gray-500" />
                        <p className="text-sm font-medium dark:text-gray-300">
                          Click to select a CSV or Excel file
                        </p>
                        <p className="text-xs text-gray-500 mt-1 dark:text-gray-400">
                          Maximum file size: 5MB
                        </p>
                      </label>
                      <input
                        id="file-upload"
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 5 * 1024 * 1024) {
                              toast({
                                title: "File too large",
                                description: "Maximum file size is 5MB",
                                variant: "destructive",
                              });
                              return;
                            }
                            
                            const formData = new FormData();
                            formData.append('file', file);
                            
                            setIsImporting(true);
                            
                            // Simulate progress for better UX
                            let progress = 0;
                            const interval = setInterval(() => {
                              progress += 5;
                              if (progress >= 90) {
                                clearInterval(interval);
                              }
                              setImportProgress(progress);
                            }, 200);
                            
                            importAssetsMutation.mutate(formData);
                          }
                        }}
                      />
                    </div>
                    
                    {isImporting && (
                      <div className="space-y-2">
                        <Progress value={importProgress} className="h-2" />
                        <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                          Importing assets... {importProgress}% complete
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="space-y-4">
                    <Alert variant={importResults.failed === 0 ? "default" : "destructive"}>
                      <div className="flex items-start gap-4">
                        {importResults.failed === 0 ? (
                          <CheckCircleIcon className="h-5 w-5 mt-0.5 text-green-500" />
                        ) : (
                          <AlertTriangleIcon className="h-5 w-5 mt-0.5 text-red-500" />
                        )}
                        <div>
                          <AlertTitle className="text-base dark:text-gray-100">
                            Import {importResults.failed === 0 ? "Completed" : "Completed with Errors"}
                          </AlertTitle>
                          <AlertDescription className="text-sm dark:text-gray-400">
                            <p>Total records processed: {importResults.total}</p>
                            <p>Successfully imported: {importResults.successful}</p>
                            <p>Failed to import: {importResults.failed}</p>
                          </AlertDescription>
                        </div>
                      </div>
                    </Alert>
                    
                    {importResults.errors.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm dark:text-gray-300">Error Details:</h4>
                        <div className="max-h-[200px] overflow-auto rounded border dark:border-gray-700 p-2 text-xs dark:bg-gray-800">
                          <ul className="space-y-1 list-disc pl-4 dark:text-gray-400">
                            {importResults.errors.map((error, index) => (
                              <li key={index}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setImportResults(null);
                          setImportProgress(0);
                          if (fileInputRef.current) {
                            fileInputRef.current.value = '';
                          }
                        }}
                      >
                        Import Another File
                      </Button>
                      <Button onClick={() => setIsImportDialogOpen(false)}>
                        Done
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="template" className="space-y-4 pt-4">
                <div className="text-center space-y-4">
                  <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
                    <FileIcon className="h-12 w-12 mx-auto mb-2 text-blue-500" />
                    <h3 className="text-lg font-medium mb-2 dark:text-gray-100">Asset Import Template</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Download this template and fill it with your asset data. The columns match the required fields for importing assets.
                    </p>
                    <Button
                      onClick={() => {
                        // Create template with headers
                        const templateData = [
                          {
                            assetTag: "TAG001",
                            name: "MacBook Pro",
                            category: "laptop",
                            status: "available",
                            serialNumber: "C02XL0QZJGH5",
                            osType: "macOS",
                            manufacturer: "Apple",
                            model: "MacBook Pro 16-inch",
                            purchaseDate: "2023-01-15",
                            purchaseCost: "1999.00",
                            ipAddress: "192.168.1.10",
                            macAddress: "00:1B:44:11:3A:B7",
                            notes: "Assigned to marketing department",
                            knoxId: "",
                          }
                        ];
                        
                        downloadCSV(templateData, 'asset-import-template.csv');
                        
                        toast({
                          title: "Template Downloaded",
                          description: "Asset import template has been downloaded successfully."
                        });
                      }}
                    >
                      <FileDownIcon className="mr-2 h-4 w-4" />
                      Download Template
                    </Button>
                  </div>
                  
                  <div className="text-sm text-left dark:text-gray-300">
                    <h4 className="font-medium mb-2">Template Instructions:</h4>
                    <ul className="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
                      <li>The first row contains column headers and should not be modified.</li>
                      <li>The <strong>assetTag</strong> and <strong>name</strong> fields are required.</li>
                      <li><strong>category</strong> should be one of: laptop, desktop, tablet, phone, monitor, printer, server, networking, other</li>
                      <li><strong>status</strong> should be one of: available, deployed, pending, archived,assigned</li>
                      <li>The <strong>purchaseDate</strong> should be in YYYY-MM-DD format.</li>
                      <li>Save your file as .csv or .xlsx before uploading.</li>
                    </ul>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
