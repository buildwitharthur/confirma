import cors from 'cors';
import express from 'express';
import { routes } from './routes.js';

const app = express();

app.use(express.json());

app.use(
	cors({
		credentials: true,
	}),
);

app.use(routes);

export { app };
