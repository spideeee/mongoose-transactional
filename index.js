let mongoose = require("mongoose");
let Transactional = require("./src/transactional");

mongoose.connection.once("open", async () => {
    console.log("Mongodb connected.");

    let User = mongoose.model("User", {
        firstName: String,
        lastName: String,
        phone: Number
    });

    // describe("Test transacion success", async () => {
        let transactional = Transactional([User], async (tModels) => {
            // console.log(tModels.User);
            let user = tModels.User.new({
                firstName: "Salim",
                lastName: "Khan"
            });
            console.log(user);
            let search = await /* tModels. */User.findOne({
                firstName: "salim"
            }).exec();
            console.log(search)
        });
        // console.log(transactional);
        await transactional();
    // });
    process.exit();
})

mongoose.connect('mongodb://localhost:27017/mongoose-transactional', {useNewUrlParser: true});