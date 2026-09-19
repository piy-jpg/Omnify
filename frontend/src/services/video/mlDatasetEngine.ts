/**
 * ConvertPro AI / ML Dataset Frame Extractor Engine
 * Extracts, pre-processes, deduplicates, and structures video frames for
 * Machine Learning & Computer Vision model training (YOLO, PyTorch ViT, LoRA, OpenCV, etc.).
 */

import JSZip from 'jszip';

export type MLFrameworkPreset = 'yolo' | 'classification' | 'lora_diffusion' | 'opencv_tracking' | 'custom';

export interface MLDatasetConfig {
  preset: MLFrameworkPreset;
  targetResolution: { width: number; height: number };
  aspectMode: 'pad_square' | 'center_crop' | 'stretch' | 'original';
  samplingMethod: 'interval' | 'fps' | 'total_frames';
  samplingValue: number; // e.g. 1.0s interval or 2 FPS or 150 frames
  filterBlur: boolean;
  minSharpnessScore: number; // 0 - 100
  deduplicate: boolean;
  dedupThreshold: number; // 0.05 to 0.5 (difference threshold)
  splitRatio: {
    train: number; // e.g. 80
    val: number;   // e.g. 10
    test: number;  // e.g. 10
  };
  outputFormat: 'image/jpeg' | 'image/png' | 'image/webp';
  imageQuality: number; // 0.5 - 1.0
  namingPrefix: string; // e.g. 'img' or 'frame'
  datasetName: string;
  classNames: string[]; // e.g. ['object_1', 'object_2']
  loraTriggerWord: string; // for LoRA fine-tuning prompt captions
}

export interface MLDtsFrame {
  id: string;
  index: number;
  timestamp: number;
  formattedTime: string;
  splitGroup: 'train' | 'val' | 'test';
  fileName: string;
  captionFileName?: string;
  captionContent?: string;
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
  sizeBytes: number;
  sharpness: number;
  differenceScore: number;
}

export interface MLDatasetProgress {
  currentFrame: number;
  totalEstimated: number;
  percentage: number;
  acceptedCount: number;
  rejectedBlurCount: number;
  rejectedDupCount: number;
  statusMessage: string;
  isComplete: boolean;
}

export const ML_PRESETS: Record<MLFrameworkPreset, {
  name: string;
  tag: string;
  shortLabel: string;
  description: string;
  recommendedWidth: number;
  recommendedHeight: number;
  aspectMode: MLDatasetConfig['aspectMode'];
  outputFormat: MLDatasetConfig['outputFormat'];
}> = {
  yolo: {
    name: 'YOLOv8 / YOLOv11',
    tag: 'Object Detection',
    shortLabel: 'YOLOv8',
    description: 'Standardized 640x640 square datasets with data.yaml, classes.txt, images/ and labels/ folders.',
    recommendedWidth: 640,
    recommendedHeight: 640,
    aspectMode: 'pad_square',
    outputFormat: 'image/jpeg'
  },
  classification: {
    name: 'PyTorch / ViT',
    tag: 'Classification',
    shortLabel: 'PyTorch / ViT',
    description: 'Normalized 224x224 / 384x384 image tensors sorted into train/val/test class directories with dataset.py.',
    recommendedWidth: 224,
    recommendedHeight: 224,
    aspectMode: 'center_crop',
    outputFormat: 'image/jpeg'
  },
  lora_diffusion: {
    name: 'Stable Diffusion (LoRA)',
    tag: 'Generative AI',
    shortLabel: 'Stable Diffusion / LoRA',
    description: 'High-res 512x512 / 1024x1024 frames with paired .txt prompt caption files for trigger word fine-tuning.',
    recommendedWidth: 512,
    recommendedHeight: 512,
    aspectMode: 'center_crop',
    outputFormat: 'image/png'
  },
  opencv_tracking: {
    name: 'OpenCV Tracking',
    tag: 'Computer Vision',
    shortLabel: 'OpenCV / Tracking',
    description: 'Dense continuous frames at original aspect ratio with sequence manifest.json and timestamps.',
    recommendedWidth: 1280,
    recommendedHeight: 720,
    aspectMode: 'original',
    outputFormat: 'image/jpeg'
  },
  custom: {
    name: 'Custom Pipeline',
    tag: 'Manual Config',
    shortLabel: 'Custom',
    description: 'Full manual control over frame resolution, train/val split ratios, blur filtering, and naming.',
    recommendedWidth: 640,
    recommendedHeight: 640,
    aspectMode: 'pad_square',
    outputFormat: 'image/jpeg'
  }
};

