import CryptoJS from 'crypto-js';

const secretKey = window._env_?.VITE_SECRET_KEY;

export const encrypt = (value) => {
  return CryptoJS.AES.encrypt(value, secretKey).toString();
};

export const decrypt = (cipherText) => {
  const bytes = CryptoJS.AES.decrypt(cipherText, secretKey);
  return bytes.toString(CryptoJS.enc.Utf8);
};
