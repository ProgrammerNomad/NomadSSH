// Predefined tag suggestions for SSH profiles
export const PREDEFINED_TAGS = [
  'prod',
  'staging',
  'dev',
  'test',
  'database',
  'web',
  'api',
  'admin',
  'personal',
  'work',
  'client',
];

// Generate consistent color for a tag based on its name
export const getTagColor = (tag: string): string => {
  // Simple hash function to generate consistent color
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Predefined color palette (pastel colors for dark theme)
  const colors = [
    'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'bg-green-500/20 text-green-400 border-green-500/30',
    'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    'bg-purple-500/20 text-purple-400 border-purple-500/30',
    'bg-pink-500/20 text-pink-400 border-pink-500/30',
    'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    'bg-red-500/20 text-red-400 border-red-500/30',
    'bg-orange-500/20 text-orange-400 border-orange-500/30',
    'bg-teal-500/20 text-teal-400 border-teal-500/30',
    'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  ];
  
  return colors[Math.abs(hash) % colors.length];
};

// Parse tag string into array
export const parseTags = (tagString: string): string[] => {
  return tagString
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
};

// Format tags array back to string
export const formatTags = (tags: string[]): string => {
  return tags.join(', ');
};
