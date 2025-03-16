import { useQuery } from "@tanstack/react-query";
import StatusCard from "@/components/StatusCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { CalendarIcon, ChevronDownIcon } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

interface StatusProps {
  candidateProfile: any[];
}

export default function Status({ candidateProfile }: StatusProps) {
  const [_, navigate] = useLocation();

  // Fetch active elections for results
  const { data: activeElections } = useQuery({
    queryKey: ['/api/elections/active'],
  });

  // If no profile, redirect to application
  if (!candidateProfile || candidateProfile.length === 0) {
    navigate('/candidate/application');
    return null;
  }

  const latestApplication = candidateProfile[0];
  
  // Check if any election is completed to show results
  const canViewResults = latestApplication?.election?.status === 'completed';
  
  return (
    <div className="space-y-8">
      <StatusCard application={latestApplication} />

      <Card>
        <CardHeader>
          <CardTitle>Election Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Election</h3>
              <p className="mt-1 text-lg font-semibold">{latestApplication?.election?.title}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Status</h3>
                <div className="mt-1 flex items-center">
                  {latestApplication?.election?.status === 'draft' && (
                    <Badge variant="outline" className="bg-gray-100">Draft</Badge>
                  )}
                  {latestApplication?.election?.status === 'active' && (
                    <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>
                  )}
                  {latestApplication?.election?.status === 'completed' && (
                    <Badge variant="default" className="bg-blue-100 text-blue-800">Completed</Badge>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Voting Period</h3>
                <p className="mt-1 flex items-center text-sm text-gray-700">
                  <CalendarIcon className="mr-1.5 h-4 w-4 text-gray-400" />
                  {latestApplication?.election?.startDate ? 
                    format(new Date(latestApplication.election.startDate), 'MMM dd, yyyy') : 
                    'Not yet scheduled'
                  }
                  {latestApplication?.election?.endDate && (
                    <>
                      <span className="mx-1">-</span>
                      {format(new Date(latestApplication.election.endDate), 'MMM dd, yyyy')}
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Election Results</CardTitle>
        </CardHeader>
        <CardContent>
          {canViewResults ? (
            <Button 
              onClick={() => navigate(`/candidate/results/${latestApplication.electionId}`)}
              className="w-full md:w-auto"
            >
              View Results
            </Button>
          ) : (
            <div className="text-center py-8">
              <div className="mx-auto h-16 w-16 text-gray-400">
                <CalendarIcon className="h-full w-full" />
              </div>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Election in progress</h3>
              <p className="mt-1 text-sm text-gray-500">
                Results will be available after the voting period ends.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
