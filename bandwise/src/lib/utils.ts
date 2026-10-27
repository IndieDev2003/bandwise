import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format time as MM:SS
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Calculate band score from raw score (module-specific)
export function calculateBandScore(rawScore: number, module: 'reading' | 'listening' | 'writing' | 'speaking'): number {
  // IELTS band score conversion
  const bandMap: Record<'reading' | 'listening' | 'writing' | 'speaking', number[]> = {
    reading: [0, 0, 0, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9],
    listening: [0, 0, 0, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9],
    writing: [0, 0, 0, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9],
    speaking: [0, 0, 0, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9]
  };
  
  const scores = bandMap[module];
  const index = Math.floor(rawScore / 10);
  return scores[Math.min(index, scores.length - 1)];
}

// Generate unique ID
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}

// Truncate text with ellipsis
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

// Format date
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Format currency (INR)
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(amount / 100);
}

// Get band descriptor
export function getBandDescriptor(band: number): string {
  const descriptors = {
    9: 'Expert user - Has fully operational command of the language',
    8.5: 'Expert user',
    8: 'Very good user - Has fully operational command with only occasional unsystematic inaccuracies',
    7.5: 'Good user',
    7: 'Good user - Has operational command with occasional inaccuracies',
    6.5: 'Competent user',
    6: 'Competent user - Has generally effective command despite some inaccuracies',
    5.5: 'Modest user',
    5: 'Modest user - Has partial command with many mistakes',
    4.5: 'Limited user',
    4: 'Limited user - Basic competence is limited to familiar situations',
    3.5: 'Extremely limited user',
    3: 'Extremely limited user - Conveys only general meaning in very familiar situations',
    2.5: 'Intermittent user',
    2: 'Intermittent user - Has great difficulty understanding spoken and written English',
    1: 'Non-user - Essentially has no ability to use the language',
    0: 'Did not attempt the test'
  };
  
  const roundedBand = Math.round(band * 2) / 2;
  return descriptors[roundedBand as keyof typeof descriptors] || descriptors[0];
}
