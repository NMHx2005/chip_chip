/**
 * Permanent redirects for URLs the site no longer serves.
 *
 * Plain .mjs so next.config.mjs can import it directly; the test imports the
 * same list, so what is tested is what is deployed. `statusCode: 301` rather
 * than `permanent: true`, which makes Next answer 308.
 *
 * @type {{ source: string; destination: string; statusCode: 301 }[]}
 */
export const LEGACY_REDIRECTS = [
  // The forum was renamed to the blog: it only ever held the author's posts.
  { source: "/vi/dien-dan", destination: "/vi/blog", statusCode: 301 },
  { source: "/vi/dien-dan/:slug", destination: "/vi/blog/:slug", statusCode: 301 },
  { source: "/en/forum", destination: "/en/blog", statusCode: 301 },
  { source: "/en/forum/:slug", destination: "/en/blog/:slug", statusCode: 301 },
];
