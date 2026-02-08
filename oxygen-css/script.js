// --- State ---
const state = {
    vibe: 'professional',
    brandColor: '#6366f1',
    secondaryColor: null,
    headingFont: '',
    bodyFont: '',
    typeScale: 1.2,
    colorSteps: 9,
    spacingBase: 1,
    borderRadius: 0.5,
    contentPaddingBlock: 1.5,
    contentMarginBlock: 2,
    headingMarginTop: 2.5,
    headingMarginBottom: 0.75,
    paragraphMarginBottom: 1.25,
    colors: [],
    secondaryColors: [],
    css: ''
};

// --- Google Fonts List (popular subset) ---
const googleFontsList = [
    'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins',
    'Raleway', 'Nunito', 'Playfair Display', 'Merriweather', 'Source Sans 3',
    'PT Sans', 'Oswald', 'Noto Sans', 'Ubuntu', 'Rubik', 'Work Sans',
    'Fira Sans', 'Barlow', 'Mulish', 'Quicksand', 'Cabin', 'DM Sans',
    'Karla', 'Libre Baskerville', 'Lora', 'Bitter', 'Josefin Sans',
    'Crimson Text', 'Archivo', 'Manrope', 'Space Grotesk', 'Sora',
    'Plus Jakarta Sans', 'Outfit', 'Lexend', 'Figtree', 'Geist',
    'IBM Plex Sans', 'IBM Plex Serif', 'IBM Plex Mono',
    'Source Serif 4', 'Cormorant Garamond', 'EB Garamond',
    'Bebas Neue', 'Anton', 'Archivo Black', 'Righteous'
];

// --- Vibe Configurations ---
const vibes = {
    professional: {
        scale: 1.2,
        steps: 9,
        radius: 0.375,
        spacing: 1,
        headingFont: 'Inter',
        bodyFont: 'Inter',
        insight: 'Professional vibes use a traditional Major Third scale (1.2) for clear hierarchy and a full 9-step color spectrum for subtle UI states.'
    },
    minimal: {
        scale: 1.125,
        steps: 5,
        radius: 0.25,
        spacing: 0.875,
        headingFont: 'DM Sans',
        bodyFont: 'DM Sans',
        insight: 'Minimal designs thrive on subtle size differences (Major Second - 1.125) and a condensed 5-step color palette to reduce visual noise.'
    },
    playful: {
        scale: 1.25,
        steps: 7,
        radius: 1,
        spacing: 1.25,
        headingFont: 'Poppins',
        bodyFont: 'Quicksand',
        insight: 'Playful designs use a bold Perfect Fourth scale (1.25) and a vibrant 7-step spectrum for high energy.'
    },
    brutalist: {
        scale: 1.414,
        steps: 9,
        radius: 0,
        spacing: 1.5,
        headingFont: 'Bebas Neue',
        bodyFont: 'Space Grotesk',
        insight: 'Brutalist vibes demand extreme contrast with an Augmented Fourth scale (1.414) and raw, full-spectrum color scales.'
    }
};

