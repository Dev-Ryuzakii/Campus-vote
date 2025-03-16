import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, XCircle } from "lucide-react";

interface StatusCardProps {
  application: {
    id: number;
    status: string;
    manifesto: string;
    position: {
      id: number;
      title: string;
    };
    user: {
      id: number;
      name: string;
      studentId: string;
      department: string;
    };
  };
}

export default function StatusCard({ application }: StatusCardProps) {
  if (!application) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Application Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Position</h3>
              <p className="mt-1 text-lg font-semibold">{application.position.title}</p>
            </div>
            <div>
              {application.status === 'pending' && (
                <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                  Pending Review
                </Badge>
              )}
              {application.status === 'approved' && (
                <Badge variant="outline" className="bg-green-100 text-green-800">
                  Approved
                </Badge>
              )}
              {application.status === 'rejected' && (
                <Badge variant="outline" className="bg-red-100 text-red-800">
                  Rejected
                </Badge>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">Candidate Information</h3>
            <div className="mt-2 grid grid-cols-1 gap-1">
              <div className="flex justify-between py-1">
                <span className="text-gray-600">Name:</span>
                <span className="font-medium">{application.user.name}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-600">Student ID:</span>
                <span className="font-medium">{application.user.studentId}</span>
              </div>
              {application.user.department && (
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">Department:</span>
                  <span className="font-medium">{application.user.department}</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">Your Manifesto</h3>
            <div className="mt-2 p-3 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-700 whitespace-pre-line">{application.manifesto}</p>
            </div>
          </div>

          {application.status === 'pending' && (
            <Alert className="bg-yellow-50 border-yellow-200">
              <AlertCircle className="h-4 w-4 text-yellow-800" />
              <AlertTitle className="text-yellow-800">Application Under Review</AlertTitle>
              <AlertDescription className="text-yellow-700">
                Your application is currently being reviewed by the election administrators. You'll be notified once a decision has been made.
              </AlertDescription>
            </Alert>
          )}

          {application.status === 'approved' && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-800" />
              <AlertTitle className="text-green-800">Application Approved!</AlertTitle>
              <AlertDescription className="text-green-700">
                Congratulations! Your application has been approved. You are now officially a candidate for the {application.position.title} position.
              </AlertDescription>
            </Alert>
          )}

          {application.status === 'rejected' && (
            <Alert className="bg-red-50 border-red-200">
              <XCircle className="h-4 w-4 text-red-800" />
              <AlertTitle className="text-red-800">Application Rejected</AlertTitle>
              <AlertDescription className="text-red-700">
                We regret to inform you that your application was not approved at this time. For more information, please contact the election administrators.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
