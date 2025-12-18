import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Mail } from "lucide-react";

const PrivacyPolicy = () => {
  const currentDate = new Date().toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header onAuthClick={() => {}} />
      
      <main className="flex-1 py-10 md:py-14">
        <div className="container-wide max-w-4xl">
          {/* Header */}
          <div className="mb-10 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h1 className="font-display text-2xl md:text-3xl text-foreground mb-2">
              Privacy Policy
            </h1>
            <p className="text-muted-foreground">
              Last updated: {currentDate}
            </p>
          </div>

          <Card className="shadow-premium-sm">
            <CardContent className="p-6 md:p-8 prose prose-sm max-w-none dark:prose-invert">
              <p className="text-muted-foreground leading-relaxed">
                UniVoid respects your privacy and is committed to protecting user data.
                This policy explains how information is collected, used, and protected.
              </p>

              <h2 className="text-lg font-semibold text-foreground mt-8 mb-4">Information Collected</h2>
              <ul className="space-y-2 text-muted-foreground">
                <li>Name and email during registration</li>
                <li>Educational details provided by users</li>
                <li>User-generated content such as materials, blogs, news, and books</li>
                <li>Device, browser, IP address, and usage data</li>
                <li>Cookies for functionality, analytics, and advertising</li>
              </ul>

              <h2 className="text-lg font-semibold text-foreground mt-8 mb-4">Usage of Data</h2>
              <ul className="space-y-2 text-muted-foreground">
                <li>To operate and improve the UniVoid platform</li>
                <li>To display content and enable community features</li>
                <li>To serve advertisements using Google AdSense</li>
                <li>To comply with legal obligations</li>
              </ul>

              <h2 className="text-lg font-semibold text-foreground mt-8 mb-4">Google AdSense Disclosure</h2>
              <p className="text-muted-foreground leading-relaxed">
                Google and third-party vendors use cookies to serve ads based on user visits.
                Users may opt out of personalized advertising at{' '}
                <a 
                  href="https://adssettings.google.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  https://adssettings.google.com
                </a>
              </p>

              <h2 className="text-lg font-semibold text-foreground mt-8 mb-4">Data Sharing</h2>
              <p className="text-muted-foreground leading-relaxed">
                UniVoid does not sell personal data.
                Limited data may be shared with service providers or legal authorities if required.
              </p>

              <h2 className="text-lg font-semibold text-foreground mt-8 mb-4">Security</h2>
              <p className="text-muted-foreground leading-relaxed">
                Reasonable measures are taken to protect data, but absolute security is not guaranteed.
              </p>

              <h2 className="text-lg font-semibold text-foreground mt-8 mb-4">Children</h2>
              <p className="text-muted-foreground leading-relaxed">
                UniVoid does not knowingly collect data from children under 13.
              </p>

              <h2 className="text-lg font-semibold text-foreground mt-8 mb-4">User Rights (India IT Act, 2000)</h2>
              <p className="text-muted-foreground leading-relaxed">
                Users may request access, correction, or deletion of their data.
              </p>

              <h2 className="text-lg font-semibold text-foreground mt-8 mb-4">Contact</h2>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="w-4 h-4" />
                <a href="mailto:support@univoid.com" className="text-primary hover:underline">
                  support@univoid.com
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
