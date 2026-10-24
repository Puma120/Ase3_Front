// Burbujas de chat tipo Messenger (Android 11+) para los avisos del agente.
//
// El backend manda a los dispositivos con burbujas activadas un mensaje FCM
// solo-datos (sin bloque "notification"), porque Android muestra solo el
// bloque "notification" cuando la app esta en segundo plano y no deja agregarle
// BubbleMetadata. BubbleMessagingService lo recibe, arma la notificacion de
// conversacion con su burbuja y BubbleActivity (React Native, mismo bundle)
// muestra el chat dentro de la burbuja.
const fs = require("fs");
const path = require("path");
const { withAndroidManifest, withAppBuildGradle, withDangerousMod } = require("expo/config-plugins");

const FILES = ["BubbleActivity.kt", "BubbleMessagingService.kt"];
// expo-notifications declara firebase-messaging como `implementation`, asi que
// no esta en el classpath de compilacion de la app y la subclase del servicio
// no compilaria sin esta dependencia (misma version que usa expo-notifications).
const FIREBASE_DEP = 'implementation("com.google.firebase:firebase-messaging:25.0.1")';
const REACT_DEP = 'implementation("com.facebook.react:react-android")';

function withBubbleSources(config) {
  return withDangerousMod(config, [
    "android",
    (c) => {
      const pkg = c.android.package;
      const dir = path.join(c.modRequest.platformProjectRoot, "app/src/main/java", ...pkg.split("."));
      fs.mkdirSync(dir, { recursive: true });
      for (const file of FILES) {
        const source = fs.readFileSync(path.join(__dirname, "bubbles", `${file}.tpl`), "utf8");
        fs.writeFileSync(path.join(dir, file), source.replace(/__PACKAGE__/g, pkg));
      }
      return c;
    },
  ]);
}

function withBubbleManifest(config) {
  return withAndroidManifest(config, (c) => {
    const app = c.modResults.manifest.application[0];
    app.activity = app.activity ?? [];
    app.service = app.service ?? [];

    if (!app.activity.some((a) => a.$["android:name"] === ".BubbleActivity")) {
      app.activity.push({
        $: {
          "android:name": ".BubbleActivity",
          "android:label": "Oportuno",
          "android:theme": "@style/AppTheme",
          "android:exported": "false",
          "android:allowEmbedded": "true",
          "android:resizeableActivity": "true",
          "android:documentLaunchMode": "always",
          "android:configChanges":
            "keyboard|keyboardHidden|orientation|screenSize|screenLayout|uiMode|smallestScreenSize|assetsPaths",
          "android:windowSoftInputMode": "adjustResize",
        },
      });
    }

    // expo-notifications registra su servicio con prioridad -1 justo para que
    // una app pueda poner el suyo por encima. El nuestro lo extiende, asi que
    // todo lo que no es burbuja sigue su camino normal.
    if (!app.service.some((s) => s.$["android:name"] === ".BubbleMessagingService")) {
      app.service.push({
        $: { "android:name": ".BubbleMessagingService", "android:exported": "false" },
        "intent-filter": [
          {
            $: { "android:priority": "1" },
            action: [{ $: { "android:name": "com.google.firebase.MESSAGING_EVENT" } }],
          },
        ],
      });
    }
    return c;
  });
}

function withBubbleGradle(config) {
  return withAppBuildGradle(config, (c) => {
    if (!c.modResults.contents.includes(FIREBASE_DEP)) {
      if (!c.modResults.contents.includes(REACT_DEP)) {
        throw new Error("withBubbles: falta la linea de react-android en app/build.gradle");
      }
      c.modResults.contents = c.modResults.contents.replace(REACT_DEP, `${REACT_DEP}\n    ${FIREBASE_DEP}`);
    }
    return c;
  });
}

module.exports = (config) => withBubbleGradle(withBubbleManifest(withBubbleSources(config)));
