const fs = require("fs");
const https = require("https");

const payload = JSON.parse(fs.readFileSync("payload.json", "utf8"));

const data = JSON.stringify({
  data: payload,
  password: "admin2024!",
});

const options = {
  hostname: "ramat-david-shuttle.vercel.app",
  port: 443,
  path: "/api/data",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(data),
  },
};

const req = https.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  res.setEncoding("utf8");
  res.on("data", (chunk) => {
    console.log(`BODY: ${chunk}`);
  });
});

req.on("error", (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.write(data);
req.end();
