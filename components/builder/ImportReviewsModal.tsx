'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import type { Testimonial, TestimonialsContent, SiteBlock } from '@/lib/types';
import { Star, Plus, Trash2, Import, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

interface ImportReviewsModalProps {
  open: boolean;
  onClose: () => void;
  onImport: (block: SiteBlock) => void;
  existingBlock: SiteBlock | null;
}

interface ReviewDraft {
  name: string;
  role: string;
  company: string;
  quote: string;
  rating: number;
}

const EMPTY_REVIEW: ReviewDraft = { name: '', role: '', company: '', quote: '', rating: 5 };

const PASTE_PLACEHOLDER = `Collez vos avis ici dans n'importe quel format — un par paragraphe ou en liste.
Exemple :
"Service exceptionnel ! Je recommande vivement." — Sarah J., Directrice Marketing chez Apex Co.
★★★★★

Jean Martin, PDG de TechStart : "Cela a complètement transformé notre activité."`;

export function ImportReviewsModal({ open, onClose, onImport, existingBlock }: ImportReviewsModalProps) {
  const { toast } = useToast();
  const [mode, setMode] = React.useState<'paste' | 'manual'>('paste');
  const [pasteText, setPasteText] = React.useState('');
  const [parsing, setParsing] = React.useState(false);
  const [reviews, setReviews] = React.useState<ReviewDraft[]>([EMPTY_REVIEW]);
  const [headline, setHeadline] = React.useState('Ce que disent nos clients');
  const [expanded, setExpanded] = React.useState<number | null>(0);

  function updateReview(i: number, field: keyof ReviewDraft, value: string | number) {
    setReviews(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: value } : r));
  }

  function addReview() {
    setReviews(prev => [...prev, { ...EMPTY_REVIEW }]);
    setExpanded(reviews.length);
  }

  function removeReview(i: number) {
    setReviews(prev => prev.filter((_, idx) => idx !== i));
  }

  // Simple paste parser — extracts names, quotes, ratings
  function parsePastedReviews() {
    setParsing(true);
    try {
      const paragraphs = pasteText.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
      const parsed: ReviewDraft[] = [];

      for (const para of paragraphs) {
        const lines = para.split('\n').map(l => l.trim()).filter(Boolean);
        const quoteLine = lines.find(l => l.startsWith('"') || l.startsWith('\u201c') || l.startsWith('\u2018'));
        const authorLine = lines.find(l => l.includes('—') || l.includes('-') || l.includes(','));
        const starLine = lines.find(l => /★|⭐|\*{3,5}|5\/5|4\/5/.test(l));

        let quote = quoteLine?.replace(/["""'']/g, '').replace(/^—.*/, '').trim() ?? lines[0] ?? '';
        // Remove attribution from quote line
        if (quote.includes('—')) quote = quote.split('—')[0].trim();
        if (quote.includes(' - ')) quote = quote.split(' - ')[0].trim();

        let name = '';
        let role = '';
        let company = '';
        if (authorLine) {
          const raw = authorLine.replace(/^["'"""—\-\s]+/, '').trim();
          const dashParts = raw.split(/—|-/).map(p => p.trim());
          const namePart = dashParts[0] ?? '';
          const commaParts = namePart.split(',').map(p => p.trim());
          name = commaParts[0];
          role = commaParts[1] ?? '';
          company = (commaParts[2] ?? dashParts[1] ?? '').replace(/^(at|@)\s*/i, '');
        }

        const rating = starLine
          ? (starLine.match(/★|⭐|\*/g)?.length ?? 5)
          : 5;

        if (quote) {
          parsed.push({ name: name || 'Anonymous', role, company, quote, rating: Math.min(5, rating) });
        }
      }

      if (parsed.length === 0) {
        toast('Impossible d\'analyser les avis — essayez la saisie manuelle.', 'error');
      } else {
        setReviews(parsed);
        setMode('manual');
        setExpanded(0);
        toast(`${parsed.length} avis analysé${parsed.length !== 1 ? 's' : ''} ! Modifiez les détails ci-dessous.`, 'success');
      }
    } catch {
      toast('Erreur d\'analyse — essayez la saisie manuelle.', 'error');
    }
    setParsing(false);
  }

  function handleImport() {
    const valid = reviews.filter(r => r.quote.trim());
    if (valid.length === 0) {
      toast('Ajoutez au moins un avis avec un témoignage.', 'error');
      return;
    }

    const testimonials: Testimonial[] = valid.map(r => ({
      name: r.name || 'Customer',
      role: r.role || 'Customer',
      company: r.company || '',
      quote: r.quote,
      rating: r.rating,
    }));

    const content: TestimonialsContent = {
      headline,
      subheadline: '',
      testimonials,
      variant: 'cards',
    };

    if (existingBlock) {
      onImport({ ...existingBlock, content });
    } else {
      onImport({
        id: Math.random().toString(36).slice(2),
        type: 'testimonials',
        order: 999,
        content,
      });
    }

    toast(`${valid.length} avis importé${valid.length !== 1 ? 's' : ''} !`, 'success');
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-400" />
            Importer des avis
          </DialogTitle>
          <DialogDescription>
            Collez des avis depuis Google, Trustpilot ou toute autre source, ou ajoutez-les manuellement.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 flex flex-col gap-5">
          <Input label="Titre de la section" value={headline}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHeadline(e.target.value)} />

          {/* Mode tabs */}
          <div className="flex rounded-lg border border-[var(--border)] overflow-hidden">
            {(['paste', 'manual'] as const).map(m => (
              <button key={m} onClick={() => setMode(m)}
                className={`flex-1 py-2 text-sm font-medium transition-colors capitalize ${
                  mode === m ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}>
                {m === 'paste' ? '📋 Coller et analyser' : '✏️ Saisie manuelle'}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {mode === 'paste' ? (
              <motion.div key="paste" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <Textarea
                  label="Collez vos avis"
                  placeholder={PASTE_PLACEHOLDER}
                  value={pasteText}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPasteText(e.target.value)}
                  className="min-h-[180px] font-mono text-xs"
                />
                <Button onClick={parsePastedReviews} loading={parsing} disabled={!pasteText.trim()} className="w-full mt-3">
                  <Sparkles className="h-4 w-4" />
                  Analyser les avis
                </Button>
              </motion.div>
            ) : (
              <motion.div key="manual" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="flex flex-col gap-3">
                {reviews.map((r, i) => (
                  <div key={i} className="glass rounded-xl overflow-hidden">
                    <button
                      className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/5 transition-colors"
                      onClick={() => setExpanded(expanded === i ? null : i)}
                    >
                      <span className="text-sm font-medium text-white truncate">
                        {r.name || `Avis ${i + 1}`}
                        {r.quote && <span className="text-gray-400 font-normal"> — {r.quote.slice(0, 35)}...</span>}
                      </span>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5].map(s => (
                            <Star key={s} className={`h-3 w-3 ${s <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-600'}`} />
                          ))}
                        </div>
                        <button onClick={e => { e.stopPropagation(); removeReview(i); }}
                          className="text-gray-500 hover:text-red-400 transition-colors p-0.5">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                        {expanded === i ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                      </div>
                    </button>

                    <AnimatePresence>
                      {expanded === i && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 flex flex-col gap-3 border-t border-[var(--border)]">
                            <div className="grid grid-cols-3 gap-2 mt-3">
                              <Input placeholder="Nom" value={r.name}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateReview(i, 'name', e.target.value)} />
                              <Input placeholder="Poste / Titre" value={r.role}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateReview(i, 'role', e.target.value)} />
                              <Input placeholder="Entreprise" value={r.company}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateReview(i, 'company', e.target.value)} />
                            </div>
                            <Textarea placeholder="Témoignage..." value={r.quote}
                              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateReview(i, 'quote', e.target.value)}
                              className="min-h-[70px]" />
                            <div>
                              <label className="text-xs text-gray-400 mb-1.5 block">Note</label>
                              <div className="flex gap-1">
                                {[1,2,3,4,5].map(s => (
                                  <button key={s} type="button" onClick={() => updateReview(i, 'rating', s)}
                                    className="transition-transform hover:scale-125">
                                    <Star className={`h-5 w-5 ${s <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-600 hover:text-amber-300'}`} />
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}

                <Button variant="outline" onClick={addReview} size="sm">
                  <Plus className="h-4 w-4" /> Ajouter un avis
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="border-t border-[var(--border)] pt-4 flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">Annuler</Button>
            <Button onClick={handleImport} className="flex-1" disabled={reviews.filter(r => r.quote).length === 0}>
              <Import className="h-4 w-4" />
              Importer {reviews.filter(r => r.quote).length > 0 ? `${reviews.filter(r => r.quote).length} avis` : 'les avis'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
