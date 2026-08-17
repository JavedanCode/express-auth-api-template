import passport from 'passport';

import { configureLocalStrategy } from '../strategies/local.strategy.js';

export function configurePassport() {
  configureLocalStrategy();

  return passport;
}
