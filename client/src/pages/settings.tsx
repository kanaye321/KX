import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Globe, SaveIcon, Bell, ShieldCheck, AlertTriangle, CheckCircle, Upload } from "lucide-react";

export default function Settings() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [siteName, setSiteName] = useState("SRPH-MIS");
  const [headerTitle, setHeaderTitle] = useState("SRPH-MIS");
  const [language, setLanguage] = useState("english");
  const [colorScheme, setColorScheme] = useState("default");
  
  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [assetCheckoutNotifications, setAssetCheckoutNotifications] = useState(true);
  const [lowInventoryNotifications, setLowInventoryNotifications] = useState(true);
  
  // Security settings
  const [requireUserLogin, setRequireUserLogin] = useState(true);
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);
  const [passwordRequirements, setPasswordRequirements] = useState({
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: false
  });

  // Apply color scheme to CSS variables
  const applyColorScheme = (scheme: string) => {
    const root = document.documentElement;
    
    switch(scheme) {
      case 'default':
        root.style.setProperty('--primary', '207 90% 54%');
        root.style.setProperty('--primary-foreground', '211 100% 99%');
        break;
      case 'green':
        root.style.setProperty('--primary', '142 71% 45%');
        root.style.setProperty('--primary-foreground', '144 100% 99%');
        break;
      case 'red':
        root.style.setProperty('--primary', '0 84% 60%');
        root.style.setProperty('--primary-foreground', '0 100% 99%');
        break;
      case 'purple':
        root.style.setProperty('--primary', '262 83% 58%');
        root.style.setProperty('--primary-foreground', '265 100% 99%');
        break;
      case 'orange':
        root.style.setProperty('--primary', '24 95% 53%');
        root.style.setProperty('--primary-foreground', '25 100% 99%');
        break;
    }
  };

  const handleSaveSettings = () => {
    setIsLoading(true);
    
    // Apply the selected color scheme
    applyColorScheme(colorScheme);
    
    // Simulate API call to save settings
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Settings Saved",
        description: "Your settings have been successfully updated.",
      });
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Settings</h1>
          <p className="text-sm text-gray-600">Configure system settings and preferences</p>
        </div>
        <Button onClick={handleSaveSettings} disabled={isLoading}>
          <SaveIcon className="mr-2 h-4 w-4" />
          {isLoading ? "Saving..." : "Save Settings"}
        </Button>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Language Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="max-w-md">
                <Label htmlFor="language">System Language</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="english">English</SelectItem>
                    <SelectItem value="spanish">Spanish</SelectItem>
                    <SelectItem value="french">French</SelectItem>
                    <SelectItem value="german">German</SelectItem>
                    <SelectItem value="japanese">Japanese</SelectItem>
                    <SelectItem value="chinese">Chinese (Simplified)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500 mt-1">
                  This will change the language for all system interfaces.
                </p>
              </div>

              <div className="max-w-md mt-6">
                <Label htmlFor="timezone">Timezone</Label>
                <Select defaultValue="utc">
                  <SelectTrigger>
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="utc">UTC</SelectItem>
                    <SelectItem value="est">Eastern Time (ET)</SelectItem>
                    <SelectItem value="cst">Central Time (CT)</SelectItem>
                    <SelectItem value="mst">Mountain Time (MT)</SelectItem>
                    <SelectItem value="pst">Pacific Time (PT)</SelectItem>
                    <SelectItem value="jst">Japan Standard Time (JST)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500 mt-1">
                  All dates and times will be displayed in this timezone.
                </p>
              </div>

              <div className="max-w-md mt-6">
                <Label htmlFor="dateFormat">Date Format</Label>
                <Select defaultValue="yyyy-mm-dd">
                  <SelectTrigger>
                    <SelectValue placeholder="Select date format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yyyy-mm-dd">YYYY-MM-DD</SelectItem>
                    <SelectItem value="mm-dd-yyyy">MM-DD-YYYY</SelectItem>
                    <SelectItem value="dd-mm-yyyy">DD-MM-YYYY</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500 mt-1">
                  Choose how dates should be displayed throughout the system.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Maintenance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox id="cache" defaultChecked />
                <Label htmlFor="cache">Clear application cache on save</Label>
              </div>
              
              <div className="flex items-center space-x-2 mt-2">
                <Checkbox id="backup" />
                <Label htmlFor="backup">Create automatic database backup</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="branding" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Branding Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="max-w-md">
                <Label htmlFor="siteName">Site Name</Label>
                <Input 
                  id="siteName" 
                  value={siteName} 
                  onChange={(e) => setSiteName(e.target.value)} 
                  placeholder="SRPH-MIS"
                />
                <p className="text-sm text-gray-500 mt-1">
                  This will appear in the title bar of the browser.
                </p>
              </div>
              
              <div className="max-w-md mt-4">
                <Label htmlFor="headerTitle">Header Title</Label>
                <Input 
                  id="headerTitle" 
                  value={headerTitle} 
                  onChange={(e) => setHeaderTitle(e.target.value)} 
                  placeholder="SRPH-MIS"
                />
                <p className="text-sm text-gray-500 mt-1">
                  This will appear in the header of every page.
                </p>
              </div>
              
              <div className="mt-6">
                <Label>Logo</Label>
                <div className="flex items-center mt-2">
                  <div className="border rounded-md flex items-center justify-center bg-gray-50 w-28 h-28 mr-4">
                    <span className="text-gray-400">No logo</span>
                  </div>
                  <div>
                    <Button variant="outline" size="sm" className="mb-2">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Logo
                    </Button>
                    <p className="text-sm text-gray-500">
                      Recommended size: 200x200px. Max size: 1MB.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <Label>Favicon</Label>
                <div className="flex items-center mt-2">
                  <div className="border rounded-md flex items-center justify-center bg-gray-50 w-16 h-16 mr-4">
                    <span className="text-gray-400">No icon</span>
                  </div>
                  <div>
                    <Button variant="outline" size="sm" className="mb-2">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Favicon
                    </Button>
                    <p className="text-sm text-gray-500">
                      Recommended size: 32x32px. Max size: 500KB.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <Label htmlFor="colorScheme">Color Scheme</Label>
                <Select value={colorScheme} onValueChange={setColorScheme}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select color scheme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default Blue</SelectItem>
                    <SelectItem value="green">Corporate Green</SelectItem>
                    <SelectItem value="red">Classic Red</SelectItem>
                    <SelectItem value="purple">Royal Purple</SelectItem>
                    <SelectItem value="orange">Vibrant Orange</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable email notifications for various system events
                    </p>
                  </div>
                  <Switch 
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Asset Checkout/Checkin</Label>
                    <p className="text-sm text-muted-foreground">
                      Notify when assets are checked out or returned
                    </p>
                  </div>
                  <Switch 
                    checked={assetCheckoutNotifications}
                    onCheckedChange={setAssetCheckoutNotifications}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Low Inventory Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Notify when consumables or accessories are running low
                    </p>
                  </div>
                  <Switch 
                    checked={lowInventoryNotifications}
                    onCheckedChange={setLowInventoryNotifications}
                  />
                </div>
              </div>
              
              <div className="mt-8">
                <Label>Email Settings</Label>
                <div className="grid gap-4 mt-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="emailServer" className="text-right">
                      SMTP Server
                    </Label>
                    <Input id="emailServer" placeholder="smtp.example.com" className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="emailPort" className="text-right">
                      SMTP Port
                    </Label>
                    <Input id="emailPort" placeholder="587" className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="emailUsername" className="text-right">
                      Username
                    </Label>
                    <Input id="emailUsername" placeholder="notifications@example.com" className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="emailPassword" className="text-right">
                      Password
                    </Label>
                    <Input id="emailPassword" type="password" placeholder="••••••••" className="col-span-3" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="security" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                Security Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Require User Login</Label>
                    <p className="text-sm text-muted-foreground">
                      Restrict system access to authenticated users only
                    </p>
                  </div>
                  <Switch 
                    checked={requireUserLogin}
                    onCheckedChange={setRequireUserLogin}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">
                      Add an extra layer of security with 2FA
                    </p>
                  </div>
                  <Switch 
                    checked={twoFactorAuth}
                    onCheckedChange={setTwoFactorAuth}
                  />
                </div>
              </div>
              
              <div className="mt-8 border rounded-md p-4">
                <Label className="text-base">Password Requirements</Label>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="minLength" className="w-48">Minimum Length</Label>
                    <Input
                      id="minLength"
                      type="number"
                      min="6"
                      max="20"
                      className="w-20"
                      value={passwordRequirements.minLength}
                      onChange={(e) => setPasswordRequirements({
                        ...passwordRequirements,
                        minLength: parseInt(e.target.value)
                      })}
                    />
                    <span className="text-sm text-gray-500">characters</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="requireUppercase"
                      checked={passwordRequirements.requireUppercase}
                      onCheckedChange={(checked) => setPasswordRequirements({
                        ...passwordRequirements,
                        requireUppercase: checked === true
                      })}
                    />
                    <Label htmlFor="requireUppercase">Require at least one uppercase letter</Label>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="requireLowercase"
                      checked={passwordRequirements.requireLowercase}
                      onCheckedChange={(checked) => setPasswordRequirements({
                        ...passwordRequirements,
                        requireLowercase: checked === true
                      })}
                    />
                    <Label htmlFor="requireLowercase">Require at least one lowercase letter</Label>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="requireNumbers"
                      checked={passwordRequirements.requireNumbers}
                      onCheckedChange={(checked) => setPasswordRequirements({
                        ...passwordRequirements,
                        requireNumbers: checked === true
                      })}
                    />
                    <Label htmlFor="requireNumbers">Require at least one number</Label>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="requireSpecialChars"
                      checked={passwordRequirements.requireSpecialChars}
                      onCheckedChange={(checked) => setPasswordRequirements({
                        ...passwordRequirements,
                        requireSpecialChars: checked === true
                      })}
                    />
                    <Label htmlFor="requireSpecialChars">Require at least one special character</Label>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 border rounded-md p-4 bg-amber-50">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-amber-900">Security Recommendations</h3>
                    <ul className="mt-2 space-y-1 text-sm text-amber-800">
                      <li className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Enable two-factor authentication for all admin accounts
                      </li>
                      <li className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Set stronger password requirements
                      </li>
                      <li className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Regularly review user access permissions
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}