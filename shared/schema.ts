import { pgTable, text, serial, integer, boolean, timestamp, varchar, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum('user_role', ['admin', 'candidate', 'voter']);
export const candidateStatusEnum = pgEnum('candidate_status', ['pending', 'approved', 'rejected']);
export const electionStatusEnum = pgEnum('election_status', ['draft', 'active', 'completed']);

// Users
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: userRoleEnum("role").notNull().default('voter'),
  studentId: text("student_id").unique(),
  department: text("department"),
  name: text("name"),
  hasVoted: boolean("has_voted").default(false),
});

// Elections
export const elections = pgTable("elections", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  status: electionStatusEnum("status").default('draft'),
  createdAt: timestamp("created_at").defaultNow(),
});

// Positions
export const positions = pgTable("positions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  electionId: integer("election_id").notNull(),
});

// Candidates 
export const candidates = pgTable("candidates", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  positionId: integer("position_id").notNull(),
  manifesto: text("manifesto"),
  status: candidateStatusEnum("status").default('pending'),
  electionId: integer("election_id").notNull(),
});

// Votes
export const votes = pgTable("votes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  candidateId: integer("candidate_id").notNull(),
  positionId: integer("position_id").notNull(),
  electionId: integer("election_id").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Voters (eligible voters list)
export const eligibleVoters = pgTable("eligible_voters", {
  id: serial("id").primaryKey(),
  studentId: text("student_id").notNull().unique(),
  name: text("name"),
  department: text("department"),
  electionId: integer("election_id").notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
  studentId: true,
  department: true,
  name: true,
});

export const insertElectionSchema = createInsertSchema(elections).pick({
  title: true,
  description: true,
  startDate: true,
  endDate: true,
  status: true,
});

export const insertPositionSchema = createInsertSchema(positions).pick({
  title: true,
  description: true,
  electionId: true,
});

export const insertCandidateSchema = createInsertSchema(candidates).pick({
  userId: true,
  positionId: true,
  manifesto: true,
  status: true,
  electionId: true,
});

export const insertVoteSchema = createInsertSchema(votes).pick({
  userId: true,
  candidateId: true,
  positionId: true,
  electionId: true,
});

export const insertEligibleVoterSchema = createInsertSchema(eligibleVoters).pick({
  studentId: true,
  name: true,
  department: true,
  electionId: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Election = typeof elections.$inferSelect;
export type InsertElection = z.infer<typeof insertElectionSchema>;

export type Position = typeof positions.$inferSelect;
export type InsertPosition = z.infer<typeof insertPositionSchema>;

export type Candidate = typeof candidates.$inferSelect;
export type InsertCandidate = z.infer<typeof insertCandidateSchema>;

export type Vote = typeof votes.$inferSelect;
export type InsertVote = z.infer<typeof insertVoteSchema>;

export type EligibleVoter = typeof eligibleVoters.$inferSelect;
export type InsertEligibleVoter = z.infer<typeof insertEligibleVoterSchema>;

// Enhanced types for application use
export type CandidateWithDetails = Candidate & {
  user: User;
  position: Position;
};

export type ElectionWithDetails = Election & {
  positions: Position[];
  candidates: CandidateWithDetails[];
};

export type VoteResult = {
  candidateId: number;
  candidateName: string;
  candidateStudentId: string;
  votes: number;
  percentage: number;
};

export type PositionResults = {
  positionId: number;
  positionTitle: string;
  results: VoteResult[];
};

export type AuthData = {
  id: number;
  username: string;
  role: string;
  studentId?: string;
};

// Authentication schemas
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  role: z.enum(['admin', 'candidate', 'voter']),
});

export const studentLoginSchema = z.object({
  studentId: z.string().min(1, "Student ID is required"),
  role: z.enum(['candidate', 'voter']),
});

export const registerSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(['candidate', 'voter']),
  studentId: z.string().min(1, "Student ID is required"),
  name: z.string().min(1, "Full name is required"),
  department: z.string().optional(),
});

export const candidateApplicationSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  studentId: z.string().min(1, "Student ID is required"),
  positionId: z.number().min(1),
  manifesto: z.string().min(20, "Manifesto must be at least 20 characters"),
  electionId: z.number().min(1),
});

export const voteSubmissionSchema = z.object({
  electionId: z.number().min(1),
  votes: z.array(
    z.object({
      positionId: z.number().min(1),
      candidateId: z.number().min(1),
    })
  ).min(1, "At least one vote is required"),
});

export const csvVoterSchema = z.object({
  studentId: z.string().min(1, "Student ID is required"),
  name: z.string().min(1, "Name is required"),
  department: z.string().optional(),
});
