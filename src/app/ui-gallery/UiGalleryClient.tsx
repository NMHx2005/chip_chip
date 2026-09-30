"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Disclosure } from "@/components/ui/Disclosure";
import { Field, Input, Textarea } from "@/components/ui/form/Field";
import { FormNotice } from "@/components/ui/form/FormNotice";
import { RadioSegment } from "@/components/ui/form/RadioSegment";
import { HeroStats, PageHero } from "@/components/sections/PageHero";

// Internal page for eyeballing the shared components in every state, at 1280
// and 390 px. Text is hard-coded Vietnamese on purpose (like motion-gallery):
// it never ships, so it does not go through messages/{vi,en}.json.

function Block({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="flex flex-col gap-4">
      <h2 className="text-h2 text-text md:text-h2-lg">{title}</h2>
      {children}
    </section>
  );
}

export function UiGalleryClient() {
  const [kind, setKind] = useState<"contact" | "feedback">("contact");
  const [kindEn, setKindEn] = useState<"a" | "b">("a");
  const [busy, setBusy] = useState(false);
  const [clicks, setClicks] = useState(0);

  return (
    <div className="flex flex-col gap-16 pb-24">
      <PageHero
        eyebrow="Thư viện thành phần dùng chung, bản xem trước"
        title="UI gallery"
        description="Trang chỉ có ở dev. Kiểm tra từng thành phần ở 1280 và 390 px."
        stats={[
          { value: 5, label: "Thành phần" },
          { value: 3, label: "Tông thông báo" },
          { value: 2, label: "Cỡ disclosure" },
        ]}
      />

      <div className="mx-auto flex w-full max-w-content flex-col gap-16 px-5 md:px-8">
        <Block id="button" title="Button">
          <div className="flex flex-wrap items-center gap-3">
            <Button>Chính</Button>
            <Button arrow>Chính có mũi tên</Button>
            <Button variant="secondary">Phụ</Button>
            <Button href="/lien-he" variant="secondary" arrow>
              Liên kết nội bộ
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-3 rounded-3xl bg-primary p-6">
            <Button variant="onDark" arrow>
              Trên nền tối
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button busy={busy} onClick={() => setClicks((n) => n + 1)}>
              {busy ? "Đang gửi..." : "Gửi tin nhắn"}
            </Button>
            <Button variant="secondary" onClick={() => setBusy((b) => !b)}>
              Bật/tắt trạng thái bận
            </Button>
            <span className="text-sm text-text-muted" data-testid="click-count">
              Số lần bấm nút chính: {clicks} (khi bận phải đứng yên)
            </span>
          </div>
        </Block>

        <Block id="field" title="Field">
          <div className="grid gap-6 md:grid-cols-2">
            <Field label="Mặc định" hint="Tối đa 80 ký tự.">
              {(c) => <Input {...c} type="text" />}
            </Field>
            <Field label="Có giá trị" optionalNote="(không bắt buộc)">
              {(c) => <Input {...c} type="email" defaultValue="ban@example.com" />}
            </Field>
            <Field
              label="Lỗi"
              hint="Chỉ dùng để trả lời bạn."
              error="Email chưa đúng định dạng. Bạn có thể để trống ô này."
            >
              {(c) => <Input {...c} type="email" defaultValue="ban@" />}
            </Field>
            <Field label="Chỉ đọc">
              {(c) => <Input {...c} type="text" defaultValue="Đang gửi..." readOnly />}
            </Field>
            <Field label="Vô hiệu" hint="Không nhập được.">
              {(c) => <Input {...c} type="text" disabled defaultValue="Không sửa được" />}
            </Field>
            <Field label="Nhiều dòng" hint="Tối đa 4000 ký tự." className="md:col-span-1">
              {(c) => <Textarea {...c} defaultValue="Nội dung tin nhắn dài, xuống nhiều dòng." />}
            </Field>
            <Field
              label="Nhiều dòng, lỗi"
              error="Vui lòng nhập nội dung (tối đa 4000 ký tự)."
              className="md:col-span-1"
            >
              {(c) => <Textarea {...c} />}
            </Field>
          </div>
          <RadioSegment
            legend="Bạn muốn gửi"
            name="gallery-kind"
            value={kind}
            onChange={setKind}
            options={[
              { value: "contact", label: "Liên hệ" },
              { value: "feedback", label: "Góp ý" },
            ]}
          />
          <RadioSegment
            legend="Which kind of message"
            name="gallery-kind-en"
            value={kindEn}
            onChange={setKindEn}
            options={[
              { value: "a", label: "Contact us" },
              { value: "b", label: "Feedback on a lesson" },
            ]}
          />
        </Block>

        <Block id="notice" title="FormNotice">
          <div className="flex flex-col gap-3">
            <FormNotice tone="error" title="Chưa gửi được">
              Bạn thử lại sau ít phút nhé.
            </FormNotice>
            <FormNotice tone="success" title="Đã gửi">
              Cảm ơn bạn đã viết cho Chíp Chíp!
            </FormNotice>
            <FormNotice tone="note">Chỉ dùng để trả lời bạn, không hiển thị ở đâu.</FormNotice>
          </div>
        </Block>

        <Block id="disclosure" title="Disclosure">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="divide-y divide-hairline overflow-hidden rounded-2xl border border-border">
              <Disclosure summary="Chíp Chíp có miễn phí không?">
                <p>Có. Mọi bài học, video và blog đều miễn phí, không quảng cáo.</p>
              </Disclosure>
              <Disclosure summary="Câu hỏi có tiêu đề rất dài để thử việc xuống dòng khi màn hình hẹp, ba dòng vẫn phải đọc được" defaultOpen>
                <p>Nội dung mở sẵn.</p>
              </Disclosure>
            </div>
            <div className="divide-y divide-hairline overflow-hidden rounded-2xl border border-border">
              <Disclosure size="sm" summary="Báo lỗi bài này">
                <p>Mô tả ngắn gọn giúp tác giả sửa nhanh hơn.</p>
              </Disclosure>
              <Disclosure size="sm" summary="Bộ lọc (2)">
                <p>Kích thước nhỏ, hàng cao 52px.</p>
              </Disclosure>
            </div>
          </div>
        </Block>

        <Block id="stats" title="HeroStats">
          <div className="flex flex-col gap-6">
            <HeroStats stats={[{ value: 47, label: "Bài học" }]} />
            <HeroStats
              stats={[
                { value: 47, label: "Bài học" },
                { value: 4, label: "Chủ đề" },
                { value: 3, label: "Mức độ" },
              ]}
            />
          </div>
        </Block>
      </div>
    </div>
  );
}
