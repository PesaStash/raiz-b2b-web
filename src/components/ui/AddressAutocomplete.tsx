"use client";
import React, { useCallback, useEffect, useRef } from "react";
import { Autocomplete, Libraries, useLoadScript } from "@react-google-maps/api";

export interface AddressComponents {
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

export function parsePlace(
  place: google.maps.places.PlaceResult,
): AddressComponents | null {
  if (!place.address_components) return null;

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
  return { ...components, address: fullAddress };
}

function getPlaceDetails(
  placeId: string,
): Promise<google.maps.places.PlaceResult | null> {
  return new Promise((resolve) => {
    const service = new google.maps.places.PlacesService(
      document.createElement("div"),
    );
    service.getDetails(
      {
        placeId,
        fields: ["address_components", "formatted_address"],
      },
      (place, status) => {
        if (status !== google.maps.places.PlacesServiceStatus.OK || !place) {
          resolve(null);
          return;
        }
        resolve(place);
      },
    );
  });
}

function getPlacePredictions(
  input: string,
): Promise<google.maps.places.AutocompletePrediction[]> {
  return new Promise((resolve) => {
    const service = new google.maps.places.AutocompleteService();
    service.getPlacePredictions({ input }, (predictions, status) => {
      if (
        status !== google.maps.places.PlacesServiceStatus.OK ||
        !predictions?.length
      ) {
        resolve([]);
        return;
      }
      resolve(predictions);
    });
  });
}

/** Resolve a free-text address into structured parts via Places Autocomplete + Details. */
export function usePlaceResolver() {
  const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API || "";
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: mapsApiKey,
    libraries,
  });

  const resolve = useCallback(
    async (text: string): Promise<AddressComponents | null> => {
      const query = text.trim();
      if (!mapsApiKey || !isLoaded || !query) return null;
      if (typeof google === "undefined" || !google.maps?.places) return null;

      try {
        const predictions = await getPlacePredictions(query);
        const placeId = predictions[0]?.place_id;
        if (!placeId) return null;
        const place = await getPlaceDetails(placeId);
        if (!place) return null;
        return parsePlace(place);
      } catch {
        return null;
      }
    },
    [isLoaded, mapsApiKey],
  );

  return { resolve, isLoaded: !!mapsApiKey && isLoaded };
}

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
    if (!place) return;
    const components = parsePlace(place);
    if (!components) return;

    onChange?.(components.address ?? "");
    onAddressSelect?.(components);
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
