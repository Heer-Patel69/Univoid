import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X, Filter, MapPin } from "lucide-react";
import { INDIAN_STATES, getCitiesForState } from "@/constants/indianLocations";

interface EventFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  category: string;
  onCategoryChange: (value: string) => void;
  priceFilter: string;
  onPriceFilterChange: (value: string) => void;
  state?: string;
  onStateChange?: (value: string) => void;
  city?: string;
  onCityChange?: (value: string) => void;
  onClear: () => void;
}

const EVENT_CATEGORIES = [
  { value: "all", label: "All Categories" },
  { value: "tech", label: "Tech & Innovation" },
  { value: "cultural", label: "Cultural" },
  { value: "sports", label: "Sports" },
  { value: "academic", label: "Academic" },
  { value: "workshop", label: "Workshop" },
  { value: "seminar", label: "Seminar" },
];

const PRICE_OPTIONS = [
  { value: "all", label: "All Events" },
  { value: "free", label: "Free Only" },
  { value: "paid", label: "Paid Only" },
];

export const EventFilters = ({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  priceFilter,
  onPriceFilterChange,
  state = "all",
  onStateChange,
  city = "all",
  onCityChange,
  onClear,
}: EventFiltersProps) => {
  const hasActiveFilters = search || category !== "all" || priceFilter !== "all" || state !== "all" || city !== "all";

  // Get cities for selected state
  const cities = useMemo(() => {
    if (!state || state === "all") return [];
    return getCitiesForState(state);
  }, [state]);

  // Handle state change - reset city when state changes
  const handleStateChange = (newState: string) => {
    onStateChange?.(newState);
    if (newState !== state && onCityChange) {
      onCityChange("all");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Category Filter */}
        <Select value={category} onValueChange={onCategoryChange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent className="bg-background border shadow-lg z-50">
            {EVENT_CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Price Filter */}
        <Select value={priceFilter} onValueChange={onPriceFilterChange}>
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="Price" />
          </SelectTrigger>
          <SelectContent className="bg-background border shadow-lg z-50">
            {PRICE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button variant="ghost" size="icon" onClick={onClear}>
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Location Filters Row */}
      {onStateChange && (
        <div className="flex flex-col sm:flex-row gap-3">
          {/* State Filter */}
          <Select value={state} onValueChange={handleStateChange}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <MapPin className="w-4 h-4 mr-2" />
              <SelectValue placeholder="All States" />
            </SelectTrigger>
            <SelectContent className="bg-background border shadow-lg z-50 max-h-[300px]">
              <SelectItem value="all">All States</SelectItem>
              {INDIAN_STATES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* City Filter - only show if state is selected */}
          {state && state !== "all" && cities.length > 0 && onCityChange && (
            <Select value={city} onValueChange={onCityChange}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="All Cities" />
              </SelectTrigger>
              <SelectContent className="bg-background border shadow-lg z-50 max-h-[300px]">
                <SelectItem value="all">All Cities</SelectItem>
                {cities.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}
    </div>
  );
};

export default EventFilters;
