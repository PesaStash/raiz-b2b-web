"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
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
  diagnostics: string[] = [],
): Promise<google.maps.places.PlaceResult | null> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      diagnostics.push("Place details timed out");
      resolve(null);
    }, 8000);
    const service = new google.maps.places.PlacesService(
      document.createElement("div"),
    );
    service.getDetails(
      {
        placeId,
        fields: ["address_components", "formatted_address"],
      },
      (place, status) => {
        clearTimeout(timeout);
        if (status !== google.maps.places.PlacesServiceStatus.OK || !place) {
          diagnostics.push(`Place details: ${status}`);
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
  country?: string,
  diagnostics: string[] = [],
): Promise<google.maps.places.AutocompletePrediction[]> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      diagnostics.push("Address suggestions timed out");
      resolve([]);
    }, 8000);
    const service = new google.maps.places.AutocompleteService();
    service.getPlacePredictions(
      { input, ...(country ? { componentRestrictions: { country } } : {}) },
      (predictions, status) => {
        clearTimeout(timeout);
        if (
          status !== google.maps.places.PlacesServiceStatus.OK ||
          !predictions?.length
        ) {
          diagnostics.push(`Address suggestions: ${status}`);
          resolve([]);
          return;
        }
        resolve(predictions);
      },
    );
  });
}

/** Resolve registry text without requiring a user to select a prediction. */
export async function resolveRegistryAddress(
  text: string,
  country?: string,
  diagnostics: string[] = [],
): Promise<AddressComponents | null> {
  const parts = text
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  const query = parts
    .filter(
      (part, index) =>
        parts.findIndex(
          (other) => other.toLowerCase() === part.toLowerCase(),
        ) === index,
    )
    .join(", ");
  if (!query || typeof google === "undefined" || !google.maps?.places)
    return null;
  const matchesCountry = (value: AddressComponents | null) =>
    value &&
    (!country || value.country_code?.toUpperCase() === country.toUpperCase());
  let parsed: AddressComponents | null = null;
  let placeId: string | undefined;
  const complete = (value: AddressComponents | null) =>
    value?.street && value.city && value.state && value.zip_code;
  const expectedNumber = parts[0]?.match(/^\d+[a-z]?\b/i)?.[0].toLowerCase();
  const matchesAddress = (value: AddressComponents | null) =>
    matchesCountry(value) &&
    !!value?.street &&
    (!expectedNumber ||
      value?.building_number?.toLowerCase() === expectedNumber);
  const seen = new Set<string>();
  // The visible widget searches freely. Try its search behaviour too, but validate
  // the returned country and house number before applying any result.
  const searches = [
    { query, country },
    { query, country: undefined },
  ];
  const shortQuery = parts
    .filter((part) => part.toUpperCase() !== country?.toUpperCase())
    .filter((part, index, all) => all.indexOf(part) === index)
    .join(", ");
  if (shortQuery !== query)
    searches.push({ query: shortQuery, country: undefined });
  for (const search of searches) {
    try {
      const predictions = await getPlacePredictions(
        search.query,
        search.country,
        diagnostics,
      );
      for (const prediction of predictions.slice(0, 3)) {
        if (seen.has(prediction.place_id)) continue;
        seen.add(prediction.place_id);
        const place = await getPlaceDetails(prediction.place_id, diagnostics);
        const candidate = place ? parsePlace(place) : null;
        if (!matchesAddress(candidate)) continue;
        if (
          !parsed ||
          Object.values(candidate!).filter(Boolean).length >
            Object.values(parsed).filter(Boolean).length
        ) {
          parsed = candidate;
          placeId = prediction.place_id;
        }
        if (complete(parsed)) return parsed;
      }
      if (parsed) break;
      if (
        diagnostics.some((message) =>
          /REQUEST_DENIED|OVER_QUERY_LIMIT/.test(message),
        )
      )
        break;
    } catch (error) {
      diagnostics.push(
        error instanceof Error ? error.message : "Address search failed",
      );
    }
  }
  try {
    const geocoded = await new Promise<google.maps.GeocoderResult | null>(
      (done) => {
        new google.maps.Geocoder().geocode(
          placeId
            ? { placeId }
            : {
                address: query,
                ...(country ? { componentRestrictions: { country } } : {}),
              },
          (results, status) =>
            done(
              status === "OK"
                ? (results?.find(
                    (result) =>
                      !result.partial_match &&
                      ["street_address", "premise", "subpremise"].some((type) =>
                        result.types.includes(type),
                      ),
                  ) ?? null)
                : null,
            ),
        );
      },
    );
    const extra = geocoded ? parsePlace(geocoded) : null;
    if (matchesAddress(extra)) {
      return {
        street: parsed?.street || extra?.street,
        building_number: parsed?.building_number || extra?.building_number,
        city: parsed?.city || extra?.city,
        state: parsed?.state || extra?.state,
        zip_code: parsed?.zip_code || extra?.zip_code,
        country_code: parsed?.country_code || extra?.country_code,
        address: parsed?.address || extra?.address,
      };
    }
  } catch {
    /* Keep any usable Places components; never invent missing values. */
  }
  return parsed;
}

export function usePlaceResolver() {
  const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API || "";
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: mapsApiKey,
    libraries,
  });
  const [resolutionError, setResolutionError] = useState<string | null>(null);
  const loader = useRef({ isLoaded, loadError });
  useEffect(() => {
    loader.current = { isLoaded, loadError };
  }, [isLoaded, loadError]);
  const resolve = useCallback(
    async (
      text: string,
      country?: string,
    ): Promise<AddressComponents | null> => {
      if (!mapsApiKey || !text.trim()) return null;
      // A quick confirmation click must not skip resolution while the script is loading.
      const deadline = Date.now() + 10000;
      while (
        !loader.current.isLoaded &&
        !loader.current.loadError &&
        Date.now() < deadline
      ) {
        await new Promise((done) => setTimeout(done, 100));
      }
      if (!loader.current.isLoaded || loader.current.loadError) return null;
      setResolutionError(null);
      const diagnostics: string[] = [];
      let timeout: ReturnType<typeof setTimeout> | undefined;
      try {
        const result = await Promise.race([
          resolveRegistryAddress(text, country, diagnostics),
          new Promise<null>((done) => {
            timeout = setTimeout(() => {
              diagnostics.push("Address lookup timed out");
              done(null);
            }, 30000);
          }),
        ]);
        if (!result) {
          console.warn("Automatic address resolution failed", diagnostics);
          setResolutionError(
            diagnostics.some((message) => message.includes("REQUEST_DENIED"))
              ? "Google denied automatic address lookup. Contact support to check address-service access."
              : "Google could not match this address automatically.",
          );
        }
        return result;
      } finally {
        if (timeout) clearTimeout(timeout);
      }
    },
    [mapsApiKey],
  );
  return {
    resolve,
    resolutionError,
    isLoaded: !!mapsApiKey && isLoaded,
    error: !mapsApiKey
      ? "Address lookup is not configured."
      : loadError
        ? "Google address lookup could not load."
        : null,
  };
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
