/**
 * Color and shape constants for answer buttons
 * Based on Kahoot-style design with geometric shapes
 */
/**
 * Color palette for answer buttons
 */
export const ANSWER_COLORS = {
    red: '#E21B3C',
    blue: '#1368CE',
    yellow: '#FFA602',
    green: '#26890C',
    purple: '#9C27B0',
};
/**
 * SVG paths for geometric shapes
 * All paths are designed for a 100x100 viewBox
 */
export const SHAPE_PATHS = {
    triangle: 'M 50 10 L 90 90 L 10 90 Z',
    diamond: 'M 50 10 L 90 50 L 50 90 L 10 50 Z',
    circle: 'M 50 50 m -40 0 a 40 40 0 1 0 80 0 a 40 40 0 1 0 -80 0',
    square: 'M 20 20 L 80 20 L 80 80 L 20 80 Z',
    pentagon: 'M 50 10 L 85 40 L 70 85 L 30 85 L 15 40 Z',
};
/**
 * Predefined color-shape combinations for answer options
 * Index corresponds to option position (0-4)
 */
export const ANSWER_STYLES = [
    { color: 'red', shape: 'triangle' },
    { color: 'blue', shape: 'diamond' },
    { color: 'yellow', shape: 'circle' },
    { color: 'green', shape: 'square' },
    { color: 'purple', shape: 'pentagon' },
];
/**
 * Get the answer style for a given option index
 * @param index - The zero-based index of the answer option
 * @returns The color and shape for that option
 */
export function getAnswerStyle(index) {
    if (index < 0 || index >= ANSWER_STYLES.length) {
        throw new Error(`Invalid answer option index: ${index}. Must be between 0 and ${ANSWER_STYLES.length - 1}`);
    }
    return ANSWER_STYLES[index];
}
