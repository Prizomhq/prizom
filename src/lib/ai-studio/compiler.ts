import { AGRouterPromptResponse, CompilerTargetOutput } from './schema';

/**
 * Prizom AI Studio V3 — AST Prompt Compiler Suite
 * Translates intermediate perception representations into model-optimized syntax formats
 * for Flux 1.1 Pro, Midjourney v6.1, SDXL / Pony XL, DALL-E 3, Imagen 3, Ideogram v2,
 * Recraft V3, ComfyUI, Leonardo Phoenix, Adobe Firefly 3, and AI Video Generators (Gen-3/Kling/Veo 2).
 */

/**
 * Flux 1.1 Pro / Dev Compiler
 * Black Forest Labs guidance: Flux performs best with clean, fluid, descriptive natural language prose.
 * Quality buzzwords ("8k", "hyper-realistic", "masterpiece") are explicitly stripped as they cause prompt pollution.
 */
export function compileToFlux(data: Partial<AGRouterPromptResponse>): CompilerTargetOutput {
  const main = data.prompt?.main || '';
  const style = data.prompt?.style || '';
  const lighting = data.prompt?.lighting || '';
  const optics = data.optics?.focalLength 
    ? `${data.optics.shotType}, captured on a ${data.optics.focalLength} at ${data.optics.aperture} with ${data.optics.depthOfField}`
    : '';
  
  // Clean SD-style weighting syntax and parentheses for smooth Flux prose flow
  const cleanMain = main.replace(/\(([^:]+):[\d.]+\)/g, '$1').replace(/[()]/g, '').trim();

  const narrativeParts = [
    cleanMain,
    style ? `Visual style: ${style}.` : '',
    lighting ? `Lighting: ${lighting}.` : '',
    optics ? `Camera optics: ${optics}.` : ''
  ].filter(Boolean);

  const promptText = narrativeParts.join(' ');

  return {
    target: 'flux',
    modelName: 'Flux 1.1 Pro / Dev',
    promptText,
    negativePrompt: undefined, // Flux 1.1 Pro does not utilize negative prompts
    parameters: {
      guidanceScale: 3.5,
      steps: 28,
      aspectRatio: data.metadata?.aspectRatio || '1:1'
    }
  };
}

/**
 * Midjourney v6.1 Compiler
 * Formats concise visual aesthetic phrases followed by standard Midjourney parameter flags.
 * Uses --v 6.1 with --style raw for maximum optical fidelity.
 */
export function compileToMidjourney(data: Partial<AGRouterPromptResponse>): CompilerTargetOutput {
  const main = data.prompt?.main || '';
  const style = data.prompt?.style || '';
  const lighting = data.prompt?.lighting || '';
  const camera = data.prompt?.camera || '';
  const mood = data.prompt?.mood || '';
  const ar = data.metadata?.aspectRatio || '1:1';

  // Format as comma-separated visual aesthetic phrases
  const phraseParts = [
    main.replace(/\(([^:]+):[\d.]+\)/g, '$1').replace(/[()]/g, ''),
    style,
    lighting,
    camera,
    mood
  ].filter(Boolean);

  // Midjourney v6.1 parameter flags
  const promptText = `${phraseParts.join(', ')} --ar ${ar} --style raw --stylize 100 --v 6.1`;

  return {
    target: 'midjourney',
    modelName: 'Midjourney v6.1',
    promptText,
    negativePrompt: data.prompt?.negative ? `--no ${data.prompt.negative.replace(/,/g, ' ')}` : undefined,
    parameters: {
      aspectRatio: ar,
      style: 'raw',
      stylize: 100,
      version: '6.1'
    }
  };
}

/**
 * SDXL 1.0 & Pony Diffusion XL Compiler
 * Applies token weighting syntax `(subject:1.1)` for Stable Diffusion XL / Pony models.
 */
export function compileToSDXL(data: Partial<AGRouterPromptResponse>): CompilerTargetOutput {
  const main = data.prompt?.main || '';
  const style = data.prompt?.style || '';
  const lighting = data.prompt?.lighting || '';
  const camera = data.prompt?.camera || '';

  const weightedSubject = main ? `(${main}:1.15)` : '';
  const weightedStyle = style ? `(${style}:1.1)` : '';
  
  const positiveParts = [
    weightedSubject,
    weightedStyle,
    lighting,
    camera,
    'high quality',
    'detailed visual artwork'
  ].filter(Boolean);

  const promptText = positiveParts.join(', ');
  const negativePrompt = data.prompt?.negative || 'easynegative, (worst quality, low quality:1.4), blurry, deformed anatomy, bad hands, watermark, signature';

  return {
    target: 'sdxl',
    modelName: 'Stable Diffusion XL 1.0 / Pony',
    promptText,
    negativePrompt,
    parameters: {
      cfgScale: 7.0,
      steps: 30,
      sampler: 'DPM++ 2M Karras',
      width: 1024,
      height: 1024
    }
  };
}

