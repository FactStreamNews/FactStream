import express from 'express';
const router = express.Router();
import {db} from '../config/firebase.js';
// import {ref, set, get, child} from 'firebase/database';



// get all users
router.get('/', (req, res) => {
    res.json({mssg: "GET all users"})
})


// create new user (POST)
router.post('/', (req, res) => {
    res.json({mssg: "POST a new user"})
})



// get a specific user
router.get('/:id', (req, res) => {
    res.json({mssg: "GET a single user"})
})

// delete a single user
router.delete('/:id', (req, res) => {
    res.json({mssg: "DELETE a user"})
})

// updates a single user
router.patch('/:id', (req, res) => {
    res.json({mssg: "Patch a user"})
})


// export the router
export default router;