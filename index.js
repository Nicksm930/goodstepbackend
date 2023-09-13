// 1. Set up your Express.js application
const cors = require("cors");
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
//dO6jt5HvXG6V1EAk key
const app = express();
const port = 3000;

// 2. Configure MongoDB connection
mongoose.connect('mongodb+srv://user:user@clustergoodstepprod.geih0ye.mongodb.net/goodstepprod', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});
const levelStepsSchema=new mongoose.Schema({
    stepTitle:String,
    stepDesc:String,
    status:Boolean
});
const levelSchema= new mongoose.Schema({
    levelID:Number,
    levelName:String,
    levelBadge:String,
    levelEstimateTime:Number,
    levelRewards:String,
    levelDesc:Array,
    levelStatus:String,
    levelVisibility:Boolean,
    levelSteps:Array,
    levelQuiz:Array
});

// 3. Create a user schema/model
const userSchema = new mongoose.Schema({
 username: String,
  email: String,
  firstName:String,
  lastName:String,
  password:String,
  shortBio:String,
  gender:String,
  mobile:String,
  dob:String,
  identity:String,
  activity:Array,
  linkedin:String,
  facebook:String,
  instagram:String,
  telegram:String,
  whatsapp:String,
  community:Array,
  city:String,
  occupation:String,
  levels:[levelSchema]
});
const Level=mongoose.model('Level',levelSchema);
const User = mongoose.model('User', userSchema);
const Step=mongoose.model('Step',levelStepsSchema)

// 4. Parse JSON in request body
app.use(bodyParser.json());
app.use(cors());
// 5. Create an API route to handle user creation
app.post('/register', async (req, res) => {
  try {
    // const users = await User.find();
    // console.log(users,"users===>");
    const {email} = req.body; // Assuming you send JSON data in the request body
    const userData=req.body;
    console.log(userData,"User Body Data");
    const user1 = await User.findOne({email});
    console.log(user1,"user1111");
    if(user1 == null){
        const levels=await Level.find();
        userData.levels=levels;
        const user = new User(userData);
    const savedUser = await user.save();
    res.status(201).json(savedUser);
    }
    else{
        console.log('User Already Existed!!');
        res.status(600).json({error:'User Already Existed'});
    }

  } catch (error) {
    console.log(error,"errrorrr")
    res.status(400).json({ error: 'Failed to create user' });
  }
});
app.post('/getLevelNumber',async(req,res)=>{
  const {email}=req.body;
  const user=await User.findOne({email});
console.log(user);
   if(user){
  let count=0;
  user.levels.forEach(level=>{
    if(level.levelStatus === "Completed"){
      count ++;
      console.log(count);
    }
  })
  res.send({count:count});
}
else{
res.send({message:"user not found"})
}
})
app.post("/profile/",async(req,res)=>{
console.log(req);
  console.log(req.query.id);
const user=await User.findById(req.query.id);
  console.log(user);
  res.send(user);
});
app.post("/checkEmail",async(req,res)=>{
  const {email}=req.body;

  const user=await User.findOne({email});

  if(user){
    res.send({message:"User already exists..!! Try another Email Id "})
  }
  else{
    res.send({message:"Valid Email"});
  }
});
app.post("/levelsubmit", async (req, res) => {
  const { email, levelID, answers } = req.body;
  const user = await User.findOne({ email });
  const quiz = user.levels[levelID - 1].levelQuiz;

  const a = [];

  quiz.forEach((item, key) => {
    if (item.type === "keyword check") {
      const check = item.answer.some((val) => answers[key] === val);

      a.push(check);
    } else if (item.type === "option") {
      a.push(item.answer === answers[key]);
    } else if (item.type === "charlength") {
      a.push(answers[key].length >= item.answerLength);
    }
  });

  // a contains question correct or wrong

  const levelFinished = !a.includes(false);

  if(levelFinished){
    user.levels[levelID-1].levelStatus="Completed";
    user.levels[levelID].levelStatus="Active";
    user.levels[levelID].levelVisibility=true;
        console.log("1");
   await User.findOneAndReplace({email:email},user);
       console.log("2");
    res.send({message:"Level Completed",badge:user.levels[levelID-1].levelBadge});

  }
  else{
    res.send({message:"Level Not Completed",value:a});

  }


  // if levelFinished true then level complete else not
});
app.post('/getUserInfo',async(req,res)=>{
  const { email } = req.body;

  try {

    const user = await User.findOne({ email});

    if (!user) {
      return res.status(401).json({ message: 'User Session Expired'});
    }

    // 5. Fetch the user object from the MongoDB database
    // You can select specific fields if needed, e.g., { username: 1, email: 1 }
    // Just make sure not to return sensitive data like passwords
    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }

});
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
      // 4. Validate the user's credentials
      const user = await User.findOne({ email, password });

      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // 5. Fetch the user object from the MongoDB database
      // You can select specific fields if needed, e.g., { username: 1, email: 1 }
      // Just make sure not to return sensitive data like passwords
      res.status(200).json("Logged In Successfully");
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  });
app.post('/addLevel',async (req,res)=> {
   const levelData=req.body;
  console.log(levelData);
   const level = new Level(levelData);
    const savedLevel = await level.save();
    // const result=await User.updateMany(levelData,savedLevel);
    // console.log(result,"result");
    // console.log(savedLevel,"Saved Level");
    const users=await User.find();
     users.forEach((user)=>{
        user.levels.push(savedLevel);
        user=new User(user);
        user.save();
    })

    const levels=await Level.find();
    console.log(levels);

    res.status(201).json(levels);
});
app.post('/allLevel',async(req,res)=>{

    const {email}=req.body;
    const user=await User.findOne({email});
    // res.status(200).json(user);
    const levels=user.levels;
    console.log(JSON.stringify(levels));
    res.status(200).json(levels);
});
app.post('/openLevel',async(req,res)=>{
const {levelID,email}=req.body;
const user=await User.findOne({email});
if(user){
    const level=await Level.findOne({levelID});
    console.log(JSON.stringify(level),"level");
    res.status(200).json(level);
}
else{
    console.log("User Logged Out");
}

});
app.post('/levelsubmit',async(req,res)=>{

  const {email,levelID,questionsAnswer}=req.body;

  const user=await User.findOne({email});
  // const xyz=Object.key(questionsAnswer);

// let quizStatus=false;
//   user.levels[Number(levelID)-1].quiz.forEach((obj,key)=>{

//     obj.answer.forEach(item={
//       console.log(item,questionsAnswer);
//     });
//     // obj.answer.map((item,key)=>{
//     //   if(questionsAnswer[xyz[key]].include(item)){
//     //     quizStatus=true;
//     //     break;
//     //   }
//     // })
//   });

  console.log(user);
  user.levels[Number(levelID)-1].levelStatus="Completed";
  user.levels[Number(levelID)].levelVisibility=true;



});
// app.post('/updateLevel',async(req,res)=>{
//   const {levelID,levelData}=req.body;

//   const updatedDocument = await Level.findOneAndUpdate(
//     { levelID: levelID },
//     {levelName:levelData.levelName},
//     { new: true }
//   );
//   if (updatedDocument) {
//     console.log(updatedDocument)
//     return res.status(607).json({ message: 'Document  found' });
//   }
//   else{
//     return res.status(608).json({ message: 'Document not  found' });
//   }
// });
// Start the Express server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
