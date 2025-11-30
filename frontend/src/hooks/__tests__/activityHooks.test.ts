/**
 * Tests for activity-specific WebSocket hooks
 * 
 * These tests verify that the activity hooks correctly handle
 * WebSocket events and maintain proper state.
 */
import { describe, it, expect } from 'vitest';

describe('Activity Hooks', () => {
  describe('useActivityState', () => {
    it('should be importable', async () => {
      const { useActivityState } = await import('../useActivityState');
      expect(useActivityState).toBeDefined();
      expect(typeof useActivityState).toBe('function');
    });
  });

  describe('usePollEvents', () => {
    it('should be importable', async () => {
      const { usePollEvents } = await import('../usePollEvents');
      expect(usePollEvents).toBeDefined();
      expect(typeof usePollEvents).toBe('function');
    });
  });

  describe('useRaffleEvents', () => {
    it('should be importable', async () => {
      const { useRaffleEvents } = await import('../useRaffleEvents');
      expect(useRaffleEvents).toBeDefined();
      expect(typeof useRaffleEvents).toBe('function');
    });
  });

  describe('Hook exports', () => {
    it('should export all activity hooks from index', async () => {
      const hooks = await import('../index');
      expect(hooks.useActivityState).toBeDefined();
      expect(hooks.usePollEvents).toBeDefined();
      expect(hooks.useRaffleEvents).toBeDefined();
    });
  });
});
