import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AdminSidebar from "@/components/AdminSidebar";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { CalendarIcon, PencilIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// Component to count and display the number of positions for an election
function PositionCounter({ electionId }: { electionId: number }) {
  const { data: positions, isLoading } = useQuery({
    queryKey: ['/api/admin/elections', electionId, 'positions'],
    enabled: !!electionId,
  });

  if (isLoading) return <>Loading...</>;
  
  const count = positions?.length || 0;
  return <>{count} {count === 1 ? 'position' : 'positions'}</>;
}

interface Election {
  id: number;
  title: string;
  description: string;
  startDate: string | null;
  endDate: string | null;
  status: 'draft' | 'active' | 'completed';
  createdAt: string;
}

interface CreateElectionFormData {
  title: string;
  description: string;
  startDate?: Date;
  endDate?: Date;
  status: 'draft' | 'active' | 'completed';
}

export default function Elections() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedElection, setSelectedElection] = useState<Election | null>(null);
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState<CreateElectionFormData>({
    title: '',
    description: '',
    status: 'draft'
  });
  
  const { toast } = useToast();

  const { data: elections = [], isLoading, error } = useQuery<Election[]>({
    queryKey: ['/api/admin/elections'],
  });

  const createElectionMutation = useMutation({
    mutationFn: async (data: CreateElectionFormData) => {
      // Convert Date objects to ISO strings for server-side processing
      const formattedData = {
        ...data,
        startDate: data.startDate ? data.startDate.toISOString() : null,
        endDate: data.endDate ? data.endDate.toISOString() : null
      };
      return await apiRequest('POST', '/api/admin/elections', formattedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/elections'] });
      setShowCreateDialog(false);
      resetForm();
      toast({
        title: "Success",
        description: "Election created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create election",
        variant: "destructive",
      });
    }
  });

  const updateElectionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<CreateElectionFormData> }) => {
      // Convert Date objects to ISO strings for server-side processing
      const formattedData = {
        ...data,
        startDate: data.startDate ? data.startDate.toISOString() : null,
        endDate: data.endDate ? data.endDate.toISOString() : null
      };
      return await apiRequest('PATCH', `/api/admin/elections/${id}`, formattedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/elections'] });
      setShowEditDialog(false);
      resetForm();
      toast({
        title: "Success",
        description: "Election updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update election",
        variant: "destructive",
      });
    }
  });

  const updateElectionStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: 'draft' | 'active' | 'completed' }) => {
      return await apiRequest('PATCH', `/api/admin/elections/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/elections'] });
      toast({
        title: "Success",
        description: "Election status updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update election status",
        variant: "destructive",
      });
    }
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      status: 'draft'
    });
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createElectionMutation.mutate(formData);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedElection) {
      updateElectionMutation.mutate({ id: selectedElection.id, data: formData });
    }
  };

  const openEditDialog = (election: Election) => {
    setSelectedElection(election);
    setFormData({
      title: election.title,
      description: election.description,
      startDate: election.startDate ? new Date(election.startDate) : undefined,
      endDate: election.endDate ? new Date(election.endDate) : undefined,
      status: election.status
    });
    setShowEditDialog(true);
  };

  const handleEndElection = (id: number) => {
    updateElectionStatus.mutate({ id, status: 'completed' });
  };

  const handleStartElection = (id: number) => {
    updateElectionStatus.mutate({ id, status: 'active' });
  };

  return (
    <div className="flex flex-col md:flex-row gap-6">
      <AdminSidebar selectedNav="elections" />

      <div className="flex-1">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Elections</h1>
          <Button onClick={() => setShowCreateDialog(true)}>
            Create New Election
          </Button>
        </div>

        {isLoading ? (
          <div className="bg-white shadow rounded-md p-4 w-full mx-auto">
            <div className="animate-pulse flex space-x-4">
              <div className="flex-1 space-y-6 py-1">
                <div className="h-6 bg-gray-200 rounded"></div>
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="h-4 bg-gray-200 rounded col-span-2"></div>
                    <div className="h-4 bg-gray-200 rounded col-span-1"></div>
                  </div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            Error loading elections. Please try again.
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {elections?.length > 0 ? (
                elections.map((election: Election) => (
                  <li key={election.id}>
                    <div className="px-4 py-4 flex items-center sm:px-6">
                      <div className="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                          <div className="flex text-sm">
                            <p className="font-medium text-blue-600 truncate cursor-pointer hover:underline" 
                              onClick={() => setLocation(`/admin/elections/${election.id}`)}>
                                {election.title}
                            </p>
                            <p className="ml-1 flex-shrink-0 font-normal text-gray-500">
                              ({election.status})
                            </p>
                          </div>
                          <div className="mt-2 flex">
                            <div className="flex items-center text-sm text-gray-500">
                              <CalendarIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                              <p>
                                {election.startDate 
                                  ? `Started: ${format(new Date(election.startDate), 'MMM dd, yyyy')}`
                                  : 'Not yet scheduled'}
                              </p>
                            </div>
                            {election.endDate && (
                              <div className="ml-4 flex items-center text-sm text-gray-500">
                                <CalendarIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                                <p>Ends: {format(new Date(election.endDate), 'MMM dd, yyyy')}</p>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="mt-4 flex-shrink-0 sm:mt-0 sm:ml-5">
                          <div className="flex -space-x-1 overflow-hidden">
                            <div className="bg-gray-200 text-xs text-gray-800 px-2 py-1 rounded ml-2">
                              <PositionCounter electionId={election.id} />
                            </div>
                            <div className="ml-2 bg-gray-200 text-xs text-gray-800 px-2 py-1 rounded">
                              {election.status === 'completed' ? 'View Results' : 'Manage Candidates'}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="ml-5 flex-shrink-0">
                        {election.status === 'active' && (
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleEndElection(election.id)}
                          >
                            End Election
                          </Button>
                        )}
                        {election.status === 'draft' && (
                          <Button 
                            variant="default" 
                            size="sm"
                            onClick={() => handleStartElection(election.id)}
                          >
                            Publish
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="ml-2"
                          onClick={() => openEditDialog(election)}
                        >
                          <PencilIcon className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                      </div>
                    </div>
                  </li>
                ))
              ) : (
                <li className="px-4 py-8 text-center text-gray-500">
                  No elections found. Create your first election to get started.
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Create Election Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Create New Election</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "justify-start text-left font-normal",
                            !formData.startDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.startDate ? format(formData.startDate, "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.startDate}
                          onSelect={(date) => setFormData({ ...formData, startDate: date })}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="grid gap-2">
                    <Label>End Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "justify-start text-left font-normal",
                            !formData.endDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.endDate ? format(formData.endDate, "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.endDate}
                          onSelect={(date) => setFormData({ ...formData, endDate: date })}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowCreateDialog(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createElectionMutation.isPending}
                >
                  {createElectionMutation.isPending ? "Creating..." : "Create Election"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Election Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Edit Election</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-title">Title</Label>
                  <Input
                    id="edit-title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "justify-start text-left font-normal",
                            !formData.startDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.startDate ? format(formData.startDate, "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.startDate}
                          onSelect={(date) => setFormData({ ...formData, startDate: date })}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="grid gap-2">
                    <Label>End Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "justify-start text-left font-normal",
                            !formData.endDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.endDate ? format(formData.endDate, "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.endDate}
                          onSelect={(date) => setFormData({ ...formData, endDate: date })}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowEditDialog(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateElectionMutation.isPending}
                >
                  {updateElectionMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
