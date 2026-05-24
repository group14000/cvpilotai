/**
 * Prisma seed script — populates the ResumeTemplate table.
 *
 * Run once (idempotent — safe to re-run):
 *   pnpm prisma db seed
 *
 * The 6 slugs here MUST match the ids in:
 *   components/constants/resume-templates.ts
 * and the thumbnail paths MUST match public/resume-templates/ filenames
 * (note: Professional.jpg and Clean.jpg use uppercase; precission-ats has a typo).
 */

import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const TEMPLATES = [
  {
    slug: 'classic',
    name: 'Classic',
    thumbnail: '/resume-templates/classic.jpg',
  },
  {
    slug: 'traditional',
    name: 'Traditional',
    thumbnail: '/resume-templates/traditional.jpg',
  },
  {
    slug: 'professional',
    name: 'Professional',
    thumbnail: '/resume-templates/Professional.jpg',
  },
  {
    slug: 'prime-ats',
    name: 'Prime ATS',
    thumbnail: '/resume-templates/prime-ats.jpg',
  },
  {
    slug: 'clean',
    name: 'Clean',
    thumbnail: '/resume-templates/Clean.jpg',
  },
  {
    slug: 'precision-ats',
    name: 'Precision ATS',
    thumbnail: '/resume-templates/precission-ats.jpg', // intentional typo — matches public/
  },
] as const;

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set. Check your .env file.');
  }

  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  });
  const prisma = new PrismaClient({ adapter });

  console.log('🌱 Seeding ResumeTemplate table...\n');

  for (const tpl of TEMPLATES) {
    const record = await prisma.resumeTemplate.upsert({
      where: { slug: tpl.slug },
      update: { name: tpl.name, thumbnail: tpl.thumbnail },
      create: { slug: tpl.slug, name: tpl.name, thumbnail: tpl.thumbnail },
    });
    console.log(`  ✓  ${record.slug.padEnd(16)}  id: ${record.id}`);
  }

  console.log('\n✅ Seeding complete.');
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('\n❌ Seed failed:', err);
  process.exit(1);
});
