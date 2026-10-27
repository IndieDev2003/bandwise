"use client";

import * as React from "react";
import Link from "next/link";
import { Facebook, Twitter, Instagram, Linkedin, BookOpen, BarChart3, CreditCard, HelpCircle } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { name: "Practice Tests", href: "/practice", icon: <BookOpen className="h-4 w-4" /> },
      { name: "Dashboard", href: "/dashboard", icon: <BarChart3 className="h-4 w-4" /> },
      { name: "Pricing", href: "/pricing", icon: <CreditCard className="h-4 w-4" /> },
    ],
    support: [
      { name: "Help Center", href: "/help", icon: <HelpCircle className="h-4 w-4" /> },
      { name: "Contact Us", href: "/contact", icon: <HelpCircle className="h-4 w-4" /> },
    ],
    legal: [
      { name: "Privacy Policy", href: "/privacy" },
      { name: "Terms of Service", href: "/terms" },
    ],
  };

  const socialLinks = [
    { icon: <Facebook className="h-5 w-5" />, href: "#" },
    { icon: <Twitter className="h-5 w-5" />, href: "#" },
    { icon: <Instagram className="h-5 w-5" />, href: "#" },
    { icon: <Linkedin className="h-5 w-5" />, href: "#" },
  ];

  return (
    <footer className="border-t bg-muted/50">
      <div className="container flex flex-col gap-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-brand text-white font-bold text-lg">
                BW
              </div>
              <span className="font-bold text-xl">BandWise</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Your ultimate IELTS practice platform with AI-powered feedback and detailed analytics.
            </p>
            <div className="flex gap-4">
              {socialLinks.map((link, index) => (
                <a
                  key={index}
                  href={link.href}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={`Follow us on ${typeof link.icon === 'object' ? 'social media' : link.icon}`}
                >
                  {link.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="font-semibold mb-4">Product</h3>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.icon}
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.icon}
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            &copy; {currentYear} BandWise. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground">
            Made with ❤️ for IELTS learners worldwide
          </p>
        </div>
      </div>
    </footer>
  );
}