// --- Font Metrics for AI Spacing ---
const fontMetrics = {
    'Inter':              { xRatio: 0.53, category: 'sans' },
    'Roboto':             { xRatio: 0.53, category: 'sans' },
    'Open Sans':          { xRatio: 0.54, category: 'sans' },
    'Lato':               { xRatio: 0.52, category: 'sans' },
    'Montserrat':         { xRatio: 0.53, category: 'sans' },
    'Poppins':            { xRatio: 0.54, category: 'sans' },
    'Raleway':            { xRatio: 0.49, category: 'sans' },
    'Nunito':             { xRatio: 0.54, category: 'sans' },
    'Playfair Display':   { xRatio: 0.47, category: 'serif' },
    'Merriweather':       { xRatio: 0.50, category: 'serif' },
    'Source Sans 3':      { xRatio: 0.52, category: 'sans' },
    'PT Sans':            { xRatio: 0.51, category: 'sans' },
    'Oswald':             { xRatio: 0.45, category: 'sans' },
    'Noto Sans':          { xRatio: 0.54, category: 'sans' },
    'Ubuntu':             { xRatio: 0.52, category: 'sans' },
    'Rubik':              { xRatio: 0.54, category: 'sans' },
    'Work Sans':          { xRatio: 0.52, category: 'sans' },
    'Fira Sans':          { xRatio: 0.52, category: 'sans' },
    'Barlow':             { xRatio: 0.51, category: 'sans' },
    'Mulish':             { xRatio: 0.53, category: 'sans' },
    'Quicksand':          { xRatio: 0.55, category: 'sans' },
    'Cabin':              { xRatio: 0.52, category: 'sans' },
    'DM Sans':            { xRatio: 0.54, category: 'sans' },
    'Karla':              { xRatio: 0.52, category: 'sans' },
    'Libre Baskerville':  { xRatio: 0.48, category: 'serif' },
    'Lora':               { xRatio: 0.49, category: 'serif' },
    'Bitter':             { xRatio: 0.51, category: 'serif' },
    'Josefin Sans':       { xRatio: 0.46, category: 'sans' },
    'Crimson Text':       { xRatio: 0.46, category: 'serif' },
    'Archivo':            { xRatio: 0.54, category: 'sans' },
    'Manrope':            { xRatio: 0.53, category: 'sans' },
    'Space Grotesk':      { xRatio: 0.52, category: 'sans' },
    'Sora':               { xRatio: 0.53, category: 'sans' },
    'Plus Jakarta Sans':  { xRatio: 0.53, category: 'sans' },
    'Outfit':             { xRatio: 0.53, category: 'sans' },
    'Lexend':             { xRatio: 0.55, category: 'sans' },
    'Figtree':            { xRatio: 0.53, category: 'sans' },
    'Geist':              { xRatio: 0.53, category: 'sans' },
    'IBM Plex Sans':      { xRatio: 0.52, category: 'sans' },
    'IBM Plex Serif':     { xRatio: 0.49, category: 'serif' },
    'IBM Plex Mono':      { xRatio: 0.55, category: 'mono' },
    'Source Serif 4':     { xRatio: 0.48, category: 'serif' },
    'Cormorant Garamond': { xRatio: 0.42, category: 'serif' },
    'EB Garamond':        { xRatio: 0.44, category: 'serif' },
    'Bebas Neue':         { xRatio: 0.43, category: 'display' },
    'Anton':              { xRatio: 0.46, category: 'display' },
    'Archivo Black':      { xRatio: 0.55, category: 'display' },
    'Righteous':          { xRatio: 0.50, category: 'display' }
};

function calculateContentSpacing(bodyFontName, headingFontName, scale) {
    const bodyM = fontMetrics[bodyFontName] || { xRatio: 0.52, category: 'sans' };
    const headM = fontMetrics[headingFontName] || { xRatio: 0.52, category: 'sans' };

    // Wider x-height fonts need more vertical breathing room
    const bodySpacingFactor = bodyM.xRatio / 0.52;
    // Serif body text benefits from more paragraph spacing
    const serifBonus = bodyM.category === 'serif' ? 1.1 : 1.0;
    // Larger scale ratios need more heading separation
    const scaleFactor = scale / 1.2;

    return {
        contentPaddingBlock:   +(1.5 * bodySpacingFactor * serifBonus).toFixed(3),
        contentMarginBlock:    +(2.0 * bodySpacingFactor * serifBonus * scaleFactor).toFixed(3),
        headingMarginTop:      +(2.5 * scaleFactor).toFixed(3),
        headingMarginBottom:   +(0.75 * bodySpacingFactor).toFixed(3),
        paragraphMarginBottom: +(1.25 * bodySpacingFactor * serifBonus).toFixed(3)
    };
}

// --- Populate Font Dropdowns ---
function populateFontDropdowns() {
    const headingSel = document.getElementById('heading-font');
    const bodySel = document.getElementById('body-font');
    googleFontsList.forEach(font => {
        headingSel.appendChild(new Option(font, font));
        bodySel.appendChild(new Option(font, font));
    });
}

