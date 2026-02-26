import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_URL, SITE_NAME } from '@/src/lib/siteConfig';

export const metadata: Metadata = {
    title: `${SITE_NAME} — 写真を撮るだけで英単語レベルがわかる`,
    description: '英語テキストの写真を撮るだけで、あなたのレベルに合った単語をハイライト。CEFR対応・47,000語オフライン辞書搭載の無料英単語分析ツール。',
    alternates: { canonical: `${SITE_URL}/lp` },
};

/** JSON-LD structured data for search engines */
const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: SITE_NAME,
    url: SITE_URL,
    description: '英語テキストの写真を撮影し、CEFRレベル別に単語をハイライト表示する無料ツール',
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Web',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'JPY' },
    inLanguage: ['ja', 'en'],
};

/* ───────── CSS App Mockup ───────── */
function AppMockup() {
    return (
        <div className="relative w-full max-w-md mx-auto">
            {/* Phone frame */}
            <div className="bg-gray-900 rounded-2xl border border-gray-700/60 shadow-2xl shadow-black/60 overflow-hidden">
                {/* Status bar */}
                <div className="flex items-center justify-between px-5 pt-3 pb-2">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                                />
                            </svg>
                        </div>
                        <span className="text-xs font-bold bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent">
                            WordLens
                        </span>
                    </div>
                    <div className="flex gap-1">
                        {(['A1','A2','B1','B2','C1','C2']).map((l) => (
                            <span key={l} className={`px-1.5 py-0.5 text-[9px] font-bold rounded ${
                                l === 'B2'
                                    ? 'bg-gradient-to-b from-amber-400 to-orange-500 text-gray-900'
                                    : 'text-gray-600'
                            }`}>{l}</span>
                        ))}
                    </div>
                </div>

                {/* Mock text area - simulates highlighted English text */}
                <div className="px-5 py-4 space-y-3">
                    {/* Simulated text with highlights */}
                    <div className="bg-gray-800/60 rounded-lg p-4 font-serif text-sm leading-relaxed text-gray-300 space-y-2">
                        <p>
                            The <MockHL color="orange">unprecedented</MockHL> growth of
                            technology has <MockHL color="yellow">transformed</MockHL> the
                            way we <MockHL color="blue">communicate</MockHL> with each other.
                        </p>
                        <p>
                            Many <MockHL color="orange">scholars</MockHL> argue that
                            this <MockHL color="yellow">phenomenon</MockHL> is both
                            a <MockHL color="blue">benefit</MockHL> and a challenge.
                        </p>
                    </div>

                    {/* Mock popup */}
                    <div className="bg-gray-800 border border-gray-600/50 rounded-xl p-3 shadow-lg">
                        <div className="flex items-center gap-2 mb-1.5">
                            <span className="font-bold text-amber-300 text-sm">unprecedented</span>
                            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-orange-900/50 text-orange-300 border border-orange-700/50">C1</span>
                        </div>
                        <p className="text-xs text-gray-400">前例のない、空前の</p>
                    </div>

                    {/* Stats bar */}
                    <div className="flex items-center gap-3 text-[10px] text-gray-500 pt-1">
                        <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-orange-500/70" />
                            2 above
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-yellow-400/70" />
                            2 at level
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-blue-400/50" />
                            2 learned
                        </span>
                    </div>
                </div>
            </div>

            {/* Decorative glow */}
            <div className="absolute -inset-4 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent rounded-3xl blur-2xl -z-10" />
        </div>
    );
}

function MockHL({ color, children }: { color: 'orange' | 'yellow' | 'blue'; children: React.ReactNode }) {
    const styles = {
        orange: 'bg-orange-500/25 border-b-2 border-orange-500/60 text-orange-200',
        yellow: 'bg-yellow-400/20 border-b-2 border-yellow-400/50 text-yellow-200',
        blue:   'bg-blue-400/15 border-b-2 border-blue-400/40 text-blue-200',
    };
    return <span className={`px-0.5 rounded-sm ${styles[color]}`}>{children}</span>;
}

/* ───────── Step Card ───────── */
function StepCard({ num, title, desc }: { num: number; title: string; desc: string }) {
    return (
        <div className="flex flex-col items-center text-center gap-3 p-6">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-xl font-bold text-gray-900 shadow-lg shadow-amber-500/20">
                {num}
            </div>
            <h3 className="text-lg font-bold text-gray-100">{title}</h3>
            <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
        </div>
    );
}

/* ───────── Feature Card ───────── */
function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
    return (
        <div className="p-5 rounded-xl bg-gray-900/60 border border-gray-800/60 hover:border-gray-700/60 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center mb-3 text-amber-400">
                {icon}
            </div>
            <h3 className="font-semibold text-gray-100 mb-1">{title}</h3>
            <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
        </div>
    );
}

