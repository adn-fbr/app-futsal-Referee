import type {
  AuthChangeEvent,
  Session,
  Subscription,
  User,
} from "@supabase/supabase-js";

export interface AuthRepository {
  getSession(): Promise<{ session: Session | null; error: Error | null }>;
  signInWithPassword(
    email: string,
    password: string,
  ): Promise<{ user: User | null; session: Session | null; error: Error | null }>;
  signOut(): Promise<Error | null>;
  onAuthStateChange(
    listener: (event: AuthChangeEvent, session: Session | null) => void,
  ): Subscription;
}
