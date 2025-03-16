import { useState } from "react";
import { Route, Switch } from "wouter";
import NavBar from "@/components/NavBar";
import { useQuery } from "@tanstack/react-query";
import Application from "./application";
import Status from "./status";

interface CandidatePanelProps {
  user: {
    id: number;
    username: string;
    role: string;
    studentId?: string;
  };
  onLogout: () => void;
}

export default function CandidatePanel({ user, onLogout }: CandidatePanelProps) {
  const { data: candidateProfile, isLoading } = useQuery({
    queryKey: ['/api/candidates/profile'],
  });

  const hasSubmittedApplication = !isLoading && candidateProfile && candidateProfile.length > 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <NavBar onLogout={onLogout} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <NavBar onLogout={onLogout} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Switch>
          <Route path="/candidate/application">
            <Application user={user} hasSubmittedApplication={hasSubmittedApplication} candidateProfile={candidateProfile} />
          </Route>
          <Route path="/candidate">
            {hasSubmittedApplication ? <Status candidateProfile={candidateProfile} /> : <Application user={user} hasSubmittedApplication={false} candidateProfile={null} />}
          </Route>
        </Switch>
      </div>
    </div>
  );
}
