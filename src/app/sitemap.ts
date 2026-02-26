import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/src/lib/siteConfig';

export default function sitemap(): MetadataRoute.Sitemap {
    return [
        {
            url: SITE_URL,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
        },
        {
            url: `${SITE_URL}/lp`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 1.0,
        },
    ];
}
