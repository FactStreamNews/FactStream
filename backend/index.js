//index.js

import express, { json } from 'express';
import * as dotenv from 'dotenv';
import cors from 'cors';
import {db} from './config/firebase.js';
import articleRoutes from './routes/article-routes.js';
import userRoutes from './routes/user-routes.js'
import './config/scheduler.js';


dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

// middleware
app.use((req, res, next) => {
  console.log(req.path, req.method);
  next();
});

app.use(cors());
app.use(json());

// app.use(userRoutes);
app.use('/api/user-routes', userRoutes)

app.use(articleRoutes);



// app.use((error, req, res, next) => {
//   console.error('Error encountered:', error);
//   res.status(500).json({ error: error.message });
// });


app.listen(port, () => {
  console.log('listening on port: ', port)
}
);