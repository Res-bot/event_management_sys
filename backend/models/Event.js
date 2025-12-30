import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: Date, required: true },
  location: { type: String, required: true },
  capacity: { type: Number, required: true, min: 1 },
  image: { type: String },
  category: { type: String, default: 'General' },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  attendeeCount: { type: Number, default: 0 }
}, { timestamps: true });

eventSchema.index({ title: 'text', description: 'text' });

export default mongoose.model('Event', eventSchema);