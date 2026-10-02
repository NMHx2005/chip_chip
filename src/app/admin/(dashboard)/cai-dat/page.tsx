import { requireStaff } from "@/lib/auth";
import { getSiteSettings } from "@/lib/queries/site-settings";
import { SiteSettingsForm } from "@/components/admin/SiteSettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  await requireStaff();

  // The form is filled with what the site is showing right now: the stored
  // value, or the code default when nothing has been stored yet.
  const settings = await getSiteSettings();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-[-0.02em] text-text">Cài đặt site</h1>
        <p className="mt-1.5 text-sm text-text-muted">
          Những giá trị đổi được mà không cần deploy. Mọi thứ khác nằm trong mã nguồn.
        </p>
      </div>

      <SiteSettingsForm settings={settings} />
    </div>
  );
}
