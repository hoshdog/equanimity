'use client';

import * as React from 'react';
import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { ArrowLeft, ArrowRight, Check, Save, Send } from 'lucide-react';

// Import wizard steps
import { CustomerProjectStep } from './steps/CustomerProjectStep';
import { ConfigurationStep } from './steps/ConfigurationStep';
import { LineItemsStep } from './steps/LineItemsStep';
import { ReviewStep } from './steps/ReviewStep';

// Import context and hooks
import { QuoteFormProvider } from '../../context/QuoteFormContext';
import { useQuoteForm } from '../../hooks/useQuoteForm';
import { QuotePreview } from '../quote-preview/QuotePreview';

import type { QuoteFormData } from '../../types/quote.types';

const STEPS = [
  { id: 'customer', label: 'Customer & Project', icon: '1' },
  { id: 'configuration', label: 'Configuration', icon: '2' },
  { id: 'line-items', label: 'Line Items & Pricing', icon: '3' },
  { id: 'review', label: 'Review & Send', icon: '4' },
];

interface QuoteWizardProps {
  initialData?: Partial<QuoteFormData>;
  quoteId?: string;
  mode?: 'create' | 'edit' | 'duplicate';
}

export function QuoteWizard({ initialData, quoteId, mode = 'create' }: QuoteWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [showPreview, setShowPreview] = useState(true);

  const {
    formData,
    updateFormData,
    validateStep,
    saveQuote,
    submitQuote,
    isLoading,
    isSaving,
  } = useQuoteForm(initialData, quoteId);

  const handleNext = useCallback(async () => {
    const isValid = await validateStep(currentStep);
    if (isValid && currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
      // Auto-save draft
      if (mode !== 'create' || formData.customerId) {
        await saveQuote();
      }
    }
  }, [currentStep, validateStep, mode, formData, saveQuote]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const handleStepClick = useCallback(async (stepIndex: number) => {
    // Allow going back, but validate when going forward
    if (stepIndex < currentStep) {
      setCurrentStep(stepIndex);
    } else if (stepIndex > currentStep) {
      let canProceed = true;
      for (let i = currentStep; i < stepIndex; i++) {
        const isValid = await validateStep(i);
        if (!isValid) {
          canProceed = false;
          break;
        }
      }
      if (canProceed) {
        setCurrentStep(stepIndex);
      }
    }
  }, [currentStep, validateStep]);

  const handleSubmit = useCallback(async () => {
    const quote = await submitQuote();
    if (quote) {
      router.push(`/quotes/${quote.id}`);
    }
  }, [submitQuote, router]);

  const progressPercentage = ((currentStep + 1) / STEPS.length) * 100;

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <CustomerProjectStep data={formData} onChange={updateFormData} />;
      case 1:
        return <ConfigurationStep data={formData} onChange={updateFormData} />;
      case 2:
        return <LineItemsStep data={formData} onChange={updateFormData} />;
      case 3:
        return <ReviewStep data={formData} onChange={updateFormData} />;
      default:
        return null;
    }
  };

  return (
    <QuoteFormProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.back()}
                  className="flex items-center"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <h1 className="text-xl font-semibold">
                  {mode === 'edit' ? 'Edit Quote' : mode === 'duplicate' ? 'Duplicate Quote' : 'Create Quote'}
                </h1>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={saveQuote}
                  disabled={isSaving}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Draft
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                  className="hidden lg:flex"
                >
                  {showPreview ? 'Hide' : 'Show'} Preview
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between mb-2">
              {STEPS.map((step, index) => (
                <button
                  key={step.id}
                  onClick={() => handleStepClick(index)}
                  className={cn(
                    'flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors',
                    index === currentStep
                      ? 'bg-primary text-primary-foreground'
                      : index < currentStep
                      ? 'bg-primary/10 text-primary cursor-pointer hover:bg-primary/20'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  )}
                  disabled={index > currentStep}
                >
                  <span className={cn(
                    'flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold',
                    index < currentStep ? 'bg-primary text-white' : ''
                  )}>
                    {index < currentStep ? <Check className="h-3 w-3" /> : step.icon}
                  </span>
                  <span className="hidden sm:block text-sm font-medium">{step.label}</span>
                </button>
              ))}
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className={cn(
            'grid gap-6',
            showPreview ? 'lg:grid-cols-[1fr,480px]' : 'lg:grid-cols-1'
          )}>
            {/* Form Section */}
            <Card className="p-6">
              {renderStep()}
              
              {/* Navigation Buttons */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentStep === 0}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
                
                {currentStep < STEPS.length - 1 ? (
                  <Button onClick={handleNext} disabled={isLoading}>
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button onClick={handleSubmit} disabled={isLoading}>
                    <Send className="h-4 w-4 mr-2" />
                    Send Quote
                  </Button>
                )}
              </div>
            </Card>

            {/* Preview Section */}
            {showPreview && (
              <div className="lg:block">
                <div className="sticky top-6">
                  <QuotePreview data={formData} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Preview Button */}
        <div className="lg:hidden fixed bottom-6 right-6 z-50">
          <Button
            size="lg"
            className="rounded-full shadow-lg"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? 'Hide' : 'Show'} Preview
          </Button>
        </div>
      </div>
    </QuoteFormProvider>
  );
}