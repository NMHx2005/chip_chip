import { PostCard } from "@/components/forum/PostCard";
import { SegmentedFilter } from "@/components/lessons/SegmentedFilter";
import { Pagination } from "@/components/listing/Pagination";
import { CardReveal } from "@/components/motion";
import { Button } from "@/components/ui/Button";
import { DifficultyMark } from "@/components/ui/DifficultyMark";
import { EmptyState } from "@/components/ui/EmptyState";
import { TopicChip } from "@/components/ui/TopicChip";
import type { PostSummary } from "@/lib/types";

// Sample posts for the gallery only. PostCard is an async Server Component, so
// it cannot live inside the client gallery; the page renders this section next
// to it instead.

const base = {
  excerpt: null,
  coverImageUrl: null,
  videoPlatform: null,
  videoExternalId: null,
  videoSource: null,
  channelName: null,
} satisfies Partial<PostSummary>;

const SAMPLES: { caption: string; post: PostSummary; showTopic?: boolean }[] = [
  {
    caption: "có ảnh bìa",
    showTopic: true,
    post: {
      ...base,
      id: "1",
      kind: "lesson",
      slug: "ban-dan-la-gi",
      topic: "dinh-nghia",
      difficulty: "basic",
      title: "Bán dẫn là gì? Từ hạt cát đến con chip",
      excerpt:
        "Vì sao silicon vừa không dẫn điện tốt vừa không cách điện hoàn toàn, và điều đó mở ra cả một ngành công nghiệp.",
      coverImageUrl: "/about-banner.jpg",
      publishedAt: "2026-09-12T00:00:00Z",
    },
  },
  {
    caption: "tấm chủ đề (không ảnh)",
    showTopic: true,
    post: {
      ...base,
      id: "2",
      kind: "lesson",
      slug: "cong-logic",
      topic: "nguyen-ly",
      difficulty: "advanced",
      title: "Từ cổng logic đến bộ vi xử lý trong sáu bước",
      excerpt: "Ghép các công tắc thành phép tính, rồi ghép phép tính thành một con chip biết làm toán.",
      publishedAt: "2026-08-21T00:00:00Z",
    },
  },
  {
    caption: "EN dài, tiêu đề ba dòng, không tóm tắt",
    showTopic: true,
    post: {
      ...base,
      id: "3",
      kind: "lesson",
      slug: "moore",
      topic: "lich-su",
      difficulty: "intermediate",
      title:
        "Moore’s law and the limits of shrinking: why the doubling of transistor counts is slowing down and what comes next",
      publishedAt: "2026-07-24T00:00:00Z",
    },
  },
  {
    caption: "Blog (không chủ đề, không độ khó)",
    post: {
      ...base,
      id: "4",
      kind: "forum",
      slug: "tsmc",
      topic: null,
      difficulty: null,
      title: "TSMC đã thống trị ngành bán dẫn toàn cầu như thế nào",
      excerpt: "Một hãng không tự thiết kế chip nhưng làm ra phần lớn chip tiên tiến nhất thế giới.",
      publishedAt: "2026-09-14T00:00:00Z",
    },
  },
];

