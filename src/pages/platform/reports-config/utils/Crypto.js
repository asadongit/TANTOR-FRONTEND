import CryptoJS from "crypto-js";
import {cryptoKey, cryptoIvKey} from "../config";

export function encrypt(plainText) {
    const key = CryptoJS.enc.Utf8.parse(cryptoKey);
    const iv = CryptoJS.enc.Utf8.parse(cryptoIvKey);

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