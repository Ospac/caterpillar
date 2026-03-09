import { afterEach, expect } from '@rstest/core';
import { cleanup } from '@testing-library/react';
import * as jestDomMatchers from '@testing-library/jest-dom/matchers';

expect.extend(jestDomMatchers);

// Cleanup after each test to prevent test pollution
afterEach(() => {
  cleanup();
});