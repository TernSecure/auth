
export const resolveVersion = (ternUIVersion: string | undefined, packageVersion = TERN_UI_VERSION) => {
  if (ternUIVersion) {
    return ternUIVersion
  }

  const prereleaseTag = getPrereleaseTag(packageVersion);
  if (prereleaseTag) {
    if (prereleaseTag === 'snapshot') {
      return TERN_UI_VERSION;
    }

    return prereleaseTag;
  }

  return getMajorVersion(packageVersion);
}

const getPrereleaseTag = (packageVersion: string) =>
  packageVersion
    .trim()
    .replace(/^v/, '')
    .match(/-(.+?)(\.|$)/)?.[1];

export const getMajorVersion = (packageVersion: string) => packageVersion.trim().replace(/^v/, '').split('.')[0];