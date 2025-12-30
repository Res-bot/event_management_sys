import express from 'express';
import mongoose from 'mongoose';
import Event from '../models/Event.js';
import RSVP from '../models/RSVP.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

router.post('/:eventId', auth, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { eventId } = req.params;

    const existing = await RSVP.findOne({
      event: eventId,
      user: req.userId,
      status: 'confirmed'
    }).session(session);

    if (existing) {
      await session.abortTransaction();
      return res.status(400).json({ error: 'Already registered' });
    }

    const event = await Event.findById(eventId).session(session);

    if (!event) {
      await session.abortTransaction();
      return res.status(404).json({ error: 'Event not found' });
    }

    if (event.attendeeCount >= event.capacity) {
      await session.abortTransaction();
      return res.status(400).json({ error: 'Event is full' });
    }

    const rsvp = new RSVP({
      event: eventId,
      user: req.userId,
      status: 'confirmed'
    });

    await rsvp.save({ session });

    event.attendeeCount += 1;
    await event.save({ session });

    await session.commitTransaction();

    res.status(201).json({ message: 'RSVP successful', rsvp });
  } catch (err) {
    await session.abortTransaction();
    
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Already registered' });
    }
    
    res.status(500).json({ error: err.message });
  } finally {
    session.endSession();
  }
});

router.delete('/:eventId', auth, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { eventId } = req.params;

    const rsvp = await RSVP.findOne({
      event: eventId,
      user: req.userId,
      status: 'confirmed'
    }).session(session);

    if (!rsvp) {
      await session.abortTransaction();
      return res.status(404).json({ error: 'RSVP not found' });
    }

    const event = await Event.findById(eventId).session(session);

    if (!event) {
      await session.abortTransaction();
      return res.status(404).json({ error: 'Event not found' });
    }

    rsvp.status = 'cancelled';
    await rsvp.save({ session });

    event.attendeeCount = Math.max(0, event.attendeeCount - 1);
    await event.save({ session });

    await session.commitTransaction();

    res.json({ message: 'RSVP cancelled' });
  } catch (err) {
    await session.abortTransaction();
    res.status(500).json({ error: err.message });
  } finally {
    session.endSession();
  }
});

router.get('/my-rsvps', auth, async (req, res) => {
  try {
    const rsvps = await RSVP.find({
      user: req.userId,
      status: 'confirmed'
    }).populate({
      path: 'event',
      populate: { path: 'creator', select: 'name' }
    });

    res.json(rsvps);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/my-events', auth, async (req, res) => {
  try {
    const events = await Event.find({ creator: req.userId })
      .populate('creator', 'name email')
      .sort({ date: 1 });

    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/check/:eventId', auth, async (req, res) => {
  try {
    const rsvp = await RSVP.findOne({
      event: req.params.eventId,
      user: req.userId,
      status: 'confirmed'
    });

    res.json({ hasRSVP: !!rsvp });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;