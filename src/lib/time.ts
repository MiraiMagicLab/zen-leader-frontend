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

export function formatLocalDateInput(utcIsoString: string): string {
  const date = new Date(utcIsoString)
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, "0")
  const day = `${date.getDate()}`.padStart(2, "0")
  return `${year}-${month}-${day}`
}

