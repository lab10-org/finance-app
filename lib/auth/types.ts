/**
 * The identity this feature publishes to the rest of the application, so that a
 * later feature can attach expenses to it (4.5).
 *
 * Deliberately two fields: anything more is a profile, which is out of scope.
 */
export interface SessionUser {
  /** Supabase's `sub` claim — the stable account id. */
  id: string;
  /** The address the code was sent to. */
  email: string;
}
