import '@geoapify/geocoder-autocomplete/styles/minimal-dark.css';
import {
  GeoapifyContext,
  GeoapifyGeocoderAutocomplete,
} from '@geoapify/react-geocoder-autocomplete';

type LocationProps = {
  locationHandler: (location: string) => void
  value: string
}

type GeoapifyFeature = {
  properties?: {
    formatted?: string
  }
}

export default function Location({ locationHandler, value }: LocationProps) {
  const API_KEY = import.meta.env.VITE_GEOAPIFY_API_KEY;

  function onLocationSelect(feature: GeoapifyFeature) {
    const formattedLocation = feature?.properties?.formatted

    if (!formattedLocation) return

    locationHandler(formattedLocation)
    console.log('selected: ', formattedLocation)
  }

  return (
    <GeoapifyContext apiKey={API_KEY}>
        <div className="geoapify-tailwind">
          <GeoapifyGeocoderAutocomplete
            value={value}
            placeSelect={onLocationSelect}
          />
          </div>
    </GeoapifyContext>
  )
}