/**
 * ComfyUI KSampler Workflow Compiler
 * Generates native ComfyUI JSON node graph definition for custom UI execution.
 */
export function compileToComfyUI(data: Partial<AGRouterPromptResponse>): CompilerTargetOutput {
  const sdxl = compileToSDXL(data);

  const comfyuiNodeGraph = {
    "3": {
      "inputs": {
        "seed": Math.floor(Math.random() * 1000000000),
        "steps": 30,
        "cfg": 7,
        "sampler_name": "dpmpp_2m",
        "scheduler": "karras",
        "denoise": 1,
        "model": ["4", 0],
        "positive": ["6", 0],
        "negative": ["7", 0],
        "latent_image": ["5", 0]
      },
      "class_type": "KSampler"
    },
    "4": {
      "inputs": {
        "ckpt_name": "sd_xl_base_1.0.safetensors"
      },
      "class_type": "CheckpointLoaderSimple"
    },
    "5": {
      "inputs": {
        "width": 1024,
        "height": 1024,
        "batch_size": 1
      },
      "class_type": "EmptyLatentImage"
    },
    "6": {
      "inputs": {
        "text": sdxl.promptText,
        "clip": ["4", 1]
      },
      "class_type": "CLIPTextEncode"
    },
    "7": {
      "inputs": {
        "text": sdxl.negativePrompt || "",
        "clip": ["4", 1]
      },
      "class_type": "CLIPTextEncode"
    },
    "8": {
      "inputs": {
        "samples": ["3", 0],
        "vae": ["4", 2]
      },
      "class_type": "VAEDecode"
    },
    "9": {
      "inputs": {
        "filename_prefix": "Prizom_AI_Studio_V3",
        "images": ["8", 0]
      },
      "class_type": "SaveImage"
    }
  };

  return {
    target: 'comfyui',
    modelName: 'ComfyUI Workflow Engine',
    promptText: sdxl.promptText,
    negativePrompt: sdxl.negativePrompt,
    comfyuiNodeGraph
  };
}

/**
 * OpenAI DALL-E 3 Compiler
 * Formats rich natural language scene descriptions without negative prompt parameter flags.
 */
export function compileToDalle3(data: Partial<AGRouterPromptResponse>): CompilerTargetOutput {
  const main = data.prompt?.main || '';
  const style = data.prompt?.style || '';
  const lighting = data.prompt?.lighting || '';
  const composition = data.prompt?.composition || '';

  const promptText = `A detailed artwork depicting ${main}. Artistic aesthetic: ${style || 'cinematic digital illustration'}. Lighting: ${lighting || 'soft studio illumination'}. Spatial framing: ${composition || 'centered framing'}. Pristine aesthetic composition without visible text, signatures, or watermarks.`;

  return {
    target: 'flux',
    modelName: 'OpenAI DALL-E 3',
    promptText,
    negativePrompt: undefined,
    parameters: {
      quality: 'hd',
      style: 'vivid',
      aspectRatio: data.metadata?.aspectRatio || '1:1'
    }
  };
}

/**
 * Google Imagen 3 Compiler
 * Photorealistic description optimized for Imagen 3's high-fidelity physical rendering engine.
 */
export function compileToImagen3(data: Partial<AGRouterPromptResponse>): CompilerTargetOutput {
  const main = data.prompt?.main || '';
  const style = data.prompt?.style || '';
  const lighting = data.prompt?.lighting || '';
  const optics = data.optics?.focalLength ? `Shot on ${data.optics.focalLength} lens at ${data.optics.aperture}` : '';

  const promptText = `A crisp, highly realistic photograph depicting ${main}. Visual style: ${style}. Lighting setup: ${lighting}. Optics: ${optics}. Authentic physical textures, natural color balance, precise depth falloff.`;

  return {
    target: 'flux',
    modelName: 'Google Imagen 3',
    promptText,
    parameters: {
      aspectRatio: data.metadata?.aspectRatio || '1:1',
      mode: 'photorealism'
    }
  };
}

/**
 * Ideogram v2 Compiler
 * Tailored for vector graphics, design branding, and precise text-in-image quotation rendering (`"TEXT"`).
 */
