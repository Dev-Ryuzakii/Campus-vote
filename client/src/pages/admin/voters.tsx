import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AdminSidebar from "@/components/AdminSidebar";
import CsvUploader from "@/components/CsvUploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Search, UserPlus } from "lucide-react";

interface Voter {
  id: number;
  studentId: string;
  name: string;
  department?: string;
  hasVoted: boolean;
}

export default function Voters() {
  const [selectedElectionId, setSelectedElectionId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddVoterDialog, setShowAddVoterDialog] = useState(false);
  const [newVoter, setNewVoter] = useState({
    studentId: "",
    name: "",
    department: "",
  });
  
  const { toast } = useToast();

  const { data: elections, isLoading: electionsLoading } = useQuery({
    queryKey: ['/api/admin/elections'],
  });

  const { data: voters, isLoading: votersLoading } = useQuery({
    queryKey: ['/api/admin/voters', { electionId: selectedElectionId }],
    enabled: !!selectedElectionId,
  });

  const addVoterMutation = useMutation({
    mutationFn: async (voterData: typeof newVoter & { electionId: number }) => {
      return await apiRequest('POST', '/api/admin/voters', voterData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/voters'] });
      toast({
        title: "Success",
        description: "Voter added successfully",
      });
      setShowAddVoterDialog(false);
      setNewVoter({ studentId: "", name: "", department: "" });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add voter. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleAddVoter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedElectionId) {
      toast({
        title: "Error",
        description: "Please select an election first",
        variant: "destructive",
      });
      return;
    }
    
    addVoterMutation.mutate({
      ...newVoter,
      electionId: selectedElectionId,
    });
  };

  // Filter voters based on search term
  const filteredVoters = voters ? voters.filter((voter: Voter) => 
    voter.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    voter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (voter.department && voter.department.toLowerCase().includes(searchTerm.toLowerCase()))
  ) : [];

  return (
    <div className="flex flex-col md:flex-row gap-6">
      <AdminSidebar selectedNav="voters" />

      <div className="flex-1">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Voters Management</h1>
          <div>
            <Button
              variant="outline"
              className="mr-2"
              onClick={() => {
                if (!selectedElectionId) {
                  toast({
                    title: "Error",
                    description: "Please select an election first",
                    variant: "destructive",
                  });
                  return;
                }
                setShowAddVoterDialog(true);
              }}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Add</span> Voter
            </Button>
            <Button
              onClick={() => {
                if (!selectedElectionId) {
                  toast({
                    title: "Error",
                    description: "Please select an election first",
                    variant: "destructive",
                  });
                }
              }}
              disabled={!selectedElectionId}
            >
              <span className="hidden sm:inline">Upload</span> CSV
            </Button>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="sm:flex sm:items-center">
              <div className="sm:flex-auto">
                <h3 className="text-base font-semibold leading-6 text-gray-900">Eligible Voters</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {selectedElectionId 
                    ? `Manage eligible voters for the selected election.`
                    : "Please select an election to manage voters."}
                </p>
              </div>
              <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
                <div className="flex space-x-2">
                  <select
                    className="bg-white border border-gray-300 rounded-md shadow-sm px-4 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
                </div>
              </div>
            </div>

            {selectedElectionId && (
              <>
                <div className="mt-4 relative w-full max-w-sm">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <Input
                    type="text"
                    placeholder="Search voters..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {selectedElectionId && (
                  <div className="mt-4">
                    <CsvUploader electionId={selectedElectionId} />
                  </div>
                )}

                <div className="mt-8 flex flex-col">
                  <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle">
                      {votersLoading ? (
                        <div className="flex justify-center p-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                      ) : !voters || voters.length === 0 ? (
                        <div className="text-center p-8 text-gray-500">
                          No voters found. Add voters manually or upload a CSV file.
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Student ID</TableHead>
                              <TableHead>Name</TableHead>
                              <TableHead>Department</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredVoters.map((voter: Voter) => (
                              <TableRow key={voter.id}>
                                <TableCell className="font-medium">{voter.studentId}</TableCell>
                                <TableCell>{voter.name}</TableCell>
                                <TableCell>{voter.department || "N/A"}</TableCell>
                                <TableCell>
                                  {voter.hasVoted ? (
                                    <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
                                      Voted
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="bg-gray-100 text-gray-800 hover:bg-gray-100">
                                      Not Voted
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button variant="link" size="sm">
                                    View
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Add Voter Dialog */}
        <Dialog open={showAddVoterDialog} onOpenChange={setShowAddVoterDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Voter</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddVoter}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="studentId">Student ID</Label>
                  <Input
                    id="studentId"
                    value={newVoter.studentId}
                    onChange={(e) => setNewVoter({ ...newVoter, studentId: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={newVoter.name}
                    onChange={(e) => setNewVoter({ ...newVoter, name: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={newVoter.department}
                    onChange={(e) => setNewVoter({ ...newVoter, department: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddVoterDialog(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={addVoterMutation.isPending}>
                  {addVoterMutation.isPending ? "Adding..." : "Add Voter"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
