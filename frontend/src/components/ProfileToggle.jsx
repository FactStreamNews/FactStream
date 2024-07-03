import React, { useState } from 'react';

function ProfileToggle({ isPublic, togglePrivacy }) {
    return (
        <div>
            <h2>Profile Settings</h2>
            <p>Your profile is {isPublic ? 'public' : 'private'}.</p>
            <button onClick={togglePrivacy}>
                {isPublic ? 'Make Private' : 'Make Public'}
            </button>
        </div>
    );
}

export default ProfileToggle;
