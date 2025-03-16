import { useQuery } from "@tanstack/react-query";
import AdminSidebar from "@/components/AdminSidebar";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Link } from "wouter";
import {
  LucideUsers,
  LucideUserCheck,
  LucideClipboardList,
  LucideActivity
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface RecentActivity {
  id: number;
  title: string;
  status: "pending" | "active" | "complete";
  description: string;
  time: string;
}

export default function AdminDashboard() {
  const { data: elections, isLoading: electionsLoading } = useQuery({
    queryKey: ['/api/admin/elections'],
  });

  const { data: candidates, isLoading: candidatesLoading } = useQuery({
    queryKey: ['/api/admin/candidates', { electionId: 1 }],
  });

  // Mock recent activity data
  const recentActivities: RecentActivity[] = [
    {
      id: 1,
      title: "New candidate application",
      status: "pending",
      description: "Michael Stevens - Vice President",
      time: "15 minutes ago"
    },
    {
      id: 2,
      title: "Election started",
      status: "active",
      description: "Student Union Election 2023",
      time: "2 hours ago"
    },
    {
      id: 3,
      title: "Voter list uploaded",
      status: "complete",
      description: "3,528 eligible voters",
      time: "1 day ago"
    }
  ];

  return (
    <div className="flex flex-col md:flex-row gap-6">
      <AdminSidebar selectedNav="dashboard" />

      <div className="flex-1">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">Dashboard</h1>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {/* Card 1 - Total Voters */}
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                  <LucideUsers className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <div className="text-sm font-medium text-gray-500 truncate">
                    Total Voters
                  </div>
                  <div className="text-lg font-medium text-gray-900">
                    3,528
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-gray-50 px-4 py-4">
              <div className="text-sm">
                <Link href="/admin/voters" className="font-medium text-blue-600 hover:text-blue-500">
                  View all voters
                </Link>
              </div>
            </CardFooter>
          </Card>

          {/* Card 2 - Total Candidates */}
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                  <LucideUserCheck className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <div className="text-sm font-medium text-gray-500 truncate">
                    Total Candidates
                  </div>
                  <div className="text-lg font-medium text-gray-900">
                    {candidatesLoading ? "Loading..." : candidates?.length || 0}
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-gray-50 px-4 py-4">
              <div className="text-sm">
                <Link href="/admin/candidates" className="font-medium text-blue-600 hover:text-blue-500">
                  Manage candidates
                </Link>
              </div>
            </CardFooter>
          </Card>

          {/* Card 3 - Active Elections */}
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                  <LucideClipboardList className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <div className="text-sm font-medium text-gray-500 truncate">
                    Active Elections
                  </div>
                  <div className="text-lg font-medium text-gray-900">
                    {electionsLoading ? "Loading..." : 
                     elections?.filter((e: any) => e.status === 'active').length || 0}
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-gray-50 px-4 py-4">
              <div className="text-sm">
                <Link href="/admin/elections" className="font-medium text-blue-600 hover:text-blue-500">
                  View elections
                </Link>
              </div>
            </CardFooter>
          </Card>
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Voting Progress</h2>
          <Card>
            <CardContent className="pt-5">
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Voter Participation</span>
                <span className="text-sm font-medium text-gray-700">45%</span>
              </div>
              <Progress value={45} className="h-2.5" />
              <p className="mt-2 text-sm text-gray-500">1,587 out of 3,528 eligible voters have cast their votes</p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h2>
          <Card>
            <ul className="divide-y divide-gray-200">
              {recentActivities.map((activity) => (
                <li key={activity.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-blue-600 truncate">
                        {activity.title}
                      </p>
                      <div className="ml-2 flex-shrink-0 flex">
                        <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                          ${activity.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                            activity.status === 'active' ? 'bg-green-100 text-green-800' : 
                            'bg-green-100 text-green-800'}`}>
                          {activity.status === 'pending' ? 'Pending' : 
                           activity.status === 'active' ? 'Active' : 'Complete'}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                          {activity.description}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <LucideActivity className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                        <p>{activity.time}</p>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
