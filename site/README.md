# Bjorvand AI pilot page

This is an additive page for the existing Bjorvand AI site, not a redesign. Norwegian source, English translation fragment and synthetic download files are installed together by `scripts/install-site-draft.mjs`. Existing header, footer, booking sheet and workflow-page CSS are reused. The installer adds a sitemap entry and never deploys or publishes.

Visitor: an accountant unsure whether both companies record the same intercompany balance. The headline names the task and Conta; the concrete NOK 25,000 example keeps the opening/month movement distinction. The primary CTA offers a free, no-obligation 20-minute discovery call, and the secondary CTA opens a credential-free report without requiring a workflow download. Pilot limitations remain beside the offer. FAQs answer scope, pricing, Cloud and next-step questions without claiming completed reconciliation or validated live support.

The report stays Norwegian in both locales; both introductions describe its language. All facts, examples, amounts and commercial terms are identical. A video production script lives in `docs/VIDEO-SCRIPT-NB.md`. No live accounting data is shipped to the site.

The page includes WebPage, SoftwareSourceCode and BreadcrumbList JSON-LD, without fabricated ratings or rich-result promises. The existing `/automatisering` directory also links to this page in both languages; preserve that contextual link when installing into another site version and update the affected sitemap dates.

`conta_asset_click` events use the existing Vercel Analytics installation and include only allowlisted action/location labels and locale. They measure clicks, not completed downloads. Existing `cta_click`, `booking_open` and `booking_confirmed` events use the `conta-checker-*` locations. Compare these with Conta page visits separately by locale, excluding developer checks; no ranking or conversion uplift has been established yet.
