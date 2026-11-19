
import { useEffect, useRef, useState } from "react";
import { MapPin, Loader2, X } from "lucide-react";

function LocationAutocomplete({
  id,
  value,
  onChange,
  placeholder = "Search a location...",
  required = false,
  maxLength = 100,
  className = "",
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState("");

  const wrapperRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    const query = value?.trim();

    if (!query || query.length < 3) {
      setSuggestions([]);
      setLoading(false);
      setError("");
      return;
    }

    const timer = setTimeout(async () => {
      try {
        abortRef.current?.abort();

        const controller = new AbortController();
        abortRef.current = controller;

        setLoading(true);
        setError("");

        const params = new URLSearchParams({
          q: query,
          limit: "6",
          lang: "en",
          countrycode: "in",
        });

        const response = await fetch(
          `https://photon.komoot.io/api/?${params.toString()}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error("Location search failed.");
        }

        const data = await response.json();

        setSuggestions(data.features || []);
        setShowSuggestions(true);
      } catch (err) {
        if (err.name !== "AbortError") {
          setSuggestions([]);
          setError("Location search is temporarily unavailable.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 500);

    return () => {
      clearTimeout(timer);
      abortRef.current?.abort();
    };
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const formatLocation = (properties = {}) => {
    return [
      properties.name,
      properties.street,
      properties.district,
      properties.city,
      properties.state,
      properties.country,
    ]
      .filter((item, index, array) => item && array.indexOf(item) === index)
      .join(", ");
  };

  const selectLocation = (feature) => {
    const location = formatLocation(feature.properties);

    if (!location) return;

    onChange(location);
    setSuggestions([]);
    setShowSuggestions(false);
    setError("");
  };

  const clearLocation = () => {
    onChange("");
    setSuggestions([]);
    setShowSuggestions(false);
    setError("");
  };

  return (
    <div className="relative z-20 w-full" ref={wrapperRef}>
      <div className="relative">
        <input
          id={id}
          type="text"
          value={value || ""}
          required={required}
          maxLength={maxLength}
          placeholder={placeholder}
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={showSuggestions && suggestions.length > 0}
          onChange={(e) => {
            onChange(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => {
            if (value?.trim().length >= 3) {
              setShowSuggestions(true);
            }
          }}
          className={
            className ||
            "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pr-12 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          }
        />

        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
          ) : value ? (
            <button
              type="button"
              onClick={clearLocation}
              aria-label="Clear location"
              className="text-slate-400 hover:text-red-500"
            >
              <X size={19} />
            </button>
          ) : (
            <MapPin className="h-5 w-5 text-slate-400" />
          )}
        </div>
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-full z-[100] mt-2 max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl"
        >
          {suggestions.map((feature, index) => {
            const location = formatLocation(feature.properties);

            return (
              <button
                key={`${feature.properties.osm_type}-${feature.properties.osm_id}-${index}`}
                type="button"
                role="option"
                aria-selected="false"
                onClick={() => selectLocation(feature)}
                className="flex w-full items-start gap-3 border-b border-slate-100 px-4 py-3 text-left transition last:border-0 hover:bg-emerald-50"
              >
                <MapPin className="mt-1 h-5 w-5 shrink-0 text-emerald-600" />

                <span className="text-sm text-slate-700">
                  {location}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {showSuggestions &&
        !loading &&
        value?.trim().length >= 3 &&
        suggestions.length === 0 &&
        !error && (
          <div className="absolute left-0 right-0 top-full z-[100] mt-2 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500 shadow-lg">
            No matching locations found.
          </div>
        )}

      {error && (
        <p className="mt-2 text-sm text-red-500" role="status">
          {error}
        </p>
      )}
    </div>
  );
}

export default LocationAutocomplete;
