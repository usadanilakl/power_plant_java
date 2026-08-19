import { parentPort, workerData } from 'worker_threads';
import AdmZip from 'adm-zip';

/**
 * Worker thread: extract the single .mv.db entry from an H2 backup ZIP. Runs the (synchronous) adm-zip
 * decompression OFF the Electron main thread so a large-DB cold-resync doesn't freeze the UI. Reports
 * {ok:true} or {ok:false,error} back to the parent.
 */
try {
  const { zipPath, destDir, outName } = workerData as { zipPath: string; destDir: string; outName: string };
  const zip = new AdmZip(zipPath);
  const entry = zip.getEntries().find((e) => e.entryName.endsWith('.mv.db'));
  if (!entry) {
    throw new Error(`No .mv.db entry in ${zipPath}`);
  }
  zip.extractEntryTo(entry, destDir, false, true, false, outName);
  parentPort?.postMessage({ ok: true });
} catch (e: any) {
  parentPort?.postMessage({ ok: false, error: e?.message || String(e) });
}
