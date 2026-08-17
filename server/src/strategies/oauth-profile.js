export async function processGoogleProfile(profile, { findOrCreateOAuthUser, provider }) {
  const emailData = profile.emails?.[0];

  if (!emailData?.value || !emailData.verified) {
    throw new Error('Google account does not provide a verified email address.');
  }

  return findOrCreateOAuthUser({
    provider,
    providerAccountId: profile.id,
    email: emailData.value.toLowerCase(),
    displayName: profile.displayName || null,
    avatarUrl: profile.photos?.[0]?.value || null,
  });
}
