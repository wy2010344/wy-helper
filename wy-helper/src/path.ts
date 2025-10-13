function normalizeArray(parts: string[], allowAboveRoot?: boolean) {
  const res = [];
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];

    // ignore empty parts
    if (!p || p === '.') continue;

    if (p === '..') {
      if (res.length && res[res.length - 1] !== '..') {
        res.pop();
      } else if (allowAboveRoot) {
        res.push('..');
      }
    } else {
      res.push(p);
    }
  }

  return res;
}
function isAbsolutePath(path: string) {
  return path.charAt(0) === '/';
}
function normalize(path: string) {
  const isAbsolute = isAbsolutePath(path),
    trailingSlash = path && path[path.length - 1] === '/';

  // Normalize the path
  path = normalizeArray(path.split('/'), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
}

export function joinPath(...vs: (string | number | boolean)[]) {
  let path = '';
  for (let i = 0; i < vs.length; i++) {
    const segment = vs[i];
    if (segment) {
      if (!path) {
        path += segment;
      } else {
        path += `/${segment}`;
      }
    }
  }
  return normalize(path);
}

export function joinPathWin32(...vs: string[]) {
  const paths: string[] = [];
  for (let i = 0; i < vs.length; i++) {
    const arg = vs[i];
    if (arg) {
      paths.push(arg);
    }
  }

  let joined = paths.join('\\');

  // Make sure that the joined path doesn't start with two slashes, because
  // normalize() will mistake it for an UNC path then.
  //
  // This step is skipped when it is very clear that the user actually
  // intended to point at an UNC path. This is assumed when the first
  // non-empty string arguments starts with exactly two slashes followed by
  // at least one more non-slash character.
  //
  // Note that for normalize() to treat a path as an UNC path it needs to
  // have at least 2 components, so we don't filter for that here.
  // This means that the user can use join to construct UNC paths from
  // a server name and a share name; for example:
  //   path.join('//server', 'share') -> '\\\\server\\share\')
  if (!/^[\\\/]{2}[^\\\/]/.test(paths[0])) {
    joined = joined.replace(/^[\\\/]{2,}/, '\\');
  }

  return normalizeW32(joined);
}

function normalizeW32(path: string) {
  let result = win32StatPath(path),
    device = result.device,
    isUnc = result.isUnc,
    isAbsolute = result.isAbsolute,
    tail = result.tail,
    trailingSlash = /[\\\/]$/.test(tail);

  // Normalize the tail path
  tail = normalizeArray(tail.split(/[\\\/]+/), !isAbsolute).join('\\');

  if (!tail && !isAbsolute) {
    tail = '.';
  }
  if (tail && trailingSlash) {
    tail += '\\';
  }

  // Convert slashes to backslashes when `device` points to an UNC root.
  // Also squash multiple slashes into a single one where appropriate.
  if (isUnc) {
    device = normalizeUNCRoot(device);
  }

  return device + (isAbsolute ? '\\' : '') + tail;
}
function normalizeUNCRoot(device: string) {
  return `\\\\${device.replace(/^[\\\/]+/, '').replace(/[\\\/]+/g, '\\')}`;
}
const splitDeviceRe =
  /^([a-zA-Z]:|[\\\/]{2}[^\\\/]+[\\\/]+[^\\\/]+)?([\\\/])?([\s\S]*?)$/;
function win32StatPath(path: string) {
  const result = splitDeviceRe.exec(path),
    device = result?.[1] || '',
    isUnc = !!device && device[1] !== ':';
  return {
    device,
    isUnc,
    isAbsolute: isUnc || !!result?.[2], // UNC paths are always absolute
    tail: result?.[3] || '',
  };
}
