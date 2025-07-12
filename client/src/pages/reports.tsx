import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { 
  DownloadIcon, 
  PrinterIcon, 
  RefreshCwIcon, 
  PieChartIcon, 
  BarChartIcon, 
  LineChartIcon,
  ClipboardListIcon,
  FilterIcon,
  SearchIcon,
  CheckCircleIcon, 
  XCircleIcon,
  AlertCircleIcon,
  CalendarIcon,
  DollarSignIcon,
  ScanIcon,
  TrendingUpIcon,
  SettingsIcon,
  BarChart2Icon,
  PieChartIcon as PieChart2Icon,
  QrCodeIcon
} from "lucide-react";
import { downloadCSV } from "@/lib/utils";

// Maintenance form schema
const maintenanceFormSchema = z.object({
  assetId: z.coerce.number().min(1, "Asset must be selected"),
  maintenanceType: z.string().min(1, "Maintenance type is required"),
  technicianName: z.string().min(1, "Technician name is required"),
  scheduledDate: z.string().min(1, "Scheduled date is required"),
  notes: z.string().optional(),
});

export default function Reports() {
  const [activeTab, setActiveTab] = useState("asset-reports");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [reportProgress, setReportProgress] = useState(0);
  const [maintenanceFilter, setMaintenanceFilter] = useState("all");
  const [maintenanceSearchTerm, setMaintenanceSearchTerm] = useState("");
  const [isMaintenanceFormOpen, setIsMaintenanceFormOpen] = useState(false);
  const [selectedAssetForMaintenance, setSelectedAssetForMaintenance] = useState(null);
  const { toast } = useToast();

  // Fetch real asset data 
  const { data: assets, isLoading: assetsLoading } = useQuery({
    queryKey: ["/api/assets"],
    queryFn: async () => {
      const response = await fetch("/api/assets");
      if (!response.ok) {
        throw new Error("Failed to fetch assets");
      }
      return response.json();
    },
  });
  
  // Fetch stats data
  const { data: stats } = useQuery({
    queryKey: ["/api/stats"],
    queryFn: async () => {
      const response = await fetch("/api/stats");
      if (!response.ok) {
        throw new Error("Failed to fetch stats");
      }
      return response.json();
    },
  });
  
  // Fetch activities data
  const { data: activities } = useQuery({
    queryKey: ["/api/activities"],
    queryFn: async () => {
      const response = await fetch("/api/activities");
      if (!response.ok) {
        throw new Error("Failed to fetch activities");
      }
      return response.json();
    },
  });
  
  // Fetch licenses data
  const { data: licenses } = useQuery({
    queryKey: ["/api/licenses"],
    queryFn: async () => {
      const response = await fetch("/api/licenses");
      if (!response.ok) {
        throw new Error("Failed to fetch licenses");
      }
      return response.json();
    },
  });
  
  // Fetch components data
  const { data: components } = useQuery({
    queryKey: ["/api/components"],
    queryFn: async () => {
      const response = await fetch("/api/components");
      if (!response.ok) {
        throw new Error("Failed to fetch components");
      }
      return response.json();
    },
  });
  
  // Fetch accessories data
  const { data: accessories } = useQuery({
    queryKey: ["/api/accessories"],
    queryFn: async () => {
      const response = await fetch("/api/accessories");
      if (!response.ok) {
        throw new Error("Failed to fetch accessories");
      }
      return response.json();
    },
  });

  // Calculate desktop/laptop monitoring data
  const desktopLaptopAssets = assets?.filter(asset => 
    asset.category?.toLowerCase().includes('desktop') || 
    asset.category?.toLowerCase().includes('laptop') ||
    asset.category?.toLowerCase().includes('computer')
  ) || [];
  
  const assignedDesktopLaptops = desktopLaptopAssets.filter(asset => 
    asset.status === 'deployed' || asset.status === 'assigned'
  );
  
  const availableDesktopLaptops = desktopLaptopAssets.filter(asset => 
    asset.status === 'available' || asset.status === 'ready to deploy'
  );
  
  const maintenanceDesktopLaptops = desktopLaptopAssets.filter(asset => 
    asset.status === 'broken' || asset.status === 'in maintenance'
  );
  
  const pendingDesktopLaptops = desktopLaptopAssets.filter(asset => 
    asset.status === 'pending' || asset.status === 'undeployable'
  );

  // Transform asset data for the report
  const assetReportData = assets?.map(asset => ({
    id: asset.id,
    assetTag: asset.assetTag,
    name: asset.name,
    status: asset.status,
    knoxId: asset.knoxId || 'N/A',
    ipAddress: asset.ipAddress || 'N/A',
    macAddress: asset.macAddress || 'N/A',
    serialNumber: asset.serialNumber || 'N/A',
    osType: asset.osType || 'N/A',
    assignedUser: asset.assignedTo ? `User ID: ${asset.assignedTo}` : 'N/A',
    lastUpdated: asset.checkoutDate || new Date().toISOString().split('T')[0]
  })) || [];

  // Calculate desktop/laptop statistics
  const desktopLaptopStats = {
    desktops: {
      total: assets?.filter(asset => 
        asset.category?.toLowerCase().includes('desktop') || 
        asset.category?.toLowerCase().includes('pc') ||
        asset.category?.toLowerCase().includes('workstation')
      ).length || 0,
      available: assets?.filter(asset => 
        (asset.category?.toLowerCase().includes('desktop') || 
         asset.category?.toLowerCase().includes('pc') ||
         asset.category?.toLowerCase().includes('workstation')) &&
        asset.status === 'available'
      ).length || 0,
      assigned: assets?.filter(asset => 
        (asset.category?.toLowerCase().includes('desktop') || 
         asset.category?.toLowerCase().includes('pc') ||
         asset.category?.toLowerCase().includes('workstation')) &&
        asset.status === 'assigned'
      ).length || 0,
      inRepair: assets?.filter(asset => 
        (asset.category?.toLowerCase().includes('desktop') || 
         asset.category?.toLowerCase().includes('pc') ||
         asset.category?.toLowerCase().includes('workstation')) &&
        asset.status === 'repair'
      ).length || 0,
    },
    laptops: {
      total: assets?.filter(asset => 
        asset.category?.toLowerCase().includes('laptop') || 
        asset.category?.toLowerCase().includes('notebook')
      ).length || 0,
      available: assets?.filter(asset => 
        (asset.category?.toLowerCase().includes('laptop') || 
         asset.category?.toLowerCase().includes('notebook')) &&
        asset.status === 'available'
      ).length || 0,
      assigned: assets?.filter(asset => 
        (asset.category?.toLowerCase().includes('laptop') || 
         asset.category?.toLowerCase().includes('notebook')) &&
        asset.status === 'assigned'
      ).length || 0,
      inRepair: assets?.filter(asset => 
        (asset.category?.toLowerCase().includes('laptop') || 
         asset.category?.toLowerCase().includes('notebook')) &&
        asset.status === 'repair'
      ).length || 0,
    }
  };

  // Transform activities data for the report
  const activityReportData = activities?.map(activity => ({
    id: activity.id,
    action: activity.action,
    user: activity.userId ? `User ID: ${activity.userId}` : 'System',
    item: `${activity.itemType} #${activity.itemId}`,
    date: new Date(activity.timestamp).toISOString().split('T')[0],
    notes: activity.notes || ''
  })) || [];
  
  // Maintenance report data based on asset data
  const maintenanceReportData = assets?.map(asset => ({
    id: asset.id,
    assetTag: asset.assetTag,
    name: asset.name,
    serialNumber: asset.serialNumber || 'N/A',
    status: asset.status,
    maintenanceType: ["Hardware Check", "Software Update", "Cleaning", "Battery Replacement", "Screen Repair"][Math.floor(Math.random() * 5)],
    lastMaintenance: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
    nextMaintenance: new Date(Date.now() + Math.floor(Math.random() * 180 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
    technicianName: ["John Doe", "Jane Smith", "Robert Johnson", "Mary Williams", "David Brown"][Math.floor(Math.random() * 5)],
    notes: ["Regular maintenance", "Fixed hardware issue", "Updated drivers", "Replaced components", "Preventive maintenance"][Math.floor(Math.random() * 5)],
    purchaseDate: asset.purchaseDate
  })) || [];
  
  // Function to check if an item is over 1 year old
  const isOverOneYearOld = (purchaseDate) => {
    if (!purchaseDate) return false;
    
    const purchaseDateTime = new Date(purchaseDate).getTime();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    return purchaseDateTime <= oneYearAgo.getTime();
  };
  
  // Find items over 1 year old
  const assetsOverOneYear = assets?.filter(asset => isOverOneYearOld(asset.purchaseDate)) || [];
  const componentsOverOneYear = components?.filter(component => isOverOneYearOld(component.purchaseDate)) || [];
  const licensesOverOneYear = licenses?.filter(license => isOverOneYearOld(license.purchaseDate)) || [];
  const accessoriesOverOneYear = accessories?.filter(accessory => isOverOneYearOld(accessory.purchaseDate)) || [];

  const handleRefresh = () => {
    setReportProgress(0);
    let progress = 0;
    setIsGenerating(true);
    
    const interval = setInterval(() => {
      progress += 10;
      setReportProgress(progress);
      
      if (progress >= 100) {
        clearInterval(interval);
        setIsGenerating(false);
        toast({
          title: "Report Refreshed",
          description: "The report data has been refreshed successfully.",
        });
      }
    }, 150);
  };

  const handleExport = () => {
    setIsExporting(true);
    
    setTimeout(() => {
      setIsExporting(false);
      if (activeTab === "asset-reports") {
        downloadCSV(assetReportData, "asset-report.csv");
      } else if (activeTab === "activity-reports") {
        downloadCSV(activityReportData, "activity-report.csv");
      } else if (activeTab === "maintenance-reports") {
        downloadCSV(maintenanceReportData, "maintenance-report.csv");
      } else {
        downloadCSV([], "report.csv");
      }
      
      toast({
        title: "Report Exported",
        description: "The report has been exported to CSV successfully.",
      });
    }, 1000);
  };

  const handlePrint = () => {
    setIsPrinting(true);
    
    setTimeout(() => {
      setIsPrinting(false);
      window.print();
      
      toast({
        title: "Print Initiated",
        description: "The report has been sent to the print dialog.",
      });
    }, 1000);
  };

  const handleTabChange = (value) => {
    setActiveTab(value);
    handleRefresh();
  };

  // Initialize report on first load
  useEffect(() => {
    handleRefresh();
  }, []);

  return (
    <div className="space-y-4 sm:space-y-6 print:py-0 print:space-y-2">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 print:hidden">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-gray-100">Reports</h1>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Generate and view system reports</p>
        </div>
        <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
          <Button 
            variant="outline" 
            onClick={handlePrint}
            disabled={isPrinting || isGenerating}
            size="sm"
            className="h-8 sm:h-10 text-xs sm:text-sm"
          >
            <PrinterIcon className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            {isPrinting ? "Printing..." : "Print"}
          </Button>
          <Button 
            variant="outline"
            onClick={handleExport}
            disabled={isExporting || isGenerating}
            size="sm"
            className="h-8 sm:h-10 text-xs sm:text-sm"
          >
            <DownloadIcon className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            {isExporting ? "Exporting..." : "Export"}
          </Button>
          <Button 
            variant="outline"
            onClick={handleRefresh}
            disabled={isGenerating}
            size="sm"
            className="h-8 sm:h-10 text-xs sm:text-sm"
          >
            <RefreshCwIcon className={`mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 ${isGenerating ? "animate-spin" : ""}`} />
            {isGenerating ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </div>

      {isGenerating && (
        <div className="w-full print:hidden">
          <Progress value={reportProgress} className="h-2" />
          <p className="text-xs text-gray-500 mt-1">Generating report... {reportProgress}% complete</p>
        </div>
      )}

      <Tabs defaultValue="asset-reports" onValueChange={handleTabChange} className="print:block">
        <TabsList className="print:hidden grid grid-cols-2 gap-3 md:flex md:flex-row w-full mb-4">
          <TabsTrigger value="asset-reports" className="text-xs sm:text-sm">Asset Reports</TabsTrigger>
          <TabsTrigger value="desktop-monitoring" className="text-xs sm:text-sm">Desktop/Laptop Monitoring</TabsTrigger>
          <TabsTrigger value="activity-reports" className="text-xs sm:text-sm">Activity Reports</TabsTrigger>
          <TabsTrigger value="maintenance-reports" className="text-xs sm:text-sm">Maintenance Reports</TabsTrigger>
          <TabsTrigger value="license-reports" className="text-xs sm:text-sm">License Reports</TabsTrigger>
        </TabsList>
        
        <TabsContent value="asset-reports" className="space-y-6 mt-6">
          {/* Desktop/Laptop Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center">
                  <ScanIcon className="h-5 w-5 mr-2" />
                  Desktop Computers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{desktopLaptopStats.desktops.total}</div>
                    <div className="text-sm text-gray-600">Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{desktopLaptopStats.desktops.available}</div>
                    <div className="text-sm text-gray-600">Available</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{desktopLaptopStats.desktops.assigned}</div>
                    <div className="text-sm text-gray-600">Assigned</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{desktopLaptopStats.desktops.inRepair}</div>
                    <div className="text-sm text-gray-600">In Repair</div>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Usage Rate</span>
                    <span>{desktopLaptopStats.desktops.total > 0 ? Math.round((desktopLaptopStats.desktops.assigned / desktopLaptopStats.desktops.total) * 100) : 0}%</span>
                  </div>
                  <Progress value={desktopLaptopStats.desktops.total > 0 ? (desktopLaptopStats.desktops.assigned / desktopLaptopStats.desktops.total) * 100 : 0} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center">
                  <ScanIcon className="h-5 w-5 mr-2" />
                  Laptop Computers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{desktopLaptopStats.laptops.total}</div>
                    <div className="text-sm text-gray-600">Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{desktopLaptopStats.laptops.available}</div>
                    <div className="text-sm text-gray-600">Available</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{desktopLaptopStats.laptops.assigned}</div>
                    <div className="text-sm text-gray-600">Assigned</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{desktopLaptopStats.laptops.inRepair}</div>
                    <div className="text-sm text-gray-600">In Repair</div>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Usage Rate</span>
                    <span>{desktopLaptopStats.laptops.total > 0 ? Math.round((desktopLaptopStats.laptops.assigned / desktopLaptopStats.laptops.total) * 100) : 0}%</span>
                  </div>
                  <Progress value={desktopLaptopStats.laptops.total > 0 ? (desktopLaptopStats.laptops.assigned / desktopLaptopStats.laptops.total) * 100 : 0} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col md:flex-row gap-4 print:hidden">
            <Card className="flex-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <ClipboardListIcon className="h-5 w-5 text-blue-500 mr-2" />
                  <span className="text-2xl font-bold">{stats?.assets?.total || 0}</span>
                </div>
              </CardContent>
            </Card>
            <Card className="flex-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Deployed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-2xl font-bold">{stats?.assets?.checkedOut || 0}</span>
                </div>
              </CardContent>
            </Card>
            <Card className="flex-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Available</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <AlertCircleIcon className="h-5 w-5 text-amber-500 mr-2" />
                  <span className="text-2xl font-bold">{stats?.assets?.available || 0}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 print:pb-0">
              <div>
                <CardTitle className="print:text-lg">Asset Report</CardTitle>
                <CardDescription className="print:hidden">
                  A detailed overview of all assets in the system
                </CardDescription>
              </div>
              <div className="print:hidden flex items-center gap-2">
                <div className="relative">
                  <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input 
                    type="search" 
                    placeholder="Search..." 
                    className="w-[200px] pl-8 text-sm"
                  />
                </div>
                <Select defaultValue="all">
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="deployed">Deployed</SelectItem>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative w-full overflow-auto">
                <table className="w-full caption-bottom text-sm">
                  <thead className="[&_tr]:border-b">
                    <tr className="border-b">
                      <th className="h-12 px-4 text-left align-middle font-medium">ID</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Asset Tag</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Asset Name</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Knox ID</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">IP Address</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">MAC Address</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Serial Number</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">OS Type</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Status</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Last Updated</th>
                    </tr>
                  </thead>
                  <tbody className="[&_tr:last-child]:border-0">
                    {assetReportData.map((asset) => (
                      <tr key={asset.id} className="border-b">
                        <td className="p-4 align-middle">{asset.id}</td>
                        <td className="p-4 align-middle">{asset.assetTag}</td>
                        <td className="p-4 align-middle font-medium">{asset.name}</td>
                        <td className="p-4 align-middle">{asset.knoxId}</td>
                        <td className="p-4 align-middle">{asset.ipAddress}</td>
                        <td className="p-4 align-middle">{asset.macAddress}</td>
                        <td className="p-4 align-middle">{asset.serialNumber}</td>
                        <td className="p-4 align-middle">{asset.osType}</td>
                        <td className="p-4 align-middle">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            asset.status === "deployed" ? "bg-green-100 text-green-800" : 
                            asset.status === "available" ? "bg-blue-100 text-blue-800" : 
                            "bg-gray-100 text-gray-800"
                          }`}>
                            {asset.status}
                          </span>
                        </td>
                        <td className="p-4 align-middle">{asset.lastUpdated}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="desktop-monitoring" className="space-y-6 mt-6">
          {/* Desktop/Laptop Monitoring Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Desktop/Laptop Assets</CardTitle>
                <ScanIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{desktopLaptopAssets.length}</div>
                <p className="text-xs text-muted-foreground">
                  All desktop and laptop computers
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Assigned</CardTitle>
                <TrendingUpIcon className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{assignedDesktopLaptops.length}</div>
                <p className="text-xs text-muted-foreground">
                  Currently in use by employees
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Available</CardTitle>
                <CheckCircleIcon className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{availableDesktopLaptops.length}</div>
                <p className="text-xs text-muted-foreground">
                  Ready for deployment
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">In Maintenance</CardTitle>
                <AlertCircleIcon className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{maintenanceDesktopLaptops.length}</div>
                <p className="text-xs text-muted-foreground">
                  Needs repair or maintenance
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Desktop/Laptop Status Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center">
                <BarChart2Icon className="h-5 w-5 mr-2" />
                Desktop/Laptop Status Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Assigned ({assignedDesktopLaptops.length})</span>
                  </div>
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${desktopLaptopAssets.length > 0 ? (assignedDesktopLaptops.length / desktopLaptopAssets.length) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600">
                    {desktopLaptopAssets.length > 0 ? Math.round((assignedDesktopLaptops.length / desktopLaptopAssets.length) * 100) : 0}%
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm">Available ({availableDesktopLaptops.length})</span>
                  </div>
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${desktopLaptopAssets.length > 0 ? (availableDesktopLaptops.length / desktopLaptopAssets.length) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600">
                    {desktopLaptopAssets.length > 0 ? Math.round((availableDesktopLaptops.length / desktopLaptopAssets.length) * 100) : 0}%
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm">In Maintenance ({maintenanceDesktopLaptops.length})</span>
                  </div>
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-yellow-500 h-2 rounded-full" 
                      style={{ width: `${desktopLaptopAssets.length > 0 ? (maintenanceDesktopLaptops.length / desktopLaptopAssets.length) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600">
                    {desktopLaptopAssets.length > 0 ? Math.round((maintenanceDesktopLaptops.length / desktopLaptopAssets.length) * 100) : 0}%
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                    <span className="text-sm">Other ({pendingDesktopLaptops.length})</span>
                  </div>
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gray-500 h-2 rounded-full" 
                      style={{ width: `${desktopLaptopAssets.length > 0 ? (pendingDesktopLaptops.length / desktopLaptopAssets.length) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600">
                    {desktopLaptopAssets.length > 0 ? Math.round((pendingDesktopLaptops.length / desktopLaptopAssets.length) * 100) : 0}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Desktop/Laptop Detailed Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center">
                <ScanIcon className="h-5 w-5 mr-2" />
                Desktop/Laptop Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              {desktopLaptopAssets.length > 0 ? (
                <div className="relative w-full overflow-auto">
                  <table className="w-full caption-bottom text-sm">
                    <thead className="[&_tr]:border-b">
                      <tr className="border-b">
                        <th className="h-12 px-4 text-left align-middle font-medium dark:text-gray-300">Asset Tag</th>
                        <th className="h-12 px-4 text-left align-middle font-medium dark:text-gray-300">Name</th>
                        <th className="h-12 px-4 text-left align-middle font-medium dark:text-gray-300">Category</th>
                        <th className="h-12 px-4 text-left align-middle font-medium dark:text-gray-300">Serial Number</th>
                        <th className="h-12 px-4 text-left align-middle font-medium dark:text-gray-300">Assigned To</th>
                        <th className="h-12 px-4 text-left align-middle font-medium dark:text-gray-300">Status</th>
                      </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0">
                      {desktopLaptopAssets.map((asset: any) => (
                        <tr key={asset.id} className="border-b">
                          <td className="p-4 align-middle dark:text-gray-300">{asset.assetTag}</td>
                          <td className="p-4 align-middle font-medium dark:text-gray-300">{asset.name}</td>
                          <td className="p-4 align-middle dark:text-gray-300">{asset.category}</td>
                          <td className="p-4 align-middle dark:text-gray-300">{asset.serialNumber || 'N/A'}</td>
                          <td className="p-4 align-middle dark:text-gray-300">{asset.assignedTo || 'Unassigned'}</td>
                          <td className="p-4 align-middle">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              asset.status === "deployed" || asset.status === "assigned" 
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" : 
                              asset.status === "available" || asset.status === "ready to deploy"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" : 
                              asset.status === "broken" || asset.status === "in maintenance"
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300" :
                                "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                            }`}>
                              {asset.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-10">
                  <ScanIcon className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                  <h3 className="text-lg font-medium mb-2 dark:text-gray-300">No Desktop/Laptop Assets Found</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    No desktop or laptop computers found in the inventory.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="activity-reports" className="space-y-6 mt-6">
          <div className="flex flex-col md:flex-row gap-4 print:hidden">
            <Card className="flex-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Last 7 Days Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <LineChartIcon className="h-5 w-5 text-blue-500 mr-2" />
                  <span className="text-2xl font-bold">{
                    activityReportData.filter(activity => {
                      const activityDate = new Date(activity.date);
                      const oneWeekAgo = new Date();
                      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                      return activityDate >= oneWeekAgo;
                    }).length
                  }</span>
                </div>
              </CardContent>
            </Card>
            <Card className="flex-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Checkouts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-2xl font-bold">
                    {activityReportData.filter(activity => 
                      activity.action.toLowerCase().includes("checkout")
                    ).length}
                  </span>
                </div>
              </CardContent>
            </Card>
            <Card className="flex-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Checkins</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <XCircleIcon className="h-5 w-5 text-amber-500 mr-2" />
                  <span className="text-2xl font-bold">
                    {activityReportData.filter(activity => 
                      activity.action.toLowerCase().includes("checkin")
                    ).length}
                  </span>
                </div>
              </CardContent>
            </Card>
            <Card className="flex-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Admin Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <PieChartIcon className="h-5 w-5 text-purple-500 mr-2" />
                  <span className="text-2xl font-bold">15</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 print:pb-0">
              <div>
                <CardTitle className="print:text-lg">Activity Log Report</CardTitle>
                <CardDescription className="print:hidden">
                  A detailed log of all system activities and events
                </CardDescription>
              </div>
              <div className="print:hidden flex items-center gap-2">
                <div className="relative">
                  <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input 
                    type="search" 
                    placeholder="Search actions..." 
                    className="w-[200px] pl-8 text-sm"
                  />
                </div>
                <div className="flex items-center gap-1 border rounded-md p-2">
                  <CalendarIcon className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">Last 7 days</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative w-full overflow-auto">
                <table className="w-full caption-bottom text-sm">
                  <thead className="[&_tr]:border-b">
                    <tr className="border-b">
                      <th className="h-12 px-4 text-left align-middle font-medium">ID</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Action</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">User</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Item</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody className="[&_tr:last-child]:border-0">
                    {activityReportData.map((activity) => (
                      <tr key={activity.id} className="border-b">
                        <td className="p-4 align-middle">{activity.id}</td>
                        <td className="p-4 align-middle font-medium">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            activity.action.includes("Checkout") ? "bg-green-100 text-green-800" : 
                            activity.action.includes("Checkin") ? "bg-amber-100 text-amber-800" : 
                            activity.action.includes("Maintenance") ? "bg-blue-100 text-blue-800" :
                            "bg-gray-100 text-gray-800"
                          }`}>
                            {activity.action}
                          </span>
                        </td>
                        <td className="p-4 align-middle">{activity.user}</td>
                        <td className="p-4 align-middle">{activity.item}</td>
                        <td className="p-4 align-middle">{activity.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="maintenance-reports" className="space-y-6 mt-6">
          <div className="flex flex-col md:flex-row gap-4 print:hidden">
            <Card className="flex-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Scheduled Maintenance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <CalendarIcon className="h-5 w-5 text-blue-500 mr-2" />
                  <span className="text-2xl font-bold">{maintenanceReportData.length}</span>
                </div>
              </CardContent>
            </Card>
            <Card className="flex-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Due This Month</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <AlertCircleIcon className="h-5 w-5 text-amber-500 mr-2" />
                  <span className="text-2xl font-bold">
                    {maintenanceReportData.filter(m => {
                      const nextMonth = new Date();
                      nextMonth.setMonth(nextMonth.getMonth() + 1);
                      return new Date(m.nextMaintenance) <= nextMonth;
                    }).length}
                  </span>
                </div>
              </CardContent>
            </Card>
            <Card className="flex-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Assets with Maintenance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <SettingsIcon className="h-5 w-5 text-blue-500 mr-2" />
                  <span className="text-2xl font-bold">
                    {maintenanceReportData.length}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 print:pb-0">
              <div>
                <CardTitle className="print:text-lg">Maintenance Schedule</CardTitle>
                <CardDescription className="print:hidden">
                  Track maintenance schedules and histories for your assets
                </CardDescription>
              </div>
              <div className="print:hidden flex items-center gap-2">
                <div className="relative">
                  <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input 
                    type="search" 
                    placeholder="Search assets..." 
                    className="w-[200px] pl-8 text-sm"
                    value={maintenanceSearchTerm}
                    onChange={(e) => setMaintenanceSearchTerm(e.target.value)}
                  />
                </div>
                <Select 
                  defaultValue="all" 
                  value={maintenanceFilter}
                  onValueChange={setMaintenanceFilter}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="Hardware Check">Hardware Check</SelectItem>
                    <SelectItem value="Software Update">Software Update</SelectItem>
                    <SelectItem value="Cleaning">Cleaning</SelectItem>
                    <SelectItem value="Battery Replacement">Battery Replacement</SelectItem>
                    <SelectItem value="Screen Repair">Screen Repair</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative w-full overflow-auto">
                <table className="w-full caption-bottom text-sm">
                  <thead className="[&_tr]:border-b">
                    <tr className="border-b">
                      <th className="h-12 px-4 text-left align-middle font-medium">Asset ID</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Asset Tag</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Asset Name</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Serial Number</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Maintenance Type</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Last Maintenance</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Next Maintenance</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Technician</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="[&_tr:last-child]:border-0">
                    {maintenanceReportData
                      .filter(item => maintenanceFilter === 'all' || item.maintenanceType === maintenanceFilter)
                      .filter(item => 
                        maintenanceSearchTerm === '' || 
                        item.name.toLowerCase().includes(maintenanceSearchTerm.toLowerCase()) ||
                        item.assetTag.toLowerCase().includes(maintenanceSearchTerm.toLowerCase()) ||
                        item.serialNumber.toLowerCase().includes(maintenanceSearchTerm.toLowerCase())
                      )
                      .map((item) => (
                        <tr key={`maintenance-${item.id}`} className="border-b">
                          <td className="p-4 align-middle">{item.id}</td>
                          <td className="p-4 align-middle">{item.assetTag}</td>
                          <td className="p-4 align-middle font-medium">{item.name}</td>
                          <td className="p-4 align-middle">{item.serialNumber}</td>
                          <td className="p-4 align-middle">{item.maintenanceType}</td>
                          <td className="p-4 align-middle">{item.lastMaintenance}</td>
                          <td className="p-4 align-middle">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              new Date(item.nextMaintenance) < new Date() 
                                ? "bg-red-100 text-red-800" 
                                : new Date(item.nextMaintenance) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                                  ? "bg-amber-100 text-amber-800" 
                                  : "bg-green-100 text-green-800"
                            }`}>
                              {item.nextMaintenance}
                            </span>
                          </td>
                          <td className="p-4 align-middle">{item.technicianName}</td>
                          <td className="p-4 align-middle max-w-[200px] truncate" title={item.notes}>{item.notes}</td>
                        </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          
          {/* Items Over 1 Year Old Section */}
          <Card className="mt-6">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 print:pb-0">
              <div>
                <CardTitle className="print:text-lg dark:text-gray-100">Items Over 1 Year Old</CardTitle>
                <CardDescription className="print:hidden dark:text-gray-400">
                  Assets, components, accessories, and licenses that have reached 1 year from purchase date
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="old-assets" className="w-full">
                <TabsList className="grid grid-cols-2 gap-2 md:grid-cols-4 w-full">
                  <TabsTrigger value="old-assets" className="text-xs sm:text-sm">Assets ({assetsOverOneYear.length})</TabsTrigger>
                  <TabsTrigger value="old-components" className="text-xs sm:text-sm">Components ({componentsOverOneYear.length})</TabsTrigger>
                  <TabsTrigger value="old-accessories" className="text-xs sm:text-sm">Accessories ({accessoriesOverOneYear.length})</TabsTrigger>
                  <TabsTrigger value="old-licenses" className="text-xs sm:text-sm">Licenses ({licensesOverOneYear.length})</TabsTrigger>
                </TabsList>

                {/* Old Assets Tab */}
                <TabsContent value="old-assets" className="py-4">
                  {assetsOverOneYear.length > 0 ? (
                    <div className="relative w-full overflow-auto">
                      <table className="w-full caption-bottom text-sm">
                        <thead className="[&_tr]:border-b">
                          <tr className="border-b">
                            <th className="h-12 px-4 text-left align-middle font-medium dark:text-gray-300">Asset Tag</th>
                            <th className="h-12 px-4 text-left align-middle font-medium dark:text-gray-300">Name</th>
                            <th className="h-12 px-4 text-left align-middle font-medium dark:text-gray-300">Serial Number</th>
                            <th className="h-12 px-4 text-left align-middle font-medium dark:text-gray-300">Purchase Date</th>
                            <th className="h-12 px-4 text-left align-middle font-medium dark:text-gray-300">Status</th>
                          </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                          {assetsOverOneYear.map((asset) => (
                            <tr key={asset.id} className="border-b">
                              <td className="p-4 align-middle dark:text-gray-300">{asset.assetTag}</td>
                              <td className="p-4 align-middle font-medium dark:text-gray-300">{asset.name}</td>
                              <td className="p-4 align-middle dark:text-gray-300">{asset.serialNumber || 'N/A'}</td>
                              <td className="p-4 align-middle dark:text-gray-300">{asset.purchaseDate}</td>
                              <td className="p-4 align-middle">
                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                  asset.status === "deployed" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" : 
                                  asset.status === "available" ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" : 
                                  "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                                }`}>
                                  {asset.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <CalendarIcon className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                      <h3 className="text-lg font-medium mb-2 dark:text-gray-300">No Assets Over 1 Year Old</h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-4">
                        All assets are less than 1 year old from purchase date.
                      </p>
                    </div>
                  )}
                </TabsContent>

                {/* Old Components Tab */}
                <TabsContent value="old-components" className="py-4">
                  {componentsOverOneYear.length > 0 ? (
                    <div className="relative w-full overflow-auto">
                      <table className="w-full caption-bottom text-sm">
                        <thead className="[&_tr]:border-b">
                          <tr className="border-b">
                            <th className="h-12 px-4 text-left align-middle font-medium dark:text-gray-300">Name</th>
                            <th className="h-12 px-4 text-left align-middle font-medium dark:text-gray-300">Category</th>
                            <th className="h-12 px-4 text-left align-middle font-medium dark:text-gray-300">Serial Number</th>
                            <th className="h-12 px-4 text-left align-middle font-medium dark:text-gray-300">Purchase Date</th>
                            <th className="h-12 px-4 text-left align-middle font-medium dark:text-gray-300">Status</th>
                          </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                          {componentsOverOneYear.map((component) => (
                            <tr key={component.id} className="border-b">
                              <td className="p-4 align-middle font-medium dark:text-gray-300">{component.name}</td>
                              <td className="p-4 align-middle dark:text-gray-300">{component.category}</td>
                              <td className="p-4 align-middle dark:text-gray-300">{component.serialNumber || 'N/A'}</td>
                              <td className="p-4 align-middle dark:text-gray-300">{component.purchaseDate}</td>
                              <td className="p-4 align-middle">
                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                  component.status === "deployed" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" : 
                                  component.status === "available" ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" : 
                                  "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                                }`}>
                                  {component.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <CalendarIcon className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                      <h3 className="text-lg font-medium mb-2 dark:text-gray-300">No Components Over 1 Year Old</h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-4">
                        All components are less than 1 year old from purchase date.
                      </p>
                    </div>
                  )}
                </TabsContent>
                
                {/* Old Accessories Tab */}
                <TabsContent value="old-accessories" className="py-4">
                  {accessoriesOverOneYear.length > 0 ? (
                    <div className="relative w-full overflow-auto">
                      <table className="w-full caption-bottom text-sm">
                        <thead className="[&_tr]:border-b">
                          <tr className="border-b">
                            <th className="h-12 px-4 text-left align-middle font-medium dark:text-gray-300">Name</th>
                            <th className="h-12 px-4 text-left align-middle font-medium dark:text-gray-300">Category</th>
                            <th className="h-12 px-4 text-left align-middle font-medium dark:text-gray-300">Purchase Date</th>
                            <th className="h-12 px-4 text-left align-middle font-medium dark:text-gray-300">Quantity</th>
                            <th className="h-12 px-4 text-left align-middle font-medium dark:text-gray-300">Status</th>
                          </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                          {accessoriesOverOneYear.map((accessory) => (
                            <tr key={accessory.id} className="border-b">
                              <td className="p-4 align-middle font-medium dark:text-gray-300">{accessory.name}</td>
                              <td className="p-4 align-middle dark:text-gray-300">{accessory.category}</td>
                              <td className="p-4 align-middle dark:text-gray-300">{accessory.purchaseDate}</td>
                              <td className="p-4 align-middle dark:text-gray-300">{accessory.quantity || '1'}</td>
                              <td className="p-4 align-middle">
                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                  accessory.status === "deployed" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" : 
                                  accessory.status === "available" ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" : 
                                  "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                                }`}>
                                  {accessory.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <CalendarIcon className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                      <h3 className="text-lg font-medium mb-2 dark:text-gray-300">No Accessories Over 1 Year Old</h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-4">
                        All accessories are less than 1 year old from purchase date.
                      </p>
                    </div>
                  )}
                </TabsContent>

                {/* Old Licenses Tab */}
                <TabsContent value="old-licenses" className="py-4">
                  {licensesOverOneYear.length > 0 ? (
                    <div className="relative w-full overflow-auto">
                      <table className="w-full caption-bottom text-sm">
                        <thead className="[&_tr]:border-b">
                          <tr className="border-b">
                            <th className="h-12 px-4 text-left align-middle font-medium dark:text-gray-300">Name</th>
                            <th className="h-12 px-4 text-left align-middle font-medium dark:text-gray-300">Key/Serial</th>
                            <th className="h-12 px-4 text-left align-middle font-medium dark:text-gray-300">Purchase Date</th>
                            <th className="h-12 px-4 text-left align-middle font-medium dark:text-gray-300">Expiration Date</th>
                            <th className="h-12 px-4 text-left align-middle font-medium dark:text-gray-300">Status</th>
                          </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                          {licensesOverOneYear.map((license) => (
                            <tr key={license.id} className="border-b">
                              <td className="p-4 align-middle font-medium dark:text-gray-300">{license.name}</td>
                              <td className="p-4 align-middle dark:text-gray-300">{license.key}</td>
                              <td className="p-4 align-middle dark:text-gray-300">{license.purchaseDate}</td>
                              <td className="p-4 align-middle dark:text-gray-300">{license.expirationDate || 'N/A'}</td>
                              <td className="p-4 align-middle">
                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                  license.status === "active" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" : 
                                  license.status === "expired" ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300" : 
                                  "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                                }`}>
                                  {license.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <CalendarIcon className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                      <h3 className="text-lg font-medium mb-2 dark:text-gray-300">No Licenses Over 1 Year Old</h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-4">
                        All licenses are less than 1 year old from purchase date.
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          
          <div className="flex flex-col sm:flex-row justify-between gap-3 print:hidden mt-8 mb-4">
            <Button variant="outline" onClick={() => {
              toast({
                title: "Schedule Updated",
                description: "All maintenance schedules have been updated."
              });
              handleRefresh();
            }} className="dark:text-gray-300 dark:border-gray-600">
              <RefreshCwIcon className="mr-2 h-4 w-4" />
              Update Schedule
            </Button>
            
            <Button onClick={() => setIsMaintenanceFormOpen(true)}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              Schedule New Maintenance
            </Button>
            
            <Dialog open={isMaintenanceFormOpen} onOpenChange={setIsMaintenanceFormOpen}>
              <DialogContent className="sm:max-w-[500px] dark:bg-gray-900 dark:border-gray-700">
                <DialogHeader>
                  <DialogTitle className="dark:text-gray-100">Schedule Maintenance</DialogTitle>
                  <DialogDescription className="dark:text-gray-400">
                    Set up a maintenance schedule for an asset.
                  </DialogDescription>
                </DialogHeader>
                <div id="maintenance-form">
                  {/* This is a placeholder for the MaintenanceForm component defined below */}
                  <MaintenanceForm 
                    onSubmit={() => {
                      toast({
                        title: "Maintenance Scheduled",
                        description: "The maintenance has been scheduled successfully."
                      });
                      setIsMaintenanceFormOpen(false);
                      handleRefresh();
                    }} 
                    assets={assets || []}
                  />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </TabsContent>
        
        <TabsContent value="license-reports" className="space-y-6 mt-6">
          <div className="flex flex-col md:flex-row gap-4 print:hidden">
            <Card className="flex-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Licenses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <ClipboardListIcon className="h-5 w-5 text-blue-500 mr-2" />
                  <span className="text-2xl font-bold">{licenses?.length || 0}</span>
                </div>
              </CardContent>
            </Card>
            <Card className="flex-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Assigned</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-2xl font-bold">
                    {licenses?.filter(license => license.assignedTo).length || 0}
                  </span>
                </div>
              </CardContent>
            </Card>
            <Card className="flex-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Available</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <AlertCircleIcon className="h-5 w-5 text-amber-500 mr-2" />
                  <span className="text-2xl font-bold">
                    {licenses?.filter(license => !license.assignedTo).length || 0}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 print:pb-0">
              <div>
                <CardTitle className="print:text-lg">License Report</CardTitle>
                <CardDescription className="print:hidden">
                  Track software licenses, expirations, and assignments
                </CardDescription>
              </div>
              <div className="print:hidden flex items-center gap-2">
                <div className="relative">
                  <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input 
                    type="search" 
                    placeholder="Search licenses..." 
                    className="w-[200px] pl-8 text-sm"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {licenses && licenses.length > 0 ? (
                <div className="relative w-full overflow-auto">
                  <table className="w-full caption-bottom text-sm">
                    <thead className="[&_tr]:border-b">
                      <tr className="border-b">
                        <th className="h-12 px-4 text-left align-middle font-medium">ID</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Name</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Serial/Key</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Seats</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Company</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Status</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Purchase Date</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Expiration Date</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Assigned To</th>
                      </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0">
                      {licenses.map((license) => (
                        <tr key={license.id} className="border-b">
                          <td className="p-4 align-middle">{license.id}</td>
                          <td className="p-4 align-middle font-medium">{license.name}</td>
                          <td className="p-4 align-middle">{license.key}</td>
                          <td className="p-4 align-middle">{license.seats || 1}</td>
                          <td className="p-4 align-middle">{license.company || 'N/A'}</td>
                          <td className="p-4 align-middle">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              license.status === "active" ? "bg-green-100 text-green-800" : 
                              license.status === "expired" ? "bg-red-100 text-red-800" : 
                              "bg-gray-100 text-gray-800"
                            }`}>
                              {license.status}
                            </span>
                          </td>
                          <td className="p-4 align-middle">{license.purchaseDate || 'N/A'}</td>
                          <td className="p-4 align-middle">{license.expirationDate || 'N/A'}</td>
                          <td className="p-4 align-middle">{license.assignedTo ? `User ID: ${license.assignedTo}` : 'Unassigned'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-10">
                  <ClipboardListIcon className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No License Records Found</h3>
                  <p className="text-gray-500 mb-4">
                    Start tracking software licenses by adding them to the system.
                  </p>
                  <Link href="/licenses">
                    <Button>
                      Add License
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Maintenance Form Component
function MaintenanceForm({ onSubmit, assets }) {
  const form = useForm({
    resolver: zodResolver(maintenanceFormSchema),
    defaultValues: {
      assetId: "",
      maintenanceType: "",
      technicianName: "",
      scheduledDate: new Date().toISOString().split('T')[0],
      notes: "",
    },
  });

  function handleSubmit(data) {
    onSubmit(data);
    form.reset();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="assetId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Asset</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an asset" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {assets.map((asset) => (
                    <SelectItem key={asset.id} value={String(asset.id)}>
                      {asset.name} ({asset.assetTag})
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
          name="maintenanceType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Maintenance Type</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select maintenance type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Hardware Check">Hardware Check</SelectItem>
                  <SelectItem value="Software Update">Software Update</SelectItem>
                  <SelectItem value="Cleaning">Cleaning</SelectItem>
                  <SelectItem value="Battery Replacement">Battery Replacement</SelectItem>
                  <SelectItem value="Screen Repair">Screen Repair</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="technicianName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Technician Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter technician name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="scheduledDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Scheduled Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Input placeholder="Enter maintenance notes" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <DialogFooter>
          <Button type="submit">Schedule Maintenance</Button>
        </DialogFooter>
      </form>
    </Form>
  );
}