import { NextRequest, NextResponse } from 'next/server';
import { generateAltchaChallenge } from '@/lib/captcha/altcha';

export async function GET(request: NextRequest) {
  try {
    const challenge = await generateAltchaChallenge();
    
    return NextResponse.json({
      success: true,
      challenge,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Challenge generation error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate captcha challenge',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}