import React from 'react';
import { Link } from 'wouter';
import { Logo } from '@/components/ui/logo';
import { Button } from '@/components/ui/button';
import { Twitter, MessageCircleCode, Github, Send } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-dark pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          <div className="lg:col-span-2">
            <Logo size="md" className="mb-4" />
            
            <p className="text-muted-foreground mb-6 max-w-md">
              A Web3 learning platform with cyberpunk aesthetics, connecting creators and learners through blockchain technology.
            </p>
            
            <div className="flex space-x-4">
              <Button size="icon" variant="ghost" className="w-10 h-10 rounded-full bg-card flex items-center justify-center text-primary hover:text-accent transition-colors">
                <Twitter size={20} />
              </Button>
              <Button size="icon" variant="ghost" className="w-10 h-10 rounded-full bg-card flex items-center justify-center text-primary hover:text-accent transition-colors">
                <MessageCircleCode size={20} />
              </Button>
              <Button size="icon" variant="ghost" className="w-10 h-10 rounded-full bg-card flex items-center justify-center text-primary hover:text-accent transition-colors">
                <Github size={20} />
              </Button>
              <Button size="icon" variant="ghost" className="w-10 h-10 rounded-full bg-card flex items-center justify-center text-primary hover:text-accent transition-colors">
                <Send size={20} />
              </Button>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-rajdhani font-semibold mb-4">Platform</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/series/browse">
                  <a className="text-muted-foreground hover:text-accent transition-colors">Browse Courses</a>
                </Link>
              </li>
              <li>
                <Link href="/creator/dashboard">
                  <a className="text-muted-foreground hover:text-accent transition-colors">For Creators</a>
                </Link>
              </li>
              <li>
                <Link href="/pricing">
                  <a className="text-muted-foreground hover:text-accent transition-colors">Pricing</a>
                </Link>
              </li>
              <li>
                <Link href="/testimonials">
                  <a className="text-muted-foreground hover:text-accent transition-colors">Testimonials</a>
                </Link>
              </li>
              <li>
                <Link href="/updates">
                  <a className="text-muted-foreground hover:text-accent transition-colors">Updates</a>
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-rajdhani font-semibold mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/docs">
                  <a className="text-muted-foreground hover:text-accent transition-colors">Documentation</a>
                </Link>
              </li>
              <li>
                <Link href="/tutorials">
                  <a className="text-muted-foreground hover:text-accent transition-colors">Tutorials</a>
                </Link>
              </li>
              <li>
                <Link href="/blog">
                  <a className="text-muted-foreground hover:text-accent transition-colors">Blog</a>
                </Link>
              </li>
              <li>
                <Link href="/faq">
                  <a className="text-muted-foreground hover:text-accent transition-colors">FAQ</a>
                </Link>
              </li>
              <li>
                <Link href="/community">
                  <a className="text-muted-foreground hover:text-accent transition-colors">Community</a>
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-rajdhani font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about">
                  <a className="text-muted-foreground hover:text-accent transition-colors">About Us</a>
                </Link>
              </li>
              <li>
                <Link href="/careers">
                  <a className="text-muted-foreground hover:text-accent transition-colors">Careers</a>
                </Link>
              </li>
              <li>
                <Link href="/legal">
                  <a className="text-muted-foreground hover:text-accent transition-colors">Legal</a>
                </Link>
              </li>
              <li>
                <Link href="/contact">
                  <a className="text-muted-foreground hover:text-accent transition-colors">Contact</a>
                </Link>
              </li>
              <li>
                <Link href="/investors">
                  <a className="text-muted-foreground hover:text-accent transition-colors">Investors</a>
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-muted">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-muted-foreground text-sm">
              &copy; {new Date().getFullYear()} Perlite. All rights reserved.
            </p>
            
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link href="/privacy">
                <a className="text-muted-foreground hover:text-accent text-sm transition-colors">Privacy Policy</a>
              </Link>
              <Link href="/terms">
                <a className="text-muted-foreground hover:text-accent text-sm transition-colors">Terms of Service</a>
              </Link>
              <Link href="/cookies">
                <a className="text-muted-foreground hover:text-accent text-sm transition-colors">Cookie Policy</a>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
