import React, { useState, useEffect } from 'react';
import { eventAPI } from '../../services/api';
import EventCard from './EventCard';
import SearchBar from '../layout/Searchbar';

const EventList = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});

  const fetchEvents = async (params = {}) => {
    setLoading(true);
    try {
      const res = await eventAPI.getAll(params);
      setEvents(res.data);
    } catch (err) {
      console.error('Failed to fetch events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents(filters);
  }, [filters]);

  const handleSearch = (params) => {
    setFilters(params);
  };

  if (loading) return <div className="loading">Loading events...</div>;

  return (
    <div className="event-list-container">
      <h1>Upcoming Events</h1>
      <SearchBar onSearch={handleSearch} />
      <div className="event-grid">
        {events.length > 0 ? (
          events.map(event => <EventCard key={event._id} event={event} />)
        ) : (
          <p className="no-events">No events found</p>
        )}
      </div>
    </div>
  );
};

export default EventList;