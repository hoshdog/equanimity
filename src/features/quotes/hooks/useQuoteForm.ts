import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import type { QuoteFormData, QuoteStatus } from '../types/quote.types';

export function useQuoteForm(initialData?: Partial<QuoteFormData>, quoteId?: string) {
  const router = useRouter();
  const { toast } = useToast();
  const [formData, setFormData] = useState<Partial<QuoteFormData>>(
    initialData || {
      status: 'draft' as QuoteStatus,
      lineItems: [],
      discounts: [],
      taxSettings: {
        defaultRate: 0.10,
        includeTaxInPrices: false,
        taxLabel: 'GST',
      },
      projectContacts: [],
      assignedStaff: [],
      priority: 'standard',
      quoteType: 'new-project',
    }
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateFormData = useCallback((updates: Partial<QuoteFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  const validateStep = useCallback(async (stepIndex: number): Promise<boolean> => {
    const newErrors: Record<string, string> = {};

    switch (stepIndex) {
      case 0: // Customer & Project
        if (!formData.customerId) {
          newErrors.customerId = 'Customer is required';
        }
        break;
      case 1: // Configuration
        if (!formData.name) {
          newErrors.name = 'Quote name is required';
        }
        if (!formData.quotingProfileId) {
          newErrors.quotingProfileId = 'Quoting profile is required';
        }
        if (!formData.validUntil) {
          newErrors.validUntil = 'Valid until date is required';
        }
        break;
      case 2: // Line Items
        if (!formData.lineItems || formData.lineItems.length === 0) {
          newErrors.lineItems = 'At least one line item is required';
        }
        break;
      case 3: // Review
        // Final validation
        break;
    }

    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;

    if (!isValid) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please fix the errors before proceeding.',
      });
    }

    return isValid;
  }, [formData, toast]);

  const saveQuote = useCallback(async (): Promise<void> => {
    setIsSaving(true);
    try {
      const { mockDataService } = await import('@/lib/mock-data');
      
      const draftQuote = {
        ...formData,
        id: quoteId || `quote-${Date.now()}`,
        status: 'draft' as QuoteStatus,
        createdAt: formData.createdAt || new Date(),
        updatedAt: new Date(),
      };
      
      // Save to mock data service
      if (quoteId) {
        await mockDataService.updateQuote(quoteId, draftQuote);
      } else {
        await mockDataService.addQuote(draftQuote);
      }
      
      // Also save to localStorage as backup
      const draftKey = quoteId || `quote-draft-${draftQuote.id}`;
      localStorage.setItem(draftKey, JSON.stringify(draftQuote));
      
      toast({
        title: 'Draft Saved',
        description: 'Your quote has been saved as a draft.',
      });
    } catch (error) {
      console.error('Failed to save quote:', error);
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: 'Failed to save the quote. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  }, [formData, quoteId, toast]);

  const submitQuote = useCallback(async (): Promise<{ id: string } | null> => {
    setIsLoading(true);
    try {
      // Validate all steps
      for (let i = 0; i < 4; i++) {
        const isValid = await validateStep(i);
        if (!isValid) {
          setIsLoading(false);
          return null;
        }
      }

      // In a real app, this would submit to the API
      // For now, we'll save to mock data
      const { mockDataService } = await import('@/lib/mock-data');
      const quoteData = {
        ...formData,
        id: quoteId || `quote-${Date.now()}`,
        status: 'sent' as QuoteStatus,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: 'Quote Sent',
        description: 'The quote has been sent successfully.',
      });

      return { id: quoteData.id };
    } catch (error) {
      console.error('Failed to submit quote:', error);
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: 'Failed to send the quote. Please try again.',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [formData, quoteId, validateStep, toast]);

  // Load draft from local storage if available
  useEffect(() => {
    if (quoteId && !initialData) {
      const savedDraft = localStorage.getItem(quoteId);
      if (savedDraft) {
        try {
          const parsedDraft = JSON.parse(savedDraft);
          setFormData(parsedDraft);
        } catch (error) {
          console.error('Failed to load draft:', error);
        }
      }
    }
  }, [quoteId, initialData]);

  return {
    formData,
    updateFormData,
    validateStep,
    saveQuote,
    submitQuote,
    isLoading,
    isSaving,
    errors,
  };
}