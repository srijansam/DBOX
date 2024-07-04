const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const multer = require("multer"); //Multer is a middleware for handling multipart/form-data, which is commonly used for file uploads in Node.js applications.
const cors = require("cors");
const Query = require("./models/Query");
const fs = require("fs"); // Node.js file system module
const path = require("path");
//const router = express.Router(); ///for retreival oof data
const app = express();
const PORT = process.env.PORT || 5000;

////////////////////////////////////////// Connect to MongoDB/////////////////////////////////
mongoose.connect("mongodb+srv://test:test@cluster0.8vvlrlk.mongodb.net/", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
const db = mongoose.connection;

db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => console.log("Connected to MongoDB"));

// Middleware
app.use(cors());
app.use(bodyParser.json());

/////////////////////////////////////////Ngo-Schema////////////////////
// const data = [
//   { id: 1, name: "Item 1", category: "Clothes" },
//   { id: 2, name: "Item 2", category: "Bags" },
//   { id: 3, name: "Item 3", category: "Books" },
//   { id: 4, name: "Item 4", category: "Grains" },
//   { id: 5, name: "Item 5", category: "Footwear" },
//   { id: 6, name: "Item 6", category: "Blankets" },
//   { id: 7, name: "Item 7", category: "Statonery" }
//   // Add more sample data
// ];
// // Route to get items by category
// app.get("/items/:category", (req, res) => {
//   const category = req.params.category;
//   const itemsInCategory = data.filter((item) => item.category === category);
//   res.json(itemsInCategory);
// });
//////////////////////////////////////Ngo-Schema////////////////////////////////////////
const ngoSchema = new mongoose.Schema({
  ngoName: String,
  email: String,
  dscNo: String,
  contactNo: String,
  password: String
});
const NGO = mongoose.model("NGO", ngoSchema);
////////////////////////////////////////Messaage schema for the request of donation////////////////////////////
const messageSchema = new mongoose.Schema({
  recipientEmail: String,
  content: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Message = mongoose.model("Message", messageSchema);

////////////////////////////////////// User Schema//////////////////////////
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  aadharNo: String,
  phoneNo: String,
  password: String
});

const User = mongoose.model("User", userSchema);

/////////////////////////////////////////// Ticket Schema/////////////////////
// const ticketSchema = new mongoose.Schema({
//   description: String,
//   status: {
//     type: String,
//     enum: ["Open", "Closed"],
//     default: "Open"
//   }
// });

// const Ticket = mongoose.model("Ticket", ticketSchema);

///////////////////////////////////////donate-schema////////////////////////////////////
const donateSchema = new mongoose.Schema({
  email: String,
  address: String,
  contact: String,
  donation: String,
  picture: {
    data: Buffer, // Store image data as a buffer
    contentType: String // Store content type (e.g., 'image/jpeg', 'image/png')
  },
  description: String
});

// Create a Mongoose model for donations
const Donation = mongoose.model("Donation", donateSchema);
///////////////////////////multer(middleware) for fie upload////////////////////

const upload = multer({ dest: "uploads/" });

////////////////////////////route for donation//////////////////
// app.post("/upload", upload.single("picture"), async (req, res) => {
//   try {
//     // Create a new donation object
//     const newDonation = new Donation({
//       email: req.body.email,
//       address: req.body.address,
//       contact: req.body.contact,
//       donation: req.body.donation,
//       picture: {
//         data: req.file.buffer,
//         contentType: req.file.mimetype
//       },
//       description: req.body.description
//     });

//     // Save the donation object to MongoDB
//     await newDonation.save();

//     res.status(201).send("Donation saved successfully");
//   } catch (error) {
//     console.error("Error saving donation:", error);
//     res.status(500).send("Error saving donation");
//   }
// });

app.post("/upload", upload.single("picture"), async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).send("No file uploaded.");
    }

    // Read the uploaded file
    const imageBuffer = fs.readFileSync(req.file.path);

    // Convert image buffer to base64
    const base64Image = imageBuffer.toString("base64");

    // Create a new donation object
    const newDonation = new Donation({
      email: req.body.email,
      address: req.body.address,
      contact: req.body.contact,
      donation: req.body.donation,
      picture: {
        data: base64Image,
        contentType: req.file.mimetype
      },
      description: req.body.description
    });

    // Save the donation object to MongoDB
    await newDonation.save();

    // Delete the temporary file
    fs.unlinkSync(req.file.path);

    res.status(201).send("Donation saved successfully");
  } catch (error) {
    console.error("Error saving donation:", error);
    res.status(500).send("Error saving donation");
  }
});

////////////////////////////////////////////////////////////////////////////retrive the above  info////////////////
////////////////////////////////////Trial//////////////////////////
// Define a schema for your item collection
const itemSchema = new mongoose.Schema({
  name: String,
  category: String
});

// Create a model for your items
const Item = mongoose.model("Item", itemSchema);

// Route to get donations by category from MongoDB
app.get("/items/:category", async (req, res) => {
  const category = req.params.category;
  try {
    // Fetch donations from MongoDB based on the category
    const donationsInCategory = await Donation.find({
      donation: { $regex: new RegExp(category, "i") }
    });
    res.json(donationsInCategory);
  } catch (error) {
    console.error("Error retrieving donations:", error);
    res.status(500).send("Error retrieving donations");
  }
});