export async function PostCardSamples() {
  return (
    <div className="mx-auto flex w-full max-w-content flex-col gap-10 px-5 md:px-8">
      <section id="chips" className="flex flex-col gap-4">
        <h2 className="text-h2 text-text md:text-h2-lg">TopicChip và DifficultyMark</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5">
            <div className="flex flex-wrap gap-2">
              <TopicChip topic="dinh-nghia" label="Định nghĩa" />
              <TopicChip topic="nguyen-ly" label="Nguyên lý" />
              <TopicChip topic="ung-dung" label="Ứng dụng" />
              <TopicChip topic="lich-su" label="Lịch sử và Phát triển" />
            </div>
            <div className="flex flex-wrap gap-2">
              <TopicChip topic="dinh-nghia" label="What is a semiconductor" />
              <TopicChip topic="nguyen-ly" label="How they work" />
              <TopicChip topic="ung-dung" label="Applications" />
              <TopicChip topic="lich-su" label="History & development" />
            </div>
            <div className="w-40">
              <TopicChip topic="dinh-nghia" label="A very long topic name that has to be cut with an ellipsis" />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-5 rounded-2xl border border-border bg-surface p-5 text-[13px]">
            <DifficultyMark difficulty="basic" label="Cơ bản" />
            <DifficultyMark difficulty="intermediate" label="Trung bình" />
            <DifficultyMark difficulty="advanced" label="Nâng cao" />
            <DifficultyMark difficulty="basic" label="Basic" />
            <DifficultyMark difficulty="intermediate" label="Intermediate" />
            <DifficultyMark difficulty="advanced" label="Advanced" />
          </div>
        </div>
      </section>

      <section id="segmented" className="flex flex-col gap-4">
        <h2 className="text-h2 text-text md:text-h2-lg">SegmentedFilter</h2>
        <div className="flex flex-col gap-4">
          <SegmentedFilter
            label="Độ khó"
            options={[
              { key: "all", label: "Tất cả", href: "/bai-hoc", active: true },
              { key: "basic", label: "Cơ bản", href: "/bai-hoc", active: false, difficulty: "basic" },
              { key: "intermediate", label: "Trung bình", href: "/bai-hoc", active: false, difficulty: "intermediate" },
              { key: "advanced", label: "Nâng cao", href: "/bai-hoc", active: false, difficulty: "advanced" },
            ]}
          />
          <SegmentedFilter
            label="Difficulty"
            options={[
              { key: "all", label: "All", href: "/bai-hoc", active: false },
              { key: "basic", label: "Basic", href: "/bai-hoc", active: true, difficulty: "basic" },
              { key: "intermediate", label: "Intermediate", href: "/bai-hoc", active: false, difficulty: "intermediate" },
              { key: "advanced", label: "Advanced", href: "/bai-hoc", active: false, difficulty: "advanced" },
            ]}
          />
        </div>
      </section>

      <section id="postcard" className="flex flex-col gap-4">
        <h2 className="text-h2 text-text md:text-h2-lg">PostCard · thẻ</h2>
        <p className="text-sm text-text-muted">Dưới 640px thẻ tự chuyển sang dạng gọn.</p>
        <div className="grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SAMPLES.map((sample, index) => (
            <CardReveal key={sample.post.id} index={index} columns={4} className="flex flex-col gap-2">
              <p className="min-h-8 text-xs font-bold uppercase tracking-[0.08em] text-text-muted">
                {sample.caption}
              </p>
              <div className="flex-1">
                <PostCard post={sample.post} showTopic={sample.showTopic} />
              </div>
            </CardReveal>
          ))}
        </div>
      </section>

      <section id="postrow" className="flex flex-col gap-4">
        <h2 className="text-h2 text-text md:text-h2-lg">PostCard · dòng</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {SAMPLES.slice(0, 2).map((sample) => (
            <PostCard key={sample.post.id} post={sample.post} showTopic variant="row" />
          ))}
        </div>
      </section>

      <section id="pagination" className="flex flex-col gap-4">
        <h2 className="text-h2 text-text md:text-h2-lg">Pagination</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { caption: "Trang đầu", page: 1, total: 4 },
            { caption: "Giữa, nhiều trang", page: 6, total: 20 },
            { caption: "Trang cuối", page: 4, total: 4 },
          ].map((sample) => (
            <div key={sample.caption} className="rounded-2xl border border-border bg-surface p-5">
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-text-muted">
                {sample.caption}
              </p>
              <Pagination
                page={sample.page}
                totalPages={sample.total}
                hrefFor={(page) => ({ pathname: "/bai-hoc", query: { page } })}
              />
            </div>
          ))}
        </div>
      </section>

      <section id="empty" className="flex flex-col gap-4">
        <h2 className="text-h2 text-text md:text-h2-lg">EmptyState và ErrorState</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <EmptyState
            compact
            title="Chưa có bài học nào"
            description="Các bài học đầu tiên đang được biên soạn. Quay lại sau nhé, hoặc xem video và blog trong lúc chờ."
            actions={
              <>
                <Button href="/video" arrow>
                  Video
                </Button>
                <Button href="/blog" variant="secondary">
                  Blog
                </Button>
              </>
            }
          />
          <EmptyState
            compact
            title="Chưa có bài học nào ở mức độ này."
            actions={<Button href="/bai-hoc">Bỏ lọc độ khó</Button>}
          />
          <EmptyState
            compact
            tone="error"
            title="Đã có lỗi xảy ra."
            description="Đã có lỗi xảy ra khi tải nội dung. Bạn thử tải lại trang nhé."
            actions={<Button>Thử lại</Button>}
          />
        </div>
      </section>
    </div>
  );
}
