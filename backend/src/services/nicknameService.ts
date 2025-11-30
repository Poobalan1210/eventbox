/**
 * Nickname Generator Service
 * Generates fun, family-friendly nickname suggestions for participants
 */

/**
 * List of family-friendly adjectives for nickname generation
 */
const ADJECTIVES = [
  'Happy',
  'Clever',
  'Swift',
  'Brave',
  'Mighty',
  'Wise',
  'Cool',
  'Epic',
  'Super',
  'Mega',
  'Ultra',
  'Turbo',
  'Cosmic',
  'Electric',
  'Blazing',
  'Stellar',
  'Awesome',
  'Brilliant',
  'Daring',
  'Fearless',
  'Jolly',
  'Lucky',
  'Noble',
  'Radiant',
  'Speedy',
  'Vibrant',
  'Wild',
  'Zesty',
];

/**
 * List of family-friendly nouns for nickname generation
 */
const NOUNS = [
  'Panda',
  'Tiger',
  'Eagle',
  'Dolphin',
  'Phoenix',
  'Dragon',
  'Ninja',
  'Wizard',
  'Knight',
  'Pirate',
  'Robot',
  'Rocket',
  'Thunder',
  'Lightning',
  'Champion',
  'Hero',
  'Falcon',
  'Leopard',
  'Shark',
  'Wolf',
  'Bear',
  'Lion',
  'Hawk',
  'Panther',
  'Cobra',
  'Viper',
  'Warrior',
  'Legend',
];

/**
 * Generate a single random nickname by combining an adjective and a noun
 * @returns A nickname in the format "AdjectiveNoun" (e.g., "HappyPanda")
 */
export function generateNickname(): string {
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  return `${adjective}${noun}`;
}

/**
 * Generate multiple unique nickname suggestions
 * @param count - Number of suggestions to generate (default: 3)
 * @returns Array of unique nickname suggestions
 */
export function generateNicknameSuggestions(count: number = 3): string[] {
  const suggestions = new Set<string>();
  const maxAttempts = count * 10; // Prevent infinite loop
  let attempts = 0;

  while (suggestions.size < count && attempts < maxAttempts) {
    suggestions.add(generateNickname());
    attempts++;
  }

  return Array.from(suggestions);
}
