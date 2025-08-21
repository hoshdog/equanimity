'use client';

import * as React from 'react';
import { QuoteWizard } from '@/features/quotes/components/quote-wizard/QuoteWizard';
import { QuoteFormProvider } from '@/features/quotes/context/QuoteFormContext';

export default function NewQuotePage() {
  return (
    <QuoteFormProvider>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        {/* Quote Wizard */}
        <QuoteWizard />
      </div>
    </QuoteFormProvider>
  );
}