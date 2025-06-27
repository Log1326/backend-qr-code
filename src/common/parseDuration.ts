export function parseDuration(input: string): number {
  const regex = /(\d+)\s*(h|m)/g;
  let match: RegExpExecArray | null;
  let totalMs = 0;
  while ((match = regex.exec(input)) !== null) {
    const value = parseInt(match[1], 10);
    const unit = match[2];
    if (unit === 'h') totalMs += value * 60 * 60 * 1000;
    else if (unit === 'm') totalMs += value * 60 * 1000;
  }

  return totalMs;
}
