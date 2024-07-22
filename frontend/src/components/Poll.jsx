import React, { useState } from 'react';

const Poll = () => {
  const [showPoll, setShowPoll] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [votes, setVotes] = useState({
    option1: 0,
    option2: 0,
    option3: 0,
    option4: 0,
    option5: 0,
  });
  const [hasVoted, setHasVoted] = useState(false);

  const handleVote = () => {
    if (selectedOption && !hasVoted) {
      setVotes({
        ...votes,
        [selectedOption]: votes[selectedOption] + 1,
      });
      setHasVoted(true);
    }
  };

  const handleTakePoll = () => {
    setShowPoll(true);
  };

  return (
    <div>
      {!showPoll ? (
        <button onClick={handleTakePoll}>Take the Poll</button>
      ) : (
        <div>
          <h2>How many times have you accessed the website?</h2>
          <div>
            <input
              type="radio"
              id="option1"
              name="poll"
              value="option1"
              checked={selectedOption === 'option1'}
              onChange={(e) => setSelectedOption(e.target.value)}
              disabled={hasVoted}
            />
            <label htmlFor="option1">1</label>
          </div>
          <div>
            <input
              type="radio"
              id="option2"
              name="poll"
              value="option2"
              checked={selectedOption === 'option2'}
              onChange={(e) => setSelectedOption(e.target.value)}
              disabled={hasVoted}
            />
            <label htmlFor="option2">2</label>
          </div>
          <div>
            <input
              type="radio"
              id="option3"
              name="poll"
              value="option3"
              checked={selectedOption === 'option3'}
              onChange={(e) => setSelectedOption(e.target.value)}
              disabled={hasVoted}
            />
            <label htmlFor="option3">3</label>
          </div>
          <div>
            <input
              type="radio"
              id="option4"
              name="poll"
              value="option4"
              checked={selectedOption === 'option4'}
              onChange={(e) => setSelectedOption(e.target.value)}
              disabled={hasVoted}
            />
            <label htmlFor="option4">4</label>
          </div>
          <div>
            <input
              type="radio"
              id="option5"
              name="poll"
              value="option5"
              checked={selectedOption === 'option5'}
              onChange={(e) => setSelectedOption(e.target.value)}
              disabled={hasVoted}
            />
            <label htmlFor="option5">5</label>
          </div>
          <div style={{ marginTop: '20px' }}>
            <button onClick={handleVote} disabled={hasVoted}>Vote</button>
          </div>
          <h3>Results:</h3>
          <p>1: {votes.option1}</p>
          <p>2: {votes.option2}</p>
          <p>3: {votes.option3}</p>
          <p>4: {votes.option4}</p>
          <p>5: {votes.option5}</p>
        </div>
      )}
    </div>
  );
};

export default Poll;
