const path = require("path");
const fs = require("node:fs/promises");
const { machineId } = require("node-machine-id");

const crypto = globalThis.crypto;

const LICENSE_PRODUCT_ID = "STARUML.V7";
const LICENSE_PRODUCT_EDITION = "PRO"; // STD
const LICENSE_CRYPTO_KEY = "y0JMc9mvB1uvIi82GhdMJQXzVJxl+1Lc0RqZqWaQvx0=";
const LICENSE_FILE_NAME = "activation.key";

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function generateRandomBytes(length = 16) {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return array;
}

async function generateAESKey() {
  return await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true, // 允许导出密钥
    ["encrypt", "decrypt"]
  );
}

async function exportKeyToBase64(key) {
  const raw = await crypto.subtle.exportKey("raw", key);
  return arrayBufferToBase64(raw);
}

async function importKeyFromBase64(base64Key) {
  const raw = base64ToArrayBuffer(base64Key);
  return await crypto.subtle.importKey(
    "raw",
    raw,
    "AES-GCM",
    true,
    ["encrypt", "decrypt"]
  );
}

async function encryptString(key, plaintext) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);
  const iv = generateRandomBytes(12); // GCM 推荐 12 字节 IV

  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    data
  );

  const ivBase64 = arrayBufferToBase64(iv);
  const cipherBase64 = arrayBufferToBase64(encryptedBuffer);
  return `${ivBase64}:${cipherBase64}`;
}

async function decryptString(key, encryptedText) {
  const [ivBase64, encryptedBase64] = encryptedText.split(":");
  const iv = base64ToArrayBuffer(ivBase64);
  const encryptedBuffer = base64ToArrayBuffer(encryptedBase64);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    encryptedBuffer,
  );
  return new TextDecoder().decode(decrypted);
}

async function getDeviceId() {
  return await machineId();
}

async function encodeValidationCode(deviceId) {
  const key = await importKeyFromBase64(LICENSE_CRYPTO_KEY);
  return await encryptString(key, deviceId);
}

async function decodeValidationCode(validationCode) {
  const key = await importKeyFromBase64(LICENSE_CRYPTO_KEY);
  const deviceId = await decryptString(key, validationCode);
  return { deviceId };
}

async function encodeActivationCode(license) {
  const key = await importKeyFromBase64(LICENSE_CRYPTO_KEY);
  return await encryptString(key, JSON.stringify(license))
}

async function decodeActivationCode(activationCode) {
  const key = await importKeyFromBase64(LICENSE_CRYPTO_KEY);
  const decrypted = await decryptString(key, activationCode);
  return JSON.parse(decrypted);
}

const license = {
  name: "staruml",
  product: LICENSE_PRODUCT_ID,
  edition: LICENSE_PRODUCT_EDITION,
  licenseKey: "license key"
}

async function createLicenseFile() {
  try {
    const filePath = path.join('', LICENSE_FILE_NAME);
    const deviceId = await getDeviceId();
    license.deviceId = deviceId;
    const activationCode = await encodeActivationCode(license);
    await fs.writeFile(filePath, activationCode, "utf8");

    const decrypted = await decodeActivationCode(activationCode)
    console.log(decrypted);
  } catch(err) {
    console.error("create license file failed:", err);
  }
}

createLicenseFile();
