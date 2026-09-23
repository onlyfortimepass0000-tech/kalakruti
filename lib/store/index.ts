import { LocalStore } from "./local";
import { SupabaseStore } from "./supabase";
import type { Store } from "./types";

let store: Store | null = null;

/** Supabase when configured, otherwise a local JSON file (demo only). */
export function getStore(): Store {
  if (store) return store;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  store = url && key ? new SupabaseStore(url, key) : new LocalStore();
  return store;
}

export type { Store } from "./types";
