import { NextRequest } from "next/server";
import { publicConfig } from "@/config/public-config";
import {
  getShareImageResponse,
  parseNextRequestSearchParams,
} from "@/neynar-farcaster-sdk/nextjs";

// Cache for 1 hour - query strings create separate cache entries
export const revalidate = 3600;

const { appEnv, heroImageUrl, imageUrl } = publicConfig;

const showDevWarning = appEnv !== "production";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> },
) {
  const { type } = await params;

  const searchParams = parseNextRequestSearchParams(request);
  const _shareType = searchParams.shareType ?? "marketplace";

  return getShareImageResponse(
    { type, heroImageUrl, imageUrl, showDevWarning },
    // Overlay: dark space themed AgentBazaar share card
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        background: "#080810",
        position: "relative",
        flexDirection: "column",
      }}
    >
      {/* Hex grid background pattern */}
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundImage:
            "radial-gradient(circle at 20% 80%, rgba(124,58,237,0.12) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(245,158,11,0.08) 0%, transparent 50%), radial-gradient(circle at 50% 50%, rgba(124,58,237,0.05) 0%, transparent 70%)",
          opacity: 1,
        }}
      />

      {/* Subtle hex node grid */}
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundImage:
            "radial-gradient(circle, rgba(124,58,237,0.18) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          opacity: 0.6,
        }}
      />

      {/* Top edge glow line */}
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: 2,
          backgroundImage:
            "linear-gradient(90deg, transparent, rgba(124,58,237,0.8) 40%, rgba(245,158,11,0.6) 60%, transparent)",
        }}
      />

      {/* Main content — lower-left card */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "flex-end",
          width: "100%",
          height: "100%",
          padding: 52,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          {/* Logo + Title row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            {/* Hex icon */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 56,
                height: 56,
                borderRadius: 14,
                backgroundImage:
                  "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
                boxShadow: "0 0 28px rgba(124,58,237,0.6)",
              }}
            >
              <svg width="28" height="28" viewBox="0 0 14 14" fill="none">
                <path
                  d="M7 1L12.196 4V10L7 13L1.804 10V4L7 1Z"
                  stroke="white"
                  strokeWidth="1.5"
                  fill="none"
                />
                <path
                  d="M7 4L9.598 5.5V8.5L7 10L4.402 8.5V5.5L7 4Z"
                  fill="white"
                  opacity="0.7"
                />
              </svg>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {/* Title with violet glow */}
              <div
                style={{
                  display: "flex",
                  fontSize: 52,
                  fontWeight: "bold",
                  color: "white",
                  letterSpacing: -1,
                  textShadow:
                    "0 0 30px rgba(124,58,237,0.9), 0 0 60px rgba(124,58,237,0.4)",
                  lineHeight: 1,
                }}
              >
                AgentBazaar
              </div>
              {/* Subtitle */}
              <div
                style={{
                  display: "flex",
                  fontSize: 18,
                  color: "rgba(167,139,250,0.85)",
                  letterSpacing: 3,
                  textTransform: "uppercase",
                  fontWeight: 500,
                }}
              >
                Autonomous Agent Marketplace
              </div>
            </div>
          </div>

          {/* Stats bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 0,
              backgroundColor: "rgba(0,0,0,0.55)",
              border: "1px solid rgba(124,58,237,0.35)",
              borderRadius: 14,
              padding: "16px 28px",
              boxShadow:
                "0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(124,58,237,0.15)",
            }}
          >
            {/* Stat: Agents */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                paddingRight: 28,
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: 34,
                  fontWeight: "bold",
                  color: "#a78bfa",
                  textShadow: "0 0 16px rgba(167,139,250,0.5)",
                }}
              >
                8
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: 12,
                  color: "rgba(255,255,255,0.45)",
                  textTransform: "uppercase",
                  letterSpacing: 1.5,
                }}
              >
                Agents
              </div>
            </div>

            {/* Divider */}
            <div
              style={{
                display: "flex",
                width: 1,
                height: 44,
                backgroundColor: "rgba(124,58,237,0.3)",
                marginRight: 28,
              }}
            />

            {/* Stat: Listings */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                paddingRight: 28,
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: 34,
                  fontWeight: "bold",
                  color: "#a78bfa",
                  textShadow: "0 0 16px rgba(167,139,250,0.5)",
                }}
              >
                10
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: 12,
                  color: "rgba(255,255,255,0.45)",
                  textTransform: "uppercase",
                  letterSpacing: 1.5,
                }}
              >
                Listings
              </div>
            </div>

            {/* Divider */}
            <div
              style={{
                display: "flex",
                width: 1,
                height: 44,
                backgroundColor: "rgba(124,58,237,0.3)",
                marginRight: 28,
              }}
            />

            {/* Stat: Volume */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: 34,
                  fontWeight: "bold",
                  color: "#f59e0b",
                  textShadow: "0 0 16px rgba(245,158,11,0.5)",
                }}
              >
                0.64 ETH
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: 12,
                  color: "rgba(255,255,255,0.45)",
                  textTransform: "uppercase",
                  letterSpacing: 1.5,
                }}
              >
                Volume
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
  );
}
