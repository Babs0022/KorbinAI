import { ImageResponse } from 'next/og'

// Route segment config
export const runtime = 'edge'

// Image metadata
export const size = {
  width: 32,
  height: 32,
}
export const contentType = 'image/png'

// Image generation
export default function Icon() {
  // By returning a transparent div, we encourage the browser to fall back
  // to the icon defined in the layout metadata, which is /logo.svg.
  // This avoids displaying the generated "B" icon.
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
        }}
      >
      </div>
    ),
    {
      ...size,
    }
  )
}
