const wordNumbers: Record<string, number> = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
  hundred: 100,
  thousand: 1000,
};

export function parsePriceFromSpeech(transcript: string) {
  const directNumber = transcript.match(/\d+/)?.[0];
  if (directNumber) return Number(directNumber);

  const words = transcript.toLowerCase().replace(/-/g, " ").split(/\s+/);
  let total = 0;
  let current = 0;

  for (const word of words) {
    const value = wordNumbers[word];
    if (value === undefined) continue;
    if (value === 100 || value === 1000) {
      current = Math.max(1, current) * value;
      if (value === 1000) {
        total += current;
        current = 0;
      }
    } else {
      current += value;
    }
  }

  return total + current || null;
}
