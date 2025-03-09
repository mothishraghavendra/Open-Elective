const express = require("express");
const path = require("path");
const ngrok = require("@ngrok/ngrok"); 

const app = express();
const PORT = 3000; 
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "welcome.html"));
});

// Start the server
app.listen(PORT, async () => {
  console.log(`Server running at http://localhost:${PORT}`);

  try {
    const url = await ngrok.connect({ addr: PORT, authtoken_from_env: true });
    console.log(`Public URL: ${url}`);
    console.log("Share this link with anyone to access welcome.html from any network.");
  } catch (err) {
    console.error("Ngrok error:", err);
  }
});
