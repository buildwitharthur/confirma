import { app } from './app.js';
import { env } from '../env/index.js';

app.listen(env.PORT, () => {
	console.log(`Confirma API listening on port ${env.PORT}`);
});