/**
 * Calculates sharpness score of canvas frame using Laplacian variance approximation
 */
export function calculateSharpness(ctx: CanvasRenderingContext2D, width: number, height: number): number {
  try {
    const sampleW = Math.min(width, 160);
    const sampleH = Math.min(height, 90);
    const imgData = ctx.getImageData(0, 0, sampleW, sampleH);
    const data = imgData.data;
    let laplacianSum = 0;
    let count = 0;

    for (let y = 1; y < sampleH - 1; y += 2) {
      for (let x = 1; x < sampleW - 1; x += 2) {
        const idx = (y * sampleW + x) * 4;
        const center = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
        const left = (data[idx - 4] + data[idx - 3] + data[idx - 2]) / 3;
        const right = (data[idx + 4] + data[idx + 5] + data[idx + 6]) / 3;
        const top = (data[idx - sampleW * 4] + data[idx - sampleW * 4 + 1] + data[idx - sampleW * 4 + 2]) / 3;
        const bottom = (data[idx + sampleW * 4] + data[idx + sampleW * 4 + 1] + data[idx + sampleW * 4 + 2]) / 3;

        const laplacian = Math.abs(4 * center - left - right - top - bottom);
        laplacianSum += laplacian;
        count++;
      }
    }
    return count > 0 ? Math.min(100, Math.round((laplacianSum / count) * 4)) : 75;
  } catch (e) {
    return 75;
  }
}

/**
 * Calculates average difference between two image data buffers to filter duplicates
 */
export function calculateFrameDifference(currCtx: CanvasRenderingContext2D, prevImageData: ImageData | null, width: number, height: number): { diff: number; currentThumb: ImageData } {
  const thumbW = 40;
  const thumbH = 40;
  const currData = currCtx.getImageData(0, 0, thumbW, thumbH);

  if (!prevImageData) {
    return { diff: 1.0, currentThumb: currData };
  }

  let totalDiff = 0;
  const totalPixels = thumbW * thumbH;
  for (let i = 0; i < currData.data.length; i += 4) {
    const rDiff = Math.abs(currData.data[i] - prevImageData.data[i]);
    const gDiff = Math.abs(currData.data[i + 1] - prevImageData.data[i + 1]);
    const bDiff = Math.abs(currData.data[i + 2] - prevImageData.data[i + 2]);
    totalDiff += (rDiff + gDiff + bDiff) / (3 * 255);
  }

  const normalizedDiff = totalDiff / totalPixels;
  return { diff: normalizedDiff, currentThumb: currData };
}

/**
 * Extracts and structures video frames for ML training
 */
