import { build14SectionUniversalPrompt, validateUniversalPromptQuality } from './universal-engine';
import { UniversalPromptData, ComplexityLevel } from './schema';

export interface BenchmarkSpec {
  id: string;
  name: string;
  category: string;
  complexityLevel: ComplexityLevel;
  referenceUrl: string;
  hasText: boolean;
  expectedText?: string[];
  sampleInput: {
    coreConcept: string;
    subject: string;
    composition: string;
    environment: string;
    lighting: string;
    colorPalette: string[];
    cameraPhotographic: string;
    materialsTextures: string;
    typographyText?: string;
    visualStyle: string;
    negativeConstraints: string;
    aspectRatio: string;
  };
}

export interface BenchmarkResult {
  specId: string;
  specName: string;
  complexityLevel: ComplexityLevel;
  score: number;
  passed: boolean;
  subjectCompleteness: number;
  compositionAccuracy: number;
  lightingPrecision: number;
  typographyPreservation: number;
  hallucinationPenalty: number;
  feedback: string[];
}

export const BENCHMARK_DATASET: BenchmarkSpec[] = [
  // --- 10 SIMPLE IMAGES ---
  {
    id: 'simple-01',
    name: 'Minimalist Ceramic Vase',
    category: 'Product',
    complexityLevel: 'simple',
    referenceUrl: 'https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c',
    hasText: false,
    sampleInput: {
      coreConcept: 'A minimalist matte beige ceramic vase sitting on a wooden surface.',
      subject: 'Single matte ceramic vase with organic curves.',
      composition: 'Centered isolation on neutral tabletop backdrop with generous negative space.',
      environment: 'Soft studio table environment with smooth gradient background.',
      lighting: 'Diffused window daylight from the left creating soft shadow gradients.',
      colorPalette: ['#E5E0D8', '#8C7B6B', '#2C2520'],
      cameraPhotographic: 'Eye-level perspective with gentle depth falloff.',
      materialsTextures: 'Matte unglazed clay texture and natural wood grain.',
      visualStyle: 'Minimalist product photography',
      negativeConstraints: 'No busy background, no bright artificial glare.',
      aspectRatio: '1:1'
    }
  },
  {
    id: 'simple-02',
    name: 'Solo Black Cat Portrait',
    category: 'Photography',
    complexityLevel: 'simple',
    referenceUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba',
    hasText: false,
    sampleInput: {
      coreConcept: 'A close-up portrait of a sleek black cat with bright yellow eyes.',
      subject: 'Black cat staring directly forward with luminous amber eyes.',
      composition: 'Tight macro face portrait centered in frame.',
      environment: 'Dark moody backdrop seamlessly fading into dark vignette.',
      lighting: 'Soft side key light highlighting fur texture and eye irises.',
      colorPalette: ['#0A0A0A', '#F59E0B', '#334155'],
      cameraPhotographic: 'Macro optical focus on feline pupil details.',
      materialsTextures: 'Glossy cat eye reflections and soft dark fur detail.',
      visualStyle: 'Animal portrait photography',
      negativeConstraints: 'No collar, no human hands, no motion blur.',
      aspectRatio: '4:5'
    }
  },
  {
    id: 'simple-03',
    name: 'Single Red Rose Macro',
    category: 'Nature',
    complexityLevel: 'simple',
    referenceUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23',
    hasText: false,
    sampleInput: {
      coreConcept: 'A macro photograph of a vibrant red rose petal with dew drops.',
      subject: 'Deep crimson rose bloom with water droplets.',
      composition: 'Diagonal petal curve filling lower two-thirds.',
      environment: 'Soft out-of-focus garden background.',
      lighting: 'Morning sunlight creating sparkling dew highlights.',
      colorPalette: ['#DC2626', '#991B1B', '#15803D'],
      cameraPhotographic: 'Shallow optical focus with soft circular bokeh.',
      materialsTextures: 'Velvety petal texture and crystalline water beads.',
      visualStyle: 'Macro nature photography',
      negativeConstraints: 'No withered leaves, no plastic artificial sheen.',
      aspectRatio: '1:1'
    }
  },
  {
    id: 'simple-04',
    name: 'Flat Vector Crown Icon',
    category: 'Illustration',
    complexityLevel: 'simple',
    referenceUrl: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9',
    hasText: false,
    sampleInput: {
      coreConcept: 'A clean geometric gold crown vector icon on dark violet backdrop.',
      subject: 'Symmetrical 5-point golden royal crown.',
      composition: 'Centered geometric alignment with clean margin padding.',
      environment: 'Flat solid dark violet background.',
      lighting: 'Uniform graphic lighting with subtle top highlight gradient.',
      colorPalette: ['#F59E0B', '#7C3AED', '#0F172A'],
      cameraPhotographic: 'Flat 2D graphic orthographic view.',
      materialsTextures: 'Clean vector gradients and sharp geometric edges.',
      visualStyle: 'Minimalist vector graphic design',
      negativeConstraints: 'No realistic 3D textures, no drop shadow dirt.',
      aspectRatio: '1:1'
    }
  },
  {
    id: 'simple-05',
    name: 'Solitary Pine Tree in Fog',
    category: 'Nature',
    complexityLevel: 'simple',
    referenceUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b',
    hasText: false,
    sampleInput: {
      coreConcept: 'A single tall pine tree silhouetted against dense white fog.',
      subject: 'Tall evergreen pine tree standing centrally.',
      composition: 'Vertical central framing surrounded by atmospheric mist.',
      environment: 'Misty forest hill covered in thick white fog.',
      lighting: 'Overcast muted daylight filtered through fog.',
      colorPalette: ['#1E293B', '#94A3B8', '#F1F5F9'],
      cameraPhotographic: 'Eye-level wide view with muted contrast.',
      materialsTextures: 'Pine needle silhouettes and soft atmospheric vapor.',
      visualStyle: 'Atmospheric landscape photography',
      negativeConstraints: 'No harsh sun rays, no bright saturated colors.',
      aspectRatio: '9:16'
    }
  },
  {
    id: 'simple-06',
    name: 'Modern White Chair',
    category: 'Architecture',
    complexityLevel: 'simple',
    referenceUrl: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c',
    hasText: false,
    sampleInput: {
      coreConcept: 'A Scandinavian white accent chair with natural wooden legs.',
      subject: 'Molded plastic white chair shell on beechwood legs.',
      composition: 'Three-quarter angle placement on concrete floor.',
      environment: 'Minimalist gallery room with smooth grey concrete backdrop.',
      lighting: 'Soft diffused overhead studio softbox lighting.',
      colorPalette: ['#FFFFFF', '#D1D5DB', '#78350F'],
      cameraPhotographic: 'Eye-level product camera positioning.',
      materialsTextures: 'Smooth matte plastic and warm natural timber.',
      visualStyle: 'Interior furniture photography',
      negativeConstraints: 'No carpet clutter, no background figures.',
      aspectRatio: '1:1'
    }
  },
  {
    id: 'simple-07',
    name: 'Classic Yellow Sports Car',
    category: 'Photography',
    complexityLevel: 'simple',
    referenceUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70',
    hasText: false,
    sampleInput: {
      coreConcept: 'A vintage yellow sports coupe parked on a mountain road.',
      subject: 'Sleek yellow vintage sports coupe.',
      composition: 'Side profile angle angled slightly towards camera.',
      environment: 'Winding asphalt mountain pass at dusk.',
      lighting: 'Cool twilight ambient light with warm headlights.',
      colorPalette: ['#EAB308', '#0F172A', '#475569'],
      cameraPhotographic: 'Low camera angle with crisp vehicular detail.',
      materialsTextures: 'Glossy automotive paint enamel and rubber tire tread.',
      visualStyle: 'Automotive editorial photography',
      negativeConstraints: 'No motion blur distortion, no heavy traffic.',
      aspectRatio: '16:9'
    }
  },
  {
    id: 'simple-08',
    name: '3D Glossy Sphere Asset',
    category: '3D Render',
    complexityLevel: 'simple',
    referenceUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe',
    hasText: false,
    sampleInput: {
      coreConcept: 'An iridescent glass sphere floating over a dark mirror floor.',
      subject: 'Single translucent holographic glass orb.',
      composition: 'Centered focal object with ground plane reflection.',
      environment: 'Dark studio backdrop with ground mirror floor.',
      lighting: 'Key rim light refraction generating prism chromatic light.',
      colorPalette: ['#EC4899', '#06B6D4', '#09090B'],
      cameraPhotographic: '3D perspective view with crisp glass caustic falloff.',
      materialsTextures: 'Refractive glass shader, iridescent film coating.',
      visualStyle: 'Abstract 3D digital render',
      negativeConstraints: 'No rough textures, no polygon mesh artifacts.',
      aspectRatio: '1:1'
    }
  },
  {
    id: 'simple-09',
    name: 'Studio Portrait of a Girl',
    category: 'Fashion',
    complexityLevel: 'simple',
    referenceUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
    hasText: false,
    sampleInput: {
      coreConcept: 'A soft studio portrait of a young woman with natural makeup.',
      subject: 'Young woman looking calmly into camera with loose hair.',
      composition: 'Close-up shoulder portrait framing.',
      environment: 'Neutral warm beige studio canvas backdrop.',
      lighting: 'Soft wrap beauty dish key light with silver bounce fill.',
      colorPalette: ['#E0A96D', '#201A15', '#C5A089'],
      cameraPhotographic: 'Eye-level portrait angle with subtle hair separation.',
      materialsTextures: 'Natural skin pores, soft linen fabric.',
      visualStyle: 'Studio portrait photography',
      negativeConstraints: 'No plastic retouched skin, no heavy makeup masking.',
      aspectRatio: '4:5'
    }
  },
  {
    id: 'simple-10',
    name: 'Cup of Coffee Top View',
    category: 'Product',
    complexityLevel: 'simple',
    referenceUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd',
    hasText: false,
    sampleInput: {
      coreConcept: 'A flat-lay top-down view of a ceramic coffee cup with latte art.',
      subject: 'White ceramic mug filled with cappuccino heart latte art.',
      composition: 'Flat-lay overhead 90-degree knolling view.',
      environment: 'Rustic dark oak wooden table background.',
      lighting: 'Soft diffused natural daylight from upper frame edge.',
      colorPalette: ['#78350F', '#FEF3C7', '#1F2937'],
      cameraPhotographic: 'Top-down flat orthographic camera view.',
      materialsTextures: 'Creamy espresso foam micro-bubbles, glazed ceramic.',
      visualStyle: 'Food & beverage editorial photography',
      negativeConstraints: 'No spilled drops, no plastic spoon artifacts.',
      aspectRatio: '1:1'
    }
  },

  // --- 10 MEDIUM COMPLEXITY IMAGES ---
  {
    id: 'medium-01',
    name: 'Cyberpunk Neon Street Alley',
    category: 'Cyberpunk',
    complexityLevel: 'medium',
    referenceUrl: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390',
    hasText: false,
    sampleInput: {
      coreConcept: 'A rain-soaked urban alleyway illuminated by vibrant cyan and magenta neon signs.',
      subject: 'Rainy city alley with puddles reflecting neon glow.',
      composition: 'One-point perspective leading down narrow city passage.',
      environment: 'Futuristic city street with hanging cables and wet brick walls.',
      lighting: 'High-contrast neon key light in cyan and magenta with dark shadows.',
      colorPalette: ['#06B6D4', '#EC4899', '#0F172A'],
      cameraPhotographic: 'Low-angle wide perspective with wet ground reflections.',
      materialsTextures: 'Wet asphalt reflection, weathered brick, glowing neon tubing.',
      visualStyle: 'Cinematic cyberpunk photography',
      negativeConstraints: 'No bright sunny sky, no daytime lighting.',
      aspectRatio: '16:9'
    }
  },
  {
    id: 'medium-02',
    name: 'Editorial Streetwear Fashion Model',
    category: 'Fashion',
    complexityLevel: 'medium',
    referenceUrl: 'https://images.unsplash.com/photo-1509631179647-0177331693ae',
    hasText: false,
    sampleInput: {
      coreConcept: 'An editorial full-body fashion shot of a model wearing oversized urban streetwear.',
      subject: 'Fashion model in oversized metallic puffer jacket and wide trousers.',
      composition: 'Full-body low-angle heroic pose.',
      environment: 'Brutalist concrete plaza under overcast skies.',
      lighting: 'Diffused cool ambient daylight with warm fill reflector.',
      colorPalette: ['#94A3B8', '#020617', '#E2E8F0'],
      cameraPhotographic: 'Wide low-angle perspective emphasizing garment volume.',
      materialsTextures: 'Metallic nylon shine, rough brutalist concrete.',
      visualStyle: 'High-fashion editorial photography',
      negativeConstraints: 'No cluttered background people, no awkward limbs.',
      aspectRatio: '3:4'
    }
  },
  {
    id: 'medium-03',
    name: 'Luxury Mechanical Watch Close-Up',
    category: 'Product',
    complexityLevel: 'medium',
    referenceUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30',
    hasText: false,
    sampleInput: {
      coreConcept: 'Macro photography of an open-heart skeleton mechanical wristwatch.',
      subject: 'Brushed steel wristwatch revealing intricate internal brass gears.',
      composition: 'Angled macro view focusing on watch dial and escapement wheel.',
      environment: 'Dark slate stone surface with subtle reflections.',
      lighting: 'Precise dual rim lights highlighting steel chamfers.',
      colorPalette: ['#64748B', '#D97706', '#09090B'],
      cameraPhotographic: 'Macro optical lens focus with razor-thin depth of field.',
      materialsTextures: 'Brushed stainless steel, ruby bearings, polished brass gears.',
      visualStyle: 'Commercial watch advertising photography',
      negativeConstraints: 'No dust specks, no finger smudges.',
      aspectRatio: '1:1'
    }
  },
  {
    id: 'medium-04',
    name: 'Modern Architectural Villa Exterior',
    category: 'Architecture',
    complexityLevel: 'medium',
    referenceUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c',
    hasText: false,
    sampleInput: {
      coreConcept: 'A modern luxury concrete villa with floor-to-ceiling glass at sunset.',
      subject: 'Two-story architectural cantilevered villa overlooking infinity pool.',
      composition: 'Three-quarter exterior wide angle shot showing pool reflection.',
      environment: 'Manicured lawn with pine trees under golden twilight sky.',
      lighting: 'Warm interior illumination glowing through glass paired with twilight sky.',
      colorPalette: ['#F59E0B', '#334155', '#1E293B'],
      cameraPhotographic: 'Architectural tilt-shift perspective with straight vertical lines.',
      materialsTextures: 'Smooth poured concrete, floor-to-ceiling glass, water ripples.',
      visualStyle: 'Architectural digest photography',
      negativeConstraints: 'No distorted perspective lines, no power lines.',
      aspectRatio: '16:9'
    }
  },
  {
    id: 'medium-05',
    name: 'Gourmet Burger Food Styling',
    category: 'Product',
    complexityLevel: 'medium',
    referenceUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd',
    hasText: false,
    sampleInput: {
      coreConcept: 'A mouthwatering gourmet artisan burger with melted cheddar and crispy bacon.',
      subject: 'Stacked beef burger with sesame bun, melted cheese, lettuce, and bacon.',
      composition: 'Eye-level close-up hero food placement.',
      environment: 'Rustic dark wood table with faint steam and background beer bottle.',
      lighting: 'Warm side key light emphasizing melted cheese shine and lettuce texture.',
      colorPalette: ['#B45309', '#15803D', '#451A03'],
      cameraPhotographic: 'Medium lens angle with creamy background separation.',
      materialsTextures: 'Toasted brioche bun crust, glistening beef patty, crisp lettuce.',
      visualStyle: 'Commercial food photography',
      negativeConstraints: 'No unappetizing textures, no artificial plastic look.',
      aspectRatio: '4:5'
    }
  },
  {
    id: 'medium-06',
    name: 'Cybernetic Female Android',
    category: '3D Render',
    complexityLevel: 'medium',
    referenceUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe',
    hasText: false,
    sampleInput: {
      coreConcept: 'A futuristic female android with white ceramic armor and glowing blue fiber optics.',
      subject: 'Humanoid android figure with white shell plates and glowing blue neck seams.',
      composition: 'Medium portrait profile looking off-camera.',
      environment: 'Clean white high-tech lab interior background.',
      lighting: 'Cool neutral rim lighting with bright blue accent highlights.',
      colorPalette: ['#38BDF8', '#F8FAFC', '#0F172A'],
      cameraPhotographic: '85mm portrait camera perspective with soft falloff.',
      materialsTextures: 'Polished white ceramic, exposed metallic joints, glowing fiber optics.',
      visualStyle: 'Sci-fi 3D digital character render',
      negativeConstraints: 'No horror elements, no rusty metal.',
      aspectRatio: '4:5'
    }
  },
  {
    id: 'medium-07',
    name: 'Mystical Forest Waterfall',
    category: 'Nature',
    complexityLevel: 'medium',
    referenceUrl: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9',
    hasText: false,
    sampleInput: {
      coreConcept: 'A long-exposure waterfall flowing into a mossy emerald forest pool.',
      subject: 'Cascading tiered waterfall surrounded by lush ferns.',
      composition: 'Vertical framing following water drop from top to bottom pool.',
      environment: 'Dense old-growth rainforest canopy.',
      lighting: 'Soft overcast forest light with sunbeams breaking through mist.',
      colorPalette: ['#047857', '#065F46', '#E2E8F0'],
      cameraPhotographic: 'Wide view with silky long-exposure water blur.',
      materialsTextures: 'Silky smooth water, wet mossy rocks, fern fronds.',
      visualStyle: 'Landscape nature photography',
      negativeConstraints: 'No trash, no harsh blown-out white highlights.',
      aspectRatio: '9:16'
    }
  },
  {
    id: 'medium-08',
    name: 'Fantasy Glowing Crystal Sword',
    category: 'Fantasy',
    complexityLevel: 'medium',
    referenceUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119',
    hasText: false,
    sampleInput: {
      coreConcept: 'An ancient broadsword with a glowing blue crystal blade embedded in stone.',
      subject: 'Runed steel pommel and translucent luminous crystal blade.',
      composition: 'Diagonal sword placement anchored into mossy rock.',
      environment: 'Dark cavernous shrine with magical embers.',
      lighting: 'Self-illuminating blue sword glow casting light on stone surroundings.',
      colorPalette: ['#0284C7', '#1E293B', '#F59E0B'],
      cameraPhotographic: 'Medium hero angle with sparkling particulate particle effects.',
      materialsTextures: 'Chipped ancient stone, runed steel, luminous crystal.',
      visualStyle: 'Fantasy concept art illustration',
      negativeConstraints: 'No modern objects, no plastic textures.',
      aspectRatio: '3:4'
    }
  },
  {
    id: 'medium-09',
    name: 'Tokyo Night Street Photography',
    category: 'Street Photography',
    complexityLevel: 'medium',
    referenceUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26',
    hasText: false,
    sampleInput: {
      coreConcept: 'A lone pedestrian carrying an umbrella walking through rain in Shinjuku.',
      subject: 'Solitary figure holding clear umbrella reflecting streetlights.',
      composition: 'Eye-level street capture framed by neon storefronts.',
      environment: 'Rainy Tokyo crossing at night with passing taxis.',
      lighting: 'Rich ambient neon lighting in red, amber, and blue.',
      colorPalette: ['#EF4444', '#F59E0B', '#020617'],
      cameraPhotographic: '35mm street camera perspective with natural grain.',
      materialsTextures: 'Transparent umbrella reflections, wet pavement sheen.',
      visualStyle: 'Cinematic street photography',
      negativeConstraints: 'No motion blur on main subject, no flash glares.',
      aspectRatio: '16:9'
    }
  },
  {
    id: 'medium-10',
    name: 'Minimalist Interior Living Room',
    category: 'Architecture',
    complexityLevel: 'medium',
    referenceUrl: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6',
    hasText: false,
    sampleInput: {
      coreConcept: 'A Japandi minimalist living room with beige linen sofa and potted monstera.',
      subject: 'Low-profile beige sofa paired with round travertine coffee table.',
      composition: 'Wide eye-level perspective showing room depth.',
      environment: 'Sunlit living room with floor-to-ceiling windows and sheer curtains.',
      lighting: 'Bright warm morning sunlight casting soft geometric window shadows.',
      colorPalette: ['#F5F5F4', '#D6D3D1', '#15803D'],
      cameraPhotographic: 'Wide rectilinear architectural view.',
      materialsTextures: 'Woven linen, travertine stone, potted leaf veins.',
      visualStyle: 'Interior design editorial photography',
      negativeConstraints: 'No cluttered items, no dark dingy corners.',
      aspectRatio: '16:9'
    }
  },

  // --- 10 HIGH COMPLEXITY IMAGES (INCLUDING POSTERS & TYPOGRAPHY) ---
  {
    id: 'high-01',
    name: 'Cyberpunk Movie Poster with Text',
    category: 'Poster',
    complexityLevel: 'high',
    referenceUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477',
    hasText: true,
    expectedText: ['PRIZOM', 'NEON RUNNER 2099'],
    sampleInput: {
      coreConcept: 'A high-impact cinematic movie poster featuring a cybernetic hero with bold neon typography.',
      subject: 'Cybernetic hero in leather trench coat holding energy weapon.',
      composition: 'Heroic central vertical composition with multi-layered city backdrop.',
      environment: 'Dystopian futuristic mega-city skyline under stormy skies.',
      lighting: 'Dual-tone neon volumetric directional lighting with intense backlighting.',
      colorPalette: ['#A855F7', '#06B6D4', '#0F172A', '#F43F5E'],
      cameraPhotographic: 'Cinematic anamorphic wide perspective.',
      materialsTextures: 'Rain-soaked leather, glowing plasma energy, chrome armor.',
      typographyText: 'Bold header text reads "NEON RUNNER 2099" in glowing cyan sans-serif display font centered at top. Subtitle reads "PRIZOM" at bottom.',
      visualStyle: 'Commercial movie poster artwork',
      negativeConstraints: 'No misspelled header text, no distorted hands, no dull flat lighting.',
      aspectRatio: '2:3'
    }
  },
  {
    id: 'high-02',
    name: 'Retro Vinyl Album Cover',
    category: 'Poster',
    complexityLevel: 'high',
    referenceUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819',
    hasText: true,
    expectedText: ['MIDNIGHT ECHOES', 'SYNTHWAVE'],
    sampleInput: {
      coreConcept: 'A 1980s synthwave vinyl album cover featuring a grid sunset and vintage typography.',
      subject: 'Wireframe neon grid road driving into a massive low-poly chrome sun.',
      composition: 'Centered perspective grid vanishing into sunset horizon.',
      environment: 'Retrofuturistic synthwave desert horizon at dusk.',
      lighting: 'Radiant warm magenta sun glow contrasting dark purple grid.',
      colorPalette: ['#EC4899', '#8B5CF6', '#1E1B4B'],
      cameraPhotographic: 'Orthographic graphic view with vintage film grain.',
      materialsTextures: 'Worn cardboard vinyl jacket texture, glowing neon lines.',
      typographyText: 'Top title reads "MIDNIGHT ECHOES" in bold 80s chrome script font. Bottom text reads "SYNTHWAVE".',
      visualStyle: 'Retro 80s synthwave graphic artwork',
      negativeConstraints: 'No modern 3D photo elements, no clean digital flatness.',
      aspectRatio: '1:1'
    }
  },
  {
    id: 'high-03',
    name: 'Fashion Magazine Cover Layout',
    category: 'Fashion',
    complexityLevel: 'high',
    referenceUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f',
    hasText: true,
    expectedText: ['VOGUE', 'FUTURE ISSUE'],
    sampleInput: {
      coreConcept: 'A high-fashion magazine cover with model portrait, barcode badge, and editorial masthead.',
      subject: 'High-fashion model wearing Avant-garde metallic headpiece.',
      composition: 'Close-up portrait with model head overlapping top magazine masthead.',
      environment: 'Sleek silver studio cyclorama background.',
      lighting: 'Crisp specular key light with intense shadow contrast.',
      colorPalette: ['#000000', '#FFFFFF', '#E11D48'],
      cameraPhotographic: 'Fashion editorial portrait camera lens positioning.',
      materialsTextures: 'Polished silver metallic headpiece, flawless skin.',
      typographyText: 'Masthead title "VOGUE" in classic serif font spanning top edge. Sub-headlines "FUTURE ISSUE" aligned on left margin.',
      visualStyle: 'Editorial magazine cover layout',
      negativeConstraints: 'No misalignment of typography, no blurry text edges.',
      aspectRatio: '3:4'
    }
  },
  {
    id: 'high-04',
    name: 'Sports Drink Energy Ad Poster',
    category: 'Commercial',
    complexityLevel: 'high',
    referenceUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97',
    hasText: true,
    expectedText: ['UNLEASH THE POWER', 'HYDRA'],
    sampleInput: {
      coreConcept: 'An explosive commercial sports drink advertisement featuring liquid splash FX and bold text.',
      subject: 'Condensation-covered energy drink can bursting through electric blue water splash.',
      composition: 'Dynamic diagonal hero product placement with exploding water droplets.',
      environment: 'Dark energetic studio background with blue lightning arcs.',
      lighting: 'High-speed strobe lighting highlighting every individual water droplet.',
      colorPalette: ['#2563EB', '#38BDF8', '#0F172A'],
      cameraPhotographic: 'High-speed freeze-motion optical lens capture.',
      materialsTextures: 'Aluminum can matte print, glistening water droplets, liquid splash.',
      typographyText: 'Headline text "UNLEASH THE POWER" in slanted italic athletic font. Brand title "HYDRA" at base.',
      visualStyle: 'Commercial advertising CGI render',
      negativeConstraints: 'No murky water blur, no low-resolution splash artifacts.',
      aspectRatio: '4:5'
    }
  },
  {
    id: 'high-05',
    name: 'Futuristic Sci-Fi UI Dashboard',
    category: '3D Render',
    complexityLevel: 'high',
    referenceUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b',
    hasText: true,
    expectedText: ['SYSTEM ONLINE', 'TARGET LOCKED'],
    sampleInput: {
      coreConcept: 'A futuristic holographic user interface dashboard showing telemetry graphs and planet map.',
      subject: 'Holographic HUD display with glowing wireframe planet and telemetry rings.',
      composition: 'Symmetrical UI layout with central globe and side telemetry panels.',
      environment: 'Spaceship cockpit bridge looking out into deep space starfield.',
      lighting: 'Self-luminous cyan and amber holographic UI lighting.',
      colorPalette: ['#06B6D4', '#F59E0B', '#020617'],
      cameraPhotographic: 'Direct user perspective HUD view.',
      materialsTextures: 'Transparent glass HUD overlay, crisp vector graphics.',
      typographyText: 'UI status text "SYSTEM ONLINE" at top left. Target indicator "TARGET LOCKED" centered.',
      visualStyle: 'Sci-fi UI graphic design render',
      negativeConstraints: 'No unreadable blurry text, no cluttered illegible scribbles.',
      aspectRatio: '16:9'
    }
  },
  {
    id: 'high-06',
    name: 'Fantasy Epic Battle Scene Poster',
    category: 'Fantasy',
    complexityLevel: 'high',
    referenceUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23',
    hasText: false,
    sampleInput: {
      coreConcept: 'An epic battle between a fiery dragon and armored knight on a burning cliff.',
      subject: 'Armored knight raising glowing sword against colossal fire-breathing dragon.',
      composition: 'Low-angle heroic triangular composition with dragon towering above.',
      environment: 'Volcanic mountain ridge with burning embers and dark smoke clouds.',
      lighting: 'Intense warm orange dragon fire contrast against cold blue lightning moonlight.',
      colorPalette: ['#EA580C', '#0284C7', '#1C1917'],
      cameraPhotographic: 'Wide cinematic low-angle lens shot.',
      materialsTextures: 'Dragon scales, charred plate armor, molten rock glow.',
      visualStyle: 'Epic fantasy digital painting illustration',
      negativeConstraints: 'No extra dragon heads, no broken knight anatomy.',
      aspectRatio: '2:3'
    }
  },
  {
    id: 'high-07',
    name: 'Vintage Travel Poster Layout',
    category: 'Poster',
    complexityLevel: 'high',
    referenceUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e',
    hasText: true,
    expectedText: ['VISIT SWITZERLAND', 'THE ALPS'],
    sampleInput: {
      coreConcept: 'A 1950s retro travel poster illustration depicting snow-capped Swiss mountains.',
      subject: 'Snow-covered mountain peak with a vintage red passenger train climbing below.',
      composition: 'Vertical layered composition with train leading eye toward mountain peak.',
      environment: 'Crisp alpine valley under sunny blue sky with soft clouds.',
      lighting: 'Bright flat graphic sunlight with stylized mountain shadows.',
      colorPalette: ['#EF4444', '#0284C7', '#FEF3C7'],
      cameraPhotographic: 'Flat gouache illustration perspective.',
      materialsTextures: 'Textured paper grain, flat vector gouache paint strokes.',
      typographyText: 'Top headline "VISIT SWITZERLAND" in vintage block sans-serif font. Subtitle "THE ALPS" at bottom.',
      visualStyle: 'Mid-century travel poster illustration',
      negativeConstraints: 'No modern photo elements, no 3D digital shading.',
      aspectRatio: '2:3'
    }
  },
  {
    id: 'high-08',
    name: 'Luxury Perfume Commercial Ad',
    category: 'Commercial',
    complexityLevel: 'high',
    referenceUrl: 'https://images.unsplash.com/photo-1541643600914-78b084683601',
    hasText: true,
    expectedText: ['EAU DE PARFUM', 'LUMIERE'],
    sampleInput: {
      coreConcept: 'A high-end luxury perfume bottle surrounded by floating gold dust and silk waves.',
      subject: 'Facetted crystal perfume bottle with golden cap resting on black silk.',
      composition: 'Centered hero bottle placement enveloped by flowing silk curves.',
      environment: 'Dark elegant studio space with floating golden bokeh particles.',
      lighting: 'Dramatic chiaroscuro spotlight highlighting crystal facets and gold cap.',
      colorPalette: ['#D97706', '#FEF3C7', '#09090B'],
      cameraPhotographic: '85mm commercial macro lens setup.',
      materialsTextures: 'Refractive crystal glass, flowing liquid silk, gold leaf foil.',
      typographyText: 'Brand name "LUMIERE" etched in gold serif font on bottle face. "EAU DE PARFUM" below.',
      visualStyle: 'Luxury beauty advertising photography',
      negativeConstraints: 'No smudges on glass, no harsh uncontrolled glare.',
      aspectRatio: '4:5'
    }
  },
  {
    id: 'high-09',
    name: 'Isometric Cyber City Graphic Diagram',
    category: 'Architecture',
    complexityLevel: 'high',
    referenceUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab',
    hasText: false,
    sampleInput: {
      coreConcept: 'An intricate isometric 3D breakdown of a futuristic sustainable skyscraper.',
      subject: 'Cutaway isometric skyscraper showing interior gardens, solar panels, and maglev trains.',
      composition: '45-degree isometric orthographic view floating over neutral background.',
      environment: 'Clean slate backdrop with architectural grid guidelines.',
      lighting: 'Uniform shadowless CAD technical render lighting.',
      colorPalette: ['#10B981', '#3B82F6', '#1F2937'],
      cameraPhotographic: 'True isometric orthographic view.',
      materialsTextures: 'Clean glass, solar panel silicon grids, lush interior foliage.',
      visualStyle: '3D architectural isometric rendering',
      negativeConstraints: 'No perspective distortion, no muddy textures.',
      aspectRatio: '1:1'
    }
  },
  {
    id: 'high-10',
    name: 'Dark Fantasy Graphic Novel Splash Page',
    category: 'Illustration',
    complexityLevel: 'high',
    referenceUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119',
    hasText: true,
    expectedText: ['THE RECKONING', 'CHAPTER ONE'],
    sampleInput: {
      coreConcept: 'A dark fantasy graphic novel splash page with intricate ink cross-hatching and text banner.',
      subject: 'Cloaked necromancer summoning spirits in a gothic cathedral ruin.',
      composition: 'Dynamic splash page panel with high contrast shadow ink work.',
      environment: 'Ruined gothic cathedral with shattered stained glass window under full moon.',
      lighting: 'Eerie green magic glow contrasting deep black India ink shadows.',
      colorPalette: ['#22C55E', '#09090B', '#E2E8F0'],
      cameraPhotographic: 'Comic book splash page low angle illustration view.',
      materialsTextures: 'India ink cross-hatching, weathered parchment texture.',
      typographyText: 'Chapter banner at top reads "THE RECKONING". Speech caption reads "CHAPTER ONE".',
      visualStyle: 'Dark fantasy comic book graphic novel illustration',
      negativeConstraints: 'No soft blurry airbrushing, no cartoonish flat colors.',
      aspectRatio: '2:3'
    }
  }
];

