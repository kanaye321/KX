import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import StatusCard from "@/components/dashboard/status-card";
import ActivityFeed from "@/components/dashboard/activity-feed";
import QuickActions from "@/components/dashboard/quick-actions";
import AssetTable from "@/components/assets/asset-table";

import { 
  ArrowUpIcon, 
  ArrowDownIcon, 
  BoxIcon,
  BoxesIcon, 
  UsersIcon, 
  KeyIcon,
  FileTextIcon 
} from "lucide-react";

interface DashboardStats {
  assets: {
    total: number;
    checkedOut: number;
    available: number;
    pending: number;
    overdue: number;
    archived: number;
  };
  users: {
    total: number;
  };
  activities: {
    total: number;
    recent: any[];
  };
  licenses: {
    total: number;
    active: number;
    expired: number;
  };
}

export default function Dashboard() {
  const { data: statsData, isLoading: isLoadingStats } = useQuery<DashboardStats>({ 
    queryKey: ['/api/stats'],
  });
  
  const { data: assets, isLoading: isLoadingAssets } = useQuery({
    queryKey: ['/api/assets'],
  });

  return (
    <div>
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-gray-100">Dashboard</h1>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Welcome to your SRPH-MIS Inventory Management System</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6 dashboard-stats">
        <StatusCard 
          title="Total Assets" 
          value={statsData?.assets.total || 0} 
          change={4.3}
          changeDirection="up"
          icon={<BoxesIcon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />}
          isLoading={isLoadingStats}
        />
        <StatusCard 
          title="Assets Checked Out" 
          value={statsData?.assets.checkedOut || 0} 
          change={2.7}
          changeDirection="down"
          icon={<BoxIcon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />}
          isLoading={isLoadingStats}
        />
        <StatusCard 
          title="Users" 
          value={statsData?.users.total || 0} 
          change={1.2}
          changeDirection="up"
          icon={<UsersIcon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />}
          isLoading={isLoadingStats}
        />
        <StatusCard 
          title="Licenses" 
          value={statsData?.licenses?.total || 0} 
          change={5.6}
          changeDirection="up"
          icon={<KeyIcon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />}
          isLoading={isLoadingStats}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 overflow-x-auto responsive-table">
          <AssetTable 
            assets={assets || []} 
            isLoading={isLoadingAssets}
            limit={5}
          />
        </div>
        <ActivityFeed activities={statsData?.activities.recent || []} isLoading={isLoadingStats} />
      </div>

      <div className="mt-4 sm:mt-6">
        <QuickActions />
      </div>
    </div>
  );
}
