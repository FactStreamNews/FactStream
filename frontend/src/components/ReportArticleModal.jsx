import React, { useState } from 'react';
import Modal from 'react-modal';

const ReportArticleModal = ({ isReportModalOpen, setIsReportModalOpen, handleReport }) => {
  const [reportReason, setReportReason] = useState('');
  const [otherReason, setOtherReason] = useState('');

  const handleReportSubmit = (e) => {
    e.preventDefault();
    const reason = reportReason === 'Other' ? otherReason : reportReason;
    handleReport(e, reason);
    setIsReportModalOpen(false);
  };

  return (
    <Modal
    isOpen={isReportModalOpen}
    onRequestClose={() => setIsReportModalOpen(false)}
    contentLabel="Report Article"
  >
    <h2>Report Article</h2>
    <form onSubmit={(e) => handleReport(e, reportReason === 'Other' ? otherReason : reportReason)}>
      <label>
        Reason for report:
        <select value={reportReason} onChange={(e) => setReportReason(e.target.value)} required>
          <option value="">Select a reason</option>
          <option value="Inappropriate content">Inappropriate content</option>
          <option value="Spam">Spam</option>
          <option value="False information">False information</option>
          <option value="Other">Other</option>
        </select>
      </label>
      {reportReason === 'Other' && (
        <textarea
          value={otherReason}
          onChange={(e) => setOtherReason(e.target.value)}
          placeholder="Please provide a reason"
          rows={4}
          cols={50}
          required
        />
      )}
      <button type="submit">Submit Report</button>
      <button type="button" onClick={() => setIsReportModalOpen(false)}>Cancel</button>
    </form>
  </Modal>
  
  );
};

export default ReportArticleModal;
