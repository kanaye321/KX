import { BookOpen, Mail, AlertTriangle, Check, Database, Cog, UserCog, LifeBuoy } from "lucide-react";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger 
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

export default function UserManualPage() {
  return (
    <div className="container py-4 md:py-8 px-4 sm:px-6 max-w-5xl mx-auto">
      <div className="flex flex-wrap items-center gap-2 mb-4 md:mb-6">
        <BookOpen className="h-6 w-6 md:h-8 md:w-8 text-primary" />
        <h1 className="text-2xl md:text-3xl font-bold">SRPH-MIS User Manual</h1>
      </div>

      <div className="mb-8 md:mb-10">
        <Card className="overflow-hidden">
          <CardHeader className="pb-3 md:pb-4">
            <CardTitle className="text-xl md:text-2xl">Welcome to the SRPH-MIS Inventory Management System</CardTitle>
            <CardDescription className="mt-2">
              This user manual provides instructions for using the SRPH-MIS Inventory Management System.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 md:space-y-6">
            <p className="text-muted-foreground">
              SRPH-MIS is a comprehensive inventory management system designed for efficient asset tracking,
              management, and maintenance. This guide will help you navigate and utilize all the features of the system.
            </p>
            
            <Alert className="border-amber-200">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Important</AlertTitle>
              <AlertDescription>
                Please ensure you have appropriate permissions before performing administrative actions in the system.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="mb-6 grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          <TabsTrigger value="general" className="text-sm sm:text-base py-3">General Usage</TabsTrigger>
          <TabsTrigger value="assets" className="text-sm sm:text-base py-3">Asset Management</TabsTrigger>
          <TabsTrigger value="users" className="text-sm sm:text-base py-3">User Management</TabsTrigger>
          <TabsTrigger value="admin" className="text-sm sm:text-base py-3">Administration</TabsTrigger>
          <TabsTrigger value="troubleshooting" className="text-sm sm:text-base py-3">Troubleshooting</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <h2 className="text-xl md:text-2xl font-semibold mb-4 md:mb-6">General System Usage</h2>
          
          <Accordion type="single" collapsible className="w-full space-y-3">
            <AccordionItem value="dashboard">
              <AccordionTrigger>Dashboard Overview</AccordionTrigger>
              <AccordionContent className="space-y-2">
                <p>The dashboard provides an overview of your inventory system, displaying key metrics and status information:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Total assets count and distribution by status</li>
                  <li>Recent activities log</li>
                  <li>Alerts for maintenance or expiring licenses</li>
                  <li>Quick access to common functions</li>
                </ul>
                <p>Use the dashboard charts to get a visual representation of your inventory status and trends.</p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="navigation">
              <AccordionTrigger>Navigation</AccordionTrigger>
              <AccordionContent className="space-y-2">
                <p>Navigate through the system using the sidebar menu:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li><strong>Dashboard:</strong> Overview and analytics</li>
                  <li><strong>Assets:</strong> Hardware inventory management</li>
                  <li><strong>Licenses:</strong> Software license management</li>
                  <li><strong>Components:</strong> Internal components tracking</li>
                  <li><strong>Accessories:</strong> Peripheral management</li>
                  <li><strong>Users:</strong> User accounts and permissions</li>
                  <li><strong>Monitoring:</strong> VM monitoring and network discovery
                    <ul className="list-disc pl-6 mt-1">
                      <li><strong>VM Monitoring:</strong> Track virtual machines through Zabbix</li>
                      <li><strong>Network Discovery:</strong> Scan and inventory network devices</li>
                      <li><strong>Network Dashboard:</strong> View discovered hardware/software</li>
                    </ul>
                  </li>
                  <li><strong>Reports:</strong> Generate system reports</li>
                  <li><strong>Admin:</strong> System administration tools</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="search">
              <AccordionTrigger>Search Functionality</AccordionTrigger>
              <AccordionContent className="space-y-2">
                <p>The global search bar allows you to quickly find items across the system:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Search by asset tag, serial number, or name</li>
                  <li>Search for users by username or full name</li>
                  <li>Filter results by category or type</li>
                  <li>Use advanced search options for more specific queries</li>
                </ul>
                <p className="text-sm text-muted-foreground mt-2">Tip: Use quotation marks for exact phrase matching (e.g., "Dell Laptop")</p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </TabsContent>

        <TabsContent value="assets" className="space-y-6">
          <h2 className="text-xl md:text-2xl font-semibold mb-4 md:mb-6">Asset Management</h2>
          
          <Accordion type="single" collapsible className="w-full space-y-3">
            <AccordionItem value="adding-assets">
              <AccordionTrigger>Adding New Assets</AccordionTrigger>
              <AccordionContent className="space-y-2">
                <p>To add a new asset to the system:</p>
                <ol className="list-decimal pl-6 space-y-1">
                  <li>Navigate to the Assets section</li>
                  <li>Click the "Add Asset" button</li>
                  <li>Fill out the required information (asset tag, name, model, etc.)</li>
                  <li>Add optional details like purchase date, cost, and warranty information</li>
                  <li>Assign to a user if needed</li>
                  <li>Save the asset</li>
                </ol>
                <p className="mt-2">Assets can also be imported in bulk using the CSV import function.</p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="checkout-checkin">
              <AccordionTrigger>Checking Out and Checking In Assets</AccordionTrigger>
              <AccordionContent className="space-y-2">
                <p><strong>Checking Out:</strong></p>
                <ol className="list-decimal pl-6 space-y-1">
                  <li>Find the asset in the assets list</li>
                  <li>Click the "Checkout" button</li>
                  <li>Select the user to assign the asset to</li>
                  <li>Add notes and set an expected return date if applicable</li>
                  <li>Confirm the checkout</li>
                </ol>
                
                <p className="mt-2"><strong>Checking In:</strong></p>
                <ol className="list-decimal pl-6 space-y-1">
                  <li>Navigate to the asset details page</li>
                  <li>Click the "Checkin" button</li>
                  <li>Add any notes about the condition of the returned item</li>
                  <li>Confirm the checkin</li>
                </ol>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="asset-maintenance">
              <AccordionTrigger>Asset Maintenance</AccordionTrigger>
              <AccordionContent className="space-y-2">
                <p>Track maintenance for your assets:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Record maintenance activities with dates and descriptions</li>
                  <li>Schedule future maintenance</li>
                  <li>Set up maintenance reminders</li>
                  <li>Track maintenance costs</li>
                </ul>
                <p className="text-sm text-muted-foreground mt-2">Regular maintenance helps extend asset lifespan and reduce unexpected failures.</p>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="virtual-machine-inventory">
              <AccordionTrigger>Virtual Machine Inventory</AccordionTrigger>
              <AccordionContent className="space-y-3">
                <p>The system allows you to track and manage virtual machine inventory with detailed information:</p>
                
                <div className="rounded-md border p-4">
                  <h3 className="font-medium mb-2">Required Details for VM Records</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Host Information</h4>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        <li>Host IP Address</li>
                        <li>Host OS</li>
                        <li>Rack</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">VM Details</h4>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        <li>VM ID</li>
                        <li>VM Name</li>
                        <li>VM Status</li>
                        <li>VM IP</li>
                        <li>Internet Access (yes/no)</li>
                        <li>VM OS</li>
                        <li>VM OS Version</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Usage & Tracking</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        <li>Deployed By (User)</li>
                        <li>Department</li>
                        <li>Start Date</li>
                        <li>End Date</li>
                      </ul>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        <li>Jira Ticket Number</li>
                        <li>Remarks</li>
                        <li>Date Deleted</li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                <p>To manage virtual machines:</p>
                <ol className="list-decimal pl-6 space-y-1">
                  <li>Navigate to the Virtual Machines section</li>
                  <li>Add new VMs with the "Add VM" button</li>
                  <li>Update status as VMs are provisioned, running, or decommissioned</li>
                  <li>Track usage by department and user</li>
                  <li>Generate reports on VM utilization and availability</li>
                </ol>

                <div className="mt-4 rounded-md border p-4 bg-muted/50">
                  <h3 className="font-medium mb-2 flex items-center text-blue-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                    VM Decommissioning Process
                  </h3>
                  <p className="text-sm mb-2">To decommission a virtual machine:</p>
                  <ol className="list-decimal pl-6 space-y-1 text-sm">
                    <li>Find the VM in the virtual machines list</li>
                    <li>Click the menu icon (three dots) in the Actions column</li>
                    <li>Select "Decommission VM" from the dropdown menu</li>
                    <li>Confirm the decommission action in the dialog</li>
                  </ol>
                  <p className="text-sm mt-2">Decommissioned VMs remain in the system with the "Decommissioned" status, allowing you to maintain a complete history of all virtual machines. You can filter the VM list to show only decommissioned VMs by selecting "Decommissioned" in the status filter dropdown.</p>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <h2 className="text-xl md:text-2xl font-semibold mb-4 md:mb-6">User Management</h2>
          
          <Accordion type="single" collapsible className="w-full space-y-3">
            <AccordionItem value="user-accounts">
              <AccordionTrigger>User Accounts</AccordionTrigger>
              <AccordionContent className="space-y-2">
                <p>The system supports different types of user accounts:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li><strong>Administrators:</strong> Full system access</li>
                  <li><strong>Asset Managers:</strong> Can manage assets but have limited admin rights</li>
                  <li><strong>Regular Users:</strong> Limited access for viewing their assigned assets</li>
                </ul>
                <p className="mt-2">To create a new user account:</p>
                <ol className="list-decimal pl-6 space-y-1">
                  <li>Go to the Users section</li>
                  <li>Click "Add User"</li>
                  <li>Enter the required information (username, name, email)</li>
                  <li>Set permissions or assign a role</li>
                  <li>Save the user</li>
                </ol>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="permissions">
              <AccordionTrigger>Permissions and Roles</AccordionTrigger>
              <AccordionContent className="space-y-2">
                <p><strong>Roles:</strong></p>
                <p>The system uses role-based access control. Default roles include:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Administrator</li>
                  <li>Asset Manager</li>
                  <li>User Manager</li>
                  <li>Read Only</li>
                </ul>
                
                <p className="mt-2"><strong>Custom Roles:</strong></p>
                <p>To create a custom role:</p>
                <ol className="list-decimal pl-6 space-y-1">
                  <li>Navigate to User Permissions → Roles</li>
                  <li>Click "Create Role"</li>
                  <li>Name the role and add a description</li>
                  <li>Select the permissions to include</li>
                  <li>Save the role</li>
                </ol>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </TabsContent>

        <TabsContent value="admin" className="space-y-6">
          <h2 className="text-xl md:text-2xl font-semibold mb-4 md:mb-6">Administration</h2>
          
          <Accordion type="single" collapsible className="w-full space-y-3">
            <AccordionItem value="monitoring-features">
              <AccordionTrigger>Monitoring Features</AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">VM Monitoring</h3>
                  <p className="mb-2">The VM Monitoring feature integrates with Zabbix to track the status and performance of virtual machines:</p>
                  <ol className="list-decimal pl-6 space-y-1">
                    <li>Navigate to Monitoring → VM Monitoring</li>
                    <li>Configure your Zabbix connection in the Settings tab:
                      <ul className="list-disc pl-6 mt-1">
                        <li>Zabbix URL (e.g., http://107.105.168.201/zabbix)</li>
                        <li>API Key (generated from your Zabbix account)</li>
                        <li>Auto-sync settings</li>
                      </ul>
                    </li>
                    <li>Click "Sync Now" to retrieve VM data from Zabbix</li>
                    <li>View VM status, CPU usage, memory usage, and disk utilization</li>
                  </ol>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">Network Discovery</h3>
                  <p className="mb-2">The Network Discovery feature allows you to scan your network for devices and collect detailed information:</p>
                  <ol className="list-decimal pl-6 space-y-1">
                    <li>Navigate to Monitoring → Network Discovery</li>
                    <li>Configure subnets to scan (CIDR format, e.g., 192.168.1.0/24)</li>
                    <li>Enter DNS settings or use the defaults (107.105.134.9, 107.105.134.8)</li>
                    <li>Click "Start Scan" to begin discovery</li>
                    <li>View discovered hosts and their details</li>
                  </ol>
                  <p className="mt-2 text-sm text-muted-foreground">The system will attempt to detect hardware details, installed software, and connected peripherals from reachable hosts.</p>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">Network Discovery Dashboard</h3>
                  <p className="mb-2">The Network Dashboard provides detailed analytics on discovered devices:</p>
                  <ol className="list-decimal pl-6 space-y-1">
                    <li>Navigate to Monitoring → Network Dashboard</li>
                    <li>View summary charts of discovered devices, operating systems, and hardware</li>
                    <li>Explore tables for:
                      <ul className="list-disc pl-6 mt-1">
                        <li>Discovered devices with IP and hostname</li>
                        <li>Hardware details (CPU, RAM, storage)</li>
                        <li>Installed software</li>
                        <li>Connected peripherals</li>
                      </ul>
                    </li>
                    <li>Click the Eye icon to view detailed information for any device</li>
                    <li>Use the Refresh Data button to update the dashboard</li>
                  </ol>
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="system-settings">
              <AccordionTrigger>System Settings</AccordionTrigger>
              <AccordionContent className="space-y-2">
                <div className="flex items-center mb-2">
                  <Cog className="h-5 w-5 mr-2 text-muted-foreground" />
                  <h3 className="font-medium">General Settings</h3>
                </div>
                <p>Configure system-wide settings:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Site name and URL</li>
                  <li>Default language and timezone</li>
                  <li>Company information</li>
                  <li>Asset tag prefix</li>
                  <li>Email notification settings</li>
                </ul>
                
                <div className="flex items-center mt-4 mb-2">
                  <UserCog className="h-5 w-5 mr-2 text-muted-foreground" />
                  <h3 className="font-medium">Security Settings</h3>
                </div>
                <p>Configure security options:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Password requirements</li>
                  <li>Account lockout settings</li>
                  <li>Public registration options</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="database-management">
              <AccordionTrigger>Database Management</AccordionTrigger>
              <AccordionContent className="space-y-2">
                <div className="flex items-center mb-2">
                  <Database className="h-5 w-5 mr-2 text-muted-foreground" />
                  <h3 className="font-medium">Database Operations</h3>
                </div>
                <ul className="list-disc pl-6 space-y-1">
                  <li><strong>Backups:</strong> Create regular database backups</li>
                  <li><strong>Restore:</strong> Restore from a previous backup</li>
                  <li><strong>Optimize:</strong> Improve database performance</li>
                </ul>
                
                <Alert className="mt-4 bg-amber-50">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Important</AlertTitle>
                  <AlertDescription>
                    Always create a backup before performing any major database operations or system updates.
                  </AlertDescription>
                </Alert>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="user-permissions">
              <AccordionTrigger>User Permissions Management</AccordionTrigger>
              <AccordionContent className="space-y-2">
                <p>Manage user access and roles:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Assign roles to users</li>
                  <li>Create and configure custom roles</li>
                  <li>Grant specific permissions to users</li>
                  <li>Set administrator access</li>
                </ul>
                <p className="text-sm text-muted-foreground mt-2">Follow the principle of least privilege: only give users the permissions they need to perform their job.</p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </TabsContent>

        <TabsContent value="troubleshooting" className="space-y-6">
          <h2 className="text-xl md:text-2xl font-semibold mb-4 md:mb-6">Troubleshooting</h2>
          
          <Accordion type="single" collapsible className="w-full space-y-3">
            <AccordionItem value="common-issues">
              <AccordionTrigger>Common Issues</AccordionTrigger>
              <AccordionContent className="space-y-2">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium">Login Problems</h3>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>Ensure your username and password are correct</li>
                      <li>Check if your account is locked due to too many failed attempts</li>
                      <li>Clear browser cache and cookies</li>
                      <li>Contact an administrator if the issue persists</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-medium">Asset Not Showing</h3>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>Verify you have permission to view the asset</li>
                      <li>Check if search filters are limiting your results</li>
                      <li>Ensure the asset has not been archived</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-medium">Database Errors</h3>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>Check database connection settings</li>
                      <li>Ensure the database service is running</li>
                      <li>Try optimizing the database</li>
                      <li>Restore from a recent backup if necessary</li>
                    </ul>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="contact-support">
              <AccordionTrigger>Contact Support</AccordionTrigger>
              <AccordionContent className="space-y-5">
                <p>If you encounter issues not covered in this manual or need additional help, please contact support:</p>
                
                <div className="rounded-md border p-4 md:p-5">
                  <div className="flex items-center">
                    <div className="mr-3">
                      <LifeBuoy className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-medium">Support Contact Information</h3>
                      <div className="mt-1">
                        <p className="flex items-center text-sm">
                          <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>Nikkel Jimenez (jimenez.n)</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="rounded-md border p-4 md:p-5 bg-green-50">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <Check className="h-5 w-5 text-green-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-800">When contacting support, please include:</h3>
                      <div className="mt-2 text-sm text-green-700">
                        <ul className="list-disc space-y-1 pl-5">
                          <li>Detailed description of the issue</li>
                          <li>Steps to reproduce the problem</li>
                          <li>Screenshots if applicable</li>
                          <li>Browser and operating system information</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <Alert>
                  <AlertTitle>Bug Reports and Feature Suggestions</AlertTitle>
                  <AlertDescription>
                    If you find a bug or have a suggestion for improving the system, please email Nikkel Jimenez (Knox ID: jimenez.n).
                    Your feedback helps us improve the system for everyone.
                  </AlertDescription>
                </Alert>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </TabsContent>
      </Tabs>
    </div>
  );
}