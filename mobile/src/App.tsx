import { useEffect, useState } from "react";

import { AuthScreen } from "./screens/AuthScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { isLoggedIn, setLoggedIn, subscribe } from "./services/session";
import { getToken } from "./services/authStore";

// Root component. Exported so front/pwa can import it directly and render
// it through react-native-web — this is the actual component-sharing
// mechanism between the two frontends.
export default function App() {
  const [loggedIn, setLoggedInState] = useState(() => isLoggedIn() || !!getToken());

  useEffect(() => {
    if (loggedIn) setLoggedIn(true); // sincroniza el store si habia token guardado
    return subscribe(() => setLoggedInState(isLoggedIn()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return loggedIn ? <HomeScreen /> : <AuthScreen />;
}
