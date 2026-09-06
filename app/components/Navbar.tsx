"use client";

import Link from "next/link";
import { Menu, X, Cross } from "lucide-react";
import { useEffect, useState } from "react";

const links = [
  { href: "/", label: "Home" },
  { href: "/bibbia", label: "Bibbia" },
  { href: "/meditazioni", label: "Meditazioni" },
  { href: "/prediche", label: "Prediche" },
  { href: "/contatti", label: "Contatti" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 30);
    };

    window.addEventListener("scroll", onScroll);

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed left-0 top-0 z-50 w-full transition-all duration-500 ${
        scrolled
          ? "bg-white/80 backdrop-blur-xl shadow-lg"
          : "bg-transparent"
      }`}
    >
      <div className="container flex h-20 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <div className="rounded-full bg-amber-400 p-2 shadow-lg">
            <Cross size={18} className="text-white" />
          </div>

          <div>
            <h2 className="text-2xl font-bold tracking-wide">
              LOGOS
            </h2>

            <span className="text-xs opacity-70">
              La Parola di Dio
            </span>
          </div>
        </Link>

        {/* Desktop */}
        <nav className="hidden items-center gap-8 md:flex">
          {links.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="relative text-sm font-medium transition hover:text-amber-600"
            >
              {item.label}
            </Link>
          ))}

          <button className="btn-primary">
            Versetto del giorno
          </button>
        </nav>

        {/* Mobile */}
        <button
          className="md:hidden"
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}

      <div
        className={`overflow-hidden bg-white transition-all duration-500 md:hidden ${
          open ? "max-h-96" : "max-h-0"
        }`}
      >
        <div className="container flex flex-col gap-6 py-6">
          {links.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}

          <button className="btn-primary w-full">
            Versetto del giorno
          </button>
        </div>
      </div>
    </header>
  );
}