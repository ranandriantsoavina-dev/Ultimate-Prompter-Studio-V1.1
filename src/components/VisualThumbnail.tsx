import React from 'react';
import { 
  Palette, 
  User, 
  Shirt, 
  Sparkles, 
  Camera, 
  Activity, 
  Smile, 
  MapPin, 
  Sun, 
  Aperture, 
  Sliders, 
  Image as ImageIcon 
} from 'lucide-react';
import { ImgPos } from '../types/prompter';

interface VisualThumbnailProps {
  image?: string;
  imgPos?: ImgPos;
  name: string;
  categoryIcon?: string;
  nsfw?: boolean;
  nsfwOn?: boolean;
  className?: string;
  aspect?: string;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  Palette: <Palette className="w-5 h-5 stroke-[1.25]" />,
  User: <User className="w-5 h-5 stroke-[1.25]" />,
  Shirt: <Shirt className="w-5 h-5 stroke-[1.25]" />,
  Sparkles: <Sparkles className="w-5 h-5 stroke-[1.25]" />,
  Camera: <Camera className="w-5 h-5 stroke-[1.25]" />,
  Activity: <Activity className="w-5 h-5 stroke-[1.25]" />,
  Smile: <Smile className="w-5 h-5 stroke-[1.25]" />,
  MapPin: <MapPin className="w-5 h-5 stroke-[1.25]" />,
  Sun: <Sun className="w-5 h-5 stroke-[1.25]" />,
  Aperture: <Aperture className="w-5 h-5 stroke-[1.25]" />,
  Sliders: <Sliders className="w-5 h-5 stroke-[1.25]" />
};

export function getImgStyle(image?: string, imgPos?: ImgPos): React.CSSProperties {
  if (!image) return {};
  const style: React.CSSProperties = {
    backgroundImage: `url('${image}')`,
    backgroundRepeat: 'no-repeat'
  };
  if (imgPos && imgPos.ar) {
    const w = (imgPos.z || 1) * Math.max(1, imgPos.ar) * 100;
    const h = (imgPos.z || 1) * Math.max(1, 1 / imgPos.ar) * 100;
    style.backgroundSize = `${w}% ${h}%`;
    style.backgroundPosition = `${imgPos.x}% ${imgPos.y}%`;
  } else {
    style.backgroundSize = 'cover';
    style.backgroundPosition = 'center';
  }
  return style;
}

export const VisualThumbnail: React.FC<VisualThumbnailProps> = ({
  image,
  imgPos,
  name,
  categoryIcon = 'Palette',
  nsfw,
  nsfwOn,
  className = '',
  aspect = 'aspect-square'
}) => {
  const isBlurred = nsfw && !nsfwOn;

  if (image) {
    return (
      <div
        className={`w-full ${aspect} relative overflow-hidden bg-[#111015] ${className}`}
      >
        <div
          className={`w-full h-full transition-transform duration-300 group-hover:scale-105 ${
            isBlurred ? 'filter blur-md scale-110' : ''
          }`}
          style={getImgStyle(image, imgPos)}
        />
        {isBlurred && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-[10px] font-medium text-white/70 tracking-wider">
            NSFW
          </div>
        )}
      </div>
    );
  }

  // Pure minimalist, monochrome neutral surface without colored gradients
  return (
    <div
      className={`w-full ${aspect} relative overflow-hidden flex flex-col items-center justify-center p-3 select-none bg-[#111014] border-b border-white/[0.04] ${className}`}
    >
      <div className="text-white/35 group-hover:text-white/80 transition-colors duration-200 mb-2">
        {ICON_MAP[categoryIcon] || <ImageIcon className="w-5 h-5 stroke-[1.25]" />}
      </div>
      <span className="text-[11px] font-medium text-white/50 text-center line-clamp-1 px-2 group-hover:text-white/80 transition-colors duration-200 tracking-tight">
        {name}
      </span>
    </div>
  );
};
