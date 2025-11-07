import { hashMasterPassword, verifyMasterPassword } from './encryption';

/**
 * Password validation requirements
 */
export const PASSWORD_REQUIREMENTS = {
  MIN_LENGTH: 8,
  REQUIRE_UPPERCASE: true,
  REQUIRE_NUMBER: true,
  REQUIRE_SPECIAL: true,
} as const;

/**
 * Validates master password strength
 * Requirements:
 * - Minimum 8 characters
 * - At least 1 uppercase letter
 * - At least 1 number
 * - At least 1 special character
 */
export const validateMasterPassword = (password: string): { valid: boolean; message: string } => {
  if (password.length < PASSWORD_REQUIREMENTS.MIN_LENGTH) {
    return { valid: false, message: 'A senha deve ter no mínimo 8 caracteres' };
  }

  if (PASSWORD_REQUIREMENTS.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
    return { valid: false, message: 'A senha deve conter pelo menos 1 letra maiúscula' };
  }

  if (PASSWORD_REQUIREMENTS.REQUIRE_NUMBER && !/[0-9]/.test(password)) {
    return { valid: false, message: 'A senha deve conter pelo menos 1 número' };
  }

  if (PASSWORD_REQUIREMENTS.REQUIRE_SPECIAL && !/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
    return { valid: false, message: 'A senha deve conter pelo menos 1 caractere especial' };
  }

  return { valid: true, message: 'Senha forte!' };
};

/**
 * Hashes a password using PBKDF2 with salt (OWASP compliant)
 * @param password - Plain text password
 * @returns Object with hash and salt
 */
export const hashPassword = async (
  password: string
): Promise<{ hash: string; salt: string }> => {
  return await hashMasterPassword(password);
};

/**
 * Verifies a password against stored hash and salt
 */
export const verifyPassword = async (
  password: string,
  storedHash: string,
  salt: string
): Promise<boolean> => {
  return await verifyMasterPassword(password, storedHash, salt);
};
