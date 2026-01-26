import { Link } from "react-router-dom";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-card relative z-10 py-3">
      <div className="container-wide">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 bg-primary rounded-lg border border-border flex items-center justify-center">
              <span className="text-primary-foreground font-extrabold text-sm font-display">U</span>
            </div>
            <span className="font-bold text-sm text-foreground font-display hidden sm:inline">UniVoid</span>
          </Link>
          
          {/* Copyright */}
          <p className="text-xs text-muted-foreground text-center font-medium">
            © {currentYear} UniVoid
          </p>
          
          {/* Minimal links */}
          <div className="flex items-center gap-3">
            <Link to="/privacy-policy" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link to="/terms" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
