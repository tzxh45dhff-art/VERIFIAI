import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "applicant" | "auditor";
  organization: string;
  plan: "starter" | "pro" | "enterprise";
  joinedAt: string;
  casesAnalyzed: number;
  hallucinationsFound: number;
  decisionsFlipped: number;
}

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  updateStats: (delta: Partial<Pick<User, "casesAnalyzed" | "hallucinationsFound" | "decisionsFlipped">>) => void;
}

const MOCK_USERS: (User & { password: string })[] = [
  {
    id: "u1", name: "Arjun Mehta", email: "demo@verifiai.com", password: "demo123",
    role: "admin", organization: "VerifAI Labs", plan: "pro",
    joinedAt: "2024-09-01", casesAnalyzed: 47, hallucinationsFound: 134, decisionsFlipped: 23,
  },
  {
    id: "u2", name: "Aarav Sharma", email: "applicant@test.com", password: "test123",
    role: "applicant", organization: "GreenLeaf AgriTech", plan: "starter",
    joinedAt: "2025-01-15", casesAnalyzed: 3, hallucinationsFound: 4, decisionsFlipped: 1,
  },
  {
    id: "u3", name: "Priya Nair", email: "auditor@bank.com", password: "audit123",
    role: "auditor", organization: "National Credit Bureau", plan: "enterprise",
    joinedAt: "2024-06-10", casesAnalyzed: 218, hallucinationsFound: 673, decisionsFlipped: 89,
  },
];

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      login: async (email, password) => {
        const found = MOCK_USERS.find(
          (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
        );
        if (!found) return { ok: false, error: "Invalid email or password" };
        const { password: _pw, ...user } = found;
        set({ user, isAuthenticated: true });
        return { ok: true };
      },

      logout: () => set({ user: null, isAuthenticated: false }),

      updateStats: (delta) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...delta } : null,
        })),
    }),
    { name: "verifiai-auth" }
  )
);
