export const PUBLIC_APPLICATION_SETTING_KEYS = [
  "app_name",
  "organization_name",
  "organization_phone",
  "organization_address",
  "organization_email",
  "association_email",
  "sender_email_name",
  "sender_email_address",
  "email_provider",
  "whatsapp_provider",
  "max_event_referees",
  "honor_base_amount",
] as const;

export const APPROVED_EMAIL_PROVIDERS = ["resend", "smtp"] as const;
export const APPROVED_WHATSAPP_PROVIDERS = ["meta", "kirisan"] as const;

export type PublicApplicationSettingKey = (typeof PUBLIC_APPLICATION_SETTING_KEYS)[number];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateSettingKey(input: unknown): { ok: true; key: string } | { ok: false; error: string } {
  if (typeof input !== "string") {
    return { ok: false, error: "Setting key must be a string" };
  }

  const key = input.trim();
  if (!key) {
    return { ok: false, error: "Setting key is required" };
  }

  if (!PUBLIC_APPLICATION_SETTING_KEYS.includes(key as PublicApplicationSettingKey)) {
    return { ok: false, error: `Setting key "${key}" is not allowed` };
  }

  return { ok: true, key };
}

function normalizeStringValue(value: unknown, fieldName: string): { ok: true; value: string } | { ok: false; error: string } {
  if (typeof value !== "string") {
    return { ok: false, error: `${fieldName} must be a string` };
  }

  const normalized = value.trim();
  if (!normalized) {
    return { ok: false, error: `${fieldName} cannot be empty` };
  }

  return { ok: true, value: normalized };
}

function normalizeInteger(value: unknown, fieldName: string): { ok: true; value: string } | { ok: false; error: string } {
  const rawValue = typeof value === "number" ? String(value) : typeof value === "string" ? value.trim() : "";

  if (!rawValue) {
    return { ok: false, error: `${fieldName} cannot be empty` };
  }

  if (!/^-?\d+$/.test(rawValue)) {
    return { ok: false, error: `${fieldName} must be a valid integer` };
  }

  const numericValue = Number(rawValue);
  if (!Number.isFinite(numericValue) || !Number.isInteger(numericValue)) {
    return { ok: false, error: `${fieldName} must be a valid integer` };
  }

  return { ok: true, value: String(numericValue) };
}

function normalizeNumeric(value: unknown, fieldName: string): { ok: true; value: string } | { ok: false; error: string } {
  const rawValue = typeof value === "number" ? String(value) : typeof value === "string" ? value.trim() : "";

  if (!rawValue) {
    return { ok: false, error: `${fieldName} cannot be empty` };
  }

  if (!/^-?(?:\d+|\d+\.\d+|\.\d+)$/.test(rawValue)) {
    return { ok: false, error: `${fieldName} must be a valid number` };
  }

  const numericValue = Number(rawValue);
  if (!Number.isFinite(numericValue)) {
    return { ok: false, error: `${fieldName} must be a valid number` };
  }

  return { ok: true, value: String(numericValue) };
}

export function validateSettingValue(
  key: string,
  value: unknown,
): { ok: true; value: string } | { ok: false; error: string } {
  switch (key) {
    case "app_name":
    case "organization_name":
    case "organization_phone":
    case "organization_address":
    case "sender_email_name": {
      return normalizeStringValue(value, key);
    }

    case "organization_email":
    case "association_email":
    case "sender_email_address": {
      const normalized = normalizeStringValue(value, key);
      if (!normalized.ok) {
        return normalized;
      }

      if (!EMAIL_RE.test(normalized.value)) {
        return { ok: false, error: `${key} must be a valid email address` };
      }

      return normalized;
    }

    case "email_provider": {
      const normalized = normalizeStringValue(value, key);
      if (!normalized.ok) {
        return normalized;
      }

      if (!APPROVED_EMAIL_PROVIDERS.includes(normalized.value as (typeof APPROVED_EMAIL_PROVIDERS)[number])) {
        return { ok: false, error: `${key} must be one of: ${APPROVED_EMAIL_PROVIDERS.join(", ")}` };
      }

      return normalized;
    }

    case "whatsapp_provider": {
      const normalized = normalizeStringValue(value, key);
      if (!normalized.ok) {
        return normalized;
      }

      if (!APPROVED_WHATSAPP_PROVIDERS.includes(normalized.value as (typeof APPROVED_WHATSAPP_PROVIDERS)[number])) {
        return { ok: false, error: `${key} must be one of: ${APPROVED_WHATSAPP_PROVIDERS.join(", ")}` };
      }

      return normalized;
    }

    case "max_event_referees": {
      return normalizeInteger(value, key);
    }

    case "honor_base_amount": {
      return normalizeNumeric(value, key);
    }

    default:
      return { ok: false, error: `Setting key "${key}" is not supported` };
  }
}

export function validateBulkSettings(
  input: unknown,
): { ok: true; normalized: Array<{ key: string; value: string }> } | { ok: false; error: string } {
  if (!Array.isArray(input)) {
    return { ok: false, error: "Settings payload must be an array" };
  }

  if (input.length === 0) {
    return { ok: false, error: "Settings payload cannot be empty" };
  }

  const normalized: Array<{ key: string; value: string }> = [];
  const seenKeys = new Set<string>();

  for (const item of input) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      return { ok: false, error: "Each setting must be an object" };
    }

    const candidate = item as Record<string, unknown>;
    const parsedKey = validateSettingKey(candidate.key);
    if (!parsedKey.ok) {
      return parsedKey;
    }

    const parsedValue = validateSettingValue(parsedKey.key, candidate.value);
    if (!parsedValue.ok) {
      return parsedValue;
    }

    if (seenKeys.has(parsedKey.key)) {
      return { ok: false, error: `Duplicate setting key: ${parsedKey.key}` };
    }

    seenKeys.add(parsedKey.key);
    normalized.push({ key: parsedKey.key, value: parsedValue.value });
  }

  return { ok: true, normalized };
}
