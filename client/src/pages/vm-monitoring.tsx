import React, { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
// WebSocket functionality removed for better compatibility
import { Loader2, RefreshCw, Settings, Server, Activity, CheckSquare, Search } from "lucide-react";

// Zabbix settings form schema
const zabbixSettingsSchema = z.object({
  url: z.string().url({ message: "Please enter a valid URL" }),
  apiKey: z.string().min(1, { message: "API key is required" }),
  autoSync: z.boolean().default(true),
  syncInterval: z.coerce.number().min(5).max(1440).default(60),
});

// Subnet form schema
const subnetSchema = z.object({
  subnet: z.string().regex(/^([0-9]{1,3}\.){3}[0-9]{1,3}(\/([0-9]|[1-2][0-9]|3[0-2]))?$/, {
    message: "Please enter a valid CIDR subnet (e.g. 192.168.1.0/24)",
  }),
  description: z.string().optional(),
});

export default function VMMonitoringPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("monitoring");
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // WebSocket functionality temporarily disabled for stability
  const isWebSocketConnected = false;
  
  // Fetch Zabbix settings
  const { 
    data: zabbixSettings,
    isLoading: isLoadingSettings
  } = useQuery({
    queryKey: ['/api/zabbix/settings'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/zabbix/settings');
        return await response.json();
      } catch (error) {
        // Return default settings if none exist
        return { 
          url: '',
          apiKey: '',
          autoSync: true,
          syncInterval: 60,
          lastSync: null,
          status: 'not_configured'
        };
      }
    }
  });
  
  // Fetch subnets
  const { 
    data: subnets = [],
    isLoading: isLoadingSubnets
  } = useQuery({
    queryKey: ['/api/zabbix/subnets'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/zabbix/subnets');
      return await response.json();
    }
  });
  
  // Fetch VM monitoring data
  const {
    data: vmMonitoring = [],
    isLoading: isLoadingVMs,
    refetch: refetchVMs
  } = useQuery({
    queryKey: ['/api/vm-monitoring'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/vm-monitoring');
      return await response.json();
    }
  });
  
  // Settings form
  const settingsForm = useForm<z.infer<typeof zabbixSettingsSchema>>({
    resolver: zodResolver(zabbixSettingsSchema),
    defaultValues: {
      url: zabbixSettings?.url || '',
      apiKey: zabbixSettings?.apiKey || '',
      autoSync: zabbixSettings?.autoSync ?? true,
      syncInterval: zabbixSettings?.syncInterval || 60,
    }
  });
  
  // Update form values when settings are loaded
  useEffect(() => {
    if (zabbixSettings) {
      settingsForm.reset({
        url: zabbixSettings.url || '',
        apiKey: zabbixSettings.apiKey || '',
        autoSync: zabbixSettings.autoSync ?? true,
        syncInterval: zabbixSettings.syncInterval || 60,
      });
      
      if (zabbixSettings.lastSync) {
        setLastSyncTime(zabbixSettings.lastSync);
      }
    }
  }, [zabbixSettings, settingsForm]);
  
  // Subnet form
  const subnetForm = useForm<z.infer<typeof subnetSchema>>({
    resolver: zodResolver(subnetSchema),
    defaultValues: {
      subnet: '',
      description: '',
    }
  });
  
  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (data: z.infer<typeof zabbixSettingsSchema>) => {
      const response = await apiRequest('POST', '/api/zabbix/settings', data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Settings Saved",
        description: "Zabbix monitoring settings have been updated",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/zabbix/settings'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to save settings: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Test connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: async (data: z.infer<typeof zabbixSettingsSchema>) => {
      const response = await apiRequest('POST', '/api/zabbix/test-connection', data);
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Connection Success",
        description: `Connected to Zabbix API at ${data.url}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Connection Failed",
        description: `Could not connect to Zabbix API: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Add subnet mutation
  const addSubnetMutation = useMutation({
    mutationFn: async (data: z.infer<typeof subnetSchema>) => {
      const response = await apiRequest('POST', '/api/zabbix/subnets', data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Subnet Added",
        description: "New subnet has been added for monitoring",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/zabbix/subnets'] });
      subnetForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add subnet: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Delete subnet mutation
  const deleteSubnetMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/zabbix/subnets/${id}`);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Subnet Removed",
        description: "Subnet has been removed from monitoring",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/zabbix/subnets'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to remove subnet: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Sync now mutation
  const syncNowMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/vm-monitoring/sync');
      return await response.json();
    },
    onSuccess: (data) => {
      setLastSyncTime(new Date().toISOString());
      toast({
        title: "Sync Complete",
        description: `Synchronized ${data.count} virtual machines`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/vm-monitoring'] });
      
      // WebSocket functionality temporarily disabled
      console.log('Sync complete:', data.count, 'VMs synchronized');
    },
    onError: (error) => {
      toast({
        title: "Sync Failed",
        description: `Failed to synchronize with Zabbix: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  function onSaveSettings(data: z.infer<typeof zabbixSettingsSchema>) {
    saveSettingsMutation.mutate(data);
  }
  
  function onTestConnection() {
    const values = settingsForm.getValues();
    testConnectionMutation.mutate(values);
  }
  
  function onAddSubnet(data: z.infer<typeof subnetSchema>) {
    addSubnetMutation.mutate(data);
  }
  
  function onDeleteSubnet(id: number) {
    deleteSubnetMutation.mutate(id);
  }
  
  function onSyncNow() {
    syncNowMutation.mutate();
  }
  
  function formatDateTime(dateTimeStr: string | null) {
    if (!dateTimeStr) return "Never";
    const date = new Date(dateTimeStr);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    }).format(date);
  }
  
  function getStatusBadge(status: string) {
    switch (status) {
      case 'running':
        return <Badge className="bg-green-500">Running</Badge>;
      case 'stopped':
        return <Badge className="bg-yellow-500">Stopped</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'warning':
        return <Badge className="bg-orange-500">Warning</Badge>;
      case 'maintenance':
        return <Badge className="bg-blue-500">Maintenance</Badge>;
      case 'unknown':
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  }
  
  // Filter VMs based on search query
  const filteredVMs = vmMonitoring.filter((vm: any) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      (vm.hostname && vm.hostname.toLowerCase().includes(query)) ||
      (vm.ipAddress && vm.ipAddress.toLowerCase().includes(query)) ||
      (vm.status && vm.status.toLowerCase().includes(query))
    );
  });
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">VM Monitoring</h1>
          <p className="text-muted-foreground">
            Monitor and manage virtual machines through Zabbix integration
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setActiveTab("settings")}
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            <span className="hidden md:inline">Settings</span>
          </Button>
          <Button
            onClick={onSyncNow}
            disabled={
              syncNowMutation.isPending ||
              !zabbixSettings?.url ||
              !zabbixSettings?.apiKey
            }
            className="flex items-center gap-2"
          >
            {syncNowMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span className="hidden md:inline">Sync Now</span>
          </Button>
        </div>
      </div>

      {/* WebSocket status indicator removed until WebSocket functionality is restored */}

      <div>
        <p className="text-sm text-muted-foreground">
          Last synchronized: {formatDateTime(lastSyncTime)}
        </p>
      </div>

      <Tabs
        defaultValue="monitoring"
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="monitoring" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Monitoring
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="monitoring" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <span>Virtual Machines</span>
                <div className="relative w-full max-w-xs">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search VMs..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </CardTitle>
              <CardDescription>
                Monitoring status and details of all virtual machines
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingVMs ? (
                <div className="flex justify-center items-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredVMs.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead>Hostname</TableHead>
                        <TableHead>IP Address</TableHead>
                        <TableHead>CPU Usage</TableHead>
                        <TableHead>Memory Usage</TableHead>
                        <TableHead>Disk Usage</TableHead>
                        <TableHead>Last Updated</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredVMs.map((vm: any) => (
                        <TableRow key={vm.id}>
                          <TableCell>{getStatusBadge(vm.status)}</TableCell>
                          <TableCell className="font-medium">{vm.hostname || 'Unknown'}</TableCell>
                          <TableCell>{vm.ipAddress}</TableCell>
                          <TableCell>
                            {vm.cpuUsage ? `${vm.cpuUsage}%` : 'N/A'}
                          </TableCell>
                          <TableCell>
                            {vm.memoryUsage ? `${vm.memoryUsage}%` : 'N/A'}
                          </TableCell>
                          <TableCell>
                            {vm.diskUsage ? `${vm.diskUsage}%` : 'N/A'}
                          </TableCell>
                          <TableCell>
                            {formatDateTime(vm.updatedAt)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="py-6 text-center">
                  <div className="mx-auto w-24 h-24 rounded-full bg-muted flex items-center justify-center">
                    <Server className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <h3 className="mt-4 text-lg font-medium">No VMs Found</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    No virtual machines have been discovered yet.<br />
                    {!zabbixSettings?.url || !zabbixSettings?.apiKey ? (
                      <span>Configure Zabbix integration in the settings tab.</span>
                    ) : (
                      <span>Click 'Sync Now' to fetch VMs from Zabbix.</span>
                    )}
                  </p>
                  {zabbixSettings?.url && zabbixSettings?.apiKey && (
                    <Button
                      onClick={onSyncNow}
                      className="mt-4"
                      disabled={syncNowMutation.isPending}
                    >
                      {syncNowMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="mr-2 h-4 w-4" />
                      )}
                      Sync Now
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Zabbix API Settings</CardTitle>
                <CardDescription>
                  Configure the connection to your Zabbix monitoring system
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingSettings ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <Form {...settingsForm}>
                    <form
                      onSubmit={settingsForm.handleSubmit(onSaveSettings)}
                      className="space-y-4"
                    >
                      <FormField
                        control={settingsForm.control}
                        name="url"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Zabbix URL</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="https://zabbix.example.com/api_jsonrpc.php"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              The URL of your Zabbix API endpoint
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={settingsForm.control}
                        name="apiKey"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>API Key / Token</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="Enter your Zabbix API key"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              API token for authentication with Zabbix
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={settingsForm.control}
                        name="autoSync"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5">
                              <FormLabel>Auto Synchronization</FormLabel>
                              <FormDescription>
                                Automatically sync VMs from Zabbix
                              </FormDescription>
                            </div>
                            <FormControl>
                              <div className="flex items-center space-x-2">
                                <CheckSquare
                                  className={`h-5 w-5 ${
                                    field.value
                                      ? "text-primary"
                                      : "text-muted-foreground"
                                  }`}
                                  onClick={() =>
                                    field.onChange(!field.value)
                                  }
                                />
                              </div>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={settingsForm.control}
                        name="syncInterval"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sync Interval (minutes)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={5}
                                max={1440}
                                {...field}
                                disabled={!settingsForm.watch("autoSync")}
                              />
                            </FormControl>
                            <FormDescription>
                              How often to sync data from Zabbix (5-1440 minutes)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex gap-2 pt-4">
                        <Button type="submit" disabled={saveSettingsMutation.isPending}>
                          {saveSettingsMutation.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : null}
                          Save Settings
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={onTestConnection}
                          disabled={
                            testConnectionMutation.isPending ||
                            !settingsForm.watch("url") ||
                            !settingsForm.watch("apiKey")
                          }
                        >
                          {testConnectionMutation.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : null}
                          Test Connection
                        </Button>
                      </div>
                    </form>
                  </Form>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monitoring Subnets</CardTitle>
                <CardDescription>
                  Define network subnets to monitor for virtual machines
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Form {...subnetForm}>
                  <form
                    onSubmit={subnetForm.handleSubmit(onAddSubnet)}
                    className="space-y-4"
                  >
                    <FormField
                      control={subnetForm.control}
                      name="subnet"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subnet (CIDR)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="192.168.1.0/24"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Enter subnet in CIDR format (e.g., 192.168.1.0/24)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={subnetForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Production network"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Optional description for this subnet
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      disabled={addSubnetMutation.isPending}
                    >
                      {addSubnetMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Add Subnet
                    </Button>
                  </form>
                </Form>

                <Separator className="my-4" />

                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Configured Subnets</h3>
                  {isLoadingSubnets ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : subnets.length > 0 ? (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Subnet</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="w-[100px]">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {subnets.map((subnet: any) => (
                            <TableRow key={subnet.id}>
                              <TableCell className="font-medium">
                                {subnet.subnet}
                              </TableCell>
                              <TableCell>{subnet.description || "-"}</TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => onDeleteSubnet(subnet.id)}
                                  disabled={deleteSubnetMutation.isPending}
                                >
                                  {deleteSubnetMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <span className="text-red-500">✕</span>
                                  )}
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
                      <p>No subnets configured yet.</p>
                      <p>Add subnets above to monitor specific networks.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}