export async function extractMLDatasetFrames(
  videoElement: HTMLVideoElement,
  videoFile: File,
  config: MLDatasetConfig,
  onProgress?: (p: MLDatasetProgress) => void,
  shouldCancel?: () => boolean
): Promise<MLDtsFrame[]> {
  const duration = videoElement.duration || 10;
  const videoW = videoElement.videoWidth || 1920;
  const videoH = videoElement.videoHeight || 1080;

  // Determine timestamps to sample
  const timestamps: number[] = [];
  if (config.samplingMethod === 'interval') {
    const step = Math.max(0.05, config.samplingValue);
    for (let t = 0; t < duration; t += step) {
      timestamps.push(t);
    }
  } else if (config.samplingMethod === 'fps') {
    const fps = Math.max(0.1, config.samplingValue);
    const step = 1 / fps;
    for (let t = 0; t < duration; t += step) {
      timestamps.push(t);
    }
  } else {
    const total = Math.max(2, Math.min(2000, config.samplingValue));
    const step = duration / total;
    for (let i = 0; i < total; i++) {
      timestamps.push(i * step);
    }
  }

  const targetW = config.targetResolution.width || 640;
  const targetH = config.targetResolution.height || 640;

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Failed to create Canvas 2D context.');

  const results: MLDtsFrame[] = [];
  let prevThumb: ImageData | null = null;
  let rejectedBlur = 0;
  let rejectedDup = 0;

  const ext = config.outputFormat === 'image/png' ? 'png' : config.outputFormat === 'image/webp' ? 'webp' : 'jpg';

  // Process timestamps sequentially
  for (let i = 0; i < timestamps.length; i++) {
    if (shouldCancel && shouldCancel()) break;

    const time = timestamps[i];

    // Seek video safely with timeout fallback
    await new Promise<void>((resolve) => {
      let settled = false;
      const timeout = setTimeout(() => {
        if (!settled) {
          settled = true;
          videoElement.removeEventListener('seeked', handleSeeked);
          resolve();
        }
      }, 1200);

      const handleSeeked = () => {
        if (!settled) {
          settled = true;
          clearTimeout(timeout);
          videoElement.removeEventListener('seeked', handleSeeked);
          resolve();
        }
      };

      videoElement.addEventListener('seeked', handleSeeked, { once: true });
      videoElement.currentTime = time;
    });

    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, targetW, targetH);

    // Draw video based on aspect mode
    if (config.aspectMode === 'pad_square') {
      // Letterbox / Pillarbox padding
      const videoRatio = videoW / videoH;
      const targetRatio = targetW / targetH;
      let drawW = targetW;
      let drawH = targetH;
      let offsetX = 0;
      let offsetY = 0;

      if (videoRatio > targetRatio) {
        drawW = targetW;
        drawH = targetW / videoRatio;
        offsetY = (targetH - drawH) / 2;
      } else {
        drawH = targetH;
        drawW = targetH * videoRatio;
        offsetX = (targetW - drawW) / 2;
      }
      ctx.drawImage(videoElement, offsetX, offsetY, drawW, drawH);
    } else if (config.aspectMode === 'center_crop') {
      // Center crop
      const videoRatio = videoW / videoH;
      const targetRatio = targetW / targetH;
      let srcX = 0;
      let srcY = 0;
      let srcW = videoW;
      let srcH = videoH;

      if (videoRatio > targetRatio) {
        srcW = videoH * targetRatio;
        srcX = (videoW - srcW) / 2;
      } else {
        srcH = videoW / targetRatio;
        srcY = (videoH - srcH) / 2;
      }
      ctx.drawImage(videoElement, srcX, srcY, srcW, srcH, 0, 0, targetW, targetH);
    } else {
      // Direct scale or original
      ctx.drawImage(videoElement, 0, 0, targetW, targetH);
    }

    // Quality Analysis: Sharpness & Blur Filter
    const sharpness = calculateSharpness(ctx, targetW, targetH);
    if (config.filterBlur && sharpness < config.minSharpnessScore) {
      rejectedBlur++;
      continue;
    }

    // Duplicate Check
    const { diff, currentThumb } = calculateFrameDifference(ctx, prevThumb, targetW, targetH);
    if (config.deduplicate && diff < config.dedupThreshold && prevThumb !== null) {
      rejectedDup++;
      continue;
    }
    prevThumb = currentThumb;

    // Convert to Blob & DataURL
    const blob = await new Promise<Blob>((res) => {
      canvas.toBlob((b) => res(b || new Blob()), config.outputFormat, config.imageQuality);
    });
    const dataUrl = canvas.toDataURL(config.outputFormat, config.imageQuality);

    // Split allocation (Train, Val, Test)
    const trainWeight = config.splitRatio.train || 80;
    const valWeight = config.splitRatio.val || 10;
    const testWeight = config.splitRatio.test || 10;
    const totalWeight = trainWeight + valWeight + testWeight || 100;

    const randVal = Math.random() * totalWeight;
    let splitGroup: 'train' | 'val' | 'test' = 'train';
    if (randVal > trainWeight && randVal <= trainWeight + valWeight) {
      splitGroup = 'val';
    } else if (randVal > trainWeight + valWeight) {
      splitGroup = 'test';
    }

    const frameNum = results.length + 1;
    const padNum = String(frameNum).padStart(5, '0');
    const prefix = config.namingPrefix || 'frame';
    const fileName = `${prefix}_${padNum}.${ext}`;

    const item: MLDtsFrame = {
      id: `mldts_${frameNum}_${Date.now()}`,
      index: frameNum,
      timestamp: time,
      formattedTime: `${Math.floor(time / 60)}:${(time % 60).toFixed(1).padStart(4, '0')}`,
      splitGroup,
      fileName,
      blob,
      dataUrl,
      width: targetW,
      height: targetH,
      sizeBytes: blob.size,
      sharpness,
      differenceScore: Math.round(diff * 100)
    };

    if (config.preset === 'lora_diffusion' && config.loraTriggerWord) {
      item.captionFileName = `${prefix}_${padNum}.txt`;
      item.captionContent = `${config.loraTriggerWord}, high quality visual frame, photo of scene at ${item.formattedTime}`;
    }

    results.push(item);

    if (onProgress) {
      onProgress({
        currentFrame: i + 1,
        totalEstimated: timestamps.length,
        percentage: Math.round(((i + 1) / timestamps.length) * 100),
        acceptedCount: results.length,
        rejectedBlurCount: rejectedBlur,
        rejectedDupCount: rejectedDup,
        statusMessage: `Processing frame ${i + 1}/${timestamps.length} (${results.length} accepted, ${rejectedBlur} blur-filtered, ${rejectedDup} duplicates removed)...`,
        isComplete: false
      });
    }
  }

  if (onProgress) {
    onProgress({
      currentFrame: timestamps.length,
      totalEstimated: timestamps.length,
      percentage: 100,
      acceptedCount: results.length,
      rejectedBlurCount: rejectedBlur,
      rejectedDupCount: rejectedDup,
      statusMessage: `ML Dataset generation complete! ${results.length} clean training frames ready.`,
      isComplete: true
    });
  }

  return results;
}

