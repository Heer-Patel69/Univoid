import { Navigate, useParams } from "react-router-dom";

/**
 * Redirects programmatic /study-materials/* URLs to /materials with search params
 * so human visitors landing from Google SERPs see the real listing.
 * Bots receive pre-rendered HTML via the `prerender` edge function and never reach this component.
 */
function unslug(slug: string): string {
  return slug
    .split("-")
    .map((w) => (w.length <= 3 ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}

interface Props {
  kind: "college" | "subject" | "leaf";
}

export default function StudyMaterialsRedirect({ kind }: Props) {
  const { collegeSlug, subjectSlug } = useParams<{ collegeSlug?: string; subjectSlug?: string }>();
  const params = new URLSearchParams();
  if (kind === "college" && collegeSlug) params.set("college", unslug(collegeSlug));
  if (kind === "subject" && subjectSlug) params.set("subject", unslug(subjectSlug));
  if (kind === "leaf") {
    if (collegeSlug) params.set("college", unslug(collegeSlug));
    if (subjectSlug) params.set("subject", unslug(subjectSlug));
  }
  const qs = params.toString();
  return <Navigate to={qs ? `/materials?${qs}` : "/materials"} replace />;
}
