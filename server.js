const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use('/api', require('./routes/api'));

app.get('/', (req, res) => res.render('dashboard'));
app.get('/divisions', (req, res) => res.render('divisions'));
app.get('/students', (req, res) => res.render('students'));
app.get('/search', (req, res) => res.render('search'));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
