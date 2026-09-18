import '@testing-library/jest-dom/vitest';

import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Testing Library only unmounts automatically when test globals are on; they
// are off here, so each test's tree would otherwise leak into the next.
afterEach(cleanup);
