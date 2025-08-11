#\!/bin/bash

# Create stub files for remaining card components
cards=(
  "TransportCardView"
  "AccommodationCardView"
  "AttractionsCardView"
  "DiningCardView"
  "VisaCardView"
  "WeatherCardView"
  "CultureCardView"
  "EmergencyCardView"
  "ShoppingCardView"
)

for card in "${cards[@]}"; do
  cat > "${card}.tsx" << STUB
'use client';

import React from 'react';

export default function ${card}({ card, isFullscreen }: any) {
  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4">{card.title}</h3>
      <p className="text-gray-600">
        {card.subtitle || 'Content for this card will be displayed here'}
      </p>
      <pre className="mt-4 text-xs bg-gray-50 p-2 rounded overflow-auto">
        {JSON.stringify(card.content, null, 2)}
      </pre>
    </div>
  );
}
STUB
done

echo "Created stub files for all card components"
