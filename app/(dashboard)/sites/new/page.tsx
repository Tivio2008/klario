'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { generateSlug } from '@/lib/utils';
import { Wand2, Star, ImagePlus, X, Upload, Zap, Layers, ChevronRight, ChevronLeft } from 'lucide-react';

// ─── Upload helpers ──────────────────────────────────────────────────────────

function readAsDataURL(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

async function uploadToStorage(supabase: ReturnType<typeof createClient>, userId: string, file: File): Promise<string | null> {
  const ext = file.name.split('.').pop();
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from('site-media').upload(path, file, { upsert: false });
  if (error) {
    console.warn('Storage upload failed:', error.message);
    return null;
  }
  const { data } = supabase.storage.from('site-media').getPublicUrl(path);
  return data.publicUrl;
}

// ─── Photo preview card ──────────────────────────────────────────────────────

function PhotoCard({ src, onRemove }: { src: string; onRemove: () => void }) {
  return (
    <div className="relative group rounded-xl overflow-hidden aspect-square">
      <img src={src} alt="" className="w-full h-full object-cover" />
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/70 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ─── Complete Mode Form ──────────────────────────────────────────────────────

const STEPS = [
  { id: 1, title: 'Nom et type' },
  { id: 2, title: 'Description' },
  { id: 3, title: 'Services' },
  { id: 4, title: 'Style' },
  { id: 5, title: 'Photos' },
  { id: 6, title: 'Avis clients' },
];

interface CompleteFormData {
  businessName: string;
  businessType: string;
  city: string;
  description: string;
  address: string;
  openingHours: string;
  email: string;
  services: string;
  colors: string;
  phone: string;
  whatsapp: string;
}

interface Review {
  name: string;
  rating: number;
  comment: string;
}

function CompleteMode({ onGenerate }: { onGenerate: (prompt: string, logoUrl?: string, photoUrls?: string[], reviews?: Review[]) => void }) {
  const [step, setStep] = React.useState(1);
  const [formData, setFormData] = React.useState<CompleteFormData>({
    businessName: '',
    businessType: '',
    city: '',
    description: '',
    address: '',
    openingHours: '',
    email: '',
    services: '',
    colors: '',
    phone: '',
    whatsapp: '',
  });

  const [logoFile, setLogoFile] = React.useState<File | null>(null);
  const [logoPreview, setLogoPreview] = React.useState<string | null>(null);
  const [photoFiles, setPhotoFiles] = React.useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = React.useState<string[]>([]);
  const [reviews, setReviews] = React.useState<Review[]>([{ name: '', rating: 5, comment: '' }]);

  const logoRef = React.useRef<HTMLInputElement>(null);
  const photoRef = React.useRef<HTMLInputElement>(null);

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(await readAsDataURL(file));
  }

  async function handlePhotosChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, 10 - photoFiles.length);
    if (!files.length) return;
    const previews = await Promise.all(files.map(readAsDataURL));
    setPhotoFiles(prev => [...prev, ...files].slice(0, 10));
    setPhotoPreviews(prev => [...prev, ...previews].slice(0, 10));
    e.target.value = '';
  }

  function removePhoto(i: number) {
    setPhotoFiles(prev => prev.filter((_, idx) => idx !== i));
    setPhotoPreviews(prev => prev.filter((_, idx) => idx !== i));
  }

  async function handleComplete() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Upload photos
    let logoUrl: string | undefined;
    let photoUrls: string[] = [];
    if (logoFile || photoFiles.length > 0) {
      const [logoResult, ...photoResults] = await Promise.all([
        logoFile ? uploadToStorage(supabase, user.id, logoFile) : Promise.resolve(null),
        ...photoFiles.map(f => uploadToStorage(supabase, user.id, f)),
      ]);
      logoUrl = logoResult ?? undefined;
      photoUrls = photoResults.filter((u): u is string => u !== null);
    }

    // Build comprehensive prompt
    const prompt = `${formData.businessName} est ${formData.businessType} à ${formData.city}. ${formData.description}

Nos services : ${formData.services}

${formData.address ? `Adresse : ${formData.address}` : ''}
${formData.openingHours ? `Horaires : ${formData.openingHours}` : ''}
${formData.email ? `Email : ${formData.email}` : ''}
${formData.colors ? `Couleurs : ${formData.colors}` : ''}
${formData.phone ? `Téléphone : ${formData.phone}` : ''}
${formData.whatsapp ? `WhatsApp : ${formData.whatsapp}` : ''}`;

    // Filter reviews that have at least name and comment
    const validReviews = reviews.filter(r => r.name.trim() && r.comment.trim());

    onGenerate(prompt, logoUrl, photoUrls, validReviews.length > 0 ? validReviews : undefined);
  }

  const canProceed = () => {
    switch (step) {
      case 1: return formData.businessName && formData.businessType && formData.city;
      case 2: return formData.description.length > 20;
      case 3: return formData.services.length > 10;
      case 4: return true; // Optional
      case 5: return true; // Optional
      case 6: return true; // Optional
      default: return false;
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      {/* Progress */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <React.Fragment key={s.id}>
            <div className={`flex items-center gap-2 ${step >= s.id ? 'text-orange-400' : 'text-gray-600'}`}>
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= s.id ? 'bg-orange-500/20 text-orange-400' : 'bg-gray-800 text-gray-600'
              }`}>
                {s.id}
              </div>
              <span className="text-sm font-medium hidden sm:inline">{s.title}</span>
            </div>
            {i < STEPS.length - 1 && <ChevronRight className="h-4 w-4 text-gray-700" />}
          </React.Fragment>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="space-y-6"
        >
          {step === 1 && (
            <>
              <h2 className="text-2xl font-bold text-white mb-6">Informations de base</h2>
              <div>
                <label className="text-sm font-medium text-[var(--foreground)] mb-2 block">Nom du commerce *</label>
                <input
                  className="w-full h-12 rounded-lg border border-[var(--border)] bg-[var(--input)] px-4 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Ex: La Bella Napoli"
                  value={formData.businessName}
                  onChange={e => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--foreground)] mb-2 block">Type d'activité *</label>
                <input
                  className="w-full h-12 rounded-lg border border-[var(--border)] bg-[var(--input)] px-4 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Ex: restaurant italien, salon de coiffure, boulangerie"
                  value={formData.businessType}
                  onChange={e => setFormData(prev => ({ ...prev, businessType: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--foreground)] mb-2 block">Ville *</label>
                <input
                  className="w-full h-12 rounded-lg border border-[var(--border)] bg-[var(--input)] px-4 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Ex: Bévilard"
                  value={formData.city}
                  onChange={e => setFormData(prev => ({ ...prev, city: e.target.value }))}
                />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-2xl font-bold text-white mb-6">Décrivez votre commerce</h2>
              <Textarea
                label="Description détaillée *"
                placeholder="Racontez l'histoire de votre commerce, ce qui vous rend unique, votre ambiance..."
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="min-h-[200px]"
              />
              <div>
                <label className="text-sm font-medium text-[var(--foreground)] mb-2 block">Adresse complète</label>
                <input
                  type="text"
                  className="w-full h-12 rounded-lg border border-[var(--border)] bg-[var(--input)] px-4 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Rue du Commerce 12, 2300 La Chaux-de-Fonds"
                  value={formData.address}
                  onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--foreground)] mb-2 block">Horaires d'ouverture</label>
                <textarea
                  className="w-full min-h-[100px] rounded-lg border border-[var(--border)] bg-[var(--input)] px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                  placeholder="Ex: Lundi-Vendredi 9h-18h, Samedi 10h-16h, Dimanche Fermé"
                  value={formData.openingHours}
                  onChange={e => setFormData(prev => ({ ...prev, openingHours: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--foreground)] mb-2 block">Email de contact</label>
                <input
                  type="email"
                  className="w-full h-12 rounded-lg border border-[var(--border)] bg-[var(--input)] px-4 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="contact@moncommerce.ch"
                  value={formData.email}
                  onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="text-2xl font-bold text-white mb-6">Vos services et produits</h2>
              <Textarea
                label="Services proposés *"
                placeholder="Listez vos services, produits, spécialités... Ex: Pizzas au feu de bois, pâtes fraîches, tiramisu maison"
                value={formData.services}
                onChange={e => setFormData(prev => ({ ...prev, services: e.target.value }))}
                className="min-h-[150px]"
              />
            </>
          )}

          {step === 4 && (
            <>
              <h2 className="text-2xl font-bold text-white mb-6">Style et contact</h2>
              <div>
                <label className="text-sm font-medium text-[var(--foreground)] mb-2 block">Couleurs (optionnel)</label>
                <input
                  className="w-full h-12 rounded-lg border border-[var(--border)] bg-[var(--input)] px-4 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Ex: rouge et vert, bleu marine, rose gold"
                  value={formData.colors}
                  onChange={e => setFormData(prev => ({ ...prev, colors: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-[var(--foreground)] mb-2 block">Téléphone</label>
                  <input
                    className="w-full h-12 rounded-lg border border-[var(--border)] bg-[var(--input)] px-4 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="+41 32 123 45 67"
                    value={formData.phone}
                    onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[var(--foreground)] mb-2 block">WhatsApp</label>
                  <input
                    className="w-full h-12 rounded-lg border border-[var(--border)] bg-[var(--input)] px-4 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="41321234567"
                    value={formData.whatsapp}
                    onChange={e => setFormData(prev => ({ ...prev, whatsapp: e.target.value }))}
                  />
                </div>
              </div>
            </>
          )}

          {step === 5 && (
            <>
              <h2 className="text-2xl font-bold text-white mb-6">Photos</h2>
              <p className="text-gray-400 mb-4">Ajoutez votre logo et des photos de votre commerce (optionnel)</p>
              <div className="grid grid-cols-5 gap-2">
                {/* Logo */}
                {logoPreview ? (
                  <div className="relative group rounded-xl overflow-hidden aspect-square border border-white/10">
                    <img src={logoPreview} alt="logo" className="w-full h-full object-contain bg-white/5" />
                    <button
                      type="button"
                      onClick={() => { setLogoFile(null); setLogoPreview(null); }}
                      className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/70 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-center text-[10px] text-gray-300 py-0.5">Logo</div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => logoRef.current?.click()}
                    className="aspect-square rounded-xl border-2 border-dashed border-[var(--border)] hover:border-orange-500/50 hover:bg-orange-500/5 transition-all flex flex-col items-center justify-center gap-1"
                  >
                    <ImagePlus className="h-5 w-5 text-gray-500" />
                    <span className="text-[10px] text-gray-500">Logo</span>
                  </button>
                )}
                <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />

                {/* Photos */}
                {photoPreviews.map((src, i) => (
                  <PhotoCard key={i} src={src} onRemove={() => removePhoto(i)} />
                ))}

                {photoFiles.length < 10 && (
                  <button
                    type="button"
                    onClick={() => photoRef.current?.click()}
                    className="aspect-square rounded-xl border-2 border-dashed border-[var(--border)] hover:border-orange-500/50 hover:bg-orange-500/5 transition-all flex flex-col items-center justify-center gap-1"
                  >
                    <Upload className="h-5 w-5 text-gray-500" />
                    <span className="text-[10px] text-gray-500">Photo</span>
                  </button>
                )}
                <input ref={photoRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotosChange} />
              </div>
            </>
          )}

          {step === 6 && (
            <>
              <div className="flex items-center gap-2 mb-6">
                <Star className="h-6 w-6 text-amber-400 fill-amber-400" />
                <h2 className="text-2xl font-bold text-white">Avis clients</h2>
              </div>
              <div className="glass rounded-xl p-4 mb-4 border border-amber-500/20 bg-amber-500/5">
                <p className="text-amber-200 text-sm">
                  💡 Les avis clients renforcent la confiance. Ajoutez vos meilleurs avis Google Maps ici (optionnel).
                </p>
              </div>
              <div className="flex flex-col gap-4">
                {reviews.map((review, idx) => (
                  <div key={idx} className="glass rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <input
                        type="text"
                        placeholder="Nom du client"
                        value={review.name}
                        onChange={e => {
                          const newReviews = [...reviews];
                          newReviews[idx].name = e.target.value;
                          setReviews(newReviews);
                        }}
                        className="flex-1 h-10 rounded-lg border border-[var(--border)] bg-[var(--input)] px-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => {
                              const newReviews = [...reviews];
                              newReviews[idx].rating = star;
                              setReviews(newReviews);
                            }}
                            className="text-xl"
                          >
                            {star <= review.rating ? '⭐' : '☆'}
                          </button>
                        ))}
                      </div>
                      {reviews.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setReviews(reviews.filter((_, i) => i !== idx))}
                          className="p-1.5 text-gray-400 hover:text-red-400 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <textarea
                      placeholder="Commentaire du client..."
                      value={review.comment}
                      onChange={e => {
                        const newReviews = [...reviews];
                        newReviews[idx].comment = e.target.value;
                        setReviews(newReviews);
                      }}
                      className="w-full h-20 rounded-lg border border-[var(--border)] bg-[var(--input)] px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                    />
                  </div>
                ))}
                {reviews.length < 5 && (
                  <button
                    type="button"
                    onClick={() => setReviews([...reviews, { name: '', rating: 5, comment: '' }])}
                    className="h-10 rounded-lg border-2 border-dashed border-[var(--border)] hover:border-orange-500/50 hover:bg-orange-500/5 transition-all text-sm text-gray-400"
                  >
                    + Ajouter un avis
                  </button>
                )}
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex gap-3 mt-8">
        {step > 1 && (
          <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1">
            <ChevronLeft className="h-4 w-4" />
            Précédent
          </Button>
        )}
        {step < 6 ? (
          <Button
            onClick={() => setStep(step + 1)}
            disabled={!canProceed()}
            className="flex-1"
            style={{ background: 'linear-gradient(135deg, #e85d26, #c23b1a)' }}
          >
            Suivant
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleComplete}
            disabled={!canProceed()}
            className="flex-1"
            style={{ background: 'linear-gradient(135deg, #e85d26, #c23b1a)' }}
          >
            <Wand2 className="h-4 w-4" />
            Générer mon site
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Quick Mode ──────────────────────────────────────────────────────────────

function QuickMode({ onGenerate }: { onGenerate: (prompt: string, logoUrl?: string, photoUrls?: string[], reviews?: Review[]) => void }) {
  const [prompt, setPrompt] = React.useState('');
  const [reviews, setReviews] = React.useState('');
  const [error, setError] = React.useState('');

  const [logoFile, setLogoFile] = React.useState<File | null>(null);
  const [logoPreview, setLogoPreview] = React.useState<string | null>(null);
  const [photoFiles, setPhotoFiles] = React.useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = React.useState<string[]>([]);

  const logoRef = React.useRef<HTMLInputElement>(null);
  const photoRef = React.useRef<HTMLInputElement>(null);

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(await readAsDataURL(file));
  }

  async function handlePhotosChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, 10 - photoFiles.length);
    if (!files.length) return;
    const previews = await Promise.all(files.map(readAsDataURL));
    setPhotoFiles(prev => [...prev, ...files].slice(0, 10));
    setPhotoPreviews(prev => [...prev, ...previews].slice(0, 10));
    e.target.value = '';
  }

  function removePhoto(i: number) {
    setPhotoFiles(prev => prev.filter((_, idx) => idx !== i));
    setPhotoPreviews(prev => prev.filter((_, idx) => idx !== i));
  }

  async function handleQuick() {
    if (!prompt.trim()) {
      setError('Veuillez décrire votre commerce.');
      return;
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Upload photos
    let logoUrl: string | undefined;
    let photoUrls: string[] = [];
    if (logoFile || photoFiles.length > 0) {
      const [logoResult, ...photoResults] = await Promise.all([
        logoFile ? uploadToStorage(supabase, user.id, logoFile) : Promise.resolve(null),
        ...photoFiles.map(f => uploadToStorage(supabase, user.id, f)),
      ]);
      logoUrl = logoResult ?? undefined;
      photoUrls = photoResults.filter((u): u is string => u !== null);
    }

    const fullPrompt = reviews ? `${prompt}\n\nAvis clients:\n${reviews}` : prompt;
    onGenerate(fullPrompt, logoUrl, photoUrls);
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <div className="flex flex-col gap-6">
        <Textarea
          label="Décrivez votre commerce"
          placeholder={`Décrivez votre commerce en quelques phrases — nom, ville, type d'activité, services, ambiance, couleurs, horaires, téléphone, WhatsApp...\n\nEx : "La Bella Napoli est un restaurant italien chaleureux à Bévilard. Pizzas artisanales au feu de bois, pâtes fraîches, tiramisu maison. Ambiance familiale, couleurs rouge et vert. Ouvert depuis 2008. Tel : +41 32 123 45 67. Ouvert mar-dim 11h-22h."`}
          value={prompt}
          onChange={e => { setPrompt(e.target.value); setError(''); }}
          className="min-h-[200px]"
        />
        {error && <p className="text-red-400 text-sm mt-1.5">{error}</p>}

        {/* Photos */}
        <div>
          <p className="text-sm font-medium text-[var(--foreground)] mb-3">
            Photos (optionnel — logo + jusqu&apos;à 10 photos)
          </p>
          <div className="grid grid-cols-5 gap-2">
            {logoPreview ? (
              <div className="relative group rounded-xl overflow-hidden aspect-square border border-white/10">
                <img src={logoPreview} alt="logo" className="w-full h-full object-contain bg-white/5" />
                <button
                  type="button"
                  onClick={() => { setLogoFile(null); setLogoPreview(null); }}
                  className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/70 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-center text-[10px] text-gray-300 py-0.5">Logo</div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => logoRef.current?.click()}
                className="aspect-square rounded-xl border-2 border-dashed border-[var(--border)] hover:border-orange-500/50 hover:bg-orange-500/5 transition-all flex flex-col items-center justify-center gap-1"
              >
                <ImagePlus className="h-5 w-5 text-gray-500" />
                <span className="text-[10px] text-gray-500">Logo</span>
              </button>
            )}
            <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />

            {photoPreviews.map((src, i) => (
              <PhotoCard key={i} src={src} onRemove={() => removePhoto(i)} />
            ))}

            {photoFiles.length < 10 && (
              <button
                type="button"
                onClick={() => photoRef.current?.click()}
                className="aspect-square rounded-xl border-2 border-dashed border-[var(--border)] hover:border-orange-500/50 hover:bg-orange-500/5 transition-all flex flex-col items-center justify-center gap-1"
              >
                <Upload className="h-5 w-5 text-gray-500" />
                <span className="text-[10px] text-gray-500">Photo</span>
              </button>
            )}
            <input ref={photoRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotosChange} />
          </div>
        </div>

        {/* Reviews */}
        <div>
          <label className="text-sm font-medium text-[var(--foreground)] mb-2 flex items-center gap-1.5 block">
            <Star className="h-3.5 w-3.5 text-amber-400" />
            Avis clients (optionnel)
          </label>
          <Textarea
            placeholder={`Collez vos avis Google ou Trustpilot ici...\n\n"Excellent service, je recommande !" — Marie D. ★★★★★`}
            value={reviews}
            onChange={e => setReviews(e.target.value)}
            className="min-h-[100px] font-mono text-xs"
          />
        </div>

        <Button
          onClick={handleQuick}
          size="lg"
          className="w-full mt-2"
          style={{ background: 'linear-gradient(135deg, #e85d26, #c23b1a)' }}
          disabled={!prompt.trim()}
        >
          <Wand2 className="h-4 w-4" />
          Générer mon site avec l&apos;IA
        </Button>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function NewSitePage() {
  const router = useRouter();
  const { toast } = useToast();

  const [mode, setMode] = React.useState<'choice' | 'quick' | 'complete'>('choice');
  const [generating, setGenerating] = React.useState(false);
  const [status, setStatus] = React.useState('');

  async function handleGenerate(prompt: string, logoUrl?: string, photoUrls?: string[], reviews?: Review[]) {
    setGenerating(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }

    let html = '';
    let menuHtml: string | undefined;
    let siteName = 'Mon site';

    try {
      setStatus('Analyse de votre description...');
      await new Promise(r => setTimeout(r, 300));
      setStatus('Création de votre site avec l\'IA...');

      // Format reviews as text for the API
      const reviewsText = reviews && reviews.length > 0
        ? reviews.map(r => `${r.name} (${r.rating}/5): ${r.comment}`).join('\n\n')
        : undefined;

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim(), logoUrl, photoUrls, reviews: reviewsText }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('API error:', errorText);
        throw new Error(errorText);
      }

      const generated = await res.json();
      console.log('Generated response:', {
        hasHtml: !!generated.html,
        htmlLength: generated.html?.length,
        hasMenu: !!generated.menuHtml,
        name: generated.suggestedName
      });

      if (generated.error) throw new Error(generated.error);

      html = generated.html;
      menuHtml = generated.menuHtml;
      siteName = generated.suggestedName || 'Mon site';

      // VALIDATION CRITIQUE
      if (!html || html.trim().length === 0) {
        throw new Error('L\'API n\'a pas retourné de HTML. Réessayez.');
      }

      console.log('HTML validated, length:', html.length);

      if (menuHtml) {
        setStatus('Génération du menu...');
        await new Promise(r => setTimeout(r, 500));
      }

      setStatus('Finalisation...');
    } catch (err) {
      console.error('AI generation failed:', err);
      const errorMsg = err instanceof Error ? err.message : String(err);
      toast(`Erreur: ${errorMsg}`, 'error');
      setGenerating(false);
      return;
    }

    setStatus('Sauvegarde...');
    const slug = generateSlug(siteName);

    // Detect business type from prompt
    const isRestaurant = /restaurant|café|bar|pizzeria|brasserie|bistro|trattoria|osteria|boulangerie|pâtisserie|food|cuisine|menu/i.test(prompt);
    const isSalon = /salon|coiffeur|barbier|beauté|esthétique|spa|massage/i.test(prompt);
    const isShop = /boutique|magasin|commerce|shop|store/i.test(prompt);

    let template = 'restaurant'; // Default to restaurant for local businesses
    if (isSalon) template = 'salon';
    else if (isShop) template = 'shop';
    else if (!isRestaurant && !isSalon && !isShop) template = 'local-business';

    const insertData: any = {
      user_id: user.id,
      name: siteName,
      slug,
      template,
      status: 'draft',
      html,
    };

    if (menuHtml) {
      insertData.menu_html = menuHtml;
    }

    console.log('Saving to Supabase:', {
      name: siteName,
      htmlLength: html?.length,
      menuHtmlLength: menuHtml?.length,
      hasHtml: !!html
    });

    const { data, error: dbError } = await supabase
      .from('sites')
      .insert(insertData)
      .select()
      .single();

    console.log('Supabase response:', {
      success: !!data,
      error: dbError?.message,
      savedId: data?.id
    });

    if (dbError) {
      toast('Échec de la création : ' + dbError.message, 'error');
      setGenerating(false);
    } else {
      router.push(`/sites/${data.id}/edit`);
    }
  }

  if (generating) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <div className="relative inline-block mb-8">
            <div className="h-24 w-24 rounded-full bg-orange-600/20 flex items-center justify-center mx-auto">
              <Wand2 className="h-10 w-10 text-orange-400 animate-pulse" />
            </div>
            <div className="absolute inset-0 rounded-full border-2 border-orange-500/30 animate-ping" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Construction de votre site...</h2>
          <p className="text-orange-300 mb-6">{status}</p>
          <div className="flex justify-center gap-1.5">
            {[0, 1, 2].map(i => (
              <motion.div key={i} className="h-2 w-2 rounded-full bg-orange-500"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }} />
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  if (mode === 'choice') {
    return (
      <div className="max-w-4xl mx-auto px-6 py-16">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-3">Créer un site</h1>
            <p className="text-gray-400 text-lg">Choisissez votre mode de création</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Quick Mode */}
            <motion.button
              onClick={() => setMode('quick')}
              className="glass rounded-2xl p-8 text-left hover:border-orange-500/50 transition-all group"
              whileHover={{ y: -4 }}
            >
              <div className="h-14 w-14 rounded-xl bg-orange-600/20 flex items-center justify-center mb-4 group-hover:bg-orange-600/30 transition-colors">
                <Zap className="h-7 w-7 text-orange-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Création rapide</h3>
              <p className="text-gray-400 text-sm mb-4">
                Décrivez votre commerce en une seule fois — l&apos;IA génère tout automatiquement.
              </p>
              <div className="flex items-center text-orange-400 text-sm font-medium">
                30 secondes
                <ChevronRight className="h-4 w-4 ml-1" />
              </div>
            </motion.button>

            {/* Complete Mode */}
            <motion.button
              onClick={() => setMode('complete')}
              className="glass rounded-2xl p-8 text-left hover:border-orange-500/50 transition-all group"
              whileHover={{ y: -4 }}
            >
              <div className="h-14 w-14 rounded-xl bg-orange-600/20 flex items-center justify-center mb-4 group-hover:bg-orange-600/30 transition-colors">
                <Layers className="h-7 w-7 text-orange-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Création complète</h3>
              <p className="text-gray-400 text-sm mb-4">
                Formulaire guidé en 6 étapes pour un contrôle total sur chaque détail.
              </p>
              <div className="flex items-center text-orange-400 text-sm font-medium">
                2-3 minutes
                <ChevronRight className="h-4 w-4 ml-1" />
              </div>
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (mode === 'quick') {
    return (
      <>
        <div className="max-w-2xl mx-auto px-6 pt-6">
          <button
            onClick={() => setMode('choice')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <ChevronLeft className="h-4 w-4" />
            Retour
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-orange-600/20 flex items-center justify-center">
              <Zap className="h-5 w-5 text-orange-400" />
            </div>
            <h1 className="text-3xl font-bold text-white">Création rapide</h1>
          </div>
          <p className="text-gray-400 mb-6 ml-[52px]">
            Décrivez votre commerce — l&apos;IA génère le site complet en 30 secondes.
          </p>
        </div>
        <QuickMode onGenerate={handleGenerate} />
      </>
    );
  }

  return (
    <>
      <div className="max-w-2xl mx-auto px-6 pt-6">
        <button
          onClick={() => setMode('choice')}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
        >
          <ChevronLeft className="h-4 w-4" />
          Retour
        </button>
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-xl bg-orange-600/20 flex items-center justify-center">
            <Layers className="h-5 w-5 text-orange-400" />
          </div>
          <h1 className="text-3xl font-bold text-white">Création complète</h1>
        </div>
        <p className="text-gray-400 mb-6 ml-[52px]">
          Formulaire guidé en 6 étapes pour personnaliser chaque détail.
        </p>
      </div>
      <CompleteMode onGenerate={handleGenerate} />
    </>
  );
}
