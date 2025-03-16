import { Route, Switch } from "wouter";
import NavBar from "@/components/NavBar";
import AdminDashboard from "@/pages/admin/dashboard";
import Elections from "@/pages/admin/elections";
import Voters from "@/pages/admin/voters";
import Candidates from "@/pages/admin/candidates";
import Results from "@/pages/admin/results";
import NotFound from "@/pages/not-found";

interface AdminPanelProps {
  user: {
    id: number;
    username: string;
    role: string;
  };
  onLogout: () => void;
}

export default function AdminPanel({ user, onLogout }: AdminPanelProps) {
  return (
    <div className="min-h-screen bg-gray-100">
      <NavBar onLogout={onLogout} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Switch>
          <Route path="/admin" component={AdminDashboard} />
          <Route path="/admin/elections" component={Elections} />
          <Route path="/admin/voters" component={Voters} />
          <Route path="/admin/candidates" component={Candidates} />
          <Route path="/admin/results" component={Results} />
          <Route component={NotFound} />
        </Switch>
      </div>
    </div>
  );
}
