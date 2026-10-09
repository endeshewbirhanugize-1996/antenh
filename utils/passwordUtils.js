import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);

export const hashPassword = async (password) => {
    const salt = randomBytes(16).toString("hex");
    const derivedKey = await scrypt(password, salt, 64);
    return `${salt}:${derivedKey.toString("hex")}`;
};

export const verifyPassword = async (password, storedPassword) => {
    const separatorIndex = storedPassword.indexOf(":");

    if (separatorIndex === -1) {
        return storedPassword === password;
    }

    const salt = storedPassword.slice(0, separatorIndex);
    const storedHash = storedPassword.slice(separatorIndex + 1);
    if (!salt || !storedHash) return false;

    const expectedHash = Buffer.from(storedHash, "hex");
    const actualHash = await scrypt(password, salt, expectedHash.length);
    return expectedHash.length > 0 && timingSafeEqual(expectedHash, actualHash);
};
