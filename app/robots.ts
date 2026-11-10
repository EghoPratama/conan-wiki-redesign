import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    // /api/* meneruskan request ke wiki; mesin pencari tidak perlu merayapinya
    rules: [{ userAgent: '*', allow: '/', disallow: '/api/' }],
  };
}