/* ───────── Page ───────── */
export default function LandingPage() {
    return (
        <main className="min-h-screen bg-gray-950 text-gray-100">
            {/* JSON-LD structured data */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            {/* ── Hero ── */}
            <section className="relative overflow-hidden">
                {/* Background gradient */}
                <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 via-transparent to-transparent" />

                <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-16 pb-12 sm:pt-24 sm:pb-20">
                    <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                        {/* Text */}
                        <div className="text-center lg:text-left">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-medium mb-6">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                                無料で使えます
                            </div>

                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight tracking-tight mb-6">
                                <span className="bg-gradient-to-r from-amber-300 via-orange-400 to-amber-300 bg-clip-text text-transparent">
                                    写真を撮るだけ。
                                </span>
                                <br />
                                知らない英単語が
                                <br />
                                わかる。
                            </h1>

                            <p className="text-gray-400 text-base sm:text-lg leading-relaxed mb-8 max-w-lg mx-auto lg:mx-0">
                                英語のテキストを撮影するだけで、あなたのレベルに合わせて単語を色分けハイライト。
                                タップすれば日本語訳がすぐ見られます。
                            </p>

                            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                                <Link
                                    href="/"
                                    className="px-8 py-3.5 text-base font-semibold rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-gray-900 shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-[1.02] transition-all duration-200 text-center"
                                >
                                    無料で使ってみる
                                </Link>
                            </div>
                        </div>

                        {/* Mockup */}
                        <div className="order-first lg:order-last">
                            <AppMockup />
                        </div>
                    </div>
                </div>
            </section>

            {/* ── 3 Steps ── */}
            <section className="py-16 sm:py-24 border-t border-gray-800/40">
                <div className="max-w-5xl mx-auto px-4 sm:px-6">
                    <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4">
                        使い方は<span className="text-amber-400">3ステップ</span>
                    </h2>
                    <p className="text-gray-500 text-center mb-12">アカウント登録は不要です</p>

                    <div className="grid sm:grid-cols-3 gap-6 sm:gap-4">
                        <StepCard
                            num={1}
                            title="写真を撮る"
                            desc="英語のテキスト（本、記事、メニューなど）をスマホで撮影またはアップロード"
                        />
                        <StepCard
                            num={2}
                            title="レベルを選ぶ"
                            desc="自分の英語レベル（A1〜C2）を選択。それに合わせて単語が自動で色分けされます"
                        />
                        <StepCard
                            num={3}
                            title="タップで和訳"
                            desc="ハイライトされた単語をタップすると日本語訳と詳細がポップアップで表示されます"
                        />
                    </div>
                </div>
            </section>

            {/* ── Features ── */}
            <section className="py-16 sm:py-24 bg-gray-900/30 border-t border-gray-800/40">
                <div className="max-w-5xl mx-auto px-4 sm:px-6">
                    <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
                        特徴
                    </h2>

                    <div className="grid sm:grid-cols-2 gap-4">
                        <FeatureCard
                            icon={
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            }
                            title="CEFRレベル自動判定"
                            desc="A1からC2まで、国際基準CEFRに基づいて単語の難易度を自動判定。自分のレベルに合った学習ができます。"
                        />
                        <FeatureCard
                            icon={
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            }
                            title="高速オフライン辞書"
                            desc="47,000語を内蔵したオフライン辞書で、通信を待たずに瞬時に和訳を表示。APIコスト不要で完全無料。"
                        />
                        <FeatureCard
                            icon={
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                                </svg>
                            }
                            title="句動詞 & 形態素分解"
                            desc="250以上の句動詞を収録。未知の単語は接頭辞・語根・接尾辞に分解して意味を推測できます。"
                        />
                        <FeatureCard
                            icon={
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                            }
                            title="スマホ対応"
                            desc="スマホで撮ってそのまま分析。レスポンシブデザインでどのデバイスでも快適に使えます。"
                        />
                    </div>
                </div>
            </section>

            {/* ── Use Cases ── */}
            <section className="py-16 sm:py-24 border-t border-gray-800/40">
                <div className="max-w-5xl mx-auto px-4 sm:px-6">
                    <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
                        こんなときに便利
                    </h2>

                    <div className="grid sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
                        {[
                            { scene: '洋書を読んでいて', problem: '知らない単語が多すぎてどこから覚えればいいかわからない' },
                            { scene: 'TOEIC・英検の長文で', problem: '自分のレベルより上の単語だけ効率よく拾いたい' },
                            { scene: '海外旅行先で', problem: 'メニューや看板の英語をさっと理解したい' },
                            { scene: '英語の授業で', problem: '教科書の新出単語を素早くチェックしたい' },
                        ].map((item, i) => (
                            <div key={i} className="p-5 rounded-xl bg-gray-900/40 border border-gray-800/40">
                                <p className="text-sm text-amber-400 font-medium mb-1">{item.scene}</p>
                                <p className="text-sm text-gray-400">{item.problem}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Final CTA ── */}
            <section className="py-16 sm:py-24 border-t border-gray-800/40">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
                    <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                        今すぐ試してみよう
                    </h2>
                    <p className="text-gray-500 mb-8">
                        アカウント登録不要。完全無料。
                    </p>
                    <Link
                        href="/"
                        className="inline-block px-10 py-4 text-lg font-semibold rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-gray-900 shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-[1.02] transition-all duration-200"
                    >
                        無料で使ってみる
                    </Link>
                </div>
            </section>

            {/* ── Footer ── */}
            <footer className="py-8 border-t border-gray-800/40">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center text-xs text-gray-600">
                    WordLens
                </div>
            </footer>
        </main>
    );
}
