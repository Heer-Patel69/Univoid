import { Link } from "react-router-dom";
import { Heart } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    platform: [
      { href: "/materials", label: "Study Materials" },
      { href: "/scholarships", label: "Scholarships" },
      { href: "/events", label: "Events" },
      { href: "/news", label: "News" },
      { href: "/books", label: "Book Exchange" },
    ],
    community: [
      { href: "/leaderboard", label: "Leaderboard" },
      { href: "/projects", label: "Projects" },
      { href: "/tasks", label: "Tasks" },
      { href: "/dashboard", label: "Dashboard" },
      { href: "/contact", label: "Contact Us" },
    ],
    legal: [
      { href: "/privacy-policy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms & Conditions" },
      { href: "/refund-policy", label: "Refund Policy" },
      { href: "/legal-disclaimer", label: "Legal Disclaimer" },
    ],
  };

  return (
    <footer className="border-t border-border bg-card/50">
      <div className="container-wide py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 mb-4 group">
              <div className="w-10 h-10 bg-foreground rounded-2xl flex items-center justify-center transition-all group-hover:scale-105 group-hover:rotate-3 shadow-soft">
                <span className="text-background font-extrabold text-lg font-display">U</span>
              </div>
              <span className="font-extrabold text-lg text-foreground font-display">UniVoid</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              A trusted student platform for learning, sharing, and growing together.
            </p>
          </div>

          {/* Platform Links */}
          <div>
            <h4 className="font-bold text-foreground text-sm mb-4 font-display">Platform</h4>
            <ul className="space-y-2.5">
              {footerLinks.platform.map((link) => (
                <li key={link.href}>
                  <Link 
                    to={link.href} 
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Community Links */}
          <div>
            <h4 className="font-bold text-foreground text-sm mb-4 font-display">Community</h4>
            <ul className="space-y-2.5">
              {footerLinks.community.map((link) => (
                <li key={link.href}>
                  <Link 
                    to={link.href} 
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="font-bold text-foreground text-sm mb-4 font-display">Legal</h4>
            <ul className="space-y-2.5">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link 
                    to={link.href} 
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Trust */}
          <div>
            <h4 className="font-bold text-foreground text-sm mb-4 font-display">Trust & Quality</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              All content is reviewed by our admin team to ensure quality and reliability.
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-6 border-t border-border">
          <p className="text-sm text-muted-foreground text-center flex items-center justify-center gap-1 font-medium">
            © {currentYear} UniVoid. Built with <Heart className="w-4 h-4 text-red-500 fill-red-500 inline" /> for students, by students.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
