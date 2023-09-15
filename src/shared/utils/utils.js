// eslint-disable-next-line import/prefer-default-export
export function useUtils() {
    function getDomainFromUrl(url) {
        const regex = /(?<=:\/\/)([^/]+)/;
        const domain = url.match(regex);
        if (domain) {
            return domain[0];
        }
        return null;
    }

    function isValidURL(str) {
        // eslint-disable-next-line max-len, no-useless-escape
        const expression = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)?/gi;
        const regex = new RegExp(expression);

        return !!str.match(regex);
    }

    async function getBase64ImageFromUrl(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Image download failed. Response status: ${response.status}`);
            }

            const blob = await response.blob();

            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64data = reader.result;
                    resolve(base64data);
                };
                reader.onerror = () => {
                    reject(new Error('Failed to read the image file.'));
                };
                reader.readAsDataURL(blob);
            });
        } catch (error) {
            return 'error';
            // throw new Error('Failed to fetch the image URL: ' + error.message);
        }
    }

    return {
        getDomainFromUrl,
        isValidURL,
        getBase64ImageFromUrl,
    };
}
