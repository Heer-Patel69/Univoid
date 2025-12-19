import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X, Filter } from "lucide-react";

interface EventFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  category: string;
  onCategoryChange: (value: string) => void;
  priceFilter: string;
  onPriceFilterChange: (value: string) => void;
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
  onClear,
}: EventFiltersProps) => {
  const hasActiveFilters = search || category !== "all" || priceFilter !== "all";

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
          <SelectContent>
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
          <SelectContent>
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
    </div>
  );
};

export default EventFilters;
