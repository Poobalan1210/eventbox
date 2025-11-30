/**
 * Utility functions for assigning colors and shapes to answer options
 */

import { AnswerOption } from '../types/models.js';

export type AnswerColor = 'red' | 'blue' | 'yellow' | 'green' | 'purple';
export type AnswerShape = 'triangle' | 'diamond' | 'circle' | 'square' | 'pentagon';

interface AnswerStyle {
  color: AnswerColor;
  shape: AnswerShape;
}

/**
 * Predefined color-shape combinations for answer options
 * Index corresponds to option position (0-4)
 */
const ANSWER_STYLES: AnswerStyle[] = [
  { color: 'red', shape: 'triangle' },
  { color: 'blue', shape: 'diamond' },
  { color: 'yellow', shape: 'circle' },
  { color: 'green', shape: 'square' },
  { color: 'purple', shape: 'pentagon' },
];

/**
 * Assign colors and shapes to answer options based on their index
 * @param options - Array of answer option texts
 * @returns Array of AnswerOption objects with colors and shapes assigned
 */
export function assignColorsAndShapes(
  options: Array<{ id: string; text: string }>
): AnswerOption[] {
  return options.map((option, index) => {
    const style = ANSWER_STYLES[index];
    return {
      ...option,
      color: style.color,
      shape: style.shape,
    };
  });
}
