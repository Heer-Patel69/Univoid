import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, isCorsPreflightRequest, handleCorsPreflightRequest } from "../_shared/cors.ts";

const SITE_URL = "https://univoid.tech";
const DEFAULT_OG_IMAGE = "https://univoid.tech/images/univoid-og.jpg";

/**
 * Convert a stored "bucket:path" value to a publicly accessible image URL
 * via the image-proxy edge function.
 */
function toPublicImageUrl(storedValue: string | null | undefined): string | null {
  if (!storedValue) return null;

  // Already a full URL (external or legacy)
  if (storedValue.startsWith('http://') || storedValue.startsWith('https://')) {
    return storedValue;
  }

  // "bucket:path" format → proxy through image-proxy edge function
  const colonIdx = storedValue.indexOf(':');
  if (colonIdx > 0) {
    const bucket = storedValue.substring(0, colonIdx);
    const path = storedValue.substring(colonIdx + 1);
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const params = new URLSearchParams({ bucket, path });
    return `${supabaseUrl}/functions/v1/image-proxy?${params.toString()}`;
  }

  return null;
}

// Bot User-Agent detection patterns
const BOT_PATTERNS = [
  'googlebot',
  'bingbot',
  'slurp',
  'duckduckbot',
  'baiduspider',
  'yandexbot',
  'facebookexternalhit',
  'facebot',
  'twitterbot',
  'linkedinbot',
  'pinterest',
  'slackbot',
  'whatsapp',
  'telegrambot',
  'discordbot',
  'applebot',
  'rogerbot',
  'embedly',
  'quora link preview',
  'outbrain',
  'showyoubot',
  'vkshare',
  'w3c_validator',
  'redditbot',
];

