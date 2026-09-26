# Example: Next.js App Router

Copy these files into a Next.js 14+ site. Set `MAXIVO_URL`, `MAXIVO_TOKEN` and `MAXIVO_WEBHOOK_SECRET` (server-only).

- `lib/maxivo.ts`: the client
- `app/blog/page.tsx`: blog list
- `app/blog/[slug]/page.tsx`: blog page with SEO metadata
- `app/[lang]/blog/[slug]/page.tsx`: translated blog pages
- `app/api/maxivo/revalidate/route.ts`: refreshes pages when a post is published
- `app/sitemap.ts`: sitemap entries for every language
