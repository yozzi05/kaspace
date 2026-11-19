/** Путь к файлу из /public с учётом basePath (GitHub Pages в некорневом репозитории). */
export const asset = (path: string) => `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}${path}`;
