import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { PlusIcon, SearchIcon, FileDownIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { downloadCSV } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { User } from "@shared/schema";
import UserTable from "@/components/users/user-table";
import UserForm from "@/components/users/user-form";

export default function Users() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/users', data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      setIsAddDialogOpen(false);
      toast({
        title: "User created",
        description: "The user has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    }
  });

  const filteredUsers = users ? users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.department && user.department.toLowerCase().includes(searchTerm.toLowerCase()))
  ) : [];

  const handleExport = () => {
    if (users && users.length > 0) {
      // Create a safe version of the data without passwords
      const safeUsers = users.map(({ password, ...rest }) => ({
        ...rest,
        password: '********' // Replace with placeholder
      }));
      downloadCSV(safeUsers, 'users-export.csv');
      toast({
        title: "Export successful",
        description: "Users data has been exported to CSV",
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
          <h1 className="text-2xl font-semibold text-gray-800">Users</h1>
          <p className="text-sm text-gray-600">Manage system users</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative max-w-md w-full">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search users..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" onClick={handleExport}>
          <FileDownIcon className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      <UserTable 
        users={filteredUsers} 
        isLoading={isLoading} 
      />

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
          </DialogHeader>
          <UserForm 
            onSubmit={(data) => createUserMutation.mutate(data)} 
            isLoading={createUserMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
