import React, { useState, useEffect } from 'react';
import { collection, addDoc, query, where, getDocs, updateDoc, doc, getDoc, setDoc } from "firebase/firestore";
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

  const fetchPolls = async () => {
    try {
      const pollsRef = collection(db, 'polls');
      const pollsSnap = await getDocs(pollsRef);
      const pollsList = pollsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPolls(pollsList);

      const votedPolls = {};
      for (const poll of pollsList) {
        const voteCheck = await checkIfVoted(poll.id);
        votedPolls[poll.id] = voteCheck;
      }
      setHasVoted(votedPolls);

    } catch (error) {
      console.error('Error fetching polls:', error);
    }
  };

  useEffect(() => {
    fetchPolls();
  }, []);

  const handleAddPoll = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('Please sign in to create a poll.');
      return;
    }
    try {
      const pollsRef = collection(db, 'polls');
      const q = query(collection(db, "users"), where("uid", "==", user?.uid));
      const docSnap = await getDocs(q);
      const data = docSnap.docs[0].data();

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
      fetchPolls(); // Fetch polls again to update the list
    } catch (error) {
      console.error('Error adding poll:', error);
    }
  };

  const checkIfVoted = async (pollId) => {
    if (!user) {
      return false;
    }
    try {
      const voteDocRef = doc(db, 'votes', `${pollId}_${user.uid}`);
      const voteDoc = await getDoc(voteDocRef);
      return voteDoc.exists();
    } catch (error) {
      console.error('Error checking vote status:', error);
      return false;
    }
  };

  const handleVote = async (pollId, optionIndex) => {
    if (!user) {
      alert('Please sign in to vote.');
      return;
    }

    const voteCheck = await checkIfVoted(pollId);
    if (voteCheck) {
      alert('You cannot vote more than once in a poll.');
      return;
    }

    try {
      const pollDocRef = doc(db, 'polls', pollId);
      const pollDoc = await getDoc(pollDocRef);
      if (pollDoc.exists()) {
        const pollData = pollDoc.data();
        const updatedOptions = pollData.options.map((option, index) => {
          if (index === optionIndex) {
            return { ...option, votes: option.votes + 1 };
          }
          return option;
        });

        await updateDoc(pollDocRef, { options: updatedOptions });

        const voteDocRef = doc(db, 'votes', `${pollId}_${user.uid}`);
        await setDoc(voteDocRef, { pollId, userId: user.uid });

        fetchPolls(); // Fetch polls again to update the list
      }
    } catch (error) {
      console.error('Error voting on poll:', error);
    }
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
                onChange={(e) => {
                  const newOptions = [...pollOptions];
                  newOptions[index] = e.target.value;
                  setPollOptions(newOptions);
                }} 
                required 
              />
            ))}
            <button type="button" onClick={() => setPollOptions([...pollOptions, ''])}>Add Option</button>
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
                        onChange={() => setSelectedOption({ ...selectedOption, [poll.id]: idx })} 
                        disabled={hasVoted[poll.id]} // Disable voting if already voted
                      />
                      {option.text} - {option.votes} votes
                    </li>
                  ))}
                </ul>
                <button type="submit" disabled={hasVoted[poll.id]}>Vote</button> {/* Disable vote button if already voted */}
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Poll;

