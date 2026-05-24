// Prime ATS — ATS-optimized resume. Minimal formatting, plain semantic structure.
// No tables, no columns, no graphics. Pure text hierarchy for maximum ATS compatibility.
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
    <ul className="mt-1.5 space-y-0.5 pl-4">
      {items.map((item) =>
        item.type === 'bullet' ? (
          <li
            key={item.id}
            className="list-disc text-[12.5px] leading-[1.7] text-zinc-800 marker:text-zinc-500"
          >
            {item.content}
          </li>
        ) : (
          <li
            key={item.id}
            className="text-[12.5px] leading-[1.7] text-zinc-800"
          >
            {item.content}
          </li>
        )
      )}
    </ul>
  );
}

type Props = { resume: Resume };

export default function PrimeATSTemplate({ resume }: Props) {
  const { personalInfo } = resume;

  const contactParts = [
    personalInfo.email,
    personalInfo.phone,
    personalInfo.location,
    personalInfo.linkedin,
    personalInfo.github,
    personalInfo.portfolio,
  ].filter(Boolean);

  return (
    <div className="min-h-[1123px] w-[794px] bg-white px-12 py-10 font-sans text-[#111]">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="mb-6">
        <h1 className="text-[26px] font-bold text-zinc-900">
          {personalInfo.firstName}
          {personalInfo.middleName ? ` ${personalInfo.middleName}` : ''}{' '}
          {personalInfo.lastName}
        </h1>
        {contactParts.length > 0 && (
          <p className="mt-1 text-[12px] text-zinc-600">
            {contactParts.join(' | ')}
          </p>
        )}
      </div>

      {/* ── Summary ─────────────────────────────────────────────────────── */}
      {resume.summary && (
        <div className="mb-5">
          <h2 className="border-b border-zinc-400 pb-0.5 text-[13px] font-bold text-zinc-900 uppercase">
            Summary
          </h2>
          <p className="mt-2 text-[12.5px] leading-[1.7] text-zinc-800">
            {resume.summary}
          </p>
        </div>
      )}

      {/* ── Experience ──────────────────────────────────────────────────── */}
      {resume.experiences.length > 0 && (
        <div className="mb-5">
          <h2 className="border-b border-zinc-400 pb-0.5 text-[13px] font-bold text-zinc-900 uppercase">
            Work Experience
          </h2>
          <div className="mt-2 space-y-4">
            {resume.experiences.map((exp) => (
              <div key={exp.id}>
                <div className="flex justify-between text-[13px]">
                  <span className="font-bold text-zinc-900">
                    {exp.role} — {exp.companyName}
                  </span>
                  <span className="font-medium text-zinc-600">
                    {fmt(exp.startDate)} – {fmt(exp.endDate)}
                  </span>
                </div>
                {exp.location && (
                  <p className="text-[12px] text-zinc-500">{exp.location}</p>
                )}
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
          <h2 className="border-b border-zinc-400 pb-0.5 text-[13px] font-bold text-zinc-900 uppercase">
            Education
          </h2>
          <div className="mt-2 space-y-3">
            {resume.education.map((edu) => (
              <div key={edu.id}>
                <div className="flex justify-between text-[13px]">
                  <span className="font-bold text-zinc-900">
                    {edu.institution}
                  </span>
                  <span className="font-medium text-zinc-600">
                    {fmt(edu.startDate)} – {fmt(edu.endDate)}
                  </span>
                </div>
                <p className="text-[12.5px] text-zinc-700">
                  {edu.degree}
                  {edu.areaOfStudy ? `, ${edu.areaOfStudy}` : ''}
                  {edu.grade ? ` | GPA: ${edu.grade}` : ''}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Skills ──────────────────────────────────────────────────────── */}
      {resume.skills.length > 0 && (
        <div className="mb-5">
          <h2 className="border-b border-zinc-400 pb-0.5 text-[13px] font-bold text-zinc-900 uppercase">
            Skills
          </h2>
          <p className="mt-2 text-[12.5px] text-zinc-800">
            {resume.skills.map((s) => s.name).join(' · ')}
          </p>
        </div>
      )}

      {/* ── Projects ────────────────────────────────────────────────────── */}
      {resume.projects.length > 0 && (
        <div className="mb-5">
          <h2 className="border-b border-zinc-400 pb-0.5 text-[13px] font-bold text-zinc-900 uppercase">
            Projects
          </h2>
          <div className="mt-2 space-y-4">
            {resume.projects.map((proj) => (
              <div key={proj.id}>
                <p className="text-[13px] font-bold text-zinc-900">
                  {proj.name}
                  {proj.website ? ` | ${proj.website}` : ''}
                </p>
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
          <h2 className="border-b border-zinc-400 pb-0.5 text-[13px] font-bold text-zinc-900 uppercase">
            Certifications
          </h2>
          <div className="mt-2 space-y-1.5">
            {resume.certifications.map((cert) => (
              <p key={cert.id} className="text-[12.5px] text-zinc-800">
                <span className="font-semibold">{cert.title}</span>
                {' — '}
                {cert.issuer} ({fmt(cert.date)})
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
