import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site";

/**
 * The image shown when the site is shared on Facebook, LinkedIn, X, iMessage
 * or WhatsApp. Generated at build time by next/og — no design tool, no binary
 * asset to keep in sync with the copy.
 */

export const runtime = "nodejs";
export const alt =
  "Top Miles Logistics — OTR CDL-A truck driver jobs, Dry Van & Reefer freight";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const emblemDataUri = `data:image/png;base64,${readFileSync(
  join(process.cwd(), "public", "logo-emblem.png"),
).toString("base64")}`;

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background:
            "linear-gradient(135deg, #0a0f18 0%, #1d2739 55%, #2c3950 100%)",
          padding: "64px 72px",
          fontFamily: "sans-serif",
          color: "#ffffff",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {/*
            next/og cannot load a relative URL, so the emblem is read off disk
            at build time and inlined. Same file the header uses.
          */}
          <img
            src={emblemDataUri}
            alt=""
            width={160}
            height={82}
            style={{ objectFit: "contain" }}
          />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 30, fontWeight: 700, lineHeight: 1.1 }}>
              Top Miles Logistics
            </span>
            <span
              style={{
                fontSize: 20,
                color: "#ffc94d",
                letterSpacing: 2,
                textTransform: "uppercase",
              }}
            >
              {siteConfig.locationLabel}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <span style={{ fontSize: 68, fontWeight: 800, lineHeight: 1.05 }}>
            OTR CDL-A Truck Driver Jobs
          </span>
          <span style={{ fontSize: 34, color: "#cfd8e5" }}>
            Dry Van &amp; Reefer · 70–80 CPM · Weekly Pay
          </span>
        </div>

        <div style={{ display: "flex", gap: 16 }}>
          {[
            "3,500–4,500 miles/week",
            "70% drop & hook",
            "SAP Step 6 welcome",
          ].map((chip) => (
            <div
              key={chip}
              style={{
                display: "flex",
                border: "2px solid rgba(255,255,255,0.25)",
                borderRadius: 999,
                padding: "12px 24px",
                fontSize: 24,
                color: "#e9edf4",
              }}
            >
              {chip}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
