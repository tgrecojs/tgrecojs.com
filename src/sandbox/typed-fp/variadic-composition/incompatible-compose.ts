import { compose } from './compose';
import { trim, length, atMost } from './functions';

// Swap trim and length to clear the type error.
const broken = compose(atMost(160), trim, length);
