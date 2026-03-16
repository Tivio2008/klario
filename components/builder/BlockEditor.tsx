'use client';

import * as React from 'react';
import type { SiteBlock, BlockType, HeroContent, FeaturesContent, StatsContent, TestimonialsContent, PricingContent, ContactContent, FooterContent } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { generateId } from '@/lib/utils';

interface BlockEditorProps {
  block: SiteBlock;
  onChange: (block: SiteBlock) => void;
}

export function BlockEditor({ block, onChange }: BlockEditorProps) {
  function update(path: string, value: unknown) {
    const keys = path.split('.');
    const newContent = JSON.parse(JSON.stringify(block.content));
    let obj: Record<string, unknown> = newContent;
    for (let i = 0; i < keys.length - 1; i++) {
      obj = obj[keys[i]] as Record<string, unknown>;
    }
    obj[keys[keys.length - 1]] = value;
    onChange({ ...block, content: newContent });
  }

  switch (block.type) {
    case 'hero':
      return <HeroEditor content={block.content as HeroContent} update={update} />;
    case 'features':
      return <FeaturesEditor content={block.content as FeaturesContent} update={update} block={block} onChange={onChange} />;
    case 'testimonials':
      return <TestimonialsEditor content={block.content as TestimonialsContent} update={update} block={block} onChange={onChange} />;
    case 'pricing':
      return <PricingEditor content={block.content as PricingContent} update={update} block={block} onChange={onChange} />;
    case 'stats':
      return <StatsEditor content={block.content as StatsContent} update={update} block={block} onChange={onChange} />;
    case 'contact':
      return <ContactEditor content={block.content as ContactContent} update={update} />;
    case 'footer':
      return <FooterEditor content={block.content as FooterContent} update={update} />;
    default:
      return <p className="text-sm text-gray-400">No editor for this block type.</p>;
  }
}

