\# SmokeTheGlobe – Cannabis License Data Integration



This repository provides an automated system to import and manage cannabis license data for U.S. states and Canadian provinces with legal programs. It includes scripts and API endpoints to fetch data from official public sources (state regulatory open data portals, government websites) and ingest them into the database, as well as admin tools to run imports on demand or on a schedule.



\## Features



\- \*\*Automated Importers\*\* for:

&nbsp; - Maine (USA) – Office of Cannabis Policy open data CSV.

&nbsp; - Massachusetts (USA) – Cannabis Control Commission open data CSV.

&nbsp; - Colorado (USA) – Marijuana Enforcement Division license Google Sheets.

&nbsp; - California (USA) – Dept. of Cannabis Control public API (active licenses).

&nbsp; - All other U.S. states – via a consolidated open dataset (Cannlytics, as a default).

&nbsp; - New Brunswick (Canada) – Cannabis NB store locations (scraped from official website).

\- \*\*Admin API Endpoint\*\* `/api/admin/ingest` – Trigger imports for all or specific regions (admin-authenticated or secure token required).

\- \*\*File Upload Endpoint\*\* `/api/admin/licenses/import` – Upload a CSV of license data for manual importing (admin-only).

\- \*\*Scheduled Imports\*\* – Example Node cron job (`scripts/scheduler.ts`) set to run daily at 3:00 AM server time, or use Vercel Cron for serverless scheduling.

\- \*\*Database Integration\*\* – Uses Prisma to upsert data into `StateLicense` records and link to `Location` or `Lab` records appropriately. Preserves original data JSON for auditing and sets source metadata for compliance.



\## Installation and Setup



1\. \*\*Clone the repository and install dependencies\*\* (use PowerShell on Windows or a similar shell):

&nbsp;  ```powershell

&nbsp;  # From project root

&nbsp;  # 1) Install runtime dependencies

&nbsp;  npm install @prisma/client csv-parse slugify node-fetch cheerio form-data formidable node-cron



&nbsp;  # 2) Install development/CLI dependencies

&nbsp;  npm install --save-dev prisma ts-node typescript @types/node @types/cheerio @types/formidable



&nbsp;  # 3) (Optional) Install test framework (Jest or Vitest)

&nbsp;  npm install --save-dev jest ts-jest @types/jest

&nbsp;  # or

&nbsp;  npm install --save-dev vitest @types/vitest



