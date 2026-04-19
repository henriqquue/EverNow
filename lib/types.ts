import { User, Plan, Subscription, Module, Feature, FeatureLimit } from "@prisma/client";
import { DefaultSession, DefaultUser } from "next-auth";

// Extend NextAuth types
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: string;
      planId: string | null;
      planSlug: string | null;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role: string;
    planId: string | null;
    planSlug: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    planId: string | null;
    planSlug: string | null;
  }
}

// User with relations
export type UserWithRelations = User & {
  plan?: Plan | null;
  subscription?: Subscription | null;
};

// Plan with features
export type PlanWithFeatures = Plan & {
  featureLimits: (FeatureLimit & {
    feature: Feature;
  })[];
};

// Module with features
export type ModuleWithFeatures = Module & {
  features: Feature[];
};

// Feature with limits
export type FeatureWithLimits = Feature & {
  featureLimits: FeatureLimit[];
};

// Dashboard stats
export interface DashboardStats {
  totalUsers: number;
  newUsersToday: number;
  activeSubscribers: number;
  freeUsers: number;
  conversionRate: number;
  pendingReports: number;
  pendingVerifications: number;
}

// User profile completion
export interface ProfileCompletion {
  percentage: number;
  missingFields: string[];
  completedFields: string[];
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Pagination
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Filter options
export interface FilterOptions {
  search?: string;
  status?: string;
  role?: string;
  plan?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
