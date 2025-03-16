import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

interface Position {
  id: number;
  title: string;
  description: string;
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

interface BallotSection {
  position: Position;
  candidates: Candidate[];
}

interface VoteConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  selections: Record<number, number>;
  ballot: BallotSection[];
  isSubmitting: boolean;
}

export default function VoteConfirmation({
  isOpen,
  onClose,
  onConfirm,
  selections,
  ballot,
  isSubmitting
}: VoteConfirmationProps) {
  // Function to get candidate name by id
  const getCandidateName = (positionId: number, candidateId: number): string => {
    const section = ballot.find(s => s.position.id === positionId);
    if (!section) return "Unknown";
    
    const candidate = section.candidates.find(c => c.id === candidateId);
    return candidate ? candidate.user.name : "Unknown";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Confirm Your Vote</DialogTitle>
          <DialogDescription>
            Please review your selections. Once submitted, your vote cannot be changed.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">You are voting for:</h4>
          <ul className="space-y-3">
            {Object.entries(selections).map(([positionId, candidateId]) => {
              const position = ballot.find(s => s.position.id === Number(positionId));
              return (
                <li key={positionId} className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  <span className="text-gray-600">{position?.position.title}:</span>
                  <span className="font-semibold ml-2">
                    {getCandidateName(Number(positionId), candidateId)}
                  </span>
                </li>
              );
            })}
          </ul>
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
            <p className="text-sm text-amber-800">
              <strong>Important:</strong> Your vote is confidential and once submitted cannot be changed.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Submitting...
              </>
            ) : (
              "Confirm Vote"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
