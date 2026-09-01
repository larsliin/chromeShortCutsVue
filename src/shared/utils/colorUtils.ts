// Pure color utilities — no store dependency.

function parseColorToRgb(color: string): { r: number; g: number; b: number } | null {
    const hexMatch = color.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);

    if (hexMatch) {
        let hex = hexMatch[1];
        if (hex.length === 3) {
            hex = hex.split('').map((c) => c + c).join('');
        }
        return {
            r: parseInt(hex.slice(0, 2), 16),
            g: parseInt(hex.slice(2, 4), 16),
            b: parseInt(hex.slice(4, 6), 16),
        };
    }

    const rgbMatch = color.match(/rgba?\((\d+),?\s*(\d+),?\s*(\d+)/);

    if (rgbMatch) {
        return {
            r: parseInt(rgbMatch[1], 10),
            g: parseInt(rgbMatch[2], 10),
            b: parseInt(rgbMatch[3], 10),
        };
    }

    return null;
}

// Picks black or white, whichever reads better against the given background color.
// Accepts hex (#fff, #ffffff) or rgb()/rgba() strings. Falls back to black if unparsable.
export function getContrastColor(color: string): 'black' | 'white' {
    const rgb = parseColorToRgb(color);

    if (!rgb) {
        return 'black';
    }

    // YIQ perceived brightness — weights green highest, matching human sensitivity.
    const yiq = ((rgb.r * 299) + (rgb.g * 587) + (rgb.b * 114)) / 1000;

    return yiq >= 128 ? 'black' : 'white';
}
