import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { parse } from 'csv-parse/sync';
import { 
  loginSchema, 
  studentLoginSchema, 
  registerSchema,
  candidateApplicationSchema, 
  voteSubmissionSchema, 
  csvVoterSchema,
  insertElectionSchema,
  insertPositionSchema  
} from "@shared/schema";
import session from 'express-session';
import MemoryStore from 'memorystore';

// Define session type
declare module 'express-session' {
  interface SessionData {
    user?: {
      id: number;
      username: string;
      role: string;
      studentId?: string;
    };
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  const SessionStore = MemoryStore(session);

  // Configure session middleware
  app.use(
    session({
      cookie: { maxAge: 86400000 }, // 24 hours
      store: new SessionStore({
        checkPeriod: 86400000 // Clear expired entries every 24h
      }),
      resave: false,
      saveUninitialized: false,
      secret: process.env.SESSION_SECRET || 'campus-vote-secret'
    })
  );

  // Authentication middleware
  const requireAuth = (req: Request, res: Response, next: Function) => {
    if (!req.session.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    next();
  };

  const requireRole = (roles: string[]) => {
    return (req: Request, res: Response, next: Function) => {
      if (!req.session.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      if (!roles.includes(req.session.user.role)) {
        return res.status(403).json({ message: 'Insufficient permissions' });
      }
      next();
    };
  };

  // ----- Auth Routes -----
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      const { username, password, role } = validatedData;

      if (role === 'admin') {
        const user = await storage.getUserByUsername(username);
        if (!user || user.password !== password || user.role !== 'admin') {
          return res.status(401).json({ message: 'Invalid admin credentials' });
        }

        req.session.user = {
          id: user.id,
          username: user.username,
          role: user.role
        };
        
        return res.status(200).json({ 
          message: 'Login successful',
          user: {
            id: user.id,
            username: user.username,
            role: user.role
          }
        });
      } else {
        return res.status(400).json({ message: 'Invalid login method for this role' });
      }
    } catch (error) {
      console.error('Login error:', error);
      return res.status(400).json({ message: 'Invalid login data' });
    }
  });

  app.post('/api/auth/student-login', async (req: Request, res: Response) => {
    try {
      const validatedData = studentLoginSchema.parse(req.body);
      const { studentId, role } = validatedData;

      // For voters, check if they're in the eligible voters list for any election
      if (role === 'voter') {
        const eligibleVoter = await storage.getEligibleVoterByStudentId(studentId);
        if (!eligibleVoter) {
          return res.status(401).json({ message: 'Student ID not found in eligible voters list' });
        }

        // Check if the user exists, if not create them
        let user = await storage.getUserByStudentId(studentId);
        if (!user) {
          user = await storage.createUser({
            username: studentId, // Use studentId as username
            password: studentId, // Simple password, in real app should be more secure
            role: 'voter',
            studentId,
            name: eligibleVoter.name,
            department: eligibleVoter.department
          });
        }

        req.session.user = {
          id: user.id,
          username: user.username,
          role: user.role,
          studentId: user.studentId
        };
        
        return res.status(200).json({ 
          message: 'Login successful',
          user: {
            id: user.id,
            username: user.username,
            role: user.role,
            studentId: user.studentId
          }
        });
      } 
      // For candidates, check if they have a candidate profile
      else if (role === 'candidate') {
        const user = await storage.getUserByStudentId(studentId);
        if (!user) {
          return res.status(401).json({ message: 'Student ID not found in candidate database' });
        }

        const candidates = await storage.getCandidatesByUser(user.id);
        if (candidates.length === 0) {
          return res.status(401).json({ message: 'No candidate application found for this student ID' });
        }

        req.session.user = {
          id: user.id,
          username: user.username,
          role: user.role,
          studentId: user.studentId
        };
        
        return res.status(200).json({ 
          message: 'Login successful',
          user: {
            id: user.id,
            username: user.username,
            role: user.role,
            studentId: user.studentId
          }
        });
      } else {
        return res.status(400).json({ message: 'Invalid role specified' });
      }
    } catch (error) {
      console.error('Student login error:', error);
      return res.status(400).json({ message: 'Invalid login data' });
    }
  });

