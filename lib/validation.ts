/**
 * Validates password complexity:
 * - Minimum 8 characters
 * - At least one number
 * - At least one capital letter
 * - At least one lowercase letter
 */
export const validatePassword = (password: string): { isValid: boolean; error?: string } => {
    if (password.length < 8) {
        return { isValid: false, error: 'Password minimal 8 karakter' };
    }
    if (!/[0-9]/.test(password)) {
        return { isValid: false, error: 'Password harus mengandung setidaknya satu angka' };
    }
    if (!/[A-Z]/.test(password)) {
        return { isValid: false, error: 'Password harus mengandung setidaknya satu huruf besar' };
    }
    if (!/[a-z]/.test(password)) {
        return { isValid: false, error: 'Password harus mengandung setidaknya satu huruf kecil' };
    }
    return { isValid: true };
};

/**
 * Validates PIN:
 * - Exactly 6 digits
 * - Only numbers
 */
export const validatePin = (pin: string): { isValid: boolean; error?: string } => {
    if (!/^\d{6}$/.test(pin)) {
        return { isValid: false, error: 'PIN harus berupa 6 digit angka' };
    }
    return { isValid: true };
};
