const express = require("express");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const axios = require("axios");
const Datastore = require('nedb');
const bodyParser = require("body-parser");
const https = require('https');
const fs = require("fs");
const path = require("path");
const ejs = require('ejs');
const ecashaddr = require('ecashaddrjs');
require('dotenv').config();
const bcrypt = require('bcrypt')
const app = express();
const uri = 'https://bux.digital/v1/pay/?';

// Set the server port to the value specified in the PORT environment variable,
// or to 3000 if PORT is not set
const port = process.env.PORT || 3000;

// Set up JSON body parsing middleware with the specified MIME types and maximum
// request body size
const jsonOptions = {
  type: ["*/json"],
  limit: "750kb",
}
app.use(express.json(jsonOptions));

// Set up form data parsing middleware
app.use(express.urlencoded({ extended: true }));

// Use body-parser to parse incoming request data
app.use(bodyParser.urlencoded({ extended: false }));

const crypto = require("crypto");
const e = require("express");

const generateKey = () => {
  return crypto.randomBytes(32).toString("hex");
};

const secretKey = generateKey();

// Create instances of the nedb module for storing data
const invoiceDB = new Datastore("./database/invoice.db");
const paidDB = new Datastore("./database/paid.db");
const usersDB = new Datastore("./database/users.db");

// Load the databases from the file system
invoiceDB.loadDatabase();
paidDB.loadDatabase();
usersDB.loadDatabase();


// Use express-session to store user data in the session
app.use(
  session({
    secret: secretKey,
    resave: false,
    saveUninitialized: false,
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Define the authentication strategy
passport.use(
  new LocalStrategy(async (username, password, done) => {
    let userName;
    let userPassword;
    let newKey = generateKey()

    await new Promise(resolve => {
      usersDB.find({ username: username }, (err, user) => {
        if (err) {
          console.log("Incorrect username", username, user)
          return done(null, false, { message: "Incorrect username or password" });
        } else if (user.length === 0) {
          console.log("Incorrect username", username, user)
          return done(null, false, { message: "Incorrect username or password" });
        } else {
          userName = user[0].username;
          userPassword = user[0].password;
        }
        resolve();
      })
    });

    if (await bcrypt.compare(password, userPassword)) {
      return done(null, { username: username, key: newKey });
    } else {
      console.log("Incorrect password")
      return done(null, false, { message: "Incorrect username or password" });
    }
  })
)



// Serialize the user data and store it in the session
passport.serializeUser((user, done) => {
  done(null, user);
});

// Deserialize the user data from the session
passport.deserializeUser((user, done) => {
  done(null, user);
});

app.set('trust proxy', true);

// Serve the login form
app.get("/login", (req, res) => {
  if (!req.user) {
    res.sendFile(__dirname + '/client/login.html');
    return;
  }
  res.redirect("/invoice");
});

// Handle the login form submission
app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/invoice",
    failureRedirect: "/login",
  })
);

// Serve the invoice form
app.get("/invoice", (req, res) => {
  if (!req.user) {
    res.redirect("/login");
    return;
  }
  res.sendFile(__dirname + '/client/invoice.html');
});

// Handle the invoice form submission
app.post("/invoice", (req, res) => {
  if (!req.user) {

    res.redirect("/login");
    return;
  }

  const code = Math.random().toString(36).substring(7);
  const invoiceId = Math.random().toString(36).substring(7);
  const filePath = path.join(__dirname, "client", "invoice", code + ".html");
  const templatePath = path.join(__dirname, "client", "templates", "invoice.ejs");


  fs.readFile(templatePath, 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      res.status(500).send("Error reading invoice template");
      return;
    }
    const invoiceData = {
      user: req.user.username,
      merchant: req.body.merchant,
      recipient: req.body.recipient,
      name: req.body.name,
      description: req.body.description,
      custom: code,
      invoice: invoiceId,
      date_issued: new Date(),
      address: [],
      amount: [],
      merchant_counter: req.body.merchantCounter,
    }

    // loop through each merchant field and add the values to the params object
    for (let i = 0; i < invoiceData.merchant_counter; i++) {
      invoiceData.address.push(req.body[`merchant-addr-${i + 1}`]);
      invoiceData.amount.push(req.body[`amount-${i + 1}`]);
    }

    console.log(invoiceData);

    invoiceDB.insert(invoiceData);

    const invoice = ejs.render(data, invoiceData);

    fs.writeFile(filePath, invoice, (err) => {
      if (err) {
        console.error(err);
        res.status(500).send("Error generating invoice");
        return;
      }

      res.redirect(`/invoice/${code}`);
    });
  });
});

