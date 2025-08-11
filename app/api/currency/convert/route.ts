import { NextRequest, NextResponse } from 'next/server';
import { currencyAPI } from '@/lib/api/currency';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, from, to } = body;

    if (!amount || !from || !to) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required parameters: amount, from, to' 
        },
        { status: 400 }
      );
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid amount. Must be a positive number.' 
        },
        { status: 400 }
      );
    }

    console.log(`Converting ${numAmount} ${from} to ${to}`);

    const conversion = await currencyAPI.convertCurrency(numAmount, from, to);

    return NextResponse.json({
      success: true,
      conversion,
      formatted: {
        original: currencyAPI.formatCurrency(conversion.amount, conversion.fromCurrency),
        converted: currencyAPI.formatCurrency(conversion.convertedAmount, conversion.toCurrency)
      }
    });

  } catch (error) {
    console.error('Currency conversion error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to convert currency',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const amount = searchParams.get('amount');

  if (!amount || !from || !to) {
    return NextResponse.json({
      success: false,
      error: 'Query parameters required: amount, from, to',
      example: '/api/currency/convert?amount=100&from=USD&to=INR'
    }, { status: 400 });
  }

  try {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid amount. Must be a positive number.' 
        },
        { status: 400 }
      );
    }

    const conversion = await currencyAPI.convertCurrency(numAmount, from, to);

    return NextResponse.json({
      success: true,
      conversion,
      formatted: {
        original: currencyAPI.formatCurrency(conversion.amount, conversion.fromCurrency),
        converted: currencyAPI.formatCurrency(conversion.convertedAmount, conversion.toCurrency)
      }
    });

  } catch (error) {
    console.error('Currency conversion error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to convert currency',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}