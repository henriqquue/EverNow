import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format currency in BRL
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

// Format date in PT-BR
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

// Format datetime in PT-BR
export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

// Format relative time
export function formatRelativeTime(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diff = now.getTime() - d.getTime();

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Agora mesmo";
  if (minutes < 60) return `${minutes}min atrás`;
  if (hours < 24) return `${hours}h atrás`;
  if (days < 7) return `${days}d atrás`;
  return formatDate(d);
}

// Calculate age from birthdate
export function calculateAge(birthDate: Date | string | null | undefined): number | null {
  if (!birthDate) return null;
  const d = typeof birthDate === "string" ? new Date(birthDate) : birthDate;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const monthDiff = today.getMonth() - d.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < d.getDate())) {
    age--;
  }
  return age;
}

// Truncate text
export function truncate(text: string | null | undefined, length: number): string {
  if (!text) return "";
  if (text.length <= length) return text;
  return text.slice(0, length) + "...";
}

// Generate initials from name
export function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// Slugify string
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Validate email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Password strength checker
export function checkPasswordStrength(password: string): {
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) score++;
  else feedback.push("Mínimo 8 caracteres");

  if (/[a-z]/.test(password)) score++;
  else feedback.push("Incluir letra minúscula");

  if (/[A-Z]/.test(password)) score++;
  else feedback.push("Incluir letra maiúscula");

  if (/[0-9]/.test(password)) score++;
  else feedback.push("Incluir número");

  if (/[^a-zA-Z0-9]/.test(password)) score++;
  else feedback.push("Incluir caractere especial");

  return { score, feedback };
}

// Get role display name
export function getRoleDisplayName(role: string): string {
  const roles: Record<string, string> = {
    SUPERADMIN: "Super Admin",
    ADMIN: "Administrador",
    USER: "Usuário",
  };
  return roles[role] || role;
}

// Get status display name
export function getStatusDisplayName(status: string): string {
  const statuses: Record<string, string> = {
    ACTIVE: "Ativo",
    INACTIVE: "Inativo",
    SUSPENDED: "Suspenso",
    PENDING: "Pendente",
    CANCELED: "Cancelado",
    EXPIRED: "Expirado",
    TRIAL: "Trial",
  };
  return statuses[status] || status;
}

// Get status color
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    INACTIVE: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
    SUSPENDED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    CANCELED: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
    EXPIRED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    TRIAL: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
}
