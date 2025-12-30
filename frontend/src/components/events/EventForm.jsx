import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { eventAPI } from '../../services/api';

const EventForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    capacity: '',
    category: 'General'
  });
  const [image, setImage] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchEvent();
    }
  }, [id]);

  const fetchEvent = async () => {
    try {
      const res = await eventAPI.getOne(id);
      const evt = res.data;
      setForm({
        title: evt.title,
        description: evt.description,
        date: new Date(evt.date).toISOString().slice(0, 16),
        location: evt.location,
        capacity: evt.capacity,
        category: evt.category
      });
    } catch (err) {
      console.error('Failed to fetch event:', err);
    }
  };

  const handleGenerateDesc = async () => {
    if (!form.title) {
      alert('Please enter a title first');
      return;
    }

    setGenerating(true);
    try {
      const res = await eventAPI.generateDesc({ 
        title: form.title, 
        context: form.location 
      });
      setForm({ ...form, description: res.data.description });
    } catch (err) {
      alert('Failed to generate description');
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    Object.keys(form).forEach(key => formData.append(key, form[key]));
    if (image) formData.append('image', image);

    try {
      if (id) {
        await eventAPI.update(id, formData);
      } else {
        await eventAPI.create(formData);
      }
      navigate('/dashboard');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h2>{id ? 'Edit Event' : 'Create New Event'}</h2>
      <form onSubmit={handleSubmit} className="event-form">
        <input
          type="text"
          placeholder="Event Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />
        
        <div className="desc-group">
          <textarea
            placeholder="Event Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows="6"
            required
          />
          <button 
            type="button" 
            onClick={handleGenerateDesc}
            disabled={generating}
            className="btn-ai"
          >
            {generating ? '✨ Generating...' : '✨ AI Generate'}
          </button>
        </div>

        <input
          type="datetime-local"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
          required
        />

        <input
          type="text"
          placeholder="Location"
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
          required
        />

        <input
          type="number"
          placeholder="Maximum Capacity"
          value={form.capacity}
          onChange={(e) => setForm({ ...form, capacity: e.target.value })}
          min="1"
          required
        />

        <select 
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        >
          <option value="General">General</option>
          <option value="Technology">Technology</option>
          <option value="Music">Music</option>
          <option value="Sports">Sports</option>
          <option value="Business">Business</option>
          <option value="Education">Education</option>
        </select>

        <div className="file-input">
          <label>Event Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files[0])}
          />
        </div>

        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Saving...' : id ? 'Update Event' : 'Create Event'}
        </button>
      </form>
    </div>
  );
};

export default EventForm;