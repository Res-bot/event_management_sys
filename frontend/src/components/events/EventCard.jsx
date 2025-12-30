import React from 'react';
import { useNavigate } from 'react-router-dom';
const EventCard = ({ event }) => {
    const navigate = useNavigate();
    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };
    const spotsLeft = event.capacity - event.attendeeCount;
    return (
        <div className="event-card" onClick={() => navigate(`/events/${ event._id }`)}>
            {event.image && (
                <img src={`http://localhost:5000${event.image}`} alt={event.title} />
)}
            <div className="event-content">
                <span className="event-category">{event.category}</span>
                <h3>{event.title}</h3>
                <p className="event-desc">{event.description.substring(0, 100)}...</p>
                <div className="event-details">
                    <span>📅 {formatDate(event.date)}</span>
                    <span>📍 {event.location}</span>
                    <span className={spotsLeft > 0 ? 'spots-available' : 'spots-full'}>
                        {spotsLeft > 0 ? `${spotsLeft} spots left` : 'Event Full'}
                    </span>
                </div>
            </div>
        </div>
    );
};
export default EventCard;