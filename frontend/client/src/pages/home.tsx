import React, { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { CyberpunkDivider } from "@/components/cyberpunk-divider";
import { ColumnCard } from "@/components/column-card";
import { useQuery } from "@tanstack/react-query";
import { useCurrentAccount } from "@mysten/dapp-kit";

interface Column {
  id: number;
  title: string;
  description: string;
  thumbnailUrl: string | null;
  creatorId: number;
  articleCount: number;
  isHot: boolean;
  isNew: boolean;
}

interface Creator {
  id: number;
  username: string;
  bio: string | null;
  avatar: string | null;
}

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const currentAccount = useCurrentAccount();
  // Check if user is authenticated
  useEffect(() => {
    if (currentAccount) {
      setIsAuthenticated(true);
    }
  }, [currentAccount]);

  // Fetch hot columns
  const { data: hotColumns = [] } = useQuery({
    queryKey: ["/api/columns/hot"],
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
  });

  // Count columns per category
  const getColumnCount = (categoryId: number) => {
    // This is just a placeholder calculation
    // In a real app, you'd want to fetch this data from the API
    return Math.floor(Math.random() * 30) + 5;
  };

  // Top creators data removed as per requirements

  return (
    <>
      {/* Hero Section */}
      <div className="pt-20 pb-10">
        <div className="relative h-96 overflow-hidden rounded-lg mx-4 mt-4">
          <div className="absolute inset-0 bg-gradient-to-r from-cyber-dark to-cyber-purple opacity-70 z-10"></div>
          <img
            src="https://source.unsplash.com/random/1920x1080/?cyberpunk,city,futuristic"
            alt="Futuristic cyberpunk cityscape"
            className="absolute inset-0 w-full h-full object-cover"
          />

          <div className="relative z-20 h-full flex flex-col justify-center px-8 md:px-16">
            <h1 className="font-rajdhani font-bold text-4xl md:text-5xl lg:text-6xl text-white mb-4">
              <span className="text-cyber-cyan">Web3</span> Columns
              <br />
              <span className="bg-gradient-to-r from-cyber-purple to-cyber-magenta bg-clip-text text-transparent">
                Knowledge Sharing
              </span>{" "}
              Platform
            </h1>
            <p className="font-barlow text-lg md:text-xl text-cyber-text w-full md:w-2/3 mb-8">
              Discover, subscribe, and create high-quality technical columns.
              Explore cutting-edge digital knowledge and build a decentralized
              learning ecosystem with creators worldwide.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/columns">
                <Button className="cyber-btn bg-cyber-purple hover:bg-opacity-80 text-white font-rajdhani py-2 px-6 rounded text-lg">
                  Explore Columns
                </Button>
              </Link>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-cyber-purple via-cyber-cyan to-cyber-magenta"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyber-purple opacity-20 transform rotate-45 -translate-y-16 translate-x-16"></div>
        </div>
      </div>

      {/* Featured Columns */}
      <section className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-rajdhani font-bold text-2xl md:text-3xl text-cyber-text">
            <span className="text-cyber-purple">#</span> Popular Columns
          </h2>
          <a
            href="/columns"
            className="font-mono text-cyber-cyan hover:text-cyber-purple"
          >
            View All <span className="font-mono">&gt;&gt;</span>
          </a>
        </div>

        <CyberpunkDivider className="mb-8" />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {hotColumns.map((column: Column) => (
            <ColumnCard
              key={column.id}
              id={column.id}
              title={column.title}
              description={column.description}
              thumbnailUrl={column.thumbnailUrl || undefined}
              creatorId={column.creatorId}
              // This is a limitation in the sample data - in a real app we'd fetch creator names
              creatorName={`创作者 ${column.creatorId}`}
              articleCount={column.articleCount}
              isHot={column.isHot}
              isNew={column.isNew}
              isAuthenticated={isAuthenticated}
            />
          ))}

          {/* Render placeholders if no hot columns */}
          {hotColumns.length === 0 && (
            <>
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
            </>
          )}
        </div>
      </section>

      {/* Call To Action */}
      <section className="container mx-auto px-4 py-12">
        <div className="cyber-border bg-cyber-surface rounded-lg p-6 md:p-10 relative overflow-hidden bg-grid">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyber-purple opacity-10 transform rotate-45 translate-x-32 -translate-y-32 rounded-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyber-cyan opacity-10 transform rotate-12 -translate-x-16 translate-y-16 rounded-full"></div>

          <div className="relative z-10 flex flex-col md:flex-row items-center">
            <div className="md:w-2/3 mb-6 md:mb-0 md:pr-8">
              <h2 className="font-rajdhani font-bold text-3xl md:text-4xl text-white mb-4">
                Become a <span className="text-cyber-cyan">Creator</span>, share
                your
                <br />
                <span className="bg-gradient-to-r from-cyber-purple to-cyber-magenta bg-clip-text text-transparent">
                  expertise
                </span>
              </h2>
              <p className="font-barlow text-cyber-text mb-6">
                On Pearl Rock platform, you can create your own columns, share
                your professional knowledge, connect with global readers, and
                earn ongoing income. We provide an intuitive content management
                system that lets you focus on creating high-quality content.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href={"/creator/dashboard"}>
                  <Button className="cyber-btn bg-cyber-purple hover:bg-opacity-80 text-white font-rajdhani py-2 px-6 rounded text-lg">
                    Start Now
                  </Button>
                </Link>
                <Link href="/columns">
                  <Button
                    variant="outline"
                    className="cyber-btn bg-transparent border border-cyber-cyan hover:bg-cyber-cyan hover:bg-opacity-20 text-white font-rajdhani py-2 px-6 rounded text-lg"
                  >
                    Learn More
                  </Button>
                </Link>
              </div>
            </div>

            <div className="md:w-1/3 flex justify-center">
              <div className="relative w-64 h-64">
                <img
                  src="https://source.unsplash.com/random/400x400/?interface,cyberpunk,purple"
                  alt="Creator workspace interface"
                  className="rounded-xl object-cover w-full h-full"
                />
                <div className="absolute inset-0 border border-cyber-purple rounded-xl"></div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-cyber-dark border border-cyber-purple rounded-lg flex items-center justify-center">
                  <span className="text-cyber-purple font-mono text-xs">
                    01
                  </span>
                </div>
                <div className="absolute -bottom-2 -left-2 w-8 h-8 bg-cyber-dark border border-cyber-cyan rounded-lg flex items-center justify-center">
                  <span className="text-cyber-cyan font-mono text-xs">CX</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
