import { Route, Switch } from "wouter";
import NavBar from "@/components/NavBar";
import { useQuery } from "@tanstack/react-query";
import Voting from "./voting";
import Results from "./results";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { ClipboardList, BarChart2 } from "lucide-react";
import { format } from "date-fns";

interface VoterPanelProps {
  user: {
    id: number;
    username: string;
    role: string;
    studentId?: string;
  };
  onLogout: () => void;
}

export default function VoterPanel({ user, onLogout }: VoterPanelProps) {
  const { data: activeElections, isLoading } = useQuery({
    queryKey: ['/api/elections/active'],
  });

  return (
    <div className="min-h-screen bg-gray-100">
      <NavBar onLogout={onLogout} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Switch>
          <Route path="/voter/election/:id">
            {(params) => <Voting electionId={Number(params.id)} user={user} />}
          </Route>
          <Route path="/voter/results/:id">
            {(params) => <Results electionId={Number(params.id)} />}
          </Route>
          <Route path="/voter">
            <h1 className="text-2xl font-semibold text-gray-900 mb-6">Available Elections</h1>
            
            {isLoading ? (
              <div className="flex justify-center p-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : !activeElections || activeElections.length === 0 ? (
              <Card>
                <CardContent className="pt-6 flex flex-col items-center justify-center py-12">
                  <ClipboardList className="h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">No Active Elections</h3>
                  <p className="text-sm text-gray-500 mt-2 text-center max-w-md">
                    There are no active elections at the moment. Please check back later.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {activeElections.map((election: any) => (
                  <Card key={election.id} className="overflow-hidden">
                    <CardHeader className="bg-blue-50 pb-3">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-xl">{election.title}</CardTitle>
                        <Badge className={election.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
                          {election.status === 'active' ? 'Active' : 'Completed'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="space-y-4">
                        <p className="text-sm text-gray-600">{election.description}</p>
                        <div className="text-sm text-gray-500">
                          {election.startDate && (
                            <div className="flex items-center mb-1">
                              <span className="font-medium mr-2">Start Date:</span>
                              {format(new Date(election.startDate), 'MMM dd, yyyy')}
                            </div>
                          )}
                          {election.endDate && (
                            <div className="flex items-center">
                              <span className="font-medium mr-2">End Date:</span>
                              {format(new Date(election.endDate), 'MMM dd, yyyy')}
                            </div>
                          )}
                        </div>
                        <div className="flex space-x-3 pt-2">
                          {election.status === 'active' && (
                            <Button asChild className="flex-1">
                              <Link href={`/voter/election/${election.id}`}>
                                <ClipboardList className="h-4 w-4 mr-2" />
                                Vote Now
                              </Link>
                            </Button>
                          )}
                          {election.status === 'completed' && (
                            <Button asChild variant="outline" className="flex-1">
                              <Link href={`/voter/results/${election.id}`}>
                                <BarChart2 className="h-4 w-4 mr-2" />
                                View Results
                              </Link>
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </Route>
        </Switch>
      </div>
    </div>
  );
}
