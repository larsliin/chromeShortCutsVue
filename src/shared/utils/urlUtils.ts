// Pure URL and image utilities — no store dependency.

export function getDomainFromUrl(url: string): string | null {
    const regex = /(?<=:\/\/)([^/]+)/;
    const domain = url.match(regex);
    return domain ? domain[0] : null;
}

export function isValidURL(str: string): boolean {
    const urlRegex = /(https?:\/\/(www\.)?[a-zA-Z0-9@:%._+~#=])/;
    return urlRegex.test(str);
}

export async function getBase64ImageFromUrl(url: string): Promise<string> {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Image download failed. Response status: ${response.status}`);
        }

        const blob = await response.blob();

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                resolve(reader.result as string);
            };
            reader.onerror = () => {
                reject(new Error('Failed to read the image file.'));
            };
            reader.readAsDataURL(blob);
        });
    } catch {
        return 'error';
    }
}
