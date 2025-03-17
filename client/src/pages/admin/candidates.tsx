import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AdminSidebar from "@/components/AdminSidebar";
import { apiRequest } from "@/lib/queryClient";


interface Candidate {
  id: number;
  status: string;
  manifesto: string;
  position: string;
  election: {
    title: string;
  };
  name: string;
  studentId: string;
}

export default function Candidates() {
  const [selectedElectionId, setSelectedElectionId] = useState<number | null>(null);
  const [viewCandidate, setViewCandidate] = useState<Candidate | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: elections, isLoading: electionsLoading } = useQuery({
    queryKey: ['/api/admin/elections'],
  });

  const { data: candidates, isLoading: candidatesLoading } = useQuery({
    queryKey: ['/api/admin/candidates', { electionId: selectedElectionId }],
    enabled: !!selectedElectionId,
  });

  const deleteCandidate = useMutation({
    mutationFn: async (candidateId: number) => {
      const response = await fetch(`/api/admin/candidates/${candidateId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete candidate');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/candidates'] });
      toast({
        title: "Success",
        description: "Candidate deleted successfully",
      });
    }
  });

  return (
    <div className="flex flex-col md:flex-row gap-6">
      <AdminSidebar selectedNav="candidates" />
      <div className="flex-1 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Candidates</h1>
          <select
            className="border p-2 rounded"
            value={selectedElectionId || ""}
            onChange={(e) => setSelectedElectionId(Number(e.target.value) || null)}
          >
            <option value="">Select Election</option>
            {elections?.map((election: any) => (
              <option key={election.id} value={election.id}>
                {election.title}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-4">
          {candidatesLoading ? (
            <div className="px-4 py-8 text-center">Loading...</div>
          ) : !selectedElectionId ? (
            <div className="px-4 py-8 text-center text-gray-500">
              Please select an election to view candidates.
            </div>
          ) : !candidates || candidates.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500">
              No candidates found for this election.
            </div>
          ) : (
            candidates.map((candidate: Candidate) => (
              <Card key={candidate.id} className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{candidate.name}</h3>
                    <p className="text-sm text-gray-600">Student ID: {candidate.studentId}</p>
                    <p className="text-sm text-gray-600">Position: {candidate.position}</p>
                    <p className="text-sm text-gray-600">Status: {candidate.status}</p>
                  </div>
                  <div className="space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setViewCandidate(candidate)}
                    >
                      View Details
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => deleteCandidate.mutate(candidate.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        <Dialog open={!!viewCandidate} onOpenChange={() => setViewCandidate(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Candidate Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">Name</h3>
                <p>{viewCandidate?.name}</p>
              </div>
              <div>
                <h3 className="font-medium">Student ID</h3>
                <p>{viewCandidate?.studentId}</p>
              </div>
              <div>
                <h3 className="font-medium">Position</h3>
                <p>{viewCandidate?.position}</p>
              </div>
              <div>
                <h3 className="font-medium">Status</h3>
                <p>{viewCandidate?.status}</p>
              </div>
              <div>
                <h3 className="font-medium">Manifesto</h3>
                <p className="whitespace-pre-line">{viewCandidate?.manifesto}</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}