function isBot(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  return BOT_PATTERNS.some(pattern => ua.includes(pattern));
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

function truncate(text: string, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

function formatDate(dateString: string): string {
  try {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch {
    return dateString;
  }
}

// Type definitions for database records
interface Material {
  id: string;
  title: string;
  description: string | null;
  subject: string | null;
  course: string | null;
  branch: string | null;
  thumbnail_url: string | null;
  downloads_count: number;
  views_count: number;
  created_at: string;
  updated_at: string;
}

interface Event {
  id: string;
  title: string;
  description: string | null;
  category: string;
  start_date: string;
  end_date: string | null;
  venue_name: string | null;
  venue_address: string | null;
  flyer_url: string | null;
  is_paid: boolean;
  price: number | null;
  registrations_count: number;
  slug: string | null;
}

interface Book {
  id: string;
  title: string;
  description: string | null;
  author: string | null;
  category: string | null;
  condition: string | null;
  price: number | null;
  is_sold: boolean;
  image_urls: string[] | null;
}

interface Project {
  id: string;
  title: string;
  description: string | null;
  skills_required: string[] | null;
  max_members: number | null;
  is_open: boolean;
  created_at: string;
  updated_at: string;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  task_type: string;
  subject: string | null;
  budget: number | null;
  deadline: string | null;
  status: string | null;
  created_at: string;
}

interface Profile {
  id: string;
  full_name: string;
  college_name: string | null;
  branch: string | null;
  total_xp: number;
  profile_photo_url: string | null;
}

function generateHTML(data: {
  title: string;
  description: string;
  image: string;
  url: string;
  type: string;
  content: string;
  structuredData?: Record<string, unknown>;
}): string {
  const { title, description, image, url, type, content, structuredData } = data;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(truncate(description, 160))}">
  
  <!-- Open Graph -->
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(truncate(description, 160))}">
  <meta property="og:image" content="${escapeHtml(image)}">
  <meta property="og:url" content="${escapeHtml(url)}">
  <meta property="og:type" content="${escapeHtml(type)}">
  <meta property="og:site_name" content="UniVoid">
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(truncate(description, 160))}">
  <meta name="twitter:image" content="${escapeHtml(image)}">
  <meta name="twitter:site" content="@UniVoid">
  
  <!-- Canonical URL -->
  <link rel="canonical" href="${escapeHtml(url)}">
  
  ${structuredData ? `<script type="application/ld+json">${JSON.stringify(structuredData)}</script>` : ''}
  
  <!-- Redirect to SPA after a short delay for actual users -->
  <noscript>
    <meta http-equiv="refresh" content="0;url=${escapeHtml(url)}">
  </noscript>
</head>
<body>
  <main>
    ${content}
  </main>
  <script>
    // Redirect actual users to the SPA
    window.location.replace("${url}");
  </script>
</body>
</html>`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleMaterial(supabase: any, id: string) {
  const { data, error } = await supabase
    .from('materials')
    .select('*')
    .eq('id', id)
    .eq('status', 'approved')
    .single();

  if (error || !data) {
    console.log('Material not found:', id, error);
    return null;
  }

  const material = data as Material;
  const title = `${material.title} | Study Materials | UniVoid`;
  const description = material.description || `Download ${material.title} - ${material.subject || 'Study Material'} for ${material.course || 'students'}. Free PDF notes, study materials and resources on UniVoid.`;
  const image = material.thumbnail_url || DEFAULT_OG_IMAGE;
  const url = `${SITE_URL}/materials/${id}`;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "DigitalDocument",
    "name": material.title,
    "description": description,
    "url": url,
    "image": image,
    "datePublished": material.created_at,
    "dateModified": material.updated_at,
    "provider": {
      "@type": "Organization",
      "name": "UniVoid",
      "url": SITE_URL
    },
    "audience": {
      "@type": "EducationalAudience",
      "educationalRole": "student"
    },
    ...(material.subject && { "about": material.subject }),
    ...(material.course && { "educationalLevel": material.course })
  };

  const content = `
    <article>
      <h1>${escapeHtml(material.title)}</h1>
      <p>${escapeHtml(description)}</p>
      ${material.subject ? `<p>Subject: ${escapeHtml(material.subject)}</p>` : ''}
      ${material.course ? `<p>Course: ${escapeHtml(material.course)}</p>` : ''}
      ${material.branch ? `<p>Branch: ${escapeHtml(material.branch)}</p>` : ''}
      <p>Downloads: ${material.downloads_count || 0}</p>
      <p>Views: ${material.views_count || 0}</p>
      <a href="${url}">View and Download on UniVoid</a>
    </article>
  `;

  return generateHTML({ title, description, image, url, type: 'article', content, structuredData });
}

// ==========================================================================
// Programmatic /study-materials/* pages
// ==========================================================================

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function titleCase(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map(w => (w.length <= 3 ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ');
}

// Postgres expression that matches slugified column value
const SLUG_EXPR = (col: string) =>
  `regexp_replace(regexp_replace(lower(${col}), '[^a-z0-9]+', '-', 'g'), '^-+|-+$', '', 'g')`;

interface MaterialRow {
  id: string;
  title: string;
  subject: string | null;
  course: string | null;
  branch: string | null;
  college: string | null;
  downloads_count: number;
  views_count: number;
  created_at: string;
  updated_at: string;
}

function buildFaqLdJson(faqs: Array<{ q: string; a: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(({ q, a }) => ({
      "@type": "Question",
      "name": q,
      "acceptedAnswer": { "@type": "Answer", "text": a },
    })),
  };
}

function buildBreadcrumbLdJson(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((it, idx) => ({
      "@type": "ListItem",
      "position": idx + 1,
      "name": it.name,
      "item": it.url,
    })),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleStudyMaterialsHub(supabase: any) {
  // Top colleges + subjects by material count
  const { data: rows } = await supabase
    .from('materials')
    .select('college, subject')
    .eq('status', 'approved')
    .limit(2000);

  const collegeCounts = new Map<string, number>();
  const subjectCounts = new Map<string, number>();
  for (const r of (rows ?? []) as Array<{ college: string | null; subject: string | null }>) {
    if (r.college) collegeCounts.set(r.college, (collegeCounts.get(r.college) ?? 0) + 1);
    if (r.subject) subjectCounts.set(r.subject, (subjectCounts.get(r.subject) ?? 0) + 1);
  }
  const topColleges = [...collegeCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 24);
  const topSubjects = [...subjectCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 24);
  const totalMaterials = (rows ?? []).length;

  const title = "Free Study Materials, Notes & Previous Year Papers PDF | UniVoid";
  const description = "Download free engineering & college notes, previous year question papers and study material PDFs. Verified by students across 100+ Indian universities on UniVoid.";
  const url = `${SITE_URL}/study-materials`;

  const faqs = [
    { q: "How do I download study materials on UniVoid?", a: "Browse by your college, branch or subject, open any material page and click download. All PDFs are free and verified by students." },
    { q: "Are these previous year question papers official?", a: "Papers are uploaded by seniors and verified by moderators before publishing. They mirror official university papers but are unofficial community copies." },
    { q: "Is UniVoid free for students?", a: "Yes. Downloading notes, papers and study material is completely free for verified college students in India." },
    { q: "Which universities are covered?", a: "UniVoid hosts materials from 100+ Indian universities including AKTU, VTU, Anna University, IPU, Mumbai University, JNTUH, RGPV and KTU." },
  ];

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "name": title,
        "description": description,
        "url": url,
      },
      buildBreadcrumbLdJson([
        { name: "UniVoid", url: SITE_URL },
        { name: "Study Materials", url },
      ]),
      buildFaqLdJson(faqs),
    ],
  };

  const content = `
    <article>
      <h1>Free Study Materials, Notes &amp; Previous Year Papers</h1>
      <p>Download free college and engineering study materials, previous year question papers and semester notes as PDF. UniVoid hosts <strong>${totalMaterials.toLocaleString('en-IN')}+ verified resources</strong> across 100+ Indian universities, uploaded and reviewed by senior students.</p>

      <h2>Browse Study Materials by College</h2>
      <ul>
        ${topColleges.map(([name, count]) => `<li><a href="${SITE_URL}/study-materials/college/${slugify(name)}">${escapeHtml(name)}</a> — ${count} materials</li>`).join('\n        ')}
      </ul>

      <h2>Popular Subjects</h2>
      <ul>
        ${topSubjects.map(([name, count]) => `<li><a href="${SITE_URL}/study-materials/subject/${slugify(name)}">${escapeHtml(name)} notes &amp; papers</a> — ${count} resources</li>`).join('\n        ')}
      </ul>

      <h2>What You'll Find on UniVoid Study Materials</h2>
      <h3>Previous Year Question Papers</h3>
      <p>End-semester and mid-semester question papers from the last 5 years, organized by university, branch and subject.</p>
      <h3>Semester Notes (PDF)</h3>
      <p>Handwritten and typed notes covering full syllabus units, contributed by top-scoring seniors.</p>
      <h3>Solved Question Banks</h3>
      <p>Frequently repeated questions with worked-out solutions, ideal for last-minute revision.</p>

      <h2>Frequently Asked Questions</h2>
      ${faqs.map(f => `<h3>${escapeHtml(f.q)}</h3><p>${escapeHtml(f.a)}</p>`).join('\n      ')}
    </article>
  `;

  return generateHTML({ title, description, image: DEFAULT_OG_IMAGE, url, type: 'website', content, structuredData });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleStudyMaterialsCollege(supabase: any, collegeSlug: string) {
  const { data: all } = await supabase
    .from('materials')
    .select('id, title, subject, course, branch, college, downloads_count, views_count, created_at, updated_at')
    .eq('status', 'approved')
    .not('college', 'is', null)
    .limit(2000);

  const materials = ((all ?? []) as MaterialRow[]).filter(m => m.college && slugify(m.college) === collegeSlug);
  if (materials.length < 3) return null;

  const collegeName = materials[0].college || titleCase(collegeSlug);
  const url = `${SITE_URL}/study-materials/college/${collegeSlug}`;
  const title = `${collegeName} Study Materials, Notes & Previous Year Papers PDF | UniVoid`;
  const description = `Download ${collegeName} previous year question papers, semester notes and study materials as free PDFs. ${materials.length}+ verified resources on UniVoid.`;

  // Group by subject
  const bySubject = new Map<string, MaterialRow[]>();
  for (const m of materials) {
    const key = m.subject || 'General';
    if (!bySubject.has(key)) bySubject.set(key, []);
    bySubject.get(key)!.push(m);
  }
  const subjectGroups = [...bySubject.entries()].sort((a, b) => b[1].length - a[1].length);

  const faqs = [
    { q: `How do I download ${collegeName} question papers?`, a: `Open any material below and click download. All ${collegeName} PDFs are free and require no signup wall.` },
    { q: `Are these ${collegeName} papers official?`, a: `Papers are contributed by ${collegeName} seniors and verified by moderators. They mirror official papers but are community copies.` },
    { q: `How many ${collegeName} resources are available?`, a: `Currently ${materials.length} approved materials across ${subjectGroups.length} subjects, updated regularly.` },
  ];

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "name": title,
        "description": description,
        "url": url,
        "about": { "@type": "CollegeOrUniversity", "name": collegeName },
      },
      buildBreadcrumbLdJson([
        { name: "UniVoid", url: SITE_URL },
        { name: "Study Materials", url: `${SITE_URL}/study-materials` },
        { name: collegeName, url },
      ]),
      {
        "@type": "ItemList",
        "itemListElement": subjectGroups.slice(0, 25).map(([subj, items], idx) => ({
          "@type": "ListItem",
          "position": idx + 1,
          "name": `${collegeName} ${subj} notes and papers`,
          "url": `${SITE_URL}/study-materials/${collegeSlug}/${slugify(subj)}`,
          "additionalProperty": { "@type": "PropertyValue", "name": "count", "value": items.length },
        })),
      },
      buildFaqLdJson(faqs),
    ],
  };

  const content = `
    <article>
      <h1>${escapeHtml(collegeName)} Study Materials &amp; Previous Year Papers</h1>
      <p>Download free ${escapeHtml(collegeName)} previous year question papers, semester notes and study material PDFs. <strong>${materials.length} verified resources</strong> across ${subjectGroups.length} subjects, contributed by ${escapeHtml(collegeName)} seniors on UniVoid.</p>

      <h2>${escapeHtml(collegeName)} Subjects</h2>
      <ul>
        ${subjectGroups.map(([subj, items]) => `<li><a href="${SITE_URL}/study-materials/${collegeSlug}/${slugify(subj)}">${escapeHtml(subj)}</a> — ${items.length} PDFs</li>`).join('\n        ')}
      </ul>

      <h2>Latest ${escapeHtml(collegeName)} Uploads</h2>
      <ul>
        ${materials.slice(0, 20).map(m => `<li><a href="${SITE_URL}/materials/${m.id}">${escapeHtml(m.title)}</a>${m.subject ? ` — ${escapeHtml(m.subject)}` : ''}</li>`).join('\n        ')}
      </ul>

      <h2>Frequently Asked Questions</h2>
      ${faqs.map(f => `<h3>${escapeHtml(f.q)}</h3><p>${escapeHtml(f.a)}</p>`).join('\n      ')}
    </article>
  `;

  return generateHTML({ title, description, image: DEFAULT_OG_IMAGE, url, type: 'website', content, structuredData });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleStudyMaterialsSubject(supabase: any, subjectSlug: string) {
  const { data: all } = await supabase
    .from('materials')
    .select('id, title, subject, course, branch, college, downloads_count, views_count, created_at, updated_at')
    .eq('status', 'approved')
    .not('subject', 'is', null)
    .limit(2000);

  const materials = ((all ?? []) as MaterialRow[]).filter(m => m.subject && slugify(m.subject) === subjectSlug);
  if (materials.length < 3) return null;

  const subjectName = materials[0].subject || titleCase(subjectSlug);
  const url = `${SITE_URL}/study-materials/subject/${subjectSlug}`;
  const title = `${subjectName} Notes, Question Papers & Study Material PDF | UniVoid`;
  const description = `Download ${subjectName} notes, previous year question papers and solved question banks as free PDFs. ${materials.length}+ resources from top Indian universities on UniVoid.`;

  const byCollege = new Map<string, MaterialRow[]>();
  for (const m of materials) {
    const key = m.college || 'Other';
    if (!byCollege.has(key)) byCollege.set(key, []);
    byCollege.get(key)!.push(m);
  }
  const collegeGroups = [...byCollege.entries()].sort((a, b) => b[1].length - a[1].length);

  const faqs = [
    { q: `Where can I find ${subjectName} previous year papers?`, a: `Below on this page — UniVoid aggregates ${materials.length} ${subjectName} papers and notes from top Indian universities, all free to download.` },
    { q: `Are these ${subjectName} notes complete?`, a: `Yes, notes cover the full syllabus across units. They're contributed by top-scoring seniors and moderator-verified.` },
    { q: `Can I download ${subjectName} PDFs for free?`, a: `Yes. Every material on UniVoid is free for verified college students. No paywall.` },
  ];

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "LearningResource",
        "name": title,
        "description": description,
        "url": url,
        "learningResourceType": "Study Guide",
        "educationalLevel": "Undergraduate",
        "about": subjectName,
      },
      buildBreadcrumbLdJson([
        { name: "UniVoid", url: SITE_URL },
        { name: "Study Materials", url: `${SITE_URL}/study-materials` },
        { name: subjectName, url },
      ]),
      buildFaqLdJson(faqs),
    ],
  };

  const content = `
    <article>
      <h1>${escapeHtml(subjectName)} Notes &amp; Previous Year Papers (PDF)</h1>
      <p>${escapeHtml(subjectName)} is a core undergraduate subject across engineering and science branches in Indian universities. Download <strong>${materials.length} verified ${escapeHtml(subjectName)} resources</strong> — semester notes, previous year question papers and solved question banks — free on UniVoid.</p>

      <h2>${escapeHtml(subjectName)} Resources by University</h2>
      <ul>
        ${collegeGroups.map(([college, items]) => `<li><a href="${SITE_URL}/study-materials/${slugify(college)}/${subjectSlug}">${escapeHtml(college)} ${escapeHtml(subjectName)}</a> — ${items.length} PDFs</li>`).join('\n        ')}
      </ul>

      <h2>How to Prepare for ${escapeHtml(subjectName)} Exams</h2>
      <h3>Analyze last 5 years of papers</h3>
      <p>Repeated questions typically account for 30-40% of the paper. Start with the previous year papers linked below.</p>
      <h3>Read topic-wise notes</h3>
      <p>Use senior-contributed notes to cover full syllabus units, then move to question banks.</p>
      <h3>Solve question banks with answers</h3>
      <p>Solved question banks accelerate revision in the last 2 weeks before exams.</p>

      <h2>Latest ${escapeHtml(subjectName)} Uploads</h2>
      <ul>
        ${materials.slice(0, 20).map(m => `<li><a href="${SITE_URL}/materials/${m.id}">${escapeHtml(m.title)}</a>${m.college ? ` — ${escapeHtml(m.college)}` : ''}</li>`).join('\n        ')}
      </ul>

      <h2>Frequently Asked Questions</h2>
      ${faqs.map(f => `<h3>${escapeHtml(f.q)}</h3><p>${escapeHtml(f.a)}</p>`).join('\n      ')}
    </article>
  `;

  return generateHTML({ title, description, image: DEFAULT_OG_IMAGE, url, type: 'website', content, structuredData });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleStudyMaterialsLeaf(supabase: any, collegeSlug: string, subjectSlug: string) {
  const { data: all } = await supabase
    .from('materials')
    .select('id, title, subject, course, branch, college, downloads_count, views_count, created_at, updated_at')
    .eq('status', 'approved')
    .not('college', 'is', null)
    .not('subject', 'is', null)
    .limit(2000);

  const materials = ((all ?? []) as MaterialRow[]).filter(m =>
    m.college && m.subject &&
    slugify(m.college) === collegeSlug &&
    slugify(m.subject) === subjectSlug
  );
  if (materials.length < 3) return null;

  const collegeName = materials[0].college!;
  const subjectName = materials[0].subject!;
  const url = `${SITE_URL}/study-materials/${collegeSlug}/${subjectSlug}`;
  const title = `${collegeName} ${subjectName} Notes & Papers PDF | UniVoid`.slice(0, 60);
  const description = `Download ${collegeName} ${subjectName} previous year question papers and notes as free PDFs. ${materials.length} verified resources on UniVoid.`;

  const faqs = [
    { q: `How do I download ${collegeName} ${subjectName} papers?`, a: `Click any material below and download the PDF. All ${materials.length} ${subjectName} resources are free.` },
    { q: `Are these ${subjectName} papers verified?`, a: `Yes. Every ${collegeName} ${subjectName} paper and note is reviewed by moderators before publishing.` },
    { q: `What years do these ${subjectName} papers cover?`, a: `Papers span the last 5 years where available. Uploads are refreshed each semester.` },
  ];

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "LearningResource",
        "name": `${collegeName} ${subjectName} Study Materials`,
        "description": description,
        "url": url,
        "learningResourceType": "Exam Paper",
        "educationalLevel": "Undergraduate",
        "about": subjectName,
        "provider": { "@type": "CollegeOrUniversity", "name": collegeName },
      },
      buildBreadcrumbLdJson([
        { name: "UniVoid", url: SITE_URL },
        { name: "Study Materials", url: `${SITE_URL}/study-materials` },
        { name: collegeName, url: `${SITE_URL}/study-materials/college/${collegeSlug}` },
        { name: subjectName, url },
      ]),
      {
        "@type": "ItemList",
        "itemListElement": materials.slice(0, 30).map((m, idx) => ({
          "@type": "ListItem",
          "position": idx + 1,
          "name": m.title,
          "url": `${SITE_URL}/materials/${m.id}`,
        })),
      },
      buildFaqLdJson(faqs),
    ],
  };

  const content = `
    <article>
      <h1>${escapeHtml(collegeName)} ${escapeHtml(subjectName)} Previous Year Papers &amp; Notes (PDF)</h1>
      <p>${escapeHtml(collegeName)} ${escapeHtml(subjectName)} resources include previous year question papers, semester notes and solved question banks. Download <strong>${materials.length} verified PDFs</strong> below — free, moderator-reviewed, contributed by ${escapeHtml(collegeName)} seniors on UniVoid.</p>

      <h2>${escapeHtml(subjectName)} Previous Year Papers</h2>
      <ul>
        ${materials.filter(m => /paper|question|pyq/i.test(m.title)).slice(0, 15).map(m => `<li><a href="${SITE_URL}/materials/${m.id}">${escapeHtml(m.title)}</a></li>`).join('\n        ') || '<li>Question papers coming soon — contribute yours.</li>'}
      </ul>

      <h2>${escapeHtml(subjectName)} Semester Notes</h2>
      <ul>
        ${materials.filter(m => /note|notes|unit|chapter/i.test(m.title)).slice(0, 15).map(m => `<li><a href="${SITE_URL}/materials/${m.id}">${escapeHtml(m.title)}</a></li>`).join('\n        ') || '<li>Notes coming soon — contribute yours.</li>'}
      </ul>

      <h2>All ${escapeHtml(subjectName)} Uploads</h2>
      <ul>
        ${materials.slice(0, 30).map(m => `<li><a href="${SITE_URL}/materials/${m.id}">${escapeHtml(m.title)}</a> — ${m.downloads_count || 0} downloads</li>`).join('\n        ')}
      </ul>

      <h2>How to Prepare for ${escapeHtml(collegeName)} ${escapeHtml(subjectName)} Exams</h2>
      <h3>Solve last 5 years' papers first</h3>
      <p>Historically, 30-40% of ${escapeHtml(subjectName)} questions at ${escapeHtml(collegeName)} repeat across cycles.</p>
      <h3>Cover the syllabus unit-wise using senior notes</h3>
      <p>Notes above are structured to match the official ${escapeHtml(collegeName)} ${escapeHtml(subjectName)} syllabus.</p>
      <h3>Revise with solved question banks</h3>
      <p>Solved banks compress the last two weeks of prep — pair them with mock tests.</p>

      <h2>Frequently Asked Questions</h2>
      ${faqs.map(f => `<h3>${escapeHtml(f.q)}</h3><p>${escapeHtml(f.a)}</p>`).join('\n      ')}
    </article>
  `;

  return generateHTML({ title, description, image: DEFAULT_OG_IMAGE, url, type: 'website', content, structuredData });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleEvent(supabase: any, identifier: string) {
  // Check if it looks like a UUID
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
  
  let query = supabase
    .from('events')
    .select('*')
    .eq('status', 'published');
    
  if (isUUID) {
    query = query.eq('id', identifier);
  } else {
    query = query.eq('slug', identifier);
  }
  
  const { data, error } = await query.single();

  if (error || !data) {
    console.log('Event not found:', identifier, error);
    return null;
  }

  const event = data as Event;
  const title = `${event.title} | Events | UniVoid`;
  const description = event.description || `Register for ${event.title} - ${event.category} event${event.venue_name ? ` at ${event.venue_name}` : ''}. Join now on UniVoid!`;
  // IMPORTANT: Use flyer_url for social preview image, resolved to a public URL
  const image = toPublicImageUrl(event.flyer_url) || DEFAULT_OG_IMAGE;
  // Use slug for canonical URL
  const eventSlug = event.slug || event.id;
  const url = `${SITE_URL}/events/${eventSlug}`;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Event",
    "name": event.title,
    "description": description,
    "url": url,
    "image": image,
    "startDate": event.start_date,
    ...(event.end_date && { "endDate": event.end_date }),
    "eventStatus": "https://schema.org/EventScheduled",
    "eventAttendanceMode": event.venue_name
      ? "https://schema.org/OfflineEventAttendanceMode"
      : "https://schema.org/OnlineEventAttendanceMode",
    ...(event.venue_name && {
      "location": {
        "@type": "Place",
        "name": event.venue_name,
        "address": event.venue_address || event.venue_name
      }
    }),
    "organizer": {
      "@type": "Organization",
      "name": "UniVoid",
      "url": SITE_URL
    },
    ...(event.is_paid && event.price && {
      "offers": {
        "@type": "Offer",
        "price": event.price,
        "priceCurrency": "INR",
        "availability": "https://schema.org/InStock",
        "url": url
      }
    })
  };

  const content = `
    <article>
      <h1>${escapeHtml(event.title)}</h1>
      <p>${escapeHtml(description)}</p>
      <p>Category: ${escapeHtml(event.category)}</p>
      <p>Date: ${formatDate(event.start_date)}</p>
      ${event.venue_name ? `<p>Venue: ${escapeHtml(event.venue_name)}</p>` : ''}
      ${event.venue_address ? `<p>Address: ${escapeHtml(event.venue_address)}</p>` : ''}
      ${event.is_paid ? `<p>Price: ₹${event.price}</p>` : '<p>Free Entry</p>'}
      <p>Registrations: ${event.registrations_count || 0}</p>
      <a href="${url}">Register on UniVoid</a>
    </article>
  `;

  return generateHTML({ title, description, image, url, type: 'event', content, structuredData });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleBook(supabase: any, id: string) {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('id', id)
    .eq('status', 'approved')
    .single();

  if (error || !data) {
    console.log('Book not found:', id, error);
    return null;
  }

  const book = data as Book;
  const title = `${book.title} | Books | UniVoid`;
  const description = book.description || `Buy ${book.title}${book.author ? ` by ${book.author}` : ''} - ${book.category || 'Book'} available on UniVoid book marketplace.`;
  const image = toPublicImageUrl(book.image_urls?.[0]) || DEFAULT_OG_IMAGE;
  const url = `${SITE_URL}/books/${id}`;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": book.title,
    "description": description,
    "image": image,
    "url": url,
    ...(book.author && { "author": { "@type": "Person", "name": book.author } }),
    "category": book.category || "Book",
    "offers": {
      "@type": "Offer",
      "price": book.price || 0,
      "priceCurrency": "INR",
      "availability": book.is_sold
        ? "https://schema.org/OutOfStock"
        : "https://schema.org/InStock",
      "seller": {
        "@type": "Organization",
        "name": "UniVoid Marketplace"
      }
    },
    ...(book.condition && { "itemCondition": `https://schema.org/${book.condition === 'new' ? 'NewCondition' : 'UsedCondition'}` })
  };

  const content = `
    <article>
      <h1>${escapeHtml(book.title)}</h1>
      ${book.author ? `<p>Author: ${escapeHtml(book.author)}</p>` : ''}
      <p>${escapeHtml(description)}</p>
      ${book.category ? `<p>Category: ${escapeHtml(book.category)}</p>` : ''}
      ${book.condition ? `<p>Condition: ${escapeHtml(book.condition)}</p>` : ''}
      <p>Price: ₹${book.price || 'Contact Seller'}</p>
      <p>Status: ${book.is_sold ? 'Sold' : 'Available'}</p>
      <a href="${url}">View on UniVoid</a>
    </article>
  `;

  return generateHTML({ title, description, image, url, type: 'product', content, structuredData });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleProject(supabase: any, id: string) {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    console.log('Project not found:', id, error);
    return null;
  }

  const project = data as Project;
  const skills = project.skills_required?.join(', ') || '';
  const title = `${project.title} | Project Partner | UniVoid`;
  const description = project.description || `Join ${project.title} project${skills ? `. Skills needed: ${skills}` : ''}. Find project partners on UniVoid.`;
  const url = `${SITE_URL}/projects/${id}`;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    "name": project.title,
    "description": description,
    "url": url,
    "datePublished": project.created_at,
    "dateModified": project.updated_at,
    "creator": {
      "@type": "Organization",
      "name": "UniVoid"
    },
    ...(skills && { "keywords": skills })
  };

  const content = `
    <article>
      <h1>${escapeHtml(project.title)}</h1>
      <p>${escapeHtml(description)}</p>
      ${skills ? `<p>Skills Required: ${escapeHtml(skills)}</p>` : ''}
      <p>Team Size: ${project.max_members || 'Flexible'}</p>
      <p>Status: ${project.is_open ? 'Open for Applications' : 'Closed'}</p>
      <a href="${url}">View Project on UniVoid</a>
    </article>
  `;

  return generateHTML({ title, description, image: DEFAULT_OG_IMAGE, url, type: 'article', content, structuredData });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleTask(supabase: any, id: string) {
  const { data, error } = await supabase
    .from('task_requests')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    console.log('Task not found:', id, error);
    return null;
  }

  const task = data as Task;
  const title = `${task.title} | Task Plaza | UniVoid`;
  const description = task.description || `${task.task_type} task${task.subject ? ` for ${task.subject}` : ''}. Budget: ₹${task.budget || 'Negotiable'}. Get help on UniVoid Task Plaza.`;
  const url = `${SITE_URL}/tasks/${id}`;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    "title": task.title,
    "description": description,
    "url": url,
    "datePosted": task.created_at,
    ...(task.deadline && { "validThrough": task.deadline }),
    "hiringOrganization": {
      "@type": "Organization",
      "name": "UniVoid Task Plaza"
    },
    ...(task.budget && {
      "baseSalary": {
        "@type": "MonetaryAmount",
        "currency": "INR",
        "value": task.budget
      }
    }),
    "employmentType": "TEMPORARY"
  };

  const content = `
    <article>
      <h1>${escapeHtml(task.title)}</h1>
      <p>${escapeHtml(description)}</p>
      <p>Type: ${escapeHtml(task.task_type)}</p>
      ${task.subject ? `<p>Subject: ${escapeHtml(task.subject)}</p>` : ''}
      <p>Budget: ₹${task.budget || 'Negotiable'}</p>
      ${task.deadline ? `<p>Deadline: ${formatDate(task.deadline)}</p>` : ''}
      <p>Status: ${task.status || 'Open'}</p>
      <a href="${url}">View Task on UniVoid</a>
    </article>
  `;

  return generateHTML({ title, description, image: DEFAULT_OG_IMAGE, url, type: 'article', content, structuredData });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleProfile(supabase: any, id: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, college_name, branch, total_xp, profile_photo_url')
    .eq('id', id)
    .single();

  if (error || !data) {
    console.log('Profile not found:', id, error);
    return null;
  }

  const profile = data as Profile;
  const title = `${profile.full_name} | Student Profile | UniVoid`;
  const description = `${profile.full_name}${profile.college_name ? ` from ${profile.college_name}` : ''}${profile.branch ? `, ${profile.branch}` : ''}. XP: ${profile.total_xp || 0}. View profile on UniVoid.`;
  const image = toPublicImageUrl(profile.profile_photo_url) || DEFAULT_OG_IMAGE;
  const url = `${SITE_URL}/profile/${id}`;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": profile.full_name,
    "url": url,
    "image": image,
    ...(profile.college_name && {
      "affiliation": {
        "@type": "EducationalOrganization",
        "name": profile.college_name
      }
    })
  };

  const content = `
    <article>
      <h1>${escapeHtml(profile.full_name)}</h1>
      ${profile.college_name ? `<p>College: ${escapeHtml(profile.college_name)}</p>` : ''}
      ${profile.branch ? `<p>Branch: ${escapeHtml(profile.branch)}</p>` : ''}
      <p>XP: ${profile.total_xp || 0}</p>
      <a href="${url}">View Profile on UniVoid</a>
    </article>
  `;

  return generateHTML({ title, description, image, url, type: 'profile', content, structuredData });
}

