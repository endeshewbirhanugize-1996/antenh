import mongoose from "mongoose";
const adminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  cost: {
    type: Number,
    required: true
  },
  foodtype: {
    type: String,
    required: true
  },
  file: {
    type: String,
    required: true
  }
});
export default mongoose.model("Admin", adminSchema);