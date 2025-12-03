import { ingestMaineLicenses } from '../lib/importers/maine';
import { ingestMassachusettsLicenses } from '../lib/importers/massachusetts';
import { ingestColoradoLicenses } from '../lib/importers/colorado';
import { ingestCaliforniaLicenses } from '../lib/importers/california';
import { ingestRemainingStates } from '../lib/importers/remainingStates';
import { ingestNewBrunswickStores } from '../lib/importers/newBrunswick';

async function run() {
  const args = process.argv;
  const importIndex = args.indexOf('--import');
  if (importIndex === -1 || !args[importIndex + 1]) {
    console.error('Usage: node -r ts-node/register scripts/run-importer.ts --import <STATE_CODE|ALL>');
    process.exit(1);
  }
  const code = args[importIndex + 1].toUpperCase();
  try {
    switch (code) {
      case 'ME': {
        const count = await ingestMaineLicenses();
        console.log(`Imported ${count} Maine licenses.`);
        break;
      }
      case 'MA': {
        const count = await ingestMassachusettsLicenses();
        console.log(`Imported ${count} Massachusetts licenses.`);
        break;
      }
      case 'CO': {
        const count = await ingestColoradoLicenses();
        console.log(`Imported ${count} Colorado licenses.`);
        break;
      }
      case 'CA': {
        const count = await ingestCaliforniaLicenses();
        console.log(`Imported ${count} California licenses.`);
        break;
      }
      case 'NB': {
        const count = await ingestNewBrunswickStores();
        console.log(`Imported ${count} New Brunswick store records.`);
        break;
      }
      case 'ALL': {
        const me = await ingestMaineLicenses();
        const ma = await ingestMassachusettsLicenses();
        const co = await ingestColoradoLicenses();
        const ca = await ingestCaliforniaLicenses();
        const nb = await ingestNewBrunswickStores();
        const remaining = await ingestRemainingStates();
        console.log('All regions import complete.');
        console.log(`ME:${me}, MA:${ma}, CO:${co}, CA:${ca}, NB:${nb}, Remaining:${remaining}`);
        break;
      }
      default:
        console.error(`Unknown import code: ${code}`);
        process.exit(1);
    }
  } catch (err) {
    console.error('Error during import run:', err);
    process.exit(1);
  }
  process.exit(0);
}

run();
