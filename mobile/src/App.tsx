import { useEffect, useState } from "react";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthScreen } from "./screens/AuthScreen";
import { ChatScreen } from "./screens/ChatScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { setToken } from "./services/authStore";
import { consumeWebCallbackToken } from "./services/googleAuth";
import { isLoggedIn, setLoggedIn, subscribe } from "./services/session";
import { getToken } from "./services/authStore";
import { useAppFonts } from "./theme/useAppFonts";
import { useApplyWebTheme } from "./theme/useTheme";

// Root component. Exported so front/pwa can import it directly and render
// it through react-native-web — this is the actual component-sharing
// mechanism between the two frontends.
//
// `bubble`: la app se abrio dentro de una burbuja de chat de Android
// (plugins/bubbles/BubbleActivity); ahi solo se muestra el chat.
export default function App({ bubble = false }: { bubble?: boolean }) {
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
  const fontsReady = useAppFonts();

  useEffect(() => {
    if (loggedIn) setLoggedIn(true); // sincroniza el store si habia token guardado
    return subscribe(() => setLoggedInState(isLoggedIn()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sin la fuente se muestra el fondo vacio un instante, no texto que cambia.
  if (!fontsReady) return null;
  // SafeAreaProvider: en Android con navegacion de 3 botones o de gestos la app
  // dibuja bajo las barras del sistema; cada pantalla reserva su margen con esto.
  const home = bubble ? (
    <View style={{ flex: 1 }}>
      <ChatScreen active outgoing={null} showReminders />
    </View>
  ) : (
    <HomeScreen />
  );
  return <SafeAreaProvider>{loggedIn ? home : <AuthScreen />}</SafeAreaProvider>;
}
