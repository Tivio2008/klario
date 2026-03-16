'use client';

import type { FooterContent } from '@/lib/types';

interface FooterBlockProps {
  content: FooterContent;
}

export function FooterBlock({ content }: FooterBlockProps) {
  return (
    <footer className="bg-[#060608] border-t border-[var(--border)] py-12 px-6">
      <div className="max-w-6xl mx-auto">
        {content.variant === 'full' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="text-xl font-bold gradient-text mb-2">{content.companyName}</h3>
              {content.tagline && <p className="text-gray-400 text-sm">{content.tagline}</p>}
            </div>
            {content.links && content.links.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">Links</h4>
                <ul className="flex flex-col gap-2">
                  {content.links.map((l, i) => (
                    <li key={i}>
                      <a href={l.href} className="text-gray-400 hover:text-white text-sm transition-colors">{l.label}</a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 mb-4">
            <h3 className="text-xl font-bold gradient-text">{content.companyName}</h3>
            {content.tagline && <p className="text-gray-400 text-sm">{content.tagline}</p>}
          </div>
        )}

        <div className="border-t border-[var(--border)] pt-6 text-center text-gray-500 text-sm">
          {content.copyright || `© ${new Date().getFullYear()} ${content.companyName}. All rights reserved.`}
        </div>
      </div>
    </footer>
  );
}
