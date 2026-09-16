import type { Metadata } from "next";
import { ArrowUpRight, Download } from "lucide-react";
import { BookingSheet } from "../../components/booking-sheet";
import { SiteHeader } from "../../components/site-header";
import { SiteFooter } from "../../components/site-footer";
import { BOOKING_URL, SITE_URL } from "../../lib/site";
import { languageAlternates } from "../../lib/locales";
import "../xero-supplier-statement-checker/checker.css";

const title = "Kontroller mellomværende i Conta | Bjorvand AI";
const description = "Sammenlign inngående saldo, periodens bevegelse og utgående saldo mellom to Conta-selskaper. Gratis n8n-pilot med norsk kontrollrapport og kildegrunnlag.";
const route = "/workflows/conta-intercompany-checker";
const socialImage = "/workflows/conta-intercompany-checker/opengraph-image";
const demo = "/workflow-assets/conta-intercompany/conta-synthetic-demo.json";
const pilot = "/workflow-assets/conta-intercompany/conta-intercompany.json";
const sample = "/workflow-assets/conta-intercompany/rapport.html";
const guide = "/workflow-assets/conta-intercompany/SETUP.md";
const video = "/workflow-assets/conta-intercompany/conta-demonstrasjon.mp4";
const source = "/workflow-assets/conta-intercompany/conta-intercompany-checker-0.1.0.tar.gz";
const task = "Sette opp mellomværendekontroll for to Conta-selskaper";

export const metadata: Metadata = {
  title, description, alternates: languageAlternates(`${SITE_URL}${route}`),
  openGraph: { title, description, url: `${SITE_URL}${route}`, type: "website", locale: "nb_NO", images: [{ url: socialImage, width: 1200, height: 630, alt: title }] },
  twitter: { card: "summary_large_image", title, description, images: [socialImage] },
};

function ImplementLink({ location }: { location: string }) {
  return <a className="button" href={`${BOOKING_URL}?oppgave=${encodeURIComponent(task)}`} data-booking-link data-booking-location={location} data-booking-task={task} data-booking-note="">Få arbeidsflyten satt opp<ArrowUpRight size={18} aria-hidden="true" /></a>;
}

export default function ContaIntercompanyPage() {
  return <div className="checker-page">
    <a className="skip-link" href="#innhold">Hopp til innholdet</a>
    <SiteHeader bookingLocation="conta-checker-header" bookingTask={task} />
    <main id="innhold">
      <section className="shell checker-hero">
        <div><h1>Stemmer mellomværendet<br /><span>på begge sider?</span></h1>
          <p className="checker-lead">Det ene selskapet viser 250 000 kroner til gode. Det andre viser 225 000 kroner i gjeld. Kontrollrapporten viser forskjellen og grunnlaget bak den.</p>
          <p>Arbeidsflyten sammenligner signerte saldoer på kontoene dere velger i Conta. Inngående differanse og periodens bevegelse vises hver for seg.</p>
          <p className="checker-status">Forhåndsversjon: Syntetiske regnskapstester og lokale n8n-tester er gjennomført. Verifisering mot to autoriserte Conta-selskaper og n8n Cloud gjenstår. Prøv det syntetiske eksempelet først.</p>
          <div className="checker-actions"><a className="button button-secondary" href={demo} download><Download size={18} aria-hidden="true" />Last ned testeksempelet</a><ImplementLink location="conta-checker-hero" /></div>
          <a className="checker-text-link" href={sample} target="_blank" rel="noreferrer">Åpne eksempelrapporten på norsk<ArrowUpRight size={16} aria-hidden="true" /></a>
          <p><a className="checker-text-link" href={video}>Se norsk demovideo: 90 sekunder uten lyd<ArrowUpRight size={16} aria-hidden="true" /></a></p>
        </div>
        <div className="checker-report-preview" aria-label="Eksempel på mellomværendekontroll med syntetiske data">
          <div className="checker-report-top"><strong>Mellomværendekontroll for Conta</strong><span>Syntetisk eksempel</span></div>
          <div className="checker-example-line"><span>Utgående restsaldo: A + B</span><strong>250 000 − 225 000 = 25 000 NOK</strong><p>Saldoene er ulike. Rapporten fastslår ikke årsaken.</p></div>
          <div className="checker-example-line"><span>Forskjellen før og i perioden</span><strong>15 000 + 10 000 = 25 000 NOK</strong><p>15 000 kroner var allerede til stede ved inngangen til måneden. Bevegelsene øker forskjellen med 10 000 kroner.</p></div>
          <div className="checker-counts"><div><strong>2</strong><span>Selskaper</span></div><div><strong>20</strong><span>Linjer</span></div><div><strong>9</strong><span>Kandidater</span></div><div><strong>2</strong><span>Uten kandidat</span></div></div>
          <p className="checker-caption">August 2026. Alle data er oppdiktet. Ingen kandidater er automatisk godkjent.</p>
        </div>
      </section>
      <section className="checker-dark"><div className="shell checker-section"><h2>Fra to regnskap til ett kontrollgrunnlag.</h2><ol className="checker-steps">
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
      <section className="shell checker-section checker-two-columns"><h2>Gratis kode.<br />Oppsett etter behov.</h2><div><p>Kildekoden og malen har MIT-lisens. Dere trenger n8n, tilgang til begge Conta-selskaper og nødvendige Conta-abonnementer. Eventuell n8n-drift og leverandørkostnader kommer i tillegg.</p><p>Bjorvand AI kan hjelpe med kontovalg, oppsett, testing og tilpasning. Pris, eventuell drift og oppfølging avtales etter at omfanget er avklart.</p><p><a className="checker-text-link" href={pilot} download>Last ned pilotmalen<Download size={16} aria-hidden="true" /></a></p><p><a className="checker-text-link" href={source} download>Last ned kildekoden (MIT)<Download size={16} aria-hidden="true" /></a></p><a className="checker-text-link" href={guide}>Les oppsettveiledningen på engelsk<ArrowUpRight size={16} aria-hidden="true" /></a></div></section>
      <section className="checker-closing shell checker-section"><h2>Prøv med testdata.<br />Avklar deres kontrollbehov.</h2><p className="checker-lead">Ta med hvilke selskaper og kontoer dere vil kontrollere, og hvordan dere gjør jobben i dag. Vi avklarer tilganger, manuelle kontrollpunkter og pris før arbeidet starter.</p><div className="checker-actions"><a className="button button-secondary" href={demo} download>Last ned testeksempelet<Download size={18} aria-hidden="true" /></a><ImplementLink location="conta-checker-closing" /></div></section>
    </main><SiteFooter /><BookingSheet bookingUrl={BOOKING_URL} />
  </div>;
}
