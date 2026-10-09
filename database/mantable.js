import mongoose from 'mongoose';
const uploadSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true, trim: true },
    number: { type: Number, required: true },
    message: { type: String, trim: true },
    file: {
      originalName: String,
      storedName: String,
      path: String,
      mimeType: String,
      size: Number,
    },
  },
  { timestamps: true }
);
export default mongoose.model('Upload', uploadSchema);