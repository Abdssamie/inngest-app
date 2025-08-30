import {aes256 as aes} from "aes256";

// Define a secret key. NOTE: Store this securely, e.g., in environment variables.
const SECRET_KEY = process.env.ENCRYPTION_SECRET_KEY; // Must be 32 bytes for AES-256


/**
 * Encrypts a string using AES-256-CBC.
 *
 * @param credentials The credentials data to encrypt.
 * @returns The encrypted string in 'hex:hex' format (IV:encryptedData).
 * @throws - An error if the secret key is not provided.
 */
export function encryptCredential(credentials: object): string {
  // Check if the secret key is defined before proceeding
  if (!SECRET_KEY) {
    throw new Error('Secret key not found. Please set the SECRET_KEY environment variable.');
  }

  const stringifiedData = JSON.stringify(credentials);

  return aes.encrypt(SECRET_KEY, stringifiedData)
}

/**
 * Decrypts a string using AES-256-CBC.
 *
 * @returns The decrypted plaintext string as an object.
 * @throws - An error if the secret key is not provided or the format is invalid.
 * @param encryptedString
 */
export function decryptCredential(encryptedString: string): object {
  // Check if the secret key is defined before proceeding
  if (!SECRET_KEY) {
    throw new Error('Secret key not found. Please set the SECRET_KEY environment variable.');
  }

  const decryptedString = aes.decrypt(SECRET_KEY, encryptedString)

  return JSON.parse(decryptedString);
}

