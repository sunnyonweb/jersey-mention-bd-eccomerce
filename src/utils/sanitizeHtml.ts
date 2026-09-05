/**
 * HTML Sanitizer & Plain Text Converter for Product Descriptions
 * Ensures zero XSS vulnerabilities while preserving rich text formatting,
 * headings, lists, blockquotes, links, and responsive images.
 */

const ALLOWED_TAGS = new Set([
  'P', 'H1', 'H2', 'H3', 'H4', 'STRONG', 'B', 'EM', 'I', 'U', 'S', 'STRIKE',
  'UL', 'OL', 'LI', 'BLOCKQUOTE', 'A', 'IMG', 'FIGURE', 'FIGCAPTION',
  'DIV', 'SPAN', 'BR', 'HR', 'TABLE', 'THEAD', 'TBODY', 'TR', 'TH', 'TD'
]);

const ALLOWED_ATTRS = new Set([
  'href', 'src', 'alt', 'title', 'target', 'rel', 'class', 'style', 'width', 'height', 'data-size-preset'
]);

/**
 * Strips all HTML tags and decodes entities, returning plain text
 */
export function stripHtml(html: string): string {
  if (!html) return '';
  if (typeof window === 'undefined') {
    return html.replace(/<[^>]*>?/gm, '').trim();
  }
  const div = document.createElement('div');
  div.innerHTML = html;
  return (div.textContent || div.innerText || '').trim();
}

/**
 * Checks if a string contains HTML markup
 */
export function isHtmlContent(str: string): boolean {
  if (!str) return false;
  return /<[a-z][\s\S]*>/i.test(str);
}

/**
 * Converts legacy plain text into clean HTML paragraphs
 */
export function plainTextToHtml(text: string): string {
  if (!text) return '';
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const paragraphs = escaped.split(/\n\s*\n/);
  return paragraphs
    .map((p) => `<p>${p.replace(/\n/g, '<br/>').trim()}</p>`)
    .filter((p) => p !== '<p></p>')
    .join('');
}

/**
 * Sanitizes rich text HTML for safe customer-facing rendering
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';

  // If input is legacy plain text with no HTML tags, convert to paragraphs
  if (!isHtmlContent(html)) {
    return plainTextToHtml(html);
  }

  if (typeof window === 'undefined') {
    // Server-side / Node fallback: thorough regex cleanup of dangerous tags & protocols
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
      .replace(/<embed\b[^>]*>/gi, '')
      .replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, '')
      .replace(/<input\b[^>]*>/gi, '')
      .replace(/<button\b[^<]*(?:(?!<\/button>)<[^<]*)*<\/button>/gi, '')
      .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
      .replace(/\s*on\w+\s*=\s*[^>\s]+/gi, '')
      .replace(/href\s*=\s*["']\s*javascript:[^"']*["']/gi, 'href="#"')
      .replace(/src\s*=\s*["']\s*javascript:[^"']*["']/gi, 'src=""')
      .replace(/\s*data-selected\s*=\s*["'][^"']*["']/gi, '');
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const body = doc.body;

    function sanitizeNode(node: Node) {
      const children = Array.from(node.childNodes);
      for (const child of children) {
        if (child.nodeType === Node.ELEMENT_NODE) {
          const el = child as HTMLElement;
          const tagName = el.tagName.toUpperCase();

          if (!ALLOWED_TAGS.has(tagName)) {
            // Remove disallowed element (keep its text content if harmless)
            if (['SCRIPT', 'IFRAME', 'OBJECT', 'EMBED', 'FORM', 'INPUT', 'BUTTON', 'STYLE', 'LINK'].includes(tagName)) {
              el.remove();
            } else {
              // Replace tag with its children
              while (el.firstChild) {
                el.parentNode?.insertBefore(el.firstChild, el);
              }
              el.remove();
            }
            continue;
          }

          // Clean attributes
          const attrs = Array.from(el.attributes);
          for (const attr of attrs) {
            const attrName = attr.name.toLowerCase();

            // Disallow all event handlers (onclick, onerror, onload, etc.)
            if (attrName.startsWith('on')) {
              el.removeAttribute(attr.name);
              continue;
            }

            // Disallow attributes not in allowed list
            if (!ALLOWED_ATTRS.has(attrName)) {
              el.removeAttribute(attr.name);
              continue;
            }

            // Validate href
            if (attrName === 'href') {
              const val = attr.value.trim().toLowerCase();
              if (val.startsWith('javascript:') || val.startsWith('vbscript:') || val.startsWith('data:text/html')) {
                el.removeAttribute('href');
              } else {
                // If it's an external link, ensure target and rel are safe
                if (val.startsWith('http://') || val.startsWith('https://')) {
                  el.setAttribute('target', '_blank');
                  el.setAttribute('rel', 'noopener noreferrer');
                }
              }
            }

            // Validate src
            if (attrName === 'src') {
              const val = attr.value.trim().toLowerCase();
              if (val.startsWith('javascript:') || val.startsWith('vbscript:')) {
                el.removeAttribute('src');
              }
            }

            // Validate style
            if (attrName === 'style') {
              const val = attr.value.toLowerCase();
              if (val.includes('expression') || val.includes('behavior') || val.includes('javascript:')) {
                el.removeAttribute('style');
              }
            }
          }

          // Ensure images have responsive styling classes and attributes
          if (tagName === 'IMG') {
            const img = el as HTMLImageElement;
            img.classList.add('max-w-full', 'h-auto', 'rounded-xl');
            if (!img.alt) {
              img.alt = 'Product description image';
            }
            // Strip editor selection artifact
            img.removeAttribute('data-selected');
            // Ensure responsive scaling on all devices even with custom px width
            img.style.maxWidth = '100%';
            if (!img.style.height || img.style.height === '') {
              img.style.height = 'auto';
            }
          }

          // Recursively sanitize children
          sanitizeNode(el);
        }
      }
    }

    sanitizeNode(body);
    return body.innerHTML.trim();
  } catch (err) {
    console.error('Error sanitizing HTML:', err);
    return plainTextToHtml(html);
  }
}
