import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';
import './MyReports.css';

const MyReports = () => {
  const [reports, setReports] = useState([]);
  const [user, loading, error] = useAuthState(auth);

  useEffect(() => {
    const fetchReports = async () => {
      if (user) {
        try {
          const reportsRef = collection(db, 'reports');
          const q = query(reportsRef, where('userId', '==', user.uid));
          const querySnapshot = await getDocs(q);
          const reportsList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setReports(reportsList);
        } catch (error) {
          console.error('Error fetching reports:', error);
        }
      }
    };

    fetchReports();
  }, [user]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div className="my-reports">
      <h1>My Reports</h1>
      {reports.length === 0 ? (
        <p>You have not submitted any reports.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Article ID</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Submitted At</th>
            </tr>
          </thead>
          <tbody>
            {reports.map(report => (
              <tr key={report.id}>
                <td>{report.articleId}</td>
                <td>{report.reason}</td>
                <td>{report.status}</td>
                <td>{new Date(report.createdAt.toDate()).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default MyReports;
