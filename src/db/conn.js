const mongoose=require('mongoose');
require('dotenv').config();
const mongoURL=process.env.MONGO_URL;

// mongoURL=
mongoose.connect(mongoURL)
.then(()=>{
    console.log('connected successfully');
})