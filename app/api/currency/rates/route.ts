import { NextRequest, NextResponse } from 'next/server';
import { currencyAPI } from '@/lib/api/currency';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  try {
    if (from && to) {
      // Get specific exchange rate
      const rate = await currencyAPI.getExchangeRate(from, to);
      
      if (!rate) {
        return NextResponse.json(
          { 
            success: false, 
            error: `Unable to get exchange rate for ${from} -> ${to}` 
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        rate,
        formatted: `1 ${rate.from} = ${rate.rate} ${rate.to}`
      });
    }

    // Return popular currencies and rates
    const popularCurrencies = currencyAPI.getPopularCurrencies();
    
    // Get rates for popular currencies against INR
    const ratePromises = popularCurrencies
      .filter(curr => curr.code !== 'INR')
      .map(async (curr) => {
        try {
          const rate = await currencyAPI.getExchangeRate(curr.code, 'INR');
          return rate;
        } catch {
          return null;
        }
      });

    const rates = (await Promise.all(ratePromises)).filter(Boolean);

    return NextResponse.json({
      success: true,
      currencies: popularCurrencies,
      rates,
      baseCurrency: 'INR',
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Exchange rates error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get exchange rates',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}