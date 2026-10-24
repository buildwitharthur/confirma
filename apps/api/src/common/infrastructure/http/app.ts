import cors from 'cors';
import express from 'express';
import { routes } from './routes.js';
import { errorHandler } from './middlewares/errorHandler.js';

const app = express();

app.use(express.json());

app.use(
	cors({
		credentials: true,
	}),
);

app.use(routes);
app.use(errorHandler);

export { app };
