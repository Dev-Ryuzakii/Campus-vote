import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface LoginProps {
  onLoginSuccess: (user: any) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [userRole, setUserRole] = useState<'admin' | 'candidate' | 'voter'>('voter');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [studentId, setStudentId] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (userRole === 'admin') {
        if (!username || !password) {
          throw new Error('Username and password are required');
        }

        const res = await apiRequest('POST', '/api/auth/login', {
          username,
          password,
          role: userRole
        });
        
        const data = await res.json();
        onLoginSuccess(data.user);
        toast({
          title: "Login successful",
          description: `Welcome, ${data.user.username}!`,
        });
      } else {
        if (!studentId) {
          throw new Error('Student ID is required');
        }

        const res = await apiRequest('POST', '/api/auth/student-login', {
          studentId,
          role: userRole
        });
        
        const data = await res.json();
        onLoginSuccess(data.user);
        toast({
          title: "Login successful",
          description: `Welcome, ${data.user.studentId}!`,
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Invalid credentials",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-100">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Campus Vote</h2>
          
          {/* User Role Selector */}
          <div className="mb-6">
            <Label className="block mb-2">Login As:</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant={userRole === 'admin' ? 'default' : 'outline'}
                onClick={() => setUserRole('admin')}
                className="py-2"
              >
                Admin
              </Button>
              <Button
                type="button"
                variant={userRole === 'candidate' ? 'default' : 'outline'}
                onClick={() => setUserRole('candidate')}
                className="py-2"
              >
                Candidate
              </Button>
              <Button
                type="button"
                variant={userRole === 'voter' ? 'default' : 'outline'}
                onClick={() => setUserRole('voter')}
                className="py-2"
              >
                Voter
              </Button>
            </div>
          </div>
          
          <form onSubmit={handleLogin}>
            {/* Admin Login */}
            {userRole === 'admin' && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Admin username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
            )}
            
            {/* Candidate/Voter Login */}
            {(userRole === 'candidate' || userRole === 'voter') && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="student-id">Student ID / Matric Number</Label>
                  <Input
                    id="student-id"
                    type="text"
                    placeholder="Enter your ID"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                  />
                </div>
              </div>
            )}
            
            <div className="mt-6">
              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    <span>Logging in...</span>
                  </div>
                ) : (
                  'Login'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
