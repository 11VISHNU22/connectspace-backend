require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const serviceRoutes = require("./routes/Services");
const consultantsRoutes = require("./routes/Consultants");
const userRoutes = require("./routes/User");
const User = require("./model/user");
const authRoutes = require("./routes/Auth");
const Consultants = require("./model/consultants");
app.use(bodyParser.json());
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});
app.get("/", (req, res, next) => {
  const token = req.get("Authorization").split(" ")[1];
  let decodedToken;
  try {
    decodedToken = jwt.verify(token, process.env.JWT_TOKEN);
  } catch (err) {
    console.error(err);
  }
  if (!decodedToken) {
    const error = new Error("Not Authorized");
    error.satusCode = 401;
    throw error;
  }
  if (decodedToken) {
    const userId = decodedToken.user._id;
    User.findOne({ _id: userId })
      .then((user) => {
        if (!user) {
          return res.status(400).json({ message: "Invalid email or password" });
        }
        const existingArray = user.consultationsWith;
        let promises = [];

        if (user.consultationsWith.length > 0) {
          for (let i = 0; i < existingArray.length; i++) {
            const promise = Consultants.findOne({
              _id: existingArray[i].consultantId,
            })
              .then((consultant) => {
                return {
                  name: consultant.name,
                  date: existingArray[i].date,
                };
              })
              .catch((err) => console.log(err));

            promises.push(promise);
          }

          Promise.all(promises)
            .then((consultationDetails) => {
              res.json({
                user: { email: user.email, name: user.name },
                consultationDetails: consultationDetails,
                token: token,
              });
            })
            .catch((err) => {
              console.error("Error fetching consultant details:", err);
              return res.status(500).send("Internal Server Error");
            });
        } else {
          res.json({
            user: { email: user.email, name: user.name },
            consultationDetails: [],
            token: token,
          });
        }
      })
      .catch((err) => console.log(err));
  } else {
    res.status(500).send({ message: "No current session found!" });
  }
});
app.use(serviceRoutes);
app.use(authRoutes);
app.use(consultantsRoutes);
app.use(userRoutes);

mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => {
    console.log("connected!");
    app.listen(8080);
  })
  .catch((err) => console.log(err));
