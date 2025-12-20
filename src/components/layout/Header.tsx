import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, User, LogOut, Shield, BookOpen, Newspaper, FileText, Repeat2, Trophy, Calendar, LayoutDashboard, Folder, Briefcase } from "lucide-react";
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
import { NotificationCenter } from "@/components/notifications/NotificationCenter";

interface HeaderProps {
  onAuthClick: () => void;
}

const Header = ({ onAuthClick }: HeaderProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, profile, isAdmin, isOrganizer, signOut } = useAuth();
  const location = useLocation();

  const navLinks = [
    { href: "/materials", label: "Materials", icon: BookOpen },
    { href: "/events", label: "Events", icon: Calendar },
    { href: "/projects", label: "Projects", icon: Folder },
    { href: "/tasks", label: "Tasks", icon: Briefcase },
    { href: "/books", label: "Books", icon: Repeat2 },
    { href: "/leaderboard", label: "Ranks", icon: Trophy },
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
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border-strong/10">
      <div className="container-wide">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 bg-foreground rounded-2xl flex items-center justify-center transition-all group-hover:scale-105 group-hover:rotate-3 shadow-soft">
              <span className="text-background font-extrabold text-lg font-display">U</span>
            </div>
            <span className="font-extrabold text-xl text-foreground font-display">UniVoid</span>
          </Link>

          {/* Desktop Navigation - Floating Island Style */}
          <nav className="hidden md:flex items-center gap-1 bg-card/60 backdrop-blur-lg rounded-full px-2 py-1.5 border border-border-strong/10 shadow-soft">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`px-4 py-2 text-sm font-semibold rounded-full transition-all duration-200 flex items-center gap-2 ${
                    isActiveLink(link.href)
                      ? 'bg-foreground text-background shadow-soft'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }`}
                >
                  <Icon className="w-4 h-4" strokeWidth={2.5} />
                  <span className="hidden lg:inline">{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-2">
            {user && <NotificationCenter />}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 hover:scale-105 transition-transform">
                    <Avatar className="h-10 w-10 border-2 border-border-strong/20 shadow-soft">
                      <AvatarImage src={profile?.profile_photo_url || undefined} alt={profile?.full_name} />
                      <AvatarFallback className="bg-pastel-purple text-foreground text-sm font-bold">
                        {profile?.full_name ? getInitials(profile.full_name) : 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 rounded-2xl border border-border-strong/10 shadow-soft-lg" align="end" forceMount>
                  <div className="flex flex-col space-y-1 p-3">
                    <p className="text-sm font-bold leading-none font-display">{profile?.full_name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator className="bg-border" />
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard" className="cursor-pointer font-semibold rounded-xl">
                      <User className="mr-2 h-4 w-4" strokeWidth={2.5} />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  {isOrganizer && (
                    <DropdownMenuItem asChild>
                      <Link to="/organizer/dashboard" className="cursor-pointer font-semibold rounded-xl">
                        <LayoutDashboard className="mr-2 h-4 w-4" strokeWidth={2.5} />
                        Organizer Dashboard
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="cursor-pointer font-semibold rounded-xl">
                        <Shield className="mr-2 h-4 w-4" strokeWidth={2.5} />
                        Admin Panel
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator className="bg-border" />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive font-semibold rounded-xl">
                    <LogOut className="mr-2 h-4 w-4" strokeWidth={2.5} />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={onAuthClick} className="font-semibold">
                  Sign in
                </Button>
                <Button size="sm" onClick={onAuthClick} className="shadow-soft">
                  Join UniVoid
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2.5 hover:bg-secondary rounded-2xl transition-all border border-border-strong/10 shadow-soft"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5 text-foreground" strokeWidth={2.5} />
            ) : (
              <Menu className="w-5 h-5 text-foreground" strokeWidth={2.5} />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border animate-fade-in">
            <nav className="flex flex-col gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    className={`px-4 py-3 text-sm font-semibold rounded-2xl transition-all flex items-center gap-3 ${
                      isActiveLink(link.href)
                        ? 'bg-foreground text-background'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Icon className="w-5 h-5" strokeWidth={2.5} />
                    {link.label}
                  </Link>
                );
              })}
              <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-border">
                {user ? (
                  <>
                    <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="outline" size="sm" className="w-full">
                        <User className="w-4 h-4 mr-2" strokeWidth={2.5} />
                        Dashboard
                      </Button>
                    </Link>
                    {isOrganizer && (
                      <Link to="/organizer/dashboard" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="outline" size="sm" className="w-full">
                          <LayoutDashboard className="w-4 h-4 mr-2" strokeWidth={2.5} />
                          Organizer Dashboard
                        </Button>
                      </Link>
                    )}
                    {isAdmin && (
                      <Link to="/admin" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="outline" size="sm" className="w-full">
                          <Shield className="w-4 h-4 mr-2" strokeWidth={2.5} />
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
                      <LogOut className="w-4 h-4 mr-2" strokeWidth={2.5} />
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
