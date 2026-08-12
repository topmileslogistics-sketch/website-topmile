import Image from "next/image";
import { sitePhotos } from "@/config/site";
import { Section, SectionHeading, cx } from "@/components/ui";

/**
 * The photo strip on the homepage.
 *
 * Kept in its own file so adding or removing photos never means editing the
 * homepage itself — the list lives in `sitePhotos` in src/config/site.ts.
 */
export function Photos() {
  // Nothing configured yet: render nothing at all rather than empty boxes.
  if (sitePhotos.length === 0) return null;

  return (
    <Section tone="muted">
      <SectionHeading eyebrow="On the Road" title="The equipment you'll run" />
      {/*
        Columns follow the number of photos, so two images sit as a balanced
        pair instead of leaving a hole in a three-wide row.
      */}
      <ul
        className={cx(
          "mt-10 grid gap-5",
          sitePhotos.length === 1 && "mx-auto max-w-2xl",
          sitePhotos.length === 2 && "sm:grid-cols-2",
          sitePhotos.length >= 3 && "sm:grid-cols-2 lg:grid-cols-3",
        )}
      >
        {sitePhotos.map((photo) => (
          <li
            key={photo.src}
            className="relative aspect-[4/3] overflow-hidden rounded-xl bg-ink-200 ring-1 ring-ink-200"
          >
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover"
            />
          </li>
        ))}
      </ul>
    </Section>
  );
}
