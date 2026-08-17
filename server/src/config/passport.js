import passport from 'passport';

import { configureLocalStrategy } from '../strategies/local.strategy.js';
import { configureGoogleStrategy } from '../strategies/google.strategy.js';

export function configurePassport() {
  configureLocalStrategy();
  configureGoogleStrategy();

  return passport;
}
