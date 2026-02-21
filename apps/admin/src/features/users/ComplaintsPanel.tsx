import { useEffect, useState } from 'react';
import { adminApi } from '../../shared/api';
import type { Complaint } from '../../shared/types';

export function ComplaintsPanel() {
  const [items, setItems] = useState<Complaint[]>([]);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const data = await adminApi.listComplaints();
      setItems(data.items);
      setError('');
    } catch (err) {
      setError((err as Error).message);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const updateStatus = async (complaintId: string, status: 'pending' | 'in_progress' | 'resolved') => {
    await adminApi.updateComplaint(complaintId, { status });
    await load();
  };

  return (
    <section className="panel">
      <h3>Complaint Dashboard</h3>
      {error ? <p className="error">{error}</p> : null}
      <div className="table">
        <div className="tr head">
          <span>Title</span>
          <span>Category</span>
          <span>Status</span>
          <span>Area</span>
          <span>Actions</span>
        </div>
        {items.map((complaint) => (
          <div className="tr" key={complaint._id}>
            <span>{complaint.title}</span>
            <span>{complaint.category}</span>
            <span>{complaint.status}</span>
            <span>{complaint.area}</span>
            <span className="actions">
              <button onClick={() => void updateStatus(complaint._id, 'in_progress')}>In Progress</button>
              <button onClick={() => void updateStatus(complaint._id, 'resolved')}>Resolve</button>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

