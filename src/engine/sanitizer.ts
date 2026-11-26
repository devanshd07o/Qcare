/**
 * Security Sanitizer & Input Boundary Validator for Clinical Data
 */

export function sanitizeString(input: string): string {
  if (!input) return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
}

export function validatePatientName(name: string): { isValid: boolean; value: string; error?: string } {
  const sanitized = sanitizeString(name);
  if (!sanitized || sanitized.length < 2) {
    return { isValid: false, value: sanitized, error: 'Patient name must be at least 2 characters.' };
  }
  if (sanitized.length > 80) {
    return { isValid: false, value: sanitized.slice(0, 80), error: 'Patient name must not exceed 80 characters.' };
  }
  return { isValid: true, value: sanitized };
}

export function validatePatientAge(age: number | string): { isValid: boolean; value: number; error?: string } {
  const num = typeof age === 'number' ? age : parseInt(age, 10);
  if (isNaN(num) || num < 0 || num > 130) {
    return { isValid: false, value: isNaN(num) ? 0 : num, error: 'Patient age must be between 0 and 130.' };
  }
  return { isValid: true, value: num };
}

export function validatePatientPhone(phone: string): { isValid: boolean; value: string; error?: string } {
  const sanitized = phone.replace(/[^\d+]/g, '');
  // Indian phone number regex: accepts 10 digits, +91 followed by 10 digits, or 0 followed by 10 digits
  const cleanDigits = sanitized.replace(/^\+91|^0/, '');
  if (/^\d{10}$/.test(cleanDigits)) {
    return { isValid: true, value: `+91 ${cleanDigits.slice(0, 5)} ${cleanDigits.slice(5)}` };
  }
  return { isValid: false, value: phone, error: 'Mobile number must be a valid 10-digit number.' };
}

export function validateSymptoms(symptoms: string): { isValid: boolean; value: string } {
  const sanitized = sanitizeString(symptoms);
  return { isValid: true, value: sanitized };
}

export function evaluateMetricFlag(valueStr: string, rangeStr: string): 'normal' | 'high' | 'low' | 'critical' {
  const val = parseFloat(valueStr);
  if (isNaN(val)) return 'normal';

  // Example range formats: "70 - 99", "13.0 - 17.0", "-100 to +50", "< 200", "> -1.0"
  const rangeMatch = rangeStr.match(/(-?[\d.]+)\s*(?:-|to)\s*([+-]?[\d.]+)/i);
  if (rangeMatch) {
    const low = parseFloat(rangeMatch[1]);
    const high = parseFloat(rangeMatch[2]);
    if (!isNaN(low) && !isNaN(high)) {
      const critLow = low >= 0 ? low * 0.75 : low * 1.5;
      const critHigh = high >= 0 ? high * 1.5 : high * 0.5;
      if (val < critLow || val > critHigh) return 'critical';
      if (val < low) return 'low';
      if (val > high) return 'high';
      return 'normal';
    }
  }

  const lessMatch = rangeStr.match(/<\s*(-?[\d.]+)/);
  if (lessMatch) {
    const maxVal = parseFloat(lessMatch[1]);
    if (!isNaN(maxVal)) {
      const critHigh = maxVal >= 0 ? maxVal * 1.5 : maxVal * 0.5;
      if (val > critHigh) return 'critical';
      if (val > maxVal) return 'high';
      return 'normal';
    }
  }

  const greaterMatch = rangeStr.match(/>\s*(-?[\d.]+)/);
  if (greaterMatch) {
    const minVal = parseFloat(greaterMatch[1]);
    if (!isNaN(minVal)) {
      const critLow = minVal >= 0 ? minVal * 0.7 : minVal * 1.8;
      if (val < critLow) return 'critical';
      if (val < minVal) return 'low';
      return 'normal';
    }
  }

  return 'normal';
}