/**
 * Builds and downloads structured ML dataset ZIP archive
 */
export async function bundleAndDownloadMLDataset(
  frames: MLDtsFrame[],
  config: MLDatasetConfig,
  videoFileName: string
): Promise<void> {
  const zip = new JSZip();
  const datasetName = config.datasetName || 'convertpro_ml_dataset';

  // 1. YOLO Framework Structure
  if (config.preset === 'yolo') {
    const classList = config.classNames && config.classNames.length > 0 ? config.classNames : ['object'];
    const yamlContent = `# ConvertPro Ultralytics YOLO Training Configuration
path: ./
train: images/train
val: images/val
test: images/test

# Classes
nc: ${classList.length}
names: [${classList.map(n => `'${n}'`).join(', ')}]

# Generation Metadata
generator: "ConvertPro AI/ML Dataset Studio"
source_video: "${videoFileName}"
total_samples: ${frames.length}
`;
    zip.file('data.yaml', yamlContent);
    zip.file('classes.txt', classList.join('\n'));

    // Python training starter script
    const pyScript = `# Ultralytics YOLO Training Starter Script
# Requirements: pip install ultralytics
from ultralytics import YOLO

if __name__ == '__main__':
    # Load a pretrained YOLOv8/YOLOv11 model
    model = YOLO('yolov8n.pt')

    # Train on your generated dataset
    results = model.train(
        data='data.yaml',
        epochs=50,
        imgsz=${config.targetResolution.width || 640},
        batch=16,
        name='${datasetName}'
    )
    print("Training finished! Results saved to runs/detect/")
`;
    zip.file('train_yolo.py', pyScript);

    // Create folders
    const imgTrain = zip.folder('images/train');
    const imgVal = zip.folder('images/val');
    const imgTest = zip.folder('images/test');
    zip.folder('labels/train');
    zip.folder('labels/val');
    zip.folder('labels/test');

    for (const f of frames) {
      if (f.splitGroup === 'train') imgTrain?.file(f.fileName, f.blob);
      else if (f.splitGroup === 'val') imgVal?.file(f.fileName, f.blob);
      else imgTest?.file(f.fileName, f.blob);
    }
  } 
  // 2. PyTorch / Classification Framework Structure
  else if (config.preset === 'classification') {
    const classList = config.classNames && config.classNames.length > 0 ? config.classNames : ['default_class'];
    const primaryClass = classList[0];

    const pyScript = `# PyTorch Dataset Loader Starter Script
# Requirements: pip install torch torchvision
import torch
from torchvision import datasets, transforms
from torch.utils.data import DataLoader

def get_dataloaders(batch_size=32):
    transform = transforms.Compose([
        transforms.Resize((${config.targetResolution.height}, ${config.targetResolution.width})),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    train_dataset = datasets.ImageFolder(root='train', transform=transform)
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
    
    print(f"Loaded {len(train_dataset)} training samples across classes: {train_dataset.classes}")
    return train_loader

if __name__ == '__main__':
    get_dataloaders()
`;
    zip.file('dataset.py', pyScript);

    for (const f of frames) {
      const targetFolder = zip.folder(`${f.splitGroup}/${primaryClass}`);
      targetFolder?.file(f.fileName, f.blob);
    }
  }
  // 3. LoRA / Stable Diffusion Structure
  else if (config.preset === 'lora_diffusion') {
    const imgFolder = zip.folder('dataset');
    for (const f of frames) {
      imgFolder?.file(f.fileName, f.blob);
      if (f.captionFileName && f.captionContent) {
        imgFolder?.file(f.captionFileName, f.captionContent);
      }
    }

    const loraCommand = `# Kohya_ss / Diffusers LoRA Fine-Tuning Guide
# Trigger Word: ${config.loraTriggerWord || 'tok_subject'}
# Resolution: ${config.targetResolution.width}x${config.targetResolution.height}
# Number of training images: ${frames.length}

accelerate launch --num_cpu_threads_per_process=2 \\
  train_network.py \\
  --pretrained_model_name_or_path="runwayml/stable-diffusion-v1-5" \\
  --train_data_dir="./dataset" \\
  --output_dir="./output" \\
  --resolution="${config.targetResolution.width},${config.targetResolution.height}" \\
  --network_module=networks.lora \\
  --learning_rate=1e-4 \\
  --network_dim=32 \\
  --output_name="${datasetName}_lora"
`;
    zip.file('train_lora.sh', loraCommand);
  } 
  // 4. OpenCV Tracking & Optical Flow Structure
  else if (config.preset === 'opencv_tracking') {
    const seqFolder = zip.folder('sequence');
    const manifestItems = [];

    for (let i = 0; i < frames.length; i++) {
      const f = frames[i];
      seqFolder?.file(f.fileName, f.blob);
      manifestItems.push({
        index: i + 1,
        timestamp_seconds: f.timestamp,
        timecode: f.formattedTime,
        file: f.fileName,
        width: f.width,
        height: f.height,
        sharpness_score: f.sharpness
      });
    }

    zip.file('sequence_manifest.json', JSON.stringify({
      video_source: videoFileName,
      frame_count: frames.length,
      resolution: `${config.targetResolution.width}x${config.targetResolution.height}`,
      frames: manifestItems
    }, null, 2));

    const cvPyScript = `# OpenCV Sequence Loader & Optical Flow Starter
import cv2
import json
import glob

# Load manifest
with open('sequence_manifest.json', 'r') as f:
    manifest = json.load(f)

print(f"Loaded sequence with {manifest['frame_count']} frames.")

# Read frames sequentially
frame_files = sorted(glob.glob('sequence/*.jpg') + glob.glob('sequence/*.png'))
for file in frame_files:
    frame = cv2.imread(file)
    if frame is None:
        continue
    cv2.imshow('ConvertPro OpenCV Stream', frame)
    if cv2.waitKey(30) & 0xFF == ord('q'):
        break

cv2.destroyAllWindows()
`;
    zip.file('opencv_loader.py', cvPyScript);
  }
  // 5. Custom Pipeline Structure
  else {
    const trainFolder = zip.folder('train');
    const valFolder = zip.folder('val');
    const testFolder = zip.folder('test');

    for (const f of frames) {
      if (f.splitGroup === 'train') trainFolder?.file(f.fileName, f.blob);
      else if (f.splitGroup === 'val') valFolder?.file(f.fileName, f.blob);
      else testFolder?.file(f.fileName, f.blob);
    }
  }

  // Common metadata descriptor JSON
  const metadataJson = {
    dataset_name: datasetName,
    framework: config.preset,
    created_at: new Date().toISOString(),
    source_video: videoFileName,
    target_resolution: `${config.targetResolution.width}x${config.targetResolution.height}`,
    aspect_mode: config.aspectMode,
    total_images: frames.length,
    split_counts: {
      train: frames.filter(f => f.splitGroup === 'train').length,
      val: frames.filter(f => f.splitGroup === 'val').length,
      test: frames.filter(f => f.splitGroup === 'test').length
    },
    format: config.outputFormat,
    classes: config.classNames && config.classNames.length > 0 ? config.classNames : ['object'],
    lora_trigger_word: config.preset === 'lora_diffusion' ? config.loraTriggerWord : undefined
  };
  zip.file('dataset_info.json', JSON.stringify(metadataJson, null, 2));

  // Generate and trigger download
  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 4 } });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${datasetName}_${config.preset}_dataset.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
