const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const api_test_router = require('./routes/test');

const app = express();

const hostname = 'localhost';
const port = process.env.API_PORT;

app.use(express.json());
app.use(express.urlencoded());
app.use(cors({ credentials: true, origin: `http://localhost:${process.env.APP_PORT}` }));

app.use('/api/test', api_test_router);

app.use((req, res) => {
    res.status(404).json({
      error: 'Endpoint is not found'
    });
});

async function main() {
  await mongoose.connect("mongodb+srv://prezchyk:oDpY8Sh75bhJ568j@chronos.uvtbggy.mongodb.net/chronos?appName=chronos");
}

main()
  .then(() => {
    app.listen(port, () => {
      console.log(`API server running at http://${hostname}:${port}`);
    });
  })
  .catch((err) => {
    console.error(err);
  });

