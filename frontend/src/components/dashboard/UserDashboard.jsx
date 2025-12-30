import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { rsvpAPI } from '../../services/api';
import EventCard from '../events/EventCard';

const UserDashboard = () => {
  const [myEvents, setMyEvents] = useState([]);
  const [attending, setAttending] = useState([]);
  const [activeTab, setActiveTab] = useState('created');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [eventsRes, rsvpsRes] = await Promise.all([
        rsvpAPI.getMyEvents(),
        rsvpAPI.getMyRSVPs()
      ]);
      setMyEvents(eventsRes.data);
      setAttending(rsvpsRes.data.map(r => r.event));
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading dashboard...</div>;

  return (
    <div className="dashboard">
      <h1>My Dashboard</h1>
      
      <div className="dashboard-tabs">
        <button 
          className={activeTab === 'created' ? 'active' : ''}
          onClick={() => setActiveTab('created')}
        >
          My Events ({myEvents.length})
        </button>
        <button 
          className={activeTab === 'attending' ? 'active' : ''}
          onClick={() => setActiveTab('attending')}
        >
          Attending ({attending.length})
        </button>
      </div>

      <div className="event-grid">
        {activeTab === 'created' ? (
          myEvents.length > 0 ? (
            myEvents.map(event => <EventCard key={event._id} event={event} />)
          ) : (
            <div className="empty-state">
              <p>You haven't created any events yet</p>
              <button onClick={() => navigate('/create')} className="btn-primary">
                Create Your First Event
              </button>
            </div>
          )
        ) : (
          attending.length > 0 ? (
            attending.map(event => <EventCard key={event._id} event={event} />)
          ) : (
            <div className="empty-state">
              <p>You're not attending any events yet</p>
              <button onClick={() => navigate('/')} className="btn-primary">
                Browse Events
              </button>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default UserDashboard;