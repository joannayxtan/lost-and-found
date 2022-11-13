import { createNextApiHandler } from '@trpc/server/adapters/next';
import { appRouter } from '../../../server/trpc/router/_app';
import { createContext } from '../../../server/trpc/context';
import env from '../../../env/server.mjs';

export default createNextApiHandler({
	router: appRouter,
	createContext,
	onError:
		env.NODE_ENV === 'development'
			? ({ path, error }) => {
					// eslint-disable-next-line no-console
					console.error(`❌ tRPC failed on ${path}: ${error}`);
			  }
			: undefined
});
