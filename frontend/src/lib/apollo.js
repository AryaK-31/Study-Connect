import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

// ==========================
// ENV-BASED API URL
// ==========================
const httpLink = createHttpLink({
  uri: import.meta.env.VITE_API_URL,
});

// ==========================
// AUTH LINK (JWT injection)
// ==========================
const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('token');

  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

// ==========================
// APOLLO CLIENT
// ==========================
export const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});