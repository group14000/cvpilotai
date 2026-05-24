// Precision ATS — Skills-highlighted, fully ATS-compatible resume template.
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
    <ul className="mt-1.5 space-y-0.5 pl-5">
      {items.map((item) =>
        item.type === 'bullet' ? (
          <li
            key={item.id}
            className="list-disc text-[12px] leading-[1.7] text-zinc-700"
          >
            {item.content}
          </li>
        ) : (
          <p key={item.id} className="text-[12px] leading-[1.7] text-zinc-700">
            {item.content}
          </p>
        )
      )}
    </ul>
  );
}

type Props = { resume: Resume };

export default function PrecisionATSTemplate({ resume }: Props) {
  const { personalInfo } = resume;

  const contactParts = [
    personalInfo.email,
    personalInfo.phone,
    personalInfo.location,
  ].filter(Boolean);

  const linkParts = [
    personalInfo.linkedin,
    personalInfo.github,
    personalInfo.portfolio,
  ].filter(Boolean);

  // Group skills by proficiency for the skills highlight section
  const expertSkills = resume.skills.filter((s) => s.proficiency === 'Expert');
  const otherSkills = resume.skills.filter((s) => s.proficiency !== 'Expert');

  return (
    <div className="min-h-[1123px] w-[794px] bg-white px-12 py-10 font-sans text-[#111]">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="border-b-2 border-zinc-900 pb-4">
        <h1 className="text-[28px] font-bold text-zinc-900">
          {personalInfo.firstName}
          {personalInfo.middleName ? ` ${personalInfo.middleName}` : ''}{' '}
          {personalInfo.lastName}
        </h1>
        {contactParts.length > 0 && (
          <p className="mt-1 text-[12px] text-zinc-600">
            {contactParts.join('  |  ')}
          </p>
        )}
        {linkParts.length > 0 && (
          <p className="mt-0.5 text-[11px] text-zinc-400">
            {linkParts.join('  |  ')}
          </p>
        )}
      </div>

      {/* ── Core Competencies (Skills Highlight) ────────────────────────── */}
      {resume.skills.length > 0 && (
        <div className="my-5 rounded bg-zinc-50 px-5 py-4">
          <h2 className="mb-3 text-[11px] font-bold tracking-widest text-zinc-800 uppercase">
            Core Competencies
          </h2>
          <div className="flex flex-wrap gap-2">
            {expertSkills.map((skill) => (
              <span
                key={skill.id}
                className="rounded bg-zinc-800 px-2.5 py-0.5 text-[11.5px] font-medium text-white"
              >
                {skill.name}
              </span>
            ))}
            {otherSkills.map((skill) => (
              <span
                key={skill.id}
                className="rounded border border-zinc-300 px-2.5 py-0.5 text-[11.5px] text-zinc-700"
              >
                {skill.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Summary ─────────────────────────────────────────────────────── */}
      {resume.summary && (
        <div className="mb-5">
          <h2 className="border-b border-zinc-300 pb-0.5 text-[12px] font-bold tracking-widest text-zinc-700 uppercase">
            Professional Summary
          </h2>
          <p className="mt-2 text-[12.5px] leading-[1.75] text-zinc-700">
            {resume.summary}
          </p>
        </div>
      )}

      {/* ── Experience ──────────────────────────────────────────────────── */}
      {resume.experiences.length > 0 && (
        <div className="mb-5">
          <h2 className="border-b border-zinc-300 pb-0.5 text-[12px] font-bold tracking-widest text-zinc-700 uppercase">
            Professional Experience
          </h2>
          <div className="mt-3 space-y-5">
            {resume.experiences.map((exp) => (
              <div key={exp.id}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-[13.5px] font-bold text-zinc-900">
                      {exp.role}
                    </h3>
                    <p className="text-[12px] font-medium text-zinc-600">
                      {exp.companyName}
                      {exp.location ? ` — ${exp.location}` : ''}
                    </p>
                  </div>
                  <span className="shrink-0 text-[11.5px] font-medium whitespace-nowrap text-zinc-500">
                    {fmt(exp.startDate)} – {fmt(exp.endDate)}
                  </span>
                </div>
                {exp.description && exp.description.length > 0 && (
                  <BulletList items={exp.description} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Education ───────────────────────────────────────────────────── */}
      {resume.education.length > 0 && (
        <div className="mb-5">
          <h2 className="border-b border-zinc-300 pb-0.5 text-[12px] font-bold tracking-widest text-zinc-700 uppercase">
            Education
          </h2>
          <div className="mt-3 space-y-3">
            {resume.education.map((edu) => (
              <div
                key={edu.id}
                className="flex items-start justify-between gap-4"
              >
                <div>
                  <h3 className="text-[13px] font-bold text-zinc-900">
                    {edu.institution}
                  </h3>
                  <p className="text-[12px] text-zinc-600">
                    {edu.degree}
                    {edu.areaOfStudy ? `, ${edu.areaOfStudy}` : ''}
                    {edu.grade ? `  ·  ${edu.grade}` : ''}
                  </p>
                </div>
                <span className="shrink-0 text-[11.5px] whitespace-nowrap text-zinc-500">
                  {fmt(edu.startDate)} – {fmt(edu.endDate)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Projects ────────────────────────────────────────────────────── */}
      {resume.projects.length > 0 && (
        <div className="mb-5">
          <h2 className="border-b border-zinc-300 pb-0.5 text-[12px] font-bold tracking-widest text-zinc-700 uppercase">
            Projects
          </h2>
          <div className="mt-3 space-y-4">
            {resume.projects.map((proj) => (
              <div key={proj.id}>
                <h3 className="text-[13px] font-bold text-zinc-900">
                  {proj.name}
                  {proj.website ? (
                    <span className="ml-2 text-[11px] font-normal text-zinc-400">
                      {proj.website}
                    </span>
                  ) : null}
                </h3>
                {proj.description && proj.description.length > 0 && (
                  <BulletList items={proj.description} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Certifications ──────────────────────────────────────────────── */}
      {resume.certifications.length > 0 && (
        <div>
          <h2 className="border-b border-zinc-300 pb-0.5 text-[12px] font-bold tracking-widest text-zinc-700 uppercase">
            Certifications
          </h2>
          <div className="mt-3 space-y-1.5">
            {resume.certifications.map((cert) => (
              <div
                key={cert.id}
                className="flex items-baseline justify-between gap-4"
              >
                <p className="text-[12.5px] text-zinc-800">
                  <span className="font-semibold">{cert.title}</span>
                  <span className="mx-1.5 text-zinc-300">|</span>
                  <span className="text-zinc-600">{cert.issuer}</span>
                </p>
                <span className="shrink-0 text-[11px] text-zinc-400">
                  {fmt(cert.date)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
