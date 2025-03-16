import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import ResultBar from "@/components/ResultBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

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

interface ResultsProps {
  electionId: number;
}

export default function Results({ electionId }: ResultsProps) {
  const [_, navigate] = useLocation();

  const { data: results, isLoading, error } = useQuery<ElectionResult>({
    queryKey: [`/api/elections/${electionId}/results`],
    onError: (error) => {
      if (error instanceof Error && error.message.includes('not available')) {
        // If results are not available yet, go back to voter home
        navigate('/voter');
      }
    }
  });

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !results) {
    return (
      <div className="text-center p-12">
        <h2 className="text-xl font-semibold text-red-600 mb-2">Results Not Available</h2>
        <p className="text-gray-600">The results for this election are not available yet or there was an error loading them.</p>
        <Button className="mt-4" onClick={() => navigate("/voter")}>
          Return to Elections
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">{results.electionTitle} - Results</h1>
        <Button variant="outline" size="sm" onClick={() => navigate("/voter")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Elections
        </Button>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-5 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Voting Statistics
          </h3>
        </CardContent>
        <CardContent className="pt-5">
          <dl className="grid grid-cols-1 gap-5 sm:grid-cols-3">
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
          </dl>
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
              {position.results.length === 0 ? (
                <li className="text-center text-gray-500 py-4">No votes recorded for this position</li>
              ) : (
                position.results.map((candidate, index) => (
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
                              <Badge className="ml-2 bg-green-100 text-green-800">
                                Winner
                              </Badge>
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
                ))
              )}
            </ul>
          </CardContent>
        </Card>
      ))}

      <div className="mt-6 flex justify-center">
        <Button variant="outline" onClick={() => navigate("/voter")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Elections
        </Button>
      </div>
    </>
  );
}
