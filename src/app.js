const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
const { expressCspHeader, INLINE, NONE, SELF } = require('express-csp-header');

require('dotenv').config();

const middlewares = require('./middlewares');
const api = require('./api');

const app = express();
//app.set('trust proxy', 1); // If Behind PROXY

app.use(morgan('dev'));
app.use(helmet());
app.use(cors());
app.use(expressCspHeader({
  directives: {
      'default-src': [SELF],
      'script-src': [SELF, INLINE, 'somehost.com'],
      'style-src': [SELF, 'localhost:7500'],
      'img-src': ['data:', 'https://geodragon.geozukunft.at/'],
      'worker-src': [NONE],
      'block-all-mixed-content': true
  }
}));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/', express.static('./src/web'))

app.get('/lawstuff', (req, res) => {
  res.sendFile(path.join(`${__dirname}/html/lawstuff.html`));
});


app.use('/api/v1', api);

app.use(middlewares.notFound);
app.use(middlewares.errorHandler);

module.exports = app;