function HeroEditor({ content, update }: { content: HeroContent; update: (p: string, v: unknown) => void }) {
  return (
    <div className="flex flex-col gap-4">
      <Input label="Texte du badge" value={content.badge || ''} onChange={e => update('badge', e.target.value)} placeholder="ex. Bêta disponible" />
      <Input label="Titre" value={content.headline} onChange={e => update('headline', e.target.value)} />
      <Textarea label="Sous-titre" value={content.subheadline} onChange={e => update('subheadline', e.target.value)} />
      <Input label="Bouton principal" value={content.ctaText} onChange={e => update('ctaText', e.target.value)} />
      <Input label="Bouton secondaire (optionnel)" value={content.ctaSecondaryText || ''} onChange={e => update('ctaSecondaryText', e.target.value)} />
      <div>
        <Select value={content.bgGradient || 'purple-blue'} onValueChange={v => update('bgGradient', v)}>
          <SelectTrigger label="Dégradé de fond">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="purple-blue">Violet → Bleu</SelectItem>
            <SelectItem value="amber-red">Ambre → Rouge</SelectItem>
            <SelectItem value="teal-blue">Sarcelle → Bleu</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function FeaturesEditor({ content, update, block, onChange }: {
  content: FeaturesContent;
  update: (p: string, v: unknown) => void;
  block: SiteBlock;
  onChange: (b: SiteBlock) => void;
}) {
  function updateFeature(i: number, field: string, value: string) {
    const features = [...content.features];
    features[i] = { ...features[i], [field]: value };
    onChange({ ...block, content: { ...content, features } });
  }

  function addFeature() {
    const features = [...content.features, { icon: '✨', title: 'New Feature', description: 'Feature description.' }];
    onChange({ ...block, content: { ...content, features } });
  }

  function removeFeature(i: number) {
    const features = content.features.filter((_, idx) => idx !== i);
    onChange({ ...block, content: { ...content, features } });
  }

  return (
    <div className="flex flex-col gap-4">
      <Input label="Titre" value={content.headline} onChange={e => update('headline', e.target.value)} />
      <Input label="Sous-titre" value={content.subheadline || ''} onChange={e => update('subheadline', e.target.value)} />

      <div className="border-t border-[var(--border)] pt-4">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-[var(--foreground)]">Fonctionnalités</label>
          <Button size="sm" variant="outline" onClick={addFeature}><Plus className="h-3 w-3" /> Ajouter</Button>
        </div>
        <div className="flex flex-col gap-4">
          {content.features.map((f, i) => (
            <div key={i} className="glass rounded-lg p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Fonctionnalité {i + 1}</span>
                <button onClick={() => removeFeature(i)} className="text-red-400 hover:text-red-300 transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <Input placeholder="Icône (emoji)" value={f.icon} onChange={e => updateFeature(i, 'icon', e.target.value)} />
              <Input placeholder="Titre" value={f.title} onChange={e => updateFeature(i, 'title', e.target.value)} />
              <Textarea placeholder="Description" value={f.description} onChange={e => updateFeature(i, 'description', e.target.value)} className="min-h-[60px]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TestimonialsEditor({ content, update, block, onChange }: {
  content: TestimonialsContent;
  update: (p: string, v: unknown) => void;
  block: SiteBlock;
  onChange: (b: SiteBlock) => void;
}) {
  function updateTestimonial(i: number, field: string, value: string | number) {
    const testimonials = [...content.testimonials];
    testimonials[i] = { ...testimonials[i], [field]: value };
    onChange({ ...block, content: { ...content, testimonials } });
  }

  function addTestimonial() {
    const testimonials = [...content.testimonials, { name: 'New Customer', role: 'CEO', company: 'Company', quote: 'Amazing product!', rating: 5 }];
    onChange({ ...block, content: { ...content, testimonials } });
  }

  function removeTestimonial(i: number) {
    const testimonials = content.testimonials.filter((_, idx) => idx !== i);
    onChange({ ...block, content: { ...content, testimonials } });
  }

  return (
    <div className="flex flex-col gap-4">
      <Input label="Titre" value={content.headline} onChange={e => update('headline', e.target.value)} />
      <Input label="Sous-titre" value={content.subheadline || ''} onChange={e => update('subheadline', e.target.value)} />

      <div className="border-t border-[var(--border)] pt-4">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium">Avis clients</label>
          <Button size="sm" variant="outline" onClick={addTestimonial}><Plus className="h-3 w-3" /> Ajouter</Button>
        </div>
        {content.testimonials.map((t, i) => (
          <div key={i} className="glass rounded-lg p-3 flex flex-col gap-2 mb-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Avis {i + 1}</span>
              <button onClick={() => removeTestimonial(i)} className="text-red-400 hover:text-red-300"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
            <Input placeholder="Nom" value={t.name} onChange={e => updateTestimonial(i, 'name', e.target.value)} />
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Poste" value={t.role} onChange={e => updateTestimonial(i, 'role', e.target.value)} />
              <Input placeholder="Entreprise" value={t.company} onChange={e => updateTestimonial(i, 'company', e.target.value)} />
            </div>
            <Textarea placeholder="Témoignage" value={t.quote} onChange={e => updateTestimonial(i, 'quote', e.target.value)} className="min-h-[60px]" />
          </div>
        ))}
      </div>
    </div>
  );
}

function PricingEditor({ content, update, block, onChange }: {
  content: PricingContent;
  update: (p: string, v: unknown) => void;
  block: SiteBlock;
  onChange: (b: SiteBlock) => void;
}) {
  function updateTier(i: number, field: string, value: unknown) {
    const tiers = [...content.tiers];
    tiers[i] = { ...tiers[i], [field]: value };
    onChange({ ...block, content: { ...content, tiers } });
  }

  function updateTierFeatures(i: number, value: string) {
    const features = value.split('\n').filter(Boolean);
    updateTier(i, 'features', features);
  }

  return (
    <div className="flex flex-col gap-4">
      <Input label="Titre" value={content.headline} onChange={e => update('headline', e.target.value)} />
      <Input label="Sous-titre" value={content.subheadline || ''} onChange={e => update('subheadline', e.target.value)} />

      <div className="border-t border-[var(--border)] pt-4">
        <label className="text-sm font-medium mb-3 block">Offres tarifaires</label>
        {content.tiers.map((tier, i) => (
          <div key={i} className="glass rounded-lg p-3 flex flex-col gap-2 mb-3">
            <span className="text-xs text-gray-400">{tier.name || `Tier ${i + 1}`}</span>
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Nom" value={tier.name} onChange={e => updateTier(i, 'name', e.target.value)} />
              <Input placeholder="Prix (ex. 49€)" value={tier.price} onChange={e => updateTier(i, 'price', e.target.value)} />
            </div>
            <Input placeholder="Texte du bouton" value={tier.ctaText} onChange={e => updateTier(i, 'ctaText', e.target.value)} />
            <Textarea
              placeholder="Fonctionnalités (une par ligne)"
              value={tier.features.join('\n')}
              onChange={e => updateTierFeatures(i, e.target.value)}
              className="min-h-[80px]"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function ContactEditor({ content, update }: { content: ContactContent; update: (p: string, v: unknown) => void }) {
  return (
    <div className="flex flex-col gap-4">
      <Input label="Titre" value={content.headline} onChange={e => update('headline', e.target.value)} />
      <Input label="Sous-titre" value={content.subheadline || ''} onChange={e => update('subheadline', e.target.value)} />
      <Input label="E-mail" type="email" value={content.email || ''} onChange={e => update('email', e.target.value)} />
      <Input label="Téléphone" value={content.phone || ''} onChange={e => update('phone', e.target.value)} />
      <Input label="Adresse" value={content.address || ''} onChange={e => update('address', e.target.value)} />
    </div>
  );
}

function StatsEditor({ content, update, block, onChange }: {
  content: StatsContent;
  update: (p: string, v: unknown) => void;
  block: SiteBlock;
  onChange: (b: SiteBlock) => void;
}) {
  function updateStat(i: number, field: string, value: string) {
    const stats = [...content.stats];
    stats[i] = { ...stats[i], [field]: value };
    onChange({ ...block, content: { ...content, stats } });
  }
  function addStat() {
    onChange({ ...block, content: { ...content, stats: [...content.stats, { value: '0', label: 'New Stat', suffix: '+' }] } });
  }
  function removeStat(i: number) {
    onChange({ ...block, content: { ...content, stats: content.stats.filter((_, idx) => idx !== i) } });
  }

  return (
    <div className="flex flex-col gap-4">
      <Input label="Titre (optionnel)" value={content.headline || ''} onChange={e => update('headline', e.target.value)} />
      <div className="border-t border-[var(--border)] pt-4">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium">Statistiques</label>
          <Button size="sm" variant="outline" onClick={addStat}><Plus className="h-3 w-3" /> Ajouter</Button>
        </div>
        {content.stats.map((s, i) => (
          <div key={i} className="glass rounded-lg p-3 flex flex-col gap-2 mb-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400">Statistique {i + 1}</span>
              <button onClick={() => removeStat(i)} className="text-red-400 hover:text-red-300"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Input placeholder="Préfixe (€)" value={s.prefix || ''} onChange={e => updateStat(i, 'prefix', e.target.value)} />
              <Input placeholder="Valeur (10000)" value={s.value} onChange={e => updateStat(i, 'value', e.target.value)} />
              <Input placeholder="Suffixe (+)" value={s.suffix || ''} onChange={e => updateStat(i, 'suffix', e.target.value)} />
            </div>
            <Input placeholder="Libellé" value={s.label} onChange={e => updateStat(i, 'label', e.target.value)} />
          </div>
        ))}
      </div>
    </div>
  );
}

function FooterEditor({ content, update }: { content: FooterContent; update: (p: string, v: unknown) => void }) {
  return (
    <div className="flex flex-col gap-4">
      <Input label="Nom de l'entreprise" value={content.companyName} onChange={e => update('companyName', e.target.value)} />
      <Input label="Slogan" value={content.tagline || ''} onChange={e => update('tagline', e.target.value)} />
      <Input label="Copyright" value={content.copyright || ''} onChange={e => update('copyright', e.target.value)} />
    </div>
  );
}
