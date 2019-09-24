let mongoose = require("mongoose");
let chai = require('chai');
let Transactional = require("../src/transactional");

chai.should();

mongoose.connection.once("open", () => {
    console.log("Mongodb connected.");

    let User = mongoose.model("User", {
        firstName: String,
        lastName: String,
        phone: Number
    });

    describe("Test transacion success", async () => {
        await Transactional([User], async (tModels) => {
            console.log(tModels.User);
        })
    });
})

mongoose.connect('mongodb://localhost:27017/mongoose-transactional', {useNewUrlParser: true});
