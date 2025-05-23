import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
interface User {
  id: number;
  username: string;
  email: string;
  isCreator: boolean;
}

export function Navbar() {
  const [location] = useLocation();
  const [loading, setLoading] = useState(true);
  const currentAccount = useCurrentAccount();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (currentAccount) {
      setIsAuthenticated(true);
    }
  }, [currentAccount]);

  const isActive = (path: string) => {
    return location === path;
  };

  const menuItems = [
    { label: "Home", path: "/" },
    { label: "Columns", path: "/columns" },
    ...(isAuthenticated
      ? [
          { label: "My Subscriptions", path: "/my-subscriptions" },
          { label: "Dashboard", path: "/creator/dashboard" },
          { label: "Knowledge Vault", path: "/my-knowledge-base" },
        ]
      : []),
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glassmorphism shadow-md py-2">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Logo />
          </div>

          <div className="hidden md:flex items-center space-x-6">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`menu-item font-rajdhani text-cyber-text hover:text-cyber-purple ${isActive(item.path) ? "active" : ""}`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center space-x-3">
            <ConnectButton />
          </div>
        </div>
      </div>
    </nav>
  );
}
