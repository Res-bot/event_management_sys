import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventAPI, rsvpAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [hasRSVP, setHasRSVP] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEventData();
  }, [id]);

  const fetchEventData = async () => {
    try {
      const [eventRes, rsvpRes] = await Promise.all([
        eventAPI.getOne(id),
        user ? rsvpAPI.checkRSVP(id) : Promise.resolve({ data: { hasRSVP: false } })
      ]);
      setEvent(eventRes.data);
      setHasRSVP(rsvpRes.data.hasRSVP);
    } catch (err) {
      console.error('Failed to fetch event:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRSVP = async () => {
    try {
      await rsvpAPI.create(id);
      setHasRSVP(true);
      fetchEventData();
      alert('RSVP successful!');
    } catch (err) {
      alert(err.response?.data?.error || 'RSVP failed');
    }
  };

  const handleCancelRSVP = async () => {
    try {
      await rsvpAPI.cancel(id);
      setHasRSVP(false);
      fetchEventData();
      alert('RSVP cancelled');
    } catch (err) {
      alert(err.response?.data?.error || 'Cancellation failed');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Delete this event?')) {
      try {
        await eventAPI.delete(id);
        navigate('/');
      } catch (err) {
        alert('Failed to delete event');
      }
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!event) return <div className="error">Event not found</div>;

  const isCreator = user && event.creator._id === user.id;
  const spotsLeft = event.capacity - event.attendeeCount;

  return (
    <div className="event-detail">
      {event.image && (
        <img src={`http://localhost:5000${event.image}`} alt={event.title} />
      )}
      <div className="event-detail-content">
        <span className="event-category">{event.category}</span>
        <h1>{event.title}</h1>
        <p className="event-organizer">Organized by {event.creator.name}</p>
        <div className="event-meta">
          <span>📅 {new Date(event.date).toLocaleString()}</span>
          <span>📍 {event.location}</span>
          <span>👥 {event.attendeeCount} / {event.capacity} attendees</span>
        </div>
        <p className="event-description">{event.description}</p>
        
        <div className="event-actions">
          {isCreator ? (
            <>
              <button onClick={() => navigate(`/edit/${id}`)} className="btn-primary">
                Edit Event
              </button>
              <button onClick={handleDelete} className="btn-danger">
                Delete Event
              </button>
            </>
          ) : user ? (
            hasRSVP ? (
              <button onClick={handleCancelRSVP} className="btn-secondary">
                Cancel RSVP
              </button>
            ) : spotsLeft > 0 ? (
              <button onClick={handleRSVP} className="btn-primary">
                RSVP Now
              </button>
            ) : (
              <button disabled className="btn-disabled">Event Full</button>
            )
          ) : (
            <button onClick={() => navigate('/login')} className="btn-primary">
              Login to RSVP
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventDetail;