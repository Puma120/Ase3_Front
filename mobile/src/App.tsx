import { useEffect, useState } from "react";

import { AuthScreen } from "./screens/AuthScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { setToken } from "./services/authStore";
import { consumeWebCallbackToken } from "./services/googleAuth";
import { isLoggedIn, setLoggedIn, subscribe } from "./services/session";
import { getToken } from "./services/authStore";
import { useApplyWebTheme } from "./theme/useTheme";

// Root component. Exported so front/pwa can import it directly and render
// it through react-native-web — this is the actual component-sharing
// mechanism between the two frontends.
export default function App() {
  // En web, si venimos de regresar del login con Google, el token viaja en
  // el hash de la URL (#token=...) — se recoge una sola vez al montar, antes
  // de decidir login/vs/home. En nativo esto siempre devuelve null (el token
  // ya se guardo directo en AuthScreen al volver del navegador del sistema).
  const [loggedIn, setLoggedInState] = useState(() => {
    const googleToken = consumeWebCallbackToken();
    if (googleToken) setToken(googleToken);
    return isLoggedIn() || !!getToken();
  });

  useApplyWebTheme();

  useEffect(() => {
    if (loggedIn) setLoggedIn(true); // sincroniza el store si habia token guardado
    return subscribe(() => setLoggedInState(isLoggedIn()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return loggedIn ? <HomeScreen /> : <AuthScreen />;
}
