import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RegisterForm from "@/components/RegisterForm";
import { AlertCircle, CheckCircle } from "lucide-react";

interface LoginProps {
  onLoginSuccess: (user: any) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  // Main view state - either login or register
  const [view, setView] = useState<'login' | 'register'>('login');
  // Selected role in the login view
  const [loginRole, setLoginRole] = useState<'admin' | 'candidate' | 'voter'>('voter');
  // Login form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [studentId, setStudentId] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (loginRole === 'admin') {
        if (!username || !password) {
          throw new Error('Username and password are required');
        }

        const res = await apiRequest('POST', '/api/auth/login', {
          username,
          password,
          role: loginRole
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
          role: loginRole
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
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gray-100 p-4">
      {/* Logo and Title */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-blue-600">Campus Vote</h1>
        <p className="text-gray-600">Secure Student Election System</p>
      </div>

      {/* Main Card */}
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">
            {view === 'login' ? 'Sign in to your account' : 'Create an account'}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="pt-4">
          {view === 'login' ? (
            /* Login View */
            <>
              <Tabs defaultValue="voter" className="mb-6">
                <TabsList className="grid grid-cols-3 mb-4">
                  <TabsTrigger 
                    value="voter" 
                    onClick={() => setLoginRole('voter')}
                  >
                    Voter
                  </TabsTrigger>
                  <TabsTrigger 
                    value="candidate" 
                    onClick={() => setLoginRole('candidate')}
                  >
                    Candidate
                  </TabsTrigger>
                  <TabsTrigger 
                    value="admin" 
                    onClick={() => setLoginRole('admin')}
                  >
                    Admin
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="voter" className="space-y-4">
                  <form onSubmit={handleLogin}>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="student-id-voter">Student ID / Matric Number</Label>
                        <Input
                          id="student-id-voter"
                          type="text"
                          placeholder="Enter your student ID"
                          value={studentId}
                          onChange={(e) => setStudentId(e.target.value)}
                        />
                      </div>
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={loading}
                      >
                        {loading ? (
                          <div className="flex items-center">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                            <span>Signing in...</span>
                          </div>
                        ) : (
                          'Sign in'
                        )}
                      </Button>
                    </div>
                  </form>
                  <div className="mt-4 bg-yellow-50 p-3 rounded-md border border-yellow-200">
                    <div className="flex items-start">
                      <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-2" />
                      <p className="text-sm text-yellow-700">
                        Your student ID must be in the voter list to login. If you can't login, please register first.
                      </p>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="candidate" className="space-y-4">
                  <form onSubmit={handleLogin}>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="student-id-candidate">Student ID / Matric Number</Label>
                        <Input
                          id="student-id-candidate"
                          type="text"
                          placeholder="Enter your student ID"
                          value={studentId}
                          onChange={(e) => setStudentId(e.target.value)}
                        />
                      </div>
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={loading}
                      >
                        {loading ? (
                          <div className="flex items-center">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                            <span>Signing in...</span>
                          </div>
                        ) : (
                          'Sign in'
                        )}
                      </Button>
                    </div>
                  </form>
                  <div className="mt-4 bg-blue-50 p-3 rounded-md border border-blue-200">
                    <div className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-2" />
                      <p className="text-sm text-blue-700">
                        To run as a candidate, please register below and then submit an application from your dashboard.
                      </p>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="admin" className="space-y-4">
                  <form onSubmit={handleLogin}>
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
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={loading}
                      >
                        {loading ? (
                          <div className="flex items-center">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                            <span>Signing in...</span>
                          </div>
                        ) : (
                          'Sign in'
                        )}
                      </Button>
                    </div>
                  </form>
                </TabsContent>
              </Tabs>
            </>
          ) : (
            /* Registration View */
            <RegisterForm onRegisterSuccess={onLoginSuccess} defaultRole={loginRole === 'admin' ? 'voter' : loginRole} />
          )}
        </CardContent>
        
        <CardFooter className="flex flex-col items-center">
          <div className="text-center mt-2">
            {view === 'login' ? (
              <p className="text-sm text-gray-600">
                Don't have an account?{" "}
                <Button 
                  variant="link" 
                  className="p-0 h-auto font-semibold text-blue-600" 
                  onClick={() => setView('register')}
                >
                  Register now
                </Button>
              </p>
            ) : (
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <Button 
                  variant="link" 
                  className="p-0 h-auto font-semibold text-blue-600" 
                  onClick={() => setView('login')}
                >
                  Sign in
                </Button>
              </p>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
