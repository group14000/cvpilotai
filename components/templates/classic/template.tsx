import type { Resume, DescriptionBlock } from '@/types/resume';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

function fmt(dateStr: string): string {
  if (!dateStr || dateStr === 'Present') return dateStr;
  const [year, month] = dateStr.split('-');
  if (!month || !year) return dateStr;
  return `${MONTHS[parseInt(month, 10) - 1]} ${year}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function BulletList({ items }: { items: DescriptionBlock[] }) {
  return (
    <div className="mt-2 space-y-1">
      {items.map((item) =>
        item.type === 'bullet' ? (
          <div
            key={item.id}
            className="flex gap-2.5 text-sm leading-[1.65] text-zinc-700"
          >
            <span className="mt-[8px] h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-400" />
            <span>{item.content}</span>
          </div>
        ) : (
          <p key={item.id} className="text-sm leading-[1.65] text-zinc-700">
            {item.content}
          </p>
        )
      )}
    </div>
  );
}

function SectionRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[160px_1fr] gap-10 border-b border-zinc-200 py-7">
      <h2 className="pt-0.5 font-serif text-[11px] font-bold tracking-[3px] text-zinc-400 uppercase">
        {label}
      </h2>
      <div>{children}</div>
    </div>
  );
}

// ─── Template ─────────────────────────────────────────────────────────────────

type Props = { resume: Resume };

export default function ClassicTemplate({ resume }: Props) {
  const { personalInfo } = resume;

  const contactParts = [
    personalInfo.location,
    personalInfo.phone,
    personalInfo.email,
  ].filter(Boolean);

  const linkParts = [
    personalInfo.linkedin,
    personalInfo.github,
    personalInfo.portfolio,
  ].filter(Boolean);

  return (
    <div className="min-h-[1123px] w-[794px] bg-white px-16 py-12 font-sans text-[#1a1a1a]">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="border-b border-zinc-200 pb-7 text-center">
        <h1 className="font-serif text-[30px] font-semibold tracking-tight">
          {personalInfo.firstName}
          {personalInfo.middleName ? ` ${personalInfo.middleName}` : ''}{' '}
          {personalInfo.lastName}
        </h1>
        {contactParts.length > 0 && (
          <p className="mt-2.5 text-[13px] text-zinc-600">
            {contactParts.join('  •  ')}
          </p>
        )}
        {linkParts.length > 0 && (
          <p className="mt-1 text-[12px] text-zinc-400">
            {linkParts.join('  •  ')}
          </p>
        )}
      </div>

      {/* ── Profile ─────────────────────────────────────────────────────── */}
      {resume.summary && (
        <SectionRow label="Profile">
          <p className="text-[13px] leading-[1.8] text-zinc-700">
            {resume.summary}
          </p>
        </SectionRow>
      )}

      {/* ── Experience ──────────────────────────────────────────────────── */}
      {resume.experiences.length > 0 && (
        <SectionRow label="Experience">
          <div className="space-y-6">
            {resume.experiences.map((exp) => (
              <div key={exp.id}>
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="font-serif text-[15px] font-semibold">
                    {exp.companyName}
                  </h3>
                  <span className="shrink-0 text-[11px] text-zinc-400">
                    {fmt(exp.startDate)} – {fmt(exp.endDate)}
                  </span>
                </div>
                <p className="mt-0.5 text-[13px] font-medium text-zinc-500">
                  {exp.role}
                  {exp.location ? `  •  ${exp.location}` : ''}
                </p>
                {exp.description && exp.description.length > 0 && (
                  <BulletList items={exp.description} />
                )}
              </div>
            ))}
          </div>
        </SectionRow>
      )}

      {/* ── Education ───────────────────────────────────────────────────── */}
      {resume.education.length > 0 && (
        <SectionRow label="Education">
          <div className="space-y-5">
            {resume.education.map((edu) => (
              <div key={edu.id}>
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="font-serif text-[15px] font-semibold">
                    {edu.institution}
                  </h3>
                  <span className="shrink-0 text-[11px] text-zinc-400">
                    {fmt(edu.startDate)} – {fmt(edu.endDate)}
                  </span>
                </div>
                <p className="mt-0.5 text-[13px] text-zinc-500">
                  {edu.degree}
                  {edu.areaOfStudy ? `, ${edu.areaOfStudy}` : ''}
                  {edu.grade ? `  •  ${edu.grade}` : ''}
                </p>
                {edu.location && (
                  <p className="text-[12px] text-zinc-400">{edu.location}</p>
                )}
                {edu.description && edu.description.length > 0 && (
                  <BulletList items={edu.description} />
                )}
              </div>
            ))}
          </div>
        </SectionRow>
      )}

      {/* ── Skills ──────────────────────────────────────────────────────── */}
      {resume.skills.length > 0 && (
        <SectionRow label="Skills">
          <div className="flex flex-wrap gap-x-8 gap-y-2">
            {resume.skills.map((skill) => (
              <div key={skill.id} className="text-[13px]">
                <span className="font-medium text-zinc-800">{skill.name}</span>
                {skill.proficiency && (
                  <span className="ml-1.5 text-zinc-400">
                    {skill.proficiency}
                  </span>
                )}
              </div>
            ))}
          </div>
        </SectionRow>
      )}

      {/* ── Projects ────────────────────────────────────────────────────── */}
      {resume.projects.length > 0 && (
        <SectionRow label="Projects">
          <div className="space-y-5">
            {resume.projects.map((proj) => (
              <div key={proj.id}>
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="font-serif text-[15px] font-semibold">
                    {proj.name}
                  </h3>
                  {(proj.website || proj.sourceCode) && (
                    <span className="shrink-0 text-[11px] text-zinc-400">
                      {[proj.website, proj.sourceCode]
                        .filter(Boolean)
                        .join('  •  ')}
                    </span>
                  )}
                </div>
                {proj.description && proj.description.length > 0 && (
                  <BulletList items={proj.description} />
                )}
              </div>
            ))}
          </div>
        </SectionRow>
      )}

      {/* ── Certifications ──────────────────────────────────────────────── */}
      {resume.certifications.length > 0 && (
        <div className="grid grid-cols-[160px_1fr] gap-10 py-7">
          <h2 className="pt-0.5 font-serif text-[11px] font-bold tracking-[3px] text-zinc-400 uppercase">
            Certifications
          </h2>
          <div className="space-y-3">
            {resume.certifications.map((cert) => (
              <div key={cert.id}>
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="text-[13px] font-semibold">{cert.title}</h3>
                  <span className="shrink-0 text-[11px] text-zinc-400">
                    {fmt(cert.date)}
                  </span>
                </div>
                <p className="text-[12px] text-zinc-400">{cert.issuer}</p>
                {cert.description && cert.description.length > 0 && (
                  <BulletList items={cert.description} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
