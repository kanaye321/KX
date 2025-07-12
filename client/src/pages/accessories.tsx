import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Filter, Pencil, Trash2, Eye, FileDownIcon, UploadIcon, FileIcon, AlertTriangleIcon, CheckCircleIcon, XCircleIcon } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { downloadCSV } from "@/lib/utils";

import { AccessoryStatus } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

const accessorySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  category: z.string().min(1, "Category is required"),
  status: z.string().min(1, "Status is required"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  purchaseDate: z.string().optional(),
  purchaseCost: z.string().optional(),
  location: z.string().optional(),
  knoxId: z.string().optional(),
  notes: z.string().optional(),
  releasedBy: z.string().optional(),
  returnedTo: z.string().optional(),
  dateReleased: z.string().optional(),
  dateReturned: z.string().optional(),
});

type AccessoryFormValues = z.infer<typeof accessorySchema>;

type Accessory = {
  id: number;
  name: string;
  category: string;
  quantity: number; // Server returns this as a number
  serialNumber?: string; // Match schema.ts
  model?: string; // Match schema.ts
  manufacturer?: string;
  purchaseDate?: string;
  purchaseCost?: string;
  location?: string; // Match schema.ts
  notes?: string;
  assignedTo?: number; // Match schema.ts
  knoxId?: string; // Added KnoxID field
  status?: string;
  releasedBy?: string;
  returnedTo?: string;
  dateReleased?: string;
  dateReturned?: string;
};

