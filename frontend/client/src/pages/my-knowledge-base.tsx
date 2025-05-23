import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { CyberpunkDivider } from "@/components/cyberpunk-divider";
import { useToast } from "@/hooks/use-toast";
import { PerliteVault, PerliteVaultDir, Directory, File } from "@shared/data";
import { getAllPerliteVaultByAddress } from "@/contract/perlite_server";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Database, FolderOpen, FileText, Calendar } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useCurrentAccount } from "@mysten/dapp-kit";

export default function MyKnowledgeBase() {
  const [location, setLocation] = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();

  const currentAccount = useCurrentAccount();
  const [vaults, setVaults] = useState<PerliteVault[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // Check if user is authenticated
  useEffect(() => {
    if (currentAccount) {
      setIsAuthenticated(true);
    }

    const fetchVaults = async () => {
      if (currentAccount) {
        let vaults = await getAllPerliteVaultByAddress(currentAccount.address);
        setVaults(vaults);
        setIsLoading(false);
      }
    };
    fetchVaults();
  }, [currentAccount, setVaults, setIsLoading]);

  // Fetch user's knowledge bases

  const handleViewKnowledgeBase = (id: string) => {
    const params = new URLSearchParams();
    params.set("kb", id);
    setLocation(`/creator/konwledge/base?${params.toString()}`);
  };

  return (
    <div className="container mx-auto px-4 py-8 pt-24">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h1 className="font-rajdhani font-bold text-3xl md:text-4xl text-cyber-text">
          <span className="text-cyber-purple">#</span> My Knowledge Base
        </h1>
      </div>

      <CyberpunkDivider className="mb-8" />

      {/* Knowledge Bases Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="cyber-border bg-cyber-surface rounded-lg overflow-hidden h-48 animate-pulse"
            >
              <div className="p-6">
                <div className="h-6 bg-cyber-dark rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-cyber-dark rounded w-full mb-4"></div>
                <div className="h-4 bg-cyber-dark rounded w-1/2 mb-6"></div>
                <div className="flex justify-between">
                  <div className="h-8 bg-cyber-dark rounded w-20"></div>
                  <div className="h-8 bg-cyber-dark rounded w-20"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : vaults.length === 0 ? (
        <div className="cyber-border bg-cyber-surface p-8 rounded-lg text-center">
          <h3 className="font-rajdhani text-xl text-cyber-purple mb-2">
            No Knowledge Bases Found
          </h3>
          <p className="text-cyber-text mb-4">
            You haven't created any knowledge bases yet, please use PerliteSync
            upload your knowledge base.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-4 gap-4">
          {vaults.map((kb: PerliteVault) => (
            <Card
              key={kb.id}
              className="cyber-border bg-cyber-surface hover:border-cyber-purple transition-all"
            >
              <CardHeader>
                <CardTitle className="text-cyber-cyan flex items-center">
                  <Database className="w-5 h-5 mr-2" />
                  {kb.name}
                </CardTitle>
                <CardDescription className="text-cyber-text opacity-70">
                  {"No description"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-cyber-text text-sm">
                  <Calendar className="w-4 h-4 mr-1 text-cyber-purple" />
                  <span>Created: {formatDate(kb.created_at)}</span>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  variant="outline"
                  className="border-cyber-purple text-cyber-purple"
                  onClick={() => handleViewKnowledgeBase(kb.id)}
                >
                  <FolderOpen className="w-4 h-4 mr-2" />
                  Open
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
