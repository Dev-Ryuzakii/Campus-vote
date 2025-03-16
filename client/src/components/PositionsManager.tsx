
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircleIcon, TrashIcon } from "lucide-react";

interface Position {
  id: number;
  title: string;
  description: string;
  electionId: number;
}

interface PositionsManagerProps {
  electionId: number;
}

export default function PositionsManager({ electionId }: PositionsManagerProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    electionId
  });
  
  const { toast } = useToast();

  const { data: positions = [], isLoading, error } = useQuery({
    queryKey: ['/api/admin/elections', electionId, 'positions'],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/admin/elections/${electionId}/positions`);
      return res.json();
    },
    enabled: !!electionId,
  });

  const createPositionMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest('POST', '/api/admin/positions', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/elections', electionId, 'positions'] });
      setShowCreateDialog(false);
      resetForm();
      toast({
        title: "Success",
        description: "Position created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create position",
        variant: "destructive",
      });
    }
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      electionId
    });
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createPositionMutation.mutate(formData);
  };

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">
          Election Positions
        </h2>
        <Button 
          onClick={() => setShowCreateDialog(true)}
          size="sm"
          className="flex items-center"
        >
          <PlusCircleIcon className="h-4 w-4 mr-2" />
          Add Position
        </Button>
      </div>

      {isLoading ? (
        <div className="bg-white shadow rounded-md p-4 w-full mx-auto">
          <div className="animate-pulse flex space-x-4">
            <div className="flex-1 space-y-4 py-1">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Error loading positions. Please try again.
        </div>
      ) : (
        <div className="bg-white rounded-md shadow overflow-hidden">
          {positions.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {positions.map((position: Position) => (
                <div key={position.id} className="p-4 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{position.title}</h3>
                    <p className="text-sm text-gray-500">{position.description}</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => {
                      toast({
                        title: "Notice",
                        description: "Position deletion will be implemented in the next update",
                      });
                    }}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500">
              No positions defined for this election yet. Add your first position to get started.
            </div>
          )}
        </div>
      )}

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Position</DialogTitle>
            <DialogDescription>
              Create a new position for candidates to run for in this election.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Position Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., President"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the responsibilities and requirements for this position"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createPositionMutation.isPending}
              >
                {createPositionMutation.isPending ? "Creating..." : "Add Position"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
