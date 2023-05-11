process.env = require('./.env.js')(process.env.NODE_ENV || 'development');
const port = process.env.PORT || 9000;
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

let indexRoutes = require('./routes/index.js');

const main = async () => {
    try {
        mongoose.Promise = global.Promise;
        mongoose.connect(process.env.ATLAS_URL, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
          useFindAndModify: false
        });
      } catch (err) {
        console.log('Mongoose error', err);
      }
    const app = express();
    app.use(bodyParser.json());
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));
    app.use('/', indexRoutes);
    app.use('*', (req, res) => res.status(404).send('404 Hot Found :) that a joke (Not found)'));
    app.listen(port, () =>
        console.log(`App now running and listening on port ${port}`)
    );
};
main();