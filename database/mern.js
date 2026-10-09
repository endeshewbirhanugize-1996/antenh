import mongoose from "mongoose";
// Create Schema
const studentSchema =new mongoose.Schema({
  fullName:{
    type:String,
    required:true,
  },
    item:{
    type:String,
    required:true,
  },
  phone:{
    type:String,
    required:true,
  },
  location:{
    type:String,
    required:true,
    unique:true,
  },
    service:{
    type:String,
    required:true,
    unique:true,
  },
   notes:{
    type:String,
    required:true,
    unique:true,
  },
});
//Create Model
const Student=mongoose.model("Student1", studentSchema);
//Export Model
export default Student;