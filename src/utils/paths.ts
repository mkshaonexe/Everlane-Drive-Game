/**
 * Resolves a static asset path by prepending the Vite BASE_URL.
 * This is crucial for environments like GitHub Pages where the app is hosted under a subpath.
 */
export function getAssetPath(path: string): string {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    
    const base = import.meta.env.BASE_URL || '/';
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    const cleanBase = base.endsWith('/') ? base : `${base}/`;
    
    return `${cleanBase}${cleanPath}`;
}