/**
 * Runs automated benchmark evaluation across all 30 test cases.
 */
export function runUniversalPromptBenchmark(): {
  total: number;
  passed: number;
  averageScore: number;
  results: BenchmarkResult[];
} {
  const results: BenchmarkResult[] = BENCHMARK_DATASET.map((spec) => {
    const promptData: UniversalPromptData = build14SectionUniversalPrompt({
      coreConcept: spec.sampleInput.coreConcept,
      subject: spec.sampleInput.subject,
      composition: spec.sampleInput.composition,
      environment: spec.sampleInput.environment,
      lighting: spec.sampleInput.lighting,
      colorPalette: spec.sampleInput.colorPalette,
      cameraPhotographic: spec.sampleInput.cameraPhotographic,
      materialsTextures: spec.sampleInput.materialsTextures,
      typographyText: spec.sampleInput.typographyText,
      visualStyle: spec.sampleInput.visualStyle,
      negativeConstraints: spec.sampleInput.negativeConstraints,
      aspectRatio: spec.sampleInput.aspectRatio,
      hasText: spec.hasText,
      detectedText: spec.expectedText,
      category: spec.category
    });

    const validation = validateUniversalPromptQuality(promptData);

    const subjectCompleteness = promptData.subject ? 100 : 0;
    const compositionAccuracy = promptData.composition ? 100 : 0;
    const lightingPrecision = promptData.lighting ? 100 : 0;
    const typographyPreservation = spec.hasText
      ? (promptData.typographyText.includes(spec.expectedText?.[0] || '') ? 100 : 50)
      : 100;
    const hallucinationPenalty = /shot on canon|85mm f\/1\.4 prime/i.test(promptData.cameraPhotographic) ? 20 : 0;

    const overallScore = Math.max(
      0,
      Math.round((subjectCompleteness + compositionAccuracy + lightingPrecision + typographyPreservation) / 4 - hallucinationPenalty)
    );

    return {
      specId: spec.id,
      specName: spec.name,
      complexityLevel: spec.complexityLevel,
      score: overallScore,
      passed: overallScore >= 80 && validation.isValid,
      subjectCompleteness,
      compositionAccuracy,
      lightingPrecision,
      typographyPreservation,
      hallucinationPenalty,
      feedback: validation.feedback
    };
  });

  const passedCount = results.filter((r) => r.passed).length;
  const avgScore = Math.round(results.reduce((acc, r) => acc + r.score, 0) / results.length);

  return {
    total: BENCHMARK_DATASET.length,
    passed: passedCount,
    averageScore: avgScore,
    results
  };
}
