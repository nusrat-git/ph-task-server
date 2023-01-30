const express = require("express");
const mongoose = require("mongoose");
var cors = require("cors");

const jwt = require("jsonwebtoken");

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.User_Name}:${process.env.User_Password}@cluster0.uft9um0.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

app.get("/", (req, res) => {
  res.send("Billings server running");
});

async function run() {
  try {
    const billingsDataBase = client.db("phTask").collection("billings");
    const User = client.db("phTask").collection("users");

    //auth

    app.post("/api/login", async (req, res, next) => {
      let { email, password } = req.body;

      let existingUser;
      try {
        existingUser = await User.findOne({ email: email });
      } catch {
        const error = new Error("Error! Something went wrong.");
        return next(error);
      }
      if (!existingUser || existingUser.password != password) {
        const error = Error("Wrong details please check at once");
        return next(error);
      }
      let token;
      try {
        //Creating jwt token
        token = jwt.sign(
          { userId: existingUser.id, email: existingUser.email },
          "secretkeyappearshere",
          { expiresIn: "1h" }
        );
      } catch (err) {
        console.log(err);
        const error = new Error("Error! Something went wrong.");
        return next(error);
      }

      res.status(200).json({
        success: true,
        data: {
          userId: existingUser.id,
          email: existingUser.email,
          token: token,
        },
      });
    });

    app.post("/api/registration", async (req, res) => {
      const user = req.body;
      const result = await User.insertOne(user);
      user.id = result.insertedId;

      let { email, password } = req.body;

      let existingUser;
      try {
        existingUser = await User.findOne({ email: email });
      } catch {
        const error = new Error("Error! Something went wrong.");
        return next(error);
      }
      if (!existingUser || existingUser.password != password) {
        const error = Error("Wrong details please check at once");
        return next(error);
      }
      let token;
      try {
        //Creating jwt token
        token = jwt.sign(
          { userId: existingUser.id, email: existingUser.email },
          "secretkeyappearshere",
          { expiresIn: "1h" }
        );
      } catch (err) {
        console.log(err);
        const error = new Error("Error! Something went wrong.");
        return next(error);
      }

      res.status(200).json({
        success: true,
        data: {
          userId: existingUser.id,
          email: existingUser.email,
          token: token,
        },
      });

      res.send(user);
    });

    app.get("/accessResource", (req, res) => {
      const token = req.headers.authorization.split(" ")[1];
      // Authorization: 'Bearer TOKEN'
      if (!token) {
        res
          .status(200)
          .json({ success: false, message: "Error!Token was not provided." });
      }
      //Decoding the token
      const decodedToken = jwt.verify(token, "secretkeyappearshere");
      res.status(200).json({
        success: true,
        data: { userId: decodedToken.userId, email: decodedToken.email },
      });
    });

    //end

    app.post("/api/add-billing", async (req, res) => {
      const bill = req.body;
      const result = await billingsDataBase.insertOne(bill);
      bill.id = result.insertedId;

      res.send(bill);
    });

    app.get("/api/billing-list", async (req, res) => {
      const page = req.query.page;
      const size = parseInt(req.query.size);
      const query = {};
      const cursor = billingsDataBase.find(query).sort({ time: -1 });
      const billings = await cursor
        .skip(page * size)
        .limit(size)
        .toArray();
      const count = await billingsDataBase.estimatedDocumentCount();
      res.send([count, billings]);
    });

    app.delete("/api/delete-billing/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await billingsDataBase.deleteOne(query);
      res.send(result);
    });

    app.put("/api/update-billing/:id", async (req, res) => {
      const id = req.params.id;
      const body = req.body;
      console.log(id, body);
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updatedDoc = {
        $set: {
          fullName: body.fullName,
          email: body.email,
          phone: body.phone,
          amount: body.amount,
          time: new Date(),
        },
      };
      const result = await billingsDataBase.updateOne(
        filter,
        updatedDoc,
        options
      );
      res.send(result);
    });
  } finally {
  }
}
run().catch((err) => console.log(err));

mongoose.set("strictQuery", true);

mongoose
  .connect(uri)
  .then(() => {
    app.listen(port, () => {
      console.log(`Billings app listening on port ${port}`);
    });
  })
  .catch((err) => {
    console.log("Error Occurred");
  });
