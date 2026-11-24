import { pipe } from './pipe';
import { trim, length, atMost } from './functions';

// Swap length and trim to clear the type error.
const broken = pipe(length, trim, atMost(160));
