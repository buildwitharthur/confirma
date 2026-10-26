import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { useState } from 'react';
import { routeTree } from '@/routeTree.gen';

export function AppProviders() {
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						staleTime: 30_000,
						gcTime: 5 * 60_000,
						retry: 1,
						refetchOnWindowFocus: true,
					},
					mutations: {
						retry: false,
					},
				},
			}),
	);
	const [router] = useState(() =>
		createRouter({
			routeTree,
			context: { queryClient },
			defaultPreload: 'intent',
			scrollRestoration: true,
		}),
	);

	return (
		<QueryClientProvider client={queryClient}>
			<RouterProvider router={router} />
		</QueryClientProvider>
	);
}
