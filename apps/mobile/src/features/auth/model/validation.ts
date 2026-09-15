const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export type FieldError = 'invalidEmail' | 'shortPassword' | 'mismatch';

export function emailError(email: string): FieldError | null {
  return EMAIL_PATTERN.test(email.trim()) ? null : 'invalidEmail';
}

export function passwordError(password: string, minLength: number): FieldError | null {
  return password.length >= minLength ? null : 'shortPassword';
}

export function confirmError(password: string, confirm: string): FieldError | null {
  return password === confirm ? null : 'mismatch';
}
