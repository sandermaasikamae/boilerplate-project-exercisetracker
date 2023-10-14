const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const userExercise = require('./userExercise.js');

mongoose.connect(process.env.MONGO_URI, {useNewUrlParser:true, useUnifiedTopology: true});



app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.use('/api', bodyParser.urlencoded({extended: false}));
app.use('/api', bodyParser.json());

app.route('/api/users')
  .get((req, res) => {
    const users = userExercise.find({}, (err, data) => {
      if(err) return console.log(err);
      else res.json(data);
    })
  })
  .post((req, res) => {
    const username = req.body.username;
    let newUser = new userExercise({username: username});
    newUser.save((err, data) => {
      if (err) { console.log(err) }
      else res.json({username: data.username, _id: data._id});
    });
  });

app.post('/api/users/:_id/exercises', (req, res) => {
  const id = req.params._id;
  let exercise = {
    description: req.body.description,
    duration: Number(req.body.duration),
  }
  if (req.body.date !== "" && req.body.date !== undefined){
    exercise.date = new Date(req.body.date)   
  }
  userExercise.findById(id, (err, user) => {
    if (err) return console.log(err);
    else {
      user.exercises.push(exercise);
      user.save((err, data) => {
        if (err) return console.log(err)
        else {
          let returnObj = {
            _id: data._id,
            username: data.username,
            date: data.exercises[data.exercises.length - 1].date.toDateString(),
            duration: data.exercises[data.exercises.length - 1].duration,
            description: data.exercises[data.exercises.length - 1].description
            }
          res.json(returnObj)
        }
      })
    }
  })
});

app.get('/api/users/:id/logs', (req,res) => {
  let from = new Date(req.query.from);
  let to = new Date(req.query.to);
  let limit = Number(req.query.limit);
  userExercise.findById(req.params.id, (err,data) => {
    if (err){ return console.log(err) }
    let filteredExercises = data.exercises;
    if (from.toString() !== 'Invalid Date') { filteredExercises = filteredExercises.filter((item) => item.date >= from)}
    if (to.toString() !== 'Invalid Date') { filteredExercises = filteredExercises.filter((item) => item.date <= to)}
    if (limit === limit) { filteredExercises = filteredExercises.slice(0,limit)}
    filteredExercises = filteredExercises.map((item) => ({
      description: item.description,
      duration: item.duration,
      date: item.date.toDateString()
    }));
    res.json({
      username: data.username,
      count: filteredExercises.length,
      _id: data._id,
      log: filteredExercises
    }); 
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
