"use client";
import React, { useRef } from "react";
import { Autocomplete, Libraries, useLoadScript } from "@react-google-maps/api";

interface AddressComponents {
  street?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country_code?: string;
  building_number?: string;
  address?: string;
}

interface AddressAutocompleteProps {
  label?: string;
  value?: string;
  onChange?: (value: string) => void;
  onAddressSelect?: (components: AddressComponents) => void;
  error?: string | false;
  touched?: boolean;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
}

const libraries: Libraries = ["places"];

const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  label,
  value = "",
  onChange,
  onAddressSelect,
  error,
  touched,
  placeholder = "Start typing address...",
  disabled = false,
  required = false,
}) => {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API || "",
    libraries,
  });

  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const handlePlaceChanged = () => {
    const place = autocompleteRef.current?.getPlace();
    if (!place || !place.address_components) return;

    const components: AddressComponents = {};

    for (const component of place.address_components) {
      const types = component.types;
      if (types.includes("street_number"))
        components.building_number = component.long_name;
      if (types.includes("route")) components.street = component.long_name;
      if (types.includes("administrative_area_level_2"))
        components.city = component.long_name;
      if (types.includes("administrative_area_level_1"))
        components.state = component.long_name;
      if (types.includes("postal_code"))
        components.zip_code = component.long_name;
      if (types.includes("country"))
        components.country_code = component.short_name;
    }

    const fullAddress = place.formatted_address ?? "";

    // Notify parent about full address
    onChange?.(fullAddress);
    // Notify parent about structured address parts
    onAddressSelect?.({ ...components, address: fullAddress });
  };

  if (!isLoaded) return <div>Loading...</div>;

  return (
    <div className="flex flex-col gap-1 w-full">
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <Autocomplete
        onLoad={(autocomplete) => (autocompleteRef.current = autocomplete)}
        onPlaceChanged={handlePlaceChanged}
      >
        <input
          type="text"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full p-[15px] h-[50px] text-sm text-raiz-gray-950 border bg-raiz-gray-100 focus:bg-white focus:border-raiz-gray-600 active:border-raiz-gray-600 outline-none rounded-lg leading-tight placeholder:text-raiz-gray-400 placeholder:text-sm border-raiz-gray-100 ${
            touched && error ? "border-red-500" : ""
          }`}
        />
      </Autocomplete>
      {touched && error && <p className="text-red-500 text-xs">{error}</p>}
    </div>
  );
};

export default AddressAutocomplete;
