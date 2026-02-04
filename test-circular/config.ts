// Config file that exports a const and imports a type
import type { TTestType } from './types.js';

const TEST_DEFINITIONS = [
  { key: "A", value: "a" },
  { key: "B", value: "b" },
] as const;

export const TEST_CONFIG = TEST_DEFINITIONS;

// Function that uses the type from types.ts
export const getConfig = (type: TTestType) => {
  return TEST_DEFINITIONS.find(t => t.value === type);
};