Deno.serve(async (req) => {
  if (isCorsPreflightRequest(req)) {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    const url = new URL(req.url);
    const pathParam = url.searchParams.get('path');
    const userAgent = req.headers.get('user-agent') || '';

    console.log('Prerender request:', { path: pathParam, userAgent: userAgent.substring(0, 100), isBot: isBot(userAgent) });

    // Only serve pre-rendered content to bots
    if (!isBot(userAgent)) {
      console.log('Not a bot, redirecting to SPA');
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': pathParam ? `${SITE_URL}${pathParam}` : SITE_URL
        }
      });
    }

    if (!pathParam) {
      return new Response('Missing path parameter', { status: 400, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let html: string | null = null;

    // Parse the path and handle different content types
    const materialsMatch = pathParam.match(/^\/materials\/([a-f0-9-]+)$/);
    const eventsMatch = pathParam.match(/^\/events\/([a-zA-Z0-9_-]+)$/);
    const booksMatch = pathParam.match(/^\/books\/([a-f0-9-]+)$/);
    const projectsMatch = pathParam.match(/^\/projects\/([a-f0-9-]+)$/);
    const tasksMatch = pathParam.match(/^\/tasks\/([a-f0-9-]+)$/);
    const profileMatch = pathParam.match(/^\/profile\/([a-f0-9-]+)$/);

    if (materialsMatch) {
      html = await handleMaterial(supabase, materialsMatch[1]);
    } else if (eventsMatch) {
      html = await handleEvent(supabase, eventsMatch[1]);
    } else if (booksMatch) {
      html = await handleBook(supabase, booksMatch[1]);
    } else if (projectsMatch) {
      html = await handleProject(supabase, projectsMatch[1]);
    } else if (tasksMatch) {
      html = await handleTask(supabase, tasksMatch[1]);
    } else if (profileMatch) {
      html = await handleProfile(supabase, profileMatch[1]);
    }

    if (html) {
      console.log('Serving pre-rendered HTML for:', pathParam);
      return new Response(html, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=3600, s-maxage=86400'
        }
      });
    }

    // If no content found or path not matched, redirect to SPA
    console.log('No pre-rendered content, redirecting to SPA:', pathParam);
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': `${SITE_URL}${pathParam}`
      }
    });

  } catch (error) {
    console.error("Prerender error:", error);
    return new Response('Internal Server Error', {
      status: 500,
      headers: corsHeaders
    });
  }
});
