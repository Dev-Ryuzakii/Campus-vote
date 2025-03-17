import { 
  type User, type InsertUser, 
  type Election, type InsertElection,
  type Position, type InsertPosition, 
  type Candidate, type InsertCandidate,
  type Vote, type InsertVote,
  type EligibleVoter, type InsertEligibleVoter,
  type CandidateWithDetails, type ElectionWithDetails,
  type VoteResult, type PositionResults, type AuthData
} from "@shared/schema";

// Interface for all storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByStudentId(studentId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserVoteStatus(userId: number, hasVoted: boolean): Promise<User>;

  // Election operations
  getElections(): Promise<Election[]>;
  getElection(id: number): Promise<Election | undefined>;
  createElection(election: InsertElection): Promise<Election>;
  updateElection(id: number, election: Partial<InsertElection>): Promise<Election | undefined>;
  getElectionWithDetails(id: number): Promise<ElectionWithDetails | undefined>;
  
  // Position operations
  getPositions(electionId: number): Promise<Position[]>;
  getPosition(id: number): Promise<Position | undefined>;
  createPosition(position: InsertPosition): Promise<Position>;
  
  // Candidate operations
  getCandidates(electionId: number): Promise<Candidate[]>;
  getCandidate(id: number): Promise<Candidate | undefined>;
  getCandidatesByPosition(positionId: number): Promise<Candidate[]>;
  getCandidatesByUser(userId: number): Promise<Candidate[]>;
  getCandidateWithDetails(id: number): Promise<CandidateWithDetails | undefined>;
  createCandidate(candidate: InsertCandidate): Promise<Candidate>;
  updateCandidateStatus(id: number, status: 'pending' | 'approved' | 'rejected'): Promise<Candidate | undefined>;
  
  // Vote operations
  createVote(vote: InsertVote): Promise<Vote>;
  getVotesByElection(electionId: number): Promise<Vote[]>;
  hasUserVotedInElection(userId: number, electionId: number): Promise<boolean>;
  getElectionResults(electionId: number): Promise<PositionResults[]>;
  
  // Eligible voter operations
  getEligibleVoters(electionId: number): Promise<EligibleVoter[]>;
  getEligibleVoterByStudentId(studentId: string): Promise<EligibleVoter | undefined>;
  createEligibleVoter(voter: InsertEligibleVoter): Promise<EligibleVoter>;
  bulkCreateEligibleVoters(voters: InsertEligibleVoter[]): Promise<EligibleVoter[]>;
  isStudentEligible(studentId: string, electionId: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private elections: Map<number, Election>;
  private positions: Map<number, Position>;
  private candidates: Map<number, Candidate>;
  private votes: Map<number, Vote>;
  private eligibleVoters: Map<number, EligibleVoter>;
  
  private currentIds: {
    users: number;
    elections: number;
    positions: number;
    candidates: number;
    votes: number;
    eligibleVoters: number;
  };

  constructor() {
    this.users = new Map();
    this.elections = new Map();
    this.positions = new Map();
    this.candidates = new Map();
    this.votes = new Map();
    this.eligibleVoters = new Map();
    
    this.currentIds = {
      users: 1,
      elections: 1,
      positions: 1,
      candidates: 1,
      votes: 1,
      eligibleVoters: 1
    };

    // Initialize with admin user only
    const adminUser: User = {
      id: 1,
      username: 'admin',
      password: 'admin123',
      role: 'admin',
      studentId: null,
      department: null,
      name: 'Administrator',
      hasVoted: false
    };
    this.users.set(1, adminUser);
    this.currentIds.users = 2;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async getUserByStudentId(studentId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.studentId === studentId
    );
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.currentIds.users++;
    const newUser: User = { ...user, id, hasVoted: false };
    this.users.set(id, newUser);
    return newUser;
  }

  async updateUserVoteStatus(userId: number, hasVoted: boolean): Promise<User> {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    const updatedUser = { ...user, hasVoted };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  // Election operations
  async getElections(): Promise<Election[]> {
    return Array.from(this.elections.values());
  }

  async getElection(id: number): Promise<Election | undefined> {
    return this.elections.get(id);
  }

  async createElection(election: InsertElection): Promise<Election> {
    const id = this.currentIds.elections++;
    const newElection: Election = { 
      ...election, 
      id, 
      createdAt: new Date() 
    };
    this.elections.set(id, newElection);
    return newElection;
  }

  async updateElection(id: number, election: Partial<InsertElection>): Promise<Election | undefined> {
    const existingElection = this.elections.get(id);
    if (!existingElection) {
      return undefined;
    }
    
    const updatedElection = { ...existingElection, ...election };
    this.elections.set(id, updatedElection);
    return updatedElection;
  }

  async getElectionWithDetails(id: number): Promise<ElectionWithDetails | undefined> {
    const election = this.elections.get(id);
    if (!election) {
      return undefined;
    }
    
    const positions = await this.getPositions(id);
    const allCandidates = await this.getCandidates(id);
    
    const candidatesWithDetails: CandidateWithDetails[] = await Promise.all(
      allCandidates.map(async (candidate) => {
        const user = await this.getUser(candidate.userId);
        const position = await this.getPosition(candidate.positionId);
        
        if (!user || !position) {
          throw new Error(`Data inconsistency: unable to load candidate details`);
        }
        
        return {
          ...candidate,
          user,
          position
        };
      })
    );
    
    return {
      ...election,
      positions,
      candidates: candidatesWithDetails
    };
  }

  // Position operations
  async getPositions(electionId: number): Promise<Position[]> {
    return Array.from(this.positions.values()).filter(
      (position) => position.electionId === electionId
    );
  }

  async getPosition(id: number): Promise<Position | undefined> {
    return this.positions.get(id);
  }

  async createPosition(position: InsertPosition): Promise<Position> {
    const id = this.currentIds.positions++;
    const newPosition: Position = { ...position, id };
    this.positions.set(id, newPosition);
    return newPosition;
  }

  // Candidate operations
  async getCandidates(electionId: number): Promise<Candidate[]> {
    return Array.from(this.candidates.values()).filter(
      (candidate) => candidate.electionId === electionId
    );
  }

  async getCandidate(id: number): Promise<Candidate | undefined> {
    return this.candidates.get(id);
  }

  async getCandidatesByPosition(positionId: number): Promise<Candidate[]> {
    return Array.from(this.candidates.values()).filter(
      (candidate) => candidate.positionId === positionId
    );
  }

  async getCandidatesByUser(userId: number): Promise<Candidate[]> {
    return Array.from(this.candidates.values()).filter(
      (candidate) => candidate.userId === userId
    );
  }

  async getCandidateWithDetails(id: number): Promise<CandidateWithDetails | undefined> {
    const candidate = this.candidates.get(id);
    if (!candidate) {
      return undefined;
    }
    
    const user = await this.getUser(candidate.userId);
    const position = await this.getPosition(candidate.positionId);
    
    if (!user || !position) {
      return undefined;
    }
    
    return {
      ...candidate,
      user,
      position
    };
  }

  async createCandidate(candidate: InsertCandidate): Promise<Candidate> {
    const id = this.currentIds.candidates++;
    const newCandidate: Candidate = { ...candidate, id };
    this.candidates.set(id, newCandidate);
    return newCandidate;
  }

  async updateCandidateStatus(id: number, status: 'pending' | 'approved' | 'rejected'): Promise<Candidate | undefined> {
    const candidate = this.candidates.get(id);
    if (!candidate) {
      return undefined;
    }
    
    const updatedCandidate = { ...candidate, status };
    this.candidates.set(id, updatedCandidate);
    return updatedCandidate;
  }

  // Vote operations
  async createVote(vote: InsertVote): Promise<Vote> {
    const id = this.currentIds.votes++;
    const newVote: Vote = { ...vote, id, timestamp: new Date() };
    this.votes.set(id, newVote);
    return newVote;
  }

  async getVotesByElection(electionId: number): Promise<Vote[]> {
    return Array.from(this.votes.values()).filter(
      (vote) => vote.electionId === electionId
    );
  }

  async hasUserVotedInElection(userId: number, electionId: number): Promise<boolean> {
    const votes = Array.from(this.votes.values());
    return votes.some(vote => vote.userId === userId && vote.electionId === electionId);
  }

  async getElectionResults(electionId: number): Promise<PositionResults[]> {
    const positions = await this.getPositions(electionId);
    const votes = await this.getVotesByElection(electionId);
    
    const results: PositionResults[] = [];
    
    for (const position of positions) {
      const candidateVotes: Record<number, number> = {};
      const positionVotes = votes.filter(vote => vote.positionId === position.id);
      
      // Count votes for each candidate
      for (const vote of positionVotes) {
        if (!candidateVotes[vote.candidateId]) {
          candidateVotes[vote.candidateId] = 0;
        }
        candidateVotes[vote.candidateId]++;
      }
      
      const totalVotesForPosition = positionVotes.length;
      const candidateResults: VoteResult[] = [];
      
      // Create result object for each candidate
      for (const candidateId in candidateVotes) {
        const candidate = await this.getCandidateWithDetails(parseInt(candidateId));
        if (candidate && candidate.user) {
          const votes = candidateVotes[parseInt(candidateId)];
          const percentage = totalVotesForPosition > 0 
            ? Math.round((votes / totalVotesForPosition) * 100) 
            : 0;
            
          candidateResults.push({
            candidateId: candidate.id,
            candidateName: candidate.user.name || 'Unknown',
            candidateStudentId: candidate.user.studentId || '',
            votes,
            percentage
          });
        }
      }
      
      // Sort by votes in descending order
      candidateResults.sort((a, b) => b.votes - a.votes);
      
      results.push({
        positionId: position.id,
        positionTitle: position.title,
        results: candidateResults
      });
    }
    
    return results;
  }

  // Eligible voter operations
  async getEligibleVoters(electionId: number): Promise<EligibleVoter[]> {
    return Array.from(this.eligibleVoters.values()).filter(
      (voter) => voter.electionId === electionId
    );
  }

  async getEligibleVoterByStudentId(studentId: string): Promise<EligibleVoter | undefined> {
    return Array.from(this.eligibleVoters.values()).find(
      (voter) => voter.studentId === studentId
    );
  }

  async createEligibleVoter(voter: InsertEligibleVoter): Promise<EligibleVoter> {
    const id = this.currentIds.eligibleVoters++;
    const newVoter: EligibleVoter = { ...voter, id };
    this.eligibleVoters.set(id, newVoter);
    return newVoter;
  }

  async bulkCreateEligibleVoters(voters: InsertEligibleVoter[]): Promise<EligibleVoter[]> {
    const createdVoters: EligibleVoter[] = [];
    
    for (const voter of voters) {
      const newVoter = await this.createEligibleVoter(voter);
      createdVoters.push(newVoter);
    }
    
    return createdVoters;
  }

  async isStudentEligible(studentId: string, electionId: number): Promise<boolean> {
    const eligibleVoters = await this.getEligibleVoters(electionId);
    return eligibleVoters.some(voter => voter.studentId === studentId);
  }
}

// Create and export a single storage instance
export const storage = new MemStorage();
