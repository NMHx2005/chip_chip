/**
 * Approved YouTube windows for the country bands. Chosen so no presenter is on
 * screen and the footage shows the industry rather than a talking head. Each
 * `youtubeId` is the original channel's video; we embed it, never copy it.
 */
export const COUNTRY_CLIPS = {
  // Intel: cleanroom, photomask handling, wafer prober.
  usa: { youtubeId: "xaspX81mfzQ", start: 175, end: 205 },
  // Micron Taiwan: staff entering the cleanroom.
  taiwan: { youtubeId: "WKHKy89QaV0", start: 600, end: 630 },
  // Huawei: transistor-density graphics only (the video has little fab footage).
  china: { youtubeId: "8ekndZwyOzo", start: 505, end: 535 },
  // SK hynix: construction site, HBM packaging machine, memory graphics.
  "south-korea": { youtubeId: "8JiyJejo-e0", start: 500, end: 530 },
  // ASML High NA EUV: light source and machine interior.
  netherlands: { youtubeId: "h_zgURwr6nA", start: 28, end: 58 },
} as const satisfies Record<string, { youtubeId: string; start: number; end: number }>;
