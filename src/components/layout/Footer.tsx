import { Link } from "react-router-dom";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    platform: [
      { href: "/materials", label: "Study Materials" },
      { href: "/news", label: "News" },
      { href: "/blogs", label: "Blogs" },
      { href: "/books", label: "Book Exchange" },
    ],
    community: [
      { href: "/leaderboard", label: "Leaderboard" },
      { href: "/dashboard", label: "Dashboard" },
    ],
    legal: [
      { href: "/privacy-policy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms of Use" },
    ],
  };

  return (
    <footer className="border-t border-border/50 bg-secondary/30">
      <div className="container-wide py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">U</span>
              </div>
              <span className="font-display font-semibold text-lg text-foreground">UniVoid</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              A trusted student platform for learning, sharing, and growing together.
            </p>
          </div>

          {/* Platform Links */}
          <div>
            <h4 className="font-semibold text-foreground text-sm mb-4">Platform</h4>
            <ul className="space-y-2.5">
              {footerLinks.platform.map((link) => (
                <li key={link.href}>
                  <Link 
                    to={link.href} 
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Community Links */}
          <div>
            <h4 className="font-semibold text-foreground text-sm mb-4">Community</h4>
            <ul className="space-y-2.5">
              {footerLinks.community.map((link) => (
                <li key={link.href}>
                  <Link 
                    to={link.href} 
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="font-semibold text-foreground text-sm mb-4">Legal</h4>
            <ul className="space-y-2.5">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link 
                    to={link.href} 
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Trust */}
          <div>
            <h4 className="font-semibold text-foreground text-sm mb-4">Trust & Quality</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              All content is reviewed by our admin team to ensure quality and reliability.
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-6 border-t border-border/50">
          <p className="text-sm text-muted-foreground text-center">
            © {currentYear} UniVoid. Built for students, by students.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
