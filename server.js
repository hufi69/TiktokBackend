const { default: mongoose } = require("mongoose");
const app = require("./app");

const http = require('http');




const PORT = process.env.PORT || 8001;

mongoose.connect(process.env.DB_URL).then(() => {
  console.log("DB connection successful!");
  const server = http.createServer(app);

  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});












