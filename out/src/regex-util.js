"use strict";
exports.SimpleReRE = /^\^\[((?:\\\[|\\\]|[^\[\]])+)\]([+*])\$$/;
function isInvertable(re) {
    var pattern;
    switch (typeof re) {
        case 'string':
            pattern = re;
            break;
        case 'object':
            pattern = re.source;
            break;
        default:
            pattern = null != re ? re.toString() : null;
            break;
    }
    return exports.SimpleReRE.test(pattern);
}
exports.isInvertable = isInvertable;
function invertedRE(re) {
    var pattern;
    switch (typeof re) {
        case 'string':
            pattern = re;
            break;
        case 'object':
            pattern = re.source;
            break;
        default:
            pattern = null != re ? re.toString() : null;
            break;
    }
    var simpleReMatch = exports.SimpleReRE.exec(pattern);
    if (simpleReMatch) {
        var chars = simpleReMatch[1];
        if (chars.charAt(0) == '^') {
            chars = chars.substring(1);
        }
        else {
            chars = '^' + chars;
        }
        return "[" + chars + "]";
    }
    return null;
}
exports.invertedRE = invertedRE;
//# sourceMappingURL=regex-util.js.map