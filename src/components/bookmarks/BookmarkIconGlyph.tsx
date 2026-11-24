import { useState } from 'react';
import {
  BookOpen,
  Code2,
  Compass,
  Cpu,
  FlaskConical,
  Globe,
  Layers,
  Play,
  Shield,
  Sparkles,
  Terminal,
} from 'lucide-react';
import { BookmarkIconName } from '../../types/dashboard';
import { getFaviconUrl } from '../../utils/validation';

interface BookmarkIconGlyphProps {
  url: string;
  title: string;
  icon: BookmarkIconName;
  className?: string;
}

export const BOOKMARK_ICON_OPTIONS: { id: BookmarkIconName; label: string }[] = [
  { id: 'auto', label: 'Website Favicon' },
  { id: 'code', label: 'Code' },
  { id: 'terminal', label: 'Terminal' },
  { id: 'book', label: 'Book' },
  { id: 'compass', label: 'Compass' },
  { id: 'layers', label: 'Layers' },
  { id: 'flask', label: 'Research' },
  { id: 'play', label: 'Media' },
  { id: 'shield', label: 'Shield' },
  { id: 'cpu', label: 'System' },
  { id: 'globe', label: 'Globe' },
  { id: 'sparkles', label: 'Personal' },
];

export function renderPresetGlyph(icon: BookmarkIconName, className = 'h-4 w-4') {
  switch (icon) {
    case 'code':
      return <Code2 className={className} />;
    case 'terminal':
      return <Terminal className={className} />;
    case 'book':
      return <BookOpen className={className} />;
    case 'compass':
      return <Compass className={className} />;
    case 'layers':
      return <Layers className={className} />;
    case 'flask':
      return <FlaskConical className={className} />;
    case 'play':
      return <Play className={className} />;
    case 'shield':
      return <Shield className={className} />;
    case 'cpu':
      return <Cpu className={className} />;
    case 'sparkles':
      return <Sparkles className={className} />;
    case 'globe':
    case 'auto':
    default:
      return <Globe className={className} />;
  }
}

export function BookmarkIconGlyph({
  url,
  title,
  icon,
  className = 'h-5 w-5',
}: BookmarkIconGlyphProps) {
  const [faviconFailed, setFaviconFailed] = useState(false);

  if (icon !== 'auto') {
    return (
      <span style={{ color: 'var(--accent-highlight)' }}>
        {renderPresetGlyph(icon, className)}
      </span>
    );
  }

  const faviconSrc = getFaviconUrl(url);

  if (!faviconSrc || faviconFailed) {
    return (
      <span style={{ color: 'var(--accent-highlight)' }}>
        <Globe className={className} />
      </span>
    );
  }

  return (
    <img
      src={faviconSrc}
      alt={`${title} favicon`}
      referrerPolicy="no-referrer"
      onError={() => setFaviconFailed(true)}
      className={`${className} rounded-sm object-contain`}
    />
  );
}
