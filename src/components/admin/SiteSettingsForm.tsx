"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { saveSiteSettings } from "@/app/admin/actions";
import { readActionResult, sessionExpired } from "@/components/admin/actionResult";
import type { SiteSettings } from "@/lib/site-settings";

const INPUT =
  "h-10 rounded-xl border border-border bg-surface px-3 text-sm font-normal text-text focus:border-accent focus:outline-none";

const LABEL = "flex flex-col gap-1.5 text-xs font-semibold text-text-nav";

/**
 * The four settings the maintainer can change without a deploy.
 *
 * The fields start at what the site is showing right now — the stored value, or
 * the code default when nothing is stored yet — so the screen always answers
 * "what is live?" and editing it is a matter of changing that.
 */
export function SiteSettingsForm({ settings }: { settings: SiteSettings }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const [contactEmail, setContactEmail] = useState(settings.contactEmail);
  const [facebook, setFacebook] = useState(
    settings.socialLinks.find((link) => link.key === "facebook")?.href ?? ""
  );
  const [tiktok, setTiktok] = useState(
    settings.socialLinks.find((link) => link.key === "tiktok")?.href ?? ""
  );
  const [responseVi, setResponseVi] = useState(settings.responseTime.vi ?? "");
  const [responseEn, setResponseEn] = useState(settings.responseTime.en ?? "");
  const [privacyUpdated, setPrivacyUpdated] = useState(settings.privacyUpdated);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setDone(false);
    startTransition(async () => {
      const result = readActionResult(
        await saveSiteSettings({
          contactEmail,
          facebook,
          tiktok,
          responseVi,
          responseEn,
          privacyUpdated,
        })
      );
      if (!result) return;
      if (sessionExpired(result)) {
        router.replace("/admin/dang-nhap");
        return;
      }
      if (!result.ok) {
        setError(result.error ?? "Không lưu được. Vui lòng thử lại.");
        return;
      }
      setDone(true);
      router.refresh();
    });
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      <section className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="text-base font-semibold text-text">Liên hệ</h2>
        <p className="mt-1 text-sm text-text-muted">
          Địa chỉ hiện ở chân trang, trang Liên hệ và khối cuối trang chủ. Để trống thì ẩn đi.
        </p>
        <label className={`mt-4 ${LABEL}`}>
          Email liên hệ
          <input
            type="email"
            value={contactEmail}
            onChange={(event) => setContactEmail(event.target.value)}
            placeholder="ban@example.com"
            className={INPUT}
          />
        </label>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="text-base font-semibold text-text">Mạng xã hội</h2>
        <p className="mt-1 text-sm text-text-muted">
          Chỉ nhận liên kết https. Để trống thì biểu tượng tương ứng không hiện.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className={LABEL}>
            Facebook
            <input
              type="url"
              value={facebook}
              onChange={(event) => setFacebook(event.target.value)}
              placeholder="https://facebook.com/..."
              className={INPUT}
            />
          </label>
          <label className={LABEL}>
            TikTok
            <input
              type="url"
              value={tiktok}
              onChange={(event) => setTiktok(event.target.value)}
              placeholder="https://tiktok.com/@..."
              className={INPUT}
            />
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="text-base font-semibold text-text">Thời gian phản hồi</h2>
        <p className="mt-1 text-sm text-text-muted">
          Câu hiện trong khung “Khi nào có phản hồi” ở trang Liên hệ. Để trống thì dùng câu mặc định
          trong tệp ngôn ngữ.
        </p>
        <div className="mt-4 flex flex-col gap-4">
          <label className={LABEL}>
            Tiếng Việt
            <textarea
              value={responseVi}
              onChange={(event) => setResponseVi(event.target.value)}
              rows={2}
              placeholder="Tác giả thường trả lời trong vòng 2 ngày."
              className="rounded-xl border border-border bg-surface px-3 py-2 text-sm font-normal text-text focus:border-accent focus:outline-none"
            />
          </label>
          <label className={LABEL}>
            English
            <textarea
              value={responseEn}
              onChange={(event) => setResponseEn(event.target.value)}
              rows={2}
              placeholder="The author usually replies within 2 days."
              className="rounded-xl border border-border bg-surface px-3 py-2 text-sm font-normal text-text focus:border-accent focus:outline-none"
            />
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="text-base font-semibold text-text">Chính sách bảo mật</h2>
        <p className="mt-1 text-sm text-text-muted">
          Ngày hiện ở đầu trang Chính sách bảo mật. Sửa nội dung chính sách thì nhớ đổi ngày này.
        </p>
        <label className={`mt-4 max-w-[220px] ${LABEL}`}>
          Ngày cập nhật
          <input
            type="date"
            value={privacyUpdated}
            onChange={(event) => setPrivacyUpdated(event.target.value)}
            className={INPUT}
          />
        </label>
      </section>

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}
      {done && (
        <p
          role="status"
          className="rounded-xl border border-border bg-surface-muted px-4 py-3 text-sm text-text-nav"
        >
          Đã lưu. Các trang công khai dùng giá trị mới.
        </p>
      )}

      <div>
        <button
          type="submit"
          disabled={pending}
          className="h-10 cursor-pointer rounded-xl bg-primary px-5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {pending ? "Đang lưu…" : "Lưu cài đặt"}
        </button>
      </div>
    </form>
  );
}
