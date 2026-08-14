import mongoose from "mongoose";

//step:1 to connect to the database/mongoDB server
try {
  await mongoose.connect("mongodb://127.0.0.1/mongoose_middleware");
  mongoose.set("debug", true);
} catch (error) {
  console.log(error);
  process.exit();
}

//atep:2 create schema
const userSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    age: { type: Number, required: true, min: 5 },
    //   createdAt: { type: Date, default: Date.now },
    //   updatedAt: { type: Date, default: Date.now },
  },
  {
    timeStamps: true,
  },
);

// step: 6 we will use middleware  save karne se pehle kuch karna ho to use hota hai pre  middleware/ write before model
// userSchema.pre("updateOne", async function () {
//   this.set({ updatedAt: Date.now() });
// });

//step: 3 craete a model /create a collection name=user
const Users = mongoose.model("user", userSchema);

{
  /*
//step: 4 to insert the data
await Users.insertOne({
name: "krishna",
age: 28,
email: "krishnapatel@gmail.com",
});
*/
}

//step: 5 update the data
await Users.updateOne(
  { email: "krishnapatel@gmail.com" },
  { $set: { age: 28 } },
);

await mongoose.connection.close();
