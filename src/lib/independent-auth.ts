export type OAuthAccountOwner = {
  passwordHash: string | null;
  accounts: ReadonlyArray<{ id: string }>;
};

export function canAttachFirstOAuthAccount(
  owner: OAuthAccountOwner | null,
): boolean {
  return Boolean(
    owner && owner.passwordHash === null && owner.accounts.length === 0,
  );
}
