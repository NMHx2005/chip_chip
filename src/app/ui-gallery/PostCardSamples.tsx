import { PostCard } from "@/components/forum/PostCard";
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
      <section id="postcard" className="flex flex-col gap-4">
        <h2 className="text-h2 text-text md:text-h2-lg">PostCard · thẻ</h2>
        <p className="text-sm text-text-muted">Dưới 640px thẻ tự chuyển sang dạng gọn.</p>
        <div className="grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SAMPLES.map((sample) => (
            <div key={sample.post.id} className="flex flex-col gap-2">
              <p className="min-h-8 text-xs font-bold uppercase tracking-[0.08em] text-text-muted">
                {sample.caption}
              </p>
              <div className="flex-1">
                <PostCard post={sample.post} showTopic={sample.showTopic} />
              </div>
            </div>
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
    </div>
  );
}
