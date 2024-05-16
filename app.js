require("dotenv").config();

const mongoose = require('mongoose');
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require("cookie-parser");
const frontend = require("./routes/pages");
const backend = require("./routes/api").router;
const app = express();
const PORT = process.env.PORT || 3000;

app.set('views', path.join(__dirname, 'templates'));
app.set('view engine', 'ejs');



const CONNECTION_URL = process.env.CONNECTION_URL;
mongoose.connect(CONNECTION_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        dbName: 'Traille'
    })

app.use("/", frontend, backend);
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());


app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});

