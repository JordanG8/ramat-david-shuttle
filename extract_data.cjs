const fs = require("fs");

const appJs = fs.readFileSync("app.js", "utf8");
const lines = appJs.split("\n");

let dataStart = -1;
let dataEnd = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].startsWith("let DATA = {")) {
    dataStart = i;
  }
  if (
    lines[i].startsWith("// ─── Load Admin Overrides from localStorage ───")
  ) {
    dataEnd = i;
    break;
  }
}

if (dataStart !== -1 && dataEnd !== -1) {
  const dataContent = lines.slice(dataStart, dataEnd).join("\n");

  // Create src/data directory
  if (!fs.existsSync("src")) fs.mkdirSync("src");
  if (!fs.existsSync("src/data")) fs.mkdirSync("src/data");

  // Write to fallbackData.js
  fs.writeFileSync("src/data/fallbackData.js", `export ${dataContent}\n`);

  // Remove from app.js
  const newAppJs =
    lines.slice(0, dataStart).join("\n") +
    '\nimport { DATA, OLD_ROUTES } from "./src/data/fallbackData.js";\n' +
    lines.slice(dataEnd).join("\n");
  fs.writeFileSync("app.js", newAppJs);

  console.log("Data extracted successfully.");
} else {
  console.log("Could not find data boundaries.");
}
