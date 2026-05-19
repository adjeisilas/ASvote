export type UserRole = "admin" | "organizer";

export interface User {
  uid: string;
  email: string;
  role: UserRole;
  status: "pending" | "approved" | "rejected";
  emailVerified?: boolean;
  displayName: string;
  phoneNumber?: string;
  createdAt: string;
}

export interface Event {
  id: string;
  organizerId: string;
  title: string;
  description: string;
  type: "voting" | "ticketing";
  status: "draft" | "pending" | "approved" | "rejected" | "active" | "ended";
  coverImage?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  
  // Compatibility layer for legacy UI
  startDate?: string;
  endDate?: string;
  totalVotes?: number;
  commission?: number;
  votePrice?: number; // Some parts might use this on event incorrectly
  venue?: string;
  doorsOpen?: string;
  mainEventStart?: string;
  expectedEnd?: string;
  organizerEmail?: string;
  organizerPhone?: string;
  salesStart?: string;
  salesEnd?: string;
  refundPolicy?: string;
  maxTicketsPerUser?: number;

  // Voting Extension (optional depending on type)
  votingDetails?: {
    startDate: string;
    endDate: string;
    totalVotes: number;
    commission: number;
    votingInstructions?: string;
    multipleVotesEnabled: boolean;
  };

  // Ticketing Extension (optional depending on type)
  ticketingDetails?: {
    venue: string;
    doorsOpen?: string;
    eventTime?: string;
    expectedEnd?: string;
    eventDate: string;
    organizerEmail?: string;
    organizerPhone?: string;
    salesStart?: string;
    salesEnd?: string;
    refundPolicy?: string;
    maxTicketsPerUser: number;
    commission: number;
  };
}

export interface Category {
  id: string;
  eventId: string;
  name: string;
  description?: string;
  createdAt?: string;
  // Voting Specific
  votePrice?: number;
  // Ticketing Specific (for Tiers)
  price?: number;
  capacity?: number;
  soldCount?: number;
  ticketsSold?: number; // Legacy
}

export interface Nominee {
  id: string;
  categoryId: string;
  eventId: string;
  name: string;
  code: string;
  imageUrl?: string;
  description?: string;
  voteCount: number;
  createdAt?: string;
  // New Ticketing Fields
  capacity?: number;
  soldCount?: number;
}

export interface PromoCode {
  id: string;
  eventId: string;
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  usageLimit?: number;
  usageCount: number;
  expiryDate?: string;
  isActive: boolean;
}

export interface Ticket {
  id: string;
  transactionId: string;
  eventId: string;
  tierId: string;
  tierName?: string;
  holderName?: string;
  holderEmail?: string;
  qrCode: string;
  checkedIn: boolean;
  checkedInAt?: string;
  createdAt: string;
  voterEmail?: string;
}

export interface Transaction {
  id: string;
  voterEmail?: string;
  eventId: string;
  organizerId: string;
  amount: number;
  type: "vote" | "ticket";
  status: "success" | "failed" | "pending";
  paystackRef: string;
  createdAt: string;
  discountApplied?: number;
  promoCodeId?: string;
  
  // Voting mapped from vote_transactions
  votes?: number;
  nomineeId?: string;
  categoryId?: string;
  
  // Ticketing mapped from tickets
  tickets?: Ticket[];
}

export interface Withdrawal {
  id: string;
  organizerId: string;
  organizerName: string;
  organizerEmail: string;
  amount: number;
  status: "pending" | "approved" | "rejected" | "completed";
  createdAt: string;
  processedBy?: string;
  processedAt?: string;
}

export interface ActivityLog {
  id: string;
  action: string;
  adminId: string;
  createdAt: string;
  details?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  createdAt: string;
  read: boolean;
}
