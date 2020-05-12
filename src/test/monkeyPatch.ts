export default async function <TFunc, TResult>(
  mod: any,
  original: TFunc,
  replacement: TFunc,
  then: () => Promise<TResult>
) {
  for (var key in mod) {
    if (mod[key] === original) {
      mod[key] = replacement;
    }
  }
  try {
    return await then();
  } finally {
    for (var key in mod) {
      if (mod[key] === replacement) {
        mod[key] = original;
      }
    }
  }
}
