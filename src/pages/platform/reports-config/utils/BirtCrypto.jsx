import CryptoJS from "crypto-js";

export function birtEncrypt(plainText) {
    const key = CryptoJS.enc.Utf8.parse(import.meta.env.VITE_REPORTING_CRYPTO_KEY);
    const iv = CryptoJS.enc.Utf8.parse(import.meta.env.VITE_REPORTING_CRYPTO_IV);

    const encrypted = CryptoJS.AES.encrypt(
      CryptoJS.enc.Utf8.parse(plainText),
      key,
      {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      }
    );

    // Return Base64 string
    return encrypted.toString();
  }