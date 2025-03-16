import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import { useEffect, useState } from "react";
import AdminDashboard from "@/pages/admin/index";
import CandidateDashboard from "@/pages/candidate/index";
import VoterDashboard from "@/pages/voter/index";
import { apiRequest } from "./lib/queryClient";

type User = {
  id: number;
  username: string;
  role: string;
  studentId?: string;
};

function Router() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await apiRequest('GET', '/api/auth/session', undefined);
        const data = await res.json();
        setUser(data.user);
      } catch (error) {
        console.error('Session check failed:', error);
      } finally {
        setLoading(false);
      }
    };
    
    checkSession();
  }, []);
  
  const handleLogout = async () => {
    try {
      await apiRequest('POST', '/api/auth/logout', undefined);
      setUser(null);
      queryClient.invalidateQueries();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };
  
  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Login onLoginSuccess={setUser} />;
  }
  
  // Route based on user role
  if (user.role === 'admin') {
    return (
      <AdminDashboard user={user} onLogout={handleLogout} />
    );
  } else if (user.role === 'candidate') {
    return (
      <CandidateDashboard user={user} onLogout={handleLogout} />
    );
  } else if (user.role === 'voter') {
    return (
      <VoterDashboard user={user} onLogout={handleLogout} />
    );
  }
  
  // Fallback
  return (
    <Switch>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
