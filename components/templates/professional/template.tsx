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
    <div className="mt-1.5 space-y-1">
      {items.map((item) =>
        item.type === 'bullet' ? (
          <div
            key={item.id}
            className="flex gap-2 text-[12px] leading-relaxed text-zinc-700"
          >
            <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-indigo-400" />
            <span>{item.content}</span>
          </div>
        ) : (
          <p
            key={item.id}
            className="text-[12px] leading-relaxed text-zinc-700"
          >
            {item.content}
          </p>
        )
      )}
    </div>
  );
}

type Props = { resume: Resume };

export default function ProfessionalTemplate({ resume }: Props) {
  const { personalInfo } = resume;

  return (
    <div className="flex min-h-[1123px] w-[794px] bg-white font-sans text-[#1a1a1a]">
      {/* ── Left Sidebar ─────────────────────────────────────────────── */}
      <div className="w-[230px] shrink-0 bg-indigo-900 px-6 py-10 text-white">
        <div className="mb-8 border-b border-indigo-700 pb-6">
          <h1 className="text-[22px] leading-snug font-bold">
            {personalInfo.firstName}
            {personalInfo.middleName ? ` ${personalInfo.middleName}` : ''}
            <br />
            {personalInfo.lastName}
          </h1>
        </div>

        {/* Contact */}
        <div className="mb-7">
          <h2 className="mb-3 text-[10px] font-bold tracking-widest text-indigo-300 uppercase">
            Contact
          </h2>
          <div className="space-y-1.5 text-[11px] text-indigo-100">
            {personalInfo.email && (
              <p className="break-all">{personalInfo.email}</p>
            )}
            {personalInfo.phone && <p>{personalInfo.phone}</p>}
            {personalInfo.location && <p>{personalInfo.location}</p>}
            {personalInfo.linkedin && (
              <p className="break-all">{personalInfo.linkedin}</p>
            )}
            {personalInfo.github && (
              <p className="break-all">{personalInfo.github}</p>
            )}
            {personalInfo.portfolio && (
              <p className="break-all">{personalInfo.portfolio}</p>
            )}
          </div>
        </div>

        {/* Skills */}
        {resume.skills.length > 0 && (
          <div className="mb-7">
            <h2 className="mb-3 text-[10px] font-bold tracking-widest text-indigo-300 uppercase">
              Skills
            </h2>
            <div className="space-y-1.5">
              {resume.skills.map((skill) => (
                <div key={skill.id} className="text-[12px] text-white">
                  {skill.name}
                  {skill.proficiency && (
                    <span className="ml-1 text-[10px] text-indigo-300">
                      ({skill.proficiency})
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Certifications */}
        {resume.certifications.length > 0 && (
          <div>
            <h2 className="mb-3 text-[10px] font-bold tracking-widest text-indigo-300 uppercase">
              Certifications
            </h2>
            <div className="space-y-2">
              {resume.certifications.map((cert) => (
                <div key={cert.id} className="text-[11px] text-indigo-100">
                  <p className="font-semibold">{cert.title}</p>
                  <p className="text-indigo-300">
                    {cert.issuer} · {fmt(cert.date)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Main Content ─────────────────────────────────────────────── */}
      <div className="flex-1 px-10 py-10">
        {/* Summary */}
        {resume.summary && (
          <div className="mb-7">
            <h2 className="mb-2 text-[11px] font-bold tracking-widest text-indigo-600 uppercase">
              Profile
            </h2>
            <div className="mb-3 h-0.5 w-10 bg-indigo-600" />
            <p className="text-[13px] leading-[1.8] text-zinc-700">
              {resume.summary}
            </p>
          </div>
        )}

        {/* Experience */}
        {resume.experiences.length > 0 && (
          <div className="mb-7">
            <h2 className="mb-2 text-[11px] font-bold tracking-widest text-indigo-600 uppercase">
              Experience
            </h2>
            <div className="mb-3 h-0.5 w-10 bg-indigo-600" />
            <div className="space-y-5">
              {resume.experiences.map((exp) => (
                <div key={exp.id}>
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-[14px] font-bold text-zinc-900">
                      {exp.role}
                    </h3>
                    <span className="text-[11px] text-zinc-400">
                      {fmt(exp.startDate)} – {fmt(exp.endDate)}
                    </span>
                  </div>
                  <p className="text-[12px] font-medium text-indigo-600">
                    {exp.companyName}
                    {exp.location ? ` · ${exp.location}` : ''}
                  </p>
                  {exp.description && exp.description.length > 0 && (
                    <BulletList items={exp.description} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {resume.education.length > 0 && (
          <div className="mb-7">
            <h2 className="mb-2 text-[11px] font-bold tracking-widest text-indigo-600 uppercase">
              Education
            </h2>
            <div className="mb-3 h-0.5 w-10 bg-indigo-600" />
            <div className="space-y-4">
              {resume.education.map((edu) => (
                <div key={edu.id}>
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-[13px] font-bold text-zinc-900">
                      {edu.institution}
                    </h3>
                    <span className="text-[11px] text-zinc-400">
                      {fmt(edu.startDate)} – {fmt(edu.endDate)}
                    </span>
                  </div>
                  <p className="text-[12px] text-zinc-600">
                    {edu.degree}
                    {edu.areaOfStudy ? `, ${edu.areaOfStudy}` : ''}
                    {edu.grade ? ` · ${edu.grade}` : ''}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Projects */}
        {resume.projects.length > 0 && (
          <div>
            <h2 className="mb-2 text-[11px] font-bold tracking-widest text-indigo-600 uppercase">
              Projects
            </h2>
            <div className="mb-3 h-0.5 w-10 bg-indigo-600" />
            <div className="space-y-4">
              {resume.projects.map((proj) => (
                <div key={proj.id}>
                  <h3 className="text-[13px] font-bold text-zinc-900">
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
          </div>
        )}
      </div>
    </div>
  );
}
