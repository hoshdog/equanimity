
'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { APIProvider, useAutocomplete } from '@vis.gl/react-google-maps';
import { useToast } from '@/hooks/use-toast';

interface AddressAutocompleteInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onPlaceSelect: (place: google.maps.places.PlaceResult | null) => void;
}

function AutocompleteInput({ onPlaceSelect, ...props }: AddressAutocompleteInputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = React.useState('');

  const onPlaceChanged = (place: google.maps.places.PlaceResult | null) => {
    onPlaceSelect(place);
    if (place) {
      setInputValue(place.formatted_address || '');
    }
  };

  useAutocomplete({
    inputField: inputRef && inputRef.current,
    onPlaceChanged,
    options: {
        componentRestrictions: { country: "au" }, // Restrict to Australia
        types: ["address"],
    }
  });

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  return (
    <Input
      {...props}
      ref={inputRef}
      value={inputValue}
      onChange={handleInputChange}
    />
  );
}

export function AddressAutocompleteInput(props: AddressAutocompleteInputProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const { toast } = useToast();

  if (!apiKey) {
    if (process.env.NODE_ENV !== "production") {
        console.error("Google Maps API key is missing. Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your .env.local file.");
    }
    return (
        <Input 
            {...props} 
            disabled 
            placeholder="Google Maps API Key is missing"
        />
    );
  }

  return (
    <APIProvider apiKey={apiKey} libraries={['places']}>
      <AutocompleteInput {...props} />
    </APIProvider>
  );
}