// --- API Key (localStorage) ---
function getApiKey() {
    return localStorage.getItem('oxy_css_api_key') || '';
}

function saveApiKey(key) {
    localStorage.setItem('oxy_css_api_key', key);
}

// --- Color Math ---
function calculateTypeScale(base, ratio) {
    const scales = {};
    for (let i = -2; i <= 6; i++) {
        scales[i] = (base * Math.pow(ratio, i)).toFixed(3) + 'rem';
    }
    return scales;
}

function generateColorScale(hex, steps) {
    const hsl = hexToHsl(hex);
    const scale = [];
    const stepSize = 80 / (steps - 1);
    for (let i = 0; i < steps; i++) {
        const lightness = 95 - (i * stepSize);
        scale.push(`hsl(${hsl.h}, ${hsl.s}%, ${lightness}%)`);
    }
    return scale;
}

function hexToHsl(hex) {
    let r = parseInt(hex.slice(1, 3), 16) / 255;
    let g = parseInt(hex.slice(3, 5), 16) / 255;
    let b = parseInt(hex.slice(5, 7), 16) / 255;
    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) {
        h = s = 0;
    } else {
        let d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function getContrastColor(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#000000' : '#ffffff';
}

function getContrastRatio(hex1, hex2) {
    const getLuminance = (hex) => {
        const rgb = hexToRgb(hex);
        const a = [rgb.r, rgb.g, rgb.b].map(v => {
            v /= 255;
            return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        });
        return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
    };
    const l1 = getLuminance(hex1);
    const l2 = getLuminance(hex2);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function rgbToHex(rgb) {
    if (rgb.startsWith('#')) return rgb;
    const vals = rgb.match(/\d+/g);
    return "#" + vals.map(x => {
        const hex = parseInt(x).toString(16);
        return hex.length === 1 ? "0" + hex : hex;
    }).slice(0, 3).join("");
}

// --- AI Proposal for Missing Parameters ---
function aiProposeMissing() {
    const config = vibes[state.vibe];
    let proposals = [];

    if (!state.headingFont) {
        state.headingFont = config.headingFont;
        document.getElementById('heading-font').value = config.headingFont;
        proposals.push(`Heading font → ${config.headingFont}`);
    }
    if (!state.bodyFont) {
        state.bodyFont = config.bodyFont;
        document.getElementById('body-font').value = config.bodyFont;
        proposals.push(`Body font → ${config.bodyFont}`);
    }

    if (proposals.length > 0) {
        const insightEl = document.getElementById('ai-insight-text');
        insightEl.innerText = `AI filled missing parameters:\n• ${proposals.join('\n• ')}\n\nBased on your "${state.vibe}" vibe.`;
    } else {
        document.getElementById('ai-insight-text').innerText = 'All parameters are set. No changes needed.';
    }

    updatePreview();
}

// --- AI Proposal via OpenAI API ---
async function aiProposeMissingWithAPI() {
    const apiKey = getApiKey();
    if (!apiKey) {
        document.getElementById('ai-insight-text').innerText = 'No API key found. Using built-in AI logic instead.';
        aiProposeMissing();
        return;
    }

    const missing = [];
    if (!state.headingFont) missing.push('heading font');
    if (!state.bodyFont) missing.push('body font');
    if (!state.secondaryColor) missing.push('secondary accent color (hex)');

    if (missing.length === 0) {
        document.getElementById('ai-insight-text').innerText = 'All parameters are set. No AI suggestions needed.';
        updatePreview();
        return;
    }

    document.getElementById('ai-insight-text').innerText = 'Asking AI for suggestions...';

    const prompt = `You are a design system expert. Given:
- Design vibe: ${state.vibe}
- Primary brand color: ${state.brandColor}
- Current heading font: ${state.headingFont || 'not set'}
- Current body font: ${state.bodyFont || 'not set'}

Suggest the best values for these missing parameters: ${missing.join(', ')}.
Only use Google Fonts. Reply ONLY in this exact JSON format, no extra text:
{"headingFont":"FontName","bodyFont":"FontName","secondaryColor":"#hexval"}
Only include keys for missing values.`;

    try {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 150,
                temperature: 0.7
            })
        });

        if (!res.ok) {
            throw new Error(`API error: ${res.status}`);
        }

        const data = await res.json();
        const content = data.choices[0].message.content.trim();
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('Invalid AI response format');

        const suggestions = JSON.parse(jsonMatch[0]);
        let applied = [];

        if (suggestions.headingFont && !state.headingFont) {
            state.headingFont = suggestions.headingFont;
            document.getElementById('heading-font').value = suggestions.headingFont;
            applied.push(`Heading font → ${suggestions.headingFont}`);
        }
        if (suggestions.bodyFont && !state.bodyFont) {
            state.bodyFont = suggestions.bodyFont;
            document.getElementById('body-font').value = suggestions.bodyFont;
            applied.push(`Body font → ${suggestions.bodyFont}`);
        }
        if (suggestions.secondaryColor && !state.secondaryColor) {
            state.secondaryColor = suggestions.secondaryColor;
            document.getElementById('secondary-color').value = suggestions.secondaryColor;
            document.getElementById('secondary-color-hex').value = suggestions.secondaryColor;
            document.getElementById('secondary-color-section').classList.remove('hidden');
            document.getElementById('add-secondary-btn').classList.add('hidden');
            document.getElementById('secondary-spectrum-section').classList.remove('hidden');
            applied.push(`Secondary color → ${suggestions.secondaryColor}`);
        }

        document.getElementById('ai-insight-text').innerText =
            `AI suggestions applied:\n• ${applied.join('\n• ')}\n\nPowered by OpenAI.`;
        updatePreview();

    } catch (err) {
        console.error('AI API error:', err);
        document.getElementById('ai-insight-text').innerText =
            `API call failed: ${err.message}\nFalling back to built-in AI logic.`;
        aiProposeMissing();
    }
}

