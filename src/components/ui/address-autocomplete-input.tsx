
'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { APIProvider, useMapsLibrary } from '@vis.gl/react-google-maps';
import { useToast } from '@/hooks/use-toast';

interface AddressAutocompleteInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onPlaceSelect: (place: google.maps.places.PlaceResult | null) => void;
}

function AutocompleteInput({ onPlaceSelect, ...props }: AddressAutocompleteInputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = React.useState('');
  const places = useMapsLibrary('places');
  const [autocomplete, setAutocomplete] =
    React.useState<google.maps.places.Autocomplete | null>(null);

  React.useEffect(() => {
    if (!places || !inputRef.current) return;

    const ac = new places.Autocomplete(inputRef.current, {
        componentRestrictions: { country: "au" },
        types: ["address"],
        fields: ['formatted_address', 'geometry', 'name'],
    });
    setAutocomplete(ac);
  }, [places]);

  React.useEffect(() => {
    if (!autocomplete) return;

    const listener = autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      onPlaceSelect(place);
      if (place) {
        setInputValue(place.formatted_address || '');
      }
    });

    return () => {
      listener.remove();
    };
  }, [autocomplete, onPlaceSelect]);


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
