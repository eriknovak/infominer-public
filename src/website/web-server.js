const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer  = require('multer');
let app = express();

app.use(cors());
app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({   // to support URL-encoded bodies
  extended: true
}));

let upload = multer();


app.post('/api/dataset/new', upload.single('file'), (req, res) => {

    let body = req.body;
    let file = req.file;

    res.end();
});

app.listen(3000, () => {
    console.log('Listening on port 3000');
});