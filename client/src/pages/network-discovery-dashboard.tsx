import React, { useState, useEffect } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2, PieChart, AlertTriangle, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import NetworkDiscoveryDashboard from "@/components/dashboard/network-discovery-dashboard";

export default function NetworkDiscoveryDashboardPage() {
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedHost, setSelectedHost] = useState<any>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  
  // Fetch discovered hosts
  const { 
    data: discoveredHosts = [],
    isLoading,
    refetch
  } = useQuery({
    queryKey: ['/api/network-discovery/hosts'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/network-discovery/hosts');
      return await response.json();
    }
  });
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast({
        title: "Data Refreshed",
        description: "Network discovery data has been updated",
      });
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Could not refresh network discovery data",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };
  
  const handleViewDetails = (host: any) => {
    setSelectedHost(host);
    setDetailsDialogOpen(true);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Network Discovery Dashboard</h1>
          <p className="text-muted-foreground">
            Overview and analytics of discovered network devices and their details
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={isLoading || isRefreshing}
          className="flex items-center gap-2"
        >
          {isLoading || isRefreshing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              Refresh Data
            </>
          )}
        </Button>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : discoveredHosts.length === 0 ? (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-orange-600 dark:text-orange-300 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              No Network Discovery Data
            </CardTitle>
            <CardDescription className="text-orange-600 dark:text-orange-300">
              You need to scan your network first to collect data for the dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-orange-600 dark:text-orange-300 mb-4">
              Use the Network Discovery page to scan your network for devices. The dashboard will display analytics and insights about the discovered devices once data is collected.
            </p>
            <Button 
              variant="outline" 
              className="text-orange-600 border-orange-200 hover:bg-orange-100 dark:text-orange-300 dark:border-orange-800 dark:hover:bg-orange-900"
              onClick={() => window.location.href = '/network-discovery'}
            >
              Go to Network Discovery
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <NetworkDiscoveryDashboard 
            hosts={discoveredHosts} 
            onViewDetails={handleViewDetails} 
          />
          
          <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              {selectedHost && (
                <>
                  <DialogHeader>
                    <DialogTitle className="text-xl flex items-center gap-2">
                      Device Details: {selectedHost.hostname || selectedHost.ipAddress}
                      <Badge variant={selectedHost.online ? "default" : "destructive"} className="ml-2">
                        {selectedHost.online ? "Online" : "Offline"}
                      </Badge>
                    </DialogTitle>
                    <DialogDescription>
                      Detailed information collected about this device
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Tabs defaultValue="overview" className="mt-4">
                    <TabsList className="grid grid-cols-4">
                      <TabsTrigger value="overview">Overview</TabsTrigger>
                      <TabsTrigger value="hardware">Hardware</TabsTrigger>
                      <TabsTrigger value="software">Software</TabsTrigger>
                      <TabsTrigger value="peripherals">Peripherals</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="overview" className="space-y-4 mt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg">Basic Information</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <dl className="space-y-2">
                              <div className="flex justify-between">
                                <dt className="font-medium">Hostname:</dt>
                                <dd>{selectedHost.hostname || 'Unknown'}</dd>
                              </div>
                              <div className="flex justify-between">
                                <dt className="font-medium">IP Address:</dt>
                                <dd>{selectedHost.ipAddress}</dd>
                              </div>
                              <div className="flex justify-between">
                                <dt className="font-medium">MAC Address:</dt>
                                <dd>{selectedHost.macAddress || 'Unknown'}</dd>
                              </div>
                              <div className="flex justify-between">
                                <dt className="font-medium">Last Seen:</dt>
                                <dd>{formatDate(selectedHost.lastSeen)}</dd>
                              </div>
                              <div className="flex justify-between">
                                <dt className="font-medium">First Discovered:</dt>
                                <dd>{formatDate(selectedHost.createdAt)}</dd>
                              </div>
                            </dl>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg">System Information</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <dl className="space-y-2">
                              <div className="flex justify-between">
                                <dt className="font-medium">OS:</dt>
                                <dd>{selectedHost.systemInfo?.os || 'Unknown'}</dd>
                              </div>
                              <div className="flex justify-between">
                                <dt className="font-medium">OS Version:</dt>
                                <dd>{selectedHost.systemInfo?.osVersion || 'Unknown'}</dd>
                              </div>
                              <div className="flex justify-between">
                                <dt className="font-medium">Architecture:</dt>
                                <dd>{selectedHost.hardwareDetails?.cpu?.architecture || 'Unknown'}</dd>
                              </div>
                              <div className="flex justify-between">
                                <dt className="font-medium">Manufacturer:</dt>
                                <dd>{selectedHost.hardwareDetails?.system?.manufacturer || 'Unknown'}</dd>
                              </div>
                              <div className="flex justify-between">
                                <dt className="font-medium">Model:</dt>
                                <dd>{selectedHost.hardwareDetails?.system?.model || 'Unknown'}</dd>
                              </div>
                            </dl>
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="hardware" className="space-y-4 mt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg">CPU Information</CardTitle>
                          </CardHeader>
                          <CardContent>
                            {selectedHost.hardwareDetails?.cpu ? (
                              <dl className="space-y-2">
                                <div className="flex justify-between">
                                  <dt className="font-medium">Processor:</dt>
                                  <dd>{selectedHost.hardwareDetails.cpu.brand || 'Unknown'}</dd>
                                </div>
                                <div className="flex justify-between">
                                  <dt className="font-medium">Cores:</dt>
                                  <dd>{selectedHost.hardwareDetails.cpu.cores || 'Unknown'}</dd>
                                </div>
                                <div className="flex justify-between">
                                  <dt className="font-medium">Threads:</dt>
                                  <dd>{selectedHost.hardwareDetails.cpu.threads || 'Unknown'}</dd>
                                </div>
                                <div className="flex justify-between">
                                  <dt className="font-medium">Speed:</dt>
                                  <dd>{selectedHost.hardwareDetails.cpu.speed ? `${selectedHost.hardwareDetails.cpu.speed} GHz` : 'Unknown'}</dd>
                                </div>
                              </dl>
                            ) : (
                              <p className="text-muted-foreground italic">No CPU information available</p>
                            )}
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg">Memory Information</CardTitle>
                          </CardHeader>
                          <CardContent>
                            {selectedHost.hardwareDetails?.memory ? (
                              <dl className="space-y-2">
                                <div className="flex justify-between">
                                  <dt className="font-medium">Total:</dt>
                                  <dd>{formatBytes(selectedHost.hardwareDetails.memory.total || 0)}</dd>
                                </div>
                                <div className="flex justify-between">
                                  <dt className="font-medium">Free:</dt>
                                  <dd>{formatBytes(selectedHost.hardwareDetails.memory.free || 0)}</dd>
                                </div>
                                <div className="flex justify-between">
                                  <dt className="font-medium">Used:</dt>
                                  <dd>{formatBytes(selectedHost.hardwareDetails.memory.used || 0)}</dd>
                                </div>
                                {selectedHost.hardwareDetails.memory.layout && selectedHost.hardwareDetails.memory.layout.length > 0 ? (
                                  <div>
                                    <dt className="font-medium mt-3 mb-1">Memory Modules:</dt>
                                    {selectedHost.hardwareDetails.memory.layout.map((module: any, idx: number) => (
                                      <div key={idx} className="text-sm pl-2 border-l-2 border-gray-200 ml-2 mb-2">
                                        <p>{formatBytes(module.size)} {module.type} @ {module.clockSpeed} MT/s</p>
                                        <p className="text-muted-foreground">
                                          {module.manufacturer} {module.partNumber}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                ) : null}
                              </dl>
                            ) : (
                              <p className="text-muted-foreground italic">No memory information available</p>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">Storage Information</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {selectedHost.hardwareDetails?.drives && selectedHost.hardwareDetails.drives.length > 0 ? (
                            <div className="rounded-md border overflow-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Device</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Size</TableHead>
                                    <TableHead>Interface</TableHead>
                                    <TableHead>Model</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {selectedHost.hardwareDetails.drives.map((drive: any, idx: number) => (
                                    <TableRow key={idx}>
                                      <TableCell className="font-medium">{drive.device || drive.name || 'Unknown'}</TableCell>
                                      <TableCell>{drive.type || 'Unknown'}</TableCell>
                                      <TableCell>{formatBytes(drive.size || 0)}</TableCell>
                                      <TableCell>{drive.interfaceType || 'Unknown'}</TableCell>
                                      <TableCell>{drive.model || 'Unknown'}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          ) : (
                            <p className="text-muted-foreground italic">No storage information available</p>
                          )}
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">Network Interfaces</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {selectedHost.hardwareDetails?.networkInterfaces && selectedHost.hardwareDetails.networkInterfaces.length > 0 ? (
                            <div className="rounded-md border overflow-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Interface</TableHead>
                                    <TableHead>IP Address</TableHead>
                                    <TableHead>MAC Address</TableHead>
                                    <TableHead>Speed</TableHead>
                                    <TableHead>Status</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {selectedHost.hardwareDetails.networkInterfaces.map((nic: any, idx: number) => (
                                    <TableRow key={idx}>
                                      <TableCell className="font-medium">{nic.name || 'Unknown'}</TableCell>
                                      <TableCell>{nic.ip4 || 'N/A'}</TableCell>
                                      <TableCell>{nic.mac || 'Unknown'}</TableCell>
                                      <TableCell>{nic.speed ? `${nic.speed} Mbps` : 'Unknown'}</TableCell>
                                      <TableCell>
                                        <Badge variant={nic.operstate === 'up' ? 'default' : 'secondary'}>
                                          {nic.operstate || 'Unknown'}
                                        </Badge>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          ) : (
                            <p className="text-muted-foreground italic">No network interface information available</p>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>
                    
                    <TabsContent value="software" className="space-y-4 mt-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">Installed Software</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {selectedHost.systemInfo?.installedSoftware && selectedHost.systemInfo.installedSoftware.length > 0 ? (
                            <div className="rounded-md border overflow-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Version</TableHead>
                                    <TableHead>Publisher</TableHead>
                                    <TableHead>Install Date</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {selectedHost.systemInfo.installedSoftware.map((sw: any, idx: number) => (
                                    <TableRow key={idx}>
                                      <TableCell className="font-medium">{sw.name || 'Unknown'}</TableCell>
                                      <TableCell>{sw.version || 'Unknown'}</TableCell>
                                      <TableCell>{sw.publisher || 'Unknown'}</TableCell>
                                      <TableCell>{sw.installDate || 'Unknown'}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          ) : (
                            <p className="text-muted-foreground italic">No software information available</p>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>
                    
                    <TabsContent value="peripherals" className="space-y-4 mt-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">USB Devices</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {selectedHost.hardwareDetails?.usb && selectedHost.hardwareDetails.usb.length > 0 ? (
                            <div className="rounded-md border overflow-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Vendor</TableHead>
                                    <TableHead>Product ID</TableHead>
                                    <TableHead>Vendor ID</TableHead>
                                    <TableHead>Serial</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {selectedHost.hardwareDetails.usb.map((device: any, idx: number) => (
                                    <TableRow key={idx}>
                                      <TableCell className="font-medium">{device.name || 'Unknown Device'}</TableCell>
                                      <TableCell>{device.vendor || 'Unknown'}</TableCell>
                                      <TableCell>{device.productId || 'N/A'}</TableCell>
                                      <TableCell>{device.vendorId || 'N/A'}</TableCell>
                                      <TableCell>{device.serial || 'N/A'}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          ) : (
                            <p className="text-muted-foreground italic">No USB devices detected</p>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDetailsDialogOpen(false)}>
                      Close
                    </Button>
                  </DialogFooter>
                </>
              )}
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}

// Helper function to format bytes
function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Helper function to format dates
function formatDate(dateString: string | null) {
  if (!dateString) return "Unknown";
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  }).format(new Date(dateString));
}