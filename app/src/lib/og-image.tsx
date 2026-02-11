import { ImageResponse } from "next/og";
import { loadSilkscreenFont, silkscreenFontConfig } from "./fonts";

interface OGImageOptions {
  width: number;
  height: number;
}

interface OGImageProps {
  title: string;
  subtitle?: string;
  punkIds?: number[];
}

function getPunkImageUrl(punkId: number) {
  return `https://punks.art/api/punks/${punkId}?format=png&size=240&background=v2`;
}

export async function generateOGImage(
  props: OGImageProps,
  options: OGImageOptions
): Promise<ImageResponse> {
  const { width, height } = options;
  const { title, subtitle, punkIds } = props;

  const silkscreenFont = await loadSilkscreenFont();

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0a0a0a",
          padding: "60px",
        }}
      >
        {punkIds && punkIds.length > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "16px",
              marginBottom: "48px",
            }}
          >
            {punkIds.slice(0, 5).map((id) => (
              <div key={id} style={{ display: "flex" }}>
                <img
                  src={getPunkImageUrl(id)}
                  width={100}
                  height={100}
                  style={{ imageRendering: "pixelated" }}
                />
              </div>
            ))}
          </div>
        )}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              fontFamily: "Silkscreen",
              fontSize: 96,
              fontWeight: 400,
              color: "white",
              textTransform: "uppercase",
              lineHeight: 1,
            }}
          >
            {title}
          </div>

          {subtitle && (
            <div
              style={{
                display: "flex",
                fontFamily: "Silkscreen",
                fontSize: 50,
                fontWeight: 400,
                color: "white",
                textTransform: "uppercase",
                marginTop: "24px",
                opacity: 0.7,
                maxWidth: "900px",
                textAlign: "center",
                justifyContent: "center",
              }}
            >
              {subtitle}
            </div>
          )}
        </div>
      </div>
    ),
    {
      width,
      height,
      fonts: [
        {
          ...silkscreenFontConfig,
          data: silkscreenFont,
        },
      ],
    }
  );
}
