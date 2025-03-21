import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import { useEffect, useState } from "react";
import AdminDashboard from "@/pages/admin/index";
import CandidateDashboard from "@/pages/candidate/index";
import VoterDashboard from "@/pages/voter/index";
import { apiRequest } from "./lib/queryClient";
import LoginHome from "./pages/auth/index";
import AdminLogin from "./pages/auth/admin";
import VoterLogin from "./pages/auth/voter";
import CandidateLogin from "./pages/auth/candidate";
import AdminElections from "@/pages/admin/elections";
import ElectionDetail from "@/pages/admin/election-detail";
import AdminCandidates from "@/pages/admin/candidates";
import AdminVoters from "@/pages/admin/voters";
import AdminResults from "@/pages/admin/results";

type User = {
  id: number;
  username: string;
  role: string;
  studentId?: string;
};

// A route guard to handle authenticated routes
const ProtectedRoute = ({ 
  user, 
  expectedRole, 
  component: Component, 
  onLogout,
  ...rest 
}: { 
  user: User | null; 
  expectedRole: string; 
  component: React.ComponentType<any>; 
  onLogout: () => void;
  [key: string]: any 
}) => {
  if (!user) {
    return <Redirect to="/" />;
  }
  
  if (user.role !== expectedRole) {
    return <Redirect to={`/${user.role}`} />;
  }
  
  return <Component user={user} onLogout={onLogout} {...rest} />;
};

function Router() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [location, setLocation] = useLocation();
  
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
      setLocation('/');
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
  
  return (
    <Switch>
      {/* Public routes accessible to unauthenticated users */}
      <Route path="/">
        {user ? <Redirect to={`/${user.role}`} /> : <LoginHome />}
      </Route>
      <Route path="/auth/admin">
        {user ? <Redirect to="/admin" /> : <AdminLogin onLoginSuccess={setUser} />}
      </Route>
      <Route path="/auth/voter">
        {user ? <Redirect to="/voter" /> : <VoterLogin onLoginSuccess={setUser} />}
      </Route>
      <Route path="/auth/candidate">
        {user ? <Redirect to="/candidate" /> : <CandidateLogin onLoginSuccess={setUser} />}
      </Route>
      
      {/* Admin routes */}
      <Route path="/admin">
        <ProtectedRoute user={user} expectedRole="admin" component={AdminDashboard} onLogout={handleLogout} />
      </Route>
      <Route path="/admin/elections">
        <ProtectedRoute user={user} expectedRole="admin" component={AdminElections} onLogout={handleLogout} />
      </Route>
      <Route path="/admin/elections/:id">
        <ProtectedRoute user={user} expectedRole="admin" component={ElectionDetail} onLogout={handleLogout} />
      </Route>
      <Route path="/admin/candidates">
        <ProtectedRoute user={user} expectedRole="admin" component={AdminCandidates} onLogout={handleLogout} />
      </Route>
      <Route path="/admin/voters">
        <ProtectedRoute user={user} expectedRole="admin" component={AdminVoters} onLogout={handleLogout} />
      </Route>
      <Route path="/admin/results">
        <ProtectedRoute user={user} expectedRole="admin" component={AdminResults} onLogout={handleLogout} />
      </Route>
      
      {/* Voter routes */}
      <Route path="/voter">
        <ProtectedRoute user={user} expectedRole="voter" component={VoterDashboard} onLogout={handleLogout} />
      </Route>
      
      {/* Candidate routes */}
      <Route path="/candidate">
        <ProtectedRoute user={user} expectedRole="candidate" component={CandidateDashboard} onLogout={handleLogout} />
      </Route>
      
      {/* Catch-all route for 404 */}
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
