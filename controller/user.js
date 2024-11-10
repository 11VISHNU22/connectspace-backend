const User = require("../model/user");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const client = require('../config/twilio');
const {format} = require('date-fns');
exports.postAppointConsult = (req, res, next) => {
  const cid = req.body.consultantId;
  const token = req.body.token;
  const date = req.body.date;
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
        const existingConsultations = user.consultationsWith;
        const newObj = { consultantId: cid, date: date };
        existingConsultations.push(newObj);
        user.consultationsWith = existingConsultations;
        user.save().then(() => {
           client.messages.create({
            body:`Hi Vishnu Teja Your appointment has been booked successfully on ${format(date,'MMMM dd, yyyy')}. Your Consultant ID is ${cid}`,
            from:'+12569077884',
            to:'+919494170404'
          }).then(()=>{
            console.log("Message Sent")
            res.json({ message: "Booked!" });
          })
        });
      })
      .catch((err) => console.log(err));
  } else {
    res.status(500).send({ message: "No current session found!" });
  }
};
