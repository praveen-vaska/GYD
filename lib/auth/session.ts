import { UserRole } from "@/types";

export interface SessionPayload {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  designerId?: string;
  city: string;
  isDemoSession: boolean;
}

export function canAccessWorkspace(
  session: SessionPayload | null,
  requiredRole: UserRole
): boolean {
  if (!session) return false;
  if (session.role === "ADMIN") return true;
  return session.role === requiredRole;
}

export function getRoleDashboardPath(role: UserRole): string {
  switch (role) {
    case "ADMIN":
      return "/admin/dashboard";
    case "DESIGNER":
      return "/designer/dashboard";
    default:
      return "/customer/dashboard";
  }
}

export function sanitizeText(input: string): string {
  return input.replace(/[<>]/g, "").trim();
}
