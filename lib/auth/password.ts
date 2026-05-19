const ITERATIONS = 210000
const KEY_LENGTH = 32
const encoder = new TextEncoder()

function toHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")
}

function fromHex(value: string) {
  if (value.length % 2 !== 0) return null

  const bytes = new Uint8Array(value.length / 2)
  for (let i = 0; i < value.length; i += 2) {
    const byte = Number.parseInt(value.slice(i, i + 2), 16)
    if (Number.isNaN(byte)) return null
    bytes[i / 2] = byte
  }

  return bytes
}

async function deriveKey(password: string, salt: Uint8Array) {
  const keyMaterial = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"])
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: Uint8Array.from(salt),
      iterations: ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    KEY_LENGTH * 8,
  )

  return new Uint8Array(bits)
}

export async function hashPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const derivedKey = await deriveKey(password, salt)

  return `${toHex(salt)}:${toHex(derivedKey)}`
}

export async function verifyPassword(password: string, storedHash: string) {
  const [salt, hash] = storedHash.split(":")
  if (!salt || !hash) return false

  const saltBytes = fromHex(salt)
  const storedKey = fromHex(hash)
  if (!saltBytes || !storedKey) return false

  const derivedKey = await deriveKey(password, saltBytes)
  if (storedKey.length !== derivedKey.length) return false

  let diff = 0
  for (let i = 0; i < storedKey.length; i++) {
    diff |= storedKey[i] ^ derivedKey[i]
  }

  return diff === 0
}
