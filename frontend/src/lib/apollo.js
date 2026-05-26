import { ApolloClient, InMemoryCache, createHttpLink, ApolloLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';

// ==========================
// ENV-BASED API URL
// ==========================
const httpLink = createHttpLink({
  uri: import.meta.env.VITE_API_URL || 'http://localhost:5000/graphql',
});

// ==========================
// ERROR LINK (Global error handling)
// ==========================
const errorLink = onError(({ graphQLErrors, networkError, operation }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) => {
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
      );
      // Dispatch custom event that can be caught by error provider
      window.dispatchEvent(
        new CustomEvent('apollo_error', {
          detail: { message, type: 'graphql' },
        })
      );
    });
  }

  if (networkError) {
    console.error(`[Network error]:`, networkError);
    if (networkError.statusCode === 401) {
      // Handle unauthorized - user will be redirected by the app logic
      window.dispatchEvent(
        new CustomEvent('apollo_error', {
          detail: { message: 'Session expired. Please log in again.', type: 'network' },
        })
      );
    } else if (networkError.statusCode >= 500) {
      window.dispatchEvent(
        new CustomEvent('apollo_error', {
          detail: {
            message: 'Server error. Please try again later or contact support.',
            type: 'server',
          },
        })
      );
    } else if (!navigator.onLine) {
      window.dispatchEvent(
        new CustomEvent('apollo_error', {
          detail: {
            message: 'No internet connection. Please check your network.',
            type: 'offline',
          },
        })
      );
    } else {
      window.dispatchEvent(
        new CustomEvent('apollo_error', {
          detail: {
            message: 'Failed to connect to server. Please try again.',
            type: 'network',
          },
        })
      );
    }
  }
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
  link: errorLink.concat(authLink.concat(httpLink)),
  cache: new InMemoryCache(),
});