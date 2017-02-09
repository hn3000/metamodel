
export const SimpleReRE = /^\^\[((?:\\\[|\\\]|[^\[\]])+)\]([+*])\$$/;

export function isInvertable(re:string|RegExp) {

  let pattern:string;
  switch (typeof re) {
    case 'string': pattern = re as string; break;
    case 'object': pattern = (re as RegExp).source; break;
    default: pattern = null != re ? re.toString() : null; break
  }

  return SimpleReRE.test(pattern);
}

export function invertedRE(re:string|RegExp):string {

  let pattern:string;
  switch (typeof re) {
    case 'string': pattern = re as string; break;
    case 'object': pattern = (re as RegExp).source; break;
    default: pattern = null != re ? re.toString() : null; break
  }

  let simpleReMatch = SimpleReRE.exec(pattern);
  if (simpleReMatch) {
    let chars = simpleReMatch[1];
    if (chars.charAt(0) == '^') {
      chars = chars.substring(1);
    } else {
      chars = '^'+chars;
    }
    return `[${chars}]`;
  }

  return null;
}
