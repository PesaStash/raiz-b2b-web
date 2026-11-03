"use client";
import React, { useEffect, useRef } from "react";
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

/** Places draws `.pac-container` on document.body, which sits under a modal dialog. */
function keepSuggestionsInDialog(root: HTMLElement) {
  const input = root.querySelector("input");
  const dialog = root.closest("dialog");
  if (!input || !dialog) return () => {};

  let frame = 0;
  let stopTimer = 0;
  let running = false;
  const align = () => {
    const rect = input.getBoundingClientRect();
    document.querySelectorAll(".pac-container").forEach((node) => {
      if (!(node instanceof HTMLElement)) return;
      if (node.parentElement !== dialog) dialog.appendChild(node);
      node.style.setProperty("position", "fixed", "important");
      node.style.top = `${rect.bottom}px`;
      node.style.left = `${rect.left}px`;
      node.style.width = `${rect.width}px`;
      node.style.zIndex = "10000";
    });
  };
  const tick = () => {
    align();
    if (running) frame = requestAnimationFrame(tick);
  };
  const start = () => {
    window.clearTimeout(stopTimer);
    if (running) return;
    running = true;
    frame = requestAnimationFrame(tick);
  };
  const stop = () => {
    running = false;
    cancelAnimationFrame(frame);
  };
  const scheduleStop = () => {
    window.clearTimeout(stopTimer);
    stopTimer = window.setTimeout(stop, 250);
  };
  const observer = new MutationObserver(align);
  observer.observe(document.body, { childList: true });
  input.addEventListener("focus", start);
  input.addEventListener("blur", scheduleStop);
  if (document.activeElement === input) start();

  return () => {
    window.clearTimeout(stopTimer);
    stop();
    observer.disconnect();
    input.removeEventListener("focus", start);
    input.removeEventListener("blur", scheduleStop);
  };
}

const AddressAutocompleteWithMaps: React.FC<AddressAutocompleteProps> = ({
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
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!isLoaded || !root) return;
    return keepSuggestionsInDialog(root);
  }, [isLoaded]);

  const handlePlaceChanged = () => {
    const place = autocompleteRef.current?.getPlace();
    if (!place || !place.address_components) return;

    const components: AddressComponents = {};
    let city = "";
    let cityRank = 0;
    const cityRankFor = (types: string[]) => {
      if (types.includes("locality")) return 3;
      if (types.includes("postal_town")) return 2;
      if (types.includes("administrative_area_level_2")) return 1;
      return 0;
    };

    for (const component of place.address_components) {
      const types = component.types;
      if (types.includes("street_number"))
        components.building_number = component.long_name;
      if (types.includes("route")) components.street = component.long_name;
      const rank = cityRankFor(types);
      if (rank > cityRank) {
        city = component.long_name;
        cityRank = rank;
      }
      if (types.includes("administrative_area_level_1"))
        components.state = component.long_name;
      if (types.includes("postal_code"))
        components.zip_code = component.long_name;
      if (types.includes("country"))
        components.country_code = component.short_name;
    }

    if (city) components.city = city;

    const fullAddress = place.formatted_address ?? "";

    // Notify parent about full address
    onChange?.(fullAddress);
    // Notify parent about structured address parts
    onAddressSelect?.({ ...components, address: fullAddress });
  };

  if (!isLoaded) return <div>Loading...</div>;

  return (
    <div ref={rootRef} className="flex flex-col gap-1 w-full">
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

const AddressAutocomplete: React.FC<AddressAutocompleteProps> = (props) => {
  const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API;

  // Fail closed: don't attempt to load Places with a missing API key.
  if (!mapsApiKey) {
    const {
      label,
      value = "",
      onChange,
      error,
      touched,
      required = false,
    } = props;

    return (
      <div className="flex flex-col gap-1 w-full">
        {label && (
          <label className="text-sm font-medium text-gray-700">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
        )}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder="Address search unavailable"
          disabled
          className={`w-full p-[15px] h-[50px] text-sm text-raiz-gray-950 border bg-raiz-gray-100 cursor-not-allowed outline-none rounded-lg leading-tight placeholder:text-raiz-gray-400 placeholder:text-sm border-raiz-gray-100 ${
            touched && error ? "border-red-500" : ""
          }`}
        />
        {touched && error && <p className="text-red-500 text-xs">{error}</p>}
      </div>
    );
  }

  return <AddressAutocompleteWithMaps {...props} />;
};

export default AddressAutocomplete;
