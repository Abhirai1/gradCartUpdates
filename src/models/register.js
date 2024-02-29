const mongoose =require ("mongoose"); 
const bcrypt=require('bcryptjs');
const jwt=require("jsonwebtoken")

const userSchema=new mongoose.Schema({
    username:{
        type:String,
        require:true,
        unique:true
    },
    email:{
        type:String,
        require:true,
    },
    password:{
        type: String,
        require:true
    },
    tokens:[{
        token:{
            type: String,
            required:true
        }
    }]
});

userSchema.methods.generateAuthToken=async function (){
    try{
        console.log(this._id);
        const token=jwt.sign({_id:this._id.toString()},"jeevanjeevoharinaamleterhojeevankaaanandleterhoharibol");
        this.tokens=this.tokens.concat({token:token});
        await this.save();
        return token;
    } catch(error){
        res.send("error part " + error);
    }
}

userSchema.pre("save",async function(next){
    if(this.isModified("password")){
        this.password=await bcrypt.hash(this.password,10);
        next();
    }

});

// Create an index on the email field to enforce uniqueness
userSchema.index({ username: 1 }, { unique: true });

const Register = new mongoose.model("register",userSchema);

module.exports=Register;