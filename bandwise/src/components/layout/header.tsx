"use client";

import * as React from "react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, X, Home, BarChart3, CreditCard, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserButton } from "@/components/auth/user-button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navigationItems = [
    { href: "/", label: "Home", icon: <Home className="h-5 w-5" /> },
    { href: "/practice", label: "Practice", icon: <BookOpen className="h-5 w-5" /> },
    { href: "/dashboard", label: "Dashboard", icon: <BarChart3 className="h-5 w-5" /> },
    { href: "/pricing", label: "Pricing", icon: <CreditCard className="h-5 w-5" /> },
  ];

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 ${isScrolled ? "shadow-md" : ""}`}
    >
      <div className="container flex h-14 max-w-screen-2xl items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-brand text-white font-bold text-lg">
              BW
            </div>
            <span className="font-bold text-xl hidden sm:block">BandWise</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navigationItems.map((item) => (
            <Button key={item.href} variant="ghost" asChild className="gap-2">
              <Link href={item.href} className="flex items-center gap-2">
                {item.icon}
                {item.label}
              </Link>
            </Button>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <UserButton />
          
          {/* Mobile Navigation */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[240px] sm:w-[300px]">
              <nav className="flex flex-col gap-4 mt-6">
                {navigationItems.map((item) => (
                  <Button key={item.href} variant="ghost" asChild className="w-full justify-start gap-3">
                    <Link href={item.href} className="flex items-center gap-3 w-full">
                      {item.icon}
                      {item.label}
                    </Link>
                  </Button>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
