export interface Project {
  title: string;
  description: string;
  tags: string[];
  links: { label: string; href: string }[];
}

// TODO(Brodie): add real projects (Salesforce builds, RevOps dashboards, enablement programs...).
export const PROJECTS: Project[] = [
  {
    title: 'GTM Quest',
    description:
      'This site. An 8-bit platformer résumé built from scratch with React, TypeScript, the Canvas API and Web Audio. No game engine.',
    tags: ['React', 'TypeScript', 'Canvas', 'Web Audio'],
    links: [{ label: 'Play it', href: '/' }],
  },
];
