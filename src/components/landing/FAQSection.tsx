import { motion } from 'framer-motion';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { DoodleUnderline } from './DoodleElements';
import { HelpCircle, Sparkles } from 'lucide-react';

const faqs = [
  {
    question: "Is UniVoid really free?",
    answer: "Absolutely! UniVoid is 100% free for students. No hidden charges, no premium walls. We believe quality education resources should be accessible to everyone. Level up without spending a rupee."
  },
  {
    question: "Who can upload study materials?",
    answer: "Any verified student can contribute! Share your notes, PYQs, and resources to help your peers. All uploads go through admin review to ensure quality. Plus, you earn XP for every approved contribution."
  },
  {
    question: "How do I find materials for my specific branch/subject?",
    answer: "Use our smart filters! Browse by university, branch, semester, and subject. The search is sorted so you can find exactly what you need in seconds."
  },
  {
    question: "Are the event listings verified?",
    answer: "Yes! We only list events from verified organizers. No spam, no fake hackathons. Just real opportunities to level up your skills and network."
  },
  {
    question: "What is XP and how do I earn it?",
    answer: "XP is your UniVoid reputation score! Earn points by uploading materials, attending events, and helping the community. Climb the leaderboard and flex your rank. Top contributors get special recognition."
  },
  {
    question: "Can I create or host events on UniVoid?",
    answer: "Yes! Apply to become a verified organizer and start listing your college fests, hackathons, workshops, and more. Reach students across multiple campuses."
  }
];

export function FAQSection() {
  return (
    <section className="py-20 px-4 bg-secondary/30">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 mb-6"
          >
            <HelpCircle className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          </motion.div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Got <DoodleUnderline color="hsl(270 70% 60%)">Questions</DoodleUnderline>?
          </h2>
          <p className="text-muted-foreground text-lg">
            We've got answers. Everything you need to know about UniVoid.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <AccordionItem 
                  value={`item-${index}`}
                  className="bg-background border border-border/50 rounded-2xl px-6 shadow-sm hover:shadow-md transition-shadow data-[state=open]:shadow-lg data-[state=open]:border-primary/30"
                >
                  <AccordionTrigger className="text-left py-5 hover:no-underline group">
                    <span className="flex items-center gap-3 text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs text-primary font-bold">
                        {index + 1}
                      </span>
                      {faq.question}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-5 text-muted-foreground leading-relaxed pl-9">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="text-center mt-12"
        >
          <p className="text-muted-foreground flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-yellow-500" />
            Still have questions? Reach out on our Contact page!
          </p>
        </motion.div>
      </div>
    </section>
  );
}