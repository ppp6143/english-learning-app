/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'WordLens — 写真を撮るだけで英単語レベルがわかる';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    background: 'linear-gradient(135deg, #0a0a0f 0%, #111827 50%, #0a0a0f 100%)',
                    fontFamily: 'sans-serif',
                }}
            >
                {/* Accent glow */}
                <div style={{
                    position: 'absolute',
                    top: '0',
                    left: '0',
                    right: '0',
                    height: '4px',
                    background: 'linear-gradient(90deg, #f59e0b, #f97316, #f59e0b)',
                }} />

                {/* Icon */}
                <div style={{
                    display: 'flex',
                    width: '80px',
                    height: '80px',
                    borderRadius: '20px',
                    background: 'linear-gradient(135deg, #f59e0b, #f97316)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '32px',
                    boxShadow: '0 8px 32px rgba(245,158,11,0.3)',
                }}>
                    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                </div>

                {/* Title */}
                <div style={{
                    fontSize: '56px',
                    fontWeight: '800',
                    background: 'linear-gradient(90deg, #fcd34d, #fb923c)',
                    backgroundClip: 'text',
                    color: 'transparent',
                    marginBottom: '16px',
                    letterSpacing: '-1px',
                }}>
                    WordLens
                </div>

                {/* Subtitle */}
                <div style={{
                    fontSize: '28px',
                    color: '#9ca3af',
                    fontWeight: '500',
                    marginBottom: '40px',
                }}>
                    写真を撮るだけで英単語レベルがわかる
                </div>

                {/* Feature pills */}
                <div style={{
                    display: 'flex',
                    gap: '16px',
                }}>
                    {['CEFR A1〜C2対応', 'オフライン辞書47,000語', '句動詞250+収録'].map((text) => (
                        <div key={text} style={{
                            padding: '10px 24px',
                            borderRadius: '999px',
                            background: 'rgba(245,158,11,0.1)',
                            border: '1px solid rgba(245,158,11,0.25)',
                            color: '#fcd34d',
                            fontSize: '18px',
                            fontWeight: '600',
                        }}>
                            {text}
                        </div>
                    ))}
                </div>
            </div>
        ),
        { ...size }
    );
}
