import ReactDOM from 'react-dom/client';
import { AppProviders } from './common/providers/app-providers';

const rootElement = document.getElementById('app')!;

if (!rootElement.innerHTML) {
	const root = ReactDOM.createRoot(rootElement);
	root.render(<AppProviders />);
}
