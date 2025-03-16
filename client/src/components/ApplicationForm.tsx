import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const applicationSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  studentId: z.string().min(1, "Student ID is required"),
  positionId: z.string().min(1, "Position is required"),
  manifesto: z.string().min(20, "Manifesto must be at least 20 characters"),
  department: z.string().optional(),
  electionId: z.string().min(1, "Election is required"),
});

type ApplicationFormValues = z.infer<typeof applicationSchema>;

interface ApplicationFormProps {
  studentId: string;
}

export default function ApplicationForm({ studentId }: ApplicationFormProps) {
  const [_, navigate] = useLocation();
  const { toast } = useToast();

  const form = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      studentId,
      department: "",
      manifesto: "",
      positionId: "",
      electionId: "",
    },
  });

  // Query for active elections
  const { data: elections, isLoading: electionsLoading } = useQuery({
    queryKey: ['/api/elections/active'],
  });

  // Query for positions once an election is selected
  const { data: positions, isLoading: positionsLoading } = useQuery({
    queryKey: ['/api/admin/elections', form.watch('electionId'), 'positions'],
    enabled: !!form.watch('electionId'),
  });

  // Set student ID from props
  useEffect(() => {
    if (studentId) {
      form.setValue("studentId", studentId);
    }
  }, [studentId, form]);

  const submitMutation = useMutation({
    mutationFn: async (data: ApplicationFormValues) => {
      return await apiRequest('POST', '/api/candidates/apply', {
        ...data,
        positionId: parseInt(data.positionId),
        electionId: parseInt(data.electionId),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/candidates/profile'] });
      toast({
        title: "Application Submitted",
        description: "Your candidate application has been submitted successfully.",
      });
      navigate('/candidate');
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to submit your application. Please try again.",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: ApplicationFormValues) => {
    submitMutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input placeholder="Your first name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input placeholder="Your last name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input type="email" placeholder="Your email address" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="studentId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Student ID / Matric Number</FormLabel>
              <FormControl>
                <Input disabled={!!studentId} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="department"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Department (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="Your academic department" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="electionId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Election</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an election" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {electionsLoading ? (
                    <SelectItem value="loading" disabled>Loading...</SelectItem>
                  ) : !elections || elections.length === 0 ? (
                    <SelectItem value="none" disabled>No active elections</SelectItem>
                  ) : (
                    elections.map((election: any) => (
                      <SelectItem key={election.id} value={election.id.toString()}>
                        {election.title}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="positionId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Position</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
                disabled={!form.watch('electionId') || positionsLoading}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a position" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {!form.watch('electionId') ? (
                    <SelectItem value="none" disabled>Select an election first</SelectItem>
                  ) : positionsLoading ? (
                    <SelectItem value="loading" disabled>Loading positions...</SelectItem>
                  ) : !positions || positions.length === 0 ? (
                    <SelectItem value="none" disabled>No positions available</SelectItem>
                  ) : (
                    positions.map((position: any) => (
                      <SelectItem key={position.id} value={position.id.toString()}>
                        {position.title}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="manifesto"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Manifesto / Platform</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Tell voters about your plans and why they should vote for you..."
                  className="min-h-[150px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="pt-2">
          <Button 
            type="submit" 
            className="w-full"
            disabled={submitMutation.isPending}
          >
            {submitMutation.isPending ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Submitting...
              </>
            ) : (
              "Submit Application"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
