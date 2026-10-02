import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { DEFAULT_SETTINGS, readSettings, type SiteSettings } from "@/lib/site-settings";

/**
 * The site's settings for this request.
 *
 * Cached per request: the footer and a page both ask, and that should be one
 * query. A database that cannot be reached is not a reason to fail a page —
 * the code defaults are what the site shipped with.
 */
export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  if (!isSupabaseConfigured) return DEFAULT_SETTINGS;

  try {
    const { data, error } = await createClient().from("site_settings").select("key, value");
    if (error) {
      console.error("[site-settings]", error.message);
      return DEFAULT_SETTINGS;
    }
    return readSettings(data);
  } catch (error) {
    console.error("[site-settings]", error);
    return DEFAULT_SETTINGS;
  }
});
