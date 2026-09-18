/**
 * Visual Assets & Planning Engine for AI Presentation Generator
 * Generates presentation-grade imagery, SVG vector diagrams, process workflows, and curated visuals
 */

export type VisualType =
  | 'hero_image'
  | 'text_image_split'
  | 'illustration'
  | 'diagram'
  | 'process_workflow'
  | 'timeline'
  | 'comparison'
  | 'stats_grid'
  | 'chart'
  | 'cards_grid'
  | 'full_bleed';

export interface SlideVisual {
  type: VisualType;
  prompt: string;
  imageUrl: string;
  svgDataUri?: string;
  fallbackIcon: string;
  aspectRatio: string;
  altText: string;
}

// Curated high-aesthetic Unsplash presentation stock library (100% free, reliable CDN, presentation-grade 1080p)
const VISUAL_LIBRARY: Record<string, string[]> = {
  ai_general: [
    'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=1200&q=80', // Glowing AI Brain & Neural Mesh
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80', // Futuristic Fluid Neural Gradient
    'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1200&q=80', // Cybernetic Data Core
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80'  // Digital Matrix Network
  ],
  machine_learning: [
    'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?auto=format&fit=crop&w=1200&q=80', // Code & Neural Model
    'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=1200&q=80', // Mathematical Logic Pattern
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80'  // Analytics & Graph Node
  ],
  deep_learning: [
    'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=1200&q=80', // 3D Neural Nodes Connected
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80', // Multi-layer Synaptic Waves
    'https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=1200&q=80'  // High-performance Compute
  ],
  generative_ai: [
    'https://images.unsplash.com/photo-1686191128892-3b37813f0729?auto=format&fit=crop&w=1200&q=80', // Creative AI Spectrum
    'https://images.unsplash.com/photo-1675271591211-126ad94e495d?auto=format&fit=crop&w=1200&q=80', // AI Synthesis Light Beam
    'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1200&q=80'  // Particle Diffusion Field
  ],
  applications: [
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80', // Global Network Earth
    'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1200&q=80', // Modern Product Design Studio
    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80'  // High-Tech Workstations
  ],
  benefits: [
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80', // Growth Metrics & Uplift
    'https://images.unsplash.com/photo-1553729459-efe14ef6055d?auto=format&fit=crop&w=1200&q=80', // High Efficiency Value
    'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1200&q=80'  // Executive Success
  ],
  risks_security: [
    'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1200&q=80', // Cybersecurity Shield & Lock
    'https://images.unsplash.com/photo-1510511459019-5dda7724fd87?auto=format&fit=crop&w=1200&q=80', // Dark Security Terminal
    'https://images.unsplash.com/photo-1508962914676-134849a727f0?auto=format&fit=crop&w=1200&q=80'  // Digital Shield Grid
  ],
  future_trends: [
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80', // Deep Space Frontier
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80', // Silicon Quantum Microchip
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80'  // Vast Horizon Sunset
  ],
  business_pitch: [
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80', // Modern Skyscraper Architecture
    'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80', // Minimalist Executive Office
    'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1200&q=80'  // Collaborative Boardroom
  ],
  climate_energy: [
    'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=1200&q=80', // Solar Panels Sunset
    'https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&w=1200&q=80', // Wind Turbines Rolling Hills
    'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=1200&q=80'  // Lush Forest Canopy
  ],
  medical_health: [
    'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&w=1200&q=80', // Medical Research Lab
    'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1200&q=80', // Clinical Stethoscope Tech
    'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=1200&q=80'  // DNA Genomic Visualization
  ],
  general: [
    'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80', // Collaborative Workshop
    'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80', // Creative Desktop Notebook
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80'  // Strategic Planning Matrix
  ]
};

/**
 * Generate an inline SVG vector diagram with professional presentation styling
 */
