import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, User, LogOut, Shield } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface HeaderProps {
  onAuthClick: () => void;
}

const Header = ({ onAuthClick }: HeaderProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, profile, isAdmin, signOut } = useAuth();
  const location = useLocation();

  const navLinks = [
    { href: "/materials", label: "Study Materials" },
    { href: "/news", label: "News" },
    { href: "/blogs", label: "Blogs" },
    { href: "/books", label: "Book Exchange" },
    { href: "/leaderboard", label: "Leaderboard" },
  ];

  const handleSignOut = async () => {
    await signOut();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const isActiveLink = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  return (
    <header className="sticky top-0 z-50 bg-background border-b-2 border-foreground">
      <div className="container-wide">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-foreground rounded-xl flex items-center justify-center transition-transform group-hover:scale-105">
              <span className="text-background font-bold text-base">U</span>
            </div>
            <span className="font-bold text-xl text-foreground">UniVoid</span>
          </Link>

          {/* Desktop Navigation - Pill style */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-150 ${
                  isActiveLink(link.href)
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                    <Avatar className="h-10 w-10 border-2 border-foreground">
                      <AvatarImage src={profile?.profile_photo_url || undefined} alt={profile?.full_name} />
                      <AvatarFallback className="bg-foreground text-background text-sm font-semibold">
                        {profile?.full_name ? getInitials(profile.full_name) : 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 rounded-xl border-2 border-foreground" align="end" forceMount>
                  <div className="flex flex-col space-y-1 p-3">
                    <p className="text-sm font-semibold leading-none">{profile?.full_name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator className="bg-foreground/10" />
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard" className="cursor-pointer font-medium">
                      <User className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="cursor-pointer font-medium">
                        <Shield className="mr-2 h-4 w-4" />
                        Admin Panel
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator className="bg-foreground/10" />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive font-medium">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={onAuthClick}>
                  Sign in
                </Button>
                <Button size="sm" onClick={onAuthClick}>
                  Join UniVoid
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 hover:bg-secondary rounded-xl transition-colors border-2 border-foreground"
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
          <div className="md:hidden py-4 border-t-2 border-foreground animate-fade-in">
            <nav className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`px-4 py-3 text-sm font-medium rounded-xl transition-all ${
                    isActiveLink(link.href)
                      ? 'bg-foreground text-background'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="flex flex-col gap-2 mt-4 pt-4 border-t-2 border-foreground/20">
                {user ? (
                  <>
                    <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="outline" size="sm" className="w-full">
                        <User className="w-4 h-4 mr-2" />
                        Dashboard
                      </Button>
                    </Link>
                    {isAdmin && (
                      <Link to="/admin" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="outline" size="sm" className="w-full">
                          <Shield className="w-4 h-4 mr-2" />
                          Admin Panel
                        </Button>
                      </Link>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full text-destructive" 
                      onClick={() => { handleSignOut(); setMobileMenuOpen(false); }}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" size="sm" className="w-full" onClick={() => { onAuthClick(); setMobileMenuOpen(false); }}>
                      Sign in
                    </Button>
                    <Button size="sm" className="w-full" onClick={() => { onAuthClick(); setMobileMenuOpen(false); }}>
                      Join UniVoid
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
