'use client';

import type { BlockType } from '@/lib/types';

interface BlockDefinition {
  type: BlockType;
  label: string;
  description: string;
  icon: string;
}

const BLOCK_DEFINITIONS: BlockDefinition[] = [
  { type: 'hero', label: 'Hero', description: 'Bannière animée avec titre et boutons', icon: '🚀' },
  { type: 'about', label: 'À propos', description: 'Section histoire et valeurs de l\'entreprise', icon: '🏠' },
  { type: 'features', label: 'Services', description: 'Grille de services / fonctionnalités', icon: '✨' },
  { type: 'gallery', label: 'Galerie', description: 'Grille photos avec lightbox', icon: '🖼️' },
  { type: 'stats', label: 'Statistiques', description: 'Compteurs animés', icon: '📊' },
  { type: 'testimonials', label: 'Avis clients', description: 'Carrousel d\'avis automatique', icon: '💬' },
  { type: 'pricing', label: 'Tarifs / Menu', description: 'Offres, formules ou menu', icon: '💰' },
  { type: 'contact', label: 'Contact', description: 'Formulaire, WhatsApp, Maps', icon: '📬' },
  { type: 'footer', label: 'Pied de page', description: 'Pied de page avec liens et copyright', icon: '📄' },
];

interface BlockLibraryProps {
  onAddBlock: (type: BlockType) => void;
}

export function BlockLibrary({ onAddBlock }: BlockLibraryProps) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-1">Blocs</p>
      {BLOCK_DEFINITIONS.map(def => (
        <button
          key={def.type}
          onClick={() => onAddBlock(def.type)}
          className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border)] hover:border-purple-500/50 hover:bg-purple-500/5 text-left transition-all group w-full"
        >
          <span className="text-2xl">{def.icon}</span>
          <div>
            <div className="text-sm font-medium text-white group-hover:text-purple-300 transition-colors">{def.label}</div>
            <div className="text-xs text-gray-400">{def.description}</div>
          </div>
        </button>
      ))}
    </div>
  );
}
