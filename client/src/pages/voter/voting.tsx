import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import CandidateCard from "@/components/CandidateCard";
import VoteConfirmation from "@/components/VoteConfirmation";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";

interface VotingProps {
  electionId?: number;
  user?: {
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

  const { data: ballot, isLoading } = useQuery({
    queryKey: [`/api/elections/${electionId}/positions`],
    onError: (error) => {
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
    mutationFn: async (votes: { candidateId: number, positionId: number }[]) => {
      return await apiRequest('POST', '/api/vote', {
        electionId: Number(electionId),
        votes
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/elections'] });
      toast({
        title: "Success",
        description: "Your vote has been recorded successfully.",
      });
      navigate(`/voter/results/${electionId}`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to cast vote. Please try again.",
        variant: "destructive",
      });
    }
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const handleConfirmVote = async () => {
    const votes = Object.entries(selectedCandidates).map(([positionId, candidateId]) => ({
      positionId: Number(positionId),
      candidateId
    }));
    await voteMutation.mutateAsync(votes);
  };

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">{ballot.election.title}</h1>

        {ballot.ballot.map((position: any) => (
          <div key={position.position.id} className="mb-8">
            <h2 className="text-xl font-semibold mb-4">{position.position.title}</h2>
            <div className="grid gap-4">
              {position.candidates.map((candidate: any) => (
                <Card key={candidate.id} className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">{candidate.name}</h3>
                      <p className="text-sm text-gray-600">{candidate.manifesto}</p>
                    </div>
                    <Button
                      onClick={() => {
                        setSelectedCandidates(prev => ({
                          ...prev,
                          [position.position.id]: candidate.id
                        }));
                        setShowConfirmation(true);
                      }}
                      disabled={selectedCandidates[position.position.id] === candidate.id}
                    >
                      {selectedCandidates[position.position.id] === candidate.id ? 'Selected' : 'Select'}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
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