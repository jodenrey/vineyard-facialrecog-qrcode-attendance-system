/**
 * Returns the current date and time in a formatted string (using Manila time).
 */
export function getCurrentDateTime() {
  // Set timezone to Asia/Manila
  const options: Intl.DateTimeFormatOptions = { 
    timeZone: 'Asia/Manila',
    hour12: true
  };
  
  const now = new Date();
  
  // Format date: e.g., May 17, 2023
  const dateFormatter = new Intl.DateTimeFormat('en-US', {
    ...options,
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
  
  // Format time: e.g., 02:30 PM
  const timeFormatter = new Intl.DateTimeFormat('en-US', {
    ...options,
    hour: '2-digit',
    minute: '2-digit'
  });
  
  return {
    currentDate: dateFormatter.format(now),
    currentTime: timeFormatter.format(now)
  };
}

/**
 * Formats a date object into a string
 */
export function formatDate(date: Date, format: string = 'full'): string {
  const options: Intl.DateTimeFormatOptions = { 
    timeZone: 'Asia/Manila'
  };
  
  if (format === 'full') {
    return new Intl.DateTimeFormat('en-US', {
      ...options,
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  } else if (format === 'compact') {
    return new Intl.DateTimeFormat('en-US', {
      ...options,
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  } else if (format === 'time') {
    return new Intl.DateTimeFormat('en-US', {
      ...options,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date);
  }
  
  return date.toDateString();
}

/**
 * Gets the current date in YYYY-MM-DD format
 */
export function getCurrentDateISO(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}