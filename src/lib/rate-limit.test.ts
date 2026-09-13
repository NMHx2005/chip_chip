import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * Regression tests for the comment rate limiter's notion of "who is calling".
 *
 * The original implementation read the leftmost `x-forwarded-for` entry, which
 * is the part of the header the client controls: a bot changed one header per
 * request and the 3-per-10-minutes limit never fired. These tests pin the
 * behaviour that replaced it.
 *
 * `TRUSTED_PROXY_HOPS` is read once at import time, so each case re-imports
 * the module with the environment it needs.
 */
async function loadClientIp(hops?: string) {
  vi.resetModules();
  if (hops === undefined) delete process.env.TRUSTED_PROXY_HOPS;
  else process.env.TRUSTED_PROXY_HOPS = hops;
  return (await import("@/lib/rate-limit")).clientIp;
}

const headers = (init: Record<string, string>) => new Headers(init);

afterEach(() => {
  delete process.env.TRUSTED_PROXY_HOPS;
  delete process.env.VERCEL;
});

describe("clientIp", () => {
  it("ignores the client-supplied head of the forwarded chain", async () => {
    const clientIp = await loadClientIp("1");

    // A bot seeds the header; the proxy appends the address it actually saw.
    const first = clientIp(
      headers({ "x-forwarded-for": "1.2.3.1, 203.0.113.7" })
    );
    const second = clientIp(
      headers({ "x-forwarded-for": "9.9.9.9, 203.0.113.7" })
    );

    expect(first).toBe("203.0.113.7");
    expect(first).toBe(second);
  });

  it("counts hops from the right when a CDN adds another", async () => {
    const clientIp = await loadClientIp("2");

    expect(
      clientIp(
        headers({ "x-forwarded-for": "1.2.3.4, 203.0.113.7, 198.51.100.1" })
      )
    ).toBe("203.0.113.7");
  });

  it("trusts the whole chain when it is exactly as long as the hop count", async () => {
    const clientIp = await loadClientIp("1");

    expect(clientIp(headers({ "x-forwarded-for": "203.0.113.7" }))).toBe(
      "203.0.113.7"
    );
  });

  it("refuses a chain shorter than the configured hops", async () => {
    const clientIp = await loadClientIp("2");

    // Fewer entries than trusted proxies means the request did not arrive
    // through them, so nothing in the header can be believed.
    expect(clientIp(headers({ "x-forwarded-for": "1.2.3.4" }))).toBe(
      "untrusted"
    );
  });

  it("prefers the platform header a client cannot forge, on the platform", async () => {
    process.env.VERCEL = "1";
    const clientIp = await loadClientIp("1");

    expect(
      clientIp(
        headers({
          "x-vercel-forwarded-for": "198.51.100.9",
          "x-forwarded-for": "1.2.3.4, 203.0.113.7",
        })
      )
    ).toBe("198.51.100.9");
  });

  it("ignores the Vercel header when not running on Vercel", async () => {
    const clientIp = await loadClientIp("1");

    // Off-platform the header is client-settable, so honouring it would hand a
    // bot a fresh bucket per request. The real chain decides instead.
    expect(
      clientIp(
        headers({
          "x-vercel-forwarded-for": "198.51.100.9",
          "x-forwarded-for": "1.2.3.4, 203.0.113.7",
        })
      )
    ).toBe("203.0.113.7");

    // With nothing else to go on it must not become an identity of its own.
    expect(
      clientIp(headers({ "x-vercel-forwarded-for": "198.51.100.9" }))
    ).toBe("unknown");
  });

  it("refuses x-real-ip when more than one proxy is configured", async () => {
    const clientIp = await loadClientIp("2");

    // The header carries no chain, so the hop count cannot be verified against
    // it — a request that bypassed the proxies would look the same.
    expect(clientIp(headers({ "x-real-ip": "1.2.3.4" }))).toBe("unknown");
  });

  it("ignores forwarding headers entirely when nothing proxies the app", async () => {
    const clientIp = await loadClientIp("0");

    expect(clientIp(headers({ "x-forwarded-for": "1.2.3.4" }))).toBe("direct");
    expect(clientIp(headers({ "x-real-ip": "1.2.3.4" }))).toBe("direct");
  });

  it("falls back to x-real-ip, then to a single bucket", async () => {
    const clientIp = await loadClientIp("1");

    expect(clientIp(headers({ "x-real-ip": "203.0.113.7" }))).toBe(
      "203.0.113.7"
    );
    expect(clientIp(headers({}))).toBe("unknown");
  });
});

describe("hashIp", () => {
  it("does not keep the address itself", async () => {
    vi.resetModules();
    const { hashIp } = await import("@/lib/rate-limit");

    const digest = hashIp("203.0.113.7");

    expect(digest).toMatch(/^[0-9a-f]{64}$/);
    expect(digest).not.toContain("203.0.113.7");
    expect(hashIp("203.0.113.7")).toBe(digest);
    expect(hashIp("203.0.113.8")).not.toBe(digest);
  });
});
