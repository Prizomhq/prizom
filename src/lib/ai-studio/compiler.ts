import { AGRouterPromptResponse, CompilerTargetOutput } from './schema';

/**
 * Prizom AI Studio Abstract Syntax Tree (AST) Prompt Compiler (Phase 4)
 * Translates intermediate perception representations into model-optimized
 * syntax formats for Flux 1.1 Pro, Midjourney v6/v7, SDXL / Pony, and ComfyUI.
 */

export function compileToFlux(data: Partial<AGRouterPromptResponse>): CompilerTargetOutput {
  const main = data.prompt?.main || '';
  const style = data.prompt?.style || '';
  const lighting = data.prompt?.lighting || '';
  const optics = data.optics?.focalLength ? `${data.optics.shotType}, shot on ${data.optics.focalLength} at ${data.optics.aperture}` : '';
  
  // Clean SD-style weighting parentheses and negative prompts for Flux natural language flow
  const cleanMain = main.replace(/\(([^:]+):[\d.]+\)/g, '$1').replace(/[()]/g, '');

  const narrativeParts = [
    cleanMain,
    style ? `Style: ${style}.` : '',
    lighting ? `Illuminated by ${lighting}.` : '',
    optics ? `${optics}.` : '',
    'Rendered with hyper-realistic detail and true-to-life textures.'
  ].filter(Boolean);

  const promptText = narrativeParts.join(' ');

  return {
    target: 'flux',
    modelName: 'Flux 1.1 Pro / Dev',
    promptText,
    negativePrompt: undefined, // Flux does not utilize negative prompts
    parameters: {
      guidanceScale: 3.5,
      steps: 28,
      aspectRatio: data.metadata?.aspectRatio || '1:1'
    }
  };
}

export function compileToMidjourney(data: Partial<AGRouterPromptResponse>): CompilerTargetOutput {
  const main = data.prompt?.main || '';
  const style = data.prompt?.style || '';
  const lighting = data.prompt?.lighting || '';
  const camera = data.prompt?.camera || '';
  const mood = data.prompt?.mood || '';
  const ar = data.metadata?.aspectRatio || '1:1';

  // Format as comma-separated aesthetic visual phrases + parameter flags
  const phraseParts = [
    main,
    style,
    lighting,
    camera,
    mood,
    'photorealistic 8k'
  ].filter(Boolean);

  const promptText = `${phraseParts.join(', ')} --ar ${ar} --stylize 250 --v 6.0`;

  return {
    target: 'midjourney',
    modelName: 'Midjourney v6.0',
    promptText,
    negativePrompt: data.prompt?.negative ? `--no ${data.prompt.negative.replace(/,/g, ' ')}` : undefined,
    parameters: {
      aspectRatio: ar,
      stylize: 250,
      version: '6.0'
    }
  };
}

