import React from "react";
import { Link } from "wouter";
import { Logo } from "@/components/logo";
import { CyberpunkDivider } from "@/components/cyberpunk-divider";
import { Github, Twitter, Instagram } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-cyber-dark border-t border-cyber-purple mt-16">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="mb-4">
              <Logo size="sm" />
            </div>
            <p className="text-cyber-text text-sm mb-4">
              Decentralized knowledge sharing platform connecting creators and
              readers to build a Web3 learning ecosystem
            </p>
            <div className="flex space-x-3">
              <a
                href="#"
                className="w-8 h-8 rounded-full bg-cyber-surface flex items-center justify-center text-cyber-purple hover:bg-cyber-purple hover:text-white transition-all"
              >
                <Twitter className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="w-8 h-8 rounded-full bg-cyber-surface flex items-center justify-center text-cyber-purple hover:bg-cyber-purple hover:text-white transition-all"
              >
                <Github className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="w-8 h-8 rounded-full bg-cyber-surface flex items-center justify-center text-cyber-purple hover:bg-cyber-purple hover:text-white transition-all"
              >
                <Instagram className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-rajdhani font-semibold text-lg text-white mb-4">
              Browse
            </h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/columns"
                  className="text-cyber-text hover:text-cyber-purple text-sm"
                >
                  All
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <CyberpunkDivider className="my-8" />

        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-cyber-text text-sm mb-4 md:mb-0">
            &copy; {new Date().getFullYear()} Perlite | Web3-based Personal Column Subscription Platform
          </p>
          <div className="flex space-x-4">
            <a
              href="#"
              className="text-cyber-text hover:text-cyber-purple text-sm"
            >
              Privacy Policy
            </a>
            <a
              href="#"
              className="text-cyber-text hover:text-cyber-purple text-sm"
            >
              Terms
            </a>
            <a
              href="#"
              className="text-cyber-text hover:text-cyber-purple text-sm"
            >
              Cookie Setting
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
