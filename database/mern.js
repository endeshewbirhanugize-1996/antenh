import mongoose from "mongoose";
// Create Schema
const studentSchema = new mongoose.Schema({
  name:{
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
});
//Create Model
const Student=mongoose.model("Student1", studentSchema);
// Export Model
export default Student;