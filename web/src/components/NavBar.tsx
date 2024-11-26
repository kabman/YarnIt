import React from "react";
import { Box, Flex, Button, Heading } from "@chakra-ui/react";
import NextLink from "next/link";
import { useMeQuery, useLogoutMutation } from "../generated/graphql";
import { isServer } from "../utils/isServer";
import { useApolloClient } from "@apollo/client";

interface NavBarProps {}

export const NavBar: React.FC<NavBarProps> = ({}) => {
  const [logout, { loading: logoutFetching }] = useLogoutMutation();
  const apolloClient = useApolloClient();
  const { data, loading } = useMeQuery({
    skip: isServer(),
  });

  let body = null;

  // Only render content if we're not loading and have data
  if (!loading && data?.me) {
    body = (
      <Flex align="center">
        <Box mr={4}>
          <NextLink href="/create-post">
            <Button as="span">create post</Button>
          </NextLink>
        </Box>
        <Box mr={2}>{data.me.username}</Box>
        <Button
          onClick={async () => {
            await logout();
            await apolloClient.resetStore();
          }}
          isLoading={logoutFetching}
          variant="ghost"
        >
          logout
        </Button>
      </Flex>
    );
  } else {
    // Default state (both for loading and not logged in)
    body = (
      <Flex>
        <Box mr={2}>
          <NextLink href="/login">login</NextLink>
        </Box>
        <Box>
          <NextLink href="/register">register</NextLink>
        </Box>
      </Flex>
    );
  }

  return (
    <Flex position="sticky" top={0} zIndex={1} bg="tan" p={4}>
      <Flex flex={1} maxW={800} align="center" m="auto">
        <Box>
          <NextLink href="/">
            <Heading style={{ cursor: 'pointer' }}>YarnIt!</Heading>
          </NextLink>
        </Box>
        <Box ml="auto">{body}</Box>
      </Flex>
    </Flex>
  );
};
