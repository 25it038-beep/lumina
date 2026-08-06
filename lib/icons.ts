export interface IconMeta {
  name: string;
  keywords: string[];
}

export const ICON_CATEGORIES = [
  "business",
  "technology",
  "health",
  "finance",
  "education",
  "communication",
  "people",
  "nature",
  "objects",
  "arrows",
  "symbols",
  "media",
] as const;

export const ICONS: Record<string, IconMeta> = {
  // Business
  briefcase: { name: "Briefcase", keywords: ["business", "work", "job"] },
  building: { name: "Building", keywords: ["company", "office", "corporate"] },
  bar_chart: { name: "Bar Chart", keywords: ["statistics", "data", "growth"] },
  pie_chart: { name: "Pie Chart", keywords: ["statistics", "data", "share"] },
  line_chart: { name: "Line Chart", keywords: ["trend", "data", "growth"] },
  trending_up: { name: "Trending Up", keywords: ["growth", "increase", "success"] },
  target: { name: "Target", keywords: ["goal", "aim", "objective"] },
  rocket: { name: "Rocket", keywords: ["startup", "launch", "space"] },
  lightbulb: { name: "Lightbulb", keywords: ["idea", "innovation", "creative"] },
  award: { name: "Award", keywords: ["prize", "achievement", "win"] },
  trophy: { name: "Trophy", keywords: ["winner", "achievement"] },
  handshake: { name: "Handshake", keywords: ["deal", "partnership", "agreement"] },
  megaphone: { name: "Megaphone", keywords: ["marketing", "announcement", "advertise"] },
  presentation: { name: "Presentation", keywords: ["slides", "pitch", "talk"] },
  sticky_note: { name: "Sticky Note", keywords: ["note", "memo", "reminder"] },
  mail: { name: "Mail", keywords: ["email", "message", "communication"] },
  calendar: { name: "Calendar", keywords: ["date", "schedule", "event"] },
  clock: { name: "Clock", keywords: ["time", "schedule", "hour"] },
  inbox: { name: "Inbox", keywords: ["email", "messages"] },
  // Technology
  cpu: { name: "CPU", keywords: ["processor", "chip", "hardware"] },
  server: { name: "Server", keywords: ["database", "backend", "hosting"] },
  cloud: { name: "Cloud", keywords: ["cloud computing", "storage", "internet"] },
  database: { name: "Database", keywords: ["data", "storage", "sql"] },
  code: { name: "Code", keywords: ["programming", "developer", "software"] },
  terminal: { name: "Terminal", keywords: ["command line", "developer"] },
  bot: { name: "Bot", keywords: ["ai", "chatbot", "automation"] },
  brain: { name: "Brain", keywords: ["ai", "intelligence", "mind"] },
  network: { name: "Network", keywords: ["connections", "internet", "graph"] },
  wifi: { name: "WiFi", keywords: ["internet", "wireless"] },
  smartphone: { name: "Smartphone", keywords: ["mobile", "phone", "app"] },
  tablet: { name: "Tablet", keywords: ["device", "mobile"] },
  monitor: { name: "Monitor", keywords: ["screen", "display", "computer"] },
  laptop: { name: "Laptop", keywords: ["computer", "notebook", "work"] },
  shield: { name: "Shield", keywords: ["security", "protection", "safety"] },
  lock: { name: "Lock", keywords: ["security", "password", "private"] },
  key: { name: "Key", keywords: ["access", "security", "password"] },
  fingerprint: { name: "Fingerprint", keywords: ["biometric", "security"] },
  bug: { name: "Bug", keywords: ["error", "debugging", "issue"] },
  wrench: { name: "Wrench", keywords: ["tools", "fix", "settings"] },
  settings: { name: "Settings", keywords: ["gear", "config", "preferences"] },
  filter: { name: "Filter", keywords: ["sort", "select"] },
  // Health
  stethoscope: { name: "Stethoscope", keywords: ["doctor", "medical", "health"] },
  heart_pulse: { name: "Heart Pulse", keywords: ["health", "cardio", "medical"] },
  activity: { name: "Activity", keywords: ["vitals", "health", "monitor"] },
  pill: { name: "Pill", keywords: ["medicine", "drug", "pharma"] },
  syringe: { name: "Syringe", keywords: ["vaccine", "medicine", "injection"] },
  dna: { name: "DNA", keywords: ["genetics", "biology", "research"] },
  microscope: { name: "Microscope", keywords: ["research", "lab", "science"] },
  hospital: { name: "Hospital", keywords: ["medical", "healthcare"] },
  thermometer: { name: "Thermometer", keywords: ["fever", "temperature"] },
  // Finance
  dollar_sign: { name: "Dollar", keywords: ["money", "finance", "currency"] },
  euro: { name: "Euro", keywords: ["money", "finance"] },
  bitcoin: { name: "Bitcoin", keywords: ["crypto", "blockchain"] },
  coins: { name: "Coins", keywords: ["money", "finance", "cash"] },
  credit_card: { name: "Credit Card", keywords: ["payment", "bank", "finance"] },
  banknote: { name: "Banknote", keywords: ["money", "cash", "payment"] },
  percent: { name: "Percent", keywords: ["percentage", "discount"] },
  calculator: { name: "Calculator", keywords: ["math", "numbers"] },
  piggy_bank: { name: "Piggy Bank", keywords: ["savings", "money"] },
  // Education
  graduation_cap: { name: "Graduation Cap", keywords: ["school", "education", "university"] },
  book_open: { name: "Book Open", keywords: ["reading", "book", "study"] },
  book: { name: "Book", keywords: ["reading", "study"] },
  library: { name: "Library", keywords: ["books", "study"] },
  pencil: { name: "Pencil", keywords: ["write", "edit", "draw"] },
  pen_tool: { name: "Pen Tool", keywords: ["write", "draw", "design"] },
  eraser: { name: "Eraser", keywords: ["edit", "remove"] },
  ruler: { name: "Ruler", keywords: ["measure", "design", "tool"] },
  flask_conical: { name: "Flask", keywords: ["science", "lab", "chemistry"] },
  atom: { name: "Atom", keywords: ["physics", "science"] },
  globe: { name: "Globe", keywords: ["world", "international", "global"] },
  // Communication
  message_circle: { name: "Message Circle", keywords: ["chat", "communication"] },
  message_square: { name: "Message Square", keywords: ["chat", "comment"] },
  phone: { name: "Phone", keywords: ["call", "telephone"] },
  video: { name: "Video", keywords: ["camera", "record", "call"] },
  mic: { name: "Mic", keywords: ["speak", "audio", "record"] },
  headphones: { name: "Headphones", keywords: ["audio", "music"] },
  bell: { name: "Bell", keywords: ["notification", "alert"] },
  share_2: { name: "Share", keywords: ["social", "spread"] },
  link: { name: "Link", keywords: ["url", "connect"] },
  // People
  user: { name: "User", keywords: ["person", "profile", "account"] },
  users: { name: "Users", keywords: ["team", "people", "group"] },
  user_plus: { name: "User Plus", keywords: ["add", "member"] },
  user_check: { name: "User Check", keywords: ["verified", "member"] },
  smile: { name: "Smile", keywords: ["happy", "emotion"] },
  thumbs_up: { name: "Thumbs Up", keywords: ["like", "approve", "yes"] },
  heart: { name: "Heart", keywords: ["love", "like", "health"] },
  star: { name: "Star", keywords: ["favorite", "rating"] },
  // Nature
  sun: { name: "Sun", keywords: ["weather", "energy", "light"] },
  moon: { name: "Moon", keywords: ["night", "dark"] },
  leaf: { name: "Leaf", keywords: ["nature", "eco", "green"] },
  tree_pine: { name: "Tree", keywords: ["nature", "forest"] },
  flower: { name: "Flower", keywords: ["nature", "plant"] },
  cloud_sun: { name: "Cloud Sun", keywords: ["weather"] },
  // Objects
  home: { name: "Home", keywords: ["house", "start"] },
  map_pin: { name: "Map Pin", keywords: ["location", "place", "address"] },
  map: { name: "Map", keywords: ["location", "directions"] },
  compass: { name: "Compass", keywords: ["direction", "navigation"] },
  camera: { name: "Camera", keywords: ["photo", "image"] },
  image: { name: "Image", keywords: ["photo", "picture", "gallery"] },
  film: { name: "Film", keywords: ["movie", "video", "cinema"] },
  music: { name: "Music", keywords: ["audio", "sound"] },
  shopping_cart: { name: "Shopping Cart", keywords: ["shop", "commerce"] },
  gift: { name: "Gift", keywords: ["present", "box"] },
  coffee: { name: "Coffee", keywords: ["cafe", "break"] },
  // Arrows
  arrow_right: { name: "Arrow Right", keywords: ["next", "forward"] },
  arrow_left: { name: "Arrow Left", keywords: ["back", "previous"] },
  arrow_up: { name: "Arrow Up", keywords: ["up", "increase"] },
  arrow_down: { name: "Arrow Down", keywords: ["down", "decrease"] },
  arrow_right_circle: { name: "Arrow Right Circle", keywords: ["next", "forward"] },
  move: { name: "Move", keywords: ["drag", "translate"] },
  maximize: { name: "Maximize", keywords: ["fullscreen", "expand"] },
  minimize: { name: "Minimize", keywords: ["shrink", "collapse"] },
  // Symbols
  check: { name: "Check", keywords: ["done", "yes", "correct"] },
  check_circle: { name: "Check Circle", keywords: ["done", "success", "complete"] },
  x: { name: "X", keywords: ["close", "no", "remove"] },
  x_circle: { name: "X Circle", keywords: ["error", "no", "denied"] },
  alert_triangle: { name: "Alert Triangle", keywords: ["warning", "danger"] },
  info: { name: "Info", keywords: ["information", "help"] },
  help_circle: { name: "Help Circle", keywords: ["question", "support"] },
  search: { name: "Search", keywords: ["find", "lookup"] },
  plus: { name: "Plus", keywords: ["add", "new"] },
  minus: { name: "Minus", keywords: ["remove", "subtract"] },
  // Media
  play: { name: "Play", keywords: ["start", "video", "music"] },
  pause: { name: "Pause", keywords: ["stop", "hold"] },
  fast_forward: { name: "Fast Forward", keywords: ["next", "speed"] },
  rewind: { name: "Rewind", keywords: ["back", "previous"] },
  volume_2: { name: "Volume", keywords: ["audio", "sound"] },
  square: { name: "Square", keywords: ["shape", "stop"] },
  circle: { name: "Circle", keywords: ["shape", "round"] },
  triangle: { name: "Triangle", keywords: ["shape", "warning"] },
  diamond: { name: "Diamond", keywords: ["shape", "gem"] },
  hexagon: { name: "Hexagon", keywords: ["shape", "six"] },
  layers: { name: "Layers", keywords: ["stack", "structure"] },
  grid: { name: "Grid", keywords: ["layout", "design"] },
  sparkles: { name: "Sparkles", keywords: ["magic", "ai", "fancy"] },
  wand_2: { name: "Wand", keywords: ["magic", "ai", "transform"] },
  zap: { name: "Zap", keywords: ["lightning", "energy", "fast"] },
  flame: { name: "Flame", keywords: ["fire", "hot", "trending"] },
};

export const ICON_NAMES = Object.keys(ICONS);

export function searchIcons(query: string, limit = 60): string[] {
  const q = query.toLowerCase().trim();
  if (!q) return ICON_NAMES.slice(0, limit);
  const scored = ICON_NAMES.map((name) => {
    const meta = ICONS[name];
    let score = 0;
    if (name.includes(q)) score += 10;
    if (meta.name.toLowerCase().includes(q)) score += 8;
    if (meta.keywords.some((k) => k.includes(q))) score += 4;
    if (meta.keywords.some((k) => q.includes(k))) score += 2;
    return { name, score };
  });
  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.name);
}
