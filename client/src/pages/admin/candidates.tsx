import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AdminSidebar from "@/components/AdminSidebar";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Eye, Check, X } from "lucide-react";

interface Candidate {
  id: number;
  userId: number;
  positionId: number;
  manifesto: string;
  status: 'pending' | 'approved' | 'rejected';
  electionId: number;
  user: {
    id: number;
    username: string;
    name: string;
    studentId: string;
    department: string;
  };
  position: {
    id: number;
    title: string;
    description: string;
  };
}

export default function Candidates() {
  const [selectedElectionId, setSelectedElectionId] = useState<number | null>(null);
  const [viewCandidate, setViewCandidate] = useState<Candidate | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const { toast } = useToast();

  const { data: elections, isLoading: electionsLoading } = useQuery({
    queryKey: ['/api/admin/elections'],
  });

  const { data: candidates, isLoading: candidatesLoading } = useQuery({
    queryKey: ['/api/admin/candidates', { electionId: selectedElectionId }],
    enabled: !!selectedElectionId,
  });

  const updateCandidateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: 'pending' | 'approved' | 'rejected' }) => {
      return await apiRequest('PATCH', `/api/admin/candidates/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/candidates'] });
      toast({
        title: "Success",
        description: "Candidate status updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update candidate status",
        variant: "destructive",
      });
    }
  });

  const handleViewCandidate = (candidate: Candidate) => {
    setViewCandidate(candidate);
    setShowViewDialog(true);
  };

  const handleStatusChange = (candidateId: number, status: 'pending' | 'approved' | 'rejected') => {
    updateCandidateStatusMutation.mutate({ id: candidateId, status });
  };

  // Helper function to get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="flex flex-col md:flex-row gap-6">
      <AdminSidebar selectedNav="candidates" />

      <div className="flex-1">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Candidate Management</h1>
          <div>
            <select
              className="bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm font-medium text-gray-700 focus:outline-none"
              value={selectedElectionId || ""}
              onChange={(e) => setSelectedElectionId(Number(e.target.value) || null)}
            >
              <option value="">All Elections</option>
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
          </div>
        </div>

        <div className="bg-white shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
          <div className="flex bg-gray-50 px-4 py-3 border-b border-gray-200">
            <div className="flex-1 text-sm font-medium text-gray-700">Candidate</div>
            <div className="w-32 text-sm font-medium text-gray-700">Position</div>
            <div className="w-32 text-sm font-medium text-gray-700">Status</div>
            <div className="w-32 text-sm font-medium text-gray-700">Actions</div>
          </div>
          {candidatesLoading ? (
            <div className="px-4 py-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : !selectedElectionId ? (
            <div className="px-4 py-8 text-center text-gray-500">
              Please select an election to view candidates.
            </div>
          ) : !candidates || candidates.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500">
              No candidates found for this election.
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {candidates.map((candidate: Candidate) => (
                <li key={candidate.id}>
                  <div className="px-4 py-4 flex items-center">
                    <div className="flex-1 flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <Avatar>
                          <AvatarFallback>{getInitials(candidate.user.name)}</AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {candidate.user.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {candidate.user.studentId}
                        </div>
                      </div>
                    </div>
                    <div className="w-32 text-sm text-gray-900">{candidate.position.title}</div>
                    <div className="w-32">
                      {candidate.status === 'approved' ? (
                        <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
                          Approved
                        </Badge>
                      ) : candidate.status === 'rejected' ? (
                        <Badge variant="default" className="bg-red-100 text-red-800 hover:bg-red-100">
                          Rejected
                        </Badge>
                      ) : (
                        <Badge variant="default" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                          Pending
                        </Badge>
                      )}
                    </div>
                    <div className="w-32 flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewCandidate(candidate)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {candidate.status === 'pending' && (
                        <>
                          <Button
                            variant="default"
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleStatusChange(candidate.id, 'approved')}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleStatusChange(candidate.id, 'rejected')}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {candidate.status === 'rejected' && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleStatusChange(candidate.id, 'approved')}
                        >
                          Reconsider
                        </Button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* View Candidate Dialog */}
        <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Candidate Information</DialogTitle>
              {viewCandidate && (
                <DialogDescription>
                  {viewCandidate.user.name} - {viewCandidate.position.title}
                </DialogDescription>
              )}
            </DialogHeader>
            {viewCandidate && (
              <div className="py-4">
                <div className="flex items-center mb-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>{getInitials(viewCandidate.user.name)}</AvatarFallback>
                  </Avatar>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium">{viewCandidate.user.name}</h3>
                    <p className="text-sm text-gray-500">{viewCandidate.user.department}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Student ID</h4>
                    <p>{viewCandidate.user.studentId}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Position</h4>
                    <p>{viewCandidate.position.title}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Manifesto</h4>
                  <div className="bg-gray-50 p-3 rounded text-sm">
                    {viewCandidate.manifesto}
                  </div>
                </div>

                <div className="flex justify-between">
                  <h4 className="text-sm font-medium text-gray-500">Status</h4>
                  {viewCandidate.status === 'approved' ? (
                    <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
                      Approved
                    </Badge>
                  ) : viewCandidate.status === 'rejected' ? (
                    <Badge variant="default" className="bg-red-100 text-red-800 hover:bg-red-100">
                      Rejected
                    </Badge>
                  ) : (
                    <Badge variant="default" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                      Pending
                    </Badge>
                  )}
                </div>
              </div>
            )}
            <DialogFooter>
              {viewCandidate && viewCandidate.status === 'pending' && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      handleStatusChange(viewCandidate.id, 'rejected');
                      setShowViewDialog(false);
                    }}
                    className="bg-red-50 text-red-600 hover:bg-red-100 border-red-200"
                  >
                    Reject
                  </Button>
                  <Button
                    onClick={() => {
                      handleStatusChange(viewCandidate.id, 'approved');
                      setShowViewDialog(false);
                    }}
                  >
                    Approve
                  </Button>
                </>
              )}
              {viewCandidate && viewCandidate.status === 'rejected' && (
                <Button
                  onClick={() => {
                    handleStatusChange(viewCandidate.id, 'approved');
                    setShowViewDialog(false);
                  }}
                >
                  Approve Candidate
                </Button>
              )}
              {viewCandidate && viewCandidate.status === 'approved' && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowViewDialog(false);
                  }}
                >
                  Close
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}