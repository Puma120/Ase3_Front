package __PACKAGE__

import android.annotation.TargetApi
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Person
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.LocusId
import android.content.pm.ShortcutInfo
import android.content.pm.ShortcutManager
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.drawable.Icon
import android.net.Uri
import android.os.Build

import com.google.firebase.messaging.RemoteMessage

import expo.modules.notifications.service.ExpoFirebaseMessagingService

/**
 * Los mensajes con data.bubble == "1" se muestran como notificacion de
 * conversacion con burbuja; los que traen data.focus ("on"/"off") cambian No
 * molestar sin mostrar nada (tareas de enfoque); el resto (avisos normales,
 * token FCM) sigue en expo-notifications.
 */
class BubbleMessagingService : ExpoFirebaseMessagingService() {
  override fun onMessageReceived(remoteMessage: RemoteMessage) {
    val data = remoteMessage.data
    data["focus"]?.let {
      FocusController.apply(this, it == "on")
      return
    }
    if (data["bubble"] == "1" && Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      BubbleNotifier.show(this, data["title"].orEmpty(), data["body"].orEmpty(), data["sound"] == "1")
      return
    }
    super.onMessageReceived(remoteMessage)
  }
}

@TargetApi(Build.VERSION_CODES.R)
object BubbleNotifier {
  private const val CHANNEL_QUIET = "burbuja_silencio"
  private const val CHANNEL_SOUND = "burbuja_sonido"
  private const val SHORTCUT_ID = "oportuno_chat"
  // Un solo id: cada aviso actualiza la misma burbuja en vez de abrir otra.
  private const val NOTIFICATION_ID = 4101
  private const val MAX_HISTORY = 4

  fun show(context: Context, title: String, body: String, sound: Boolean) {
    val manager = context.getSystemService(NotificationManager::class.java)
    val channelId = ensureChannel(manager, sound)
    val icon = launcherIcon(context)
    val person = Person.Builder()
      .setName("Oportuno")
      .setKey(SHORTCUT_ID)
      .setBot(true)
      .setImportant(true)
      .setIcon(icon)
      .build()
    publishShortcut(context, person, icon)

    val style = Notification.MessagingStyle(person)
    previousMessages(manager).forEach { style.addMessage(it) }
    val text = if (title.isBlank()) body else if (body.isBlank()) title else "$title\n$body"
    style.addMessage(Notification.MessagingStyle.Message(text, System.currentTimeMillis(), person))

    val bubbleIntent = PendingIntent.getActivity(
      context,
      1,
      Intent(context, BubbleActivity::class.java)
        .setAction(Intent.ACTION_VIEW)
        .setData(Uri.parse("ase3agentetdah://bubble")),
      PendingIntent.FLAG_UPDATE_CURRENT or flagMutable()
    )
    val bubble = Notification.BubbleMetadata.Builder(bubbleIntent, icon)
      .setDesiredHeight(640)
      .setAutoExpandBubble(false)
      .setSuppressNotification(false)
      .build()

    val builder = Notification.Builder(context, channelId)
      .setSmallIcon(R.drawable.notification_icon)
      .setCategory(Notification.CATEGORY_MESSAGE)
      .setStyle(style)
      .setShortcutId(SHORTCUT_ID)
      .setLocusId(LocusId(SHORTCUT_ID))
      .setBubbleMetadata(bubble)
      .setAutoCancel(true)
      .setWhen(System.currentTimeMillis())
    context.packageManager.getLaunchIntentForPackage(context.packageName)?.let {
      builder.setContentIntent(
        PendingIntent.getActivity(context, 0, it, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
      )
    }
    manager.notify(NOTIFICATION_ID, builder.build())
  }

  private fun flagMutable(): Int =
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) PendingIntent.FLAG_MUTABLE else 0

  // Canales propios (no los de JS) para no depender de que la app se haya
  // abierto: ambos permiten burbujas. "Sin sonido" sigue siendo prioridad alta
  // para que Android la muestre como burbuja, pero no suena ni vibra.
  private fun ensureChannel(manager: NotificationManager, sound: Boolean): String {
    val id = if (sound) CHANNEL_SOUND else CHANNEL_QUIET
    if (manager.getNotificationChannel(id) == null) {
      val channel = NotificationChannel(
        id,
        if (sound) "Burbuja con sonido" else "Burbuja sin sonido",
        NotificationManager.IMPORTANCE_HIGH
      )
      if (sound) {
        channel.enableVibration(true)
      } else {
        channel.setSound(null, null)
        channel.enableVibration(false)
      }
      channel.setAllowBubbles(true)
      manager.createNotificationChannel(channel)
    }
    return id
  }

  // Android 11 exige un atajo de conversacion de larga vida para abrir burbuja.
  private fun publishShortcut(context: Context, person: Person, icon: Icon) {
    val intent = Intent(context, BubbleActivity::class.java).setAction(Intent.ACTION_VIEW)
    val shortcut = ShortcutInfo.Builder(context, SHORTCUT_ID)
      .setLongLived(true)
      .setShortLabel("Oportuno")
      .setIntent(intent)
      .setPerson(person)
      .setIcon(icon)
      .setLocusId(LocusId(SHORTCUT_ID))
      .setCategories(setOf("android.shortcut.conversation"))
      .build()
    context.getSystemService(ShortcutManager::class.java).pushDynamicShortcut(shortcut)
  }

  // Conserva los ultimos avisos de la burbuja leyendolos de la notificacion
  // que sigue activa.
  @Suppress("DEPRECATION")
  private fun previousMessages(manager: NotificationManager): List<Notification.MessagingStyle.Message> {
    val extras = manager.activeNotifications.firstOrNull { it.id == NOTIFICATION_ID }?.notification?.extras
    val raw = extras?.getParcelableArray(Notification.EXTRA_MESSAGES) ?: return emptyList()
    return Notification.MessagingStyle.Message.getMessagesFromBundleArray(raw).takeLast(MAX_HISTORY)
  }

  // Icono de la app dibujado como bitmap adaptable (las burbujas lo exigen).
  private fun launcherIcon(context: Context): Icon {
    val drawable = context.packageManager.getApplicationIcon(context.packageName)
    val size = (108 * context.resources.displayMetrics.density).toInt()
    val bitmap = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888)
    drawable.setBounds(0, 0, size, size)
    drawable.draw(Canvas(bitmap))
    return Icon.createWithAdaptiveBitmap(bitmap)
  }
}

// No molestar automatico. Solo apaga lo que el mismo prendio: si el usuario ya
// tenia No molestar activo por su cuenta, no lo toca ni al empezar ni al terminar.
// Sin el acceso a No molestar concedido en Ajustes del sistema no hace nada.
object FocusController {
  private const val PREFS = "oportuno_focus"
  private const val KEY_ACTIVE = "we_enabled"

  fun apply(context: Context, enable: Boolean) {
    val manager = context.getSystemService(NotificationManager::class.java)
    if (!manager.isNotificationPolicyAccessGranted) return
    val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    if (enable) {
      if (manager.currentInterruptionFilter != NotificationManager.INTERRUPTION_FILTER_ALL) return
      manager.setInterruptionFilter(NotificationManager.INTERRUPTION_FILTER_PRIORITY)
      prefs.edit().putBoolean(KEY_ACTIVE, true).apply()
    } else if (prefs.getBoolean(KEY_ACTIVE, false)) {
      manager.setInterruptionFilter(NotificationManager.INTERRUPTION_FILTER_ALL)
      prefs.edit().putBoolean(KEY_ACTIVE, false).apply()
    }
  }
}
