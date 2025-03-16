import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminSidebar from "@/components/AdminSidebar";
import PositionsManager from "@/components/PositionsManager";
import NavBar from "@/components/NavBar";
import { useLocation } from "wouter";
import { ArrowLeft, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface ElectionDetailProps {
  user: {
    id: number;
    username: string;
    role: string;
  };
  onLogout: () => void;
}

export default function ElectionDetail({ user, onLogout }: ElectionDetailProps) {
  const [, setLocation] = useLocation();
  const [electionId, setElectionId] = useState<number | null>(null);
  const { toast } = useToast();
  
  // Get election ID from URL
  useEffect(() => {
    const path = window.location.pathname;
    const match = path.match(/\/admin\/elections\/(\d+)/);
    if (match && match[1]) {
      setElectionId(parseInt(match[1]));
    }
  }, []);

  const { data: election, isLoading } = useQuery({
    queryKey: ['/api/admin/elections', electionId],
    queryFn: async () => {
      if (!electionId) return null;
      const res = await apiRequest('GET', `/api/admin/elections/${electionId}`);
      return res.json();
    },
    enabled: !!electionId,
  });

  if (isLoading || !election) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavBar onLogout={onLogout} />
        
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row gap-6">
            <AdminSidebar selectedNav="elections" />
            
            <div className="flex-1">
              <div className="flex items-center space-x-4 mb-6">
                <Button 
                  variant="ghost" 
                  className="flex items-center text-blue-600" 
                  onClick={() => setLocation('/admin/elections')}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back to Elections
                </Button>
              </div>
              
              <div className="animate-pulse space-y-6">
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-12 bg-gray-200 rounded w-full"></div>
                <div className="h-24 bg-gray-200 rounded w-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'draft':
        return <Badge variant="outline">Draft</Badge>;
      case 'active':
        return <Badge variant="default" className="bg-green-500">Active</Badge>;
      case 'completed':
        return <Badge variant="secondary">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar onLogout={onLogout} />
      
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row gap-6">
          <AdminSidebar selectedNav="elections" />
          
          <div className="flex-1">
            <div className="flex items-center space-x-4 mb-6">
              <Button 
                variant="ghost" 
                className="flex items-center text-blue-600" 
                onClick={() => setLocation('/admin/elections')}
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Elections
              </Button>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="px-6 py-5">
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{election.title}</h1>
                    <p className="text-gray-500 mt-1">{election.description}</p>
                  </div>
                  <div>
                    {getStatusBadge(election.status)}
                  </div>
                </div>
                
                <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500">
                  <div className="flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-1 text-gray-400" />
                    <span>Created: {format(new Date(election.createdAt), 'MMM dd, yyyy')}</span>
                  </div>
                  
                  {election.startDate && (
                    <div className="flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-1 text-gray-400" />
                      <span>Starts: {format(new Date(election.startDate), 'MMM dd, yyyy')}</span>
                    </div>
                  )}
                  
                  {election.endDate && (
                    <div className="flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-1 text-gray-400" />
                      <span>Ends: {format(new Date(election.endDate), 'MMM dd, yyyy')}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <Separator />
              
              <div className="p-6">
                <Tabs defaultValue="positions">
                  <TabsList className="mb-6">
                    <TabsTrigger value="positions">Positions</TabsTrigger>
                    <TabsTrigger value="candidates">Candidates</TabsTrigger>
                    <TabsTrigger value="voters">Eligible Voters</TabsTrigger>
                    {election.status === 'completed' && (
                      <TabsTrigger value="results">Results</TabsTrigger>
                    )}
                  </TabsList>
                  
                  <TabsContent value="positions">
                    <PositionsManager electionId={election.id} />
                  </TabsContent>
                  
                  <TabsContent value="candidates">
                    <Card>
                      <CardHeader>
                        <CardTitle>Candidates</CardTitle>
                        <CardDescription>View and manage candidates for this election</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-center text-gray-500 py-8">
                          Candidate management will be implemented soon
                        </p>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="voters">
                    <Card>
                      <CardHeader>
                        <CardTitle>Eligible Voters</CardTitle>
                        <CardDescription>Manage the list of students eligible to vote in this election</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-center text-gray-500 py-8">
                          Voter management will be implemented soon
                        </p>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  {election.status === 'completed' && (
                    <TabsContent value="results">
                      <Card>
                        <CardHeader>
                          <CardTitle>Election Results</CardTitle>
                          <CardDescription>View the final results of this election</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-center text-gray-500 py-8">
                            Results will be displayed here once the election is completed
                          </p>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  )}
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}