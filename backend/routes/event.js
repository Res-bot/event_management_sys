import express from 'express';
import multer from 'multer';
import path from 'path';
import Event from '../models/Event.js';
import RSVP from '../models/RSVP.js';
import { auth } from '../middleware/auth.js';
import { generateDescription } from '../utils/aiService.js';

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const types = /jpeg|jpg|png|gif/;
    const ext = types.test(path.extname(file.originalname).toLowerCase());
    const mime = types.test(file.mimetype);
    
    if (ext && mime) {
      cb(null, true);
    } else {
      cb(new Error('Images only'));
    }
  }
});

router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    const { title, description, date, location, capacity, category } = req.body;
    
    const eventData = {
      title,
      description,
      date: new Date(date),
      location,
      capacity: parseInt(capacity),
      category: category || 'General',
      creator: req.userId,
      image: req.file ? `/uploads/${req.file.filename}` : null
    };

    const event = new Event(eventData);
    await event.save();

    res.status(201).json(event);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/generate-description', auth, async (req, res) => {
  try {
    const { title, context } = req.body;
    const desc = await generateDescription(title, context);
    
    if (!desc) {
      return res.status(500).json({ error: 'Failed to generate description' });
    }

    res.json({ description: desc });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { search, category, startDate, endDate } = req.query;
    
    let query = { date: { $gte: new Date() } };

    if (search) {
      query.$text = { $search: search };
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const events = await Event.find(query)
      .populate('creator', 'name email')
      .sort({ date: 1 });

    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('creator', 'name email');
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json(event);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, upload.single('image'), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (event.creator.toString() !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const updates = { ...req.body };
    if (req.file) {
      updates.image = `/uploads/${req.file.filename}`;
    }

    Object.assign(event, updates);
    await event.save();

    res.json(event);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (event.creator.toString() !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await RSVP.deleteMany({ event: event._id });
    await event.deleteOne();

    res.json({ message: 'Event deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;