import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ColumnCard } from "@/components/column-card";
import { CyberpunkDivider } from "@/components/cyberpunk-divider";
import { useToast } from "@/hooks/use-toast";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { ColumnCap } from "@shared/data";
import { getUserOwnedColumns } from "@/contract/perlite_column";
export default function MyColumns() {
  const [location, setLocation] = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();
  const currentAccount = useCurrentAccount();
  const [isLoading, setIsLoading] = useState(true);
  const [columns, setColumns] = useState<ColumnCap[]>([]);

  // Check if user is authenticated
  useEffect(() => {
    if (currentAccount) {
      setIsAuthenticated(true);
    }
    const fetchColumns = async () => {
      if (currentAccount) {
        let userOwnedColumns = await getUserOwnedColumns(
          currentAccount.address,
        );
        setColumns(userOwnedColumns);
        setIsLoading(false);
      }
    };
    fetchColumns();
  }, [currentAccount, setIsAuthenticated, setIsLoading]);
  // Fetch user's columns

  return (
    <div className="container mx-auto px-4 py-8 pt-24">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h1 className="font-rajdhani font-bold text-3xl md:text-4xl text-cyber-text">
          <span className="text-cyber-purple">#</span> My Columns
        </h1>
      </div>

      <CyberpunkDivider className="mb-8" />

      {/* Columns Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
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
            You haven't created any columns yet
          </p>
          <Button
            variant="outline"
            className="border-cyber-purple text-cyber-purple"
            onClick={() => setLocation("/creator/dashboard")}
          >
            Create Column
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {" "}
          {/**
  id,
  title,
  description,
  thumbnailUrl,
  creatorId,
  creatorName,
  planInstallmentNumber,
  totalInstallmentNumber,
  status = 0,
  isSubscribed = false,
  isAuthenticated = false,
        */}
          {columns.map((column: ColumnCap) => (
            <ColumnCard
              key={column.id}
              id={column.id}
              title={column.name}
              description={column.description}
              thumbnailUrl={column.image_url || undefined}
              creatorId={column.creator}
              creatorName={column.creator}
              updateMethod={JSON.stringify(column.other.update_method)}
              payMethod={JSON.stringify(column.other.payment_method)}
              planInstallmentNumber={column.other.plan_installment_number}
              totalInstallmentNumber={column.other.all_installment.length}
              status={column.other.status}
              isSubscribed={column.other.subscriptions > 0}
              isAuthenticated={isAuthenticated}
            />
          ))}
        </div>
      )}
    </div>
  );
}
