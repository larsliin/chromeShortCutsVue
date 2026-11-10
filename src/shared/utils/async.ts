// Runs tasks one after another so Chrome's bookmark API never sees a parallel burst.
export async function runSequentially<T>(
    items: T[],
    task: (item: T, index: number) => Promise<void>,
): Promise<void> {
    await items.reduce<Promise<void>>(
        (chain, item, index) => chain.then(() => task(item, index)),
        Promise.resolve(),
    );
}
