import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#111111",
        }}
      >
        <div
          style={{
            width: "410px",
            height: "410px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            border: "22px solid #e1aa26",
            color: "#e1aa26",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: "170px",
              fontWeight: 900,
              lineHeight: 1,
              letterSpacing: "-18px",
              paddingRight: "18px",
            }}
          >
            BH
          </div>

          <div
            style={{
              display: "flex",
              marginTop: "20px",
              fontSize: "34px",
              fontWeight: 800,
              letterSpacing: "12px",
            }}
          >
            1899
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}