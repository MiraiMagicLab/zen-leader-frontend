export function getUserTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
}

export function formatUtcDate(utcIsoString: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: getUserTimeZone(),
  }).format(new Date(utcIsoString))
}

export function formatUtcDateTime(utcIsoString: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: getUserTimeZone(),
  }).format(new Date(utcIsoString))
}

