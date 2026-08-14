import mongoose from "mongoose";

//step:1 to connect to the database/mongoDB server
try {
  await mongoose.connect("mongodb://127.0.0.1/mongoose_database");
  mongoose.set("debug", true); //to give queries output
} catch (error) {
  console.log(error);
  process.exit();
}

//step:2 create shema
const userSchema = mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  age: { type: Number, required: true, min: 5 },
  createdAt: { type: Date, default: Date.now },
});

//creating a model user=singuler collection name
const Users = mongoose.model("user", userSchema);

await Users.create({
  name: "krishna",
  age: 28,
  email: "krishnapatel@gmail.com",
});

await mongoose.connection.close();
