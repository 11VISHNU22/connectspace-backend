const Services = require("../model/services");
exports.getServices = (req, res, next) => {
  console.log("inside")
  Services.find()
    .then((data) => {
      console.log(data);
      res.status(200).json({ message: "Data got successfully", data: data });
    })
    .catch((err) => console.log(err));
};
