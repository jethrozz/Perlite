import React, { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CyberpunkDivider } from "@/components/cyberpunk-divider";
import { ColumnCard } from "@/components/column-card";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Search, Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { getAllColumns } from "@/contract/perlite_column";
import {
  ColumnOtherInfo,
  Installment,
  UpdateMethod,
  PaymentMethod,
} from "@shared/data";
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
  const [searchType, setSearchType] = useState<"id" | "name">(
    (searchParams.get("type") as "id" | "name") || "name",
  );
  const [selectedFilter, setSelectedFilter] = useState(
    searchParams.get("filter") || "all",
  );
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get("category") || "",
  );
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const currentAccount = useCurrentAccount();
  const [columns, setColumns] = useState<ColumnOtherInfo[]>([]);
  const { toast } = useToast();

  // Parse URL params on component mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSearchQuery(params.get("q") || "");
    setSearchType((params.get("type") as "id" | "name") || "name");
    setSelectedFilter(params.get("filter") || "all");
    setSelectedCategory(params.get("category") || "");
  }, [location]);

  useEffect(() => {
    if (currentAccount) {
      setIsAuthenticated(true);
    }

    // 加载知识库列表
    const fetchAllColums = async () => {
      let cols = await getAllColumns();
      setColumns(cols);
    };
    fetchAllColums();
  }, [currentAccount, setColumns]);

  // Check if column is subscribed

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
              onValueChange={(value: "id" | "name") => setSearchType(value)}
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
                placeholder={
                  searchType === "id"
                    ? "Enter column ID..."
                    : "Search by name..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
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
          {columns.map((column: ColumnOtherInfo) => (
            <ColumnCard
              key={column.id}
              id={column.id}
              title={column.name}
              description={column.desc}
              thumbnailUrl={column.cover_img_url || undefined}
              price={column.payment_method?.fee}
              // This is a limitation in the sample data - in a real app we'd fetch creator names
              creatorName={column.creator}
              createdAt={column.update_at.toLocaleDateString()}
              paymentId={column.payment_method?.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
