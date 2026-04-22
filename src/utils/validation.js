/**
 * Input Validation Utility
 * Provides robust validation and sanitization functions
 * Prevents XSS, injection attacks, and ensures data integrity
 */

/**
 * Sanitize HTML content to prevent XSS
 * @param {string} input - Raw input string
 * @returns {string} Sanitized string
 */
export const sanitizeHtml = (input) => {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Sanitize string content for general use
 * @param {string} input - Raw input string
 * @returns {string} Sanitized string
 */
export const sanitizeString = (input) => {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/data:/gi, '') // Remove data: protocol
    .substring(0, 1000); // Limit length
};

/**
 * Validate and sanitize email
 * @param {string} email - Email to validate
 * @returns {object} { isValid: boolean, sanitized: string }
 */
export const validateEmail = (email) => {
  if (typeof email !== 'string') return { isValid: false, sanitized: '' };
  
  const sanitized = sanitizeString(email);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  return {
    isValid: emailRegex.test(sanitized) && sanitized.length <= 254,
    sanitized
  };
};

/**
 * Validate and sanitize name
 * @param {string} name - Name to validate
 * @returns {object} { isValid: boolean, sanitized: string, error: string }
 */
export const validateName = (name) => {
  if (typeof name !== 'string') return { isValid: false, sanitized: '', error: 'Nome inválido' };
  
  const sanitized = sanitizeString(name);
  
  if (sanitized.length < 2) {
    return { isValid: false, sanitized, error: 'Nome deve ter pelo menos 2 caracteres' };
  }
  
  if (sanitized.length > 100) {
    return { isValid: false, sanitized, error: 'Nome deve ter no máximo 100 caracteres' };
  }
  
  const nameRegex = /^[a-zA-ZÀ-ÿ\s]+$/;
  if (!nameRegex.test(sanitized)) {
    return { isValid: false, sanitized, error: 'Nome deve conter apenas letras e espaços' };
  }
  
  return { isValid: true, sanitized };
};

/**
 * Validate and sanitize password
 * @param {string} password - Password to validate
 * @returns {object} { isValid: boolean, sanitized: string, error: string }
 */
export const validatePassword = (password) => {
  if (typeof password !== 'string') return { isValid: false, sanitized: '', error: 'Senha inválida' };
  
  const sanitized = password; // Don't sanitize password, just validate format
  
  if (sanitized.length < 8) {
    return { isValid: false, sanitized, error: 'Senha deve ter pelo menos 8 caracteres' };
  }
  
  if (sanitized.length > 128) {
    return { isValid: false, sanitized, error: 'Senha deve ter no máximo 128 caracteres' };
  }
  
  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(sanitized)) {
    return { isValid: false, sanitized, error: 'Senha deve conter pelo menos uma letra maiúscula' };
  }
  
  // Check for at least one lowercase letter
  if (!/[a-z]/.test(sanitized)) {
    return { isValid: false, sanitized, error: 'Senha deve conter pelo menos uma letra minúscula' };
  }
  
  // Check for at least one number
  if (!/[0-9]/.test(sanitized)) {
    return { isValid: false, sanitized, error: 'Senha deve conter pelo menos um número' };
  }
  
  // Check for at least one special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"|\\<>?,./]/.test(sanitized)) {
    return { isValid: false, sanitized, error: 'Senha deve conter pelo menos um caractere especial' };
  }
  
  return { isValid: true, sanitized };
};

/**
 * Validate and sanitize room name
 * @param {string} roomName - Room name to validate
 * @returns {object} { isValid: boolean, sanitized: string, error: string }
 */
export const validateRoomName = (roomName) => {
  if (typeof roomName !== 'string') return { isValid: false, sanitized: '', error: 'Nome da sala inválido' };
  
  const sanitized = sanitizeString(roomName);
  
  if (sanitized.length < 3) {
    return { isValid: false, sanitized, error: 'Nome da sala deve ter pelo menos 3 caracteres' };
  }
  
  if (sanitized.length > 50) {
    return { isValid: false, sanitized, error: 'Nome da sala deve ter no máximo 50 caracteres' };
  }
  
  const roomNameRegex = /^[a-zA-Z0-9À-ÿ\s\-_]+$/;
  if (!roomNameRegex.test(sanitized)) {
    return { isValid: false, sanitized, error: 'Nome da sala deve conter apenas letras, números, espaços, hífens e underscores' };
  }
  
  return { isValid: true, sanitized };
};

