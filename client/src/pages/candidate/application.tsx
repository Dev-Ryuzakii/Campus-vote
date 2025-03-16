import { useEffect } from "react";
import ApplicationForm from "@/components/ApplicationForm";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";

interface ApplicationProps {
  user: {
    id: number;
    username: string;
    role: string;
    studentId?: string;
  };
  hasSubmittedApplication: boolean;
  candidateProfile: any;
}

export default function Application({ user, hasSubmittedApplication, candidateProfile }: ApplicationProps) {
  const [_, setLocation] = useLocation();

  useEffect(() => {
    if (hasSubmittedApplication) {
      setLocation('/candidate');
    }
  }, [hasSubmittedApplication, setLocation]);

  return (
    <>
      <div className="md:grid md:grid-cols-3 md:gap-6">
        <div className="md:col-span-1">
          <div className="px-4 sm:px-0">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Candidate Application</h3>
            <p className="mt-1 text-sm text-gray-600">
              Please provide your information to apply as a candidate for the upcoming election.
            </p>
            <p className="mt-4 text-sm text-gray-600">
              Your application will be reviewed by the election administrators. You'll receive notification once your candidacy has been approved or rejected.
            </p>
            <p className="mt-4 text-sm text-gray-600">
              Be sure to provide a compelling manifesto that clearly outlines your vision and plans if elected to your chosen position.
            </p>
          </div>
        </div>
        <div className="mt-5 md:mt-0 md:col-span-2">
          <Card>
            <CardContent className="pt-6">
              <ApplicationForm studentId={user.studentId || ''} />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
