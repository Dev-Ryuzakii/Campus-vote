import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CandidateCard from "@/components/CandidateCard";
import VoteConfirmation from "@/components/VoteConfirmation";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";

interface VotingProps {
  electionId: number;
  user: {
    id: number;
    username: string;
    role: string;
    studentId?: string;
  };
}

interface Candidate {
  id: number;
  userId: number;
  positionId: number;
  manifesto: string;
  status: string;
  user: {
    name: string;
    studentId: string;
    department: string;
  };
}

interface Position {
  id: number;
  title: string;
  description: string;
}

interface BallotSection {
  position: Position;
  candidates: Candidate[];
}

export default function Voting({ electionId, user }: VotingProps) {
  const [selectedCandidates, setSelectedCandidates] = useState<Record<number, number>>({});
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [_, navigate] = useLocation();
  const { toast } = useToast();

  // Check if user has already voted
  const { data: ballot, isLoading, error } = useQuery({
    queryKey: [`/api/elections/${electionId}/ballot`],
    onError: (error) => {
      // If error is about already voted, redirect to results
      if (error instanceof Error && error.message.includes('already voted')) {
        toast({
          title: "Already Voted",
          description: "You have already cast your vote in this election.",
        });
        navigate(`/voter/results/${electionId}`);
      }
    }
  });

  const voteMutation = useMutation({
    mutationFn: async (votes: { positionId: number; candidateId: number }[]) => {
      return await apiRequest('POST', '/api/vote', {
        electionId,
        votes
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      setShowConfirmation(false);
      toast({
        title: "Vote Submitted",
        description: "Your vote has been recorded successfully.",
      });
      navigate(`/voter/results/${electionId}`);
    },
    onError: (error) => {
      setShowConfirmation(false);
      toast({
        title: "Error",
        description: "Failed to submit your vote. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleCandidateSelect = (positionId: number, candidateId: number) => {
    setSelectedCandidates((prev) => ({
      ...prev,
      [positionId]: candidateId
    }));
  };

  const handleVoteSubmit = () => {
    setShowConfirmation(true);
  };

  const handleConfirmVote = () => {
    const votes = Object.entries(selectedCandidates).map(([positionId, candidateId]) => ({
      positionId: Number(positionId),
      candidateId
    }));

    voteMutation.mutate(votes);
  };

  // Check if all positions have a selected candidate
  const allPositionsSelected = ballot?.ballot?.every(
    (section: BallotSection) => selectedCandidates[section.position.id]
  );

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !ballot) {
    return (
      <div className="text-center p-12">
        <h2 className="text-xl font-semibold text-red-600 mb-2">Error Loading Ballot</h2>
        <p className="text-gray-600">Unable to load the election ballot. Please try again later.</p>
        <Button className="mt-4" onClick={() => navigate("/voter")}>
          Return to Elections
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <Card>
          <CardContent className="pt-5 border-b border-gray-200">
            <h1 className="text-xl font-semibold text-gray-900">
              {ballot.election.title}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Please vote for one candidate per position
            </p>
          </CardContent>
        </Card>
      </div>

      {ballot.ballot.map((section: BallotSection) => (
        <div key={section.position.id} className="mb-8">
          <h2 className="text-xl font-medium text-gray-900 mb-4">{section.position.title}</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {section.candidates.map((candidate: Candidate) => (
              <CandidateCard
                key={candidate.id}
                candidate={candidate}
                isSelected={selectedCandidates[section.position.id] === candidate.id}
                onSelect={() => handleCandidateSelect(section.position.id, candidate.id)}
              />
            ))}
            {section.candidates.length === 0 && (
              <Card className="col-span-full">
                <CardContent className="pt-6 text-center p-8 text-gray-500">
                  No candidates are running for this position
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      ))}

      <div className="mt-8 flex justify-end">
        <Button 
          onClick={handleVoteSubmit} 
          disabled={!allPositionsSelected}
        >
          Submit Votes
        </Button>
      </div>

      {/* Vote Confirmation Modal */}
      <VoteConfirmation
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={handleConfirmVote}
        selections={selectedCandidates}
        ballot={ballot.ballot}
        isSubmitting={voteMutation.isPending}
      />
    </>
  );
}
