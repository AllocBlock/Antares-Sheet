const CHARACTERS = 'ABCDEFGHIJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789' // no 1-l, 0-o-O which cause confused
export function generateRandomCode(len) {
    let result = '';
    let charMaxLength = CHARACTERS.length;
    for (let i = 0; i < len; i++) {
      result += CHARACTERS.charAt(Math.floor(Math.random() * charMaxLength));
    }
    return result;
}