app.get("/invoice/:code", (req, res) => {
  const filePath = path.join(__dirname, "client", "invoice", req.params.code + ".html");
  res.sendFile(filePath);
});

app.post("/invoice/:code", (req, res) => {
  invoiceDB.find({ invoice: req.body.invoice, custom: req.body.custom }, async function (err, docs) {
    if (err) {
      console.error(err);
    } else {
      // Create parameters
      const params = {
        merchant_name: req.body.merchant,
        invoice: req.body.invoice,
        order_key: req.body.custom,
        merchant_addr: req.body['merchant-addr'].split(','),
        amount: req.body.amount.split(','),
        offer_name: req.body.name,
        offer_description: req.body.description,
        success_url: req.body.success,
        cancel_url: req.body.cancel,
        ipn_url: req.body.ipn,
        return_json: req.body.returnJson
      };

      console.log(params)
      // create the invoice URI by appending the params to the base URI
      // encode the key-value pairs of the params object as query parameters
      const queryParams = Object.keys(params).map((key) => {
        if (Array.isArray(params[key])) {
          return `${key}=${encodeURIComponent(JSON.stringify(params[key]))}`;
        }
        return `${key}=${encodeURIComponent(params[key])}`;
      }).join('&');

      // append the query parameters to the URI
      const getUrl = `${uri}${queryParams}`;

      console.log(getUrl)

      try {
        // Make the GET request using Axios
        const response = await axios.get(getUrl);

        // Return the response from the GET request as the response of the POST request
        return res.redirect(response.data.paymentUrl);
      } catch (error) {
        return res.status(500).json({ error: error.message });
      }
    }
  });
});

async function postIpn(req, res) {
  const ipAddress = req.connection.remoteAddress;
  console.log(ipAddress);
  const allowIps = [
    '::ffff:208.113.133.143',
    '::ffff:45.79.36.250'
  ]
  let isTrue = 0
  allowIps.map(ip => {
    if (ip === ipAddress) {
      isTrue++
    }
  })
  if (isTrue === 0) {
    console.log('error wrong IP Address')
  } else {
    const ipn = req.body;
    console.log(ipn)
    const url = `https://ecash.badger.cash:8332/tx/${ipn.txn_id}?slp=true`;
    const result = await axios.get(url);
    const txData = result.data;
    const outputs = txData.outputs;
    const buxTokenId = "7e7dacd72dcdb14e00a03dd3aff47f019ed51a6f1f4e4f532ae50692f62bc4e5";
    const buxDecimals = 4;
    const isBuxTransaction = txData.slpToken.tokenId === buxTokenId;
    let recipientArray = [];
    if (isBuxTransaction) {
      for (let i = 1; i < outputs.length; i++) {
        const isSlpOutput = outputs[i].slp;
        if (isSlpOutput) {
          const buxAmount = +(outputs[i].slp.value) / 10 ** buxDecimals;
          recipientArray.push({
            address: convertAddress(outputs[i].address, "etoken"),
            buxAmount: buxAmount
          });
        }
      }
    }

    // function returns address with desired prefix
    function convertAddress(address, targetPrefix) {
      const { prefix, type, hash } = ecashaddr.decode(address);
      if (prefix === targetPrefix) {
        return address;
      } else {
        const convertedAddress = ecashaddr.encode(targetPrefix, type, hash);
        return convertedAddress;
      }
    };

    ipn.recipientArray = recipientArray;
    ipn.ipAddress = ipAddress;
    // validate that transaction settles new order
    invoiceDB.find({ invoice: req.body.invoice, custom: req.body.custom }, function (err, docs) {
      if (err) {
        // Error message if the paymentID doesn't match
        console.log("Error fetching data from the database: ", err);
      } else {
        paidDB.insert(ipn)
      }
    });

    // Send a response
    res.send("OK");
  }
}

app.post("/ipn", postIpn);

app.get('/ispaid', (req, res) => {
  const dataToCheck = JSON.parse(req.query.data);
  paidDB.find({ invoice: dataToCheck.invoice, custom: dataToCheck.custom }, (err, docs) => {
    if (err) {
      // Error message if there's an issue querying the database
      console.log("Error fetching data from the database: ", err);
      return res.status(500).send({ error: "Error querying database" });
    } else if (docs.length === 0) {
      // Return false if data is not found in database
      return res.status(200).send({ found: false });
    } else {
      // Return true if data is found in database
      return res.status(200).send({ found: true });
    }
  });
});

app.use((req, res, next) => {
  res.status(404).redirect("/login");
});

app.listen(port, () => console.log(`Server is live at port ${port}`));