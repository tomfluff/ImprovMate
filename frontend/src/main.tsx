import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { NotFoundTitle } from "./components/NotFoundTitle/NotFoundTitle.tsx";
import "./index.css";

// Import styles of packages that you've installed.
// All packages except `@mantine/hooks` require styles imports
import "@mantine/core/styles.css";
import { createTheme, MantineProvider } from "@mantine/core";

const theme = createTheme({
  primaryColor: "violet",
});

// Import `createBrowserRouter` and `RouterProvider` from `react-router-dom`
import { createBrowserRouter, RouterProvider } from "react-router-dom";

const router = createBrowserRouter([
  {
    path: "/ImprovMate/",
    element: <App />,
    errorElement: <NotFoundTitle />,
  },
]);

// Import `QueryClientProvider` and `QueryClient` from `@tanstack/react-query`
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <ReactQueryDevtools />
      </QueryClientProvider>
    </MantineProvider>
  </React.StrictMode>
);
