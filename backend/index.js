import express, {json} from 'express';
import * as dotenv from 'dotenv'
import cors from 'cors';

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;
app.use(cors());
app.use(json());

app.get('/', (req, res) => res.send('Hello World2!'));

app.listen(port, () => console.log('Express app listening on ${port}'))