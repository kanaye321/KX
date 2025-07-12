import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { 
  MenuIcon, 
  BellIcon, 
  ChevronDownIcon, 
  SearchIcon,
  LogOutIcon,
  UserIcon,
  SettingsIcon
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/hooks/use-auth";

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export default function Header({ sidebarOpen, setSidebarOpen }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { user, logoutMutation } = useAuth();
  const [_, navigate] = useLocation();
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Implement search functionality here
      console.log("Searching for:", searchQuery);
    }
  };

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        navigate("/auth");
      }
    });
  };

  // Get initials for avatar
  const getInitials = (): string => {
    if (!user) return "?";
    
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <header className="bg-card shadow-sm z-10">
      <div className="flex justify-between items-center px-4 h-16">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="mr-4 lg:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            <MenuIcon className="h-6 w-6 text-gray-500" />
          </Button>
          <form onSubmit={handleSearch} className="relative max-w-md w-full lg:max-w-xs hidden sm:block">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search..."
              className="pl-10 pr-4 py-2 rounded-lg border border-gray-300"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
        </div>
        <div className="flex items-center space-x-1 sm:space-x-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            className="mr-0 sm:mr-2 text-gray-500 hover:text-primary hidden sm:flex"
            aria-label="Notifications"
          >
            <BellIcon className="h-6 w-6" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center p-1 sm:p-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-white">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <span className="ml-2 text-sm font-medium text-gray-700 hidden md:block">
                  {user ? `${user.firstName} ${user.lastName}` : "User"}
                </span>
                <ChevronDownIcon className="h-5 w-5 ml-0 sm:ml-1 text-gray-400 hidden sm:block" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Link href="/profile" className="flex w-full">
                  <UserIcon className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link href="/settings" className="flex w-full">
                  <SettingsIcon className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-red-500 cursor-pointer" 
                onClick={handleLogout}
              >
                <div className="flex items-center w-full">
                  <LogOutIcon className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Mobile search bar - only shown on small screens */}
      <div className="px-4 pb-3 sm:hidden">
        <form onSubmit={handleSearch} className="relative w-full">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search..."
            className="pl-10 pr-4 py-2 w-full rounded-lg border border-gray-300"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>
      </div>
    </header>
  );
}
