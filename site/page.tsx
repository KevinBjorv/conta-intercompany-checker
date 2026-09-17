import type { Metadata } from "next";
import { ArrowUpRight, Download } from "lucide-react";
import { BookingSheet } from "../../components/booking-sheet";
import { SiteHeader } from "../../components/site-header";
import { SiteFooter } from "../../components/site-footer";
import { BOOKING_URL, SITE_URL, SITE_LOCALE } from "../../lib/site";
import { languageAlternates } from "../../lib/locales";
import { ContaActions } from "./conta-actions";
import "../xero-supplier-statement-checker/checker.css";
import "./conta.css";

const title = "Mellomværende i Conta: gratis n8n-pilot | Bjorvand AI";
const description = "Kontroller mellomværende mellom to Conta-selskaper. Se norsk eksempelrapport, last ned gratis n8n-pilot og avklar oppsett i en uforpliktende samtale.";
const route = "/workflows/conta-intercompany-checker";
const socialImage = SITE_LOCALE.startsWith("en") ? "/en/workflows/conta-intercompany-checker/opengraph-image" : "/workflows/conta-intercompany-checker/opengraph-image";
const demo = "/workflow-assets/conta-intercompany/conta-synthetic-demo.json";
const pilot = "/workflow-assets/conta-intercompany/conta-intercompany.json";
const sample = "/workflow-assets/conta-intercompany/rapport.html";
const guide = "/workflow-assets/conta-intercompany/SETUP.md";
const video = "/workflow-assets/conta-intercompany/conta-demonstrasjon.mp4";
const source = "/workflow-assets/conta-intercompany/conta-intercompany-checker-0.1.0.tar.gz";
const task = "Sette opp mellomværendekontroll for to Conta-selskaper";
const repository = "https://github.com/KevinBjorv/conta-intercompany-checker";
const pageUrl = `${SITE_URL}${route}`;
const faq = [
  { question: "Hva trenger vi for å teste med egne Conta-data?", answer: "To autoriserte Conta-selskaper, egne API-nøkler i n8n og separate balansekontoer som bare gjelder mellomværendet mellom disse selskapene. Begge regnskap og de valgte posisjonene må være i NOK. Regnskapsføreren godkjenner kontoene, og resultatene må kontrolleres mot Conta-rapporter før månedlig kjøring aktiveres." },
  { question: "Hva koster malen og hjelp til oppsett?", answer: "Kildekoden og malen er gratis med MIT-lisens. Oppsett, testing og tilpasning prises etter avtalt omfang. Eventuell drift, oppfølging, n8n og nødvendige Conta-abonnementer kommer i tillegg. Vi avklarer leveranse og pris før arbeidet starter." },
  { question: "Fungerer piloten med n8n Cloud?", answer: "n8n Cloud er ikke verifisert. Piloten er testet lokalt med syntetiske data på selvdriftet n8n 2.39.6. Testing mot to autoriserte Conta-selskaper gjenstår også. Før bruk med egne regnskap må både rapportgrunnlaget og deres n8n-miljø valideres." },
  { question: "Hva får vi ut av kartleggingssamtalen?", answer: "På 20 minutter går vi gjennom dagens kontroll, hvilke selskaper og kontoer som er aktuelle, og hva som må testes. Dere får avklart om en pilot passer og hva et neste steg innebærer. Samtalen er gratis og uforpliktende. Du trenger ikke dele API-nøkler eller regnskapsfiler for å bestille." },
];
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "WebPage", "@id": `${pageUrl}#page`, url: pageUrl, name: title, description, inLanguage: "nb-NO", mainEntity: { "@id": `${pageUrl}#source` }, publisher: { "@type": "Organization", name: "Bjorvand AI", url: SITE_URL } },
    { "@type": "SoftwareSourceCode", "@id": `${pageUrl}#source`, name: "Mellomværendekontroll for Conta", description, codeRepository: repository, license: `${repository}/blob/main/LICENSE`, programmingLanguage: ["TypeScript", "JavaScript"], runtimePlatform: "n8n", version: "0.1.0", isAccessibleForFree: true },
    { "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Arbeidsflyter og guider", item: `${SITE_URL}/automatisering` },
      { "@type": "ListItem", position: 2, name: "Mellomværendekontroll for Conta", item: pageUrl },
    ] },
  ],
};

