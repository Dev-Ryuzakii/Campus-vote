import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserCircle, Briefcase, Building } from "lucide-react";

export default function LoginHome() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-600 mb-2">Campus Vote</h1>
          <p className="text-lg text-gray-600">Secure Student Election System</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Voter Card */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold text-center flex items-center justify-center">
                <UserCircle className="h-6 w-6 mr-2 text-blue-500" />
                Student Voter
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600 text-center pb-2">
                Vote in active elections for your preferred candidates
              </p>
              <Link href="/auth/voter">
                <Button className="w-full" size="lg">
                  Login as Voter
                </Button>
              </Link>
            </CardContent>
          </Card>
          
          {/* Candidate Card */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold text-center flex items-center justify-center">
                <Briefcase className="h-6 w-6 mr-2 text-green-500" />
                Candidate
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600 text-center pb-2">
                Submit your application to run for elected positions
              </p>
              <Link href="/auth/candidate">
                <Button className="w-full" variant="outline" size="lg">
                  Login as Candidate
                </Button>
              </Link>
            </CardContent>
          </Card>
          
          {/* Admin Card */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold text-center flex items-center justify-center">
                <Building className="h-6 w-6 mr-2 text-purple-500" />
                Administrator
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600 text-center pb-2">
                Manage elections, candidates, and view results
              </p>
              <Link href="/auth/admin">
                <Button className="w-full" variant="secondary" size="lg">
                  Login as Admin
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
        
        {/* Footer Information */}
        <div className="text-center text-gray-500 text-sm">
          <p>© {new Date().getFullYear()} Campus Vote. All rights reserved.</p>
          <p className="mt-1">Need help? Contact your campus administrator.</p>
        </div>
      </div>
    </div>
  );
}