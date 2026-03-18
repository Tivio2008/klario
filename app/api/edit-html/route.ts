import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export interface EditHtmlRequest {
  html: string;
  prompt: string;
}

export interface EditHtmlResponse {
  html: string;
}

export async function POST(req: NextRequest) {
  try {
    const { html, prompt }: EditHtmlRequest = await req.json();

    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('ANTHROPIC_API_KEY is not set');
      return NextResponse.json({
        error: 'API key not configured.'
      }, { status: 500 });
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    console.log('Editing HTML with prompt:', prompt);

    const systemPrompt = `You edit HTML websites based on user requests. Make ONLY the requested changes. Preserve all existing structure, styling, and content unless explicitly asked to change it. Return the complete modified HTML file.`;

    const userPrompt = `Current website HTML:
\`\`\`html
${html}
\`\`\`

User's requested change:
"${prompt}"

Return the complete modified HTML with the changes applied. Keep everything else exactly as it was. Return ONLY the HTML (no markdown, no explanation).`;

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 8000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    let modifiedHtml = message.content[0].type === 'text' ? message.content[0].text : '';

    // Auto-fix: Ensure HTML has closing tag
    if (!modifiedHtml.includes('</html>')) {
      console.warn('Modified HTML missing closing tag, adding it');
      modifiedHtml += '\n</body>\n</html>';
    }

    console.log('✓ HTML modifié, longueur:', modifiedHtml.length);

    return NextResponse.json({
      html: modifiedHtml.trim()
    } satisfies EditHtmlResponse);
  } catch (err) {
    console.error('=== EDIT HTML ERROR ===');
    console.error('Error type:', err instanceof Error ? err.constructor.name : typeof err);
    console.error('Error message:', err instanceof Error ? err.message : String(err));
    console.error('Error stack:', err instanceof Error ? err.stack : 'No stack trace');
    console.error('=======================');

    const errorMessage = err instanceof Error ? err.message : String(err);
    return NextResponse.json({
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? String(err) : undefined
    }, { status: 500 });
  }
}