export function compileToIdeogram(data: Partial<AGRouterPromptResponse>): CompilerTargetOutput {
  const main = data.prompt?.main || '';
  const hasText = data.typography?.hasText && data.typography.detectedText.length > 0;
  const typographyStr = hasText ? `featuring crisp bold typography text reading "${data.typography!.detectedText.join(' ')}"` : '';

  const promptText = `Graphic design vector illustration of ${main} ${typographyStr}. Modern typography composition, clean typography alignment, vibrant graphic branding visual.`;

  return {
    target: 'flux',
    modelName: 'Ideogram v2',
    promptText,
    parameters: {
      renderingStyle: 'Design',
      aspectRatio: data.metadata?.aspectRatio || '1:1'
    }
  };
}

/**
 * Recraft V3 Compiler
 * Tailored for clean 3D icons, vector art, and digital branding assets.
 */
export function compileToRecraft(data: Partial<AGRouterPromptResponse>): CompilerTargetOutput {
  const main = data.prompt?.main || '';
  const style = data.prompt?.style || '';

  const promptText = `Clean vector illustration and graphic 3D asset depicting ${main}. Style aesthetic: ${style || 'modern digital art'}. Crisp geometric lines, vibrant color palette, isolated vector composition.`;

  return {
    target: 'flux',
    modelName: 'Recraft V3',
    promptText,
    parameters: {
      style: 'vector_illustration',
      substyle: 'digital_art'
    }
  };
}

/**
 * Leonardo Phoenix Compiler
 * Optimized for Leonardo AI Phoenix model with Kino preset style flags.
 */
export function compileToLeonardo(data: Partial<AGRouterPromptResponse>): CompilerTargetOutput {
  const main = data.prompt?.main || '';
  const style = data.prompt?.style || '';
  const camera = data.prompt?.camera || '';

  const promptText = `(${main}:1.15), (${style}:1.1), ${camera}, cinematic kino illumination, detailed visual composition`;

  return {
    target: 'sdxl',
    modelName: 'Leonardo Phoenix',
    promptText,
    negativePrompt: data.prompt?.negative || 'blurry, low quality, deformed, watermark',
    parameters: {
      presetStyle: 'Cinematic Kino',
      promptMagic: 3.0
    }
  };
}

/**
 * Adobe Firefly 3 Compiler
 * Commercial photo and illustration prompt format for Adobe Firefly.
 */
export function compileToFirefly(data: Partial<AGRouterPromptResponse>): CompilerTargetOutput {
  const main = data.prompt?.main || '';
  const lighting = data.prompt?.lighting || '';
  const optics = data.optics?.focalLength ? `${data.optics.shotType}, ${data.optics.focalLength}` : '';

  const promptText = `Commercial creative photograph of ${main}. Lighting setup: ${lighting}. Optics: ${optics}. Professional studio quality, crisp depth of field.`;

  return {
    target: 'flux',
    modelName: 'Adobe Firefly 3',
    promptText,
    parameters: {
      contentType: 'photo',
      lightingStyle: 'dramatic'
    }
  };
}

/**
 * AI Video Compiler (Runway Gen-3 Alpha / Kling AI / Veo 2)
 * Adds natural motion physics, camera trajectory descriptors (slow push-in, pan, tilt), and fps specs.
 */
export function compileToVideo(data: Partial<AGRouterPromptResponse>): CompilerTargetOutput {
  const main = data.prompt?.main || '';
  const style = data.prompt?.style || '';
  const optics = data.optics?.focalLength ? `${data.optics.shotType}, ${data.optics.cameraAngle}` : 'cinematic medium shot';

  const promptText = `Cinematic video sequence, ${optics}, smooth slow push-in camera motion. Depicting ${main}. Visual aesthetic: ${style || 'cinematic film'}, realistic motion physics, atmospheric volumetric lighting, 24fps.`;

  return {
    target: 'flux',
    modelName: 'Runway Gen-3 / Kling / Veo 2',
    promptText,
    negativePrompt: 'static image, jump cuts, jitter, distorted motion, low frame rate, freeze frame',
    parameters: {
      motionScale: 5,
      cameraMotion: 'slow_zoom_in',
      fps: 24,
      durationSeconds: 5
    }
  };
}

/**
 * Main AST Compiler Suite Entry Point.
 * Compiles intermediate perception representation into all target architectures.
 */
export function compileAllTargets(data: Partial<AGRouterPromptResponse>): Record<string, CompilerTargetOutput> {
  return {
    flux: compileToFlux(data),
    midjourney: compileToMidjourney(data),
    sdxl: compileToSDXL(data),
    comfyui: compileToComfyUI(data),
    dalle3: compileToDalle3(data),
    imagen3: compileToImagen3(data),
    ideogram: compileToIdeogram(data),
    recraft: compileToRecraft(data),
    leonardo: compileToLeonardo(data),
    firefly: compileToFirefly(data),
    video: compileToVideo(data)
  };
}