export default function Accessories() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [viewAccessory, setViewAccessory] = useState<Accessory | null>(null);
  const [editAccessory, setEditAccessory] = useState<Accessory | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState<{
    total: number;
    successful: number;
    failed: number;
    errors: string[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();

  const form = useForm<AccessoryFormValues>({
    resolver: zodResolver(accessorySchema),
    defaultValues: {
      name: "",
      category: "",
      status: "available",
      quantity: 1,
      manufacturer: "",
      model: "",
      serialNumber: "",
      purchaseDate: "",
      purchaseCost: "",
      location: "",
      knoxId: "",
      notes: "",
      releasedBy: "",
      returnedTo: "",
      dateReleased: "",
      dateReturned: "",
    },
  });

  // Fetch accessories
  const { data: accessories = [], isLoading } = useQuery({
    queryKey: ['/api/accessories'],
    queryFn: async () => {
      const res = await fetch('/api/accessories');
      if (!res.ok) {
        throw new Error('Failed to fetch accessories');
      }
      return res.json();
    }
  });

  // Filter accessories based on search query
  const filteredAccessories = accessories.filter(accessory => 
    accessory.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    accessory.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (accessory.manufacturer && accessory.manufacturer.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Add accessory mutation
  const addAccessoryMutation = useMutation({
    mutationFn: async (data: AccessoryFormValues) => {
      return apiRequest('POST', '/api/accessories', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/accessories'] });
      setIsAddDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Accessory added successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add accessory",
        variant: "destructive",
      });
    },
  });

  // Edit accessory mutation
  const editAccessoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: AccessoryFormValues }) => {
      return apiRequest('PATCH', `/api/accessories/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/accessories'] });
      setIsEditDialogOpen(false);
      setEditAccessory(null);
      toast({
        title: "Success",
        description: "Accessory updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update accessory",
        variant: "destructive",
      });
    },
  });

  // Delete accessory mutation
  const deleteAccessoryMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/accessories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/accessories'] });
      toast({
        title: "Success",
        description: "Accessory deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete accessory",
        variant: "destructive",
      });
    },
  });

  // Import accessories mutation
  const importAccessoriesMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/accessories/import', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Import failed');
      }
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/accessories'] });
      setImportResults({
        total: data.length,
        successful: data.length,
        failed: 0,
        errors: []
      });
      setIsImporting(false);
      setImportProgress(100);
      toast({
        title: "Import successful",
        description: `${data.length} accessories imported successfully`,
      });
    },
    onError: (error) => {
      setIsImporting(false);
      setImportResults({
        total: 0,
        successful: 0,
        failed: 1,
        errors: [error.message]
      });
      toast({
        title: "Import failed",
        description: error.message || "Failed to import accessories",
        variant: "destructive",
      });
    }
  });

  // Export function
  const handleExport = () => {
    if (accessories && accessories.length > 0) {
      const exportData = accessories.map((accessory: any) => ({
        'Name': accessory.name,
        'Category': accessory.category,
        'Status': accessory.status,
        'Quantity': accessory.quantity,
        'Manufacturer': accessory.manufacturer || '',
        'Model': accessory.model || '',
        'Serial Number': accessory.serialNumber || '',
        'Purchase Date': accessory.purchaseDate || '',
        'Purchase Cost': accessory.purchaseCost || '',
        'Location': accessory.location || '',
        'Knox ID': accessory.knoxId || '',
        'Notes': accessory.notes || '',
        'Released By': accessory.releasedBy || '',
        'Returned To': accessory.returnedTo || '',
        'Date Released': accessory.dateReleased || '',
        'Date Returned': accessory.dateReturned || ''
      }));

      downloadCSV(exportData, 'accessories-export.csv');
      toast({
        title: "Export successful",
        description: "Accessories data has been exported to CSV",
      });
    } else {
      toast({
        title: "Export failed",
        description: "No data to export",
        variant: "destructive",
      });
    }
  };

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv') && !file.name.endsWith('.xlsx')) {
      toast({
        title: "Invalid file format",
        description: "Please upload a CSV or Excel file",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setIsImporting(true);
    setImportProgress(0);
    setImportResults(null);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setImportProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 100);

    importAccessoriesMutation.mutate(formData);
  };

  const onSubmit = (data: AccessoryFormValues) => {
    addAccessoryMutation.mutate(data);
  };

  const handleEditSubmit = (data: AccessoryFormValues) => {
    if (editAccessory) {
      editAccessoryMutation.mutate({ id: editAccessory.id, data });
    }
  };

  const handleDeleteClick = (id: number) => {
    if (window.confirm("Are you sure you want to delete this accessory?")) {
      deleteAccessoryMutation.mutate(id);
    }
  };

  const handleEditClick = (accessory: Accessory) => {
    setEditAccessory(accessory);
    form.reset({
      name: accessory.name,
      category: accessory.category,
      status: accessory.status || "available",
      quantity: accessory.quantity,
      manufacturer: accessory.manufacturer || "",
      model: accessory.model || "",
      serialNumber: accessory.serialNumber || "",
      purchaseDate: accessory.purchaseDate || "",
      purchaseCost: accessory.purchaseCost || "",
      location: accessory.location || "",
      knoxId: accessory.knoxId || "",
      notes: accessory.notes || "",
      releasedBy: accessory.releasedBy || "",
      returnedTo: accessory.returnedTo || "",
      dateReleased: accessory.dateReleased || "",
      dateReturned: accessory.dateReturned || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleViewClick = (accessory: Accessory) => {
    setViewAccessory(accessory);
    setIsViewDialogOpen(true);
  };

  const accessoryCategories = [
    "Cable",
    "Charger",
    "Docking Station",
    "Headphones",
    "Keyboard",
    "Mouse",
    "Power Adapter",
    "Printer",
    "Scanner",
    "Webcam",
    "Other"
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Accessories</h1>
          <p className="text-muted-foreground">
            Manage your accessories inventory
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleExport}>
            <FileDownIcon className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
            <UploadIcon className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Accessory
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search accessories..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Accessories Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-24 text-center text-muted-foreground">
              Loading...
            </div>
          ) : accessories.length === 0 ? (
            <div className="py-24 text-center text-muted-foreground">
              No accessories found. Add one to get started.
            </div>
          ) : (
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAccessories.map((accessory) => (
                    <TableRow key={accessory.id}>
                      <TableCell className="font-medium">{accessory.name}</TableCell>
                      <TableCell>{accessory.category}</TableCell>
                      <TableCell>{accessory.quantity}</TableCell>
                      <TableCell>
                        {accessory.status && (
                          <Badge
                            variant={
                              accessory.status === AccessoryStatus.AVAILABLE ? "outline" :
                              accessory.status === AccessoryStatus.BORROWED ? "secondary" :
                              accessory.status === AccessoryStatus.RETURNED ? "default" :
                              "destructive"
                            }
                          >
                            {accessory.status}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{accessory.location || "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewClick(accessory)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditClick(accessory)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(accessory.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Accessory Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="w-[95%] max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Accessory Details</DialogTitle>
          </DialogHeader>

          {viewAccessory && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Name</Label>
                  <p className="font-medium">{viewAccessory.name}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Category</Label>
                  <p className="font-medium">{viewAccessory.category}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Status</Label>
                  <div className="mt-1">
                    <Badge
                      variant={
                        viewAccessory.status === AccessoryStatus.AVAILABLE ? "outline" :
                        viewAccessory.status === AccessoryStatus.BORROWED ? "secondary" :
                        viewAccessory.status === AccessoryStatus.RETURNED ? "default" :
                        "destructive"
                      }
                    >
                      {viewAccessory.status || "Unknown"}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Quantity</Label>
                  <p className="font-medium">{viewAccessory.quantity}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Serial Number</Label>
                  <p className="font-medium">{viewAccessory.serialNumber || "-"}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Model</Label>
                  <p className="font-medium">{viewAccessory.model || "-"}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Manufacturer</Label>
                  <p className="font-medium">{viewAccessory.manufacturer || "-"}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Location</Label>
                  <p className="font-medium">{viewAccessory.location || "-"}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Purchase Date</Label>
                  <p className="font-medium">{viewAccessory.purchaseDate || "-"}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Purchase Cost</Label>
                  <p className="font-medium">{viewAccessory.purchaseCost || "-"}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Knox ID</Label>
                  <p className="font-medium">{viewAccessory.knoxId || "-"}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Assigned To</Label>
                  <p className="font-medium">{viewAccessory.assignedTo || "-"}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Released By</Label>
                  <p className="font-medium">{viewAccessory.releasedBy || "-"}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Date Released</Label>
                  <p className="font-medium">{viewAccessory.dateReleased || "-"}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Returned To</Label>
                  <p className="font-medium">{viewAccessory.returnedTo || "-"}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Date Returned</Label>
                  <p className="font-medium">{viewAccessory.dateReturned || "-"}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-sm text-muted-foreground">Notes</Label>
                <p className="font-medium whitespace-pre-wrap">{viewAccessory.notes || "-"}</p>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>Close</Button>
                <Button onClick={() => {
                  setIsViewDialogOpen(false);
                  handleEditClick(viewAccessory);
                }}>
                  Edit
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add/Edit Accessory Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="w-[95%] max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Accessory</DialogTitle>
            <DialogDescription>
              Add a new accessory to your inventory
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name*</FormLabel>
                      <FormControl>
                        <Input placeholder="Logitech Mouse" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category*</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {accessoryCategories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status*</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={AccessoryStatus.AVAILABLE}>Available</SelectItem>
                          <SelectItem value={AccessoryStatus.BORROWED}>Borrowed</SelectItem>
                          <SelectItem value={AccessoryStatus.RETURNED}>Returned</SelectItem>
                          <SelectItem value={AccessoryStatus.DEFECTIVE}>Defective</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity*</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={1} 
                          {...field} 
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="serialNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Serial Number</FormLabel>
                      <FormControl>
                        <Input placeholder="SN12345" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="model"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Model</FormLabel>
                      <FormControl>
                        <Input placeholder="MX Master 3" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="manufacturer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Manufacturer</FormLabel>
                      <FormControl>
                        <Input placeholder="Logitech" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="Storage Room A" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="purchaseDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Purchase Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="purchaseCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Purchase Cost</FormLabel>
                      <FormControl>
                        <Input placeholder="99.99" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="knoxId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Knox ID</FormLabel>
                      <FormControl>
                        <Input placeholder="NP750-12345" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="releasedBy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Released By</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Name of person who released the accessory" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="dateReleased"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date Released</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field} 
                          placeholder="YYYY-MM-DD" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="returnedTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Returned To</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Name of person receiving the return" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="dateReturned"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date Returned</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field} 
                          placeholder="YYYY-MM-DD" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any additional information about this accessory"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={addAccessoryMutation.isPending}>
                  {addAccessoryMutation.isPending ? "Adding..." : "Add Accessory"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Accessory Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="w-[95%] max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Accessory</DialogTitle>
            <DialogDescription>
              Update the details of this accessory
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleEditSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name*</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category*</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {accessoryCategories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status*</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={AccessoryStatus.AVAILABLE}>Available</SelectItem>
                          <SelectItem value={AccessoryStatus.BORROWED}>Borrowed</SelectItem>
                          <SelectItem value={AccessoryStatus.RETURNED}>Returned</SelectItem>
                          <SelectItem value={AccessoryStatus.DEFECTIVE}>Defective</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity*</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={1} 
                          {...field} 
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="serialNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Serial Number</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="model"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Model</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="manufacturer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Manufacturer</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="purchaseDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Purchase Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="purchaseCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Purchase Cost</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="knoxId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Knox ID</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="releasedBy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Released By</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Name of person who released the accessory" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="dateReleased"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date Released</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field} 
                          placeholder="YYYY-MM-DD" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="returnedTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Returned To</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Name of person receiving the return" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="dateReturned"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date Returned</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field} 
                          placeholder="YYYY-MM-DD" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={editAccessoryMutation.isPending}>
                  {editAccessoryMutation.isPending ? "Updating..." : "Update Accessory"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <UploadIcon className="h-5 w-5 mr-2" />
              Import Accessories
            </DialogTitle>
            <DialogDescription>
              Upload a CSV or Excel file to import accessories in bulk. 
              <br />
              <strong>Required columns:</strong> Name, Category, Status, Quantity
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload">Upload File</TabsTrigger>
              <TabsTrigger value="template">Download Template</TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-4">
              <div className="space-y-4">
                {!importResults ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                    <div className="text-center">
                      <FileIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="mt-4">
                        <label htmlFor="file-upload" className="cursor-pointer">
                          <span className="mt-2 block text-sm font-medium text-gray-900">
                            Drop files here or click to browse
                          </span>
                          <span className="mt-1 block text-xs text-gray-500">
                            CSV or Excel files only
                          </span>
                        </label>
                        <input
                          ref={fileInputRef}
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          className="sr-only"
                          accept=".csv,.xlsx,.xls"
                          onChange={handleFileUpload}
                        />
                      </div>
                      <div className="mt-6">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <UploadIcon className="mr-2 h-4 w-4" />
                          Select File
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : null}

                {isImporting && (
                  <div className="space-y-2">
                    <Progress value={importProgress} className="h-2" />
                    <p className="text-sm text-muted-foreground text-center">
                      Importing accessories... {importProgress}% complete
                    </p>
                  </div>
                )}

                {importResults && (
                  <div className="space-y-4">
                    <Alert variant={importResults.failed === 0 ? "default" : "destructive"}>
                      <div className="flex items-center">
                        {importResults.failed === 0 ? (
                          <CheckCircleIcon className="h-4 w-4" />
                        ) : (
                          <AlertTriangleIcon className="h-4 w-4" />
                        )}
                        <div className="ml-2">
                          <AlertTitle>
                            Import {importResults.failed === 0 ? "Completed" : "Completed with Errors"}
                          </AlertTitle>
                          <AlertDescription className="mt-2">
                            <p>Total records processed: {importResults.total}</p>
                            <p>Successfully imported: {importResults.successful}</p>
                            <p>Failed to import: {importResults.failed}</p>
                          </AlertDescription>
                        </div>
                      </div>
                    </Alert>

                    {importResults.errors.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Import Errors:</h4>
                        <div className="max-h-32 overflow-y-auto text-sm text-red-600 space-y-1">
                          {importResults.errors.map((error, index) => (
                            <p key={index}>• {error}</p>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsImportDialogOpen(false);
                          setImportResults(null);
                          setImportProgress(0);
                          if (fileInputRef.current) {
                            fileInputRef.current.value = '';
                          }
                        }}
                      >
                        Close
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="template" className="space-y-4">
              <div className="text-center space-y-4">
                <div className="p-4 border rounded-lg bg-gray-50">
                  <h4 className="font-medium mb-2">Import Template</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Download this template and fill it with your accessory data. The columns match the required fields for importing accessories.
                  </p>
                  <Button
                    onClick={() => {
                      const templateData = [{
                        'Name': 'Sample Accessory',
                        'Category': 'Cable',
                        'Status': 'available',
                        'Quantity': '1',
                        'Manufacturer': 'Sample Manufacturer',
                        'Model': 'Sample Model',
                        'Serial Number': 'SN123456',
                        'Purchase Date': '2024-01-01',
                        'Purchase Cost': '29.99',
                        'Location': 'Storage Room A',
                        'Knox ID': '',
                        'Notes': 'Sample notes',
                        'Released By': '',
                        'Returned To': '',
                        'Date Released': '',
                        'Date Returned': ''
                      }];
                      downloadCSV(templateData, 'accessory-import-template.csv');
                      toast({
                        title: "Template downloaded",
                        description: "Accessory import template has been downloaded successfully."
                      });
                    }}
                  >
                    <FileDownIcon className="mr-2 h-4 w-4" />
                    Download Template
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}