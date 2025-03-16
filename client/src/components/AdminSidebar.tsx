import { cn } from "@/lib/utils";
import { LucideHome, LucideClipboardList, LucideUsers, LucideUserCheck, LucideBarChart2 } from "lucide-react";
import { Link, useLocation } from "wouter";

interface AdminSidebarProps {
  selectedNav: string;
}

export default function AdminSidebar({ selectedNav }: AdminSidebarProps) {
  const [location] = useLocation();

  const isActive = (path: string) => {
    return location === `/admin${path}`;
  };

  return (
    <div className="w-full md:w-64 flex-shrink-0">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 border-b">
          <h3 className="text-lg font-medium">Admin Panel</h3>
        </div>
        <nav className="p-4 space-y-1">
          <Link href="/admin">
            <a className={cn(
              "group flex items-center px-3 py-2 text-sm font-medium rounded-md cursor-pointer",
              isActive('') ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-50"
            )}>
              <LucideHome className="mr-3 h-5 w-5" />
              Dashboard
            </a>
          </Link>

          <Link href="/admin/elections">
            <a className={cn(
              "group flex items-center px-3 py-2 text-sm font-medium rounded-md cursor-pointer",
              isActive('/elections') ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-50"
            )}>
              <LucideClipboardList className="mr-3 h-5 w-5" />
              Elections
            </a>
          </Link>

          <Link href="/admin/voters">
            <a className={cn(
              "group flex items-center px-3 py-2 text-sm font-medium rounded-md cursor-pointer",
              isActive('/voters') ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-50"
            )}>
              <LucideUsers className="mr-3 h-5 w-5" />
              Voters
            </a>
          </Link>

          <Link href="/admin/candidates">
            <a className={cn(
              "group flex items-center px-3 py-2 text-sm font-medium rounded-md cursor-pointer",
              isActive('/candidates') ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-50"
            )}>
              <LucideUserCheck className="mr-3 h-5 w-5" />
              Candidates
            </a>
          </Link>

          <Link href="/admin/results">
            <a className={cn(
              "group flex items-center px-3 py-2 text-sm font-medium rounded-md cursor-pointer",
              isActive('/results') ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-50"
            )}>
              <LucideBarChart2 className="mr-3 h-5 w-5" />
              Results
            </a>
          </Link>
        </nav>
      </div>
    </div>
  );
}
