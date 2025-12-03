import cron from 'node-cron';
import { ingestMaineLicenses } from '../lib/importers/maine';
import { ingestMassachusettsLicenses } from '../lib/importers/massachusetts';
import { ingestColoradoLicenses } from '../lib/importers/colorado';
import { ingestCaliforniaLicenses } from '../lib/importers/california';
import { ingestRemainingStates } from '../lib/importers/remainingStates';
import { ingestNewBrunswickStores } from '../lib/importers/newBrunswick';

// Schedule a cron job to run daily at 3 AM (server time)
console.log('Scheduler initialized. Scheduling daily license data import (3 AM)...');
cron.schedule('0 3 * * *', async () => {
  console.log('Starting scheduled license data update...');
  try {
    await ingestMaineLicenses();
    await ingestMassachusettsLicenses();
    await ingestColoradoLicenses();
    await ingestCaliforniaLicenses();
    await ingestNewBrunswickStores();
    await ingestRemainingStates();
    console.log('License data update completed successfully.');
  } catch (err) {
    console.error('Scheduled import error:', err);
  }
});
