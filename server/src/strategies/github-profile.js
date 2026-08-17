export async function processGitHubProfile(profile, { findOrCreateOAuthUser, provider }) {
  const emailData = profile.emails?.find((email) => email.primary) ?? profile.emails?.[0];

  if (!emailData?.value) {
    throw new Error('GitHub account does not provide an email address.');
  }

  return findOrCreateOAuthUser({
    provider,
    providerAccountId: profile.id,
    email: emailData.value.toLowerCase(),
    displayName: profile.displayName || profile.username || null,
    avatarUrl: profile.photos?.[0]?.value || null,
  });
}
