import { z } from "zod";
import { amountString, uuid } from "./common";

export type CustomerStatus = "CLEAR" | "OWING" | "ALERT" | "ADVANCE";

export type CustomerBalance = {
  id: string;
  name: string;
  phone: string; // phone is stored form 91XXXXXXXXXX
  alertStep: string;
  isActive: boolean;
  balance: string; // may be negative (advance)
  status: CustomerStatus;
  alertLevel: number;
  lastActivityAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export const createCustomerSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80, "Name must be at most 80 characters"),
  phone: z.string(),
  alertStep: amountString,
  confirmDuplicate: z.boolean().default(false),
});
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;

export const updateCustomerSchema = z.object({
  id: uuid,
  name: z.string().trim().min(1, "Name is required").max(80, "Name must be at most 80 characters"),
  phone: z.string(),
  alertStep: amountString,
  confirmDuplicate: z.boolean().default(false),
});
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;

export const setCustomerActiveSchema = z.object({
  id: uuid,
  isActive: z.boolean(),
});
export type SetCustomerActiveInput = z.infer<typeof setCustomerActiveSchema>;
