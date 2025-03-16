import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AdminSidebar from "@/components/AdminSidebar";
import { Card, CardContent } from "@/components/ui/card";
import ResultBar from "@/components/ResultBar";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";

interface PositionResult {
  positionId: number;
  positionTitle: string;
  results: {
    candidateId: number;
    candidateName: string;
    candidateStudentId: string;
    votes: number;
    percentage: number;
  }[];
}

interface ElectionResult {
  electionId: number;
  electionTitle: string;
  totalEligibleVoters: number;
  totalVotesCast: number;
  voterTurnout: number;
  positionResults: PositionResult[];
}

export default function Results() {
  const [selectedElectionId, setSelectedElectionId] = useState<number | null>(null);
  const { toast } = useToast();

  const { data: elections, isLoading: electionsLoading } = useQuery({
    queryKey: ['/api/admin/elections'],
  });

  const { 
    data: results, 
    isLoading: resultsLoading,
    refetch: refetchResults
  } = useQuery<ElectionResult>({
    queryKey: ['/api/admin/results', selectedElectionId],
    enabled: !!selectedElectionId,
  });

  const declareWinnersMutation = useMutation({
    mutationFn: async () => {
      if (!selectedElectionId) return;
      return await apiRequest('PATCH', `/api/admin/elections/${selectedElectionId}`, { 
        status: 'completed' 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/elections'] });
      toast({
        title: "Success",
        description: "Winners declared! The election has been marked as completed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to declare winners. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleDeclareWinners = () => {
    declareWinnersMutation.mutate();
  };

  return (
    <div className="flex flex-col md:flex-row gap-6">
      <AdminSidebar selectedNav="results" />

      <div className="flex-1">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Election Results</h1>
          <div className="flex items-center gap-2">
            <select
              className="bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm font-medium text-gray-700 focus:outline-none"
              value={selectedElectionId || ""}
              onChange={(e) => setSelectedElectionId(Number(e.target.value) || null)}
            >
              <option value="">Select Election</option>
              {electionsLoading ? (
                <option value="" disabled>Loading elections...</option>
              ) : (
                elections?.map((election: any) => (
                  <option key={election.id} value={election.id}>
                    {election.title}
                  </option>
                ))
              )}
            </select>
            {selectedElectionId && (
              <Button 
                onClick={handleDeclareWinners} 
                className="bg-green-600 hover:bg-green-700"
                disabled={
                  declareWinnersMutation.isPending || 
                  (results && results.totalVotesCast === 0) ||
                  elections?.find((e: any) => e.id === selectedElectionId)?.status === 'completed'
                }
              >
                {declareWinnersMutation.isPending ? "Processing..." : "Declare Winners"}
              </Button>
            )}
          </div>
        </div>

        {!selectedElectionId ? (
          <Card>
            <CardContent className="pt-6 text-center text-gray-500 p-8">
              Please select an election to view results
            </CardContent>
          </Card>
        ) : resultsLoading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : !results || results.positionResults.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-gray-500 p-8">
              No results available for this election
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="mb-6">
              <CardContent className="pt-5 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Voting Statistics
                </h3>
              </CardContent>
              <CardContent className="pt-5">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                  <div className="px-4 py-5 bg-gray-50 shadow rounded-lg overflow-hidden sm:p-6">
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Eligible Voters
                    </dt>
                    <dd className="mt-1 text-3xl font-semibold text-gray-900">
                      {results.totalEligibleVoters}
                    </dd>
                  </div>
                  <div className="px-4 py-5 bg-gray-50 shadow rounded-lg overflow-hidden sm:p-6">
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Votes Cast
                    </dt>
                    <dd className="mt-1 text-3xl font-semibold text-gray-900">
                      {results.totalVotesCast}
                    </dd>
                  </div>
                  <div className="px-4 py-5 bg-gray-50 shadow rounded-lg overflow-hidden sm:p-6">
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Voter Turnout
                    </dt>
                    <dd className="mt-1 text-3xl font-semibold text-gray-900">
                      {results.voterTurnout}%
                    </dd>
                  </div>
                </div>
              </CardContent>
            </Card>

            {results.positionResults.map((position) => (
              <Card key={position.positionId} className="mb-6">
                <CardContent className="pt-5 border-b border-gray-200">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    {position.positionTitle}
                  </h3>
                </CardContent>
                <CardContent className="pt-5">
                  <ul className="space-y-4">
                    {position.results.map((candidate, index) => (
                      <li key={candidate.candidateId}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-semibold">
                              {candidate.candidateName.charAt(0)}
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">
                                {candidate.candidateName}
                                {index === 0 && position.results[0].votes > 0 && (
                                  <Badge className="ml-2 bg-green-100 text-green-800">Winner</Badge>
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="text-sm font-medium text-gray-900">
                            {candidate.votes} votes ({candidate.percentage}%)
                          </div>
                        </div>
                        <div className="mt-2">
                          <ResultBar percentage={candidate.percentage} />
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
