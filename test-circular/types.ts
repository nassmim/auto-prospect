// Types file that derives type from config AND uses runtime value
import { TEST_CONFIG } from './config.js';

export type TTestType = (typeof TEST_CONFIG)[number]["value"];

// Add a runtime value that uses the config
export const DEFAULT_TEST = TEST_CONFIG[0].value;
