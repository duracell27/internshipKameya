export const validation = {
  phone: (value: string): { valid: boolean; error?: string } => {
    const phone = value.trim();
    // Перевірка: 10-12 цифр або з префіксом +380
    const isValid = /^(\+?380|0)?\d{9,10}$/.test(phone.replace(/\D/g, ''));
    return isValid
      ? { valid: true }
      : { valid: false, error: 'Невірний формат номера телефону' };
  },

  text: (value: string, minLength = 1, maxLength = Infinity): { valid: boolean; error?: string } => {
    const trimmed = value.trim();
    if (trimmed.length < minLength) {
      return { valid: false, error: `Мінімум ${minLength} символів` };
    }
    if (trimmed.length > maxLength) {
      return { valid: false, error: `Максимум ${maxLength} символів` };
    }
    return { valid: true };
  },

  taskTitle: (value: string): { valid: boolean; error?: string } => {
    return validation.text(value, 3, 200);
  },

  reflection: (value: string): { valid: boolean; error?: string } => {
    return validation.text(value, 10, 5000);
  },

  email: (value: string): { valid: boolean; error?: string } => {
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    return isValid
      ? { valid: true }
      : { valid: false, error: 'Невірна адреса електронної пошти' };
  },
};
