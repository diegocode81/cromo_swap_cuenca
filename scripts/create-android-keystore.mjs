import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { join } from "node:path";

const root = process.cwd();
const keystoreDir = join(root, "android/keystores");
const keystorePath = join(keystoreDir, "cromoswap-release.jks");
const propertiesPath = join(root, "android/release-signing.properties");
const password = randomBytes(24).toString("base64url");
const alias = "cromoswap";

mkdirSync(keystoreDir, { recursive: true });

execFileSync(
  "keytool",
  [
    "-genkeypair",
    "-v",
    "-keystore",
    keystorePath,
    "-alias",
    alias,
    "-keyalg",
    "RSA",
    "-keysize",
    "2048",
    "-validity",
    "10000",
    "-storepass",
    password,
    "-keypass",
    password,
    "-dname",
    "CN=CromoSwap Ecuador, OU=CodeConsultings, O=CodeConsultings, L=Cuenca, ST=Azuay, C=EC"
  ],
  { stdio: "inherit" }
);

writeFileSync(
  propertiesPath,
  [
    `storeFile=${keystorePath}`,
    `storePassword=${password}`,
    `keyAlias=${alias}`,
    `keyPassword=${password}`,
    ""
  ].join("\n")
);

console.log("Keystore release creado.");
console.log(`Guarda una copia segura de: ${keystorePath}`);
console.log(`Configuracion local: ${propertiesPath}`);
