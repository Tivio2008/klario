import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import type { SiteBlock, SiteTheme } from '@/lib/types';

export interface EditSiteRequest {
  blocks: SiteBlock[];
  theme: SiteTheme;
  prompt: string;
}

export interface EditSiteResponse {
  blocks: SiteBlock[];
  theme: SiteTheme;
}

export async function POST(req: NextRequest) {
  try {
    const { blocks, theme, prompt }: EditSiteRequest = await req.json();

    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('ANTHROPIC_API_KEY is not set');
      return NextResponse.json({
        error: 'API key not configured. Please set ANTHROPIC_API_KEY in Vercel environment variables.'
      }, { status: 500 });
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const systemPrompt = `You are editing a website for a local business. The user will describe changes they want in natural language, and you will update the relevant blocks to fulfill their request.

RULES:
- Make ONLY the changes requested — don't rewrite everything
- Preserve the structure and order of blocks unless explicitly asked to change it
- When changing colors, use deep warm tones (no purple, no neon)
- When changing text, write in a natural conversational tone
- Return the FULL blocks array and theme object, even if only one block changed`;

    const userPrompt = `Current site blocks:
\`\`\`json
${JSON.stringify(blocks, null, 2)}
\`\`\`

Current theme:
\`\`\`json
${JSON.stringify(theme, null, 2)}
\`\`\`

User's requested change:
"${prompt}"

Return a JSON object with the updated blocks and theme:
{
  "blocks": [...],  // full updated array
  "theme": {...}    // updated theme object
}`;

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const raw = message.content[0].type === 'text' ? message.content[0].text : '';
    const jsonStr = raw.replace(/^```(?:json)?\s*/m, '').replace(/\s*```$/m, '').trim();
    const result = JSON.parse(jsonStr);

    return NextResponse.json({
      blocks: result.blocks,
      theme: result.theme,
    } satisfies EditSiteResponse);
  } catch (err) {
    console.error('=== EDIT ERROR ===');
    console.error('API Key exists:', !!process.env.ANTHROPIC_API_KEY);
    console.error('Error type:', err instanceof Error ? err.constructor.name : typeof err);
    console.error('Error message:', err instanceof Error ? err.message : String(err));
    console.error('Error stack:', err instanceof Error ? err.stack : 'No stack trace');
    console.error('Full error object:', JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
    console.error('==================');

    const errorMessage = err instanceof Error ? err.message : String(err);
    return NextResponse.json({
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? String(err) : undefined
    }, { status: 500 });
  }
}
