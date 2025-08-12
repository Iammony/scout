'use client';

import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface CaptchaVerificationProps {
  onVerified: (payload: string) => void;
  isVerified: boolean;
  className?: string;
}

interface MathProblem {
  question: string;
  answer: number;
}

export default function CaptchaVerification({ 
  onVerified, 
  isVerified, 
  className = '' 
}: CaptchaVerificationProps) {
  const [mathProblem, setMathProblem] = useState<MathProblem | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);

  // Generate a new math problem
  const generateMathProblem = () => {
    const operations = ['+', '-', '*'];
    const operation = operations[Math.floor(Math.random() * operations.length)];
    let num1: number, num2: number, answer: number, question: string;

    switch (operation) {
      case '+':
        num1 = Math.floor(Math.random() * 50) + 1;
        num2 = Math.floor(Math.random() * 50) + 1;
        answer = num1 + num2;
        question = `${num1} + ${num2}`;
        break;
      case '-':
        num1 = Math.floor(Math.random() * 50) + 20;
        num2 = Math.floor(Math.random() * num1);
        answer = num1 - num2;
        question = `${num1} - ${num2}`;
        break;
      case '*':
        num1 = Math.floor(Math.random() * 12) + 1;
        num2 = Math.floor(Math.random() * 12) + 1;
        answer = num1 * num2;
        question = `${num1} × ${num2}`;
        break;
      default:
        num1 = Math.floor(Math.random() * 50) + 1;
        num2 = Math.floor(Math.random() * 50) + 1;
        answer = num1 + num2;
        question = `${num1} + ${num2}`;
    }

    setMathProblem({ question, answer });
    setUserAnswer('');
    setError('');
  };

  // Generate initial problem on mount
  useEffect(() => {
    if (!isVerified) {
      generateMathProblem();
    }
  }, [isVerified]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!mathProblem) return;

    const userAnswerNum = parseInt(userAnswer.trim());
    
    if (isNaN(userAnswerNum)) {
      setError('Please enter a valid number');
      return;
    }

    if (userAnswerNum === mathProblem.answer) {
      onVerified('math-captcha-verified');
      setError('');
    } else {
      setAttempts(attempts + 1);
      setError('Incorrect answer. Please try again.');
      
      // Generate new problem after 3 failed attempts
      if (attempts >= 2) {
        generateMathProblem();
        setAttempts(0);
        setError('New problem generated. Please try again.');
      }
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-gradient-to-br from-web3-violet-500 to-web3-purple-500 rounded-full flex items-center justify-center mx-auto shadow-neon">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-xl font-semibold bg-gradient-to-r from-web3-violet-600 to-web3-purple-600 dark:from-web3-violet-400 dark:to-web3-pink-400 bg-clip-text text-transparent">Security Verification</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Solve the math problem to verify you&apos;re human
        </p>
      </div>

      {/* Verification Card */}
      <Card className="p-6 glass dark:glass-dark border-web3-violet-200 dark:border-web3-violet-800/30 shadow-web3">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-web3-violet-600 dark:text-web3-violet-400" />
              <h3 className="font-medium text-gray-900 dark:text-white">Math Verification</h3>
            </div>
            {!isVerified && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={generateMathProblem}
                className="text-web3-violet-600 dark:text-web3-violet-400 hover:text-web3-violet-700 dark:hover:text-web3-violet-300"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                New Problem
              </Button>
            )}
          </div>

          {/* Math Problem */}
          {!isVerified && mathProblem && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="text-center">
                <div className="bg-gradient-to-r from-web3-violet-50 to-web3-purple-50 dark:from-web3-violet-900/20 dark:to-web3-purple-900/20 rounded-xl p-6 border border-web3-violet-200 dark:border-web3-violet-800/30">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    What is {mathProblem.question} = ?
                  </p>
                  <div className="flex items-center space-x-3 max-w-xs mx-auto">
                    <Input
                      type="number"
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      placeholder="Your answer"
                      className="text-center text-lg font-semibold"
                      autoFocus
                      required
                    />
                    <Button 
                      type="submit"
                      className="bg-gradient-to-r from-web3-violet-500 to-web3-purple-500 hover:from-web3-violet-600 hover:to-web3-purple-600 text-white shadow-web3"
                    >
                      Verify
                    </Button>
                  </div>
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl p-3">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                    <span className="text-sm text-red-800 dark:text-red-300">{error}</span>
                  </div>
                </div>
              )}

              {/* Attempts indicator */}
              {attempts > 0 && attempts < 3 && (
                <div className="text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Attempt {attempts + 1} of 3
                  </p>
                </div>
              )}
            </form>
          )}

          {/* Success Display */}
          {isVerified && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-xl p-3">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-sm text-green-800 dark:text-green-300">
                  ✓ Verification completed successfully
                </span>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Info */}
      <div className="text-center">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          This simple math verification helps prevent automated requests
        </p>
      </div>
    </div>
  );
}