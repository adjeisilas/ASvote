import { z } from "zod";

// --- CORE SCHEMAS ---

export const idSchema = z.string().uuid("Invalid ID format");

export const emailSchema = z.string().email("Invalid email address");

// --- VOTING SCHEMAS ---

export const voteDataSchema = z.object({
  event_id: z.string().uuid("Invalid event ID"),
  organizer_id: z.string().uuid("Invalid organizer ID"),
  voter_email: emailSchema,
  votes: z.number().int().positive("Votes must be a positive integer").optional(),
  quantity: z.number().int().positive("Quantity must be a positive integer").optional(),
  nominee_id: z.string().uuid("Invalid nominee ID").optional().nullable(),
  category_id: z.string().uuid("Invalid category ID").optional().nullable(),
  type: z.enum(["vote", "ticket"]),
  amount: z.number().nonnegative("Amount cannot be negative"),
  commission: z.number().nonnegative().optional(),
  discount_applied: z.number().nonnegative().optional(),
  promo_code_id: z.string().uuid().optional().nullable(),
  recipient_name: z.string().optional().nullable(),
}).refine(data => data.votes || data.quantity, {
  message: "Either votes or quantity must be provided",
  path: ["votes", "quantity"]
});

export const recordVoteSchema = z.object({
  reference: z.string().min(1, "Payment reference is required"),
  voteData: voteDataSchema,
});

// --- ADMIN SCHEMAS ---

export const deleteUserAuthSchema = z.object({
  userId: idSchema,
  adminId: idSchema,
});

// --- PAYMENT SCHEMAS ---

export const initializePaymentSchema = z.object({
  email: emailSchema,
  amount: z.number().positive("Amount must be positive"),
  metadata: z.record(z.string(), z.any()).optional(),
});

// --- WITHDRAWAL SCHEMAS ---

export const requestWithdrawalSchema = z.object({
  uid: idSchema,
  amount: z.number().int().positive("Withdrawal amount must be a positive integer"),
});

export const ussdSchema = z.object({
  sessionID: z.string().optional(),
  sessionId: z.string().optional(),
  userID: z.string().optional(),
  newSession: z.union([z.boolean(), z.string()]).optional(),
  msisdn: z.string().optional(),
  phoneNumber: z.string().optional(),
  userData: z.string().optional(),
  text: z.string().optional(),
  network: z.string().optional(),
  serviceCode: z.string().optional(),
}).passthrough();

