import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-secondary/50 border-t border-border mt-auto">
      <div className="container-wide py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">U</span>
              </div>
              <span className="font-semibold text-lg text-foreground">UniVoid</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Student-powered learning, made simple.
            </p>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-medium text-foreground mb-3 text-sm">Resources</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/materials" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Study Materials
                </Link>
              </li>
              <li>
                <Link to="/news" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  News
                </Link>
              </li>
              <li>
                <Link to="/blogs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Blogs
                </Link>
              </li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h4 className="font-medium text-foreground mb-3 text-sm">Community</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/books" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Book Exchange
                </Link>
              </li>
              <li>
                <Link to="/leaderboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Leaderboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-medium text-foreground mb-3 text-sm">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Privacy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Terms
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8">
          <p className="text-sm text-muted-foreground text-center">
            © {new Date().getFullYear()} UniVoid. Built by students, for students.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;