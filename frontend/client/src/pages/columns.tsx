import React, { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CyberpunkDivider } from "@/components/cyberpunk-divider";
import { ColumnCard } from "@/components/column-card";
import { CategoryCard } from "@/components/category-card";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Search, Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface Column {
  id: number;
  title: string;
  description: string;
  thumbnailUrl: string | null;
  creatorId: number;
  categoryId: number | null;
  articleCount: number;
  subscriberCount: number;
  isHot: boolean;
  isNew: boolean;
}

interface Category {
  id: number;
  name: string;
  icon: string;
  slug: string;
}

export default function Columns() {
  const [location, setLocation] = useLocation();
  const [searchParams, setSearchParams] = useState(
    new URLSearchParams(window.location.search),
  );
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [searchType, setSearchType] = useState<'id' | 'name'>(
    (searchParams.get("type") as 'id' | 'name') || "name"
  );
  const [selectedFilter, setSelectedFilter] = useState(
    searchParams.get("filter") || "all",
  );
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get("category") || "",
  );
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();

  // Parse URL params on component mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSearchQuery(params.get("q") || "");
    setSearchType((params.get("type") as 'id' | 'name') || "name");
    setSelectedFilter(params.get("filter") || "all");
    setSelectedCategory(params.get("category") || "");
  }, [location]);

  // Check if user is authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        await apiRequest("GET", "/api/auth/current-user");
        setIsAuthenticated(true);
      } catch (error) {
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
  });

  // Derive the API endpoint based on filters
  const getQueryEndpoint = () => {
    if (searchQuery) {
      return `/api/columns/search?q=${encodeURIComponent(searchQuery)}&type=${searchType}`;
    }

    if (selectedCategory) {
      const category = categories.find(
        (cat: Category) => cat.slug === selectedCategory,
      );
      if (category) {
        return `/api/columns/category/${category.id}`;
      }
    }

    switch (selectedFilter) {
      case "hot":
        return "/api/columns/hot";
      case "new":
        return "/api/columns/new";
      default:
        return "/api/columns/hot"; // Default to hot columns
    }
  };

  // Fetch columns based on filter
  const {
    data: columns = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: [getQueryEndpoint()],
    enabled: true,
  });

  // Fetch subscriptions if authenticated
  const { data: subscriptions = [] } = useQuery({
    queryKey: ["/api/users/current/subscriptions"],
    enabled: isAuthenticated,
  });

  // Check if column is subscribed
  const isSubscribed = (columnId: number) => {
    if (!isAuthenticated || !subscriptions.length) return false;
    return subscriptions.some((sub: Column) => sub.id === columnId);
  };

  const handleSearch = (query: string) => {
    const params = new URLSearchParams();
    if (query) {
      params.set("q", query);
      params.set("type", searchType);
    }
    if (selectedFilter && selectedFilter !== "all")
      params.set("filter", selectedFilter);
    if (selectedCategory) params.set("category", selectedCategory);

    setLocation(`/columns?${params.toString()}`);
  };

  const handleFilterChange = (value: string) => {
    setSelectedFilter(value);

    const params = new URLSearchParams(searchParams);
    if (value === "all") {
      params.delete("filter");
    } else {
      params.set("filter", value);
    }

    setSearchParams(params);
    setLocation(`/columns?${params.toString()}`);
  };

  const handleCategorySelect = (slug: string) => {
    setSelectedCategory(slug);

    const params = new URLSearchParams(searchParams);
    params.set("category", slug);
    params.delete("q"); // Clear search when selecting category

    setSearchParams(params);
    setLocation(`/columns?${params.toString()}`);
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedFilter("all");
    setSelectedCategory("");
    setLocation("/columns");
  };

  const getPageTitle = () => {
    if (searchQuery) {
      return `Search Results for "${searchQuery}"`;
    }

    if (selectedCategory) {
      const category = categories.find(
        (cat: Category) => cat.slug === selectedCategory,
      );
      return category
        ? `${category.name} Category Columns`
        : "Column Directory";
    }

    switch (selectedFilter) {
      case "hot":
        return "Popular Columns";
      case "new":
        return "Latest Columns";
      case "creators":
        return "Creators' Picks";
      default:
        return "Columns";
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 pt-24">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h1 className="font-rajdhani font-bold text-3xl md:text-4xl text-cyber-text">
          <span className="text-cyber-purple">#</span> {getPageTitle()}
        </h1>
        
        <div className="flex items-center gap-2">
          <div className="flex gap-2">
            <Select
              value={searchType}
              onValueChange={(value: 'id' | 'name') => setSearchType(value)}
            >
              <SelectTrigger className="w-24 bg-cyber-dark border-cyber-purple text-cyber-text">
                <SelectValue placeholder="Search by" />
              </SelectTrigger>
              <SelectContent className="bg-cyber-dark border-cyber-purple text-cyber-text">
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="id">ID</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="relative">
              <Input
                type="text"
                placeholder={searchType === 'id' ? "Enter column ID..." : "Search by name..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch(searchQuery);
                  }
                }}
                className="w-64 pl-10 bg-cyber-dark border-cyber-purple text-cyber-text"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-cyber-purple" />
            </div>
          </div>
          <Button 
            className="cyber-btn bg-cyber-purple hover:bg-opacity-80 text-white"
            onClick={() => handleSearch(searchQuery)}
          >
            Search
          </Button>
        </div>
      </div>

      <CyberpunkDivider className="mb-8" />

      {/* Columns Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="cyber-border bg-cyber-surface rounded-lg overflow-hidden h-64 animate-pulse"
            >
              <div className="h-40 bg-cyber-dark"></div>
              <div className="p-4">
                <div className="h-5 bg-cyber-dark rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-cyber-dark rounded w-full mb-3"></div>
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 rounded-full bg-cyber-dark mr-2"></div>
                  <div className="h-4 bg-cyber-dark rounded w-1/4"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="cyber-border bg-cyber-surface p-8 rounded-lg text-center">
          <h3 className="font-rajdhani text-xl text-cyber-magenta mb-2">
            Error Loading Data
          </h3>
          <p className="text-cyber-text mb-4">
            Unable to load column data, please try again later
          </p>
          <Button
            variant="outline"
            className="border-cyber-purple text-cyber-purple"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      ) : columns.length === 0 ? (
        <div className="cyber-border bg-cyber-surface p-8 rounded-lg text-center">
          <h3 className="font-rajdhani text-xl text-cyber-purple mb-2">
            No Columns Found
          </h3>
          <p className="text-cyber-text mb-4">
            {searchQuery
              ? `No columns matching "${searchQuery}" were found`
              : "No columns to display"}
          </p>
          <Button
            variant="outline"
            className="border-cyber-purple text-cyber-purple"
            onClick={handleClearFilters}
          >
            Clear Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {columns.map((column: Column) => (
            <ColumnCard
              key={column.id}
              id={column.id}
              title={column.title}
              description={column.description}
              thumbnailUrl={column.thumbnailUrl || undefined}
              creatorId={column.creatorId}
              // In a real app, we'd fetch creator info or have it included in the columns response
              creatorName={`创作者 ${column.creatorId}`}
              articleCount={column.articleCount}
              isHot={column.isHot}
              isNew={column.isNew}
              isSubscribed={isSubscribed(column.id)}
              isAuthenticated={isAuthenticated}
            />
          ))}
        </div>
      )}
    </div>
  );
}
