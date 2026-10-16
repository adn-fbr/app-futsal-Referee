/**
 * Formatting utilities for consistent display across the app
 */

/**
 * Format license level for display
 * Converts database values like "level_1" to human-readable "Lisensi Level 1"
 */
export function formatLicenseLevel(level: string | null | undefined): string {
  if (!level) return "Belum ada lisensi";
  
  const labels: Record<string, string> = {
    // Database format
    level_1: "Lisensi Level 1",
    level_2: "Lisensi Level 2",
    level_3: "Lisensi Level 3",
    // Handle variations
    Level_1: "Lisensi Level 1",
    Level_2: "Lisensi Level 2",
    Level_3: "Lisensi Level 3",
    "level 1": "Lisensi Level 1",
    "level 2": "Lisensi Level 2",
    "level 3": "Lisensi Level 3",
    // FIFA levels
    fifa: "FIFA",
    nasional: "Nasional",
    provinsi: "Provinsi",
    kabupaten: "Kabupaten/Kota",
  };

  const normalized = level.toLowerCase().replace(/\s+/g, "_");
  return labels[normalized] || labels[level] || level;
}

/**
 * Capitalize location/city name properly
 * Handles Indonesian naming conventions
 */
export function capitalizeLocation(location: string | null | undefined): string {
  if (!location) return "";
  
  // List of words that should stay lowercase (unless first word)
  const lowercaseWords = ["di", "ke", "dari", "dan", "atau"];
  
  return location
    .split(" ")
    .map((word, index) => {
      const lowerWord = word.toLowerCase();
      if (index !== 0 && lowercaseWords.includes(lowerWord)) {
        return lowerWord;
      }
      // Capitalize first letter
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

/**
 * Format currency to Indonesian Rupiah
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format compact currency (e.g., 1.5jt instead of Rp 1.500.000)
 */
export function formatCompactCurrency(amount: number): string {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}jt`;
  } else if (amount >= 1000) {
    return `${(amount / 1000).toFixed(0)}rb`;
  }
  return `${amount}`;
}

/**
 * Check if a license is expiring soon (within 30 days)
 */
export function isLicenseExpiringSoon(expiryDate: string | null | undefined): boolean {
  if (!expiryDate) return false;
  
  const expiry = new Date(expiryDate);
  const today = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(today.getDate() + 30);
  
  return expiry <= thirtyDaysFromNow && expiry >= today;
}

/**
 * Check if a license is expired
 */
export function isLicenseExpired(expiryDate: string | null | undefined): boolean {
  if (!expiryDate) return false;
  
  const expiry = new Date(expiryDate);
  const today = new Date();
  
  return expiry < today;
}

/**
 * Get days until license expiry (negative if expired)
 */
export function getDaysUntilExpiry(expiryDate: string | null | undefined): number | null {
  if (!expiryDate) return null;
  
  const expiry = new Date(expiryDate);
  const today = new Date();
  
  const diffTime = expiry.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