// --- Render Color Swatches ---
function renderSwatches(containerId, colors) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    colors.forEach((color, i) => {
        const div = document.createElement('div');
        div.className = 'color-swatch';
        const hex = rgbToHex(color);
        div.style.backgroundColor = color;
        div.style.color = getContrastColor(hex);
        div.innerText = i * 100 + 100;
        container.appendChild(div);
    });
}

// --- Update Preview ---
function updatePreview() {
    const root = document.documentElement;
    const config = vibes[state.vibe];
    const typeScales = calculateTypeScale(1, config.scale);
    const colors = generateColorScale(state.brandColor, config.steps);

    state.colors = colors;
    state.borderRadius = config.radius;
    state.spacingBase = config.spacing;

    // Resolve fonts (use AI defaults if empty)
    const headingFont = state.headingFont || config.headingFont;
    const bodyFont = state.bodyFont || config.bodyFont;

    // AI-driven content spacing based on font metrics
    const spacing = calculateContentSpacing(bodyFont, headingFont, config.scale);
    state.contentPaddingBlock = spacing.contentPaddingBlock;
    state.contentMarginBlock = spacing.contentMarginBlock;
    state.headingMarginTop = spacing.headingMarginTop;
    state.headingMarginBottom = spacing.headingMarginBottom;
    state.paragraphMarginBottom = spacing.paragraphMarginBottom;

    root.style.setProperty('--font-heading', `'${headingFont}', sans-serif`);
    root.style.setProperty('--font-body', `'${bodyFont}', sans-serif`);
    root.style.setProperty('--color-brand', state.brandColor);

    const contrastColor = getContrastColor(state.brandColor);
    root.style.setProperty('--color-brand-contrast', contrastColor);
    root.style.setProperty('--radius-base', `${state.borderRadius}rem`);
    root.style.setProperty('--spacing-base', `${state.spacingBase}rem`);
    root.style.setProperty('--content-padding-block', `${spacing.contentPaddingBlock}rem`);
    root.style.setProperty('--content-margin-block', `${spacing.contentMarginBlock}rem`);
    root.style.setProperty('--heading-margin-top', `${spacing.headingMarginTop}rem`);
    root.style.setProperty('--heading-margin-bottom', `${spacing.headingMarginBottom}rem`);
    root.style.setProperty('--paragraph-margin-bottom', `${spacing.paragraphMarginBottom}rem`);

    // Accessibility
    const ratio = getContrastRatio(state.brandColor, contrastColor);
    const passAAA = ratio >= 7;
    const passAA = ratio >= 4.5;

    // Type Scale
    Object.keys(typeScales).forEach(step => {
        root.style.setProperty(`--step-${step}`, typeScales[step]);
    });

    // Semantic Mapping
    root.style.setProperty('--color-bg-offset', colors[0]);
    root.style.setProperty('--color-border', colors[1]);
    root.style.setProperty('--color-text-base', '#475569');
    root.style.setProperty('--color-text-bold', '#0f172a');

    // Secondary color
    let secondaryColors = [];
    if (state.secondaryColor) {
        secondaryColors = generateColorScale(state.secondaryColor, config.steps);
        state.secondaryColors = secondaryColors;
        root.style.setProperty('--color-secondary', state.secondaryColor);
        root.style.setProperty('--color-secondary-contrast', getContrastColor(state.secondaryColor));
        renderSwatches('secondary-spectrum-preview', secondaryColors);
        document.getElementById('secondary-spectrum-section').classList.remove('hidden');
    } else {
        state.secondaryColors = [];
        document.getElementById('secondary-spectrum-section').classList.add('hidden');
    }

    // AI Insights
    const missingNotes = [];
    if (!state.headingFont) missingNotes.push(`Heading font: using AI default "${config.headingFont}"`);
    if (!state.bodyFont) missingNotes.push(`Body font: using AI default "${config.bodyFont}"`);
    const missingText = missingNotes.length > 0 ? `\n\nAI defaults active:\n• ${missingNotes.join('\n• ')}` : '';
    const accessibilityNote = `\n\nContrast: ${ratio.toFixed(2)}:1 (${passAA ? 'AA pass' : 'AA fail'} / ${passAAA ? 'AAA pass' : 'AAA fail'})`;
    const spacingNote = `\n\nAI Spacing: heading-gap ${spacing.headingMarginTop}rem, para-gap ${spacing.paragraphMarginBottom}rem, content-pad ${spacing.contentPaddingBlock}rem`;
    document.getElementById('ai-insight-text').innerText = config.insight + accessibilityNote + spacingNote + missingText;

    // Primary swatches
    renderSwatches('color-spectrum-preview', colors);

    // Google Fonts
    const fontLink = document.getElementById('google-fonts');
    const fontsToLoad = [...new Set([headingFont, bodyFont])].map(f => f.replace(/\s+/g, '+')).join('&family=');
    fontLink.href = `https://fonts.googleapis.com/css2?family=${fontsToLoad}:wght@400;500;600;700;800&display=swap`;

    generateCSS(typeScales, colors, secondaryColors, headingFont, bodyFont);
}

