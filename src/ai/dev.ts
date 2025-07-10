import { config } from 'dotenv';
config();

import '@/ai/flows/extract-parts-from-supplier-list.ts';
import '@/ai/flows/suggest-timesheet-entries-from-location.ts';
import '@/ai/flows/suggest-technicians-for-scheduling.ts';
import '@/ai/flows/extract-data-from-delivery-dockets.ts';
import '@/ai/flows/automate-payroll-calculations.ts';
import '@/ai/flows/generate-quote-from-prompt.ts';
import '@/ai/flows/automatically-follow-up-purchase-orders.ts';
import '@/ai/flows/generate-compliance-health-check.ts';