export const metadata: Metadata = {
  title, description, alternates: languageAlternates(`${SITE_URL}${route}`),
  openGraph: { title, description, url: `${SITE_URL}${route}`, type: "website", locale: "nb_NO", images: [{ url: socialImage, width: 1200, height: 630, alt: title }] },
  twitter: { card: "summary_large_image", title, description, images: [socialImage] },
};

function ImplementLink({ location }: { location: string }) {
  return <a className="button" href={`${BOOKING_URL}?oppgave=${encodeURIComponent(task)}`} data-booking-link data-booking-location={location} data-booking-task={task} data-booking-note="">Kartlegg én jobb på 20 min<ArrowUpRight size={18} aria-hidden="true" /></a>;
}

export default function ContaIntercompanyPage() {
  return <div className="checker-page conta-checker">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    <ContaActions />
    <a className="skip-link" href="#innhold">Hopp til innholdet</a>
    <SiteHeader bookingLocation="conta-checker-header" bookingTask={task} />
    <main id="innhold">
      <nav className="shell conta-breadcrumb" aria-label="Brødsmuler"><a href="/automatisering">Arbeidsflyter og guider</a><span aria-hidden="true"> / </span><span aria-current="page">Mellomværendekontroll for Conta</span></nav>
      <section className="shell checker-hero">
        <div><h1>Kontroller mellomværende<br /><span>i Conta.</span></h1>
          <p className="checker-lead">Se inngående saldo, månedens bevegelser og utgående saldo i én norsk kontrollrapport. For regnskapsførere som følger opp mellomværende mellom to selskaper i Conta.</p>
          <div className="checker-actions"><ImplementLink location="conta-checker-hero" /><a className="button button-secondary" href={sample} data-conta-action="report" data-conta-location="hero">Se eksempelrapporten<ArrowUpRight size={18} aria-hidden="true" /></a></div>
          <p className="conta-call-note">Gratis og uforpliktende. Avklar kontoer, tilganger og om en pilot passer.</p>
          <p className="checker-status">Forhåndsversjon: Syntetiske regnskapstester og lokale n8n-tester er gjennomført. Verifisering mot to autoriserte Conta-selskaper og n8n Cloud gjenstår. Prøv det syntetiske eksempelet først.</p>
          <p><a className="checker-text-link" href={demo} download data-conta-action="demo" data-conta-location="hero">Last ned testeksempelet<Download size={16} aria-hidden="true" /></a></p>
          <p><a className="checker-text-link" href={video} data-conta-action="video" data-conta-location="hero">Se norsk demovideo: 90 sekunder uten lyd<ArrowUpRight size={16} aria-hidden="true" /></a></p>
        </div>
        <div className="checker-report-preview" aria-label="Eksempel på mellomværendekontroll med syntetiske data">
          <div className="checker-report-top"><strong>Mellomværendekontroll for Conta</strong><span>Syntetisk eksempel</span></div>
          <div className="checker-example-line"><span>Utgående restsaldo: A + B</span><strong>250 000 − 225 000 = 25 000 NOK</strong><p>Saldoene er ulike. Rapporten fastslår ikke årsaken.</p></div>
          <div className="checker-example-line"><span>Forskjellen før og i perioden</span><strong>15 000 + 10 000 = 25 000 NOK</strong><p>15 000 kroner var allerede til stede ved inngangen til måneden. Bevegelsene øker forskjellen med 10 000 kroner.</p></div>
          <div className="checker-counts"><div><strong>2</strong><span>Selskaper</span></div><div><strong>20</strong><span>Linjer</span></div><div><strong>9</strong><span>Kandidater</span></div><div><strong>2</strong><span>Uten kandidat</span></div></div>
          <p className="checker-caption">August 2026. Alle data er oppdiktet. Ingen kandidater er automatisk godkjent.</p>
        </div>
      </section>
      <section className="checker-dark"><div className="shell checker-section"><h2>Slik kontrollerer dere mellomværende i Conta.</h2><ol className="checker-steps">
        <li><h3>Velg selskapene og kontoene</h3><p>Regnskapsføreren godkjenner to ulike selskaper og balansekontoer som bare gjelder denne motparten. Begge regnskap og alle valgte posisjoner må være i NOK.</p></li>
        <li><h3>Kontroller hele måneden</h3><p>Hent inngående saldo, bevegelser og utgående saldo. Detaljlinjene kontrolleres mot bevegelsene, og saldoene hentes på nytt etterpå.</p></li>
        <li><h3>Vurder rapporten</h3><p>Last ned HTML, CSV og JSON med saldoer, kilde-ID-er og uavklarte linjer. Manuell kjøring og månedlig kjøring for sist avsluttede måned er klargjort.</p></li>
      </ol></div></section>
      <section className="shell checker-section checker-two-columns"><h2>Saldoenighet er ikke<br />ferdig avstemming.</h2><div><ul className="checker-limits">
        <li>Manglende, mislykkede eller inkonsistente data gir ufullstendig kontroll. De blir aldri satt til null.</li>
        <li>En lik saldo beviser ikke at alle transaksjoner er med. Uavklarte linjer er ikke bekreftede bokføringsfeil.</li>
        <li>Kandidatforslag krever bekreftet felles fakturareferanse, motsatte like beløp og dato innenfor valgt vindu. Beløpet alene er aldri nok.</li>
        <li>Duplikater, delte oppgjør, reverseringer og korrigeringer krever vurdering. Kontoer med flere motparter og valutaomregning er utenfor omfanget.</li>
        <li>Nye saldohentinger oppdager enkelte endringer underveis. De gir ikke et atomisk historisk øyeblikksbilde.</li>
      </ul></div></section>
      <section className="shell checker-section checker-two-columns"><h2>Les data.<br />Behold kontrollen.</h2><div><p>Arbeidsflyten gjør bare GET-forespørsler til utvalgte Conta-endepunkter. Den bokfører ikke, betaler ikke og sender ikke e-post. Ingen AI eller OCR brukes.</p><p>Conta-nøkkelen arver brukerens rettigheter og er ikke i seg selv skrivebeskyttet. Dere lagrer egne nøkler i n8n-legitimasjon, aldri i arbeidsflytfilen.</p><p>Rapportene inneholder regnskapsdata og skal oppbevares privat. Ved månedlig kjøring må dere godkjenne tilgang og lagringstid i n8n før aktivering.</p></div></section>
      <section className="shell checker-section checker-two-columns"><h2>Gratis kode.<br />Oppsett etter behov.</h2><div><p>Kildekoden og malen har MIT-lisens. Dere trenger n8n, tilgang til begge Conta-selskaper og nødvendige Conta-abonnementer. Eventuell n8n-drift og leverandørkostnader kommer i tillegg.</p><p>Bjorvand AI kan hjelpe med kontovalg, oppsett, testing og tilpasning. Pris, eventuell drift og oppfølging avtales etter at omfanget er avklart.</p><p><a className="checker-text-link" href={pilot} download data-conta-action="pilot" data-conta-location="resources">Last ned pilotmalen<Download size={16} aria-hidden="true" /></a></p><p><a className="checker-text-link" href={source} download data-conta-action="source" data-conta-location="resources">Last ned kildekoden (MIT)<Download size={16} aria-hidden="true" /></a></p><p><a className="checker-text-link" href={repository}>Se kildekode og teststatus på GitHub<ArrowUpRight size={16} aria-hidden="true" /></a></p><a className="checker-text-link" href={guide} data-conta-action="guide" data-conta-location="resources">Les oppsettveiledningen på engelsk<ArrowUpRight size={16} aria-hidden="true" /></a></div></section>
      <section className="shell checker-section checker-two-columns"><h2>Før dere prøver<br />mellomværendekontrollen.</h2><div className="checker-faq">{faq.map(item => <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</div></section>
      <section className="checker-closing shell checker-section"><h2>Avklar deres Conta-pilot<br />på 20 minutter.</h2><p className="checker-lead">Vi går gjennom dagens kontroll og avklarer hvilke kontoer, tilganger og tester dere trenger. Gratis og uforpliktende med Kevin Bjorvand. Eventuelt oppsett og pris avtales separat.</p><div className="checker-actions"><ImplementLink location="conta-checker-closing" /><a className="button button-secondary" href={sample} data-conta-action="report" data-conta-location="closing">Se eksempelrapporten<ArrowUpRight size={18} aria-hidden="true" /></a></div></section>
    </main><SiteFooter /><BookingSheet bookingUrl={BOOKING_URL} />
  </div>;
}