/**
 * Validate numeric input
 * @param {string|number} input - Input to validate
 * @param {object} options - Validation options
 * @returns {object} { isValid: boolean, sanitized: number, error: string }
 */
export const validateNumber = (input, options = {}) => {
  const {
    min = -Infinity,
    max = Infinity,
    integer = false,
    allowNegative = true
  } = options;
  
  const sanitized = sanitizeString(String(input));
  
  if (sanitized === '') {
    return { isValid: false, sanitized: 0, error: 'Valor é obrigatório' };
  }
  
  const num = parseFloat(sanitized);
  
  if (isNaN(num)) {
    return { isValid: false, sanitized: 0, error: 'Valor numérico inválido' };
  }
  
  if (integer && !Number.isInteger(num)) {
    return { isValid: false, sanitized: num, error: 'Valor deve ser um número inteiro' };
  }
  
  if (!allowNegative && num < 0) {
    return { isValid: false, sanitized: num, error: 'Valor não pode ser negativo' };
  }
  
  if (num < min) {
    return { isValid: false, sanitized: num, error: `Valor deve ser pelo menos ${min}` };
  }
  
  if (num > max) {
    return { isValid: false, sanitized: num, error: `Valor deve ser no máximo ${max}` };
  }
  
  return { isValid: true, sanitized: num };
};

/**
 * Validate room configuration
 * @param {object} config - Configuration object to validate
 * @returns {object} { isValid: boolean, errors: array }
 */
export const validateRoomConfig = (config) => {
  const errors = [];
  
  // Validate time limit
  const timeLimit = validateNumber(config.limiteTempo, {
    min: 30,
    max: 3600,
    integer: true,
    allowNegative: false
  });
  
  if (!timeLimit.isValid) {
    errors.push(timeLimit.error);
  }
  
  // Validate factor limits
  const factorALimit = validateNumber(config.limiteFatorA, {
    min: -100,
    max: 100,
    integer: true
  });
  
  if (!factorALimit.isValid) {
    errors.push(`Limite do Fator A: ${factorALimit.error}`);
  }
  
  const factorBLimit = validateNumber(config.limiteFatorB, {
    min: -100,
    max: 100,
    integer: true
  });
  
  if (!factorBLimit.isValid) {
    errors.push(`Limite do Fator B: ${factorBLimit.error}`);
  }
  
  // Validate operations
  if (!config.operacoesPermitidas || !Array.isArray(config.operacoesPermitidas)) {
    errors.push('Operações permitidas é obrigatório');
  } else {
    const validOps = ['+', '-', '*', '/'];
    const invalidOps = config.operacoesPermitidas.filter(op => !validOps.includes(op));
    if (invalidOps.length > 0) {
      errors.push(`Operações inválidas: ${invalidOps.join(', ')}`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Rate limiting utility
 * Prevents brute force attacks
 */
export const rateLimiter = {
  attempts: {},
  
  /**
   * Check if user can attempt action
   * @param {string} action - Action type (login, register, etc.)
   * @param {string} identifier - User identifier (email, IP, etc.)
   * @param {number} maxAttempts - Maximum attempts allowed
   * @param {number} windowMs - Time window in milliseconds
   * @returns {boolean} Whether action is allowed
   */
  canAttempt(action, identifier, maxAttempts = 5, windowMs = 15 * 60 * 1000) {
    const now = Date.now();
    const key = `${action}_${identifier}`;
    
    if (!this.attempts[key]) {
      this.attempts[key] = [];
    }
    
    // Clean old attempts outside window
    this.attempts[key] = this.attempts[key].filter(time => now - time < windowMs);
    
    if (this.attempts[key].length >= maxAttempts) {
      return false;
    }
    
    return true;
  },
  
  /**
   * Record an attempt
   * @param {string} action - Action type
   * @param {string} identifier - User identifier
   */
  recordAttempt(action, identifier) {
    const key = `${action}_${identifier}`;
    if (!this.attempts[key]) {
      this.attempts[key] = [];
    }
    
    this.attempts[key].push(Date.now());
  },
  
  /**
   * Clear attempts for identifier
   * @param {string} action - Action type
   * @param {string} identifier - User identifier
   */
  clearAttempts(action, identifier) {
    const key = `${action}_${identifier}`;
    delete this.attempts[key];
  }
};
