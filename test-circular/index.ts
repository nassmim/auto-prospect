// Test usage
import { getConfig } from './config.js';
import { DEFAULT_TEST } from './types.js';

const result = getConfig('a');
console.log(result);
console.log('DEFAULT:', DEFAULT_TEST);
