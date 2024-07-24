import React, { useState, useEffect } from 'react';
import { collection, addDoc, query, where, getDocs, updateDoc, doc, getDoc } from "firebase/firestore";
import { db, auth } from '../firebase'; // Adjust the path according to your project structure

const Poll = () => {
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']); // Initialize with two options
  const [polls, setPolls] = useState([]);
  const [selectedOption, setSelectedOption] = useState({});
  const [hasVoted, setHasVoted] = useState({});
  const [isAdmin, setIsAdmin] = useState(false);
  const user = auth.currentUser; // Assume you have user authentication set up

  const checkAdminStatus = async () => {
    if (user) {
      const q = query(collection(db, "users"), where("uid", "==", user.uid));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        setIsAdmin(userData.is_admin || false);
      }
    }
  };

  useEffect(() => {
    checkAdminStatus();
  }, [user]);

  const handleAddPoll = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('Please sign in to create a poll.');
      return;
    }
    try {
      const pollsRef = collection(db, 'polls');
      const q = query(collection(db, "users"), where("uid", "==", user?.uid));
      const doc = await getDocs(q);
      const data = doc.docs[0].data();

      await addDoc(pollsRef, {
        userId: user.uid,
        userName: user.displayName,
        question: pollQuestion,
        options: pollOptions.map(option => ({ text: option, votes: 0 })), // Initialize vote count
        createdAt: new Date(),
        isPrivate: data.is_private
      });
      setPollQuestion('');
      setPollOptions(['', '']);
      // Fetch polls again to update the list
      const pollsSnap = await getDocs(pollsRef);
      const pollsList = pollsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPolls(pollsList);
    } catch (error) {
      console.error('Error adding poll: ', error);
    }
  };

  const handleSelectOption = (pollId, optionIndex) => {
    setSelectedOption({ ...selectedOption, [pollId]: optionIndex });
  };

  const handleVote = async (pollId, optionIndex) => {
    if (!user) {
      alert('Please sign in to vote.');
      return;
    }

    if (hasVoted[pollId]) {
      alert('You cannot vote more than once in a poll.');
      return;
    }

    try {
      const pollRef = doc(db, 'polls', pollId);
      const pollDoc = await getDoc(pollRef);
      if (pollDoc.exists()) {
        const pollData = pollDoc.data();
        const updatedOptions = pollData.options.map((option, idx) => {
          if (idx === optionIndex) {
            return { ...option, votes: option.votes + 1 };
          }
          return option;
        });

        await updateDoc(pollRef, { options: updatedOptions });

        setHasVoted({ ...hasVoted, [pollId]: true });

        // Fetch updated polls
        const pollsSnap = await getDocs(collection(db, 'polls'));
        const pollsList = pollsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPolls(pollsList);
      }
    } catch (error) {
      console.error('Error voting: ', error);
    }
  };

  const handleOptionChange = (index, value) => {
    const updatedOptions = [...pollOptions];
    updatedOptions[index] = value;
    setPollOptions(updatedOptions);
  };

  const addOptionField = () => {
    setPollOptions([...pollOptions, '']);
  };

  return (
    <div>
      {isAdmin && (
        <>
          <h2>Create a New Poll</h2>
          <form onSubmit={handleAddPoll}>
            <input 
              type="text" 
              placeholder="Poll Question" 
              value={pollQuestion} 
              onChange={(e) => setPollQuestion(e.target.value)} 
              required 
            />
            {pollOptions.map((option, index) => (
              <input 
                key={index}
                type="text" 
                placeholder={`Option ${index + 1}`} 
                value={option} 
                onChange={(e) => handleOptionChange(index, e.target.value)} 
                required 
              />
            ))}
            <button type="button" onClick={addOptionField}>Add Option</button>
            <button type="submit">Create Poll</button>
          </form>
        </>
      )}
      <h3>Existing Polls</h3>
      {polls.length === 0 ? (
        <p>Existing Polls: None</p>
      ) : (
        <ul>
          {polls.map(poll => (
            <li key={poll.id}>
              <h4>{poll.question}</h4>
              <form onSubmit={(e) => { e.preventDefault(); handleVote(poll.id, selectedOption[poll.id]); }}>
                <ul>
                  {poll.options.map((option, idx) => (
                    <li key={idx}>
                      <input 
                        type="radio" 
                        name={`poll-${poll.id}`} 
                        value={idx} 
                        checked={selectedOption[poll.id] === idx}
                        onChange={() => handleSelectOption(poll.id, idx)} 
                      />
                      {option.text} - {option.votes} votes
                    </li>
                  ))}
                </ul>
                <button type="submit">Vote</button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Poll;
