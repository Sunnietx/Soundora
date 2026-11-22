// Nhãn tiếng Việt cho các mood_tags phổ biến (không có trong danh sách thì hiện nguyên văn)
export const MOOD_LABELS = {
  happy: 'Vui vẻ',
  upbeat: 'Sôi động',
  energetic: 'Tràn năng lượng',
  sad: 'Buồn',
  melancholic: 'Man mác',
  reflective: 'Trầm tư',
  romantic: 'Lãng mạn',
  sweet: 'Ngọt ngào',
  chill: 'Chill',
  relaxed: 'Thư thái',
};

export const moodLabel = (tag) =>
  MOOD_LABELS[tag] || tag.charAt(0).toUpperCase() + tag.slice(1);

// Nhóm tâm trạng -> bộ màu của cả trang (CSS tương ứng nằm trong index.css qua data-mood)
const MOOD_GROUPS = {
  sunny: ['happy', 'upbeat', 'energetic'],
  blue: ['sad', 'melancholic', 'reflective'],
  rose: ['romantic', 'sweet'],
  teal: ['chill', 'relaxed'],
};

export const MOOD_THEMES = {
  default: { accent: '#1ed760', rain: 'text-slate-500 dark:text-slate-400' },
  sunny: { accent: '#ffc83d', rain: 'text-amber-500 dark:text-amber-400' },
  blue: { accent: '#7c9cff', rain: 'text-indigo-600 dark:text-indigo-400' },
  rose: { accent: '#ff7ab0', rain: 'text-rose-500 dark:text-rose-400' },
  teal: { accent: '#2dd4bf', rain: 'text-teal-600 dark:text-teal-400' },
};

export function getMoodKey(commonMoods) {
  for (const [key, tags] of Object.entries(MOOD_GROUPS)) {
    if (tags.some((t) => commonMoods.includes(t))) return key;
  }
  return 'default';
}
