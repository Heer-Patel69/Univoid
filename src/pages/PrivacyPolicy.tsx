import { Card, CardContent } from "@/components/ui/card";
import { Shield, Mail, Database, Lock, Eye, UserCheck, Clock, Globe } from "lucide-react";
import { Link } from "react-router-dom";

const PrivacyPolicy = () => {
  return (
    <div className="py-10 md:py-14">
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

            {/* Data Security */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Lock className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">How We Protect Your Data</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We implement industry-standard security measures to protect your personal information:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Encryption of data in transit and at rest</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Secure authentication mechanisms</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Regular security audits and updates</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Access controls and monitoring</span>
                </li>
              </ul>
            </section>

            {/* Your Rights */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <UserCheck className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Your Rights</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed mb-4">
                You have the following rights regarding your personal data:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span><strong>Access:</strong> Request a copy of your personal data</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span><strong>Correction:</strong> Request correction of inaccurate data</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span><strong>Deletion:</strong> Request deletion of your account and data</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span><strong>Portability:</strong> Request your data in a portable format</span>
                </li>
              </ul>
            </section>

            {/* Contact */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Mail className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Contact Us</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                For any privacy-related queries or to exercise your rights, please contact us at:{" "}
                <a href="mailto:support@univoid.in" className="text-primary hover:underline font-medium">
                  support@univoid.in
                </a>
              </p>
            </section>

            {/* Footer Links */}
            <div className="pt-6 border-t border-border">
              <p className="text-sm text-muted-foreground text-center">
                See also: <Link to="/terms" className="text-primary hover:underline">Terms and Conditions</Link> | <Link to="/refund-policy" className="text-primary hover:underline">Refund Policy</Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PrivacyPolicy;