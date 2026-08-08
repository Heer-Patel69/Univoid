# SEO Indexing Checklist — UniVoid

## What Was Changed

### 1. `public/sitemap-index.xml` (critical fix)
**Problem:** The sitemap index previously referenced a sub-sitemap hosted at
`https://rtvrdbbojqsrbkngnjgq.supabase.co/functions/v1/sitemap`. Per Google's
sitemap protocol, a sitemap index file may only reference sitemaps on the **same
domain** as the index file itself. The cross-domain reference caused Google to
silently ignore the sub-sitemap and not discover any content URLs.

**Fix:** The Supabase function URL was replaced with the local static sitemap:
```
https://univoid.tech/sitemap.xml
```

### 2. `public/sitemap.xml` (added `/colleges`, updated dates)
- Removed the "fallback only" label — this is now the primary static sitemap.
- Added the missing `/colleges` public route.
- Updated all `<lastmod>` dates to the current date.

### 3. `public/robots.txt` (added direct sitemap reference)
Added a second `Sitemap:` line pointing directly to `sitemap.xml`, so search
engines that fetch `robots.txt` discover the static sitemap even if they do not
follow the sitemap-index chain:
```
Sitemap: https://univoid.tech/sitemap-index.xml
Sitemap: https://univoid.tech/sitemap.xml
```

### 4. `supabase/functions/sitemap/index.ts` (removed duplicate query-parameter URLs)
**Problem:** The dynamic sitemap generator was emitting URLs like:
- `/materials?subject=…`
- `/materials?course=…`
- `/materials?branch=…`
- `/events?category=…`
- `/books?category=…`

Query-parameter variants of the same page are treated as **duplicate content**
by Google and are excluded from the index or cause canonicalization confusion.

**Fix:** All parameterised URL blocks were removed. The function now only emits:
- Static public pages (same list as `sitemap.xml`)
- Canonical detail pages: `/materials/:id`, `/events/:slug`, `/projects/:id`,
  `/books/:slug`, `/profile/:id`

Also added `/colleges` to the static pages list inside the function.

---

## How to Verify in Google Search Console URL Inspection

1. Open [Google Search Console](https://search.google.com/search-console) for
   the `univoid.tech` property.
2. **Submit sitemaps** → *Sitemaps* section → add:
   - `sitemap-index.xml`
   - `sitemap.xml`
3. For each important URL (e.g. `https://univoid.tech/`, `/materials`,
   `/events`):
   - Paste the URL into the top search bar and click **Inspect URL**.
   - Check **"Indexing allowed?"** → should say *Yes*.
   - Check **"Crawling allowed by robots.txt?"** → should say *Yes*.
   - Check **"User-declared canonical"** → should match the URL itself.
   - Click **"View Crawled Page"** to confirm Google can render the React content.
4. After requesting indexing, monitor the *Coverage* report for 48–72 hours.

---

## Quick Manual QA Checklist

### robots.txt
- [ ] `https://univoid.tech/robots.txt` returns HTTP 200.
- [ ] No `Disallow: /` that blocks all pages.
- [ ] Private routes are disallowed: `/dashboard`, `/admin`, `/organizer`,
      `/settings`, `/edit-profile`, `/my-tickets`, `/my-books`, `/onboarding`,
      `/check-in`, `/checkin`, `/fast-register`.
- [ ] Contains `Sitemap: https://univoid.tech/sitemap-index.xml`.
- [ ] Contains `Sitemap: https://univoid.tech/sitemap.xml`.

### Sitemap
- [ ] `https://univoid.tech/sitemap-index.xml` returns HTTP 200 and valid XML.
- [ ] `https://univoid.tech/sitemap.xml` returns HTTP 200 and valid XML.
- [ ] Sitemap-index only references sitemaps on `univoid.tech`.
- [ ] All `<loc>` URLs in `sitemap.xml` return HTTP 200.
- [ ] No query-parameter (`?subject=`, `?course=`, etc.) URLs in any sitemap.
- [ ] `/colleges` is present in the sitemap.

### Canonical tags
- [ ] Open page source of `https://univoid.tech/` → confirm:
  `<link rel="canonical" href="https://univoid.tech/" />` in `<head>`.
- [ ] Repeat for `/materials`, `/events`, `/books`, `/projects`, `/leaderboard`.
- [ ] No page has a canonical pointing to a different URL than itself
  (unless intentionally consolidating duplicates).

### Meta robots / noindex
- [ ] Public pages have no `<meta name="robots" content="noindex…">` in
  page source (after JavaScript renders).
- [ ] Use GSC → URL Inspection → "Page is eligible to be indexed" on key pages.

### Status codes
- [ ] All sitemap URLs return exactly HTTP 200 (not 3xx, 4xx, or 5xx).
- [ ] `https://univoid.tech/` loads the homepage (no blank page for Googlebot).

### JavaScript rendering (CSR note)
UniVoid is a Vite + React client-side-rendered app. Googlebot can execute
JavaScript but may process pages in a **deferred rendering queue**. For new
or recently-changed pages this typically adds 1–7 days on top of the normal
crawl cycle (which itself can be 1–4 weeks for a newer domain). The `index.html`
already includes critical meta tags (title, description, OG, structured data)
in the static HTML, so the homepage is immediately visible to crawlers even
before JS runs.

To verify Googlebot can see rendered content:
1. GSC → URL Inspection → **"View Crawled Page"** → *Screenshot* tab.
2. Confirm the page content is visible (not a blank white screen).
3. If blank: check for JavaScript errors in the Console tab and ensure the
   hosting platform (Vercel / Netlify / etc.) serves the SPA correctly with
   HTML5 history fallback for all routes.
