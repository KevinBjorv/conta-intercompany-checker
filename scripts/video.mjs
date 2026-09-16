// Optional asset production: FFmpeg + Arial from Windows, neither is a runtime dependency.
import { mkdir, writeFile, copyFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
await mkdir('.qa/media', { recursive: true });
await copyFile('C:/Windows/Fonts/arial.ttf', '.qa/media/arial.ttf');
await copyFile('C:/Windows/Fonts/arialbd.ttf', '.qa/media/arialbd.ttf');
const slides = [
  [10, 'Kontroller mellomværende mellom\nto selskaper i Conta automatisk', 'En norsk kontrollrapport for regnskapsføreren.\n\nForhåndsversjon med syntetiske data.\nLive Conta og n8n Cloud er ikke verifisert.'],
  [12, 'To selskaper. Ett avgrenset forhold.', 'Velg to autoriserte selskaper og dedikerte kontoer.\n\nKontoene må bare gjelde denne motparten.\nBegge regnskap og alle posisjoner må være i NOK.'],
  [15, '25 000 kroner i utgående differanse', 'Selskap A:     +250 000 NOK\nSelskap B:     −225 000 NOK\n\nSignert restsaldo A + B:     +25 000 NOK\nLike absoluttbeløp er ikke nok.'],
  [13, 'Hva var der før måneden startet?', 'Inngående restsaldo:                    15 000 NOK\nPeriodens bevegelsesdifferanse:     10 000 NOK\nUtgående restsaldo:                      25 000 NOK\n\nHele forskjellen oppsto ikke denne måneden.'],
  [12, '20 linjer. Grunnlaget følger med.', '9 kandidatpar og 2 linjer uten kandidat.\n\nFelles fakturareferanse, motsatte like beløp\nog et valgt datovindu gir bare et forslag.\nRegnskapsføreren vurderer resultatet.'],
  [13, 'Ukjent er aldri null.', 'Manglende eller inkonsistente data gir INCOMPLETE.\nDa vurderes ikke saldoenighet.\n\nArbeidsflyten leser bare fra Conta.\nDen bokfører ikke, betaler ikke og sender ikke e-post.'],
  [15, 'Prøv det syntetiske eksempelet.', 'Gratis MIT-lisensiert n8n-pilot.\nNorske rapporter i HTML, CSV og JSON.\n\nLive Conta og n8n Cloud må verifiseres før lansering.\nOppsett og tilpasning avtales med Bjorvand AI.'],
];
await writeFile('.qa/media/top.txt', 'BJORVAND AI  /  MELLOMVÆRENDEKONTROLL FOR CONTA');
await writeFile('.qa/media/footer.txt', 'KUN SYNTETISKE DATA  ·  FORHÅNDSVERSJON  ·  bjorvand.ai');
function run(program, args) {
  const result = spawnSync(program, args, { encoding: 'utf8', windowsHide: true });
  if (result.error || result.status) throw new Error(result.error?.message ?? result.stderr);
  return result.stdout;
}
let at = 0; const captions = [];
const stamp = n => `00:${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')},000`;
for (const [i, [seconds, title, body]] of slides.entries()) {
  await writeFile(`.qa/media/title-${i}.txt`, title, 'utf8'); await writeFile(`.qa/media/body-${i}.txt`, body, 'utf8');
  const draw = (file, size, x, y, bold = false, color = '0x181a18') => `drawtext=fontfile=.qa/media/arial${bold ? 'bd' : ''}.ttf:textfile=.qa/media/${file}.txt:fontsize=${size}:fontcolor=${color}:x=${x}:y=${y}:line_spacing=18`;
  const filter = [
    'drawbox=x=0:y=0:w=1920:h=16:color=0xc8582a:t=fill',
    draw('top', 24, 110, 80), draw(`title-${i}`, 62, 110, 185, true),
    draw(`body-${i}`, 39, 110, 420), draw('footer', 23, 110, 975, false, '0x555d57'),
    `drawbox=x=110:y=930:w=${Math.round(1700 * (i + 1) / slides.length)}:h=5:color=0xc8582a:t=fill`,
  ].join(',');
  run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'lavfi', '-i', `color=c=0xf5f1e8:s=1920x1080:r=25:d=${seconds}`, '-vf', filter, '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p', '-threads', '2', `.qa/media/clip-${i}.mp4`]);
  captions.push(`${i + 1}\n${stamp(at)} --> ${stamp(at + seconds)}\n${title.replaceAll('\n', ' ')}\n`); at += seconds;
}
await writeFile('.qa/media/clips.txt', slides.map((_, i) => `file 'clip-${i}.mp4'`).join('\n'));
run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'concat', '-safe', '1', '-i', '.qa/media/clips.txt', '-c', 'copy', '-movflags', '+faststart', 'release/demo/conta-demonstrasjon.mp4']);
await writeFile('release/demo/conta-demonstrasjon.srt', captions.join('\n'), 'utf8');
run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-ss', '24', '-i', 'release/demo/conta-demonstrasjon.mp4', '-frames:v', '1', 'release/demo/video-preview.png']);
const probe = JSON.parse(run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration:stream=codec_name,width,height', '-of', 'json', 'release/demo/conta-demonstrasjon.mp4']));
if (Number(probe.format.duration) !== 90 || probe.streams[0].width !== 1920 || probe.streams[0].height !== 1080) throw new Error('Unexpected video output.');
await writeFile('release/video-verification.json', JSON.stringify({ type: 'Silent synthetic explainer with Norwegian on-screen text; not a live Conta recording', ...probe }, null, 2) + '\n');
console.log('Created 90-second 1920×1080 Norwegian synthetic explainer, title captions and verified preview. No narration.');