// --- Generate CSS ---
function generateCSS(scales, colors, secondaryColors, headingFont, bodyFont) {
    let css = `:root {\n  /* Typography Scale */\n`;
    Object.keys(scales).forEach(step => {
        css += `  --step-${step}: ${scales[step]};\n`;
    });

    css += `\n  /* Fonts */\n`;
    css += `  --font-heading: '${headingFont}', sans-serif;\n`;
    css += `  --font-body: '${bodyFont}', sans-serif;\n`;

    css += `\n  /* Spacing & Borders */\n`;
    css += `  --spacing-base: ${state.spacingBase}rem;\n`;
    css += `  --radius-base: ${state.borderRadius}rem;\n`;

    css += `\n  /* Content Spacing (AI-optimized for legibility) */\n`;
    css += `  --content-padding-block: ${state.contentPaddingBlock}rem;\n`;
    css += `  --content-margin-block: ${state.contentMarginBlock}rem;\n`;
    css += `  --heading-margin-top: ${state.headingMarginTop}rem;\n`;
    css += `  --heading-margin-bottom: ${state.headingMarginBottom}rem;\n`;
    css += `  --paragraph-margin-bottom: ${state.paragraphMarginBottom}rem;\n`;

    css += `\n  /* Primary Color Palette */\n`;
    colors.forEach((color, i) => {
        css += `  --color-primary-${i * 100 + 100}: ${color};\n`;
    });

    if (secondaryColors.length > 0) {
        css += `\n  /* Secondary Color Palette */\n`;
        secondaryColors.forEach((color, i) => {
            css += `  --color-secondary-${i * 100 + 100}: ${color};\n`;
        });
    }

    css += `\n  /* Semantic Tokens */\n`;
    css += `  --color-brand: ${state.brandColor};\n`;
    css += `  --color-brand-contrast: ${getContrastColor(state.brandColor)};\n`;
    if (state.secondaryColor) {
        css += `  --color-secondary: ${state.secondaryColor};\n`;
        css += `  --color-secondary-contrast: ${getContrastColor(state.secondaryColor)};\n`;
    }
    css += `  --bg-offset: var(--color-primary-100);\n`;
    css += `  --border-light: var(--color-primary-200);\n`;
    css += `  --text-base: #475569;\n`;
    css += `  --text-bold: #0f172a;\n`;
    css += `}\n\n`;

    css += `/* ========================================\n`;
    css += `   Oxygen Utility Classes\n`;
    css += `   ======================================== */\n\n`;

    css += `/* Typography */\n`;
    css += `.text-h1 { font-size: var(--step-5); font-family: var(--font-heading); font-weight: 800; line-height: 1.1; }\n`;
    css += `.text-h2 { font-size: var(--step-4); font-family: var(--font-heading); font-weight: 700; line-height: 1.2; }\n`;
    css += `.text-h3 { font-size: var(--step-3); font-family: var(--font-heading); font-weight: 600; line-height: 1.3; }\n`;
    css += `.text-h4 { font-size: var(--step-2); font-family: var(--font-heading); font-weight: 600; line-height: 1.35; }\n`;
    css += `.text-h5 { font-size: var(--step-1); font-family: var(--font-heading); font-weight: 600; line-height: 1.4; }\n`;
    css += `.text-h6 { font-size: var(--step-0); font-family: var(--font-heading); font-weight: 600; line-height: 1.4; text-transform: uppercase; letter-spacing: 0.05em; }\n`;
    css += `.text-p  { font-size: var(--step-0); font-family: var(--font-body); line-height: 1.7; }\n`;
    css += `.text-sm { font-size: var(--step--1); font-family: var(--font-body); line-height: 1.5; }\n`;

    css += `\n/* Lists */\n`;
    css += `ol.styled, ul.styled { font-family: var(--font-body); font-size: var(--step-0); line-height: 1.7; padding-left: 1.5rem; }\n`;
    css += `ol.styled { list-style-type: decimal; }\n`;
    css += `ul.styled { list-style-type: disc; }\n`;
    css += `ol.styled li, ul.styled li { margin-bottom: 0.35rem; }\n`;

    css += `\n/* Buttons */\n`;
    css += `.btn { display: inline-flex; align-items: center; justify-content: center; padding: 0.625rem 1.5rem; font-size: var(--step-0); font-weight: 600; font-family: var(--font-body); border-radius: var(--radius-base); border: 2px solid transparent; cursor: pointer; transition: all 0.15s ease; }\n`;
    css += `.btn-primary { background-color: var(--color-brand); color: var(--color-brand-contrast); }\n`;
    css += `.btn-secondary { background-color: var(--bg-offset); color: var(--text-bold); border-color: var(--border-light); }\n`;
    css += `.btn-outline { background-color: transparent; color: var(--color-brand); border-color: var(--color-brand); }\n`;
    css += `.btn-ghost { background-color: transparent; color: var(--color-brand); }\n`;
    css += `.btn-sm { padding: 0.375rem 1rem; font-size: var(--step--1); }\n`;
    css += `.btn-lg { padding: 0.875rem 2rem; font-size: var(--step-1); }\n`;

    css += `\n/* Navigation */\n`;
    css += `.nav { display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1.25rem; background-color: var(--bg-offset); border: 1px solid var(--border-light); border-radius: var(--radius-base); font-family: var(--font-body); }\n`;
    css += `.nav-brand { font-family: var(--font-heading); font-weight: 700; font-size: var(--step-1); color: var(--text-bold); text-decoration: none; }\n`;
    css += `.nav-link { font-size: var(--step--1); color: var(--text-base); text-decoration: none; font-weight: 500; }\n`;
    css += `.nav-cta { background-color: var(--color-brand); color: var(--color-brand-contrast); padding: 0.375rem 1rem; border-radius: var(--radius-base); font-weight: 600; text-decoration: none; }\n`;

    css += `\n/* Cards */\n`;
    css += `.card { background-color: var(--bg-offset); border: 1px solid var(--border-light); border-radius: var(--radius-base); padding: 1.5rem; }\n`;

    css += `\n/* Colors */\n`;
    css += `.bg-brand { background-color: var(--color-brand); color: var(--color-brand-contrast); }\n`;
    css += `.text-brand { color: var(--color-brand); }\n`;
    css += `.border-brand { border-color: var(--color-brand); }\n`;
    if (state.secondaryColor) {
        css += `.bg-secondary { background-color: var(--color-secondary); color: var(--color-secondary-contrast); }\n`;
        css += `.text-secondary { color: var(--color-secondary); }\n`;
        css += `.border-secondary { border-color: var(--color-secondary); }\n`;
    }

    css += `\n/* Spacing & Layout */\n`;
    css += `.p-base { padding: var(--spacing-base); }\n`;
    css += `.m-base { margin: var(--spacing-base); }\n`;
    css += `.rounded-base { border-radius: var(--radius-base); }\n`;
    css += `.gap-base { gap: var(--spacing-base); }\n`;

    state.css = css;
    document.getElementById('css-output').textContent = css;
}

