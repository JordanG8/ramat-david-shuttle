const fs = require("fs");
const appJs = fs.readFileSync("app.js", "utf8");

let codeToEval = appJs.split("// ─── Helpers ───")[0];
codeToEval = codeToEval.replace("let DATA =", "global.DATA =");
codeToEval = codeToEval.replace("let OLD_ROUTES =", "global.OLD_ROUTES =");
eval(codeToEval);

const payload = {
  units: global.DATA.units,
  bus_routes: global.DATA.bus_routes,
  old_routes: global.OLD_ROUTES,
  _saved_at: new Date().toISOString(),
};

fs.writeFileSync("payload.json", JSON.stringify(payload, null, 2));
console.log("Payload created");
