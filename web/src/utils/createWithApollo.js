import React from "react";
import App from "next/app";
import Head from "next/head";
import { ApolloProvider } from "@apollo/client";

// On the client, we store the Apollo Client in the following variable.
// This prevents the client from reinitializing between page transitions.
let globalApolloClient = null;

/**
 * Installs the Apollo Client on NextPageContext
 * or NextAppContext. Useful if you want to use apolloClient
 * inside getStaticProps, getStaticPaths or getServerSideProps
 * @param {NextPageContext | NextAppContext} ctx
 */
export const initOnContext = (ac, ctx) => {
  const inAppContext = Boolean(ctx.ctx);

  // We consider installing `withApollo({ ssr: true })` on global App level
  // as antipattern since it disables project wide Automatic Static Optimization.
  if (process.env.NODE_ENV === "development") {
    if (inAppContext) {
      console.warn(
        "Warning: You have opted-out of Automatic Static Optimization due to `withApollo` in `pages/_app`.\n" +
          "Read more: https://err.sh/next.js/opt-out-auto-static-optimization\n"
      );
    }
  }

  // Initialize ApolloClient if not already done
  const apolloClient =
    ctx.apolloClient ||
    initApolloClient(ac, ctx.apolloState || {}, inAppContext ? ctx.ctx : ctx);

  // We send the Apollo Client as a prop to the component to avoid calling initApollo() twice in the server.
  // Otherwise, the component would have to call initApollo() again but this
  // time without the context. Once that happens, the following code will make sure we send
  // the prop as `null` to the browser.
  apolloClient.toJSON = () => null;

  // Add apolloClient to NextPageContext & NextAppContext.
  // This allows us to consume the apolloClient inside our
  // custom `getInitialProps({ apolloClient })`.
  ctx.apolloClient = apolloClient;
  if (inAppContext) {
    ctx.ctx.apolloClient = apolloClient;
  }

  return ctx;
};

/**
 * Always creates a new apollo client on the server
 * Creates or reuses apollo client in the browser.
 * @param  {NormalizedCacheObject} initialState
 * @param  {NextPageContext} ctx
 */
const initApolloClient = (apolloClient, initialState, ctx) => {
  // Make sure to create a new client for every server-side request so that data
  // isn't shared between connections (which would be bad)
  if (typeof window === "undefined") {
    return createApolloClient(apolloClient(ctx), initialState, ctx);
  }

  // Reuse client on the client-side
  if (!globalApolloClient) {
    globalApolloClient = createApolloClient(
      apolloClient(ctx),
      initialState,
      ctx
    );
  }

  return globalApolloClient;
};

/**
 * Creates a withApollo HOC
 * that provides the apolloContext
 * to a next.js Page or AppTree.
 * @param  {Object} withApolloOptions
 * @param  {Boolean} [withApolloOptions.ssr=false]
 * @returns {(PageComponent: ReactNode) => ReactNode}
 */
export const createWithApollo = (ac) => {
  return ({ ssr = false } = {}) => (PageComponent) => {
    const WithApollo = ({ apolloClient, apolloState, ...pageProps }) => {
      let client;
      if (apolloClient) {
        client = apolloClient;
      } else {
        client = initApolloClient(ac, apolloState, undefined);
      }

      return (
        <ApolloProvider client={client}>
          <PageComponent {...pageProps} />
        </ApolloProvider>
      );
    };

    if (ssr || PageComponent.getInitialProps) {
      WithApollo.getInitialProps = async (ctx) => {
        const inAppContext = Boolean(ctx.ctx);
        const { apolloClient } = initOnContext(ac, ctx);

        let pageProps = {};
        if (PageComponent.getInitialProps) {
          pageProps = await PageComponent.getInitialProps(ctx);
        } else if (inAppContext) {
          pageProps = await App.getInitialProps(ctx);
        }

        if (typeof window === "undefined") {
          const { AppTree } = ctx;
          if (ctx.res && ctx.res.finished) {
            return pageProps;
          }

          if (ssr && AppTree) {
            try {
              const { getDataFromTree } = await import("@apollo/client/react/ssr");
              await getDataFromTree(<AppTree {...(inAppContext ? { ...pageProps, apolloClient } : { pageProps: { ...pageProps, apolloClient } })} />);
            } catch (error) {
              console.error("Error while running `getDataFromTree`", error);
            }
          }
        }

        return {
          ...pageProps,
          apolloState: apolloClient.cache.extract(),
          apolloClient: ctx.apolloClient,
        };
      };
    }

    return WithApollo;
  };
};

function createApolloClient(apolloClient, initialState, ctx) {
  // The `ctx` (NextPageContext) will only be present on the server.
  // use it to extract auth headers (ctx.req) or similar.
  apolloClient.ssrMode = Boolean(ctx);
  apolloClient.cache.restore(initialState);

  return apolloClient;
}
