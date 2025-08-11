'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Check, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MobileContainer, TouchButton } from '@/components/ui/mobile-container';
import { v4 as uuidv4 } from 'uuid';
import { 
  JourneyFormState, 
  TravelCaptureInput, 
  TravelTypeStep, 
  TravelerDetailsStep, 
  DestinationStep, 
  PreferencesStep 
} from '@/lib/types/travel';
import {
  validateStep1,
  validateStep2,
  validateStep3,
  validateStep4,
  validateCompleteTravelInput
} from '@/lib/validations/travel';

// Import step components
import TravelTypeSelection from './TravelTypeSelection';
import TravelerDetails from './TravelerDetails';
import DestinationAndTiming from './DestinationAndTiming';
import PreferencesAndBudget from './PreferencesAndBudget';
import CaptchaVerification from './CaptchaVerification';

interface JourneyFormProps {
  onComplete: (data: TravelCaptureInput) => void;
  isGuest?: boolean;
  initialData?: {
    destination?: string;
    capturedImage?: string;
  };
}

export default function JourneyForm({ onComplete, isGuest = true, initialData }: JourneyFormProps) {
  const [formState, setFormState] = useState<JourneyFormState>({
    currentStep: initialData?.destination ? 2 : 1, // Skip to step 2 if destination detected
    completedSteps: initialData?.destination ? [1] : [],
    data: initialData?.destination ? {
      step3: {
        destination: initialData.destination,
        origin: '',
        season: 'Winter',
        duration: '5-7',
        motivation: '',
        detectedFromImage: true,
        capturedImage: initialData.capturedImage
      }
    } : {},
    isValid: false
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [captchaPayload, setCaptchaPayload] = useState<string>('');
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);

  // Generate session ID for guest users
  const [sessionId] = useState(() => isGuest ? uuidv4() : undefined);

  const steps = [
    { number: 1, title: 'Travel Type', description: 'Who\'s traveling?' },
    { number: 2, title: 'Travelers', description: 'Tell us about your group' },
    { number: 3, title: 'Destination', description: 'Where & when?' },
    { number: 4, title: 'Preferences', description: 'Budget & style' },
    { number: 5, title: 'Security', description: 'Verify you\'re human' }
  ];

  // Update completed steps when data changes
  useEffect(() => {
    const completedSteps: number[] = [];
    
    if (formState.data.step1?.travelType) {
      if (formState.data.step1.travelType !== 'group' || formState.data.step1.groupSubType) {
        completedSteps.push(1);
      }
    }
    
    if (formState.data.step2 && formState.data.step1?.travelType) {
      const validation = validateStep2(formState.data.step2, formState.data.step1.travelType);
      if (validation.success) {
        completedSteps.push(2);
      }
    }
    
    if (formState.data.step3) {
      const validation = validateStep3(formState.data.step3);
      if (validation.success) {
        completedSteps.push(3);
      }
    }
    
    if (formState.data.step4) {
      const validation = validateStep4(formState.data.step4);
      if (validation.success) {
        completedSteps.push(4);
      }
    }

    setFormState(prev => ({
      ...prev,
      completedSteps,
      isValid: completedSteps.length === 4
    }));
  }, [formState.data]);

  const updateStep1 = (data: TravelTypeStep) => {
    setFormState(prev => ({
      ...prev,
      data: { ...prev.data, step1: data }
    }));
  };

  const updateStep2 = (data: TravelerDetailsStep) => {
    setFormState(prev => ({
      ...prev,
      data: { ...prev.data, step2: data }
    }));
  };

  const updateStep3 = (data: DestinationStep) => {
    setFormState(prev => ({
      ...prev,
      data: { ...prev.data, step3: data }
    }));
  };

  const updateStep4 = (data: PreferencesStep) => {
    setFormState(prev => ({
      ...prev,
      data: { ...prev.data, step4: data }
    }));
  };

  const goToStep = (step: number) => {
    if (step >= 1 && step <= 4) {
      setFormState(prev => ({ ...prev, currentStep: step as 1 | 2 | 3 | 4 }));
    }
  };

  const goNext = () => {
    if (formState.currentStep < 4 && isCurrentStepValid()) {
      setFormState(prev => ({ 
        ...prev, 
        currentStep: (prev.currentStep + 1) as 1 | 2 | 3 | 4 
      }));
    }
  };

  const goBack = () => {
    if (formState.currentStep > 1) {
      setFormState(prev => ({ 
        ...prev, 
        currentStep: (prev.currentStep - 1) as 1 | 2 | 3 | 4 
      }));
    }
  };

  const isCurrentStepValid = (): boolean => {
    return formState.completedSteps.includes(formState.currentStep);
  };

  const handleSubmit = async () => {
    if (!formState.isValid) return;

    setIsSubmitting(true);
    setErrors([]);

    try {
      // Combine all step data into final format
      const { step1, step2, step3, step4 } = formState.data;
      
      if (!step1 || !step2 || !step3 || !step4) {
        throw new Error('Missing form data');
      }

      const travelInput: TravelCaptureInput = {
        isGuest,
        sessionId,
        travelType: step1.travelType,
        groupSubType: step1.groupSubType,
        travelerDetails: step2,
        destination: step3.destination,
        origin: step3.origin,
        motivation: step3.motivation,
        season: step3.season,
        duration: step3.duration,
        budget: step4.budget,
        budgetPerPerson: step4.budgetPerPerson,
        dietary: step4.dietary,
        travelStyle: step4.travelStyle,
        specialRequirements: step4.specialRequirements,
      };

      // Final validation
      const validation = validateCompleteTravelInput(travelInput);
      if (!validation.success) {
        const errorMessages = validation.error?.issues?.map(issue => issue.message) || ['Validation failed'];
        setErrors(errorMessages);
        return;
      }

      // Submit to parent component with captcha payload
      await onComplete({
        ...travelInput,
        altcha: captchaPayload // Include captcha payload for verification
      } as any);
      
    } catch (error) {
      console.error('Form submission error:', error);
      setErrors([error instanceof Error ? error.message : 'An error occurred while submitting the form']);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderCurrentStep = () => {
    switch (formState.currentStep) {
      case 1:
        return (
          <TravelTypeSelection
            selectedTravelType={formState.data.step1?.travelType}
            selectedGroupSubType={formState.data.step1?.groupSubType}
            onTravelTypeChange={(type) => updateStep1({ ...(formState.data.step1 || {}), travelType: type })}
            onGroupSubTypeChange={(subType) => updateStep1({ ...(formState.data.step1 || { travelType: 'single' }), groupSubType: subType })}
          />
        );
      case 2:
        if (!formState.data.step1?.travelType) return null;
        return (
          <TravelerDetails
            travelType={formState.data.step1.travelType}
            data={formState.data.step2 || {}}
            onChange={updateStep2}
          />
        );
      case 3:
        return (
          <DestinationAndTiming
            data={formState.data.step3 || { destination: '', origin: '', motivation: '', season: 'Flexible', duration: 'Flexible' }}
            onChange={updateStep3}
          />
        );
      case 4:
        return (
          <PreferencesAndBudget
            data={formState.data.step4 || { budget: 'Comfortable', dietary: 'Flexible', travelStyle: 'Leisure' }}
            onChange={updateStep4}
            isGroupTravel={formState.data.step1?.travelType === 'group' || formState.data.step1?.travelType === 'family'}
          />
        );
      case 5:
        return (
          <CaptchaVerification
            onVerified={handleCaptchaVerified}
            isVerified={isCaptchaVerified}
          />
        );
      default:
        return null;
    }
  };

  const getProgressPercentage = () => {
    return (formState.completedSteps.length / 5) * 100;
  };

  const handleCaptchaVerified = (payload: string) => {
    setCaptchaPayload(payload);
    setIsCaptchaVerified(true);
    
    // Mark step 5 as completed
    setFormState(prev => ({
      ...prev,
      completedSteps: [...new Set([...prev.completedSteps, 5])],
      isValid: true // Final validation
    }));
  };

  return (
    <MobileContainer fullHeight className="bg-gradient-to-br from-blue-50 via-white to-purple-50" padding="none">
      {/* Progress Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <h1 className="text-lg font-semibold text-gray-900">Create Travel Card</h1>
              <span className="text-sm text-gray-500">
                Step {formState.currentStep} of 5
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${getProgressPercentage()}%` }}
              />
            </div>
          </div>

          {/* Step Navigation */}
          <div className="flex justify-between items-center">
            {steps.map((step, index) => (
              <div
                key={step.number}
                className={`flex-1 ${index < steps.length - 1 ? 'pr-4' : ''}`}
              >
                <button
                  onClick={() => formState.completedSteps.includes(step.number) && goToStep(step.number)}
                  disabled={!formState.completedSteps.includes(step.number) && step.number !== formState.currentStep}
                  className={`w-full text-left ${
                    formState.completedSteps.includes(step.number) 
                      ? 'cursor-pointer hover:bg-gray-50' 
                      : step.number === formState.currentStep 
                        ? 'cursor-default' 
                        : 'cursor-not-allowed opacity-50'
                  } p-2 rounded-lg transition-colors`}
                >
                  <div className="flex items-center space-x-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                      formState.completedSteps.includes(step.number)
                        ? 'bg-green-100 text-green-800'
                        : step.number === formState.currentStep
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-400'
                    }`}>
                      {formState.completedSteps.includes(step.number) ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        step.number
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-medium truncate ${
                        step.number === formState.currentStep ? 'text-blue-900' : 'text-gray-700'
                      }`}>
                        {step.title}
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card className="p-8">
          {renderCurrentStep()}

          {/* Error Display */}
          {errors.length > 0 && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="text-sm font-medium text-red-800">Please fix the following errors:</h3>
              <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200 gap-4">
            <TouchButton
              variant="outline"
              onClick={goBack}
              disabled={formState.currentStep === 1 || isSubmitting}
              className="flex items-center space-x-2 min-w-[100px]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </TouchButton>

            {formState.currentStep < 5 ? (
              <TouchButton
                variant="primary"
                onClick={goNext}
                disabled={!isCurrentStepValid() || isSubmitting}
                className="flex items-center space-x-2 min-w-[100px]"
              >
                <span>Next</span>
                <ArrowRight className="w-4 h-4" />
              </TouchButton>
            ) : (
              <TouchButton
                variant="primary"
                onClick={handleSubmit}
                disabled={!formState.isValid || isSubmitting}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 active:bg-green-800 min-w-[140px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Create Travel Card</span>
                  </>
                )}
              </TouchButton>
            )}
          </div>

          {/* Guest Mode Notice */}
          {isGuest && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                💡 <strong>Guest Mode:</strong> Your travel card will be available for 7 days. 
                Create an account to save it permanently and access additional features.
              </p>
            </div>
          )}
        </Card>
      </div>
    </MobileContainer>
  );
}