export function generateSvgDiagram(type: 'architecture' | 'process' | 'comparison' | 'matrix' | 'chart', title: string, items: string[]): string {
  const primaryColor = '#6366f1';
  const secondaryColor = '#8b5cf6';
  const accentColor = '#38bdf8';
  const bgColor = '#0f172a';
  const cardBg = '#1e293b';
  const textColor = '#f8fafc';
  const mutedColor = '#94a3b8';

  if (type === 'process') {
    const steps = items.slice(0, 3);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 320" width="100%" height="100%">
      <rect width="100%" height="100%" fill="${bgColor}" rx="16"/>
      <path d="M 220 160 L 320 160 M 480 160 L 580 160" stroke="${primaryColor}" stroke-width="4" stroke-dasharray="6,6"/>
      ${steps.map((step, i) => {
        const x = 60 + i * 260;
        return `
        <g transform="translate(${x}, 60)">
          <rect width="200" height="200" rx="16" fill="${cardBg}" stroke="${i === 1 ? accentColor : primaryColor}" stroke-width="2"/>
          <circle cx="100" cy="45" r="22" fill="${i === 1 ? accentColor : primaryColor}" fill-opacity="0.2"/>
          <text x="100" y="52" fill="${i === 1 ? accentColor : primaryColor}" font-family="Inter, sans-serif" font-weight="900" font-size="16" text-anchor="middle">0${i + 1}</text>
          <text x="100" y="105" fill="${textColor}" font-family="Inter, sans-serif" font-weight="bold" font-size="14" text-anchor="middle">${step.substring(0, 18)}</text>
          <text x="100" y="135" fill="${mutedColor}" font-family="Inter, sans-serif" font-size="11" text-anchor="middle">${step.length > 18 ? step.substring(18, 48) : 'Core mechanism'}</text>
        </g>`;
      }).join('')}
    </svg>`;
  }

  if (type === 'architecture') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 340" width="100%" height="100%">
      <rect width="100%" height="100%" fill="${bgColor}" rx="16"/>
      <!-- Top Ingestion -->
      <rect x="250" y="30" width="300" height="60" rx="12" fill="${cardBg}" stroke="${accentColor}" stroke-width="2"/>
      <text x="400" y="65" fill="${textColor}" font-family="Inter, sans-serif" font-weight="bold" font-size="15" text-anchor="middle">⚡ Multi-Modal Ingestion & Context</text>
      <!-- Lines down -->
      <path d="M 400 90 L 400 130 M 400 130 L 200 130 L 200 150 M 400 130 L 600 130 L 600 150" stroke="${primaryColor}" stroke-width="2"/>
      <!-- 3 Layer Boxes -->
      <rect x="100" y="150" width="200" height="90" rx="12" fill="${cardBg}" stroke="${primaryColor}" stroke-width="1.5"/>
      <text x="200" y="190" fill="${textColor}" font-family="Inter, sans-serif" font-weight="bold" font-size="13" text-anchor="middle">Semantic Processing</text>
      <text x="200" y="215" fill="${mutedColor}" font-family="Inter, sans-serif" font-size="10" text-anchor="middle">Vector Embeddings</text>

      <rect x="300" y="150" width="200" height="90" rx="12" fill="${cardBg}" stroke="${secondaryColor}" stroke-width="2"/>
      <text x="400" y="190" fill="${textColor}" font-family="Inter, sans-serif" font-weight="bold" font-size="13" text-anchor="middle">Neural Synthesis</text>
      <text x="400" y="215" fill="${mutedColor}" font-family="Inter, sans-serif" font-size="10" text-anchor="middle">Layout & Visual Planning</text>

      <rect x="500" y="150" width="200" height="90" rx="12" fill="${cardBg}" stroke="${accentColor}" stroke-width="1.5"/>
      <text x="600" y="190" fill="${textColor}" font-family="Inter, sans-serif" font-weight="bold" font-size="13" text-anchor="middle">Deterministic Quality</text>
      <text x="600" y="215" fill="${mutedColor}" font-family="Inter, sans-serif" font-size="10" text-anchor="middle">Audit & Validation</text>
      <!-- Bottom Output -->
      <path d="M 400 240 L 400 270" stroke="${primaryColor}" stroke-width="2"/>
      <rect x="250" y="270" width="300" height="50" rx="12" fill="${cardBg}" stroke="#10b981" stroke-width="2"/>
      <text x="400" y="300" fill="#10b981" font-family="Inter, sans-serif" font-weight="bold" font-size="14" text-anchor="middle">✓ Native Vector PPTX & HD Formats</text>
    </svg>`;
  }

  // Fallback generic vector badge grid
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 320" width="100%" height="100%">
    <rect width="100%" height="100%" fill="${bgColor}" rx="16"/>
    <circle cx="400" cy="160" r="90" fill="${primaryColor}" fill-opacity="0.15" stroke="${primaryColor}" stroke-width="2"/>
    <circle cx="400" cy="160" r="45" fill="${accentColor}" fill-opacity="0.25" stroke="${accentColor}" stroke-width="2"/>
    <text x="400" y="165" fill="${textColor}" font-family="Inter, sans-serif" font-weight="bold" font-size="16" text-anchor="middle">${title.substring(0, 24)}</text>
  </svg>`;
}

/**
 * AI Visual Planner: Determines the optimal visual asset and prompt for any given slide
 */
export function planSlideVisual(
  slideNumber: number,
  title: string,
  contentPoints: string[],
  domain: string = 'general',
  forcedVisualType?: VisualType | string,
  totalSlides: number = 10
): SlideVisual {
  const tLower = title.toLowerCase();
  const cLower = contentPoints.join(' ').toLowerCase();

  // 1. Determine visual category and prompt
  let category = 'ai_general';
  let visualType: VisualType = (forcedVisualType as VisualType) || 'text_image_split';
  let fallbackIcon = 'Sparkles';
  let visualPrompt = `Modern professional graphic visualizing ${title} in futuristic technology presentation aesthetic, cinematic lighting, ultra-detailed 8k.`;

  if (!forcedVisualType) {
    if (slideNumber === 1) {
      visualType = 'hero_image';
      fallbackIcon = 'Presentation';
      visualPrompt = `High-impact hero visual for presentation titled "${title}", sleek modern minimalist aesthetic, glowing abstract technology lights, deep indigo and violet tones.`;
      category = domain === 'startup_pitch' ? 'business_pitch' : domain === 'climate_energy' ? 'climate_energy' : domain === 'medical_health' ? 'medical_health' : 'ai_general';
    } else if (slideNumber === totalSlides) {
      visualType = 'illustration';
      fallbackIcon = 'CheckCircle2';
      visualPrompt = `Clean closing call-to-action visual for ${title}, forward-looking horizon, inspiring golden hour ambient lighting, modern enterprise style.`;
      category = 'future_trends';
    } else if (tLower.includes('machine learning') || cLower.includes('algorithm') || cLower.includes('supervised')) {
      visualType = 'diagram';
      fallbackIcon = 'Cpu';
      visualPrompt = `Conceptual 3D visualization of machine learning algorithms, glowing decision trees, data neural pathways, clean studio background.`;
      category = 'machine_learning';
    } else if (tLower.includes('deep learning') || cLower.includes('neural') || cLower.includes('transformer')) {
      visualType = 'diagram';
      fallbackIcon = 'Layers';
      visualPrompt = `Multi-layered deep neural network architecture with glowing synaptic nodes, high-tech isometric view, cyan and purple accents.`;
      category = 'deep_learning';
    } else if (tLower.includes('generative') || cLower.includes('llm') || cLower.includes('diffusion')) {
      visualType = 'text_image_split';
      fallbackIcon = 'Wand2';
      visualPrompt = `Generative AI creative synthesis, glowing light beams crafting digital artifacts, futuristic aesthetic.`;
      category = 'generative_ai';
    } else if (tLower.includes('application') || cLower.includes('healthcare') || cLower.includes('finance') || cLower.includes('industry')) {
      visualType = 'cards_grid';
      fallbackIcon = 'Target';
      visualPrompt = `Global enterprise technology applications, smart city grid, interconnected digital ecosystems, realistic lighting.`;
      category = 'applications';
    } else if (tLower.includes('benefit') || tLower.includes('impact') || cLower.includes('roi') || cLower.includes('uplift')) {
      visualType = 'stats_grid';
      fallbackIcon = 'TrendingUp';
      visualPrompt = `Exponential upward productivity curve, glowing financial telemetry indicators, modern glass office background.`;
      category = 'benefits';
    } else if (tLower.includes('risk') || tLower.includes('security') || tLower.includes('ethic') || cLower.includes('bias') || cLower.includes('privacy')) {
      visualType = 'comparison';
      fallbackIcon = 'ShieldCheck';
      visualPrompt = `Cybersecurity defense matrix, glowing digital padlock, cryptographic verification shield in dark neon aesthetic.`;
      category = 'risks_security';
    } else if (tLower.includes('trend') || tLower.includes('future') || tLower.includes('roadmap') || cLower.includes('agi')) {
      visualType = 'timeline';
      fallbackIcon = 'Clock';
      visualPrompt = `Next-generation technological frontier, quantum microprocessors, future horizon with cosmic glowing particles.`;
      category = 'future_trends';
    } else if (domain === 'startup_pitch') {
      visualType = 'cards_grid';
      fallbackIcon = 'Briefcase';
      category = 'business_pitch';
    } else if (domain === 'climate_energy') {
      visualType = 'text_image_split';
      fallbackIcon = 'Zap';
      category = 'climate_energy';
    } else if (domain === 'medical_health') {
      visualType = 'illustration';
      fallbackIcon = 'HeartPulse';
      category = 'medical_health';
    }
  }

  // 2. Select image from curated library
  const pool = VISUAL_LIBRARY[category] || VISUAL_LIBRARY.general;
  const imageIdx = Math.max(0, (slideNumber - 1) % pool.length);
  const imageUrl = pool[imageIdx];

  // 3. Generate SVG data URI as lossless vector diagram if diagram or timeline
  let svgDataUri: string | undefined = undefined;
  if (visualType === 'diagram' || visualType === 'process_workflow') {
    const rawSvg = generateSvgDiagram('architecture', title, contentPoints);
    svgDataUri = `data:image/svg+xml;utf8,${encodeURIComponent(rawSvg)}`;
  } else if (visualType === 'timeline') {
    const rawSvg = generateSvgDiagram('process', title, contentPoints);
    svgDataUri = `data:image/svg+xml;utf8,${encodeURIComponent(rawSvg)}`;
  }

  return {
    type: visualType,
    prompt: visualPrompt,
    imageUrl,
    svgDataUri,
    fallbackIcon,
    aspectRatio: visualType === 'hero_image' || visualType === 'full_bleed' ? '16:9' : '4:3',
    altText: `Visual representation of ${title}`
  };
}
