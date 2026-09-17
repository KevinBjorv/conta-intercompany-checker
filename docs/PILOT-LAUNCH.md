# Pilot launch brief

Decision, 2026-09-17: the published synthetic demonstration and assisted pilot offer can be marketed with the limitations below. This is not sign-off on the complete specification or a verified live integration. The acceptance requirements in `SPEC.md` and `LIVE-ACCEPTANCE.md` remain open.

## Offer and evidence

The free MIT template demonstrates signed opening, movement and closing balance comparison for one bilateral NOK relationship. Bjorvand AI offers scoped setup, testing and customization; no fixed price, delivery date, savings claim or ongoing service is promised. The customer and accountant approve access, account mappings and conclusions.

The public [Norwegian page](https://bjorvand.ai/workflows/conta-intercompany-checker) and [English page](https://bjorvand.ai/en/workflows/conta-intercompany-checker) already provide the synthetic demo, Norwegian report/video, source download and implementation CTA. See [publication evidence](PUBLICATION.md) and [executed checks](RELEASE-STATUS.md).

| Claim | Current basis |
| --- | --- |
| Free MIT code and downloadable synthetic demo | Published v0.1.0 prerelease and verified downloads |
| 20 synthetic lines; NOK 25,000 closing difference | NOK 15,000 opening difference + NOK 10,000 period movement |
| Tested locally on self-hosted n8n 2.39.6 | Real HTTP-node, scheduling and saved-report checks using synthetic data |
| Live Conta validation pending | No completed comparison against reports from two authorized companies |
| n8n Cloud unverified | No Cloud execution evidence; do not promise compatibility |
| Review aid | Candidate suggestions and balance agreement do not approve a reconciliation |

Keep the pilot status beside the offer in any standalone post, not solely behind a link. Use only synthetic reports, media and names. Do not say Conta-approved, production-proven, fully automated reconciliation, error-free, or compatible with every n8n deployment.

## Draft Norwegian announcement

> Stemmer mellomværendet på begge sider?
>
> I testeksempelet viser ett selskap 250 000 kroner til gode og det andre 225 000 kroner i gjeld. Mellomværendekontroll for Conta viser differansen på 25 000 kroner – og skiller mellom det som lå der ved månedens start og det som oppstod i perioden.
>
> Prøv den gratis n8n-piloten med oppdiktede regnskapsdata. Du får en norsk rapport og grunnlag for regnskapsførerens vurdering. Arbeidsflyten bokfører ikke, betaler ikke og sender ikke e-post.
>
> Dette er en forhåndsversjon. Lokale n8n-tester med testdata er gjennomført. Verifisering mot to autoriserte Conta-selskaper og n8n Cloud gjenstår. Saldoenighet er ikke ferdig avstemming.
>
> Se eksempelet og avklar et mulig pilotoppsett: https://bjorvand.ai/workflows/conta-intercompany-checker

## Equivalent English announcement

> Do the intercompany balances agree on both sides?
>
> In the test example, one company shows NOK 250,000 receivable and the other NOK 225,000 payable. Conta Intercompany Checker shows the NOK 25,000 difference and separates the opening difference from the movement during the month.
>
> Try the free n8n pilot with fictional accounting data. It produces a Norwegian report and evidence for an accountant's review. The workflow does not post entries, make payments or send email.
>
> This is a preview release. Local n8n tests using test data have passed. Verification against two authorized Conta companies and n8n Cloud remains outstanding. Balance agreement is not a completed reconciliation.
>
> Explore the example and discuss a possible pilot setup: https://bjorvand.ai/en/workflows/conta-intercompany-checker

## First pilot sequence

Suggested owner: Bjorvand AI for setup; the customer's administrator for access and storage; the customer's accountant for scope and review. No customer, commitment or deadline is assumed.

1. Demonstrate the synthetic report first. Ask how the accountant currently checks the two sides and which separate accounts hold this relationship. Do not collect API keys in a booking form or email.
2. Qualify one bilateral NOK relationship with two authorized companies. Agree price and responsibilities after scope is clear. Start with a manual run to keep the initial review small.
3. Set up customer-owned n8n credentials privately. Obtain direct Conta reports for one completed month; complete the semantic checks in `LIVE-ACCEPTANCE.md` before enabling verified results. If the records cannot establish the required semantics, keep the pilot incomplete.
4. Use the tested self-hosted version as the initial deployment target. If Cloud is requested, make its runtime validation an explicit evaluation step. This does not satisfy the project's outstanding Cloud acceptance requirement by itself.
5. Compare source reports and checker output with the accountant, then test private report retrieval and the chosen retention policy. Enable scheduling only after those checks pass. A future production month is operational monitoring, not evidence required before demonstrating the pilot.

The useful next milestone is one authorized pilot evaluation. Marketing can seek that participant without presenting the missing evaluation as already completed. These announcement drafts have not been sent or posted.
