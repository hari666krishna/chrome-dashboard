export type PurposeGroupName =
  | 'Google'
  | 'Study'
  | 'Research'
  | 'Entertainment'
  | 'Development'
  | 'Productivity'
  | 'Personal';

export const PURPOSE_GROUPS: PurposeGroupName[] = [
  'Google',
  'Study',
  'Research',
  'Entertainment',
  'Development',
  'Productivity',
  'Personal',
];

interface RuleSet {
  group: PurposeGroupName;
  domains: string[];
  keywords: string[];
}

// Order matters: more specific rules (e.g. scholar.google.com -> Research) come before general Google rules.
const PURPOSE_RULES: RuleSet[] = [
  {
    group: 'Research',
    domains: [
      'scholar.google.',
      'arxiv.org',
      'pubmed.ncbi',
      'ieee.org',
      'ieeexplore.ieee.org',
      'sciencedirect.com',
      'jstor.org',
      'semanticscholar.org',
      'researchgate.net',
      'ssrn.com',
      'nature.com',
      'springer.com',
      'wiley.com',
      'acm.org',
      'wolframalpha.com',
      'perplexity.ai',
      'claude.ai',
      'chatgpt.com',
      'openai.com',
      'openalex.org',
    ],
    keywords: [
      'research',
      'scholar',
      'arxiv',
      'claude',
      'paper',
      'journal',
      'thesis',
      'pubmed',
      'citation',
      'ieee',
    ],
  },
  {
    group: 'Google',
    domains: [
      'google.com',
      'mail.google.com',
      'calendar.google.com',
      'drive.google.com',
      'docs.google.com',
      'sheets.google.com',
      'slides.google.com',
      'maps.google.com',
      'meet.google.com',
      'keep.google.com',
      'photos.google.com',
      'translate.google.com',
      'classroom.google.com',
      'workspace.google.com',
    ],
    keywords: [
      'gmail',
      'google drive',
      'google docs',
      'google sheets',
      'google calendar',
      'google maps',
      'google meet',
      'google keep',
      'google translate',
      'google',
    ],
  },
  {
    group: 'Study',
    domains: [
      'wikipedia.org',
      'khanacademy.org',
      'coursera.org',
      'edx.org',
      'udemy.com',
      'quizlet.com',
      'duolingo.com',
      'ankiweb.net',
      'brilliant.org',
      'freecodecamp.org',
      'w3schools.com',
      'geeksforgeeks.org',
      'ocw.mit.edu',
      'codecademy.com',
      'leetcode.com',
      'hackerrank.com',
    ],
    keywords: [
      'study',
      'learn',
      'course',
      'lecture',
      'tutorial',
      'exam',
      'quiz',
      'flashcard',
      'academy',
      'university',
      'syllabus',
      'wikipedia',
      'textbook',
    ],
  },
  {
    group: 'Entertainment',
    domains: [
      'youtube.com',
      'youtu.be',
      'netflix.com',
      'spotify.com',
      'open.spotify.com',
      'twitch.tv',
      'primevideo.com',
      'disneyplus.com',
      'hulu.com',
      'max.com',
      'soundcloud.com',
      'music.apple.com',
      'crunchyroll.com',
      'imdb.com',
      'reddit.com',
      'steampowered.com',
      'store.steampowered.com',
      'chess.com',
    ],
    keywords: [
      'youtube',
      'netflix',
      'spotify',
      'music',
      'movie',
      'series',
      'anime',
      'stream',
      'podcast',
      'game',
      'gaming',
      'entertainment',
      'video',
    ],
  },
  {
    group: 'Development',
    domains: [
      'github.com',
      'gitlab.com',
      'bitbucket.org',
      'stackoverflow.com',
      'developer.mozilla.org',
      'npmjs.com',
      'vercel.com',
      'netlify.com',
      'codepen.io',
      'codesandbox.io',
      'docker.com',
      'kubernetes.io',
      'aws.amazon.com',
      'console.cloud.google.com',
      'tailwindcss.com',
      'react.dev',
      'typescriptlang.org',
      'localhost',
    ],
    keywords: [
      'github',
      'gitlab',
      'stack overflow',
      'mdn',
      'developer',
      'coding',
      'code',
      'api',
      'npm',
      'localhost',
      'terminal',
      'react',
      'typescript',
    ],
  },
  {
    group: 'Productivity',
    domains: [
      'notion.so',
      'figma.com',
      'slack.com',
      'trello.com',
      'asana.com',
      'linear.app',
      'todoist.com',
      'miro.com',
      'dropbox.com',
      'outlook.live.com',
      'zoom.us',
      'canva.com',
      'airtable.com',
    ],
    keywords: [
      'notion',
      'figma',
      'slack',
      'tasks',
      'todo',
      'calendar',
      'workspace',
      'board',
      'notes',
      'planner',
      'productivity',
    ],
  },
];

export function detectPurposeGroupName(url: string, title: string): PurposeGroupName {
  const haystackUrl = url.toLowerCase();
  const haystackTitle = title.toLowerCase();

  let host = haystackUrl;
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    // Use raw string if URL is partial while user is typing
  }

  for (const rule of PURPOSE_RULES) {
    if (rule.domains.some((d) => host.includes(d) || haystackUrl.includes(d))) {
      return rule.group;
    }
  }

  for (const rule of PURPOSE_RULES) {
    if (
      rule.keywords.some(
        (kw) => haystackTitle.includes(kw) || haystackUrl.includes(kw)
      )
    ) {
      return rule.group;
    }
  }

  return 'Personal';
}
