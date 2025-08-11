import { NextRequest, NextResponse } from 'next/server';
import { verifyAltchaSolution } from '@/lib/captcha/altcha';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { altcha } = body;

    if (!altcha) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing captcha solution',
        },
        { status: 400 }
      );
    }

    const isValid = await verifyAltchaSolution(altcha);

    return NextResponse.json({
      success: true,
      verified: isValid,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Captcha verification error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to verify captcha',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}