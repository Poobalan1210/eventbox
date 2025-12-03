import { jsx as _jsx } from "react/jsx-runtime";
/**
 * WaitingForActivity Component Examples
 *
 * This file demonstrates various usage scenarios for the WaitingForActivity component.
 */
import WaitingForActivity from './WaitingForActivity';
/**
 * Example 1: Basic usage with just a participant name
 */
export function BasicWaitingExample() {
    return (_jsx(WaitingForActivity, { participantName: "Alice" }));
}
/**
 * Example 2: With event name and participant count
 */
export function FullWaitingExample() {
    return (_jsx(WaitingForActivity, { eventName: "SCD2025 Conference", participantCount: 42, participantName: "Bob" }));
}
/**
 * Example 3: With custom message
 */
export function CustomMessageExample() {
    return (_jsx(WaitingForActivity, { eventName: "Team Building Event", participantCount: 15, participantName: "Charlie", message: "Get ready for some fun activities" }));
}
/**
 * Example 4: Minimal usage (no participant name)
 */
export function MinimalWaitingExample() {
    return (_jsx(WaitingForActivity, { eventName: "Workshop 2024", participantCount: 8 }));
}
/**
 * Example 5: Single participant
 */
export function SingleParticipantExample() {
    return (_jsx(WaitingForActivity, { eventName: "One-on-One Session", participantCount: 1, participantName: "Diana", message: "The session will begin shortly" }));
}
/**
 * Example 6: Large event
 */
export function LargeEventExample() {
    return (_jsx(WaitingForActivity, { eventName: "Annual Conference 2024", participantCount: 250, participantName: "Eve", message: "Welcome! The keynote will start soon" }));
}
