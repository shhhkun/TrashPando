import React from "react";

interface BambooStorageBarProps {
  used: number;
  total: number;
  className?: string;
}

const BambooStorageBar: React.FC<BambooStorageBarProps> = ({
  used,
  total,
  className = "",
}) => {
  const percentage = Math.min((used / total) * 100, 100);
  const segments = 5;
  const filledSegments = Math.floor((percentage / 100) * segments);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <div className={`w-full ${className}`}>
      <style>{`
        @keyframes bambooGlow {
          0% { filter: brightness(1); }
          50% { filter: brightness(1.2) drop-shadow(0 0 4px #A7C957); }
          100% { filter: brightness(1); }
        }
        @keyframes bambooFill {
          0% { width: 0; opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes leafSway {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(5deg); }
        }
      `}</style>

      {/* Storage Stats */}
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs" style={{ color: "#F1F1F1", opacity: 0.8 }}>
          Storage Health
        </span>
        <span className="text-xs" style={{ color: "#F1F1F1", opacity: 0.6 }}>
          {formatBytes(used)} / {formatBytes(total)}
        </span>
      </div>

      {/* Bamboo Bar */}
      <div className="relative flex items-center justify-center">
        <svg
          width="100%"
          height="40"
          viewBox="0 0 300 40"
          className="drop-shadow-sm"
        >
          {/* Main bamboo stalk */}
          <defs>
            <linearGradient
              id="bambooGradient"
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#A7C957" />
              <stop offset="50%" stopColor="#8DB446" />
              <stop offset="100%" stopColor="#7BA135" />
            </linearGradient>
            <linearGradient
              id="emptyGradient"
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#F1F1F1" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#F1F1F1" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#F1F1F1" stopOpacity="0.15" />
            </linearGradient>
          </defs>

          {/* Bamboo segments */}
          {[...Array(segments)].map((_, index) => {
            const segmentWidth = 240 / segments;
            const x = 30 + index * segmentWidth;
            const isFilled = index < filledSegments;
            const isPartial =
              index === filledSegments && percentage % (100 / segments) > 0;

            return (
              <g key={index}>
                {/* Segment background */}
                <rect
                  x={x}
                  y="12"
                  width={segmentWidth - 4}
                  height="16"
                  rx="8"
                  fill={
                    isFilled ? "url(#bambooGradient)" : "url(#emptyGradient)"
                  }
                  stroke="#2B2B2B"
                  strokeWidth="1.5"
                  style={{
                    animation: isFilled
                      ? `bambooGlow 2s ease-in-out ${index * 0.2}s`
                      : "none",
                  }}
                />

                {/* Partial fill for the current segment */}
                {isPartial && (
                  <rect
                    x={x}
                    y="12"
                    width={
                      (segmentWidth - 4) *
                      ((percentage % (100 / segments)) / (100 / segments))
                    }
                    height="16"
                    rx="8"
                    fill="url(#bambooGradient)"
                    style={{
                      animation: `bambooFill 1s ease-out ${index * 0.2}s both`,
                    }}
                  />
                )}

                {/* Bamboo joint lines */}
                {index < segments - 1 && (
                  <line
                    x1={x + segmentWidth - 2}
                    y1="10"
                    x2={x + segmentWidth - 2}
                    y2="30"
                    stroke="#2B2B2B"
                    strokeWidth="2"
                    opacity="0.6"
                  />
                )}
              </g>
            );
          })}

          {/* Worried face if storage is high (critical) */}
          {percentage > 90 && (
            <g transform="translate(150, 20)">
              {/* Worried mouth */}
              <path
                d="M-3 3 Q0 1 3 3"
                fill="none"
                stroke="#2B2B2B"
                strokeWidth="1"
                strokeLinecap="round"
                opacity="0.7"
              />
              {/* Eyes */}
              <circle cx="-4" cy="-2" r="1" fill="#2B2B2B" opacity="0.7" />
              <circle cx="4" cy="-2" r="1" fill="#2B2B2B" opacity="0.7" />
            </g>
          )}

          {/* Cute face if storage is low (healthy) */}
          {percentage < 70 && percentage > 0 && (
            <g transform="translate(150, 20)">
              {/* Smile */}
              <path
                d="M-3 1 Q0 3 3 1"
                fill="none"
                stroke="#2B2B2B"
                strokeWidth="1"
                strokeLinecap="round"
                opacity="0.7"
              />
              {/* Eyes */}
              <circle cx="-4" cy="-2" r="1" fill="#2B2B2B" opacity="0.7" />
              <circle cx="4" cy="-2" r="1" fill="#2B2B2B" opacity="0.7" />
            </g>
          )}
        </svg>
      </div>

      {/* Storage status text and tips */}
      <div className="mt-2 text-center">
        <span
          className="text-xs px-2 py-1 rounded-full"
          style={{
            backgroundColor:
              percentage > 90
                ? "#D4183D" // Critical: Red
                : percentage > 70
                ? "#C2A482" // Moderate: Tan Brown
                : "#A7C957", // Healthy: Green
            color: "#F1F1F1",
            opacity: 0.9,
          }}
        >
          {percentage > 90
            ? "🔥 Critical"
            : percentage > 70
            ? "⚠️ Moderate"
            : "🌱 Healthy"}
        </span>

        <div className="mt-2">
          <p
            className="text-xs leading-relaxed"
            style={{ color: "#F1F1F1", opacity: 0.7 }}
          >
            {percentage > 90 &&
              "⚠️ Critical storage alert! Your trash panda needs help - clear space immediately!"}
            {percentage > 70 &&
              percentage <= 90 &&
              "🗂️ Time for some spring cleaning! Your trash panda recommends sorting through old files."}
            {percentage > 50 &&
              percentage <= 70 &&
              "🐾 Trash Panda says: Your storage is doing well, but consider some cleanup soon."}
            {percentage <= 50 &&
              "🦝 Your storage bamboo is thriving! Keep up the good organization."}
          </p>
        </div>
      </div>
    </div>
  );
};

export default BambooStorageBar;
