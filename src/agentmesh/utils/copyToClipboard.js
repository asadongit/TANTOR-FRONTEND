/**
 * Copies text to clipboard
 * @param {string} text - Text to copy
 * @param {function} onSuccess - Optional callback when copy succeeds
 */
export const copyToClipboard = (text, onSuccess) => {
  navigator.clipboard.writeText(text).then(() => {
    if (onSuccess) {
      onSuccess();
    }
  }).catch((err) => {
    console.error('Failed to copy to clipboard:', err);
  });
};
