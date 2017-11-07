const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
let app = express();

app.use(bodyParser.text());
app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));


app.use(cors());

app.post('/api/dataset/new', (req, res) => {
    let body = req.body;

    console.log(body);
    res.end();
});

app.listen(3000, () => {
    console.log('Listening on port 3000');
});