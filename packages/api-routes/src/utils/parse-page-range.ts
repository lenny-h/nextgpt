export function parsePageRange(pageRange: string): number[] {
  const pageNumbers: number[] = [];
  const parts = pageRange.split(",");

  for (const part of parts) {
    const trimmedPart = part.trim();
    if (trimmedPart.includes("-")) {
      const [start, end] = trimmedPart.split("-").map(Number);
      for (let i = start; i <= end; i++) {
        pageNumbers.push(i);
      }
    } else {
      pageNumbers.push(Number(trimmedPart));
    }
  }

  return pageNumbers;
}
