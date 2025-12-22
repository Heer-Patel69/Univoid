import { Card, CardContent } from "@/components/ui/card";
import { FileText, Mail, AlertTriangle, Users, BookOpen, Calendar, ShoppingBag, Briefcase, Shield } from "lucide-react";
import { Link } from "react-router-dom";

const Terms = () => {
  return (
    <div className="py-10 md:py-14">
      <div className="container-wide max-w-4xl">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-display text-2xl md:text-3xl text-foreground mb-2">
            Terms and Conditions
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
                Welcome to UniVoid. These Terms and Conditions govern your access to and use of our platform. 
                By creating an account, uploading content, or using any of our services, you agree to be bound 
                by these terms. If you do not agree with any part of these terms, you must not use UniVoid.
              </p>
            </section>

            {/* Platform Role - Critical Disclaimer */}
            <section className="p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-2">Important: Platform Role Disclaimer</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    <strong>UniVoid is solely a facilitator platform.</strong> All study materials, books, events, 
                    tasks, projects, news articles, and other content on this platform are created, uploaded, and 
                    managed entirely by users. UniVoid does not create, verify, endorse, or take responsibility for 
                    any user-generated content. UniVoid has no liability for user intent, uploaded content, copyright 
                    ownership, accuracy, legality, or any outcomes arising from the use of this platform.
                  </p>
                </div>
              </div>
            </section>

            {/* Acceptance of Terms */}
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-4">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                By accessing UniVoid, you confirm that:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>You are at least 16 years of age</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>You have read and understood these Terms and our <Link to="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>You agree to comply with all applicable laws and regulations</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>You will use the platform responsibly and in good faith</span>
                </li>
              </ul>
            </section>

            {/* Account Responsibilities */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">2. Account Responsibilities</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed mb-4">
                When you create an account on UniVoid, you are responsible for:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Providing accurate and truthful information during registration</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Maintaining the confidentiality of your login credentials</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>All activities that occur under your account</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Immediately notifying us of any unauthorized access or security breach</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Not sharing your account or credentials with others</span>
                </li>
              </ul>
            </section>

            {/* User-Generated Content */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">3. User-Generated Content</h2>
              </div>
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg mb-4">
                <p className="text-muted-foreground text-sm">
                  <strong className="text-foreground">Disclaimer:</strong> UniVoid does not verify, validate, or 
                  guarantee the accuracy, legality, or quality of any content uploaded by users. Users are 
                  solely responsible for all content they upload, share, or publish on the platform.
                </p>
              </div>
              <p className="text-muted-foreground leading-relaxed mb-4">
                When uploading content, you represent and warrant that:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>You own the content or have the necessary rights and permissions to share it</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>The content does not infringe any third-party intellectual property rights</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>The content is not harmful, offensive, defamatory, or illegal</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>The content does not contain malware, viruses, or harmful code</span>
                </li>
              </ul>
            </section>

            {/* Events */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">4. Events Disclaimer</h2>
              </div>
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg mb-4">
                <p className="text-muted-foreground text-sm">
                  <strong className="text-foreground">Critical Notice:</strong> UniVoid is NOT an event organizer. 
                  All events listed on the platform are created and managed by independent organizers who use 
                  UniVoid as a listing platform.
                </p>
              </div>
              <p className="text-muted-foreground leading-relaxed mb-4">
                UniVoid accepts no responsibility or liability for:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Event cancellations, postponements, or changes without notice</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Quality, safety, or conduct of events</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Any accidents, injuries, or incidents occurring at events</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Payment disputes between attendees and organizers</span>
                </li>
              </ul>
            </section>

            {/* Book Exchange */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <ShoppingBag className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">5. Book Exchange Disclaimer</h2>
              </div>
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg mb-4">
                <p className="text-muted-foreground text-sm">
                  <strong className="text-foreground">Important:</strong> UniVoid does not sell, purchase, or 
                  deliver books. The book exchange feature is a peer-to-peer listing service that connects 
                  buyers and sellers.
                </p>
              </div>
              <p className="text-muted-foreground leading-relaxed mb-4">
                UniVoid is not responsible for:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>The condition, authenticity, or quality of books listed</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Pricing disputes or negotiations between parties</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Payment processing, refunds, or financial transactions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Delivery, shipping, or logistics</span>
                </li>
              </ul>
            </section>

            {/* Tasks and Projects */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Briefcase className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">6. Tasks and Projects Disclaimer</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed mb-4">
                The tasks and projects features allow users to collaborate and seek assistance. UniVoid provides 
                the platform for these connections but:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Does not guarantee completion, quality, or outcomes of any task or project</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Does not verify the skills, qualifications, or reliability of users</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Does not process, guarantee, or handle payments between users</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Is not liable for any disputes, losses, or damages arising from collaborations</span>
                </li>
              </ul>
            </section>

            {/* Intellectual Property */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">7. Intellectual Property</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed mb-4">
                The UniVoid platform, including its logo, design, and proprietary features, is owned by UniVoid. 
                User-generated content remains the property of the respective users, but by uploading content, 
                you grant UniVoid a license to display and distribute it on the platform.
              </p>
            </section>

            {/* Contact */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Mail className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Contact Us</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                For any questions about these terms, please contact us at:{" "}
                <a href="mailto:univoid35@gmail.com" className="text-primary hover:underline font-medium">
                  univoid35@gmail.com
                </a>
              </p>
            </section>

            {/* Footer Links */}
            <div className="pt-6 border-t border-border">
              <p className="text-sm text-muted-foreground text-center">
                See also: <Link to="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link> | <Link to="/refund-policy" className="text-primary hover:underline">Refund Policy</Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Terms;