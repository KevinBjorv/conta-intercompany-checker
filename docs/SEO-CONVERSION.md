# SEO and conversion update — 2026-09-17

The Norwegian and English Conta pilot pages now name the task and provider in the title and H1, offer a direct sample-report preview, and describe a free, no-obligation 20-minute discovery call. Pilot limitations remain visible beside the offer. No live Conta support, Cloud compatibility, ranking gain or conversion uplift is claimed.

## Shipped changes

- Descriptive localized titles, descriptions and social cards. The English page now references its English Open Graph image.
- WebPage, SoftwareSourceCode and BreadcrumbList JSON-LD with localized page URLs and the actual MIT repository. No invented reviews, ratings or FAQ rich-result promises.
- Breadcrumb navigation and a contextual link from `/automatisering` in both languages; updated sitemap dates for those pages.
- One visually primary booking CTA, one outlined report-preview CTA and a clear explanation of the call. Viewing the report needs no signup, credentials or workflow download.
- Keyboard-operable FAQs explain required access, pricing, Cloud limitations and what happens in the call.
- Existing visual design, accounting safeguards, synthetic reports and frozen v0.1.0 downloads preserved. No dependencies added.
- GitHub homepage populated and relevant n8n/Conta/accounting/intercompany/TypeScript/reconciliation topics added. README links directly to the sample report and pilot offer.

## Verification and publication

- Website source: `6037b918c419faea514bbf2b9fd23da763aa3f8a`, pushed to `KevinBjorv/bjorvand-ai` main.
- Vercel production deployment: `dpl_2P9Gsaxx8FiaWBfLCTDCLVSwuxen`, aliased to `bjorvand.ai`.
- Production build, TypeScript and scoped ESLint passed. Existing checks passed: 307 localization/routing assertions and 348 site assertions.
- Both languages inspected at 390, 768, 1440 and 1920 pixels without horizontal document overflow. A mobile breadcrumb visibility issue was corrected and checked in the final build.
- Rendered JSON-LD and canonical/locale/social metadata inspected. Both generated social cards visually inspected.
- Keyboard FAQ disclosure, direct report navigation, both localized booking dialogs and the directory link were checked in the browser. Production showed the new copy and metadata. No booking was submitted; neither full accessibility certification nor a completed booking transaction is claimed.

## Measurement

`conta_asset_click` uses existing Vercel Analytics and sends only allowlisted `action`, `location` and `locale` labels. Actions are `report`, `demo`, `video`, `pilot`, `source` and `guide`. A click is intent, not proof that a download completed. Existing `cta_click`, `booking_open` and `booking_confirmed` events retain the `conta-checker-*` locations.

Assess the page funnel by locale: page visit → report preview or booking open → confirmed booking → qualified pilot conversation. Exclude development/browser checks and compare equivalent traffic sources and periods. Inspect Search Console impressions, queries and click-through rates when data is available; no Search Console access or search-volume estimate was used for this change. Analytics ingestion and real conversion lift require subsequent production measurement.

## Basis

The changes follow Google's guidance on [clear title links](https://developers.google.com/search/docs/appearance/title-link), [descriptive crawlable internal links](https://developers.google.com/search/docs/crawling-indexing/links-crawlable), and [accurate structured data](https://developers.google.com/search/docs/appearance/structured-data/sd-policies). Keyword choices describe the actual product and task; they are not presented as measured demand or ranking forecasts.
