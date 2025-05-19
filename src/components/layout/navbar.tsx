import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { Logo } from '@/components/ui/logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConnectButton } from "@mysten/dapp-kit";

import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { 
  Search, 
  Menu, 
  X, 
  User, 
  BookOpen, 
  LogOut, 
  PenSquare,
  LayoutDashboard,
  Folder
} from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export default function Navbar() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [location, navigate] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();

  // Track scroll for navbar background opacity
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/series/browse?q=${encodeURIComponent(searchQuery)}`);
    }
  };
  
  return (
    <header className="fixed w-full top-0 z-50">
      <nav className={`${isScrolled ? 'bg-background/90' : 'bg-dark/90'} backdrop-blur navbar-clip shadow-lg py-3 px-4 lg:px-8 transition-colors duration-300`}>
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo />
          </div>
          
          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-6 font-rajdhani text-lg">
            <Link href="/">
              <a className="text-foreground hover:text-accent transition-colors">Home</a>
            </Link>
            <Link href="/series/browse">
              <a className="text-foreground hover:text-accent transition-colors">Browse</a>
            </Link>
            {isAuthenticated && (
              <Link href="/library">
                <a className="text-foreground hover:text-accent transition-colors">My Library</a>
              </Link>
            )}
            {isAuthenticated && user?.isCreator && (
              <Link href="/creator/dashboard">
                <a className="text-foreground hover:text-accent transition-colors">Create</a>
              </Link>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <form onSubmit={handleSearch} className="relative">
              <Input
                type="text"
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="py-2 pr-10 bg-card border border-primary/30 text-foreground placeholder:text-muted-foreground focus:border-secondary focus:ring-1 focus:ring-secondary transition-all w-full md:w-64"
              />
              <Button 
                type="submit"
                size="icon"
                variant="ghost"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 text-primary hover:text-secondary transition-colors"
              >
                <Search size={18} />
              </Button>
            </form>
            
            {/* Mobile Menu Button */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden text-primary">
                  <Menu size={24} />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px] bg-card border-l border-primary/30">
                <div className="py-6 flex flex-col h-full">
                  <div className="mb-6">
                    <Logo />
                  </div>
                  <nav className="space-y-4 font-rajdhani">
                    <Link href="/">
                      <a className="block py-2 text-xl text-foreground hover:text-accent">Home</a>
                    </Link>
                    <Link href="/series/browse">
                      <a className="block py-2 text-xl text-foreground hover:text-accent">Browse</a>
                    </Link>
                    {isAuthenticated && (
                      <Link href="/library">
                        <a className="block py-2 text-xl text-foreground hover:text-accent">My Library</a>
                      </Link>
                    )}
                    {isAuthenticated && user?.isCreator && (
                      <>
                        <Link href="/creator/dashboard">
                          <a className="block py-2 text-xl text-foreground hover:text-accent">Creator Dashboard</a>
                        </Link>
                        <Link href="/creator/series">
                          <a className="block py-2 text-xl text-foreground hover:text-accent">My Series</a>
                        </Link>
                        <Link href="/creator/content">
                          <a className="block py-2 text-xl text-foreground hover:text-accent">Content Manager</a>
                        </Link>
                      </>
                    )}
                  </nav>
                  <div className="mt-auto pt-6 border-t border-primary/20">
                    {isAuthenticated ? (
                      <div className="space-y-4">
                        <div className="flex items-center">
                          <Avatar className="h-10 w-10 mr-3">
                            <AvatarImage src={user?.avatarUrl} />
                            <AvatarFallback className="bg-primary/30">{getInitials(user?.fullName || '')}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user?.fullName}</p>
                            <p className="text-sm text-muted-foreground">@{user?.username}</p>
                          </div>
                        </div>
                        <Button 
                          variant="destructive" 
                          onClick={() => logout()}
                          className="w-full cyberpunk-btn"
                        >
                          <LogOut className="mr-2 h-4 w-4" /> Sign Out
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <ConnectButton className="w-full cyberpunk-btn bg-primary hover:bg-secondary" />
                      </div>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            
            {/* Desktop Auth Buttons */}
            {isAuthenticated ? (
              <div className="hidden md:block">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user?.avatarUrl} />
                        <AvatarFallback className="bg-primary/30">{getInitials(user?.fullName || '')}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-card border border-primary/30">
                    <div className="flex items-center justify-start p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium">{user?.fullName}</p>
                        <p className="text-sm text-muted-foreground">@{user?.username}</p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile">
                        <a className="flex cursor-pointer items-center">
                          <User className="mr-2 h-4 w-4" />
                          <span>Profile</span>
                        </a>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/library">
                        <a className="flex cursor-pointer items-center">
                          <BookOpen className="mr-2 h-4 w-4" />
                          <span>My Library</span>
                        </a>
                      </Link>
                    </DropdownMenuItem>
                    {user?.isCreator && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href="/creator/dashboard">
                            <a className="flex cursor-pointer items-center">
                              <LayoutDashboard className="mr-2 h-4 w-4" />
                              <span>Creator Dashboard</span>
                            </a>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/creator/series">
                            <a className="flex cursor-pointer items-center">
                              <PenSquare className="mr-2 h-4 w-4" />
                              <span>My Series</span>
                            </a>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/creator/content">
                            <a className="flex cursor-pointer items-center">
                              <Folder className="mr-2 h-4 w-4" />
                              <span>Content Manager</span>
                            </a>
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-destructive focus:text-destructive cursor-pointer"
                      onClick={() => logout()}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="hidden md:block">
                  <ConnectButton className="w-full cyberpunk-btn bg-primary hover:bg-secondary" />
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
