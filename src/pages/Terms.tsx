import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Mail, AlertTriangle, Users, BookOpen, Calendar, ShoppingBag, Briefcase, Shield } from "lucide-react";
import { Link } from "react-router-dom";

const Terms = () => {
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
                <p className="text-sm text-muted-foreground mt-4 p-3 bg-muted/30 rounded-lg">
                  UniVoid reserves the right to suspend or terminate accounts that violate these terms, 
                  contain false information, or are used for malicious purposes.
                </p>
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
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>You accept full responsibility for any consequences arising from your content</span>
                  </li>
                </ul>
              </section>

              {/* Study Materials */}
              <section>
                <h2 className="text-lg font-semibold text-foreground mb-4">4. Study Materials Disclaimer</h2>
                <div className="p-4 border border-border rounded-lg">
                  <p className="text-muted-foreground leading-relaxed mb-3">
                    Study materials shared on UniVoid are uploaded by users for educational purposes. UniVoid makes 
                    no representations or warranties regarding:
                  </p>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>The accuracy, completeness, or correctness of any material</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>The suitability of materials for any particular purpose or examination</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>Whether materials are up-to-date or aligned with current curricula</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>The academic integrity or originality of any content</span>
                    </li>
                  </ul>
                  <p className="text-sm text-muted-foreground mt-4">
                    <strong>Use study materials at your own discretion and risk.</strong> Always verify 
                    information from authoritative sources before relying on it for academic purposes.
                  </p>
                </div>
              </section>

              {/* Events */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">5. Events Disclaimer</h2>
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
                    <span>Misconduct by organizers, participants, or third parties</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Payment disputes between attendees and organizers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Any losses, damages, or disappointments arising from event attendance</span>
                  </li>
                </ul>
                <p className="text-sm text-muted-foreground mt-4">
                  All event-related queries, refunds, and complaints must be directed to the respective event organizer.
                </p>
              </section>

              {/* Book Exchange */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <ShoppingBag className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">6. Book Exchange Disclaimer</h2>
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
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Fraudulent listings or scams by users</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Any disputes arising from transactions between users</span>
                  </li>
                </ul>
                <p className="text-sm text-muted-foreground mt-4">
                  Users engage in book transactions at their own risk and should exercise due diligence.
                </p>
              </section>

              {/* Tasks and Projects */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Briefcase className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">7. Tasks and Projects Disclaimer</h2>
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
                <p className="text-sm text-muted-foreground mt-4 p-3 bg-muted/30 rounded-lg">
                  Users must exercise their own judgment when engaging in tasks or projects and are 
                  responsible for their own arrangements, agreements, and payments.
                </p>
              </section>

              {/* Account Actions */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">8. Account Suspension and Content Removal</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  UniVoid reserves the right to, without prior notice:
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Remove any content that violates these terms or applicable laws</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Suspend or terminate accounts involved in violations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Block users who engage in abusive, fraudulent, or harmful behavior</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Remove content upon valid legal requests or copyright claims</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Take any action we deem necessary to protect the platform and its users</span>
                  </li>
                </ul>
              </section>

              {/* Intellectual Property */}
              <section>
                <h2 className="text-lg font-semibold text-foreground mb-4">9. Intellectual Property</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  Users retain ownership of content they upload. However, by uploading content to UniVoid, 
                  you grant us a non-exclusive, royalty-free, worldwide license to:
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Display, distribute, and make the content available on the platform</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Create thumbnails and previews of uploaded materials</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Include content in search results and recommendations</span>
                  </li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  The UniVoid name, logo, and platform design are proprietary and may not be used without permission.
                </p>
              </section>

              {/* Prohibited Activities */}
              <section>
                <h2 className="text-lg font-semibold text-foreground mb-4">10. Prohibited Activities</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  You agree not to:
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Upload copyrighted material without proper authorization</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Share harmful, obscene, threatening, or illegal content</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Impersonate others or create fake accounts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Spam, harass, or abuse other users</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Attempt to hack, exploit, or compromise the platform</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Use automated tools to scrape or collect data</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Engage in any activity that violates applicable laws</span>
                  </li>
                </ul>
              </section>

              {/* Limitation of Liability */}
              <section>
                <h2 className="text-lg font-semibold text-foreground mb-4">11. Limitation of Liability</h2>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-muted-foreground leading-relaxed mb-3">
                    TO THE MAXIMUM EXTENT PERMITTED BY LAW:
                  </p>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>UniVoid is provided "AS IS" and "AS AVAILABLE" without warranties of any kind</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>We do not guarantee uninterrupted, error-free, or secure access to the platform</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>We are not liable for any direct, indirect, incidental, consequential, or punitive damages</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>We are not responsible for data loss, service interruptions, or third-party actions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>Our total liability shall not exceed the amount you paid us in the past 12 months, if any</span>
                    </li>
                  </ul>
                </div>
              </section>

              {/* Indemnification */}
              <section>
                <h2 className="text-lg font-semibold text-foreground mb-4">12. Indemnification</h2>
                <p className="text-muted-foreground leading-relaxed">
                  You agree to indemnify, defend, and hold harmless UniVoid, its operators, affiliates, and their 
                  respective officers, directors, employees, and agents from and against any claims, liabilities, 
                  damages, losses, and expenses (including legal fees) arising out of or in any way connected with 
                  your access to or use of the platform, your violation of these terms, or your infringement of 
                  any third-party rights.
                </p>
              </section>

              {/* Changes to Terms */}
              <section>
                <h2 className="text-lg font-semibold text-foreground mb-4">13. Changes to Terms</h2>
                <p className="text-muted-foreground leading-relaxed">
                  UniVoid reserves the right to modify these Terms and Conditions at any time. When we make 
                  significant changes, we will notify users through the platform or via email. The updated 
                  terms will be effective immediately upon posting. Continued use of UniVoid after changes 
                  constitutes acceptance of the modified terms. It is your responsibility to review these 
                  terms periodically.
                </p>
              </section>

              {/* Governing Law */}
              <section>
                <h2 className="text-lg font-semibold text-foreground mb-4">14. Governing Law and Jurisdiction</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  These Terms and Conditions are governed by and construed in accordance with the laws of India, 
                  including but not limited to:
                </p>
                <ul className="space-y-2 text-muted-foreground mb-4">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>The Information Technology Act, 2000</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>The Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>The Indian Contract Act, 1872</span>
                  </li>
                </ul>
                <p className="text-muted-foreground leading-relaxed">
                  Any disputes arising from these terms or use of UniVoid shall be subject to the exclusive 
                  jurisdiction of the courts in India.
                </p>
              </section>

              {/* Severability */}
              <section>
                <h2 className="text-lg font-semibold text-foreground mb-4">15. Severability</h2>
                <p className="text-muted-foreground leading-relaxed">
                  If any provision of these Terms is found to be invalid, illegal, or unenforceable by a court 
                  of competent jurisdiction, such invalidity shall not affect the validity of the remaining 
                  provisions, which shall continue in full force and effect.
                </p>
              </section>

              {/* Contact */}
              <section className="pt-6 border-t border-border">
                <h2 className="text-lg font-semibold text-foreground mb-4">Contact Us</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  For questions or concerns about these Terms and Conditions, please contact us:
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

export default Terms;