export function compileToSDXL(data: Partial<AGRouterPromptResponse>): CompilerTargetOutput {
  const main = data.prompt?.main || '';
  const style = data.prompt?.style || '';
  const lighting = data.prompt?.lighting || '';
  const camera = data.prompt?.camera || '';

  // Apply SDXL token weighting syntax
  const weightedSubject = `(${main}:1.2)`;
  const weightedStyle = style ? `(${style}:1.1)` : '';
  
  const positiveParts = [
    weightedSubject,
    weightedStyle,
    lighting,
    camera,
    'masterpiece',
    'best quality',
    'ultra-detailed 8k'
  ].filter(Boolean);

  const promptText = positiveParts.join(', ');
  const negativePrompt = data.prompt?.negative || 'embedding:easynegative, (worst quality, low quality:1.4), blurry, deformed, bad anatomy, text, watermark';

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

export function compileToComfyUI(data: Partial<AGRouterPromptResponse>): CompilerTargetOutput {
  const sdxl = compileToSDXL(data);

  // Generate native ComfyUI JSON Workflow node graph definition
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
        "filename_prefix": "Prizom_AI_Studio",
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

export function compileToDalle3(data: Partial<AGRouterPromptResponse>): CompilerTargetOutput {
  const main = data.prompt?.main || '';
  const style = data.prompt?.style || '';
  const lighting = data.prompt?.lighting || '';
  const composition = data.prompt?.composition || '';

  const promptText = `A highly detailed visual artwork depicting ${main}. Visual style: ${style || 'cinematic digital illustration'}. Lighting setup: ${lighting || 'soft studio illumination'}. Spatial composition: ${composition || 'centered framing'}. Clean aesthetics without text or watermarks.`;

  return {
    target: 'flux', // Maps to DALL-E 3 narrative type
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

export function compileToVideo(data: Partial<AGRouterPromptResponse>): CompilerTargetOutput {
  const main = data.prompt?.main || '';
  const style = data.prompt?.style || '';
  const optics = data.optics?.focalLength ? `${data.optics.shotType}, ${data.optics.cameraAngle}` : 'cinematic medium shot';

  const promptText = `Cinematic 4K video clip, ${optics}, slow smooth push-in camera motion. ${main}. Visual aesthetic: ${style || 'cinematic film'}, natural motion physics, volumetric lighting, 24fps.`;

  return {
    target: 'flux', // Video target emitter
    modelName: 'Runway Gen-3 / Kling / Veo 2',
    promptText,
    negativePrompt: 'static image, jump cuts, jitter, distorted motion, low frame rate',
    parameters: {
      motionScale: 5,
      cameraMotion: 'slow_zoom_in',
      fps: 24,
      durationSeconds: 5
    }
  };
}

export function compileToImagen3(data: Partial<AGRouterPromptResponse>): CompilerTargetOutput {
  const main = data.prompt?.main || '';
  const style = data.prompt?.style || '';
  const lighting = data.prompt?.lighting || '';
  const optics = data.optics?.focalLength ? `Shot on ${data.optics.focalLength} lens at ${data.optics.aperture}` : '';

  const promptText = `A crisp, highly realistic photograph of ${main}. Style: ${style}. Lighting: ${lighting}. Optics: ${optics}. Natural colors, realistic photorealistic texture representation, true-to-life details.`;

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

export function compileToIdeogram(data: Partial<AGRouterPromptResponse>): CompilerTargetOutput {
  const main = data.prompt?.main || '';
  const typography = data.typography?.hasText ? `featuring bold text typography stating "${data.typography.detectedText.join(' ')}"` : '';

  const promptText = `Graphic design art illustration of ${main} ${typography}. Dynamic typography alignment, crisp lettering, modern visual branding composition.`;

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

export function compileToRecraft(data: Partial<AGRouterPromptResponse>): CompilerTargetOutput {
  const main = data.prompt?.main || '';
  const style = data.prompt?.style || '';

  const promptText = `Clean vector digital illustration and 3D icon visualization, ${main}. Aesthetic style: ${style}. Clean geometry, vibrant color palette, vector paths.`;

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

export function compileToLeonardo(data: Partial<AGRouterPromptResponse>): CompilerTargetOutput {
  const main = data.prompt?.main || '';
  const style = data.prompt?.style || '';
  const camera = data.prompt?.camera || '';

  const promptText = `(${main}:1.2), (${style}:1.1), ${camera}, masterpiece, trending on artstation, cinematic lighting, 8k resolution`;

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

export function compileToFirefly(data: Partial<AGRouterPromptResponse>): CompilerTargetOutput {
  const main = data.prompt?.main || '';
  const lighting = data.prompt?.lighting || '';
  const optics = data.optics?.focalLength ? `${data.optics.shotType}, ${data.optics.focalLength}` : '';

  const promptText = `Commercial photograph of ${main}. Lighting: ${lighting}. Camera lens: ${optics}. Professional studio quality, pristine depth of field.`;

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
 * Main AST Compiler entry point.
 * Compiles intermediate representation into all 10 target architectures.
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