////////////////////////////////////Trial Ends////////////////////////////

// Backend: Retrieve donations with base64 encoded images
// app.get("/donations", async (req, res) => {
//   try {
//     const donations = await Donation.find();

//     // Convert image data to base64 before sending
//     const donationsWithBase64Image = donations.map((donation) => {
//       if (donation.picture && donation.picture.data) {
//         const base64Image = donation.picture.data.toString("base64");
//         return {
//           ...donation.toObject(),
//           picture: {
//             data: base64Image,
//             contentType: donation.picture.contentType
//           }
//         };
//       } else {
//         return donation.toObject();
//       }
//     });

//     res.status(200).json(donationsWithBase64Image);
//   } catch (error) {
//     console.error("Error retrieving donations:", error);
//     res.status(500).send("Error retrieving donations");
//   }
// });
app.get("/donations", async (req, res) => {
  try {
    const donations = await Donation.find();

    // Convert image data to base64 before sending
    const donationsWithBase64Image = donations.map((donation) => {
      if (donation.picture && donation.picture.data) {
        const base64Image = Buffer.from(donation.picture.data.buffer).toString(
          "base64"
        ); // Convert binary data to base64
        return {
          ...donation.toObject(),
          picture: {
            data: base64Image, // Include base64 encoded image data
            contentType: donation.picture.contentType
          }
        };
      } else {
        return donation.toObject();
      }
    });

    res.status(200).json(donationsWithBase64Image);
  } catch (error) {
    console.error("Error retrieving donations:", error);
    res.status(500).send("Error retrieving donations");
  }
});

////////////////////////////////////////////////////Route to send request///////////////////////////

app.post("/send-request", async (req, res) => {
  try {
    const { recipientEmail, content } = req.body;

    // Create a new message object
    const newMessage = new Message({ recipientEmail, content });

    // Save the message object to MongoDB
    await newMessage.save();

    res.status(201).send("Request message sent successfully");
  } catch (error) {
    console.error("Error sending request message:", error);
    res.status(500).send("Error sending request message");
  }
});
///////////////////////////////////////////////////////////////
// Node.js/Express example
app.get("/requests", async (req, res) => {
  try {
    const { recipientEmail } = req.query;
    console.log("Recipient Email:", recipientEmail); // Add logging
    const messages = await Message.find({ recipientEmail });
    console.log("Messages:", messages); // Add logging
    res.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).send("Failed to fetch messages");
  }
});

////////////////////////////////////////////////////User data retrieve//////////////////

app.get("/usersdata", async (req, res) => {
  try {
    let userData = await User.find().select({ password: 0, __v: 0 });

    res.status(200).json(userData);
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Server Error" });
  }
});

//////////////////////////////////////////////////donation data retrieve/////////////////
app.get("/donationdata", async (req, res) => {
  //console.log(req.query);
  try {
    let donationData = await Donation.find();
    res.status(200).json(donationData);
  } catch (err) {
    console.log(err);
    res.status(400).json({ msg: "Failed to get donation data" });
  }
});
///////////////////////////////////////Ngo data retrieve////////////////////////
app.get("/ngodata", async (req, res) => {
  try {
    let ngoData = await NGO.find().select({ password: 0, __v: 0 });

    res.status(200).json(ngoData);
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Server Error" });
  }
});

/////////////////////////////////////////////////////////////////////////////////////////////////
const adminUser = {
  name: "Admin",
  email: "admin@gmail.com",
  password: "password",
  role: "admin"
};
///////////////////////////Login route/////////////////////////////////////////
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if the user is the admin
    if (email === adminUser.email && password === adminUser.password) {
      return res.status(200).send("Login successful");
    }

    // If not the admin, proceed with regular user login logic
    const user = await User.findOne({ email, password });
    if (user) {
      res.status(200).send("Login successful");
    } else {
      res.status(401).send("Incorrect email or password");
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
});
////////////////////////////////////////////////NGO- Login ROute/////////////////
app.post("/ngologin", async (req, res) => {
  try {
    const { email, password } = req.body;

    const ngo = await NGO.findOne({ email, password });
    if (ngo) {
      res.status(200).send("Login Successfull");
    } else {
      res.status(401).send("Incorrect email or password");
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
});
//////////////////////////////////////////////////////////////////////////////////////

/////////////////////////////////////////////////////// Route to update a query

//////////////////////////////route sign up user///////////////////////////
app.post("/signup", async (req, res) => {
  try {
    const newUser = new User(req.body);
    await newUser.save();
    res.status(201).send("User created successfully");
  } catch (error) {
    res.status(500).send(error.message);
  }
});
////////////////////////////////////////////////////////////////////////////

/////////////////////////////////////////////////NGO Signup route/////////////////////////
app.post("/ngosignup", async (req, res) => {
  try {
    const newNgo = new NGO(req.body);
    await newNgo.save();
    res.status(201).send("NGO registered successfully");
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
