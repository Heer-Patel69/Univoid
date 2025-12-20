import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown, Loader2, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSearchableData, LookupTable } from "@/hooks/useSearchableData";
import { Input } from "@/components/ui/input";

interface SearchableSelectProps {
  label: string;
  tableName: LookupTable;
  placeholder?: string;
  value?: string;
  displayValue?: string;
  dependencyColumn?: string;
  dependencyValue?: string | null;
  onSelect: (item: { id: string; name: string }) => void;
  disabled?: boolean;
  required?: boolean;
}

export function SearchableSelect({
  label,
  tableName,
  placeholder = "Search...",
  value,
  displayValue,
  dependencyColumn,
  dependencyValue,
  onSelect,
  disabled = false,
  required = false,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { searchTerm, setSearchTerm, results, isLoading, hasSearched } =
    useSearchableData({
      tableName,
      dependencyColumn,
      dependencyValue,
    });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (item: { id: string; name: string }) => {
    onSelect(item);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect({ id: "", name: "" });
    setSearchTerm("");
  };

  const handleOpen = () => {
    if (!disabled) {
      setIsOpen(true);
    }
  };

  return (
    <div className="space-y-2" ref={containerRef}>
      <label className="text-sm font-medium text-foreground">
        {label} {required && <span className="text-destructive">*</span>}
      </label>

      <div className="relative">
        {/* Trigger Button */}
        <button
          type="button"
          onClick={handleOpen}
          disabled={disabled}
          className={cn(
            "w-full flex items-center justify-between gap-2 px-4 py-3 rounded-2xl border-2 border-border-strong/20 bg-card text-left transition-all duration-200",
            "hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
            disabled && "opacity-50 cursor-not-allowed",
            isOpen && "border-primary ring-2 ring-primary/20",
            !displayValue && "text-muted-foreground"
          )}
          style={{
            boxShadow: isOpen ? "3px 3px 0px hsl(var(--foreground))" : "2px 2px 0px hsl(var(--foreground) / 0.1)",
          }}
        >
          <span className="truncate">{displayValue || placeholder}</span>
          <div className="flex items-center gap-1">
            {displayValue && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 rounded-full hover:bg-secondary transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            )}
            <ChevronDown
              className={cn(
                "w-4 h-4 text-muted-foreground transition-transform duration-200",
                isOpen && "rotate-180"
              )}
            />
          </div>
        </button>

        {/* Dropdown Panel */}
        {isOpen && (
          <div
            className="absolute z-50 w-full mt-2 bg-card rounded-2xl border-2 border-border-strong/20 shadow-lg overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200"
            style={{
              boxShadow: "4px 4px 0px hsl(var(--foreground) / 0.15)",
            }}
          >
            {/* Search Input */}
            <div className="p-3 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  ref={inputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={`Type to search ${label.toLowerCase()}...`}
                  className="pl-9 pr-4 h-10 rounded-xl border-border-strong/10 focus:border-primary"
                />
                {isLoading && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-primary" />
                )}
              </div>
            </div>

            {/* Results List */}
            <div className="max-h-60 overflow-y-auto p-2">
              {!hasSearched && results.length > 0 && (
                <p className="px-3 py-1.5 text-xs font-medium text-muted-foreground">
                  Popular choices
                </p>
              )}

              {results.length > 0 ? (
                results.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(item)}
                    className={cn(
                      "w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-left transition-all duration-150",
                      "hover:bg-secondary active:scale-[0.98]",
                      value === item.id && "bg-primary/10 text-primary"
                    )}
                  >
                    <span className="font-medium truncate">{item.name}</span>
                    {value === item.id && (
                      <Check className="w-4 h-4 flex-shrink-0 text-primary" />
                    )}
                  </button>
                ))
              ) : hasSearched ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    No results found for "{searchTerm}"
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Try a different search term
                  </p>
                </div>
              ) : (
                <div className="py-8 text-center">
                  <Search className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Start typing to search
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
