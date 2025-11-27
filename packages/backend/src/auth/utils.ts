async function getDetailFromResponse(response: Response): Promise<string> {
    const json = await response.json();

    if (!json) {
        return 'Missing error payload';
    }

    let detail =
        typeof json.error === 'string'
            ? json.error
            : (json.error?.message ?? 'Missing error payload');

    if (json.error_description) {
        detail += ' (' + json.error_description + ')';
    }

    return detail;
}

export async function fetchJson(url: string, init: RequestInit) {
    return (await fetchAny(url, init)).json();
}

export async function fetchAny(url: string, init: RequestInit) {
    const response = await fetch(url, init);

    if (!response.ok) {
        throw new Error(await getDetailFromResponse(response));
    }

    return response;
}