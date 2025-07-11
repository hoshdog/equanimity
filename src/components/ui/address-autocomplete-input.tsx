
'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { APIProvider, useMapsLibrary } from '@vis.gl/react-google-maps';

interface AddressAutocompleteInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onSelect'> {
  onPlaceSelect: (place: google.maps.places.PlaceResult | null) => void;
  searchType?: 'address' | 'establishment';
}

function AutocompleteInput({ onPlaceSelect, searchType = 'address', ...props }: AddressAutocompleteInputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = React.useState(props.value || '');
  const places = useMapsLibrary('places');
  const [autocomplete, setAutocomplete] =
    React.useState<google.maps.places.Autocomplete | null>(null);

  React.useEffect(() => {
    if (!places || !inputRef.current) return;

    const ac = new places.Autocomplete(inputRef.current, {
        componentRestrictions: { country: "au" },
        types: [searchType],
        fields: ['formatted_address', 'geometry', 'name'],
    });
    setAutocomplete(ac);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [places, searchType]);

  React.useEffect(() => {
    if (!autocomplete) return;

    const listener = autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      onPlaceSelect(place);
      if (place) {
        setInputValue(place.formatted_address || place.name || '');
      }
    });

    return () => {
      listener.remove();
    };
  }, [autocomplete, onPlaceSelect]);


  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
    if (props.onChange) {
        props.onChange(event);
    }
  };
  
  React.useEffect(() => {
    if (props.value !== inputValue) {
        setInputValue(props.value as string || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.value]);


  return (
    <Input
      {...props}
      ref={inputRef}
      value={inputValue}
      onChange={handleInputChange}
    />
  );
}

export function AddressAutocompleteInput({ ...rest }: AddressAutocompleteInputProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const [apiError, setApiError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const originalError = window.console.error;
    const newError = (...args: any[]) => {
      if (typeof args[0] === 'string' && args[0].includes('ApiNotActivatedMapError')) {
        setApiError('Places API not enabled. Please enable it in Google Cloud Console.');
      }
      originalError.apply(console, args);
    };
    window.console.error = newError;
    return () => {
        window.console.error = originalError;
    };
  }, []);

  if (apiError) {
      return (
        <Input 
            {...rest}
            disabled 
            placeholder={apiError}
            value={rest.value || ''}
        />
    );
  }

  if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
    if (process.env.NODE_ENV !== "production") {
        // This console error is for the developer and is expected if the key is missing.
        // It won't be shown in the browser console in production.
    }
    return (
        <Input 
            {...rest} 
            disabled 
            placeholder="Google Maps API Key is missing"
            value={rest.value || ''}
        />
    );
  }

  return (
    <APIProvider apiKey={apiKey} libraries={['places']}>
      <AutocompleteInput {...rest} />
    </APIProvider>
  );
}
