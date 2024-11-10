const User = require("../model/user");
const Consultants = require("../model/consultants");
const jwt = require("jsonwebtoken");
require("dotenv").config();
exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  User.findOne({ email: email, password: password })
    .then((user) => {
      if (!user) {
        return res.status(400).json({ message: "Invalid email or password" });
      }
      // req.session.user = user;
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
            const token = jwt.sign({ user: user }, process.env.JWT_TOKEN, {
              expiresIn: "1h",
            });
            res.json({
              user: { email: user.email, name: user.name },
              consultationDetails: consultationDetails,
              token: token,
              message: "Login Successfull",
            });
          })
          .catch((err) => {
            console.error("Error fetching consultant details:", err);
            return res.status(500).send("Internal Server Error");
          });
      } else {
        const token = jwt.sign({ user: user }, process.env.JWT_TOKEN, {
          expiresIn: "1h",
        });
        res.json({
          user: { email: user.email, name: user.name },
          consultationDetails: [],
          token: token,
          message: "Login Successfull",
        });
      }
    })
    .catch((err) => {
      console.log(err);
      return res.status(500).send("Internal Server Error");
    });
};

exports.postLogout = (req, res, next) => {
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
    res.json({ message: "Logout Successfull" });
  }
};
exports.postSignup = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const name = req.body.userName;
  User.findOne({ email: email })
    .then((userData) => {
      if (userData) {
        return res
          .status(201)
          .send({ message: "Account Already Exist!Login To Continue" });
      }
      const user = new User({ name: name, email: email, password: password });
      user.save().then(() => {
        res.status(200).send({ message: "Account Created Successfully" });
      });
    })
    .catch((err) => console.log(err));
};
