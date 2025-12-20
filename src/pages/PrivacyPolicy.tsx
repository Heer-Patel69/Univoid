import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Mail, Database, Lock, Eye, UserCheck, Clock, Globe } from "lucide-react";
import { Link } from "react-router-dom";

const PrivacyPolicy = () => {
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
              Version 2.0 | Effective Date: 20 December 2024
            </p>
          </div>

          <Card className="shadow-premium-sm">
            <CardContent className="p-6 md:p-8 space-y-8">
              {/* Introduction */}
              <section>
                <p className="text-muted-foreground leading-relaxed">
                  Welcome to UniVoid. Your privacy matters to us. This Privacy Policy explains in detail how we collect, 
                  use, store, and protect your personal information when you use our platform. By accessing or using UniVoid, 
                  you acknowledge that you have read and understood this policy.
                </p>
                <div className="mt-4 p-4 bg-primary/5 rounded-lg border border-primary/10">
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">Important:</strong> UniVoid operates as a facilitator platform. 
                    All materials, books, events, tasks, projects, and other content are uploaded and managed by users. 
                    UniVoid does not create, verify, or take responsibility for user-generated content.
                  </p>
                </div>
              </section>

              {/* Who We Are */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Globe className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">Who Operates UniVoid</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  UniVoid is an online student platform operated from India, designed to facilitate educational resource 
                  sharing, event discovery, project collaboration, and peer-to-peer book exchange among students.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  For any privacy-related queries, you can reach us at:{" "}
                  <a href="mailto:support@univoid.in" className="text-primary hover:underline font-medium">
                    support@univoid.in
                  </a>
                </p>
              </section>

              {/* What Data We Collect */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Database className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">What Personal Data We Collect</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  We collect different types of information to provide and improve our services:
                </p>
                
                <div className="space-y-4">
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <h3 className="font-medium text-foreground mb-2">Account Information</h3>
                    <ul className="space-y-1.5 text-sm text-muted-foreground list-disc list-inside">
                      <li>Full name and email address (required for registration)</li>
                      <li>Mobile number (optional, for account recovery and notifications)</li>
                      <li>Profile photograph (optional)</li>
                      <li>Password (stored in encrypted format)</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-muted/30 rounded-lg">
                    <h3 className="font-medium text-foreground mb-2">Educational Information</h3>
                    <ul className="space-y-1.5 text-sm text-muted-foreground list-disc list-inside">
                      <li>College or university name</li>
                      <li>Course, branch, and year of study</li>
                      <li>State and city of residence</li>
                      <li>Academic interests and preferences</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-muted/30 rounded-lg">
                    <h3 className="font-medium text-foreground mb-2">User-Generated Content</h3>
                    <ul className="space-y-1.5 text-sm text-muted-foreground list-disc list-inside">
                      <li>Study materials, documents, and files you upload</li>
                      <li>Book listings and descriptions</li>
                      <li>Event registrations and participation data</li>
                      <li>Project information and task requests</li>
                      <li>News articles and blog posts</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-muted/30 rounded-lg">
                    <h3 className="font-medium text-foreground mb-2">Technical & Usage Data</h3>
                    <ul className="space-y-1.5 text-sm text-muted-foreground list-disc list-inside">
                      <li>IP address and approximate location</li>
                      <li>Device type, operating system, and browser information</li>
                      <li>Pages visited, features used, and time spent on platform</li>
                      <li>Search queries and interaction patterns</li>
                      <li>Error logs and performance data</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* When Data is Collected */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">When We Collect Your Data</h2>
                </div>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span><strong>Account Creation:</strong> When you sign up and create your profile</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span><strong>Profile Updates:</strong> When you edit your personal or educational details</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span><strong>Content Upload:</strong> When you share materials, list books, or create events</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span><strong>Platform Usage:</strong> Automatically during your browsing and interaction with features</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span><strong>Communications:</strong> When you contact our support team or provide feedback</span>
                  </li>
                </ul>
              </section>

              {/* Why We Collect Data */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Eye className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">Why We Collect Your Data</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  We use your information for the following purposes:
                </p>
                <div className="grid gap-3">
                  <div className="flex items-start gap-3 p-3 bg-muted/20 rounded-lg">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-primary text-sm font-bold">1</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground text-sm">Platform Operation</h4>
                      <p className="text-xs text-muted-foreground">To create and manage your account, authenticate your identity, and provide access to features</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-muted/20 rounded-lg">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-primary text-sm font-bold">2</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground text-sm">Personalization</h4>
                      <p className="text-xs text-muted-foreground">To recommend relevant materials, scholarships, and events based on your profile and interests</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-muted/20 rounded-lg">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-primary text-sm font-bold">3</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground text-sm">Communication</h4>
                      <p className="text-xs text-muted-foreground">To send important updates, notifications, deadline reminders, and respond to your queries</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-muted/20 rounded-lg">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-primary text-sm font-bold">4</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground text-sm">Security & Safety</h4>
                      <p className="text-xs text-muted-foreground">To detect fraud, prevent abuse, and maintain the safety of our community</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-muted/20 rounded-lg">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-primary text-sm font-bold">5</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground text-sm">Analytics & Improvement</h4>
                      <p className="text-xs text-muted-foreground">To understand usage patterns and improve platform performance and features</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Legal Basis */}
              <section>
                <h2 className="text-lg font-semibold text-foreground mb-4">Legal Basis for Processing</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Under applicable data protection laws, we process your data based on the following legal grounds:
                </p>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">Contract:</span>
                    <span>Processing necessary to provide you with our services as agreed when you create an account</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">Consent:</span>
                    <span>When you explicitly agree to specific processing, such as receiving marketing communications</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">Legitimate Interest:</span>
                    <span>For platform security, fraud prevention, and improving our services while respecting your rights</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">Legal Obligation:</span>
                    <span>When required to comply with applicable laws and regulations</span>
                  </li>
                </ul>
              </section>

              {/* Cookies */}
              <section>
                <h2 className="text-lg font-semibold text-foreground mb-4">Cookies and Tracking Technologies</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  We use cookies and similar technologies to enhance your experience:
                </p>
                <div className="space-y-3">
                  <div className="p-3 border border-border rounded-lg">
                    <h4 className="font-medium text-foreground text-sm">Essential Cookies</h4>
                    <p className="text-xs text-muted-foreground mt-1">Required for basic platform functionality like authentication and security</p>
                  </div>
                  <div className="p-3 border border-border rounded-lg">
                    <h4 className="font-medium text-foreground text-sm">Preference Cookies</h4>
                    <p className="text-xs text-muted-foreground mt-1">Remember your settings like theme preference and language</p>
                  </div>
                  <div className="p-3 border border-border rounded-lg">
                    <h4 className="font-medium text-foreground text-sm">Analytics Cookies</h4>
                    <p className="text-xs text-muted-foreground mt-1">Help us understand how users interact with our platform</p>
                  </div>
                  <div className="p-3 border border-border rounded-lg">
                    <h4 className="font-medium text-foreground text-sm">Advertising Cookies</h4>
                    <p className="text-xs text-muted-foreground mt-1">Used by Google AdSense to serve relevant advertisements</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  You can manage cookie preferences through your browser settings. Note that disabling certain cookies 
                  may affect platform functionality.
                </p>
              </section>

              {/* Google AdSense */}
              <section>
                <h2 className="text-lg font-semibold text-foreground mb-4">Google AdSense Disclosure</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  UniVoid uses Google AdSense to display advertisements. Google and its partners may use cookies to 
                  serve ads based on your prior visits to our platform and other websites.
                </p>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  You can opt out of personalized advertising by visiting{" "}
                  <a 
                    href="https://adssettings.google.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Google's Ad Settings
                  </a>
                  {" "}or{" "}
                  <a 
                    href="https://optout.aboutads.info" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    aboutads.info
                  </a>.
                </p>
              </section>

              {/* Data Retention */}
              <section>
                <h2 className="text-lg font-semibold text-foreground mb-4">Data Storage and Retention</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  We retain your data only as long as necessary for the purposes described:
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span><strong>Account Data:</strong> Retained while your account is active and for 30 days after deletion request</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span><strong>Uploaded Content:</strong> Retained until you delete it or request removal</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span><strong>Usage Logs:</strong> Retained for up to 12 months for security and analytics</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span><strong>Legal Records:</strong> Retained as required by applicable laws</span>
                  </li>
                </ul>
              </section>

              {/* Data Security */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Lock className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">Data Security Measures</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  We implement appropriate technical and organizational measures to protect your data:
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Encrypted data transmission using HTTPS/SSL protocols</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Secure password hashing and storage</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Regular security assessments and monitoring</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Access controls and authentication mechanisms</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Secure cloud infrastructure with data backup</span>
                  </li>
                </ul>
                <p className="text-sm text-muted-foreground mt-4 p-3 bg-muted/30 rounded-lg">
                  While we take security seriously, no method of transmission over the internet is 100% secure. 
                  We cannot guarantee absolute security of your data.
                </p>
              </section>

              {/* Data Sharing */}
              <section>
                <h2 className="text-lg font-semibold text-foreground mb-4">Data Sharing and Disclosure</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  UniVoid does not sell your personal data. We may share data in limited circumstances:
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span><strong>Service Providers:</strong> Third-party services that help us operate the platform (hosting, analytics, email)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span><strong>Legal Requirements:</strong> When required by law, court order, or government authority</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span><strong>Safety & Protection:</strong> To protect the rights, safety, or property of UniVoid and its users</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span><strong>With Your Consent:</strong> When you explicitly authorize us to share your data</span>
                  </li>
                </ul>
              </section>

              {/* User Rights */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <UserCheck className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">Your Rights</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Under the Information Technology Act, 2000 and applicable data protection regulations, you have the following rights:
                </p>
                <div className="grid gap-3">
                  <div className="p-3 border border-border rounded-lg">
                    <h4 className="font-medium text-foreground text-sm">Right to Access</h4>
                    <p className="text-xs text-muted-foreground mt-1">Request a copy of the personal data we hold about you</p>
                  </div>
                  <div className="p-3 border border-border rounded-lg">
                    <h4 className="font-medium text-foreground text-sm">Right to Correction</h4>
                    <p className="text-xs text-muted-foreground mt-1">Request correction of inaccurate or incomplete data</p>
                  </div>
                  <div className="p-3 border border-border rounded-lg">
                    <h4 className="font-medium text-foreground text-sm">Right to Deletion</h4>
                    <p className="text-xs text-muted-foreground mt-1">Request deletion of your account and associated data</p>
                  </div>
                  <div className="p-3 border border-border rounded-lg">
                    <h4 className="font-medium text-foreground text-sm">Right to Object</h4>
                    <p className="text-xs text-muted-foreground mt-1">Object to certain processing activities like marketing</p>
                  </div>
                  <div className="p-3 border border-border rounded-lg">
                    <h4 className="font-medium text-foreground text-sm">Right to Portability</h4>
                    <p className="text-xs text-muted-foreground mt-1">Request your data in a structured, machine-readable format</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  To exercise any of these rights, contact us at{" "}
                  <a href="mailto:support@univoid.in" className="text-primary hover:underline">
                    support@univoid.in
                  </a>
                  . We will respond within 30 days.
                </p>
              </section>

              {/* Age Requirement */}
              <section>
                <h2 className="text-lg font-semibold text-foreground mb-4">Age Requirements</h2>
                <p className="text-muted-foreground leading-relaxed">
                  UniVoid is intended for users aged 16 years and above. We do not knowingly collect personal 
                  information from users under 16. If you are under 16, please do not use this platform or 
                  provide any personal information. If we become aware that we have collected data from a 
                  user under 16, we will take steps to delete such information promptly.
                </p>
              </section>

              {/* Policy Updates */}
              <section>
                <h2 className="text-lg font-semibold text-foreground mb-4">Changes to This Policy</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We may update this Privacy Policy from time to time to reflect changes in our practices, 
                  technology, or legal requirements. When we make significant changes, we will notify you 
                  through the platform or via email. The "Effective Date" at the top indicates when this 
                  policy was last updated. Continued use of UniVoid after changes constitutes acceptance 
                  of the updated policy.
                </p>
              </section>

              {/* Contact */}
              <section className="pt-6 border-t border-border">
                <h2 className="text-lg font-semibold text-foreground mb-4">Contact Us</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, 
                  please contact us:
                </p>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="w-4 h-4 text-primary" />
                  <a href="mailto:support@univoid.in" className="text-primary hover:underline font-medium">
                    support@univoid.in
                  </a>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  You may also reach us through our{" "}
                  <Link to="/contact" className="text-primary hover:underline">Contact Page</Link>.
                </p>
              </section>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
