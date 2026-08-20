import { AppError } from '../errors/AppError.js';

export async function processGitHubProfile(profile, { findOrCreateOAuthUser, provider }) {
  const emailData = profile.emails?.find((email) => email.primary) ?? profile.emails?.[0];

  if (!emailData?.value) {
    throw new AppError(
      'A GitHub account with an email address is required.',
      401,
      'OAUTH_EMAIL_REQUIRED',
    );
  }

  return findOrCreateOAuthUser({
    provider,
    providerAccountId: profile.id,
    email: emailData.value.toLowerCase(),
    displayName: profile.displayName || profile.username || null,
    avatarUrl: profile.photos?.[0]?.value || null,
  });
}
