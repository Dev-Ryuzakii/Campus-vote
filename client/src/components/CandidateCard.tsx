import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useState } from "react";
import { Check } from "lucide-react";

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

interface CandidateCardProps {
  candidate: Candidate;
  isSelected: boolean;
  onSelect: () => void;
}

export default function CandidateCard({ candidate, isSelected, onSelect }: CandidateCardProps) {
  const [showProfileDialog, setShowProfileDialog] = useState(false);

  return (
    <>
      <Card className={`overflow-hidden ${isSelected ? 'ring-2 ring-blue-500' : ''}`}>
        <CardContent className="pt-5 pb-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-xl font-semibold text-blue-700">
                {candidate.user.name.charAt(0)}
              </span>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">{candidate.user.name}</h3>
              <p className="text-sm text-gray-500">{candidate.user.department}</p>
            </div>
          </div>
          <div className="mt-4 line-clamp-3">
            <p className="text-sm text-gray-600">
              {candidate.manifesto.length > 120 
                ? `${candidate.manifesto.substring(0, 120)}...` 
                : candidate.manifesto}
            </p>
          </div>
          <div className="mt-4 flex justify-between items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowProfileDialog(true)}
            >
              View Profile
            </Button>
            <Button
              variant={isSelected ? "default" : "outline"}
              size="sm"
              onClick={onSelect}
              className={isSelected ? "bg-blue-600 hover:bg-blue-700" : ""}
            >
              {isSelected ? (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Selected
                </>
              ) : (
                "Vote"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Candidate Profile Dialog */}
      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Candidate Profile</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center mb-6">
              <div className="flex-shrink-0 h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-xl font-semibold text-blue-700">
                  {candidate.user.name.charAt(0)}
                </span>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold">{candidate.user.name}</h3>
                <p className="text-sm text-gray-500">{candidate.user.department}</p>
                <p className="text-xs text-gray-500">ID: {candidate.user.studentId}</p>
              </div>
            </div>

            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Manifesto:</h4>
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-sm whitespace-pre-line">{candidate.manifesto}</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant={isSelected ? "default" : "outline"}
              onClick={() => {
                onSelect();
                setShowProfileDialog(false);
              }}
            >
              {isSelected ? "Selected" : "Vote for this candidate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
