"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, X } from "lucide-react";

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface SearchFiltersProps {
  onSearchChange?: (query: string) => void;
  onCategoryChange?: (categoryIds: number[]) => void;
  onSortChange?: (sort: string) => void;
}

export function SearchFilters({
  onSearchChange,
  onCategoryChange,
  onSortChange,
}: SearchFiltersProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState("newest");

  // Mock categories - will be fetched from API
  const categories: Category[] = [
    { id: 1, name: "Breakfast", slug: "breakfast" },
    { id: 2, name: "Lunch", slug: "lunch" },
    { id: 3, name: "Dinner", slug: "dinner" },
    { id: 4, name: "Dessert", slug: "dessert" },
    { id: 5, name: "Vegan", slug: "vegan" },
    { id: 6, name: "Quick", slug: "quick" },
  ];

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    onSearchChange?.(value);
  };

  const handleCategoryToggle = (categoryId: number) => {
    const newSelected = selectedCategories.includes(categoryId)
      ? selectedCategories.filter(id => id !== categoryId)
      : [...selectedCategories, categoryId];

    setSelectedCategories(newSelected);
    onCategoryChange?.(newSelected);
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
    onSortChange?.(value);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategories([]);
    setSortBy("newest");
    onSearchChange?.("");
    onCategoryChange?.([]);
    onSortChange?.("newest");
  };

  const hasActiveFilters = searchQuery || selectedCategories.length > 0 || sortBy !== "newest";

  return (
    <div className="space-y-6 mb-8">
      {/* Search and Sort Row */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search recipes by title, ingredients..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={sortBy} onValueChange={handleSortChange}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="most-liked">Most Liked</SelectItem>
            <SelectItem value="title">Title A-Z</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Categories */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-4 w-4" />
          <span className="font-medium">Categories</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Badge
              key={category.id}
              variant={selectedCategories.includes(category.id) ? "default" : "outline"}
              className="cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => handleCategoryToggle(category.id)}
            >
              {category.name}
            </Badge>
          ))}
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Active filters:</span>

          {searchQuery && (
            <Badge variant="secondary" className="gap-1">
              Search: &ldquo;{searchQuery}&rdquo;
              <button
                onClick={() => handleSearchChange("")}
                className="ml-1 hover:opacity-70"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {selectedCategories.map((categoryId) => {
            const category = categories.find(c => c.id === categoryId);
            return category ? (
              <Badge key={categoryId} variant="secondary" className="gap-1">
                {category.name}
                <button
                  onClick={() => handleCategoryToggle(categoryId)}
                  className="ml-1 hover:opacity-70"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ) : null;
          })}

          {sortBy !== "newest" && (
            <Badge variant="secondary" className="gap-1">
              Sort: {sortBy === "most-liked" ? "Most Liked" :
                sortBy === "oldest" ? "Oldest First" :
                  sortBy === "title" ? "Title A-Z" : "Newest First"}
              <button
                onClick={() => handleSortChange("newest")}
                className="ml-1 hover:opacity-70"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-6 px-2 text-xs"
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}
