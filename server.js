const express = require("express");
require("dotenv").config();

const dashboardRoutes = require("./src/routes/dashboardRoutes");
const authRoutes= require("./src/routes/authRoutes");


const app = express();

app.set("json spaces", 2);
app.use(express.static("public"));
app.use(express.json());
app.use("/dashboard", dashboardRoutes);
app.use("/login", authRoutes);

//Basic routes
app.get("/", (req, res) => {
  res.send("Hello from express");
});

app.get("/about", (req, res) => {
  res.send("Hello from about page");
});

app.listen(process.env.PORT || 3000, () => {
  console.log("The server is running");
});