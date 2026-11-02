export type SkillIcon = 'double' | 'bolt' | 'magnet' | 'shield';

export interface Skill {
  id: string;
  name: string;
  /** In-game ability granted by the power-up. */
  power: string;
  powerDesc: string;
  color: string;
  icon: SkillIcon;
  summary: string;
}

export interface Role {
  company: string;
  title: string;
  dates: string;
  highlights: string[];
}

export const LINKEDIN_URL = 'https://www.linkedin.com/in/brodieheginbotham/';
export const GITHUB_URL = 'https://github.com/brodieheg';

export const BIO = {
  name: 'Brodie Heginbotham',
  location: 'Durham, North Carolina',
  headline: "I'm a GTM Engineer. I build the systems revenue teams run on.",
  tagline: 'Sales, ops, enablement and code. A GTM Swiss Army Knife.',
  intro:
    'I started on the phones as an enterprise SDR, moved into sales operations and enablement, and now engineer go-to-market systems full time. I know the workflows from the inside because I used to live in them, which makes me good at automating the parts that slow teams down.',
};

// Newest first.
export const EXPERIENCE: Role[] = [
  {
    company: 'ServiceTrade',
    title: 'GTM Engineer',
    dates: 'Present',
    highlights: [
      'Optimize the account management and post-sales process end to end.',
      'Automated the capture of product overage revenue.',
    ],
  },
  {
    company: 'Make',
    title: 'Solutions Engineering Enablement Associate',
    dates: 'May 2025 – 2025',
    highlights: [
      'Redesigned onboarding and sales training for CSMs and Solutions Engineers, focused on sales acumen and business value.',
      'Built and deployed a network of AI agents that help CSMs manage accounts and build sales skills.',
      'Designed and launched an Account Expansion Strategy that drove an additional $4M ARR.',
    ],
  },
  {
    company: 'Rocket Lawyer',
    title: 'Enterprise Sales Operations & Enablement Associate',
    dates: 'Aug 2024 – May 2025',
    highlights: [
      'Automated customer invoicing with Salesforce and Intacct, freeing up CSM and accounting time.',
      'Designed Salesforce architecture for three new enterprise revenue channels, resulting in $2.1M in new business.',
      'Cut new-rep onboarding by two months; average time-to-quota under my process was five weeks.',
    ],
  },
  {
    company: 'Rocket Lawyer',
    title: 'Enterprise Sales Development Representative',
    dates: 'Aug 2023 – Aug 2024',
    highlights: [
      '150% average monthly quota attainment (Q3 2023 – Q2 2024).',
      'Sourced over $350K ARR.',
      'Led sales operations improvements to maximize team efficiency.',
    ],
  },
];

export const EDUCATION = [
  { school: 'UNC Chapel Hill', detail: "Bachelor's in Marketing, Summa Cum Laude with Honors" },
  { school: 'Duke Divinity School', detail: 'M.Div, Certificate in Faith-Based Community Organizing and Social Action' },
  { school: 'Parsity', detail: 'Certificate in Full-Stack Software Development' },
];

export const TOOLBOX = [
  'Salesforce (Certified Admin)', 'Apex', 'JavaScript', 'SQL', 'Tableau', 'Make', 'n8n',
  'AI agents', 'Outreach (Admin)', 'Gong', 'ZoomInfo', 'Sales Navigator', 'HTML/CSS',
];

// One power-up per career world, handed out by the level's skill blocks left to right.
export const SKILLS: Skill[] = [
  {
    id: 'prospecting',
    name: 'Prospecting',
    power: 'Double Jump',
    powerDesc: 'Press jump again in mid-air. Bounce back from every "no".',
    color: '#3fbf6f',
    icon: 'double',
    summary:
      'Cold calling, outreach and full-cycle sales. As an enterprise SDR at Rocket Lawyer I averaged 150% of monthly quota and sourced over $350K ARR.',
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    power: 'Automation Boost',
    powerDesc: 'Run faster. The busywork runs itself now.',
    color: '#1798c1',
    icon: 'bolt',
    summary:
      'Certified Salesforce Admin who writes Apex and JavaScript. I architected Salesforce for three new enterprise revenue channels ($2.1M in new business) and automated invoicing with Intacct.',
  },
  {
    id: 'enablement',
    name: 'Enablement & AI Agents',
    power: 'Team Shield',
    powerDesc: 'Absorbs one hit. Recharges at every signpost.',
    color: '#ff8a3d',
    icon: 'shield',
    summary:
      'I build programs and tools that make whole teams better: onboarding that got reps to quota in five weeks, a network of AI agents for CSMs, and an expansion strategy worth $4M ARR.',
  },
  {
    id: 'gtm-engineering',
    name: 'GTM Engineering',
    power: 'Revenue Magnet',
    powerDesc: 'Nearby deals flow straight to you. Nothing slips through.',
    color: '#a463f2',
    icon: 'magnet',
    summary:
      'At ServiceTrade I optimize account management and post-sales, and I automated the capture of product overage revenue so it never gets left on the table.',
  },
];

// Signposts in the level, left to right, one at the start of each world. Each is also a checkpoint.
// Keep each under ~100 characters so it fits the in-game dialog box.
export const MILESTONES: string[] = [
  'Durham, NC. UNC marketing grad, Duke M.Div, full-stack bootcamp. Time to sell!',
  'Rocket Lawyer SDR: 150% avg monthly quota and $350K+ ARR sourced.',
  'Sales Ops: Salesforce for 3 new channels = $2.1M. Reps hit quota in 5 weeks.',
  'Make: AI agents for CSMs and an expansion play worth +$4M ARR.',
  'ServiceTrade GTM Engineer: post-sales optimized, overage revenue on autopilot.',
];