// =============================================
// Event Listeners
// =============================================

// --- Settings Modal ---
document.getElementById('open-settings').addEventListener('click', () => {
    const modal = document.getElementById('settings-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.getElementById('api-key-input').value = getApiKey();
});

document.getElementById('close-settings').addEventListener('click', () => {
    const modal = document.getElementById('settings-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
});

document.getElementById('save-api-key').addEventListener('click', () => {
    const key = document.getElementById('api-key-input').value.trim();
    saveApiKey(key);
    const modal = document.getElementById('settings-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    document.getElementById('ai-insight-text').innerText = key ? 'API key saved. AI suggestions will use OpenAI.' : 'API key removed. Using built-in AI logic.';
});

// --- Vibe ---
document.getElementById('vibe-selector').addEventListener('change', (e) => {
    state.vibe = e.target.value;
    updatePreview();
});

// --- Brand Color ---
document.getElementById('brand-color').addEventListener('input', (e) => {
    state.brandColor = e.target.value;
    document.getElementById('brand-color-hex').value = e.target.value;
    updatePreview();
});

document.getElementById('brand-color-hex').addEventListener('input', (e) => {
    if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
        state.brandColor = e.target.value;
        document.getElementById('brand-color').value = e.target.value;
        updatePreview();
    }
});

// --- Secondary Color ---
document.getElementById('add-secondary-btn').addEventListener('click', () => {
    state.secondaryColor = document.getElementById('secondary-color').value;
    document.getElementById('secondary-color-section').classList.remove('hidden');
    document.getElementById('add-secondary-btn').classList.add('hidden');
    updatePreview();
});

document.getElementById('remove-secondary').addEventListener('click', () => {
    state.secondaryColor = null;
    document.getElementById('secondary-color-section').classList.add('hidden');
    document.getElementById('add-secondary-btn').classList.remove('hidden');
    updatePreview();
});

document.getElementById('secondary-color').addEventListener('input', (e) => {
    state.secondaryColor = e.target.value;
    document.getElementById('secondary-color-hex').value = e.target.value;
    updatePreview();
});

document.getElementById('secondary-color-hex').addEventListener('input', (e) => {
    if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
        state.secondaryColor = e.target.value;
        document.getElementById('secondary-color').value = e.target.value;
        updatePreview();
    }
});

// --- Font Selects ---
document.getElementById('heading-font').addEventListener('change', (e) => {
    state.headingFont = e.target.value;
    updatePreview();
});

document.getElementById('body-font').addEventListener('change', (e) => {
    state.bodyFont = e.target.value;
    updatePreview();
});

// --- Generate ---
document.getElementById('generate-btn').addEventListener('click', () => {
    updatePreview();
});

// --- AI Suggest ---
document.getElementById('ai-suggest-btn').addEventListener('click', () => {
    aiProposeMissingWithAPI();
});

// --- Tab Switching ---
function switchTab(activeTabId) {
    const tabs = document.querySelectorAll('.preview-tab');
    const panels = document.querySelectorAll('.preview-panel');
    tabs.forEach(t => t.classList.remove('active'));
    panels.forEach(p => p.classList.add('hidden'));
    document.getElementById(activeTabId).classList.add('active');
    const panelId = 'panel-' + activeTabId.replace('tab-', '');
    document.getElementById(panelId).classList.remove('hidden');
}

document.getElementById('tab-components').addEventListener('click', () => switchTab('tab-components'));
document.getElementById('tab-page').addEventListener('click', () => switchTab('tab-page'));
document.getElementById('tab-css').addEventListener('click', () => switchTab('tab-css'));
document.getElementById('tab-integration').addEventListener('click', () => {
    switchTab('tab-integration');
    updateGoogleFontsSnippet();
});

// --- Copy / Download ---
document.getElementById('copy-css').addEventListener('click', () => {
    navigator.clipboard.writeText(state.css);
    const btn = document.getElementById('copy-css');
    btn.innerText = 'Copied!';
    setTimeout(() => btn.innerText = 'Copy', 2000);
});

document.getElementById('download-css').addEventListener('click', () => {
    const blob = new Blob([state.css], { type: 'text/css' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'oxygen-design-system.css';
    a.click();
});

// --- Oxygen Integration Helpers ---
function getGoogleFontsLinkTag() {
    const config = vibes[state.vibe];
    const headingFont = state.headingFont || config.headingFont;
    const bodyFont = state.bodyFont || config.bodyFont;
    const fonts = [...new Set([headingFont, bodyFont])].map(f => f.replace(/\s+/g, '+')).join('&family=');
    return `<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link href="https://fonts.googleapis.com/css2?family=${fonts}:wght@400;500;600;700;800&display=swap" rel="stylesheet">`;
}

function getOxygenHeader() {
    return `/* ==============================================\n   Oxygen Design System — Generated by Oxygen CSS Gen\n   ============================================== */\n\n`;
}

function updateGoogleFontsSnippet() {
    const snippet = document.getElementById('google-fonts-snippet');
    if (snippet) snippet.textContent = getGoogleFontsLinkTag();
}

function flashButton(btn, text, duration) {
    const original = btn.innerText;
    btn.innerText = text;
    setTimeout(() => btn.innerText = original, duration || 2000);
}

// Copy for Oxygen Stylesheet (just the CSS, with a header comment)
document.getElementById('copy-for-oxygen-stylesheet').addEventListener('click', () => {
    navigator.clipboard.writeText(getOxygenHeader() + state.css);
    flashButton(document.getElementById('copy-for-oxygen-stylesheet'), 'Copied!');
});

// Copy for Oxygen Code Block (same CSS — Code Block CSS tab doesn't need <style> tags)
document.getElementById('copy-for-oxygen-codeblock').addEventListener('click', () => {
    navigator.clipboard.writeText(getOxygenHeader() + state.css);
    flashButton(document.getElementById('copy-for-oxygen-codeblock'), 'Copied!');
});

// Copy Google Fonts link tags
document.getElementById('copy-google-fonts').addEventListener('click', () => {
    navigator.clipboard.writeText(getGoogleFontsLinkTag());
    flashButton(document.getElementById('copy-google-fonts'), 'Copied!');
});

// =============================================
// Init
// =============================================
populateFontDropdowns();
updatePreview();
