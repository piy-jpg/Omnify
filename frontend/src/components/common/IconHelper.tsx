import React from 'react';
import {
  FileImage,
  FileText,
  CopyPlus,
  Scissors,
  Minimize2,
  ScanText,
  Sparkles,
  Image,
  Layers,
  Smartphone,
  ImagePlus,
  BookOpen,
  Presentation,
  Table,
  FileCheck,
  FileSpreadsheet,
  AlignLeft,
  RotateCw,
  Stamp,
  Lock,
  Bot,
  Wand2,
  Sliders,
  Crop,
  Film,
  File,
  Archive,
  GitCompare,
  LucideProps
} from 'lucide-react';

interface IconHelperProps extends LucideProps {
  name: string;
}

export const IconHelper: React.FC<IconHelperProps> = ({ name, ...props }) => {
  switch (name) {
    case 'GitCompare': return <GitCompare {...props} />;
    case 'Archive': return <Archive {...props} />;
    case 'Film': return <Film {...props} />;
    case 'FileImage': return <FileImage {...props} />;
    case 'FileText': return <FileText {...props} />;
    case 'CopyPlus': return <CopyPlus {...props} />;
    case 'Scissors': return <Scissors {...props} />;
    case 'Minimize2': return <Minimize2 {...props} />;
    case 'ScanText': return <ScanText {...props} />;
    case 'Sparkles': return <Sparkles {...props} />;
    case 'Image': return <Image {...props} />;
    case 'Layers': return <Layers {...props} />;
    case 'Smartphone': return <Smartphone {...props} />;
    case 'ImagePlus': return <ImagePlus {...props} />;
    case 'BookOpen': return <BookOpen {...props} />;
    case 'Presentation': return <Presentation {...props} />;
    case 'Table': return <Table {...props} />;
    case 'FileCheck': return <FileCheck {...props} />;
    case 'FileSpreadsheet': return <FileSpreadsheet {...props} />;
    case 'AlignLeft': return <AlignLeft {...props} />;
    case 'RotateCw': return <RotateCw {...props} />;
    case 'Stamp': return <Stamp {...props} />;
    case 'Lock': return <Lock {...props} />;
    case 'Bot': return <Bot {...props} />;
    case 'Wand2': return <Wand2 {...props} />;
    case 'Sliders': return <Sliders {...props} />;
    case 'Crop': return <Crop {...props} />;
    default: return <File {...props} />;
  }
};

