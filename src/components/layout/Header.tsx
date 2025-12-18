import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";

interface HeaderProps {
  onAuthClick: () => void;
  isLoggedIn?: boolean;
}

const Header = ({ onAuthClick, isLoggedIn = false }: HeaderProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/materials", label: "Study Materials" },
    { href: "/news", label: "News" },
    { href: "/blogs", label: "Blogs" },
    { href: "/books", label: "Book Exchange" },
    { href: "/leaderboard", label: "Leaderboard" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="container-wide">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center shadow-premium-sm transition-transform group-hover:scale-105">
              <span className="text-primary-foreground font-bold text-base">U</span>
            </div>
            <span className="font-display font-semibold text-xl text-foreground">UniVoid</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary/50"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-2">
            {isLoggedIn ? (
              <Link to="/dashboard">
                <Button size="sm" className="font-medium">Dashboard</Button>
              </Link>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={onAuthClick} className="font-medium">
                  Sign in
                </Button>
                <Button size="sm" onClick={onAuthClick} className="font-medium shadow-premium-sm">
                  Join UniVoid
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 hover:bg-secondary/50 rounded-lg transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5 text-foreground" />
            ) : (
              <Menu className="w-5 h-5 text-foreground" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/50 animate-fade-in">
            <nav className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-lg transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="flex gap-2 mt-4 pt-4 border-t border-border/50">
                {isLoggedIn ? (
                  <Link to="/dashboard" className="flex-1">
                    <Button size="sm" className="w-full font-medium">
                      Dashboard
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Button variant="ghost" size="sm" className="flex-1 font-medium" onClick={() => { onAuthClick(); setMobileMenuOpen(false); }}>
                      Sign in
                    </Button>
                    <Button size="sm" className="flex-1 font-medium" onClick={() => { onAuthClick(); setMobileMenuOpen(false); }}>
                      Join
                    </Button>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
