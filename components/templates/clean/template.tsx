// Clean — Modern resume with bold typography and clean geometric accents.
import type { Resume, DescriptionBlock } from '@/types/resume';

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

function BulletList({ items }: { items: DescriptionBlock[] }) {
  return (
    <div className="mt-2 space-y-1">
      {items.map((item) =>
        item.type === 'bullet' ? (
          <div
            key={item.id}
            className="flex gap-3 text-[12.5px] leading-relaxed text-zinc-600"
          >
            <span className="mt-[8px] h-1 w-3 shrink-0 bg-emerald-500" />
            <span>{item.content}</span>
          </div>
        ) : (
          <p
            key={item.id}
            className="text-[12.5px] leading-relaxed text-zinc-600"
          >
            {item.content}
          </p>
        )
      )}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-7 mb-4 flex items-center gap-3">
      <span className="h-5 w-1 rounded-full bg-emerald-500" />
      <h2 className="text-[15px] font-extrabold tracking-wider text-zinc-900 uppercase">
        {children}
      </h2>
    </div>
  );
}

type Props = { resume: Resume };

export default function CleanTemplate({ resume }: Props) {
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
    <div className="min-h-[1123px] w-[794px] bg-white px-14 py-12 font-sans">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="mb-0">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-[38px] leading-none font-black tracking-tight text-zinc-900 uppercase">
              {personalInfo.firstName}
              {personalInfo.middleName ? ` ${personalInfo.middleName}` : ''}
            </h1>
            <h1 className="text-[38px] leading-none font-black tracking-tight text-emerald-500 uppercase">
              {personalInfo.lastName}
            </h1>
          </div>
          <div className="space-y-0.5 pb-1 text-right text-[12px] text-zinc-500">
            {contactParts.map((part, i) => (
              <p key={i}>{part}</p>
            ))}
            {linkParts.map((part, i) => (
              <p key={i} className="text-zinc-400">
                {part}
              </p>
            ))}
          </div>
        </div>
        <div className="mt-4 h-1 bg-zinc-900" />
      </div>

      {/* ── Summary ─────────────────────────────────────────────────────── */}
      {resume.summary && (
        <>
          <SectionTitle>About Me</SectionTitle>
          <p className="text-[13px] leading-[1.8] text-zinc-600">
            {resume.summary}
          </p>
        </>
      )}

      {/* ── Experience ──────────────────────────────────────────────────── */}
      {resume.experiences.length > 0 && (
        <>
          <SectionTitle>Experience</SectionTitle>
          <div className="space-y-6">
            {resume.experiences.map((exp) => (
              <div
                key={exp.id}
                className="relative pl-4 before:absolute before:top-1.5 before:left-0 before:h-full before:w-px before:bg-zinc-200"
              >
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="text-[14px] font-bold text-zinc-900">
                    {exp.role}
                  </h3>
                  <span className="shrink-0 rounded bg-zinc-100 px-2 py-0.5 text-[10.5px] font-medium text-zinc-500">
                    {fmt(exp.startDate)} – {fmt(exp.endDate)}
                  </span>
                </div>
                <p className="mt-0.5 text-[12.5px] font-semibold text-emerald-600">
                  {exp.companyName}
                  {exp.location ? ` · ${exp.location}` : ''}
                </p>
                {exp.description && exp.description.length > 0 && (
                  <BulletList items={exp.description} />
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Education ───────────────────────────────────────────────────── */}
      {resume.education.length > 0 && (
        <>
          <SectionTitle>Education</SectionTitle>
          <div className="space-y-4">
            {resume.education.map((edu) => (
              <div
                key={edu.id}
                className="relative pl-4 before:absolute before:top-1.5 before:left-0 before:h-full before:w-px before:bg-zinc-200"
              >
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="text-[14px] font-bold text-zinc-900">
                    {edu.institution}
                  </h3>
                  <span className="shrink-0 rounded bg-zinc-100 px-2 py-0.5 text-[10.5px] font-medium text-zinc-500">
                    {fmt(edu.startDate)} – {fmt(edu.endDate)}
                  </span>
                </div>
                <p className="mt-0.5 text-[12.5px] text-zinc-600">
                  {edu.degree}
                  {edu.areaOfStudy ? `, ${edu.areaOfStudy}` : ''}
                  {edu.grade ? ` · ${edu.grade}` : ''}
                </p>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Skills ──────────────────────────────────────────────────────── */}
      {resume.skills.length > 0 && (
        <>
          <SectionTitle>Skills</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {resume.skills.map((skill) => (
              <span
                key={skill.id}
                className="rounded-full bg-emerald-50 px-3 py-1 text-[11.5px] font-medium text-emerald-800"
              >
                {skill.name}
              </span>
            ))}
          </div>
        </>
      )}

      {/* ── Projects ────────────────────────────────────────────────────── */}
      {resume.projects.length > 0 && (
        <>
          <SectionTitle>Projects</SectionTitle>
          <div className="space-y-5">
            {resume.projects.map((proj) => (
              <div
                key={proj.id}
                className="relative pl-4 before:absolute before:top-1.5 before:left-0 before:h-full before:w-px before:bg-zinc-200"
              >
                <h3 className="text-[14px] font-bold text-zinc-900">
                  {proj.name}
                </h3>
                {(proj.website || proj.sourceCode) && (
                  <p className="text-[11px] text-zinc-400">
                    {[proj.website, proj.sourceCode]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                )}
                {proj.description && proj.description.length > 0 && (
                  <BulletList items={proj.description} />
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Certifications ──────────────────────────────────────────────── */}
      {resume.certifications.length > 0 && (
        <>
          <SectionTitle>Certifications</SectionTitle>
          <div className="space-y-2">
            {resume.certifications.map((cert) => (
              <div key={cert.id} className="flex items-center gap-3">
                <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                <span className="text-[12.5px] font-semibold text-zinc-800">
                  {cert.title}
                </span>
                <span className="text-[11.5px] text-zinc-400">
                  {cert.issuer} · {fmt(cert.date)}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
