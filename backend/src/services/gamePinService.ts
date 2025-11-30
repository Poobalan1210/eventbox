/**
 * Game PIN Generator Service
 * Generates unique 6-digit numeric PINs for event access
 */
import { GamePinRepository } from '../db/repositories/index.js';
import { GamePin } from '../types/models.js';

const gamePinRepository = new GamePinRepository();

/**
 * Generate a random 6-digit numeric PIN
 * @returns A 6-digit numeric string
 */
export function generateGamePin(): string {
  // Generate random 6-digit number (100000 to 999999)
  const pin = Math.floor(100000 + Math.random() * 900000).toString();
  return pin;
}

/**
 * Validate PIN format (must be exactly 6 digits)
 * @param pin - The PIN to validate
 * @returns true if valid, false otherwise
 */
export function validatePinFormat(pin: string): boolean {
  return /^\d{6}$/.test(pin);
}

/**
 * Generate a unique game PIN that doesn't exist in the database
 * @param eventId - The event ID to associate with the PIN
 * @returns A unique 6-digit game PIN
 * @throws Error if unable to generate unique PIN after max attempts
 */
export async function generateUniqueGamePin(eventId: string): Promise<string> {
  const maxAttempts = 10;
  let attempts = 0;

  while (attempts < maxAttempts) {
    const pin = generateGamePin();
    
    try {
      // Check if PIN already exists
      const existingPin = await gamePinRepository.getGamePin(pin);
      
      if (!existingPin) {
        // PIN is unique, create it
        const gamePin: GamePin = {
          gamePin: pin,
          eventId: eventId,
          createdAt: Date.now(),
          expiresAt: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours from now (in seconds for TTL)
        };
        
        await gamePinRepository.createGamePin(gamePin);
        return pin;
      }
      
      // PIN exists, try again
      attempts++;
    } catch (error: any) {
      if (error.message === 'Game PIN already exists') {
        // Race condition: another process created this PIN
        attempts++;
        continue;
      }
      throw error;
    }
  }

  throw new Error('Unable to generate unique game PIN after maximum attempts');
}

/**
 * Lookup event ID by game PIN
 * @param pin - The 6-digit game PIN
 * @returns The event ID associated with the PIN, or null if not found
 */
export async function lookupEventByPin(pin: string): Promise<string | null> {
  if (!validatePinFormat(pin)) {
    return null;
  }

  const gamePin = await gamePinRepository.getGamePin(pin);
  return gamePin ? gamePin.eventId : null;
}