  app.post('/api/auth/logout', (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: 'Failed to logout' });
      }
      res.clearCookie('connect.sid');
      return res.status(200).json({ message: 'Logout successful' });
    });
  });

  app.get('/api/auth/session', (req: Request, res: Response) => {
    if (req.session.user) {
      return res.status(200).json({ user: req.session.user });
    }
    return res.status(200).json({ user: null });
  });
  
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      const validatedData = registerSchema.parse(req.body);
      const { username, password, role, studentId, name, department } = validatedData;
      
      // Check if user already exists
      const existingUser = await storage.getUserByStudentId(studentId);
      if (existingUser) {
        return res.status(400).json({ message: 'A user with this student ID already exists' });
      }
      
      // For voters, verify they are in the eligible voters list
      if (role === 'voter') {
        const eligibleVoter = await storage.getEligibleVoterByStudentId(studentId);
        if (!eligibleVoter) {
          return res.status(401).json({ 
            message: 'Your student ID is not in the eligible voters list. Please contact your administrator.' 
          });
        }
      }
      
      // Create the user
      const user = await storage.createUser({
        username,
        password,
        role,
        studentId,
        name,
        department: department || null
      });
      
      // Set session for the new user
      req.session.user = {
        id: user.id,
        username: user.username,
        role: user.role,
        studentId: user.studentId
      };
      
      return res.status(201).json({
        message: 'Registration successful',
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          studentId: user.studentId
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      return res.status(400).json({ message: 'Invalid registration data' });
    }
  });

  // ----- Admin Routes -----
  // Elections
  app.get('/api/admin/elections', requireRole(['admin']), async (req: Request, res: Response) => {
    try {
      const elections = await storage.getElections();
      return res.status(200).json(elections);
    } catch (error) {
      console.error('Get elections error:', error);
      return res.status(500).json({ message: 'Failed to retrieve elections' });
    }
  });

  app.post('/api/admin/elections', requireRole(['admin']), async (req: Request, res: Response) => {
    try {
      // Parse dates from ISO strings to Date objects
      const formData = {
        ...req.body,
        startDate: req.body.startDate ? new Date(req.body.startDate) : null,
        endDate: req.body.endDate ? new Date(req.body.endDate) : null
      };
      
      const validatedData = insertElectionSchema.parse(formData);
      const election = await storage.createElection(validatedData);
      return res.status(201).json(election);
    } catch (error) {
      console.error('Create election error:', error);
      return res.status(400).json({ message: 'Invalid election data' });
    }
  });

  app.get('/api/admin/elections/:id', requireRole(['admin']), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const election = await storage.getElectionWithDetails(id);
      if (!election) {
        return res.status(404).json({ message: 'Election not found' });
      }
      return res.status(200).json(election);
    } catch (error) {
      console.error('Get election error:', error);
      return res.status(500).json({ message: 'Failed to retrieve election' });
    }
  });

  app.patch('/api/admin/elections/:id', requireRole(['admin']), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      // Parse dates from ISO strings to Date objects
      const formData = {
        ...req.body,
        startDate: req.body.startDate ? new Date(req.body.startDate) : null,
        endDate: req.body.endDate ? new Date(req.body.endDate) : null
      };
      
      const validatedData = insertElectionSchema.partial().parse(formData);
      const updated = await storage.updateElection(id, validatedData);
      if (!updated) {
        return res.status(404).json({ message: 'Election not found' });
      }
      return res.status(200).json(updated);
    } catch (error) {
      console.error('Update election error:', error);
      return res.status(400).json({ message: 'Invalid election data' });
    }
  });

  // Positions
  app.post('/api/admin/positions', requireRole(['admin']), async (req: Request, res: Response) => {
    try {
      const validatedData = insertPositionSchema.parse(req.body);
      const position = await storage.createPosition(validatedData);
      return res.status(201).json(position);
    } catch (error) {
      console.error('Create position error:', error);
      return res.status(400).json({ message: 'Invalid position data' });
    }
  });

  app.get('/api/admin/elections/:id/positions', requireRole(['admin']), async (req: Request, res: Response) => {
    try {
      const electionId = parseInt(req.params.id);
      const positions = await storage.getPositions(electionId);
      return res.status(200).json(positions);
    } catch (error) {
      console.error('Get positions error:', error);
      return res.status(500).json({ message: 'Failed to retrieve positions' });
    }
  });
  
  // Public endpoint to get positions for an election (for candidate application)
  app.get('/api/elections/:id/positions', requireAuth, async (req: Request, res: Response) => {
    try {
      const electionId = parseInt(req.params.id);
      const positions = await storage.getPositions(electionId);
      return res.status(200).json(positions);
    } catch (error) {
      console.error('Get positions error:', error);
      return res.status(500).json({ message: 'Failed to retrieve positions' });
    }
  });

  // Candidates
  app.get('/api/admin/candidates', requireRole(['admin']), async (req: Request, res: Response) => {
    try {
      const electionId = parseInt(req.query.electionId as string);
      if (isNaN(electionId)) {
        return res.status(400).json({ message: 'Election ID is required' });
      }
      
      const candidates = await storage.getCandidates(electionId);
      const candidatesWithDetails = await Promise.all(
        candidates.map(async candidate => await storage.getCandidateWithDetails(candidate.id))
      );
      
      return res.status(200).json(candidatesWithDetails.filter(c => c !== undefined));
    } catch (error) {
      console.error('Get candidates error:', error);
      return res.status(500).json({ message: 'Failed to retrieve candidates' });
    }
  });

  app.patch('/api/admin/candidates/:id/status', requireRole(['admin']), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      if (!['pending', 'approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }
      
      const updated = await storage.updateCandidateStatus(id, status);
      if (!updated) {
        return res.status(404).json({ message: 'Candidate not found' });
      }
      
      return res.status(200).json(updated);
    } catch (error) {
      console.error('Update candidate status error:', error);
      return res.status(500).json({ message: 'Failed to update candidate status' });
    }
  });

  // Voters
  app.get('/api/admin/voters', requireRole(['admin']), async (req: Request, res: Response) => {
    try {
      const electionId = parseInt(req.query.electionId as string);
      if (isNaN(electionId)) {
        return res.status(400).json({ message: 'Election ID is required' });
      }
      
      const voters = await storage.getEligibleVoters(electionId);
      // Get voting status
      const votersWithStatus = await Promise.all(
        voters.map(async voter => {
          const user = await storage.getUserByStudentId(voter.studentId);
          let hasVoted = false;
          
          if (user) {
            hasVoted = await storage.hasUserVotedInElection(user.id, electionId);
          }
          
          return {
            ...voter,
            hasVoted
          };
        })
      );
      
      return res.status(200).json(votersWithStatus);
    } catch (error) {
      console.error('Get voters error:', error);
      return res.status(500).json({ message: 'Failed to retrieve voters' });
    }
  });

  app.post('/api/admin/voters/upload', requireRole(['admin']), async (req: Request, res: Response) => {
    try {
      if (!req.body.csvData || !req.body.electionId) {
        return res.status(400).json({ message: 'CSV data and election ID are required' });
      }
      
      const electionId = parseInt(req.body.electionId);
      const csvData = req.body.csvData;
      
      // Parse CSV data
      const records = parse(csvData, {
        columns: true,
        skip_empty_lines: true
      });
      
      // Validate CSV data
      const voters = [];
      for (const record of records) {
        try {
          const validatedVoter = csvVoterSchema.parse({
            studentId: record.studentId,
            name: record.name,
            department: record.department
          });
          
          voters.push({
            ...validatedVoter,
            electionId
          });
        } catch (error) {
          console.error('Invalid voter data:', record, error);
          // Skip invalid records
        }
      }
      
      if (voters.length === 0) {
        return res.status(400).json({ message: 'No valid voter records found in CSV' });
      }
      
      const createdVoters = await storage.bulkCreateEligibleVoters(voters);
      return res.status(201).json({ 
        message: `${createdVoters.length} voters imported successfully`,
        count: createdVoters.length
      });
    } catch (error) {
      console.error('CSV upload error:', error);
      return res.status(500).json({ message: 'Failed to process CSV data' });
    }
  });

  app.post('/api/admin/voters', requireRole(['admin']), async (req: Request, res: Response) => {
    try {
      if (!req.body.studentId || !req.body.name || !req.body.electionId) {
        return res.status(400).json({ message: 'Student ID, name, and election ID are required' });
      }

      // Check if voter already exists for this election
      const existingVoter = await storage.getEligibleVoterByStudentId(req.body.studentId);
      if (existingVoter && existingVoter.electionId === parseInt(req.body.electionId)) {
        return res.status(400).json({ message: 'Student is already eligible for this election' });
      }
      
      const voter = await storage.createEligibleVoter({
        studentId: req.body.studentId,
        name: req.body.name,
        department: req.body.department || '',
        electionId: parseInt(req.body.electionId)
      });
      
      return res.status(201).json(voter);
    } catch (error) {
      console.error('Create voter error:', error);
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(400).json({ message: 'Failed to add voter' });
    }
  });

  // Results
  app.get('/api/admin/results/:electionId', requireRole(['admin']), async (req: Request, res: Response) => {
    try {
      const electionId = parseInt(req.params.electionId);
      const results = await storage.getElectionResults(electionId);
      
      const election = await storage.getElection(electionId);
      if (!election) {
        return res.status(404).json({ message: 'Election not found' });
      }
      
      const eligibleVoters = await storage.getEligibleVoters(electionId);
      const votes = await storage.getVotesByElection(electionId);
      
      // Get unique voters who have cast at least one vote
      const uniqueVoters = new Set(votes.map(vote => vote.userId));
      
      return res.status(200).json({
        electionId,
        electionTitle: election.title,
        totalEligibleVoters: eligibleVoters.length,
        totalVotesCast: uniqueVoters.size,
        voterTurnout: eligibleVoters.length > 0 
          ? Math.round((uniqueVoters.size / eligibleVoters.length) * 100) 
          : 0,
        positionResults: results
      });
    } catch (error) {
      console.error('Get results error:', error);
      return res.status(500).json({ message: 'Failed to retrieve results' });
    }
  });

  // ----- Candidate Routes -----
  app.post('/api/candidates/apply', requireAuth, async (req: Request, res: Response) => {
    try {
      const validatedData = candidateApplicationSchema.parse(req.body);
      const { firstName, lastName, email, studentId, position, manifesto, electionId } = validatedData;
      
      // Check if user exists
      let user = await storage.getUserByStudentId(studentId);
      
      // Create user if not exists
      if (!user) {
        user = await storage.createUser({
          username: email,
          password: studentId,
          role: 'candidate',
          studentId,
          name: `${firstName} ${lastName}`,
          department: req.body.department || ''
        });
      }
      
      // Check if already applied
      const existingApplications = await storage.getCandidatesByUser(user.id);
      const alreadyApplied = existingApplications.some(
        c => c.position === position && c.electionId === electionId
      );
      
      if (alreadyApplied) {
        return res.status(400).json({ message: 'You have already applied for this position' });
      }
      
      // Create candidate application
      const candidate = await storage.createCandidate({
        userId: user.id,
        position: validatedData.position,
        manifesto,
        status: 'pending',
        electionId
      });
      
      // Update session to reflect candidate role
      if (req.session.user && req.session.user.role !== 'candidate') {
        req.session.user.role = 'candidate';
      }
      
      return res.status(201).json(candidate);
    } catch (error) {
      console.error('Candidate application error:', error);
      return res.status(400).json({ message: 'Invalid application data' });
    }
  });

  app.get('/api/candidates/profile', requireRole(['candidate']), async (req: Request, res: Response) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const userId = req.session.user.id;
      const applications = await storage.getCandidatesByUser(userId);
      
      if (applications.length === 0) {
        return res.status(404).json({ message: 'No candidate profile found' });
      }
      
      // Get detailed information about each application
      const detailedApplications = await Promise.all(
        applications.map(async application => {
          const details = await storage.getCandidateWithDetails(application.id);
          const election = await storage.getElection(application.electionId);
          
          return {
            ...details,
            election
          };
        })
      );
      
      return res.status(200).json(detailedApplications);
    } catch (error) {
      console.error('Get candidate profile error:', error);
      return res.status(500).json({ message: 'Failed to retrieve candidate profile' });
    }
  });

  // ----- Voter Routes -----
  app.get('/api/elections/active', requireAuth, async (req: Request, res: Response) => {
    try {
      const elections = await storage.getElections();
      const activeElections = elections.filter(e => e.status === 'active');
      
      return res.status(200).json(activeElections);
    } catch (error) {
      console.error('Get active elections error:', error);
      return res.status(500).json({ message: 'Failed to retrieve active elections' });
    }
  });

  app.get('/api/elections/:id/ballot', requireRole(['voter']), async (req: Request, res: Response) => {
    try {
      const electionId = parseInt(req.params.id);
      const userId = req.session.user!.id;
      
      // Check if user has already voted
      const hasVoted = await storage.hasUserVotedInElection(userId, electionId);
      if (hasVoted) {
        return res.status(400).json({ message: 'You have already voted in this election' });
      }
      
      // Get election details
      const election = await storage.getElectionWithDetails(electionId);
      if (!election) {
        return res.status(404).json({ message: 'Election not found' });
      }
      
      if (election.status !== 'active') {
        return res.status(400).json({ message: 'This election is not currently active' });
      }
      
      // Get positions and approved candidates
      const positions = await storage.getPositions(electionId);
      const ballot = await Promise.all(
        positions.map(async position => {
          const candidates = await storage.getCandidatesByPosition(position.id);
          const approvedCandidates = candidates.filter(c => c.status === 'approved');
          
          const candidatesWithDetails = await Promise.all(
            approvedCandidates.map(async candidate => {
              return await storage.getCandidateWithDetails(candidate.id);
            })
          );
          
          return {
            position,
            candidates: candidatesWithDetails.filter(c => c !== undefined)
          };
        })
      );
      
      return res.status(200).json({
        election,
        ballot
      });
    } catch (error) {
      console.error('Get ballot error:', error);
      return res.status(500).json({ message: 'Failed to retrieve ballot' });
    }
  });

  app.post('/api/vote', requireRole(['voter']), async (req: Request, res: Response) => {
    try {
      const validatedData = voteSubmissionSchema.parse(req.body);
      const { electionId, votes } = validatedData;
      const userId = req.session.user!.id;
      
      // Check if user has already voted
      const hasVoted = await storage.hasUserVotedInElection(userId, electionId);
      if (hasVoted) {
        return res.status(400).json({ message: 'You have already voted in this election' });
      }
      
      // Get election
      const election = await storage.getElection(electionId);
      if (!election) {
        return res.status(404).json({ message: 'Election not found' });
      }
      
      if (election.status !== 'active') {
        return res.status(400).json({ message: 'This election is not currently active' });
      }
      
      // Validate one vote per position
      const positions = new Set();
      for (const vote of votes) {
        if (positions.has(vote.positionId)) {
          return res.status(400).json({ message: 'You can only vote once per position' });
        }
        positions.add(vote.positionId);
      }
      
      // Record votes
      for (const vote of votes) {
        await storage.createVote({
          userId,
          candidateId: vote.candidateId,
          positionId: vote.positionId,
          electionId
        });
      }
      
      // Update user's vote status
      await storage.updateUserVoteStatus(userId, true);
      
      return res.status(200).json({ message: 'Votes recorded successfully' });
    } catch (error) {
      console.error('Vote submission error:', error);
      return res.status(400).json({ message: 'Invalid vote data' });
    }
  });

  app.get('/api/elections/:id/results', requireAuth, async (req: Request, res: Response) => {
    try {
      const electionId = parseInt(req.params.id);
      
      // Get election
      const election = await storage.getElection(electionId);
      if (!election) {
        return res.status(404).json({ message: 'Election not found' });
      }
      
      // Only show results if election is completed or user is admin
      const isAdmin = req.session.user?.role === 'admin';
      if (election.status !== 'completed' && !isAdmin) {
        return res.status(403).json({ message: 'Results are not available yet' });
      }
      
      const results = await storage.getElectionResults(electionId);
      const eligibleVoters = await storage.getEligibleVoters(electionId);
      const votes = await storage.getVotesByElection(electionId);
      
      // Get unique voters who have cast at least one vote
      const uniqueVoters = new Set(votes.map(vote => vote.userId));
      
      return res.status(200).json({
        electionId,
        electionTitle: election.title,
        totalEligibleVoters: eligibleVoters.length,
        totalVotesCast: uniqueVoters.size,
        voterTurnout: eligibleVoters.length > 0 
          ? Math.round((uniqueVoters.size / eligibleVoters.length) * 100) 
          : 0,
        positionResults: results
      });
    } catch (error) {
      console.error('Get results error:', error);
      return res.status(500).json({ message: 'Failed to retrieve results' });
    }
  });

  return httpServer;
}