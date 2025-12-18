import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Mail } from "lucide-react";

const Terms = () => {
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
              <FileText className="w-8 h-8 text-primary" />
            </div>
            <h1 className="font-display text-2xl md:text-3xl text-foreground mb-2">
              Terms of Use
            </h1>
            <p className="text-muted-foreground">
              Last updated: {currentDate}
            </p>
          </div>

          <Card className="shadow-premium-sm">
            <CardContent className="p-6 md:p-8 prose prose-sm max-w-none dark:prose-invert">
              <p className="text-muted-foreground leading-relaxed">
                By using UniVoid, you agree to these terms. Please read them carefully.
              </p>

              <h2 className="text-lg font-semibold text-foreground mt-8 mb-4">Acceptance of Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                By accessing or using UniVoid, you agree to be bound by these Terms of Use
                and our Privacy Policy. If you do not agree, please do not use the platform.
              </p>

              <h2 className="text-lg font-semibold text-foreground mt-8 mb-4">User Responsibilities</h2>
              <ul className="space-y-2 text-muted-foreground">
                <li>Users are responsible for all content they upload to UniVoid</li>
                <li>You must not upload copyrighted material without permission</li>
                <li>You must not upload harmful, offensive, or illegal content</li>
                <li>You must provide accurate information during registration</li>
                <li>You are responsible for maintaining the security of your account</li>
              </ul>

              <h2 className="text-lg font-semibold text-foreground mt-8 mb-4">Content Guidelines</h2>
              <ul className="space-y-2 text-muted-foreground">
                <li>All uploaded content must be relevant to educational purposes</li>
                <li>Content must not infringe on intellectual property rights</li>
                <li>Spam, advertisements, or promotional content is not allowed</li>
                <li>Content may be reviewed and removed at UniVoid's discretion</li>
              </ul>

              <h2 className="text-lg font-semibold text-foreground mt-8 mb-4">Disclaimer</h2>
              <p className="text-muted-foreground leading-relaxed">
                UniVoid is a platform for students to share educational resources.
                We do not guarantee the accuracy, completeness, or quality of user-generated content.
                UniVoid is not liable for any errors, omissions, or damages arising from the use of content shared on the platform.
              </p>

              <h2 className="text-lg font-semibold text-foreground mt-8 mb-4">Content Removal</h2>
              <p className="text-muted-foreground leading-relaxed">
                UniVoid reserves the right to remove any content that violates these terms,
                infringes on intellectual property, or is deemed inappropriate.
                Content may also be removed if required by law or policy.
              </p>

              <h2 className="text-lg font-semibold text-foreground mt-8 mb-4">Intellectual Property</h2>
              <p className="text-muted-foreground leading-relaxed">
                Users retain ownership of content they upload.
                By uploading content, you grant UniVoid a license to display and distribute
                the content on the platform for educational purposes.
              </p>

              <h2 className="text-lg font-semibold text-foreground mt-8 mb-4">Limitation of Liability</h2>
              <p className="text-muted-foreground leading-relaxed">
                UniVoid is provided "as is" without warranties of any kind.
                We are not liable for any indirect, incidental, or consequential damages
                arising from the use of the platform.
              </p>

              <h2 className="text-lg font-semibold text-foreground mt-8 mb-4">Changes to Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                UniVoid may update these terms at any time.
                Continued use of the platform after changes constitutes acceptance of the new terms.
              </p>

              <h2 className="text-lg font-semibold text-foreground mt-8 mb-4">Governing Law</h2>
              <p className="text-muted-foreground leading-relaxed">
                These terms are governed by the laws of India.
                Any disputes shall be resolved in the courts of India.
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

export default Terms;
