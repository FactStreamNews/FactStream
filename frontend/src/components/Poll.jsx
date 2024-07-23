import React, { useState, useEffect } from 'react';

const Poll = ({ isAdmin }) => {
  const [poll, setPoll] = useState({ question: '', options: ['', '', '', '', ''] });
  const [isCreating, setIsCreating] = useState(false);
  const [isPollActive, setIsPollActive] = useState(false);
  const [responses, setResponses] = useState({});
  const [timer, setTimer] = useState(180); // 3 minutes in seconds
  const [selectedOption, setSelectedOption] = useState('');
  const [hasVoted, setHasVoted] = useState(false);

  const handleOptionChange = (index, value) => {
    const newOptions = [...poll.options];
    newOptions[index] = value;
    setPoll({ ...poll, options: newOptions });
  };

  const handleCreatePoll = () => {
    setIsCreating(true);
  };

  const handleFinishCreatingPoll = () => {
    setIsCreating(false);
    setIsPollActive(true);
    setTimer(180);
  };

  const handleVote = () => {
    if (selectedOption && !hasVoted) {
      setResponses({ ...responses, [selectedOption]: (responses[selectedOption] || 0) + 1 });
      setSelectedOption('');
      setHasVoted(true);
    }
  };

  useEffect(() => {
    let countdown;
    if (isPollActive && timer > 0) {
      countdown = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setIsPollActive(false);
    }
    return () => clearInterval(countdown);
  }, [isPollActive, timer]);

  return (
    <div>
      {isAdmin && !isCreating && !isPollActive && (
        <button onClick={handleCreatePoll}>Create a poll</button>
      )}
      {isCreating && (
        <div>
          <input
            type="text"
            placeholder="Enter your question"
            value={poll.question}
            onChange={(e) => setPoll({ ...poll, question: e.target.value })}
          />
          {poll.options.map((option, index) => (
            <input
              key={index}
              type="text"
              placeholder={`Option ${index + 1}`}
              value={option}
              onChange={(e) => handleOptionChange(index, e.target.value)}
            />
          ))}
          <button onClick={handleFinishCreatingPoll}>Finish creating poll</button>
        </div>
      )}
      {isPollActive && (
        <div>
          <h3>{poll.question}</h3>
          {poll.options.map((option, index) => (
            option && (
              <div key={index}>
                <input
                  type="radio"
                  name="poll"
                  value={option}
                  disabled={hasVoted}
                  checked={selectedOption === option}
                  onChange={() => setSelectedOption(option)}
                />
                {option}
              </div>
            )
          ))}
          <button onClick={handleVote} disabled={hasVoted}>Submit vote</button>
          <p>Time remaining: {timer} seconds</p>
        </div>
      )}
      {!isPollActive && !isCreating && (
        <div>
          <h3>{poll.question}</h3>
          {poll.options.map((option, index) => (
            option && (
              <div key={index}>
                {option}: {responses[option] || 0} votes
              </div>
            )
          ))}
        </div>
      )}
    </div>
  );
};

export default Poll;